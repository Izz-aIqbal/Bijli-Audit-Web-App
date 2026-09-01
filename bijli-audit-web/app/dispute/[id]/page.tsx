"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Download,
  AlertTriangle,
  ShieldAlert,
  PenTool,
  Copy,
  Check,
  User,
  Hash,
} from "lucide-react";
import { mockBills } from "@/components/mockBills";
import jsPDF from "jspdf";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DisputePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawId = resolvedParams.id;

  const [copied, setCopied] = useState(false);
  const [consumerName, setConsumerName] = useState("");
  const [consumerAcc, setConsumerAcc] = useState("");

  const billIndex = parseInt(rawId, 10) - 1;
  const bill =
    mockBills.find((b) => String(b.id) === String(rawId)) ||
    (!isNaN(billIndex) && mockBills[billIndex] ? mockBills[billIndex] : mockBills[0]);

  const applicantName = consumerName.trim() || "Consumer / Applicant";
  const accountNoText = consumerAcc.trim() ? ` (Account No: ${consumerAcc.trim()})` : "";

  const letterText = `ELECTRICITY BILL DISPUTE APPLICATION
Ref Audit ID: #BA-${bill.id}${consumerAcc.trim() ? `\nAccount No: ${consumerAcc.trim()}` : ""}
Date: ${new Date().toLocaleDateString("en-GB")}

To:
The Sub-Divisional Officer (SDO), MEPCO
Sub-Division Office, MEPCO

Subject: Request for Review of Billed Amount for ${bill.month}

Respected Sir/Madam,

I am writing to formally request an official review and audit of my electricity bill for the period of ${bill.month}.

According to Bijli Audit's automated verification engine, my bill for this cycle has been flagged with: "${bill.status}". The recorded consumption for this period is ${bill.units} kWh, incurring a total billed charge of Rs. ${bill.total.toLocaleString()}.

I request your office to verify the applied tariff slab, fuel cost adjustment surcharges, and reading calculations against actual meter records. Kindly issue a revised bill if an overcharge or tariff mismatch is confirmed.

Thank you for your prompt action and assistance.

Sincerely,
${applicantName}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letterText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Title Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ELECTRICITY BILL DISPUTE APPLICATION", 20, 25);

    // Decorative Line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);

    // Meta Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 145, 38);
    doc.text(`Ref Audit ID: #BA-${bill.id}`, 20, 38);
    if (consumerAcc.trim()) {
      doc.text(`Account / Ref No: ${consumerAcc.trim()}`, 20, 44);
    }

    const startY = consumerAcc.trim() ? 56 : 50;

    // Recipient Section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("To:", 20, startY);
    doc.text("The Sub-Divisional Officer (SDO)", 20, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.text("Sub-Division Office, MEPCO", 20, startY + 12);

    // Subject
    doc.setFont("helvetica", "bold");
    doc.text(`Subject: Request for Review of Billed Amount for ${bill.month}`, 20, startY + 25);

    // Formal Body Text
    doc.setFont("helvetica", "normal");
    const bodyText = `Respected Sir/Madam,\n\nI am writing to formally request an official review and audit of my electricity bill for the period of ${bill.month}.\n\nAccording to Bijli Audit's automated verification engine, my bill for this cycle has been flagged with: "${bill.status}". The recorded consumption for this period is ${bill.units} kWh, incurring a total billed charge of Rs. ${bill.total}.\n\nI request your office to verify the applied tariff slab, fuel cost adjustment surcharges, and reading calculations against actual meter records. Kindly issue a revised bill if an overcharge or tariff mismatch is confirmed.\n\nThank you for your prompt action and assistance.`;

    const splitText = doc.splitTextToSize(bodyText, 170);
    doc.text(splitText, 20, startY + 37);

    // Sign-off & Signature Line
    doc.text("Sincerely,", 20, startY + 115);
    doc.line(20, startY + 135, 80, startY + 135); // Signature Line
    doc.setFont("helvetica", "bold");
    doc.text(applicantName, 20, startY + 142);

    doc.save(`dispute-letter-${bill.id}.pdf`);
  };

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20 pt-28 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation / Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href={`/history/${bill.id}`}
            className="inline-flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-amber-500 bg-white border border-slate-200/80 px-4 py-2 rounded-full shadow-xs hover:shadow-md transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-500" />
            <span>Back to Bill Audit</span>
          </Link>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden"
        >
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold tracking-wider uppercase mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Automated Dispute Resolution</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Dispute Letter Ready
              </h1>
            </div>

            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              {bill.status}
            </div>
          </div>

          {/* Subtitle / Details */}
          <p className="text-slate-500 text-sm mt-4">
            Generated specifically for your <strong className="text-slate-800">{bill.month}</strong> bill (Total: <strong className="text-slate-800">Rs. {bill.total.toLocaleString()}</strong>). Fill in your details below to customize the letter before exporting.
          </p>

          {/* Dynamic Inputs Form */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" /> Full Name / Applicant
              </label>
              <input
                type="text"
                placeholder="e.g. Muhammad Ali"
                value={consumerName}
                onChange={(e) => setConsumerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-500" /> Reference / Account No. (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 14 12345 6789012 U"
                value={consumerAcc}
                onChange={(e) => setConsumerAcc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Document Preview Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mt-6 p-6 sm:p-8 bg-slate-50 rounded-2xl border border-slate-200/80 font-serif text-slate-800 text-xs sm:text-sm leading-relaxed space-y-4 shadow-inner relative"
          >
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 font-sans font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" /> Official Application Format
              </span>
              <span>Ref: #BA-{bill.id}{consumerAcc.trim() ? ` | Acc: ${consumerAcc.trim()}` : ""}</span>
            </div>

            <h3 className="font-sans font-extrabold text-base text-slate-900 pt-1 tracking-tight">
              Electricity Bill Dispute Application
            </h3>

            <p><strong>To:</strong> The Sub-Divisional Officer (SDO), MEPCO</p>
            <p><strong>Subject:</strong> Request for Review of Billed Amount for {bill.month}</p>

            <div className="font-sans text-slate-700 bg-white p-4 rounded-xl border border-slate-200/60 text-xs leading-relaxed space-y-2">
              <p>Respected Sir/Madam,</p>
              <p>
                I am writing to formally request an official review and audit of my electricity bill for the period of <strong>{bill.month}</strong>.
              </p>
              <p>
                According to Bijli Audit's automated verification engine, my bill for this cycle has been flagged with: <strong>"{bill.status}"</strong>. The recorded consumption for this period is <strong>{bill.units} kWh</strong>, incurring a total billed charge of <strong>Rs. {bill.total.toLocaleString()}</strong>.
              </p>
              <p>
                I request your office to verify the applied tariff slab, fuel cost adjustment surcharges, and reading calculations against actual meter records.
              </p>
            </div>

            {/* Visual Signature Section */}
            <div className="pt-4 flex flex-col items-start space-y-2">
              <p>Sincerely,</p>
              <div className="w-56 pt-6 border-b border-dashed border-slate-400 flex items-center justify-between">
                <span className="text-[11px] text-slate-700 font-sans font-bold flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-amber-500" /> {applicantName}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Action Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all active:scale-95 text-sm border border-slate-200/80"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy Application Text</span>
                </>
              )}
            </button>

            <button
              onClick={generatePDF}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition-all shadow-lg shadow-amber-500/20 active:scale-95 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Dispute PDF</span>
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}