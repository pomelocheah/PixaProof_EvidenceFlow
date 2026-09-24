import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Eye,
  Link2,
  Loader2,
  Search,
  Send,
  TrendingUp,
} from "lucide-react";

const CONDITION_ORDER = ["low", "medium", "high", "veryhigh"];

const CONDITIONS = {
  low: {
    id: "low",
    selectorLabel: "24 Low",
    riskLabel: "LOW RISK",
    score: 24,
    tone: "green",
    toneColor: "#319957",
    toneStrong: "#23824A",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
    glow: "rgba(49,153,87,0.55)",
    gapBadge: "Evidence Sufficient",
    gapTitle: "Required evidence is complete for this claim.",
    gapCopy:
      "EvidenceFlow found no critical missing views. The claim can move forward through the PixaProof verification layer.",
    wrongCopy: "No material evidence gap detected.",
    captureCopy: "Auto process after trusted evidence checks.",
    diagramLabel: "Evidence sufficient",
    riskCopy: "Evidence is sufficient. Claim can proceed with minimal verification.",
    decision: {
      policy: "Low Risk -> auto process",
      gap: "No critical gap",
      action: "Auto process",
    },
    actionTitle: "Ready for Auto Process",
    actionButton: "PROCESS CLAIM",
    outcomeTitle: "Claim Ready for Processing",
    outcomeCopy:
      "EvidenceFlow found enough trusted evidence for this low-risk claim to continue without extra capture.",
  },
  medium: {
    id: "medium",
    selectorLabel: "58 Medium",
    riskLabel: "MEDIUM RISK",
    score: 58,
    tone: "amber",
    toneColor: "#E29A2E",
    toneStrong: "#D88700",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    glow: "rgba(226,154,46,0.55)",
    gapBadge: "Evidence Gap Detected",
    gapTitle: "Rear section of vehicle is not sufficiently visible.",
    gapCopy:
      "The submitted evidence includes front, left and right views. EvidenceFlow found that the rear view is missing for a rear-end collision claim.",
    wrongCopy: "Reported damage area is not visible enough to verify.",
    captureCopy: "Full rear view of the vehicle, centered in frame.",
    diagramLabel: "Missing rear view",
    riskCopy: "Targeted evidence is required before the claim can proceed.",
    decision: {
      policy: "Medium Risk -> targeted evidence task",
      gap: "Rear section not visible",
      action: "Capture full rear view",
    },
    actionTitle: "Send to Guided Capture",
    actionButton: "START GUIDED CAPTURE",
    outcomeTitle: "Trusted Capture Required",
    outcomeCopy:
      "EvidenceFlow will collect the exact missing rear view through the PixaProof trusted capture flow.",
  },
  high: {
    id: "high",
    selectorLabel: "76 High",
    riskLabel: "HIGH RISK",
    score: 76,
    tone: "red",
    toneColor: "#C94343",
    toneStrong: "#B73535",
    badgeClass: "bg-red-50 text-red-700 border-red-100",
    glow: "rgba(201,67,67,0.5)",
    gapBadge: "Review Gap Detected",
    gapTitle: "Damage evidence and claim pattern need adjuster review.",
    gapCopy:
      "EvidenceFlow found enough concern to avoid automated processing. The case should move to a human adjuster with highlighted evidence gaps.",
    wrongCopy: "Evidence pattern is inconsistent with a routine claim path.",
    captureCopy: "Manual review with requested supporting evidence.",
    diagramLabel: "Manual review gap",
    riskCopy: "Evidence issues require manual claims review before a decision.",
    decision: {
      policy: "High Risk -> manual claims review",
      gap: "Evidence inconsistency",
      action: "Send to manual review",
    },
    actionTitle: "Route to Manual Review",
    actionButton: "SEND TO REVIEW",
    outcomeTitle: "Manual Review Queue",
    outcomeCopy:
      "The case is prepared for an adjuster with risk context, evidence signals, and the highlighted inconsistency.",
  },
  veryhigh: {
    id: "veryhigh",
    selectorLabel: "91 Very High",
    riskLabel: "VERY HIGH RISK",
    score: 91,
    tone: "darkred",
    toneColor: "#A52B2B",
    toneStrong: "#8E2020",
    badgeClass: "bg-red-50 text-red-800 border-red-100",
    glow: "rgba(165,43,43,0.55)",
    gapBadge: "Investigation Triggered",
    gapTitle: "Multiple evidence signals exceed investigation threshold.",
    gapCopy:
      "EvidenceFlow identifies a very high-risk claim pattern. This path should remain subject to human investigation and governance controls.",
    wrongCopy: "Evidence relationships indicate a suspicious claim pattern.",
    captureCopy: "Fraud investigation with audit trail.",
    diagramLabel: "Investigation threshold",
    riskCopy: "Claim requires fraud investigation rather than normal evidence capture.",
    decision: {
      policy: "Very High Risk -> fraud investigation",
      gap: "Suspicious evidence pattern",
      action: "Open investigation",
    },
    actionTitle: "Escalate for Investigation",
    actionButton: "OPEN INVESTIGATION",
    outcomeTitle: "Investigation Opened",
    outcomeCopy:
      "EvidenceFlow keeps this claim out of normal processing and routes it into an investigation path with an audit trail.",
  },
};

