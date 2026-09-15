"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/apiBase";

interface MascotProps {
  billId?: string | number;
}

export default function Mascot({ billId }: MascotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "assistant",
      text: "Hi! I'm Bijli 👋 Ask me anything about your electricity bill!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const hasGreetedRef = useRef(false);

  const readLatestBill = () => {
    try {
      const raw = localStorage.getItem("latest_bill_data");
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.id) return data;
    } catch {
      return null;
    }
    return null;
  };

  const [activeBillId, setActiveBillId] = useState<number | null>(() => {
    if (billId) return Number(billId);
    const latest = readLatestBill();
    return latest?.id ? Number(latest.id) : null;
  });
  const [activeBillLabel, setActiveBillLabel] = useState<string>(() => {
    if (billId) return `Bill #${billId}`;
    const latest = readLatestBill();
    return latest?.id ? `${latest.billing_month || "Bill"} #${latest.id}` : "";
  });

  const refreshFromStorage = useCallback(() => {
    if (billId) return;
    const latest = readLatestBill();
    if (latest?.id) {
      setActiveBillId(Number(latest.id));
      setActiveBillLabel(`${latest.billing_month || "Bill"} #${latest.id}`);
    }
  }, [billId]);

  useEffect(() => {
    window.addEventListener("storage", refreshFromStorage);
    return () => window.removeEventListener("storage", refreshFromStorage);
  }, [refreshFromStorage]);

  const openChat = () => {
    setOpen(true);
    if (!hasGreetedRef.current) {
      const latest = readLatestBill();
      hasGreetedRef.current = true;
      if (latest?.id) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `I can see your latest audited bill (${latest.billing_month || "month"} #${latest.id}). Ask me about its units, charges, or whether the tariff was applied correctly!`,
          },
        ]);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    const effectiveBillId = billId ? Number(billId) : activeBillId;

    let sessionId = "default";
    if (typeof window !== "undefined") {
      sessionId = localStorage.getItem("bijli_household_id") || "";
      if (!sessionId) {
        sessionId = `household-${crypto.randomUUID()}`;
        localStorage.setItem("bijli_household_id", sessionId);
      }
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          bill_id: effectiveBillId ?? null,
          session_id: sessionId,
          context: readLatestBill(),
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || "No reply." },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            (error as Error).name === "AbortError"
              ? "Bijli is taking too long to reply. Please try again in a moment."
              : "Sorry, I had trouble reaching the backend server right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-6 sm:bottom-10 sm:right-8 z-[60] flex flex-col items-end print:hidden">
      {/* Speech Teaser Bubble (shows only while hovering the pokemon) */}
      <AnimatePresence>
        {!open && hovering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10, transition: { duration: 0.2 } }}
            transition={{ duration: 0.25 }}
            onClick={openChat}
            className="mb-3 cursor-pointer relative bg-white border border-slate-200/90 px-3.5 py-2.5 rounded-2xl shadow-lg shadow-slate-900/10 hover:shadow-xl hover:scale-105 transition-all max-w-[210px]"
          >
            <p className="text-[11px] font-bold text-[#1f3a6e] leading-snug">
              Hi! I&apos;m Bijli ⚡ — ask me anything about your electricity bill
              or how much you should really be paying.
            </p>
            <span className="absolute -bottom-1 right-8 w-2 h-2 bg-white rotate-45 border-r border-b border-slate-200/90" />
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
              <div className="flex flex-col">
                <span className="font-semibold flex items-center gap-2 text-sm">
                  <img
                    src="/bijli_wave.gif"
                    alt="Bijli"
                    className="w-6 h-6 object-contain inline-block"
                  />
                  Bijli, your bill buddy
                </span>
                <span className="text-[10px] text-amber-300 font-semibold mt-0.5 ml-8">
                  {activeBillLabel
                    ? `Context: ${activeBillLabel}`
                    : "No bill selected"}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="hover:opacity-80 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 flex flex-col">
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
              {isLoading && (
                <div className="bg-white border border-slate-200 text-slate-500 self-start px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1f3a6e]" />
                  Bijli is thinking...
                </div>
              )}
            </div>

            {/* Input Field */}
            <div className="flex items-center gap-2 border-t border-slate-200 p-3 bg-white">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLoading}
                placeholder="Ask about your bill..."
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none px-3 py-1.5 bg-slate-100 rounded-lg focus:ring-2 focus:ring-[#1f3a6e]/20 transition-all disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="p-2 text-[#1f3a6e] hover:text-[#f59e0b] transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button — animated pikachu */}
      <motion.div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="relative flex items-center justify-center"
      >
        <AnimatePresence>
          {!open && (
            <motion.span
              initial={{ opacity: 0.7, scale: 0.9 }}
              animate={{ opacity: [0.7, 0.25, 0.7], scale: [1, 1.18, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 rounded-full bg-amber-400/40 blur-[2px]"
            />
          )}
        </AnimatePresence>
        <motion.button
          onClick={openChat}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.12, rotate: -4 }}
          whileTap={{ scale: 0.92, rotate: 0 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl shadow-amber-500/40 flex items-center justify-center border-2 border-white cursor-pointer overflow-hidden"
        >
          {open ? (
            <X size={24} className="text-slate-900" />
          ) : (
            <img
              src="/bijli_wave.gif"
              alt="Bijli, your bill buddy"
              className="w-12 h-12 object-contain drop-shadow"
            />
          )}
        </motion.button>

        {/* Always-visible name badge */}
        {!open && (
          <motion.span
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-white bg-[#1f3a6e] pl-3 pr-2.5 py-1.5 rounded-full shadow-lg border border-white/10 whitespace-nowrap"
          >
            Ask Bijli ⚡
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}