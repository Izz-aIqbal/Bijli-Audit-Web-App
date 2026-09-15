"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  Phone,
  MapPin,
  Navigation,
  X,
  Building2,
  Footprints,
  PlugZap,
  FileCheck,
  ShieldCheck,
  Zap,
  Clock,
  Wrench,
} from "lucide-react";

interface MepcoOffice {
  name: string;
  division: string;
  address: string;
  helpline: string;
  complaint: string;
  services: { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
  mapsQuery: string;
}

const OFFICES: MepcoOffice[] = [
  {
    name: "Multan",
    division: "Multan Circle",
    address: "MEPCO Head Office, Hamid Raza Road, Gulgasht, Multan, Punjab 60000",
    helpline: "118 (24/7) · 061-3575000",
    complaint: "061-9200530",
    services: [{ label: "New connections", icon: PlugZap }, { label: "Meter complaints", icon: Wrench }, { label: "Bill verification", icon: FileCheck }],
    mapsQuery: "MEPCO Head Office Multan",
  },
  {
    name: "Vehari",
    division: "Vehari Circle",
    address: "MEPCO Grid Station Road, Vehari, Punjab 61100",
    helpline: "118 (24/7) · 067-3600000-1",
    complaint: "067-3368888",
    services: [{ label: "Meter complaints", icon: Wrench }, { label: "Bill verification", icon: FileCheck }, { label: "Fault reporting", icon: Clock }],
    mapsQuery: "MEPCO Vehari",
  },
  {
    name: "Sahiwal",
    division: "Sahiwal Circle",
    address: "MEPCO Office, Circular Road, Near Katchery Chowk, Sahiwal, Punjab 57000",
    helpline: "118 (24/7) · 040-4360400",
    complaint: "040-9200444",
    services: [{ label: "New connections", icon: PlugZap }, { label: "Bill verification", icon: FileCheck }, { label: "Meter complaints", icon: Wrench }],
    mapsQuery: "MEPCO Sahiwal",
  },
  {
    name: "Rahim Yar Khan",
    division: "RYK Circle",
    address: "MEPCO Office, Model Town B Road, Rahim Yar Khan, Punjab 64200",
    helpline: "118 (24/7) · 068-9200021",
    complaint: "068-9200022",
    services: [{ label: "Meter complaints", icon: Wrench }, { label: "Bill verification", icon: FileCheck }, { label: "Fault reporting", icon: Clock }],
    mapsQuery: "MEPCO Rahim Yar Khan",
  },
  {
    name: "Bahawalpur",
    division: "Bahawalpur Circle",
    address: "MEPCO Office, Dera Nawab Sahib Road, Bahawalpur, Punjab 63100",
    helpline: "118 (24/7) · 062-9220349",
    complaint: "062-9250010",
    services: [{ label: "New connections", icon: PlugZap }, { label: "Meter complaints", icon: Wrench }, { label: "Fault reporting", icon: Clock }],
    mapsQuery: "MEPCO Bahawalpur",
  },
  {
    name: "Muzaffargarh",
    division: "Muzaffargarh Circle",
    address: "MEPCO Office, Javed Iqbal Road, Muzaffargarh, Punjab 34200",
    helpline: "118 (24/7) · 066-9200301",
    complaint: "066-9200302",
    services: [{ label: "Bill verification", icon: FileCheck }, { label: "Meter complaints", icon: Wrench }, { label: "New connections", icon: PlugZap }],
    mapsQuery: "MEPCO Muzaffargarh",
  },
  {
    name: "Dera Ghazi Khan",
    division: "D.G. Khan Circle",
    address: "MEPCO Office, Sakhi Sarwar Road, D.G. Khan, Punjab 32200",
    helpline: "118 (24/7) · 064-9290131",
    complaint: "064-9260309",
    services: [{ label: "New connections", icon: PlugZap }, { label: "Fault reporting", icon: Clock }, { label: "Bill verification", icon: FileCheck }],
    mapsQuery: "MEPCO Dera Ghazi Khan",
  },
  {
    name: "Khanewal",
    division: "Khanewal Circle",
    address: "MEPCO Office, Mian Channu Road, Khanewal, Punjab 58150",
    helpline: "118 (24/7) · 065-9200316",
    complaint: "065-9200317",
    services: [{ label: "Bill verification", icon: FileCheck }, { label: "Meter complaints", icon: Wrench }, { label: "Fault reporting", icon: Clock }],
    mapsQuery: "MEPCO Khanewal",
  },
];

const ABOUT_POINTS = [
  {
    icon: Landmark,
    title: "Who they are",
    body: "Multan Electric Power Company (MEPCO) supplies electricity across South Punjab — Multan, Bahawalpur, D.G. Khan and Sahiwal divisions — serving over 11 million connections.",
  },
  {
    icon: Zap,
    title: "Bill structure",
    body: "A MEPCO bill = slab energy charge (units in slab × rate) + fixed charges + FPA/QTA pass-through + electricity duty + GST, minus any protected subsidy. The \u201CTotal Electricity Charges\u201D line is pre-tax; GST is added on top.",
  },
  {
    icon: ShieldCheck,
    title: "Protected vs unprotected",
    body: "Domestic consumers billed under 200 kWh/month pay heavily-subsidised rates. Cross the 200-unit line and the WHOLE month re-rates at the full unprotected schedule.",
  },
  {
    icon: Clock,
    title: "When to complain",
    body: "Wrong meter reading, tariff applied incorrectly, FPA/QTA that don't match NEPRA's approved figures, or a bill total that disagrees with the rules engine — all are worth disputing via 118 or your circle office.",
  },
];

export default function MepcoHubPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<MepcoOffice | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".mepco-hero",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
      gsap.fromTo(
        ".mepco-card",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.06, delay: 0.1 }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-transparent flex flex-col font-sans pt-24 sm:pt-28 pb-16 relative"
    >
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
        <div className="mepco-hero flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold tracking-wider uppercase mb-2">
              <Landmark className="w-4 h-4" />
              <span>South Punjab power</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              MEPCO Knowledge &amp; Office Hub
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 mt-2 max-w-2xl">
              Understand how MEPCO bills you, and find the right regional office the moment
              something looks wrong.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-slate-400 bg-white/70 border border-slate-200/80 rounded-xl px-3 py-2 shadow-xs">
            <span className="text-slate-600">Helpline 118</span> · verified reference data
          </div>
        </div>

