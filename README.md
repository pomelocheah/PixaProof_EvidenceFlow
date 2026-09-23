# PixaProof EvidenceFlow

Interactive React demo for an insurance claim workflow:

1. EvidenceFlow detects an evidence gap.
2. The user clicks `START GUIDED CAPTURE`.
3. Guided Capture connects to the PixaProof WebSDK.
4. Captured evidence is sent through a local server proxy for verification.

## Setup

Install dependencies:

```bash
pnpm install
```

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Fill in the PixaProof credentials:

```bash
PIXAPROOF_API_URL=
PIXAPROOF_API_KEY=
PIXAPROOF_CLIENT_ID=
PIXAPROOF_CLIENT_SECRET=
```

The `.env` file is intentionally ignored by Git because it contains secrets.

## Run Locally

Start the PixaProof proxy in one terminal:

```bash
pnpm server
```

Start the Vite UI in another terminal:

```bash
pnpm dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173/
```

If credentials are missing, the app still allows `USE DEMO CAPTURE` so the teacher can see the full EvidenceFlow workflow.

## Build

```bash
pnpm build
```
