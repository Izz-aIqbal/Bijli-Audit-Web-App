"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Zap,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Send,
  Loader2,
  FileDown,
  Gauge,
  Building2,
  Factory,
  Home,
  Layers,
  Landmark,
} from "lucide-react";
import InfoTip from "@/components/InfoTip";
import GsapCounter from "@/components/GsapCounter";
import { API_BASE } from "@/lib/apiBase";

interface SlabLine {
  range: string;
  units: number;
  rate: number;
  cost: number;
}

interface ItemRow {
  key: string;
  label: string;
  amount: number;
  note?: string;
}

interface CalcResult {
  units: number;
  phase: string;
  category: string;
  applied_category: string;
  category_downgraded_from_protected?: boolean;
  slab_limit: number;
  breakdown: SlabLine[];
  base_cost: number;
  fixed_charges: number;
  fpa: number;
  qta: number;
  electricity_duty: number;
  gst: number;
  tv_fee: number;
  surcharge: number;
  energy_plus_fixed: number;
  subtotal_before_tax: number;
  gross_total: number;
  estimated_subsidy: number;
  total_bill: number;
  itemization: ItemRow[];
}

interface TariffMeta {
  disco: string;
  effective_date: string;
  source: string;
  protected_slab_limit: number;
}

const CATEGORY_META = [
  {
    key: "protected",
    label: "Protected",
    icon: Home,
    blurb: "Subsidised residential tariff for 1–200 kWh.",
    tip: "UptoD is subsidised by the government. If your billing month crosses 200 units, the WHOLE bill re-rates at the unprotected schedule — no unit is left at the cheap rate.",
  },
  {
    key: "unprotected",
    label: "Unprotected",
    icon: Home,
    blurb: "Standard residential tariff, no slab ceiling.",
    tip: "Consumers using more than 200 kWh/month (or without a protected designation) are billed at the full NEPRA residential rates for every unit.",
  },
  {
    key: "commercial",
    label: "Commercial",
    icon: Building2,
    blurb: "Shops, offices, small businesses (A-2).",
    tip: "Commercial connections are billed under MEPCO's A-2 schedule. GST and duty still apply on top of the slab charges.",
  },
  {
    key: "industrial",
    label: "Industrial",
    icon: Factory,
    blurb: "Factories and industrial consumers (B-1).",
    tip: "Industrial connections use MEPCO's B-1 schedule. Fixed charges vary with sanctioned load; this calculator applies the standard phase-based charge.",
  },
] as const;

type CategoryKey = (typeof CATEGORY_META)[number]["key"];

