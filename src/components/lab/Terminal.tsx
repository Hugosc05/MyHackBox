"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LogEntry } from "@/lib/lab-engine/types";
import { cn } from "@/lib/utils";

const KIND_CLASS: Record<string, string> = {
  input: "text-[var(--color-text)]",
  output: "text-[var(--color-muted)]",
  system: "text-[var(--color-cyan)]",
  success: "text-[var(--color-neon)]",
  error: "text-[var(--color-magenta)]"
};

interface Props {
  log: LogEntry[];
  onRun: (cmd: string) => void;
  placeholder?: string;
}

export default function Terminal({ log, onRun, placeholder = "type a command" }: Props) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hpos, setHpos] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const v = value;
      if (v.trim()) setHistory((h) => [v, ...h]);
      setHpos(-1);
      setValue("");
      onRun(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(hpos + 1, history.length - 1);
      if (history[next] !== undefined) {
        setHpos(next);
        setValue(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = hpos - 1;
      setHpos(next);
      setValue(next < 0 ? "" : history[next] ?? "");
    }
  };

  return (
    <div
      className="scanlines relative flex h-full flex-col overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)]"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-xs text-[var(--color-muted)]">root@myhackbox:~/target</span>
      </div>

      <div ref={scrollRef} className="thin-scroll flex-1 space-y-1 overflow-y-auto p-4 text-[13px] leading-relaxed">
        <AnimatePresence initial={false}>
          {log.map((entry) => (
            <motion.pre
              key={entry.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("whitespace-pre-wrap break-words font-mono", KIND_CLASS[entry.kind])}
            >
              {entry.kind === "input" ? `┌─$ ${entry.text}` : entry.text}
            </motion.pre>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--color-line)] px-4 py-3">
        <span className="neon-text select-none">└─$</span>
        <input
          ref={inputRef}
          value={value}
          spellCheck={false}
          autoComplete="off"
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-[13px] text-[var(--color-neon)] caret-transparent outline-none placeholder:text-[var(--color-muted)]"
          placeholder={placeholder}
        />
        <span className="caret" />
      </div>
    </div>
  );
}
