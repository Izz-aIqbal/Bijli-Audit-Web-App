"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  History,
  Calculator,
  Upload,
  Gauge,
  Landmark,
  Sliders,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Calculate", href: "/calculator", icon: Calculator },
    { name: "Upload", href: "/", icon: Upload },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "History", href: "/history", icon: History },
    { name: "Planner", href: "/planner", icon: Sliders },
    { name: "Meter", href: "/meter-check", icon: Gauge },
    { name: "MEPCO", href: "/mepco", icon: Landmark },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 max-w-5xl mx-auto print:hidden">
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full px-4 sm:px-6 py-3 shadow-lg shadow-slate-900/5 flex flex-wrap items-center justify-center sm:justify-between gap-x-3 gap-y-2 max-w-[calc(100vw-2rem)]"
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <motion.div
            animate={{ rotate: [0, 0, -8, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            whileHover={{ scale: 1.15 }}
          >
            <Image
              src="/bijli_audit_logo.png"
              alt="Bijli Audit"
              width={32}
              height={32}
              className="object-contain"
            />
          </motion.div>
          <span className="font-extrabold text-lg text-[#0F172A] tracking-tight">
            Bijli<span className="text-[#F59E0B]">Audit</span>
          </span>
        </Link>

        {/* Navigation Links with Shared-Layout Active Pill */}
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link key={link.name} href={link.href} className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 relative z-10 ${
                    isActive ? "text-[#0F172A]" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={16}
                    className={`${isActive ? "text-[#F59E0B]" : "text-slate-500"} transition-transform duration-200 shrink-0`}
                  />
                  <span className="whitespace-nowrap">{link.name}</span>

                  {/* Animated Shared-Layout Active Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                      className="absolute inset-0 bg-slate-100/90 rounded-full -z-10 border border-slate-200/80 shadow-xs"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </header>
  );
}