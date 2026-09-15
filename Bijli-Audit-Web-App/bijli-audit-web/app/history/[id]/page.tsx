"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import type { BillRecord } from "@/lib/types";
import AnimatedNumber from "@/components/AnimatedNumber";
import { API_BASE } from "@/lib/apiBase";
import { exportElementToPdf } from "@/lib/exportPdf";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  FileText,
  Download,
  ArrowRight,
  Receipt,
  Loader2,
  User,
  Hash,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

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
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function BillDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawId = resolvedParams.id;

  const [bill, setBill] = useState<BillRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/bills/${rawId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Bill not found");
        return res.json();
      })
      .then((data) => {
        setBill(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching bill details:", err);
        setError(true);
        setLoading(false);
      });
  }, [rawId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-500" size={36} />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Audit Record Not Found
        </h2>
        <p className="text-sm font-medium text-slate-500 mb-6">
          The requested bill audit ID #{rawId} could not be retrieved.
        </p>
        <Link
          href="/history"
          className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-slate-900 px-4 py-2.5 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to History</span>
        </Link>
      </div>
    );
  }

  const isDiscrepancy =
    bill.discrepancy_flag === "Possible discrepancy" ||
    String(bill.discrepancy_flag || "").toLowerCase().includes("risk");

  const isInconclusive = String(bill.discrepancy_flag || "").includes("Inconclusive");

  const structured = (() => {
    try {
      const parsed = bill.structured_json ? JSON.parse(bill.structured_json) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  })();

  const units = bill.units_consumed || 0;
  const totalAmount = bill.total_amount_due || 0;
  const appliedCategory = structured.applied_category || (units <= 200 ? "Protected" : "Unprotected");

  const energyCharge = Number(structured.energy_charges || 0);
  const calculatedEnergy = Number(structured.calculated_energy_charge || 0);
  const calculatedTotal = Number(structured.calculated_total || 0);
  const fpa = Number(structured.fpa || 0);
  const qta = Number(structured.qta || 0);
  const tvFee = Number(structured.tv_fee || 0);
  const gst = Number(structured.gst || 0);
  const electricityDuty = Number(structured.electricity_duty || 0);

  const breakdownLines: { label: string; value: number; highlight?: string; disputed?: boolean }[] =
    [];
  if (energyCharge > 0)
    breakdownLines.push({
      label: "Base Energy Charges",
      value: energyCharge,
      disputed: false,
    });
  if (calculatedEnergy > 0 && calculatedEnergy !== energyCharge) {
    breakdownLines.push({
      label: `Expected Energy (NEPRA ${appliedCategory.toLowerCase()})`,
      value: calculatedEnergy,
      highlight: "Expected",
    });
  }
  if (fpa > 0)
    breakdownLines.push({ label: "Fuel Cost Adjustment (FCA)", value: fpa, disputed: isDiscrepancy });
  if (qta > 0) breakdownLines.push({ label: "Quarterly Tariff Adjustment (QTA)", value: qta });
  if (tvFee > 0) breakdownLines.push({ label: "PTV License Fee", value: tvFee });
  if (gst > 0) breakdownLines.push({ label: "General Sales Tax (GST 18%)", value: gst });
  if (electricityDuty > 0)
    breakdownLines.push({ label: "Electricity Duty", value: electricityDuty });
  if (calculatedTotal > 0) {
    breakdownLines.push({
      label: "Expected Grand Total (NEPRA)",
      value: calculatedTotal,
      highlight: "Expected",
    });
  }

  const breakdownTotal = breakdownLines.reduce((a, b) => a + b.value, 0);

  return (
    <>
      {/* Global CSS Print Styles to Isolate Content */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          footer,
          .print\\:hidden {
            display: none !important;
          }

          body,
          html {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            padding: 24px !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className="print-container min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50 flex flex-col font-sans pt-36 sm:pt-40 pb-20">
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6">
          {/* Back Navigation Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex items-center justify-between print:hidden"
          >
            <Link
              href="/history"
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-amber-600 bg-white border border-slate-200/90 px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md hover:-translate-x-0.5 transition-all group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-500" />
              <span>Return to History</span>
            </Link>

            <span className="text-[11px] font-semibold text-slate-400 font-mono">
              AUDIT_REF: #BA-2026-00{bill.id}
            </span>

            <button
              onClick={() => {
                setPdfLoading(true);
                exportElementToPdf("audit-report", `bijli-audit-${bill.billing_month || bill.id}`).finally(() =>
                  setPdfLoading(false)
                );
              }}
              disabled={pdfLoading}
              className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all group cursor-pointer"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Download className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
              )}
              <span>{pdfLoading ? "Building PDF..." : "Download Audit PDF"}</span>
            </button>
          </motion.div>

          {/* Main Audit Card */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            id="audit-report"
            className="print-card bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/60 relative overflow-hidden space-y-8"
          >
            {/* Top Accent Bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className={`absolute top-0 left-0 right-0 h-2 origin-left ${
                isDiscrepancy
                  ? "bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500"
                  : "bg-gradient-to-r from-emerald-400 to-teal-500"
              }`}
            />

            {/* Header Row */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold tracking-wider text-amber-600 uppercase px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 flex items-center gap-1">
                    <FileText size={12} /> VERIFIED AUDIT REPORT
                  </span>
                  <span className="text-xs text-slate-400">
                    • {bill.billing_month || "Billing Record"}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
                  {bill.billing_month || "Month"} Detailed Breakdown
                </h1>

                {/* Consumer + Reference identity chips */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {structured.consumer_name ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                      <User size={11} className="text-slate-400" />
                      {structured.consumer_name}
                    </span>
                  ) : null}
                  {structured.reference_number ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg font-mono">
                      <Hash size={11} className="text-slate-400" />
                      REF {structured.reference_number}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Status Pill */}
              {isDiscrepancy ? (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-800 text-xs font-bold shadow-xs self-start sm:self-auto"
                >
                  <AlertTriangle size={15} className="text-amber-600" />
                  <span>Action Recommended: Discrepancy Found</span>
                </motion.div>
              ) : isInconclusive ? (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs self-start sm:self-auto"
                >
                  <AlertTriangle size={15} className="text-slate-500" />
                  <span>Verification Inconclusive</span>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs self-start sm:self-auto"
                >
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>NEPRA Rate Compliant</span>
                </motion.div>
              )}
            </motion.div>

            {/* Metrics Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 text-white relative overflow-hidden">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Billed
                </span>
                <AnimatedNumber
                  prefix="Rs. "
                  value={Number(totalAmount)}
                  className="text-3xl font-black tracking-tight text-white tabular-nums"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Inclusive of all taxes</span>
                  <Receipt size={14} className="text-amber-400 opacity-80" />
                </div>
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Units Consumed
                </span>
                <p className="text-3xl font-black text-slate-900 tracking-tight">
                  {units} <span className="text-base font-semibold text-slate-500">kWh</span>
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Recorded Meter Delta</span>
                  <Zap size={14} className="text-amber-500" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Slab Bracket
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {appliedCategory}
                  {units <= 200 ? " (0-200)" : " (>200)"}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <ShieldCheck size={14} /> Safe Tariff Protection Applied
                </div>
              </div>
            </motion.div>

            {/* Tax & Fee Itemized Breakdown */}
            <motion.div variants={itemVariants} className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Receipt size={15} className="text-amber-500" />
                  Audited Tax & Fee Breakdown
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Calculated against NEPRA Standard Rules
                </span>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl divide-y divide-slate-200/60 text-xs overflow-hidden">
                {breakdownLines.length > 0 ? (
                  <>
                    {breakdownLines.map((line, i) => (
                      <div
                        key={i}
                        className="p-4 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          {line.label}
                          {line.disputed && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                              Under Dispute
                            </span>
                          )}
                        </span>
                        <span
                          className={`font-bold ${
                            line.highlight === "Expected"
                              ? "text-emerald-600"
                              : line.disputed
                              ? "text-amber-600"
                              : "text-slate-900"
                          }`}
                        >
                          {line.highlight === "Expected"
                            ? `Rs. ${line.value.toLocaleString()}`
                            : `Rs. ${Number(line.value).toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                    {breakdownTotal > 0 && totalAmount > 0 && (
                      <div className="p-4 flex items-center justify-between bg-slate-100/60">
                        <span className="font-bold text-slate-800">
                          Sum of Itemized Charges
                        </span>
                        <span className="font-black text-slate-900">
                          Rs. {breakdownTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 font-medium">
                    No itemized charges could be read from this bill. Only the
                    billed total is available.
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Row */}
            <motion.div
              variants={itemVariants}
              className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400"
            >
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span>
                  Audit Status: <strong className="text-slate-700">{bill.discrepancy_flag || "Verified"}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end print:hidden">
                {isDiscrepancy && (
                  <Link
                    href={`/dispute/${rawId}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <AlertTriangle size={15} />
                    <span>Generate Dispute Letter</span>
                    <ArrowRight size={14} />
                  </Link>
                )}

                <button
                  onClick={() => typeof window !== "undefined" && window.print()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Download size={15} />
                  <span>Export Audit Summary</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </>
  );
}