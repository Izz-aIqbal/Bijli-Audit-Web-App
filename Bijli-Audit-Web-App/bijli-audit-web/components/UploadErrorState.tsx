"use client";

import React from "react";
import { RefreshCw, FileWarning } from "lucide-react";

interface UploadErrorStateProps {
  onRetry?: () => void;
  errorMessage?: string;
}

export default function UploadErrorState({
  onRetry,
  errorMessage = "We couldn't detect a valid MEPCO electricity bill in this image.",
}: UploadErrorStateProps) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-md text-center max-w-md mx-auto my-6 space-y-5">
      <div className="flex justify-center items-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
          <FileWarning size={36} />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-black text-slate-900">
          OCR Extraction Failed
        </h3>
        <p className="text-xs text-rose-600 font-medium leading-relaxed">
          {errorMessage}
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-[11px] text-slate-600 text-left space-y-1.5">
        <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
          Quick Tips for Best Results:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-500 font-medium">
          <li>Ensure the bill image is clear and well-lit.</li>
          <li>Include the meter reference number and unit breakdown.</li>
          <li>Upload standard JPG, PNG, or WEBP images.</li>
        </ul>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <RefreshCw size={14} />
          <span>Try Uploading Again</span>
        </button>
      )}
    </div>
  );
}