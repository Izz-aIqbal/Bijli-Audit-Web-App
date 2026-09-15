import Link from "next/link";
import { Zap, ExternalLink, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0F172A] text-slate-400 py-12 px-6 border-t border-slate-800 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              Bijli<span className="text-amber-400">Audit</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Automated electricity bill audit engine, NEPRA tariff slab verification, and instant dispute generation for Pakistani consumers.
          </p>
        </div>
        
        {/* Reference Links Column */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-xs tracking-wider uppercase">Reference Sources</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <a 
                href="https://www.nepra.org.pk" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-amber-400 flex items-center gap-1.5 transition-colors text-slate-300"
              >
                NEPRA Official Tariff Guidelines <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </li>
            <li>
              <a 
                href="https://www.mepco.com.pk" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-amber-400 flex items-center gap-1.5 transition-colors text-slate-300"
              >
                MEPCO Customer Portal <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </li>
          </ul>
        </div>

        {/* Disclaimer Column - Added right padding to avoid floating widget overlap */}
        <div className="space-y-2 pr-0 lg:pr-20">
          <h4 className="font-semibold text-white mb-2 text-xs tracking-wider uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Legal Disclaimer
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-800">
            BijliAudit is an independent consumer analytical tool. It is not affiliated with, endorsed by, or connected to NEPRA, MEPCO, or any state DISCO. Generated documents serve as standardized templates for administrative review.
          </p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto border-t border-slate-800/80 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
        <p>© 2026 BijliAudit. All rights reserved.</p>
        <div className="flex gap-6 text-xs font-medium pr-0 lg:pr-20">
          <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}