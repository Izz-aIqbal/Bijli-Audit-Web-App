"use client";

import React, { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Receipt,
  Calendar,
  Zap,
  TrendingDown,
  FileCheck,
  Download,
} from "lucide-react";
import { mockBills } from "@/components/mockBills";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BillDetailPage({ params }: PageProps) {
  // Unwrap Next.js dynamic params safely
  const resolvedParams = use(params);
  const rawId = resolvedParams.id;

  // Find exact bill by ID match or fallback to array index
  const billIndex = parseInt(rawId, 10) - 1;
  const bill =
    mockBills.find((b) => String(b.id) === String(rawId)) ||
    (!isNaN(billIndex) && mockBills[billIndex] ? mockBills[billIndex] : mockBills[0]);

  const isDiscrepancy = !bill.status.includes("No discrepancy");

  const handleExport = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          header,
          nav,
          footer,
          button,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-slate-50/50 pb-20 pt-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="print:hidden"
          >
            <Link
              href="/history"
              className="inline-flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-amber-500 bg-white border border-slate-200/80 px-4 py-2 rounded-full shadow-xs hover:shadow-md transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-500" />
              <span>Back to History</span>
            </Link>
          </motion.div>

          {/* Detailed Audit Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden print:shadow-none print:border-none print:p-0"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-2 ${
                isDiscrepancy
                  ? "bg-gradient-to-r from-amber-400 to-rose-500"
                  : "bg-gradient-to-r from-emerald-400 to-teal-500"
              }`}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold tracking-wider uppercase mb-1">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Verified Audit Report</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {bill.month}
                </h1>
              </div>

              <div
                className={`inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold shadow-sm ${
                  isDiscrepancy
                    ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                }`}
              >
                {isDiscrepancy ? (
                  <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                )}
                {bill.status}
              </div>
            </div>

            {/* Dynamic Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-amber-500/20">
                <div className="flex items-center justify-between text-amber-600 text-xs font-bold">
                  <span>Total Amount</span>
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-slate-900 mt-2">
                  Rs. {bill.total.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Billed to Consumer</span>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Consumption</span>
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 mt-2">
                  {bill.units} <span className="text-sm font-bold text-slate-400">kWh</span>
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Recorded Meter Usage</span>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Tariff Status</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-base font-extrabold text-slate-800 mt-2">
                  {bill.tariffSlab || "Protected (101-200)"}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Safe from overcharge
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4">
                <FileCheck className="w-4 h-4 text-amber-500" />
                Itemized Tax & Fee Audit Breakdown
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3.5 bg-slate-50/80 rounded-xl text-sm font-medium text-slate-700">
                  <span className="text-slate-500">Fuel Cost Adjustment (FC Surcharge)</span>
                  <span className="font-bold text-slate-900">Rs. {bill.taxes?.fcSurcharge ?? 240}</span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-slate-50/80 rounded-xl text-sm font-medium text-slate-700">
                  <span className="text-slate-500">Government TV License Fee</span>
                  <span className="font-bold text-slate-900">Rs. {bill.taxes?.tvFee ?? 35}</span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-slate-50/80 rounded-xl text-sm font-medium text-slate-700">
                  <span className="text-slate-500">General Sales Tax (GST)</span>
                  <span className="font-bold text-slate-900">Rs. {bill.taxes?.gst ?? 620}</span>
                </div>
              </div>
            </div>

            {/* Actions & Dates */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center space-x-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Issue Date: <strong className="text-slate-600">{bill.issueDate || "05 Aug 2026"}</strong>
                </span>
                <span>•</span>
                <span>
                  Due Date: <strong className="text-slate-600">{bill.dueDate || "18 Aug 2026"}</strong>
                </span>
              </div>

              {/* Action Buttons Container */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {!bill.status.includes("No discrepancy") && (
                  <Link
                    href={`/dispute/${bill.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold transition-all shadow-md shadow-amber-500/20 active:scale-95 text-xs print:hidden"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Generate Dispute Letter →</span>
                  </Link>
                )}

                <button
                  onClick={handleExport}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 text-white font-bold transition-all shadow-md shadow-slate-900/10 active:scale-95 text-xs print:hidden"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Audit Summary</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}