"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ShieldCheck,
  FileSearch,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Gauge,
  FileText,
  Coins,
  Landmark,
  Activity,
  Camera,
  Calculator,
} from "lucide-react";
import UploadErrorState from "@/components/UploadErrorState";
import AnimatedNumber from "@/components/AnimatedNumber";
import { API_BASE } from "@/lib/apiBase";

interface ExtractionResult {
  id?: number;
  billing_month?: string;
  units_consumed?: number;
  applied_category?: string;
  total_amount_due?: number;
  discrepancy_flag?: string;
  consumer_name?: string;
}

const TICKER_FACTS = [
  "Protected slab: Rs 7.74 / kWh up to 200 units",
  "Protected slab: Rs 13.01 / kWh for 101-200 units",
  "Cross 200 units and the whole bill re-rates at unprotected rates",
  "GST 18% applies on charges after subsidy relief",
  "Electricity duty 1.5% on the net electricity charge",
  "Fixed charge Rs 75 (single-phase) / Rs 150 (three-phase)",
  "FCA (fuel cost adjustment) varies every month",
  "Unprotected rates run from Rs 22.44 up to Rs 47.20 / kWh",
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMessage(null);
    setExtractedData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/extract-bill`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(
          errorData?.detail ||
            errorData?.error ||
            `Extraction error (${response.status}). Could not process this electricity bill.`
        );
        return;
      }

      const { job_id } = await response.json();
      if (!job_id) {
        setErrorMessage("Backend did not return a job id. Please try again.");
        return;
      }

      try {
        const data = await pollJob(job_id);
        localStorage.setItem("latest_bill_data", JSON.stringify(data));
        setExtractedData(data);
      } catch (pollErr) {
        setErrorMessage(
          pollErr instanceof Error ? pollErr.message : String(pollErr)
        );
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setErrorMessage(
        "Cannot connect to backend (localhost:8000). Ensure backend is running or uploaded image is clear."
      );
    } finally {
      setLoading(false);
    }
  };

  const pollJob = async (jobId: string) => {
    const statusUrl = `${API_BASE}/extract-bill/status/${jobId}`;
    const resultUrl = `${API_BASE}/extract-bill/result/${jobId}`;

    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const statusRes = await fetch(statusUrl);
      const status = await statusRes.json().catch(() => null);

      if (!status) continue;

      if (status.status === "done" || status.status === "failed") {
        const resultRes = await fetch(resultUrl);
        const result = await resultRes.json().catch(() => null);

        if (status.status === "done" && result) {
          return result;
        }

        const reason =
          result?.error ||
          (result?.data?.error ? result.data.error : null) ||
          status.error ||
          status.stage ||
          "Could not extract a valid MEPCO electricity bill from this file.";
        throw new Error(reason);
      }

      if (status.status === "error") {
        throw new Error(status.error || "Job failed.");
      }
    }

    throw new Error("Analysis is taking longer than expected. Please try again.");
  };

  const handleReset = () => {
    setErrorMessage(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="w-full relative overflow-hidden pt-28 pb-12 px-6 flex flex-col items-center">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Live NEPRA Tariff Ticker */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mx-auto bg-slate-900/90 backdrop-blur border border-slate-800 rounded-full px-3 py-2 mb-10 overflow-hidden relative"
      >
        <div className="flex items-center gap-3 absolute inset-y-0 left-4 z-10 pr-8 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 shrink-0">
            <Activity size={12} /> Tariff Radar
          </span>
        </div>
        <div className="overflow-hidden pl-36">
          <div className="flex w-max animate-marquee gap-10">
            {[...TICKER_FACTS, ...TICKER_FACTS].map((fact, i) => (
              <span
                key={i}
                className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 whitespace-nowrap"
              >
                <Zap size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                {fact}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6 mb-16">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs font-bold backdrop-blur-xs"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles size={14} className="text-amber-500" />
          </motion.div>
          <span>Instant AI Bill Auditor & Tariff Guard</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]"
        >
          Stop Overpaying. <br />
          <span className="text-amber-500">Audit Your Bill in Seconds.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg font-medium text-slate-600 max-w-xl mx-auto"
        >
          Drop your bill here. We check your tariff slabs, catch hidden tax
          overcharges, and keep you in the Protected status bracket.
        </motion.p>

        {/* Dynamic Card Container */}
        <AnimatePresence mode="wait">
          {/* 1. OCR ERROR STATE */}
          {errorMessage ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.3 }}
              className="pt-2"
            >
              <UploadErrorState
                errorMessage={errorMessage}
                onRetry={handleReset}
              />
            </motion.div>
          ) : !extractedData ? (
            /* 2. DEFAULT UPLOAD DROPZONE CARD */
            <motion.div
              key="upload-dropzone"
              initial={{ opacity: 0, y: 25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-2"
            >
              <motion.div
                onClick={handleButtonClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-3xl p-8 border-2 border-dashed border-amber-300 shadow-lg shadow-amber-500/5 hover:border-amber-500 transition-all duration-300 group cursor-pointer max-w-md mx-auto flex flex-col items-center relative overflow-hidden"
              >
                <motion.div
                  animate={loading ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-xs"
                >
                  {loading ? (
                    <Loader2 size={28} className="animate-spin text-amber-500" />
                  ) : (
                    <Upload size={28} />
                  )}
                </motion.div>

                <h3 className="font-bold text-slate-900 text-lg">
                  {loading
                    ? "Analyzing Electricity Bill..."
                    : "Upload Your Electricity Bill"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {loading
                    ? "Validating MEPCO format + reading bill... Please wait"
                    : "Supports JPG, PNG, WEBP images or PDF bills"}
                </p>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                  className="mt-5 px-7 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-all duration-200 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                  ) : (
                    <Zap size={16} className="text-amber-400 fill-amber-400" />
                  )}
                  <span>{loading ? "Auditing..." : "Select File"}</span>
                </motion.button>

                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={loading}
                  className="mt-3 text-[11px] font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera size={13} />
                  Photograph it with my camera
                </button>
              </motion.div>
            </motion.div>
          ) : (
            /* 3. FORMATTED AUDIT RESULT CARD (REPLACES RAW JSON) */
            <motion.div
              key="audit-result-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-slate-900 rounded-3xl p-6 text-left shadow-2xl border border-slate-800 max-w-lg mx-auto space-y-5 relative overflow-hidden"
            >
              {/* Header Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs tracking-wider uppercase">
                  <CheckCircle2 size={16} /> Audit Summary Generated
                </span>
                
                <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  extractedData.discrepancy_flag === "CLEAR" || extractedData.discrepancy_flag === "No discrepancy"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {extractedData.discrepancy_flag || "Audited"}
                </span>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-semibold">Billing Month</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {extractedData.billing_month || "Unknown"}
                  </p>
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-semibold">Units Consumed</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {extractedData.units_consumed || 0} kWh
                  </p>
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-semibold">Applied Slab</p>
                  <p className="text-sm font-black text-amber-400 mt-0.5">
                    {extractedData.applied_category || "Unprotected"}
                  </p>
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-semibold">Total Amount Due</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    Rs. {Number(extractedData.total_amount_due || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition-all border border-slate-700"
                >
                  Upload Another
                </button>

                <Link
                  href={extractedData.id ? `/history/${extractedData.id}` : "/dashboard"}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Full Dashboard</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-4 flex flex-wrap items-center justify-center gap-4 text-slate-700 text-xs font-semibold"
        >
          <span className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <ShieldCheck size={16} className="text-emerald-600" /> 200-Unit Protected Guard
          </span>
          <span className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <FileSearch size={16} className="text-amber-500" /> Automated OCR Extraction
          </span>
        </motion.div>
      </div>

      {/* Impact Counters */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 my-10 relative z-10"
      >
        {[
          { icon: Gauge, value: 200, suffix: "+", label: "Units — Protected Ceiling", note: "stay under or be re-rated" },
          { icon: Coins, value: 8, suffix: "", label: "Slab Rates Audited", note: "from Rs 7.74 to Rs 47.20 / kWh" },
          { icon: Landmark, value: 12, suffix: "", label: "NEPRA Checks Per Bill", note: "slabs, FPA, GST, duty & TV fee" },
          { icon: FileText, value: 1, suffix: "-click", label: "Dispute Letter", note: "official PDF, ready to send" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: "0 18px 36px rgba(15,23,42,0.10)" }}
              className="bg-white/85 backdrop-blur border border-slate-200/80 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                  <Icon size={17} className="text-amber-600" />
                </div>
              </div>
              <AnimatedNumber
                value={stat.value}
                suffix={stat.suffix}
                className="text-2xl font-black text-slate-900 tabular-nums"
              />
              <p className="text-[11px] font-bold text-slate-600 mt-1">{stat.label}</p>
              <p className="text-[10px] text-slate-400 font-medium">{stat.note}</p>
            </motion.div>
          );
        })}
      </motion.section>

      {/* How It Works Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl mx-auto my-8 px-4 relative z-10"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-center text-slate-400 mb-6">
          How BijliAudit Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: 1,
              title: "Upload a Bill",
              desc: "Drop your bill image. The system verifies it is a MEPCO bill, auto-corrects rotation, and extracts units and charges.",
            },
            {
              step: 2,
              title: "NEPRA Audit",
              desc: "Cross-verifies active tariff slab rules and highlights overcharge anomalies.",
            },
            {
              step: 3,
              title: "Generate Dispute",
              desc: "Get an official PDF dispute letter ready for submission to your DISCO.",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, rotate: i === 1 ? 0 : i === 0 ? -0.8 : 0.8 }}
              className="bg-white/85 backdrop-blur-sm p-6 rounded-3xl border border-amber-200/60 shadow-xs text-center flex flex-col items-center group relative overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 group-hover:scale-150 transition-transform duration-500" />
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7 }}
                className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center mb-3 text-sm shadow-md shadow-amber-500/30 relative z-10"
              >
                {card.step}
              </motion.div>
              <h3 className="font-bold text-slate-900 mb-1 text-sm relative z-10">{card.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed relative z-10">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Calculator CTA */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl mx-auto mt-4 relative z-10"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-700/60 shadow-xl shadow-slate-900/20 p-6 sm:p-7 text-center">
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-2 relative z-10">
              <Calculator size={14} />
              <span>NEPRA rules engine · live</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Don&apos;t have your bill handy? Audit any amount instead.
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-2 max-w-md mx-auto leading-relaxed">
              Enter units — or present &amp; previous meter readings — and the Interchangeable
              Audit Calculator walks you through every rupee, slab by slab, tax by tax, with a
              live overcharge check against your official bill.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/25 hover:bg-amber-300 hover:shadow-amber-400/40 transition-all"
              >
                <Calculator size={16} />
                Open Audit Calculator
              </Link>
              <Link
                href="/mepco"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-colors"
              >
                <Landmark size={16} className="text-amber-400" />
                MEPCO Office Hub
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero CTA Re-Engagement */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-3xl mx-auto mt-4 text-center relative z-10"
      >
        <p className="text-xs text-slate-500 font-semibold mb-3">
          Ready to know if your bill is right?
        </p>
        <motion.button
          onClick={handleButtonClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors"
        >
          <Zap size={16} className="text-amber-400 fill-amber-400" />
          Audit My First Bill
        </motion.button>
      </motion.div>
    </main>
  );
}