const SIGNALS = [
  {
    icon: Eye,
    label: "Visual Embedding",
    copy: "Compares current claim photos with historical evidence to detect visual similarity and repeated or pre-existing evidence patterns.",
  },
  {
    icon: Link2,
    label: "Evidence Graph + Anomaly Detection",
    copy: "Checks relationships across claims, vehicles, images, locations and time to identify unusual evidence patterns.",
  },
  {
    icon: TrendingUp,
    label: "Predictive ML",
    copy: "Uses historical claim behavior and evidence signals to produce a continuous risk score and select a verification policy.",
  },
];

const STEPS = ["Claim evidence", "AI analysis & Evidence Gap", "Guided capture", "Verification"];

function normalizeCondition(value) {
  const clean = String(value || "").toLowerCase().replace(/[-_\s]/g, "");
  if (clean === "veryhigh" || clean === "very") return "veryhigh";
  return CONDITIONS[clean] ? clean : "medium";
}

function conditionFromUrl() {
  return normalizeCondition(new URLSearchParams(window.location.search).get("condition"));
}

function useCountUp(target, durationMs, start) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    setValue(0);
    if (!start) return undefined;
    const t0 = performance.now();
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / durationMs);
      setValue(Math.round(ease(p) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [start, target, durationMs]);

  return value;
}

function Sidebar({ view }) {
  const items = [
    { label: "Claim", key: "claim" },
    { label: "AI Analysis &\nEvidence Gap", key: "analysis" },
    { label: "Guided Capture", key: "capture" },
    { label: "Verification", key: "verification" },
  ];

  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col bg-[#0B1730] text-white px-5 py-6">
      <div className="mb-10">
        <div className="text-[17px] font-semibold tracking-tight">PixaProof</div>
        <div className="text-[11px] text-white/40 mt-0.5">EvidenceFlow</div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <div
            key={it.key}
            className={`rounded-lg px-3 py-2.5 text-[13.5px] leading-snug whitespace-pre-line transition-colors ${
              view === it.key ? "bg-white/10 text-white font-medium" : "text-white/55"
            }`}
          >
            {it.label}
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="text-[11px] text-white/40 mb-2">PixaProof Layer</div>
        <div className="text-[13px] font-medium leading-snug text-white/90">
          Trusted evidence capture remains the verification source
        </div>
      </div>
    </aside>
  );
}

