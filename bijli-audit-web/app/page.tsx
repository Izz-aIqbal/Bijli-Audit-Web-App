"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ShieldCheck, Zap, FileSearch, Sparkles, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
      const response = await fetch("http://localhost:8000/extract-bill", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Extracted JSON:", data);
        
        setExtractedData(data);
        localStorage.setItem("latest_bill_data", JSON.stringify(data));
      } else {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(`Extraction error (${response.status}). Check FastAPI logs.`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setErrorMessage("Cannot connect to FastAPI (localhost:8000). Ensure backend is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white relative overflow-hidden pt-32 pb-20 px-6 flex flex-col items-center justify-center">
      
      {/* Dynamic Background Animated Glows */}
      <motion.div 
        animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.02, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 inset-x-0 h-[45vh] bg-gradient-to-b from-white via-white/90 to-transparent pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-0 bottom-0 h-[65vh] bg-gradient-to-t from-[#F2A93B]/35 via-[#F2A93B]/15 to-transparent pointer-events-none z-0" 
      />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf"
        className="hidden"
      />

      {/* Hero Container */}
      <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
        
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F2A93B]/15 border border-[#F2A93B]/30 text-[#B45309] text-xs font-bold shadow-xs backdrop-blur-xs"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles size={14} className="text-[#F2A93B]" />
          </motion.div>
          <span>Instant AI Bill Auditor & Tariff Guard</span>
        </motion.div>

        {/* Hero Title with Staggered Slide */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl font-black text-[#14274E] tracking-tight leading-[1.15]"
        >
          Stop Overpaying. <br />
          <span className="text-[#F2A93B]">Audit Your Bill in Seconds.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg font-semibold text-slate-700 max-w-xl mx-auto"
        >
          Drop your bill here. We check your tariff slabs, catch hidden tax overcharges, and keep you in the Protected status bracket.
        </motion.p>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold max-w-md mx-auto flex items-center gap-2 text-left shadow-sm"
            >
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Dropzone Card */}
        <AnimatePresence mode="wait">
          {!extractedData && (
            <motion.div 
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
                whileHover={{ y: -6, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border-2 border-dashed border-[#F2A93B]/40 shadow-xl shadow-[#F2A93B]/10 hover:border-[#F2A93B] hover:shadow-2xl hover:shadow-[#F2A93B]/20 transition-all duration-300 group cursor-pointer max-w-md mx-auto flex flex-col items-center relative overflow-hidden"
              >
                {/* Subtle Hover Pulse Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F2A93B]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                <motion.div 
                  animate={loading ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 rounded-2xl bg-[#F2A93B]/10 text-[#F2A93B] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#F2A93B] group-hover:text-white transition-all duration-300 shadow-xs"
                >
                  {loading ? (
                    <Loader2 size={28} className="animate-spin text-[#F2A93B]" />
                  ) : (
                    <Upload size={28} />
                  )}
                </motion.div>

                <h3 className="font-bold text-[#14274E] text-lg">
                  {loading ? "Analyzing Electricity Bill..." : "Upload Your Electricity Bill"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {loading ? "EasyOCR + Gemini active... Please wait" : "Supports JPG, PNG, WEBP, or PDF format"}
                </p>
                
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading}
                  className="mt-5 px-7 py-3 rounded-xl bg-[#14274E] text-white font-bold text-sm shadow-md hover:bg-[#1e3a73] transition-all duration-200 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-[#F2A93B]" />
                  ) : (
                    <Zap size={16} className="text-[#F2A93B]" />
                  )}
                  <span>{loading ? "Auditing..." : "Select File"}</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* JSON Output Display Screen with Pop Animation */}
        <AnimatePresence>
          {extractedData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-slate-900 rounded-3xl p-6 text-left shadow-2xl border border-slate-800 max-w-2xl mx-auto space-y-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={18} /> Extracted Bill JSON Response
                </span>
                <button 
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-400 hover:text-white underline font-semibold transition-colors"
                >
                  Upload Another Bill
                </button>
              </div>

              {/* Structured Bill Summary Card */}
            <div className="bg-white p-5 rounded-2xl text-slate-800 shadow-sm border border-slate-200 mt-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Summary</h3>
                  <p className="text-lg font-black">Ref: {extractedData?.reference_number || "N/A"}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  extractedData?.protected_status === "protected" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {extractedData?.protected_status || "STATUS UNKNOWN"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block mb-1">Units Consumed</span>
                  <span className="text-xl font-black text-slate-800">{extractedData?.units_consumed || 0} <span className="text-sm font-medium text-slate-500">kWh</span></span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block mb-1">Base Energy</span>
                  <span className="text-xl font-black text-slate-800"><span className="text-sm font-medium text-slate-500">Rs.</span> {extractedData?.energy_charges || 0}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-sm border-t border-slate-100 pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">FPA & QTA Adjustments:</span>
                  <span className="font-bold text-slate-700">Rs. {(extractedData?.fpa || 0) + (extractedData?.qta || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Taxes (GST, Duty, TV Fee):</span>
                  <span className="font-bold text-slate-700">Rs. {(extractedData?.gst || 0) + (extractedData?.electricity_duty || 0) + (extractedData?.tv_fee || 0)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <span className="font-bold text-blue-900">Total Amount Due:</span>
                <span className="text-2xl font-black text-blue-600">
                  Rs. {extractedData?.total_amount_due || 0}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 rounded-xl bg-[#F2A93B] text-[#14274E] font-bold text-xs shadow-md hover:bg-[#e0982d] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Go to Full Dashboard</span>
                <ArrowRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Trust Badges with Staggered Entrance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-6 flex flex-wrap items-center justify-center gap-6 text-slate-700 text-xs font-semibold"
        >
          <motion.span 
            whileHover={{ y: -2 }}
            className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs cursor-default"
          >
            <ShieldCheck size={16} className="text-emerald-600" /> 200-Unit Protected Status Guard
          </motion.span>
          <motion.span 
            whileHover={{ y: -2 }}
            className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs cursor-default"
          >
            <FileSearch size={16} className="text-[#F2A93B]" /> Automated OCR Extraction
          </motion.span>
        </motion.div>

      </div>
    </main>
  );
}