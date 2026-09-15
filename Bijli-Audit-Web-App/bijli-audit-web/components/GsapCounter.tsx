"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface GsapCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

function formatNumber(n: number, decimals: number, prefix: string, suffix: string) {
  return `${prefix}${n.toLocaleString("en-PK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

/** GSAP-powered money counter. Tweens to `value` whenever it changes. */
export default function GsapCounter({
  value,
  prefix = "Rs.",
  suffix = "",
  decimals = 0,
  duration = 0.8,
  className = "",
}: GsapCounterProps) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const obj = { v: currentRef.current };
    const tween = gsap.to(obj, {
      v: target,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        currentRef.current = obj.v;
        if (displayRef.current) {
          displayRef.current.textContent = formatNumber(obj.v, decimals, prefix, suffix);
        }
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, prefix, suffix, decimals, duration]);

  return (
    <span ref={displayRef} className={className}>
      {formatNumber(Number(value) || 0, decimals, prefix, suffix)}
    </span>
  );
}