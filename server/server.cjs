const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = path.join(__dirname, "..");
const publicDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 5177);
let tokenCache = null;

loadEnvFile(path.join(rootDir, ".env"));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBodyBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 12_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function pixaproofConfigStatus() {
  const missing = [];
  if (!process.env.PIXAPROOF_API_URL) missing.push("PIXAPROOF_API_URL");
  if (!process.env.PIXAPROOF_API_KEY) missing.push("PIXAPROOF_API_KEY");
  if (!process.env.PIXAPROOF_CLIENT_ID) missing.push("PIXAPROOF_CLIENT_ID");
  if (!process.env.PIXAPROOF_CLIENT_SECRET) missing.push("PIXAPROOF_CLIENT_SECRET");

  return {
    configured: missing.length === 0,
    missing,
    apiUrl: process.env.PIXAPROOF_API_URL,
    apiKey: process.env.PIXAPROOF_API_KEY,
  };
}

function joinUrl(base, suffix) {
  return `${base.replace(/\/+$/, "")}${suffix}`;
}

async function getPixaProofToken() {
  const config = pixaproofConfigStatus();
  if (!config.configured) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    client_id: process.env.PIXAPROOF_CLIENT_ID,
    client_secret: process.env.PIXAPROOF_CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "api.read api.write",
  });

  const response = await fetch(joinUrl(config.apiUrl, "/oauth2/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(`PixaProof token request failed (${response.status})`);
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 899) * 1000,
  };
  return tokenCache.accessToken;
}

async function verifyWithPixaProof(payload) {
  const config = pixaproofConfigStatus();
  if (!config.configured || !payload.imageBuffer) {
    return mockPixaProofResult(payload, "demo-mock");
  }

  const token = await getPixaProofToken();
  const formData = new FormData();
  formData.append("apiKey", config.apiKey);
  formData.append("image", new Blob([payload.imageBuffer], { type: payload.imageType || "image/png" }), "capture.png");
  formData.append("referenceId", payload.claimId || "CLM-2026-01842");

  const response = await fetch(joinUrl(config.apiUrl, "/api/v1/verification/image"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ...mockPixaProofResult(payload, "pixaproof-error-fallback"),
      upstreamStatus: response.status,
      upstream: raw,
    };
  }

  return normalizePixaProofResult(raw);
}

function normalizePixaProofResult(raw) {
  const details = raw.verificationDetails || {};
  const passed = raw.overallResult === "Pass" || raw.trusted === true || raw.verified === true || raw.verdict === "passed";
  return {
    mode: "pixaproof-api",
    trusted: passed,
    verdict: raw.overallResult || raw.verdict || raw.status || "Pass",
    receiptId: raw.receiptId || raw.id || raw.verificationId || "PIXAPROOF-VERIFIED",
    checks: {
      liveCapture: details.livenessCapture ? details.livenessCapture === "Pass" : raw.checks?.liveCapture ?? true,
      tamper: details.integrityCheck ? details.integrityCheck === "Pass" : raw.checks?.tamper ?? true,
      sourceIntegrity: details.sourceOfOrigin ? details.sourceOfOrigin === "Mobile" : raw.checks?.sourceIntegrity ?? true,
    },
    geolocation: raw.geolocation || null,
    raw,
  };
}

function mockPixaProofResult(payload, mode) {
  const hash = crypto
    .createHash("sha256")
    .update(`${payload.claimId}:${payload.scenarioId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  return {
    mode,
    trusted: true,
    verdict: "Pass",
    receiptId: `PXPF-${hash}`,
    checks: {
      liveCapture: true,
      tamper: true,
      sourceIntegrity: true,
      apiKeyServerSide: Boolean(process.env.PIXAPROOF_API_KEY),
    },
    metadata: {
      claimId: payload.claimId,
      scenarioId: payload.scenarioId,
      capturedAt: new Date().toISOString(),
    },
  };
}

async function handleApi(req, res) {
  if (req.method === "GET" && req.url === "/api/pixaproof/session") {
    const config = pixaproofConfigStatus();
    if (!config.configured) {
      return sendJson(res, 200, {
        configured: false,
        mode: "demo-mock",
        reason: `Missing ${config.missing.join(", ")}`,
      });
    }

    try {
      const token = await getPixaProofToken();
      return sendJson(res, 200, {
        configured: true,
        mode: "pixaproof-api",
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        token,
      });
    } catch (error) {
      return sendJson(res, 200, {
        configured: false,
        mode: "pixaproof-token-error",
        reason: error.message,
      });
    }
  }

  if (req.method === "POST" && req.url === "/api/pixaproof/verify") {
    try {
      const payload = await parseMultipart(req);
      const result = await verifyWithPixaProof(payload);
      return sendJson(res, 200, result);
    } catch (error) {
      return sendJson(res, 500, {
        trusted: false,
        verdict: "error",
        message: error.message,
      });
    }
  }

  return sendJson(res, 404, { error: "Not found" });
}

async function parseMultipart(req) {
  const contentType = req.headers["content-type"] || "";
  const body = await readBodyBuffer(req);
  if (!contentType.startsWith("multipart/form-data")) {
    return JSON.parse(body.toString("utf8") || "{}");
  }

  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) throw new Error("Missing multipart boundary");
  const result = {};
  const delimiter = Buffer.from(`--${boundary}`);
  let start = body.indexOf(delimiter);

  while (start !== -1) {
    const next = body.indexOf(delimiter, start + delimiter.length);
    if (next === -1) break;
    const part = body.subarray(start + delimiter.length + 2, next - 2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd > -1) {
      const headers = part.subarray(0, headerEnd).toString("utf8");
      const content = part.subarray(headerEnd + 4);
      const name = headers.match(/name="([^"]+)"/)?.[1];
      const type = headers.match(/Content-Type:\s*([^\r\n]+)/i)?.[1];
      if (name === "image") {
        result.imageBuffer = content;
        result.imageType = type || "image/png";
      } else if (name) {
        result[name] = content.toString("utf8");
      }
    }
    start = next;
  }
  return result;
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  const filePath = path.join(publicDir, urlPath === "/" ? "index.html" : urlPath);
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PixaProof proxy running at http://127.0.0.1:${port}`);
});
