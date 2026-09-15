"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function HealthBar({
  monthsUnder200,
  target = 6,
}: {
  monthsUnder200: number;
  target?: number;
}) {
  const percent = Math.min((monthsUnder200 / target) * 100, 100);
  const safe = monthsUnder200 >= target;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#1f3a6e] text-lg">Protected Tariff Status</h3>
            {safe ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={14} /> Protected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle size={14} /> In Progress
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Keep usage ≤200 units/month for 6 consecutive cycles to unlock lower subsidized rates.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-sm font-extrabold text-[#1f3a6e]">
            {monthsUnder200} / {target} <span className="text-xs text-slate-500 font-normal">Months</span>
          </span>
        </div>
      </div>

      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-full rounded-full ${
            safe ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-500"
          }`}
        />
      </div>

      <div className="mt-3 flex justify-between items-center text-xs font-medium text-slate-600">
        <span>Current Streak: {monthsUnder200} months</span>
        <span>{Math.max(0, target - monthsUnder200)} more month(s) required</span>
      </div>
    </div>
  );
}