function StepNav({ activeIndex }) {
  return (
    <div className="flex items-center gap-8 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
      {STEPS.map((label, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isDone || isActive ? "bg-[#2f5df5]" : "bg-slate-300"
              } ${isActive ? "animate-pulse" : ""}`}
            />
            <span
              className={`text-[13.5px] ${
                isActive ? "text-slate-900 font-semibold" : isDone ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ConditionSelector({ conditionId, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
      {CONDITION_ORDER.map((id) => {
        const item = CONDITIONS[id];
        const active = id === conditionId;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              active ? "bg-[#2f5df5] text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {item.selectorLabel}
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ title, subtitle, conditionId, onConditionChange, showSelector }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-end">
        {showSelector ? (
          <ConditionSelector conditionId={conditionId} onChange={onConditionChange} />
        ) : null}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-500">
          CLM-2026-01842 · 2024 Toyota Camry
        </div>
      </div>
    </div>
  );
}

function RiskCard({ condition }) {
  const [barOn, setBarOn] = useState(false);
  const value = useCountUp(condition.score, 950, barOn);

  useEffect(() => {
    setBarOn(false);
    const t = setTimeout(() => setBarOn(true), 120);
    return () => clearTimeout(t);
  }, [condition.id]);

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <span className={`inline-block rounded-full text-[11px] font-semibold px-3 py-1 border ${condition.badgeClass}`}>
        {condition.riskLabel}
      </span>
      <div className="mt-4 text-[54px] leading-none font-bold tabular-nums" style={{ color: condition.toneColor }}>
        {value}%
      </div>
      <p className="mt-4 text-[14px] font-semibold text-slate-800 leading-snug">{condition.riskCopy}</p>
      <div className="mt-5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-[1000ms] ease-out"
          style={{
            width: barOn ? `${condition.score}%` : "0%",
            background: `linear-gradient(90deg, ${condition.toneColor}, ${condition.toneStrong})`,
          }}
        />
      </div>
    </div>
  );
}

function GapCard({ condition }) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <span className={`inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold px-3 py-1 border ${condition.badgeClass}`}>
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: condition.toneColor }} />
        {condition.gapBadge}
      </span>

      <h2 className="mt-4 text-[23px] font-semibold text-slate-900 leading-snug">{condition.gapTitle}</h2>

      <p className="mt-3 text-[13.5px] text-slate-500 leading-relaxed">{condition.gapCopy}</p>

      <div className="mt-5 flex flex-col gap-4">
        <InstructionItem index="1" title="What is wrong?" copy={condition.wrongCopy} />
        <InstructionItem index="2" title="What should be captured?" copy={condition.captureCopy} />
      </div>
    </div>
  );
}

function InstructionItem({ index, title, copy }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDF1FE] text-[#2f5df5] text-[12px] font-semibold">
        {index}
      </span>
      <div>
        <div className="text-[13.5px] font-semibold text-slate-800">{title}</div>
        <div className="text-[13px] text-slate-500">{copy}</div>
      </div>
    </div>
  );
}

function CarDiagram({ condition }) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center justify-center min-h-[220px] shadow-sm shadow-slate-200/50">
      <svg viewBox="0 0 220 120" className="w-44 h-auto">
        <rect x="30" y="35" width="120" height="35" rx="10" fill="none" stroke="#2f5df5" strokeWidth="2.5" />
        <rect x="70" y="18" width="55" height="30" rx="8" fill="none" stroke="#2f5df5" strokeWidth="2.5" />
        <circle cx="55" cy="72" r="6" fill="#0B1730" />
        <circle cx="128" cy="72" r="6" fill="#0B1730" />
        <rect
          x="140"
          y="32"
          width="26"
          height="40"
          rx="8"
          fill={condition.id === "low" ? "#EFFAF3" : "none"}
          stroke={condition.toneColor}
          strokeWidth="3"
          style={{ filter: `drop-shadow(0 0 6px ${condition.glow})` }}
        />
      </svg>
      <span className={`mt-4 rounded-full text-[11px] font-semibold px-3 py-1 border ${condition.badgeClass}`}>
        {condition.diagramLabel}
      </span>
    </div>
  );
}

function SignalCard({ icon: Icon, label, copy }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 h-full transition-shadow hover:shadow-md hover:shadow-slate-200/60">
      <div className="flex items-start justify-between">
        <span className="rounded-full bg-[#EDF1FE] text-[#2f5df5] text-[11px] font-semibold px-3 py-1">
          Supporting signal
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
          <Icon size={15} strokeWidth={1.8} />
        </span>
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-slate-900 leading-snug">{label}</h3>
      <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">{copy}</p>
    </div>
  );
}