        {/* About MEPCO */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ABOUT_POINTS.map((pt) => {
            const Icon = pt.icon;
            return (
              <div
                key={pt.title}
                className="mepco-card bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl p-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-amber-400" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  {pt.title}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{pt.body}</p>
              </div>
            );
          })}
        </section>

        {/* Office grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-amber-500" />
              Regional circle offices
            </h2>
            <span className="text-[11px] font-bold text-slate-400">{OFFICES.length} circles</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OFFICES.map((office, idx) => (
              <motion.button
                key={office.name}
                onClick={() => setSelected(office)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className="mepco-card group bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 text-left shadow-md cursor-pointer relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-400/10 group-hover:bg-amber-400/20 transition-colors" />
                <div className="flex items-center justify-between relative">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <MapPin size={16} className="text-amber-400" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-3 relative">{office.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider relative">
                  {office.division}
                </p>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-amber-300 group-hover:gap-2 transition-all">
                  View details <Navigation size={10} />
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        <p className="text-[11px] font-medium text-slate-400 text-center pt-2">
          Circle details are reference information for dispute guidance — always confirm the
          current helpline on the official MEPCO portal or via 118 before visiting.
        </p>
      </main>

      {/* ——— Office drawer ——— */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 relative max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <MapPin size={19} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{selected.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {selected.division}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 mt-5">
                <div className="flex gap-3">
                  <MapPin size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Address
                    </p>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {selected.address}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Helpline
                      </p>
                      <p className="text-xs font-bold text-slate-700">{selected.helpline}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Complaint cell
                      </p>
                      <p className="text-xs font-bold text-slate-700">{selected.complaint}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Services available
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.services.map((s) => {
                      const Icon = s.icon;
                      return (
                        <div
                          key={s.label}
                          className="flex flex-col items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-3 text-center"
                        >
                          <Icon size={16} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-slate-600 leading-tight">
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Footprints size={14} className="text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400">
                    Tip: take your latest bill and CNIC when visiting.
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-900 text-white text-xs font-black px-5 py-3.5 shadow-md hover:bg-slate-800 transition-colors"
                >
                  <Navigation size={14} className="text-amber-400" />
                  Open in Google Maps
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}