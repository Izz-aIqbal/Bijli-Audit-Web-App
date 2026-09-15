"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimal?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  decimal = 0,
  className,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    const from = currentRef.current;
    const controls = animate(from, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => {
        currentRef.current = v;
        setDisplayValue(v);
      },
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString("en-PK", {
        maximumFractionDigits: decimal,
        minimumFractionDigits: decimal,
      })}
      {suffix}
    </span>
  );
}