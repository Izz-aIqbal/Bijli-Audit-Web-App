"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Loader2,
  Download,
} from "lucide-react";
import EmptyHistory from "@/components/EmptyHistory";
import { API_BASE } from "@/lib/apiBase";
import type { BillRecord } from "@/lib/types";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export default function HistoryPage() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "safe" | "risk">("all");

  useEffect(() => {
    fetch(`${API_BASE}/bills`)
      .then((res) => res.json())
      .then((data) => {
        const rawBills = Array.isArray(data) ? data : [];
        // Drop junk records: nothing readable was extracted and no month was captured.
        const cleanBills = rawBills
          .filter(
            (bill) =>
              Number(bill.units_consumed || 0) > 0 ||
              Number(bill.total_amount_due || 0) > 0 ||
              !["", "unknown", "undefined", "none"].includes(
                String(bill.billing_month || "").toLowerCase()
              )
          )
          .sort((a, b) => Number(b.id) - Number(a.id));
        setBills(cleanBills);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching bills:", err);
        setLoading(false);
      });
  }, []);

  const totalAudited = bills.reduce((acc, curr) => acc + (curr.total_amount_due || 0), 0);
  const avgMonthlyUnits = Math.round(
    bills.reduce((acc, curr) => acc + (curr.units_consumed || 0), 0) / (bills.length || 1)
  );

  // Real trend: newest vs oldest audited cycle (newest-first sort above).
  const trendPct =
    bills.length >= 2 && Number(bills[0]?.units_consumed || 0) > 0 && Number(bills[bills.length - 1]?.units_consumed || 0) > 0
      ? Math.round(
          ((Number(bills[0].units_consumed || 0) - Number(bills[bills.length - 1].units_consumed || 0)) /
            Number(bills[bills.length - 1].units_consumed || 0)) *
            100
        )
      : null;

  const [backupLoading, setBackupLoading] = useState(false);

  const downloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/backup`);
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bijli-audit-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup error:", err);
    } finally {
      setBackupLoading(false);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const monthStr = String(bill.billing_month || "").toLowerCase();
    const unitsStr = String(bill.units_consumed || "");
    const totalStr = String(bill.total_amount_due || "");
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      monthStr.includes(searchLower) ||
      unitsStr.includes(searchLower) ||
      totalStr.includes(searchLower);

    const flagStr = String(bill.discrepancy_flag || "");
    const isRisk =
      flagStr.includes("discrepancy") ||
      flagStr.toLowerCase().includes("risk");

    if (filterStatus === "safe") return matchesSearch && !isRisk && !flagStr.includes("Inconclusive");
    if (filterStatus === "risk") return matchesSearch && isRisk;
    return matchesSearch;
  });

  return (
    <main className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Animated Header Banner & High-level Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2"
        >
          <div>
            <div className="inline-flex items-center space-x-1.5 text-amber-500 text-xs font-bold tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Vault</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Audit Memory Bank
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1 max-w-lg">
              Track past electricity bills, detect tariff spikes, and monitor savings.
            </p>
          </div>

          {/* Metrics Summary Badge */}
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white px-5 py-3 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-center"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Audited
              </span>
              <span className="text-lg font-black text-slate-900">
                Rs. {totalAudited.toLocaleString()}
              </span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white px-5 py-3 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-center relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Avg Monthly
                </span>
                {trendPct !== null && (
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      trendPct <= 0
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-rose-600 bg-rose-50"
                    }`}
                  >
                    {trendPct <= 0 ? (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    )}
                    {trendPct >= 0 ? "+" : ""}
                    {trendPct}% since first
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-black text-amber-500">
                  {avgMonthlyUnits} <span className="text-xs font-bold text-amber-500/80">kWh</span>
                </span>

                <svg className="w-16 h-5 text-amber-400 stroke-current" viewBox="0 0 50 20" fill="none">
                  <path
                    d="M 2 16 Q 12 4, 25 12 T 48 4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>

            <button
              onClick={downloadBackup}
              disabled={backupLoading || bills.length === 0}
              className="bg-white border border-slate-200/70 shadow-xs hover:shadow-sm hover:border-amber-300 transition-all rounded-2xl px-4 py-3 flex flex-col items-start justify-center cursor-pointer"
            >
              {backupLoading ? (
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">
                Backup All
              </span>
              <span className="text-[11px] font-bold text-slate-600">ZIP export</span>
            </button>
          </div>
        </motion.div>

        {/* Animated Search Bar & Filter Controls */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search month, units, or amount..."
              className="w-full bg-slate-50 border-0 rounded-2xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilterStatus("safe")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === "safe"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              Safe
            </button>

            <button
              onClick={() => setFilterStatus("risk")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterStatus === "risk"
                  ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                  : "bg-slate-100 text-slate-600 border-transparent hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
              }`}
            >
              Risk Flagged
            </button>
          </div>
        </motion.div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-amber-500" size={36} />
          </div>
        ) : filteredBills.length === 0 ? (
          <EmptyHistory />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredBills.map((bill) => {
                const flag = String(bill.discrepancy_flag || "");
                const isDiscrepancy =
                  flag.includes("discrepancy") || flag.toLowerCase().includes("risk");
                const isInconclusive = flag.includes("Inconclusive");

                return (
                  <motion.div
                    key={bill.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  >
                    <Link
                      href={`/history/${bill.id}`}
                      className="block group bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
                    >
                      {/* Top Accent Line */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1.5 ${
                          isDiscrepancy ? "bg-amber-500" : isInconclusive ? "bg-slate-400" : "bg-teal-400"
                        }`}
                      />

                      {/* Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                            ID #{bill.id}
                          </span>
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-500 transition-colors">
                            {bill.billing_month || "Unknown Month"}
                          </h3>
                        </div>

                        <div
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isDiscrepancy
                              ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                              : isInconclusive
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                          }`}
                        >
                          {isDiscrepancy ? (
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                          ) : isInconclusive ? (
                            <Sparkles className="w-3 h-3 mr-1 text-slate-500" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                          )}
                          {isDiscrepancy ? "Discrepancy" : isInconclusive ? "Inconclusive" : "Verified"}
                        </div>
                      </div>

                      {/* Content Metrics */}
                      <div className="py-4 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Usage
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {bill.units_consumed} kWh
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-slate-400" /> Total Billed
                          </span>
                          <span className="font-extrabold text-slate-900">
                            Rs. {Number(bill.total_amount_due).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Footer Callout */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-500 group-hover:text-amber-600">
                        <span>Full Audit Breakdown</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}