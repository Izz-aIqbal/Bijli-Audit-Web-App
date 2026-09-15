"use client";

import React from "react";
import Link from "next/link";
import { Upload, ArrowRight } from "lucide-react";

export default function EmptyHistory() {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-md text-center max-w-xl mx-auto my-12 space-y-6">
      <div className="flex justify-center items-center">
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
          alt="Bijli"
          className="w-20 h-20 object-contain opacity-90"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          No Bills Audited Yet
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          You haven&apos;t uploaded any electricity bills for analysis. Drop your first bill to start tracking tariff slabs and overcharges.
        </p>
      </div>

      <div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Upload size={15} />
          <span>Upload Your First Bill</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}