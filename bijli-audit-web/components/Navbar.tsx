"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, History, Calculator, Upload } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Upload", href: "/", icon: Upload },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calculator", href: "/calculator", icon: Calculator }, 
    { name: "History", href: "/history", icon: History },
    { name: "Planner", href: "/planner", icon: Calculator },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 max-w-5xl mx-auto print:hidden">
      <nav className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full px-6 py-3 shadow-lg shadow-slate-900/5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}>
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

        {/* Navigation Links with Hover & Active Animations */}
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link key={link.name} href={link.href} className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 relative z-10 ${
                    isActive ? "text-[#0F172A]" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-[#F59E0B]" : "text-slate-500"} />
                  <span>{link.name}</span>

                  {/* Active Indicator Background */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-slate-100/90 rounded-full -z-10 border border-slate-200/80 shadow-xs"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

      </nav>
    </header>
  );
}