function fmt(n: number | undefined | null): string {
  return (Number(n ?? 0)).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CalculatorPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // ——— Inputs ———
  const [mode, setMode] = useState<"units" | "meter">("units");
  const [units, setUnits] = useState(180);
  const [presentReading, setPresentReading] = useState(1600);
  const [previousReading, setPreviousReading] = useState(1420);
  const [category, setCategory] = useState<CategoryKey>("protected");
  const [phase, setPhase] = useState<"single" | "three">("single");
  const [fpaPerUnit, setFpaPerUnit] = useState(0);
  const [qtaAmount, setQtaAmount] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  const [dutyPercent, setDutyPercent] = useState(1.5);
  const [tvFee, setTvFee] = useState(0);
  const [surchargePercent, setSurchargePercent] = useState(0);
  const [officialAmount, setOfficialAmount] = useState("");

  // ——— Outputs ———
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [tariffMeta, setTariffMeta] = useState<TariffMeta | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ——— Mascot ———
  const [mathOpen, setMathOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatRows, setChatRows] = useState<{ role: string; text: string }[]>([
    {
      role: "assistant",
      text: "Hi, I'm the Math-Bot 👋. I'll answer from the exact numbers this calculator produced — never a guess. Ask me anything, e.g. \"Why is GST this much?\" or \"Recalculate if I used 180 units instead\".",
    },
  ]);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Working units for meter mode (auto-derived, mirrored to the backend).
  const meterUnits = Math.max(presentReading - previousReading, 0);

  // ——— fetch engine (debounced) ———
  const runCalculation = useCallback(
    async (overrides?: { units?: number; category?: CategoryKey }) => {
      const bodyMode = mode;
      try {
        const payload: Record<string, unknown> = {
          units: overrides?.units ?? (bodyMode === "meter" ? meterUnits : units),
          category: overrides?.category ?? category,
          phase,
          fpa_per_unit: fpaPerUnit,
          qta_amount: qtaAmount,
          tv_fee: tvFee,
          surcharge_percent: surchargePercent,
          gst_percent: null,
          electricity_duty_percent: null,
        };
        if (gstPercent !== 18) payload.gst_percent = gstPercent;
        if (dutyPercent !== 1.5) payload.electricity_duty_percent = dutyPercent;

        if (bodyMode === "meter") {
          payload.present_reading = presentReading;
          payload.previous_reading = previousReading;
          payload.units = 0;
        }

        const res = await fetch(`${API_BASE}/api/v1/calculate-bill`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();
        setResult(data);
        setOffline(false);
      } catch {
        setOffline(true);
      } finally {
        setLoading(false);
      }
    },
    [mode, units, meterUnits, category, phase, fpaPerUnit, qtaAmount, tvFee, surchargePercent, gstPercent, dutyPercent, presentReading, previousReading]
  );

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/tariff`)
      .then((r) => r.json())
      .then(setTariffMeta)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      void runCalculation();
    }, 260);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runCalculation]);

  // ——— GSAP entrance + slab bar animations ———
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".calc-hero",
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
      gsap.fromTo(
        ".calc-card",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.09, delay: 0.12 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatRows, chatLoading]);

  // ——— derived ———
  const slabLimit = tariffMeta?.protected_slab_limit ?? 200;
  const effectiveCategory =
    category === "protected" && result && result.units > slabLimit
      ? "unprotected"
      : category;
  const downgraded = category === "protected" && result && result.units > slabLimit;

  const official = Number(officialAmount);
  const hasOfficial = officialAmount.trim() !== "" && !Number.isNaN(official) && official > 0;
  const diff = hasOfficial && result ? Number((result.total_bill - official).toFixed(2)) : null;
  const matched = diff !== null && Math.abs(diff) < 1;

  const maxSlabCost = useMemo(
    () => Math.max(...(result?.breakdown.map((s) => s.cost) ?? [1])),
    [result]
  );

  const explanation = useMemo(() => {
    if (!result) return [];
    const steps: string[] = [];
    steps.push(
      `${result.units} kWh billed under the ${result.applied_category} tariff${result.category === "protected" ? " (government subsidised)" : ""}.`
    );
    result.breakdown.forEach((s) =>
      steps.push(`Slab ${s.range} kWh × Rs ${s.rate} = Rs ${fmt(s.cost)}`)
    );
    if (result.breakdown.length)
      steps.push(`→ Slab energy subtotal = Rs ${fmt(result.base_cost)}`);
    steps.push(`Fixed charges (${result.phase} phase) = Rs ${fmt(result.fixed_charges)}`);
    if (result.fpa > 0)
      steps.push(`FPA @ Rs ${fmt(result.fpa / (result.units || 1))}/kWh × ${result.units} kWh = Rs ${fmt(result.fpa)}`);
    if (result.qta > 0) steps.push(`Quarterly tariff adjustment = Rs ${fmt(result.qta)}`);
    if (result.electricity_duty > 0)
      steps.push(`Electricity duty (${dutyPercent}% of slab energy) = Rs ${fmt(result.electricity_duty)}`);
    if (result.surcharge > 0) steps.push(`Surcharge ${surchargePercent}% on energy + fixed = Rs ${fmt(result.surcharge)}`);
    if (result.tv_fee > 0) steps.push(`TV licence fee = Rs ${fmt(result.tv_fee)}`);
    if (result.gst > 0)
      steps.push(`GST (${gstPercent}%) on energy + fixed + FPA + QTA = Rs ${fmt(result.gst)}`);
    if ((result.estimated_subsidy ?? 0) > 0)
      steps.push(`Protected subsidy relief = − Rs ${fmt(-result.estimated_subsidy)}`);
    steps.push(`FINAL PAYABLE = Rs ${fmt(result.total_bill)}`);
    if (downgraded)
      steps.push(
        `Note: you crossed the ${slabLimit} kWh protected ceiling, so ALL units were re-rated at the unprotected schedule.`
      );
    return steps;
  }, [result, downgraded, slabLimit, dutyPercent, gstPercent, surchargePercent]);

  const sendChat = async () => {
    const msg = chatMessage.trim();
    if (!msg || chatLoading || !result) return;
    setChatRows((prev) => [...prev, { role: "user", text: msg }]);
    setChatMessage("");
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          session_id: `calc-${typeof window !== "undefined" ? localStorage.getItem("bijli_household_id") || "anon" : "anon"}`,
          context: JSON.stringify({
            calculation: result,
            inputs: { category, phase, fpa_per_unit: fpaPerUnit, qta_amount: qtaAmount, gst_percent: gstPercent, duty_percent: dutyPercent, tv_fee: tvFee, surcharge_percent: surchargePercent },
          }),
        }),
      });
      const data = await res.json();
      setChatRows((prev) => [...prev, { role: "assistant", text: data.reply || "No reply." }]);
    } catch {
      setChatRows((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't reach the backend just now — try again in a moment." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const lines = [
      `BijliAudit — Auditor Calculator (${new Date().toLocaleDateString()})`,
      `Tariff: ${result.applied_category} | Phase: ${result.phase} | Units: ${result.units} kWh`,
      ``,
      ...explanation,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bijli-audit-calculator.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const quickUnits = [50, 100, 180, 200, 300, 450];

  return (
    <div ref={pageRef} className="min-h-screen bg-transparent flex flex-col font-sans pt-24 sm:pt-28 pb-16 relative">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
        {/* ——— Hero ——— */}
        <div className="calc-hero flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold tracking-wider uppercase mb-2">
              <Calculator className="w-4 h-4" />
              <span>Understand. Verify. Save.</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              MEPCO Audit Calculator
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 mt-2 max-w-xl">
              Every rupee on your bill, transparently — slab by slab, tax by tax. Change any
              input and watch the payable re-run instantly against the NEPRA rules engine.
            </p>
          </div>
          {tariffMeta && (
            <div className="text-[11px] font-semibold text-slate-400 bg-white/70 border border-slate-200/80 rounded-xl px-3 py-2 shadow-xs">
              <span className="text-slate-600">{tariffMeta.disco}</span> · w.e.f{" "}
              {tariffMeta.effective_date} · {tariffMeta.source}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ————————————————— Inputs ————————————————— */}
          <div className="calc-card space-y-5">
            {/* Input mode */}
            <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gauge size={16} className="text-amber-500" />
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Consumption
                  </h2>
                </div>
                <div className="flex gap-1 bg-slate-100 rounded-full p-1">
                  {(["units", "meter"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        mode === m ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {m === "units" ? "Enter units" : "Meter readings"}
                    </button>
                  ))}
                </div>
              </div>

              {mode === "units" ? (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Units consumed (kWh)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={units}
                    onChange={(e) => setUnits(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {quickUnits.map((u) => (
                      <button
                        key={u}
                        onClick={() => {
                          setUnits(u);
                          setLoading(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          units === u
                            ? "bg-amber-400 text-slate-900"
                            : "bg-slate-100 text-slate-600 hover:bg-amber-100"
                        }`}
                      >
                        {u} kWh
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Present reading
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={presentReading}
                      onChange={(e) => setPresentReading(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Previous reading
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={previousReading}
                      onChange={(e) => setPreviousReading(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                    />
                  </div>
                  <div className="col-span-2 rounded-xl bg-slate-900 px-4 py-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Auto-derived units
                    </span>
                    <span className="text-lg font-black text-amber-400">
                      {meterUnits} kWh
                    </span>
                  </div>
                  {presentReading < previousReading && (
                    <p className="col-span-2 text-[11px] font-bold text-rose-600 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Present reading can&apos;t be lower than previous.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Tariff category */}
            <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-amber-500" />
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Tariff category
                  </h2>
                </div>
                <InfoTip title="Tariff category">
                  MEPCO bills each connection under a NEPRA-approved schedule. Domestic
                  connections are either Protected (1–200 kWh, subsidised) or Unprotected.
                  Commercial and industrial connections have their own slab tables.
                </InfoTip>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORY_META.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => {
                        setCategory(c.key);
                        setLoading(true);
                      }}
                      className={`relative rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        active
                          ? "border-amber-400 bg-amber-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon size={16} className={active ? "text-amber-500" : "text-slate-400"} />
                        <InfoTip title={c.label}>
                          {c.tip}
                        </InfoTip>
                      </div>
                      <p className={`text-xs font-extrabold mt-2 ${active ? "text-slate-900" : "text-slate-700"}`}>
                        {c.label}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{c.blurb}</p>
                      {active && (
                        <motion.div
                          layoutId="cat-pill"
                          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {downgraded && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-start gap-2 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
                >
                  <ShieldAlert size={13} className="shrink-0 mt-0.5" />
                  <span>
                    You crossed the {slabLimit} kWh protected ceiling — the whole bill re-rates
                    at the unprotected schedule. Effective tariff:{" "}
                    <span className="uppercase">{effectiveCategory}</span>.
                  </span>
                </motion.div>
              )}

              {/* Phase toggle */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Connection</span>
                <div className="flex gap-1 bg-slate-100 rounded-full p-1">
                  {(["single", "three"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPhase(p)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        phase === p
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {p === "single" ? "Single phase" : "Three phase"}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Taxes & surcharges */}
            <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Landmark size={16} className="text-amber-500" />
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Taxes &amp; surcharges
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Control
                  label="FPA"
                  unit="Rs / kWh"
                  value={fpaPerUnit}
                  onChange={setFpaPerUnit}
                  tipTitle="Fuel Price Adjustment"
                >
                 Fuel-price pass-through MEPCO adds per kWh each billing cycle to recover
                  actual fuel costs. Set it to what your bill shows (often 0 for protected consumers).
                </Control>
                <Control
                  label="QTA"
                  unit="Rs flat"
                  value={qtaAmount}
                  onChange={setQtaAmount}
                  tipTitle="Quarterly Tariff Adjustment"
                >
                  A flat catch-up amount NEPRA approves quarterly (often zero). MEPCO prints it as
                  a single line on the bill.
                </Control>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-xs font-bold text-slate-500">GST</label>
                    <InfoTip title="General Sales Tax">
                      Government sales tax charged on the electricity charge (energy + fixed + FPA +
                      QTA). The applicable rate is set by the federal government in each Finance Act —
                      17–18% is the usual band.
                    </InfoTip>
                  </div>
                  <select
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60 cursor-pointer"
                  >
                    <option value={17}>17%</option>
                    <option value={18}>18%</option>
                    <option value={19}>19%</option>
                  </select>
                </div>
                <Control
                  label="Electricity duty"
                  unit="%"
                  value={dutyPercent}
                  onChange={setDutyPercent}
                  tipTitle="Electricity Duty"
                >
                  A provincial (Punjab) duty charged on the slab energy charge. The default 1.5% is
                  the standard MEPCO rate.
                </Control>
                <Control
                  label="TV licence fee"
                  unit="Rs flat"
                  value={tvFee}
                  onChange={setTvFee}
                  tipTitle="TV Licence Fee"
                >
                  A small flat monthly fee collected with the bill for the public broadcaster.
                </Control>
                <Control
                  label="Surcharge"
                  unit="%"
                  value={surchargePercent}
                  onChange={setSurchargePercent}
                  tipTitle="Surcharge"
                >
                  An additional percentage (e.g. late-payment surcharge) applied on energy + fixed
                  charges. Leave at 0 when unsure.
                </Control>
              </div>
            </section>

            {/* Official bill comparison */}
            <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Compare with your bill
                </h2>
                <InfoTip title="Discrepancy check">
                  Enter the payable amount printed on your actual MEPCO bill. The calculator will
                  flag any difference against what the NEPRA rules engine computes, so you can spot
                  an overcharge instantly.
                </InfoTip>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 2340"
                    value={officialAmount}
                    onChange={(e) => setOfficialAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  />
                </div>
                <button
                  onClick={() => {
                    setLoading(true);
                    void runCalculation();
                  }}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md hover:bg-slate-800 disabled:opacity-60 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 size={15} className="animate-spin text-amber-400" /> : <Zap size={15} className="text-amber-400 fill-amber-400" />}
                  Calculate
                </button>
              </div>
            </section>
          </div>

          {/* ————————————————— Results ————————————————— */}
          <div className="space-y-5">
            <section className="calc-card space-y-5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-xl shadow-slate-900/20 p-6 overflow-hidden relative">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between relative">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Estimated bill
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <Sparkles size={10} /> {result?.applied_category ?? "…"}
                </span>
              </div>

              <div className="relative">
                {offline ? (
                  <p className="text-sm font-bold text-amber-300 text-center py-3">
                    Backend offline — start the API server on :8000.
                  </p>
                ) : (
                  <motion.div
                    key={`total-${result?.total_bill ?? 0}`}
                    initial={{ opacity: 0.4, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-5xl sm:text-6xl font-black text-white tracking-tight text-center py-3"
                  >
                    <GsapCounter value={result?.total_bill ?? 0} prefix="Rs. " />
                  </motion.div>
                )}
                <div className="flex items-center justify-center gap-2 mt-1 text-[11px] font-semibold text-slate-400">
                  <span>{result?.units ?? 0} kWh</span>
                  <span>·</span>
                  <span>{result?.phase} phase</span>
                  <span>·</span>
                  <span className="capitalize">{result?.category ?? ""}</span>
                </div>
              </div>

              {/* Discrepancy banner */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {hasOfficial && diff !== null && (
                    <motion.div
                      key="compare"
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className={`rounded-2xl border p-4 flex items-start gap-3 ${
                        matched
                          ? "bg-emerald-400/10 border-emerald-400/40"
                          : "bg-rose-400/10 border-rose-400/40"
                      }`}
                    >
                      {matched ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wider ${matched ? "text-emerald-300" : "text-rose-300"}`}>
                          {matched ? "No discrepancy" : "Possible overcharge detected"}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-relaxed">
                          Calculated: Rs. {fmt(result?.total_bill)} · Official: Rs. {fmt(official)} ·{" "}
                          {matched
                            ? "they match."
                            : `difference of Rs. ${fmt(Math.abs(diff ?? 0))}. This is worth disputing — draft a letter from the History page.`}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Slab breakdown */}
              {result && result.breakdown.length > 0 && (
                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Slab-by-slab energy charge
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Rs. {fmt(result.base_cost)}</span>
                  </div>
                  {result.breakdown.map((s) => {
                    const pct = maxSlabCost > 0 ? Math.round((s.cost / maxSlabCost) * 100) : 0;
                    return (
                      <div key={s.range} className="grid grid-cols-[64px_1fr_78px] items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">{s.range} kWh</span>
                        <div className="h-4 rounded-md bg-slate-800/80 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            className="h-full rounded-md bg-gradient-to-r from-amber-500 to-amber-400"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 text-right tabular-nums">
                          Rs. {fmt(s.cost)}
                        </span>
                      </div>
                    );
                  })}
                  <p className="text-[10px] font-semibold text-slate-500">
                    {result.breakdown.map((s) => `${s.units}×${s.rate}`).join(" + ")} = Rs. {fmt(result.base_cost)}
                  </p>
                </div>
              )}
            </section>

            {/* Itemized maths card */}
            <section className="calc-card bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Full line-by-line maths
                </h3>
                {result && (
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    <FileDown size={13} /> Export
                  </button>
                )}
              </div>

              {!result ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {result.itemization.map((row) => {
                    const negative = row.amount < 0;
                    const accent = row.key === "subsidy" ? "emerald" : row.key === "gst" ? "slate" : "slate";
                    return (
                      <div
                        key={row.key}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                          row.key === "subsidy" ? "bg-emerald-50/70 border border-emerald-100" : "bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-slate-700 truncate">{row.label}</span>
                          {row.note && (
                            <span className="text-[10px] font-medium text-slate-400 truncate hidden sm:block">
                              {row.note}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-black tabular-nums ${
                            negative ? "text-emerald-600" : accent === "emerald" ? "text-emerald-600" : "text-slate-800"
                          }`}
                        >
                          {negative ? "− " : ""}Rs. {fmt(Math.abs(row.amount))}
                        </span>
                      </div>
                    );
                  })}

                  <div className="border-t border-slate-200 pt-2 mt-2 space-y-1.5">
                    <div className="flex items-center justify-between px-3 text-[11px] font-semibold text-slate-500">
                      <span>Subtotal (energy + fixed + FPA + QTA)</span>
                      <span className="tabular-nums">Rs. {fmt(result.subtotal_before_tax)}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 text-[11px] font-semibold text-slate-500">
                      <span>Gross (pre-subsidy reference)</span>
                      <span className="tabular-nums">Rs. {fmt(result.gross_total)}</span>
                    </div>
                    {result.estimated_subsidy > 0 && (
                      <div className="flex items-center justify-between px-3 text-[11px] font-bold text-emerald-600">
                        <span>Protected subsidy relief</span>
                        <span className="tabular-nums">− Rs. {fmt(result.estimated_subsidy)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-xl">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Final payable
                      </span>
                      <span className="text-sm font-black text-amber-400 tabular-nums">
                        Rs. {fmt(result.total_bill)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Math assistant */}
            <section className="calc-card rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur shadow-sm overflow-hidden">
              <button
                onClick={() => setMathOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <MessageCircle size={17} className="text-slate-900" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-slate-800">Bijli Math-Bot</p>
                    <p className="text-[10px] font-medium text-slate-400">
                      Explain every line — answered from the exact numbers above
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-black text-amber-600 ${mathOpen ? "rotate-180" : ""} transition-transform`}>
                  ▼
                </span>
              </button>

              <AnimatePresence initial={false}>
                {mathOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-slate-200"
                  >
                    {/* Deterministic proof */}
                    <div className="px-5 py-4 space-y-1.5 bg-gradient-to-b from-slate-50 to-white">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                        Step-by-step proof
                      </p>
                      {explanation.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-start gap-2"
                        >
                          <span className="w-4 h-4 mt-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{step}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Q&A */}
                    <div className="px-5 py-4 border-t border-slate-200/80">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                        Ask the Math-Bot
                      </p>
                      <div
                        ref={chatBoxRef}
                        className="bg-slate-50 rounded-xl p-3 space-y-2 max-h-52 overflow-y-auto"
                      >
                        {chatRows.map((m, i) => (
                          <div
                            key={i}
                            className={`max-w-[88%] rounded-xl px-3 py-2 text-[11px] font-medium leading-relaxed ${
                              m.role === "user"
                                ? "bg-slate-900 text-white ml-auto"
                                : "bg-white text-slate-700 border border-slate-200"
                            }`}
                          >
                            {m.text}
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold px-1">
                            <Loader2 size={12} className="animate-spin text-amber-500" /> thinking…
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendChat()}
                          placeholder='e.g. "Why is my GST this much?"'
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        />
                        <button
                          onClick={sendChat}
                          disabled={chatLoading || !chatMessage.trim()}
                          className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center disabled:opacity-40 transition-opacity cursor-pointer"
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Small labelled number input used across the tax/surcharge grid. */
function Control({
  label,
  unit,
  value,
  onChange,
  tipTitle,
  children,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  tipTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-xs font-bold text-slate-500">{label}</label>
        <InfoTip title={tipTitle}>{children}</InfoTip>
      </div>
      <div className="relative">
        <input
          type="number"
          min={0}
          step={label === "Surcharge" || label === "Electricity duty" ? 0.1 : 1}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 pr-12 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}