"use client";
import { useEffect, useState } from "react";

export default function CalculatorPage() {
  const [units, setUnits] = useState<number | "">(120);
  const [status, setStatus] = useState("non_protected");
  const [result, setResult] = useState<any>(null);

// Automatically update status whenever units change
  useEffect(() => {
  const currentUnits = Number(units) || 0;
  setStatus(currentUnits <= 200 ? "protected" : "non_protected");
}, [units]);

  const calculateManualBill = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          units_consumed: Number(units),
          status: status,
          fpa_charge: 0,
          qta_charge: 0,
          billed_amount: 0,
        }),
      });
      const data = await res.json();
      setResult(data.audit_result);
    } catch (err) {
      console.error("Backend error:", err);
    }
  };

// Safe field accessors with fallbacks
  const baseCharges = result
    ? result.energy_cost ?? result.base_energy_charges ?? result.energy_charges ?? result.base_cost ?? result.calculated_base_charges ?? 0
    : 0;

    
  const totalTaxes = result
    ? result.total_taxes ?? (result.gst || 0) + (result.electricity_duty || 0) + (result.tv_fee || 0)
    : 0;

  const EstimatedPayable = result
    ? result.calculated_net_payable ?? result.total_amount_due ?? 0
    : 0;

  return (
    <div className="max-w-xl mx-auto pt-28 pb-12 px-6 text-center space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-800">MEPCO Tariff Calculator</h1>
      <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Units Consumed (kWh)
          </label>
          <input
            type="number"
            min="1"
            value={units}
            onChange={(e) => {
              const val = e.target.value;
              setUnits(val === "" ? "" : parseInt(val, 10));
            }}
            className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Consumer Category
          </label>
<div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <div
              className={`py-2.5 px-3 text-center rounded-lg font-bold text-xs transition-all ${
                status === "protected"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 opacity-60"
              }`}
            >
              Protected (≤ 200 units)
            </div>
            <div
              className={`py-2.5 px-3 text-center rounded-lg font-bold text-xs transition-all ${
                status === "non_protected"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 opacity-60"
              }`}
            >
              Unprotected ({'>'}  200 units)
            </div>
          </div>
        </div>
        <button
          onClick={calculateManualBill}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
        >
          Calculate Estimated Bill
        </button>
      </div>

      {result && (
        <div className="space-y-4 text-left">
          {/* Estimated Payable Box */}
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl space-y-1 shadow-sm">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Estimated Payable
            </span>
            <h2 className="text-3xl font-black text-emerald-900">
              Rs. {Number(EstimatedPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-sm font-semibold text-emerald-700 pt-2 border-t border-emerald-200/60 mt-3">
              Base Charges: Rs. {Number(baseCharges).toLocaleString(undefined, { minimumFractionDigits: 2 })} | Total Taxes: Rs. {Number(totalTaxes).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Simple Calculation Explanation Breakdown */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">How this was calculated</h3>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                status === "protected" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {status === "protected" ? "Subsidized Tariff" : "Standard Tariff"}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>1. Base Electricity Cost ({units} kWh):</span>
                <span className="font-bold text-slate-800">
                  Rs. {Number(baseCharges).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>2. Taxes & Government Fees (GST, Duty, TV Fee):</span>
                <span className="font-bold text-slate-800">
                  Rs. {Number(totalTaxes).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 text-sm font-bold text-slate-900">
                <span>Total Calculated Amount:</span>
                <span className="text-blue-600">
                  Rs. {Number(EstimatedPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic pt-1">
              • Calculation uses standard MEPCO slab rates applied to your active consumer bracket.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}