"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders,
  Zap,
  TrendingUp,
  CheckCircle2,
  Tv,
  Fan,
  Snowflake,
  Sparkles,
  ShieldAlert,
  CalendarClock,
  Download,
  Loader2,
} from "lucide-react";
import AnimatedNumber from "@/components/AnimatedNumber";
import { API_BASE } from "@/lib/apiBase";

interface SlabLine {
  range: string;
  units: number;
  rate: number;
  cost: number;
}

interface BillEstimate {
  units: number;
  phase: string;
  slab_limit: number;
  applied_category: string;
  breakdown: SlabLine[];
  base_cost: number;
  fixed_charges: number;
  electricity_duty: number;
  gst: number;
  gross_total: number;
  estimated_subsidy: number;
  total_bill: number;
}

export default function PlannerPage() {
  const [units, setUnits] = useState(180);
  const [acHours, setAcHours] = useState(6);
  const [phase, setPhase] = useState<"single" | "three">("single");
  const [estimate, setEstimate] = useState<BillEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced fetch against the real tariff rules engine.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/calculate-bill`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ units, phase }),
        });
        if (!res.ok) throw new Error("Bad response");
        setEstimate(await res.json());
        setOffline(false);
      } catch {
        setOffline(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [units, phase]);

  const handleRecalculate = () => setLoading(true);

  const slabLimit = estimate?.slab_limit ?? 200;
  const isProtected = units <= slabLimit;
  const slabPercentage = Math.min(Math.round((units / slabLimit) * 100), 100);
  const unitsToLimit = Math.max(slabLimit - units, 0);

  const handleAddUnits = (amount: number) => {
    handleRecalculate();
    setUnits((prev) => Math.min(prev + amount, 500));
  };

  const handleExport = () => {
    if (!estimate) return;
    const lines = [
      `BijliAudit - Smart Load Planner (${new Date().toLocaleDateString()})`,
      `Units: ${estimate.units} kWh | Phase: ${phase} | Category: ${estimate.applied_category}`,
      ``,
      `Slab breakdown:`,
      ...estimate.breakdown.map(
        (s) => `  ${s.range} units @ Rs. ${s.rate} = Rs. ${s.cost.toLocaleString()}`
      ),
      ``,
      `Base energy: Rs. ${estimate.base_cost.toLocaleString()}`,
      `Fixed: Rs. ${estimate.fixed_charges.toLocaleString()}`,
      `GST: Rs. ${estimate.gst.toLocaleString()}`,
      `Duty: Rs. ${estimate.electricity_duty.toLocaleString()}`,
      `Subsidy: Rs. ${estimate.estimated_subsidy.toLocaleString()}`,
      `PAYABLE: Rs. ${estimate.total_bill.toLocaleString()}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bijli-audit-planner.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans pt-24 sm:pt-28 pb-16 relative">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-8 relative z-10">
        {/* Header Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-amber-500" /> Dynamic Forecaster
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Smart Load Planner
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Simulate monthly consumption on the live NEPRA slab schedule — see the 200-unit protected jump before it happens.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs self-start sm:self-auto">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="text-xs font-bold text-slate-700">
              Protected Ceiling: &le;{slabLimit} units
            </span>
          </div>
        </motion.div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls Card (7 Columns) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg shadow-slate-200/40 space-y-8"
          >
            {/* Units Slider Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={15} className="text-amber-500" />
                  Monthly Units Consumed
                </label>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={units}
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    className={`text-base font-black px-3 py-1 rounded-xl border ${
                      isProtected
                        ? "bg-amber-100/70 text-slate-900 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {units} <span className="text-xs font-semibold opacity-80">units</span>
                  </motion.span>
                </AnimatePresence>
              </div>

              <input
                type="range"
                min="50"
                max="450"
                value={units}
                onChange={(e) => {
                  handleRecalculate();
                  setUnits(Number(e.target.value));
                }}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer slider-range"
              />

              <div className="flex justify-between text-[11px] font-semibold text-slate-400 font-mono">
                <span>50u (Protected)</span>
                <span className="text-amber-600 font-bold">200u Limit</span>
                <span>450u (Unprotected)</span>
              </div>
            </div>

            {/* Daily AC Hours Slider */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Snowflake size={15} className="text-sky-500" />
                  Estimated Daily Inverter AC Usage
                </label>
                <motion.span
                  key={acHours}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-base font-black text-slate-900 bg-sky-50 border border-sky-200 px-3 py-1 rounded-xl"
                >
                  {acHours} <span className="text-xs font-semibold text-sky-700">hrs/day</span>
                </motion.span>
              </div>

              <input
                type="range"
                min="0"
                max="18"
                value={acHours}
                onChange={(e) => {
                  const newHours = Number(e.target.value);
                  const delta = (newHours - acHours) * 15;
                  handleRecalculate();
                  setAcHours(newHours);
                  setUnits((prev) => Math.max(50, Math.min(500, prev + delta)));
                }}
                className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[11px] text-slate-400 font-medium">
                ~1.5 kWh per hour — each AC hour moves the meter about 15 units.
              </p>
            </div>

            {/* Phase Toggle */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Connection Phase (Fixed Charge)
              </span>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200/80">
                {(["single", "three"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      handleRecalculate();
                      setPhase(p);
                    }}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                      phase === p
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}-Phase
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Add Load Appliance Chips */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Quick Add Monthly Appliance Load (+Units)
              </span>

              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddUnits(15)}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 transition-all text-xs font-bold text-slate-700 cursor-pointer group"
                >
                  <Fan size={16} className="text-amber-500 group-hover:rotate-45 transition-transform" />
                  <span>+ Fan (15u)</span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddUnits(25)}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 transition-all text-xs font-bold text-slate-700 cursor-pointer group"
                >
                  <Tv size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span>+ TV (25u)</span>
                </motion.button>

                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddUnits(40)}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 transition-all text-xs font-bold text-slate-700 cursor-pointer group"
                >
                  <Snowflake size={16} className="text-sky-500 group-hover:scale-110 transition-transform" />
                  <span>+ Fridge (40u)</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Right Forecast Display Cards (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Billed Stat Box */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden space-y-4"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <TrendingUp size={120} className="text-amber-400" />
              </div>

              <div className="flex items-center justify-between relative">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                  Estimated Payable Bill
                </span>
                <AnimatePresence>
                  {loading && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"
                    >
                      <Loader2 size={12} className="animate-spin" /> recalculating
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-baseline gap-2 relative">
                {estimate ? (
                  <AnimatedNumber
                    prefix="Rs. "
                    value={estimate.total_bill}
                    className="text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums"
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-600">
                    Rs. —
                  </span>
                )}
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    isProtected
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {estimate?.applied_category ?? "…"}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross (pre-subsidy)</span>
                  <span className="text-slate-200 font-bold tabular-nums">
                    Rs. {estimate?.gross_total.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subsidy relief</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    − Rs. {estimate?.estimated_subsidy.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Phase</span>
                  <span className="text-slate-300 font-semibold capitalize">{phase}-phase</span>
                </div>
              </div>
            </motion.div>

            {/* Slab Meter Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md shadow-slate-200/40 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Protected Capacity ({units} / {slabLimit} kWh)</span>
                <span className={isProtected ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                  {slabPercentage}%
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                <motion.div
                  key={`${isProtected}-${slabPercentage}`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(slabPercentage, 100)}%` }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    isProtected
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                      : "bg-gradient-to-r from-amber-500 to-rose-500"
                  }`}
                />
              </div>

              <AnimatePresence mode="wait">
                {isProtected ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-900 space-y-1 mt-3"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <CheckCircle2 size={16} />
                      <span>Optimal Consumption Zone</span>
                    </div>
                    <p className="text-emerald-800/80 text-[11px] leading-relaxed">
                      You are comfortably under your {slabLimit}-unit slab with{" "}
                      <strong>{unitsToLimit} units</strong> to spare before tariff escalation.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="warn"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-900 space-y-1 mt-3"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-rose-700">
                      <ShieldAlert size={16} />
                      <span>Slab Warning: Tariff Jump Imminent</span>
                    </div>
                    <p className="text-rose-700/80 text-[11px] leading-relaxed">
                      You crossed the {slabLimit}-unit limit! The whole consumption now re-rates
                      at the higher unprotected schedule.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Slab Breakdown Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg shadow-slate-200/40"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">NEPRA Tariff Breakdown</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Every unit priced at the active slab rate you&apos;d actually pay
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={!estimate || offline}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} className="text-amber-400" /> Export Estimate
            </motion.button>
          </div>

          {offline ? (
            <div className="text-center py-10 text-xs text-slate-500 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Backend offline — start <code className="font-mono">uvicorn main:app</code> on port 8000 to get live tariff math.
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={estimate?.units ?? "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {estimate?.breakdown.map((slab, i) => {
                  const maxCost = Math.max(
                    ...estimate.breakdown.map((s) => s.cost),
                    1
                  );
                  return (
                    <motion.div
                      key={slab.range}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors"
                    >
                      <div className="w-24 shrink-0">
                        <span className="text-[11px] font-extrabold text-slate-700 font-mono">
                          {slab.range}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-semibold">
                          {slab.units} units @ Rs. {slab.rate}
                        </span>
                      </div>
                      <div className="flex-1 h-2.5 bg-slate-200/70 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(slab.cost / maxCost) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                        />
                      </div>
                      <span className="w-24 text-right text-xs font-black text-slate-800 tabular-nums">
                        Rs. {slab.cost.toLocaleString()}
                      </span>
                    </motion.div>
                  );
                })}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  {[
                    { label: "Base Energy", value: estimate?.base_cost ?? 0 },
                    { label: "Fixed Charge", value: estimate?.fixed_charges ?? 0 },
                    { label: "GST (18%)", value: estimate?.gst ?? 0 },
                    { label: "Electricity Duty", value: estimate?.electricity_duty ?? 0 },
                  ].map((row, i) => (
                    <motion.div
                      key={row.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-white"
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {row.label}
                      </p>
                      <p className="text-sm font-black text-slate-900 tabular-nums mt-0.5">
                        Rs. {row.value.toLocaleString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium text-center"
        >
          <CalendarClock size={13} />
          Estimates use the live NEPRA slab schedule. Final billing varies with fuel price adjustment (FPA) each month.
        </motion.p>
      </main>
    </div>
  );
}