function DecisionOutput({ condition }) {
  const cols = [
    { k: "Risk policy", v: condition.decision.policy },
    { k: "Evidence gap", v: condition.decision.gap },
    { k: "Next action", v: condition.decision.action },
  ];

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <h3 className="text-[17px] font-semibold text-slate-900">AI decision output</h3>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cols.map((c) => (
          <div key={c.k} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="text-[11.5px] text-slate-400">{c.k}</div>
            <div className="mt-1.5 text-[13.5px] font-semibold text-slate-800 leading-snug">{c.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisView({ condition, onPrimaryAction, starting }) {
  const isMedium = condition.id === "medium";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RiskCard key={condition.id} condition={condition} />
        <GapCard condition={condition} />
        <CarDiagram condition={condition} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
        {SIGNALS.map((signal) => (
          <SignalCard key={signal.label} {...signal} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 mb-8">
        <div className="lg:col-span-2">
          <DecisionOutput condition={condition} />
        </div>
        <div className="h-full rounded-2xl bg-[#0B1730] p-6 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#2f5df5]/20 blur-2xl" />
          <h3 className="text-[19px] font-semibold leading-snug relative">{condition.actionTitle}</h3>
          <button
            onClick={onPrimaryAction}
            disabled={starting}
            className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f5df5] px-5 py-3 text-[13.5px] font-semibold text-white transition-all duration-200 hover:bg-[#3f6bff] active:scale-[0.97] disabled:opacity-70"
          >
            {starting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                CONNECTING PIXAPROOF...
              </>
            ) : (
              <>
                {condition.actionButton}
                {isMedium ? <ArrowRight size={15} /> : <Send size={15} />}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function CaptureView({
  condition,
  sdkStatus,
  capturedUrl,
  verification,
  onCapture,
  onBack,
  captureBusy,
  onDemoCapture,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 mt-2 mb-8">
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div>
            <span className={`inline-flex rounded-full text-[11px] font-semibold px-3 py-1 border ${condition.badgeClass}`}>
              {condition.gapBadge}
            </span>
            <h2 className="mt-3 text-[20px] font-semibold text-slate-900">Capture full rear view</h2>
            <p className="mt-1 text-[13.5px] text-slate-500">
              Keep the full rear section centered. PixaProof verifies that the photo was captured live.
            </p>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <div className="relative min-h-[430px] bg-[#eaf2fb] grid place-items-center overflow-hidden">
          {capturedUrl ? (
            <img src={capturedUrl} alt="Captured rear view" className="h-full min-h-[430px] w-full object-cover" />
          ) : (
            <div id="pixaproof-camera" className="w-full min-h-[430px] grid place-items-center">
              <div className="text-center px-8 max-w-md">
                <Camera className="mx-auto text-[#2f5df5]" size={42} />
                <h3 className="mt-4 text-[20px] font-semibold text-slate-900">PixaProof camera area</h3>
                <p className="mt-2 text-[13.5px] text-slate-500">
                  Click capture once the SDK camera is ready. If credentials are missing, use demo capture to continue the workflow.
                </p>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-12 rounded-2xl border-[3px] border-[#2f5df5]/80" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onDemoCapture}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            USE DEMO CAPTURE
          </button>
          <button
            onClick={onCapture}
            disabled={captureBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f5df5] px-6 py-3 text-[13.5px] font-semibold text-white hover:bg-[#3f6bff] disabled:opacity-70"
          >
            {captureBusy ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            CAPTURE WITH PIXAPROOF
          </button>
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-[17px] font-semibold text-slate-900">PixaProof connection</h3>
          <div className="mt-4 space-y-3 text-[13px]">
            <StatusRow label="SDK" value={sdkStatus} />
            <StatusRow label="API route" value="/api/pixaproof/session" />
            <StatusRow label="Verify route" value="/api/pixaproof/verify" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-[17px] font-semibold text-slate-900">Verification</h3>
          {verification ? (
            <div className="mt-4 space-y-3 text-[13px]">
              <StatusRow label="Result" value={verification.verdict || "Pass"} />
              <StatusRow label="Mode" value={verification.mode || "pixaproof-api"} />
              <StatusRow label="Receipt" value={verification.receiptId || "PENDING"} />
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-700 font-semibold flex gap-2">
                <BadgeCheck size={16} />
                Trusted capture attached
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[13.5px] text-slate-500 leading-relaxed">
              After capture, the image blob is sent to the local server proxy, then forwarded to PixaProof verification.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function OutcomeView({ condition, onBack }) {
  const Icon = condition.id === "low" ? CheckCircle2 : condition.id === "high" ? Send : Search;

  return (
    <div className="mt-2 mb-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50">
        <span className={`inline-flex rounded-full text-[11px] font-semibold px-3 py-1 border ${condition.badgeClass}`}>
          {condition.gapBadge}
        </span>
        <div className="mt-7 flex items-start gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: condition.toneColor }}
          >
            <Icon size={24} />
          </div>
          <div>
            <h2 className="text-[24px] font-semibold text-slate-900 leading-tight">{condition.outcomeTitle}</h2>
            <p className="mt-3 max-w-2xl text-[14px] text-slate-500 leading-relaxed">{condition.outcomeCopy}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatusTile label="Risk policy" value={condition.decision.policy} />
          <StatusTile label="Evidence gap" value={condition.decision.gap} />
          <StatusTile label="Next action" value={condition.decision.action} />
        </div>

        <button
          onClick={onBack}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Back to analysis
        </button>
      </section>

      <aside className="rounded-2xl bg-[#0B1730] p-6 text-white flex flex-col justify-between">
        <h3 className="text-[20px] font-semibold leading-snug">{condition.actionTitle}</h3>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-[13px] leading-relaxed text-white/70">
          Demo route complete. This state replaces real ML routing for prototype presentation.
        </div>
      </aside>
    </div>
  );
}

function StatusTile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="text-[11.5px] text-slate-400">{label}</div>
      <div className="mt-1.5 text-[13.5px] font-semibold text-slate-800 leading-snug">{value}</div>
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700 text-right">{value}</span>
    </div>
  );
}

function App() {
  const [conditionId, setConditionId] = useState(conditionFromUrl);
  const [view, setView] = useState("analysis");
  const [starting, setStarting] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [sdkStatus, setSdkStatus] = useState("Not connected");
  const [capturedUrl, setCapturedUrl] = useState("");
  const [verification, setVerification] = useState(null);
  const sdkRef = useRef(null);

  const condition = CONDITIONS[conditionId];
  const activeIndex = view === "analysis" ? 1 : view === "capture" ? 2 : 3;

  const title = useMemo(() => {
    if (view === "analysis") return "AI Evidence Analysis & Evidence Gap";
    if (view === "capture") return "Guided Capture Instruction";
    if (view === "verification") return "Verification";
    return condition.outcomeTitle;
  }, [condition.outcomeTitle, view]);

  const subtitle = useMemo(() => {
    if (view === "analysis") return "EvidenceFlow analyzes the claim, then decides what evidence is needed next.";
    if (view === "capture") return "Start Capture connects directly to the PixaProof WebSDK and verification API.";
    if (view === "verification") return "PixaProof returns trusted capture verification to EvidenceFlow.";
    return condition.outcomeCopy;
  }, [condition.outcomeCopy, view]);

  useEffect(() => {
    return () => {
      sdkRef.current?.closeCamera?.().catch(() => {});
    };
  }, []);

  function updateCondition(nextId) {
    const normalized = normalizeCondition(nextId);
    const params = new URLSearchParams(window.location.search);
    params.set("condition", normalized);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    sdkRef.current?.closeCamera?.().catch(() => {});
    sdkRef.current = null;
    setConditionId(normalized);
    setView("analysis");
    setStarting(false);
    setCaptureBusy(false);
    setSdkStatus("Not connected");
    setCapturedUrl("");
    setVerification(null);
  }

  function handlePrimaryAction() {
    if (condition.id === "medium") {
      startGuidedCapture();
      return;
    }
    setView("outcome");
  }

  async function startGuidedCapture() {
    setStarting(true);
    setView("capture");
    setCapturedUrl("");
    setVerification(null);
    setSdkStatus("Requesting token from local proxy...");

    setTimeout(async () => {
      try {
        const session = await fetch("/api/pixaproof/session")
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error("PixaProof proxy is not available on this hosted demo."))));
        if (!session.configured) {
          setSdkStatus(session.reason || "Missing PixaProof credentials. Demo capture available.");
          return;
        }
        if (!window.PixaProof) {
          setSdkStatus("PixaProof SDK script not loaded. Check CDN/network.");
          return;
        }

        sdkRef.current?.closeCamera?.().catch(() => {});
        sdkRef.current = new window.PixaProof({
          apiUrl: session.apiUrl,
          apiKey: session.apiKey,
          token: session.token,
          elementId: "pixaproof-camera",
          width: 760,
          height: 430,
          preferredCamera: "environment",
          permissionUI: {
            button: { text: "Allow camera access", loadingText: "Requesting..." },
            message: {
              html: "<strong>Capture full rear view</strong><br>Keep the rear section centered in frame.",
            },
          },
          cameraUI: {
            wrapper: { styles: { width: "100%", "min-height": "430px" } },
            card: { styles: { width: "100%", "box-shadow": "none", border: "0", background: "transparent" } },
            videoWrapper: { styles: { width: "100%" } },
            video: { styles: { width: "100%", height: "430px", "object-fit": "cover" } },
          },
          onInitSuccess() {
            setSdkStatus("Connected. PixaProof camera ready.");
          },
          onInitError(error) {
            setSdkStatus(`SDK init failed: ${error.message}`);
            setCaptureBusy(false);
          },
          onCameraPermissionFailed(error) {
            setSdkStatus(`Camera permission denied: ${error.message}`);
            setCaptureBusy(false);
          },
          onLocationPermissionFailed() {
            setSdkStatus("Camera ready. Location permission not granted.");
          },
          onSensorPermissionFailed() {
            setSdkStatus("Camera ready. Motion sensor permission not granted.");
          },
          onCapture() {
            setSdkStatus("Capturing trusted evidence...");
          },
          async onCaptureSuccess(blob) {
            setSdkStatus("Capture complete. Verifying with PixaProof...");
            const url = URL.createObjectURL(blob);
            setCapturedUrl(url);
            await verifyBlob(blob);
          },
          onCaptureError(error) {
            setSdkStatus(`Capture failed: ${error.message}`);
            setCaptureBusy(false);
          },
        });

        await sdkRef.current.init();
      } catch (error) {
        setSdkStatus(`Demo mode: ${error.message} Use demo capture to continue.`);
      } finally {
        setStarting(false);
      }
    }, 60);
  }

  async function captureWithPixaProof() {
    if (!sdkRef.current) {
      setSdkStatus("PixaProof SDK is not ready. Use demo capture or check credentials.");
      return;
    }
    setCaptureBusy(true);
    try {
      await sdkRef.current.captureCamera();
    } catch (error) {
      setSdkStatus(`Capture failed: ${error.message}`);
      setCaptureBusy(false);
    }
  }

  async function verifyBlob(blob) {
    const formData = new FormData();
    formData.append("claimId", "CLM-2026-01842");
    formData.append("vehicle", "2024 Toyota Camry");
    formData.append("scenarioId", condition.id);
    formData.append("image", blob, "rear-view.png");

    const result = await fetch("/api/pixaproof/verify", {
      method: "POST",
      body: formData,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("PixaProof proxy unavailable"))))
      .catch(() => ({
        mode: "hosted-demo",
        trusted: true,
        verdict: "Pass",
        receiptId: "DEMO-HOSTED",
      }));

    await sdkRef.current?.closeCamera?.().catch(() => {});
    setVerification(result);
    setCaptureBusy(false);
    setSdkStatus(result.trusted === false ? "Verification returned review status." : "PixaProof verification complete.");
    setView("verification");
  }

  async function demoCapture() {
    setCaptureBusy(true);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540"><rect width="900" height="540" fill="#eef6ff"/><rect x="190" y="210" width="470" height="130" rx="28" fill="#f8fbff" stroke="#1677ff" stroke-width="10"/><rect x="330" y="130" width="210" height="120" rx="26" fill="#fff" stroke="#1677ff" stroke-width="10"/><circle cx="290" cy="352" r="38" fill="#071b3a"/><circle cx="575" cy="352" r="38" fill="#071b3a"/><rect x="620" y="185" width="120" height="190" rx="32" fill="#fff5dd" stroke="#d88700" stroke-width="10"/><text x="450" y="470" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#071b3a">Demo rear view capture</text></svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    setCapturedUrl(URL.createObjectURL(blob));
    try {
      await verifyBlob(blob);
    } finally {
      setCaptureBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] flex font-[system-ui]">
      <Sidebar view={view === "outcome" ? "verification" : view} />

      <main className="flex-1 px-6 md:px-10 py-8 max-w-6xl">
        <TopBar
          title={title}
          subtitle={subtitle}
          conditionId={conditionId}
          onConditionChange={updateCondition}
          showSelector={view === "analysis"}
        />

        <StepNav activeIndex={activeIndex} />

        {view === "analysis" ? (
          <AnalysisView condition={condition} onPrimaryAction={handlePrimaryAction} starting={starting} />
        ) : view === "outcome" ? (
          <OutcomeView condition={condition} onBack={() => setView("analysis")} />
        ) : (
          <CaptureView
            condition={condition}
            sdkStatus={sdkStatus}
            capturedUrl={capturedUrl}
            verification={verification}
            captureBusy={captureBusy}
            onCapture={captureWithPixaProof}
            onBack={() => setView("analysis")}
            onDemoCapture={demoCapture}
          />
        )}
      </main>
    </div>
  );
}

export default App;
