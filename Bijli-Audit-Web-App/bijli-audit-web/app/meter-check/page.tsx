"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  Loader2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Upload,
  Gauge,
  Zap,
  RefreshCw,
} from "lucide-react";
import type { BillRecord } from "@/lib/types";
import { API_BASE } from "@/lib/apiBase";

type Flag = "Match" | "Mismatch" | "Inconclusive";

interface MeterResult {
  meter_reading: string | null;
  stated_reading: string | null;
  bill_id: number | null;
  billing_month: string | null;
  flag: Flag;
  explanation: string;
}

export default function MeterCheckPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>("latest");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/bills`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBills(
            data
              .filter(
                (bill) =>
                  Number(bill.units_consumed || 0) > 0 ||
                  Number(bill.total_amount_due || 0) > 0
              )
              .sort((a, b) => Number(b.id) - Number(a.id))
              .reverse()
              .slice(0, 8)
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    void runCheck(file);
  };

  const runCheck = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const billId = selectedBillId !== "latest" ? Number(selectedBillId) : undefined;
      const query = billId ? `?bill_id=${billId}` : "";
      const res = await fetch(`${API_BASE}/api/v1/meter-check${query}`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail || "Meter check failed.");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meter check failed.");
    } finally {
      setLoading(false);
    }
  };

  const flagStyle: Record<Flag, string> = {
    Match: "bg-emerald-50 border-emerald-200 text-emerald-700",
    Mismatch: "bg-rose-50 border-rose-200 text-rose-700",
    Inconclusive: "bg-amber-50 border-amber-200 text-amber-700",
  };
  const flagIcon: Record<Flag, React.ReactNode> = {
    Match: <CheckCircle2 size={16} className="text-emerald-600" />,
    Mismatch: <AlertTriangle size={16} className="text-rose-600" />,
    Inconclusive: <HelpCircle size={16} className="text-amber-600" />,
  };

  return (
    <main className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
            <ScanLine className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 text-amber-500 text-xs font-bold tracking-wider uppercase mb-0.5">
              <Gauge className="w-3.5 h-3.5" />
              <span>Live Meter Check</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Meter-Photo Anomaly Check
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Photograph your physical meter and compare its reading against your last audited bill.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5"
        >
          {/* Compare-against selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
              Compare with
            </label>
            <div className="relative flex-1">
              <select
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
              >
                <option value="latest">Latest audited bill</option>
                {bills.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.billing_month || `Bill #${b.id}`} • {b.units_consumed} kWh • #{b.id}
                  </option>
                ))}
              </select>
              <RefreshCw
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Drop / capture */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              preview
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-300 bg-slate-50/50 hover:border-amber-300 hover:bg-amber-50/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFile(e.target.files?.[0])}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={(e) => handleFile(e.target.files?.[0])}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {preview ? (
              <img
                src={preview}
                alt="Meter preview"
                className="mx-auto max-h-64 rounded-xl object-contain shadow-sm"
              />
            ) : (
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 flex items-center justify-center shadow-md mb-3">
                  <Camera className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">
                  Drop a meter photo here, or click to browse
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  A clear close-up of the digital display gives the best read.
                </p>
              </>
            )}

            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Upload size={14} className="text-amber-400" />
                {preview ? "Change photo" : "Choose photo"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:border-amber-300 transition-colors flex items-center gap-2"
              >
                <Zap size={14} className="text-amber-500" />
                Use camera
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 py-2">
              <Loader2 size={16} className="animate-spin text-amber-500" />
              Reading digits off your meter...
            </div>
          )}

          {error && (
            <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </motion.div>

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${flagStyle[result.flag]}`}
          >
            <div className="flex items-center gap-3">
              {flagIcon[result.flag]}
              <h2 className="text-xl font-black text-slate-900">
                {result.flag === "Match" && "Readings Match"}
                {result.flag === "Mismatch" && "Anomaly Detected"}
                {result.flag === "Inconclusive" && "Could Not Compare"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Meter photo reads
                </span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  {result.meter_reading ?? "—"}
                </p>
              </div>
              <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Bill states
                </span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  {result.stated_reading ?? "—"}
                </p>
              </div>
            </div>

            {result.billing_month && (
              <p className="text-xs font-semibold text-slate-500">
                Compared against {result.billing_month} (bill #{result.bill_id}).
              </p>
            )}

            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {result.explanation}
            </p>

            {result.flag === "Mismatch" && (
              <Link
                href="/history"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-colors"
              >
                <AlertTriangle size={14} className="text-amber-400" />
                Review your bills
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}