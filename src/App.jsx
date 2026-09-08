import { useEffect, useState, useRef } from "react";
import { Eye, Link2, TrendingUp, Car, ArrowRight, ChevronRight } from "lucide-react";

const STEPS = [
  { label: "Claim evidence", state: "done" },
  { label: "AI analysis & Evidence Gap", state: "active" },
  { label: "Guided capture", state: "pending" },
  { label: "Verification", state: "pending" },
];

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

function useCountUp(target, durationMs, start) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!start) return;
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

function Sidebar() {
  const items = [
    { label: "Claim", active: false },
    { label: "AI Analysis &\nEvidence Gap", active: true },
    { label: "Guided Capture", active: false },
    { label: "Verification", active: false },
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
            key={it.label}
            className={`rounded-lg px-3 py-2.5 text-[13.5px] leading-snug whitespace-pre-line transition-colors ${
              it.active
                ? "bg-white/10 text-white font-medium"
                : "text-white/55 hover:text-white/80"
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

function StepNav({ visible }) {
  return (
    <div
      className={`flex items-center gap-8 border-b border-slate-200 pb-4 mb-6 overflow-x-auto transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
    >
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2 shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${
              s.state === "pending" ? "bg-slate-300" : "bg-[#2f5df5]"
            } ${s.state === "active" ? "animate-pulse" : ""}`}
          />
          <span
            className={`text-[13.5px] ${
              s.state === "pending"
                ? "text-slate-400"
                : s.state === "active"
                ? "text-slate-900 font-medium"
                : "text-slate-500"
            }`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`transition-all duration-500 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function RiskCard({ delay }) {
  const [barOn, setBarOn] = useState(false);
  const value = useCountUp(58, 1100, barOn);

  useEffect(() => {
    const t = setTimeout(() => setBarOn(true), delay + 250);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Reveal delay={delay} className="h-full">
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
        <span className="inline-block rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-3 py-1 border border-amber-200">
          MEDIUM RISK
        </span>

        <div className="mt-4 text-[46px] leading-none font-bold text-amber-500 tabular-nums">
          {value}%
        </div>

        <p className="mt-4 text-[14px] font-semibold text-slate-800 leading-snug">
          Targeted evidence is required before the claim can proceed.
        </p>

        <div className="mt-5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-[width] duration-[1100ms] ease-out"
            style={{ width: barOn ? "58%" : "0%" }}
          />
        </div>
      </div>
    </Reveal>
  );
}

function GapCard({ delay }) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-3 py-1 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Evidence Gap Detected
        </span>

        <h2 className="mt-4 text-[21px] font-semibold text-slate-900 leading-snug">
          Rear section of vehicle is not sufficiently visible.
        </h2>

        <p className="mt-3 text-[13.5px] text-slate-500 leading-relaxed">
          The submitted evidence includes front, left and right views.
          EvidenceFlow found that the rear view is missing for a rear-end
          collision claim.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDF1FE] text-[#2f5df5] text-[12px] font-semibold">
              1
            </span>
            <div>
              <div className="text-[13.5px] font-semibold text-slate-800">
                What is wrong?
              </div>
              <div className="text-[13px] text-slate-500">
                Reported damage area is not visible enough to verify.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDF1FE] text-[#2f5df5] text-[12px] font-semibold">
              2
            </span>
            <div>
              <div className="text-[13.5px] font-semibold text-slate-800">
                What should be captured?
              </div>
              <div className="text-[13px] text-slate-500">
                Full rear view of the vehicle, centered in frame.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function CarDiagram({ delay }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay + 400);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Reveal delay={delay} className="h-full">
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center justify-center min-h-[220px]">
        <svg viewBox="0 0 220 120" className="w-40 h-auto">
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
            fill="none"
            stroke="#E29A2E"
            strokeWidth={on ? 3 : 2.5}
            className="transition-all duration-500"
            style={{
              filter: on ? "drop-shadow(0 0 6px rgba(226,154,46,0.55))" : "none",
            }}
          />
        </svg>
        <span
          className={`mt-4 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium px-3 py-1 border border-amber-200 transition-all duration-500 ${
            on ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          Missing rear view
        </span>
      </div>
    </Reveal>
  );
}

function SignalCard({ icon: Icon, label, copy, delay }) {
  return (
    <Reveal delay={delay}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 h-full transition-shadow hover:shadow-md hover:shadow-slate-200/60">
        <div className="flex items-start justify-between">
          <span className="rounded-full bg-[#EDF1FE] text-[#2f5df5] text-[11px] font-medium px-3 py-1">
            Supporting signal
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
            <Icon size={15} strokeWidth={1.8} />
          </span>
        </div>
        <h3 className="mt-4 text-[15px] font-semibold text-slate-900 leading-snug">
          {label}
        </h3>
        <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">
          {copy}
        </p>
      </div>
    </Reveal>
  );
}

function DecisionOutput({ delay }) {
  const cols = [
    { k: "Risk policy", v: "Medium Risk → targeted evidence task" },
    { k: "Evidence gap", v: "Rear section not visible" },
    { k: "Next action", v: "Capture full rear view" },
  ];
  return (
    <Reveal delay={delay} className="h-full">
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-[17px] font-semibold text-slate-900">
          AI decision output
        </h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cols.map((c) => (
            <div
              key={c.k}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="text-[11.5px] text-slate-400">{c.k}</div>
              <div className="mt-1.5 text-[13.5px] font-semibold text-slate-800 leading-snug">
                {c.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function CtaPanel({ delay }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Reveal delay={delay} className="h-full">
      <div className="h-full rounded-2xl bg-[#0B1730] p-6 flex flex-col justify-between text-white relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#2f5df5]/20 blur-2xl"
        />
        <h3 className="text-[19px] font-semibold leading-snug relative">
          Send to Guided
          <br />
          Capture
        </h3>
        <button
          onClick={() => setPressed(true)}
          className={`relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f5df5] px-5 py-3 text-[13.5px] font-semibold text-white transition-all duration-200 hover:bg-[#3f6bff] active:scale-[0.97] ${
            pressed ? "ring-4 ring-[#2f5df5]/30" : ""
          }`}
        >
          {pressed ? "OPENING GUIDED CAPTURE…" : "START GUIDED CAPTURE"}
          <ArrowRight
            size={15}
            className={`transition-transform ${pressed ? "translate-x-1" : ""}`}
          />
        </button>
      </div>
    </Reveal>
  );
}

export default function App() {
  const [navOn, setNavOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setNavOn(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] flex font-[system-ui]">
      <Sidebar />

      <main className="flex-1 px-6 md:px-10 py-8 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">
              AI Evidence Analysis &amp; Evidence Gap
            </h1>
            <p className="mt-1 text-[13.5px] text-slate-500">
              EvidenceFlow analyzes the claim, then decides what evidence is needed next.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-500 flex items-center gap-1.5">
            CLM-2026-01842 <ChevronRight size={12} className="text-slate-300" /> 2024 Toyota Camry
          </div>
        </div>

        <StepNav visible={navOn} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <RiskCard delay={100} />
          <GapCard delay={220} />
          <CarDiagram delay={340} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {SIGNALS.map((s, i) => (
            <SignalCard key={s.label} {...s} delay={460 + i * 100} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 mb-8">
          <div className="lg:col-span-2">
            <DecisionOutput delay={820} />
          </div>
          <CtaPanel delay={920} />
        </div>
      </main>
    </div>
  );
}