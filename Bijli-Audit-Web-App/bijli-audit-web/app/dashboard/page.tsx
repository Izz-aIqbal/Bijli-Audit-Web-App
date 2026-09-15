"use client";

import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import HealthBar from "@/components/HealthBar";
import ConsumptionChart from "@/components/ConsumptionChart";
import AnimatedNumber from "@/components/AnimatedNumber";
import { Zap, TrendingUp, DollarSign, Download, Loader2, ShieldCheck, Flame } from "lucide-react";
import { exportElementToPdf } from "@/lib/exportPdf";
import { API_BASE } from "@/lib/apiBase";
import Link from "next/link";
import type { BillRecord } from "@/lib/types";

export default function Dashboard() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/bills`)
      .then((res) => res.json())
      .then((data) => {
        setBills(Array.isArray(data) ? data.filter((b) => b.id) : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching bills:", err);
        setLoading(false);
      });
  }, []);

  const latestBill = bills.length > 0 ? bills[bills.length - 1] : null;
  const recent = bills.slice(-6);

  const lastPeriodUnits = recent.length >= 2 ? recent[recent.length - 2]?.units_consumed || 0 : 0;
  const currentUnits = latestBill?.units_consumed || 0;
  const monthlyAverage = recent.length
    ? Math.round(recent.reduce((acc, b) => acc + (b.units_consumed || 0), 0) / recent.length)
    : 0;

  const monthsUnder200 = recent.filter((b) => (b.units_consumed || 0) <= 200).length;

  const pctChange = lastPeriodUnits > 0
    ? Math.round(((currentUnits - lastPeriodUnits) / lastPeriodUnits) * 100)
    : 0;

  const stats = [
    {
      label: "Current Bill Amount",
      rawValue: latestBill ? Number(latestBill.total_amount_due || 0) : 0,
      prefix: "Rs. ",
      suffix: "",
      change: latestBill
        ? `${pctChange >= 0 ? "+" : ""}${pctChange}% vs last audited bill`
        : "No bills audited yet",
      isWarning: pctChange > 10,
      icon: DollarSign,
    },
    {
      label: "Units This Cycle",
      rawValue: currentUnits,
      prefix: "",
      suffix: " Units",
      change: latestBill
        ? currentUnits <= 200
          ? `${200 - currentUnits} units under Protected limit`
          : `${currentUnits - 200} units over Protected limit`
        : "Upload a bill to get started",
      isWarning: currentUnits > 200,
      icon: Zap,
    },
    {
      label: "Avg Units (Last 6)",
      rawValue: monthlyAverage,
      prefix: "",
      suffix: " Units",
      change: monthlyAverage <= 200 ? "On track for Protected tariff" : "Average above Protected limit",
      isWarning: monthlyAverage > 200,
      icon: TrendingUp,
    },
  ];

  // Animation Variant Configurations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.97 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 } 
    },
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 pt-24 px-6 pb-16 w-full relative overflow-hidden">
      
      {/* Background Ambient Glow Animations */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-10 w-96 h-96 bg-[#F2A93B]/10 rounded-full blur-3xl pointer-events-none -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-10 w-96 h-96 bg-slate-300/40 rounded-full blur-3xl pointer-events-none -z-10" 
      />

      {/* Container to be exported into Branded PDF */}
      <motion.div 
        id="audit-summary-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6 relative z-10 bg-slate-100 p-2 rounded-3xl"
      >
        
        {/* Header with Export Button */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-3xl font-extrabold text-[#0F172A] tracking-tight"
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-sm font-semibold text-slate-600 mt-1"
            >
              Monitor your electricity consumption, tariff status, and bill estimates.
            </motion.p>
          </div>

          {/* Export Audit Summary PDF Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => exportElementToPdf("audit-summary-content", "MEPCO_Audit_Summary")}
            className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
          >
            <Download size={15} className="text-amber-400" />
            <span>Export Audit Summary</span>
          </motion.button>
        </motion.div>

        {/* Top KPI Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        ) : !latestBill ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-10 text-center space-y-4">
            <h3 className="text-lg font-black text-slate-900">No audited bills yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your dashboard will populate automatically once you upload and audit your first MEPCO bill.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              <Zap size={14} className="fill-amber-500 text-amber-500" />
              Audit My First Bill
            </Link>
          </div>
        ) : (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                whileHover={{ 
                  y: -6, 
                  scale: 1.02,
                  boxShadow: "0px 12px 24px -6px rgba(15, 23, 42, 0.12)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 flex items-start justify-between group cursor-pointer relative overflow-hidden"
              >
                {/* Micro Hover Flare Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
                  <AnimatedNumber
                    value={s.rawValue}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    className="text-2xl font-black text-[#0F172A] mt-1 tabular-nums"
                  />
                  <p className={`text-xs font-semibold mt-1.5 ${s.isWarning ? "text-amber-600" : "text-emerald-600"}`}>
                    {s.change}
                  </p>
                </div>

                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="p-2.5 bg-slate-100 rounded-xl text-[#0F172A] border border-slate-200/60 group-hover:bg-[#0F172A] group-hover:text-white transition-colors duration-300"
                >
                  <Icon size={20} />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
        )}

        {/* Protected Status Health Bar */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.005 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <HealthBar monthsUnder200={monthsUnder200} />
        </motion.div>

        {/* Protected Streak Timeline */}
        {recent.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0F172A]">Protected Streak</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Last {recent.length} cycles vs the 200-unit ceiling
                  </p>
                </div>
              </div>
              {monthsUnder200 === recent.length && recent.length > 0 ? (
                <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <Flame size={13} className="text-emerald-500" />
                  {monthsUnder200}-cycle safe streak
                </span>
              ) : (
                <span className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {monthsUnder200}/{recent.length} under the line
                </span>
              )}
            </div>

            <div className="flex items-end justify-between gap-2 sm:gap-3 relative">
              {/* 200-unit reference line */}
              <div className="absolute inset-x-0 top-0 -translate-y-2 h-px bg-slate-200" />
              {recent.map((b, i) => {
                const units = Number(b.units_consumed || 0);
                const safe = units <= 200;
                const maxBar = 240;
                const barHeight = Math.max(6, Math.min((units / maxBar) * 140, 140));
                const label = String(b.billing_month || "?").split(" ")[0].slice(0, 3) || `#${i}`;
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 transition-colors tabular-nums">
                      {units}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: barHeight }}
                      transition={{ type: "spring", bounce: 0.35, delay: 0.3 + i * 0.08 }}
                      className={`w-full max-w-10 rounded-t-lg transition-colors ${
                        safe
                          ? "bg-gradient-to-t from-emerald-400 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-500"
                          : "bg-gradient-to-t from-amber-500 to-rose-500 group-hover:from-amber-600 group-hover:to-rose-600"
                      }`}
                    />
                    <span className="text-[10px] font-bold text-slate-500">{label}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Consumption Chart */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.005 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <ConsumptionChart
            data={recent.map((b) => ({
              month: String(b.billing_month || "?").split(" ")[0].slice(0, 3),
              units: Number(b.units_consumed || 0),
            }))}
          />
        </motion.div>

      </motion.div>
    </main>
  );
}