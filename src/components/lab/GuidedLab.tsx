"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { guidedBySlug } from "@/lib/content/guided";
import { useLabStore } from "@/store/useLabStore";
import { api } from "@/lib/api";
import Terminal from "./Terminal";
import SqlSimulator from "./SqlSimulator";
import TutorialPanel from "./TutorialPanel";

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } })
};

export default function GuidedLab({ slug }: { slug: string }) {
  const lab = guidedBySlug(slug);
  const init = useLabStore((s) => s.init);
  const restore = useLabStore((s) => s.restore);
  const run = useLabStore((s) => s.run);
  const log = useLabStore((s) => s.log);
  const index = useLabStore((s) => s.state.index);
  const status = useLabStore((s) => s.state.status);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!lab) return;
    init(lab);
    hydrated.current = false;
    api
      .getProgress(lab.slug)
      .then((r) => {
        if (r.progress && r.progress.currentStepIndex > 0) restore(r.progress.currentStepIndex);
      })
      .finally(() => {
        hydrated.current = true;
      });
  }, [init, restore, lab]);

  useEffect(() => {
    if (!hydrated.current || !lab) return;
    api.saveProgress(lab.slug, index, status === "completed");
  }, [index, status, lab]);

  if (!lab) return null;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[1600px] flex-col gap-4 p-4 lg:p-6">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="neon-text text-lg">▚</span>
          <span className="text-sm tracking-widest text-[var(--color-muted)]">
            MYHACKBOX / LAB / <span className="text-[var(--color-text)]">{lab.category}</span>
          </span>
        </Link>
        <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
          entorno guiado · simulado
        </span>
      </motion.header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr_0.9fr]">
        <motion.section variants={rise} custom={0} initial="hidden" animate="show" className="min-h-0">
          <Terminal log={log} onRun={run} placeholder="login admin :: 1234" />
        </motion.section>
        <motion.section variants={rise} custom={1} initial="hidden" animate="show" className="min-h-0">
          <SqlSimulator />
        </motion.section>
        <motion.section variants={rise} custom={2} initial="hidden" animate="show" className="min-h-0">
          <TutorialPanel lab={lab} />
        </motion.section>
      </div>
    </div>
  );
}
