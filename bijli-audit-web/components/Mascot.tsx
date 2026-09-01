"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

export default function Mascot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "assistant", text: "Hi! I'm Bijli 👋 Ask me anything about your electricity bill!" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }]);
    setInput("");
  };

  return (
    <div className="fixed bottom-8 right-6 sm:bottom-10 sm:right-8 z-[60] flex flex-col items-end print:hidden">
      {/* Speech Teaser Bubble */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(true)}
            className="mb-3 flex items-center gap-3 bg-white border border-slate-200/90 px-4 py-2.5 rounded-2xl shadow-xl hover:shadow-2xl cursor-pointer hover:scale-105 transition-all max-w-xs"
          >
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                alt="Bijli Buddy"
                className="w-10 h-10 object-contain"
              />
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#1f3a6e] flex items-center gap-1">
                ⚡ Need help with your bill?
              </span>
              <p className="text-[11px] text-slate-600 font-medium leading-tight">
                Click me to ask questions about taxes, tariffs, or overcharges!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Box */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: "420px" }}
          >
            {/* Header */}
            <div className="bg-[#1f3a6e] text-white px-4 py-3 flex justify-between items-center">
              <span className="font-semibold flex items-center gap-2 text-sm">
                <img
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                  alt="Bijli"
                  className="w-6 h-6 object-contain inline-block"
                />
                Bijli, your bill buddy
              </span>
              <button 
                onClick={() => setOpen(false)}
                className="hover:opacity-80 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-white border border-slate-200 text-slate-800 self-start shadow-xs"
                      : "bg-[#f59e0b] text-slate-950 self-end ml-auto shadow-xs"
                  }`}
                >
                  {m.text}
                </motion.div>
              ))}
            </div>

            {/* Input Field */}
            <div className="flex items-center gap-2 border-t border-slate-200 p-3 bg-white">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about your bill..."
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none px-3 py-1.5 bg-slate-100 rounded-lg focus:ring-2 focus:ring-[#1f3a6e]/20 transition-all"
              />
              <button 
                onClick={sendMessage} 
                className="p-2 text-[#1f3a6e] hover:text-[#f59e0b] transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full bg-[#1f3a6e] text-[#f59e0b] shadow-xl flex items-center justify-center border-2 border-white cursor-pointer"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
}