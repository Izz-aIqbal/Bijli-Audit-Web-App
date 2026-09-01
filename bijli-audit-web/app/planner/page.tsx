"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Sliders,
  TrendingUp,
  Snowflake,
  Tv,
  Fan,
  Info,
  Plus,
} from "lucide-react";

const SLAB_LIMIT = 200;
const COST_PER_UNIT_UNDER = 22;
const COST_PER_UNIT_OVER = 45;

export default function Planner() {
  const [currentUnits, setCurrentUnits] = useState(180);
  const [acHours, setAcHours] = useState(6);
  const [showRateInfo, setShowRateInfo] = useState(false);

  const unitsRemaining = SLAB_LIMIT - currentUnits;
  const isOverSlab = currentUnits > SLAB_LIMIT;

  const estimatedCost = isOverSlab
    ? SLAB_LIMIT * COST_PER_UNIT_UNDER + (currentUnits - SLAB_LIMIT) * COST_PER_UNIT_OVER
    : currentUnits * COST_PER_UNIT_UNDER;

  const addApplianceLoad = (extraUnits: number) => {
    setCurrentUnits((prev) => Math.min(250, prev + extraUnits));
  };

  const suggestion = isOverSlab
    ? `Warning: You crossed the ${SLAB_LIMIT}-unit protected slab by ${currentUnits - SLAB_LIMIT} units! Rate bumped to Rs. 45/unit.`
    : unitsRemaining < 20
    ? `Reduce AC usage by ~${Math.max(
        1,
        Math.round((20 - unitsRemaining) / 5)
      )} hr(s)/day to stay under your ${SLAB_LIMIT}-unit slab.`
    : `You're comfortably under your ${SLAB_LIMIT}-unit slab with ${unitsRemaining} units to spare.`;

  return (
    <main className="min-h-screen bg-slate-50/50 pt-20 px-4 sm:px-8 pb-12 max-w-5xl mx-auto">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Smart Load Planner
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Simulate monthly consumption & estimate slab tariff changes.
          </p>
        </div>
        <div className="inline-flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60 w-fit">
          <Zap className="w-3.5 h-3.5" />
          <span>Interactive Forecaster</span>
        </div>
      </motion.div>

      {/* Main Grid: 2 Columns on desktop to eliminate white space */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sliders & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6"
        >
          {/* Slider 1 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                Units Consumed
              </label>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                {currentUnits} units
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={250}
              value={currentUnits}
              onChange={(e) => setCurrentUnits(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 2 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-sky-500" />
                Daily AC Usage
              </label>
              <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {acHours} hrs/day
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={acHours}
              onChange={(e) => setAcHours(Number(e.target.value))}
              className="w-full accent-sky-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick Add Presets */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Quick Add Load (+ Units)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addApplianceLoad(15)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all active:scale-95"
              >
                <Fan className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Fan (15u)</span>
              </button>
              <button
                onClick={() => addApplianceLoad(25)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all active:scale-95"
              >
                <Tv className="w-3.5 h-3.5 text-indigo-500" />
                <span>+ TV (25u)</span>
              </button>
              <button
                onClick={() => addApplianceLoad(40)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all active:scale-95"
              >
                <Snowflake className="w-3.5 h-3.5 text-sky-500" />
                <span>+ Fridge (40u)</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Metrics & Output */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 space-y-4"
        >
          {/* Live Bill Metric */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estimated Monthly Bill
              </p>
              <h3 className="text-2xl font-black text-amber-400 mt-0.5">
                Rs. {estimatedCost.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-slate-800 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          {/* Slab Capacity Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Slab Limit ({currentUnits} / 200 kWh)</span>
              <span className={isOverSlab ? "text-rose-600 font-black" : "text-amber-600 font-black"}>
                {Math.min(100, Math.round((currentUnits / 200) * 100))}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverSlab ? "bg-rose-500" : unitsRemaining < 20 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, (currentUnits / 250) * 100)}%` }}
              />
            </div>
          </div>

          {/* Dynamic Suggestion Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              isOverSlab
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : unitsRemaining < 20
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <div className="flex items-start space-x-2.5">
              <div className="mt-0.5 shrink-0">
                {isOverSlab ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : unitsRemaining < 20 ? (
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5">
                  {isOverSlab ? "Penalty Alert" : unitsRemaining < 20 ? "Slab Warning" : "Optimal"}
                </h4>
                <p className="text-xs leading-relaxed font-medium">{suggestion}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}