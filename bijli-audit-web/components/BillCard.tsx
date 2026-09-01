"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function BillCard({ bill }: { bill: { id: string; month: string; units: number; total: number; status: string } }) {
  const ok = bill.status === "No discrepancy";
  return (
    <Link href={`/history/${bill.id}`}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(20,39,78,0.12)" }}
        className="bg-white rounded-2xl shadow-md p-5 cursor-pointer border border-gray-100"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-navy">{bill.month}</h3>
          {ok ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertTriangle className="text-gold" size={20} />}
        </div>
        <p className="text-sm text-gray-500">{bill.units} units</p>
        <p className="text-lg font-bold text-navy mt-1">Rs. {bill.total.toLocaleString()}</p>
        <p className={`text-xs mt-2 font-medium ${ok ? "text-green-600" : "text-gold"}`}>{bill.status}</p>
      </motion.div>
    </Link>
  );
}