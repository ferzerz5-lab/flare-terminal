import { useEffect, useState } from "react";

const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-.:";

function randomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

function SplitFlapChar({ target, delay = 0, colorClass = "text-amber" }) {
  const [display, setDisplay] = useState(" ");

  useEffect(() => {
    let cancelled = false;
    let flips = 0;
    const maxFlips = 6 + Math.floor(Math.random() * 6);

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (cancelled) return;
        flips += 1;
        if (flips >= maxFlips) {
          setDisplay(target);
          clearInterval(interval);
        } else {
          setDisplay(randomChar());
        }
      }, 45);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [target, delay]);

  return (
    <span className={`inline-flex items-center justify-center w-[0.62em] h-[1.3em] bg-panel border border-black/40 rounded-[2px] ${colorClass} font-mono font-semibold leading-[1.3em] shadow-[inset_0_-1px_0_rgba(0,0,0,0.5)] relative overflow-hidden`}>
      {display}
      <span className="absolute left-0 right-0 top-1/2 h-[1px] bg-black/50" />
    </span>
  );
}

export default function SplitFlapText({ text, className = "", stagger = 25, colorClass = "text-amber" }) {
  const chars = text.toUpperCase().split("");
  return (
    <span className={`inline-flex gap-[2px] ${className}`}>
      {chars.map((c, i) => (
        <SplitFlapChar key={`${text}-${i}`} target={c} delay={i * stagger} colorClass={colorClass} />
      ))}
    </span>
  );
}