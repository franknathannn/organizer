"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";
import {
  CheckCircle2,
  Wallet,
  CalendarCheck,
  PiggyBank,
  BellRing,
  Users,
  ArrowRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

/* ------------------------------------------------------------------
   TASK ORGANIZER & FINANCE TRACKING — main dashboard / intro page
   Aesthetic: "the planner you'd actually keep on your desk" — an
   open notebook with a spiral spine, ruled paper, and two sticking-
   out tabs (Tasks / Finance) you can click between. Ink navy +
   warm paper + coral/mint highlighter accents instead of the usual
   cream+terracotta or dark+neon defaults.
------------------------------------------------------------------- */

const INK = "#16213E";
const PAPER = "#F1EEE2";
const PAPER_LINE = "#DCD5BE";
const CORAL = "#FF6B54";
const MINT = "#3FA687";
const MUSTARD = "#F2A73B";

export default function DashboardIntroPage() {
  const [tab, setTab] = useState<"tasks" | "finance">("tasks");
  const { scrollYProgress } = useScroll();
  const ringRotate = useTransform(scrollYProgress, [0, 0.3], [0, 8]);

  return (
    <PageTransition>
      <div
        className="min-h-screen w-full overflow-x-hidden"
        style={{
          background: PAPER,
          color: INK,
          fontFamily:
            "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Fonts (move these into next/font in layout.tsx for production) */}
        <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap");
        .font-display {
          font-family: "Fraunces", serif;
          font-feature-settings: "ss01";
        }
        .font-mono {
          font-family: "IBM Plex Mono", ui-monospace, monospace;
        }
        .paper-rules {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 35px,
            ${PAPER_LINE} 36px
          );
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

        {/* ---------------- NAV ---------------- */}
        <header className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: INK }}
            >
              <BookOpen size={18} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              task/organizer
            </span>
          </div>
          <Link
            href="/login"
            className="group flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all hover:gap-2.5"
            style={{ borderColor: INK }}
          >
            Log in
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </header>

        {/* ---------------- HERO ---------------- */}
        <section className="relative px-6 pb-20 pt-6 sm:px-10 sm:pt-10 lg:pb-32">
          {/* floating highlighter blobs for ambience */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: MUSTARD, opacity: 0.25 }}
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full blur-3xl"
            style={{ background: MINT, opacity: 0.2 }}
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <span
                className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{ background: INK, color: PAPER }}
              >
                <Sparkles size={13} /> Built for student life
              </span>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Your task, your cash,
                <br />
                <span style={{ color: CORAL }}>one open notebook.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-slate-700 sm:text-lg">
                Task organizer &amp; finance tracking is the single dashboard
                where assignments, deadlines, and your student budget finally
                live on the same page — literally.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="group flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
                  style={{ background: INK, boxShadow: `0 12px 24px -8px ${INK}66` }}
                >
                  Get started, it's free
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <a
                  href="#how-it-works"
                  className="text-sm font-semibold underline decoration-2 underline-offset-4"
                  style={{ textDecorationColor: CORAL }}
                >
                  See how it works
                </a>
              </div>
              <div className="mt-10 flex gap-8 font-mono text-xs text-slate-600">
                <div>
                  <p className="text-2xl font-semibold" style={{ color: INK }}>
                    0
                  </p>
                  <p>missed deadlines this week</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{ color: MINT }}>
                    ₱2,150
                  </p>
                  <p>left in this month's budget</p>
                </div>
              </div>
            </motion.div>

            {/* the notebook — signature element */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
              className="relative"
            >
              <div
                className="relative mx-auto max-w-md rounded-[22px] p-6 shadow-2xl sm:p-8"
                style={{
                  background: "#FFFDF7",
                  border: `1px solid ${PAPER_LINE}`,
                  boxShadow: "0 30px 60px -20px rgba(22,33,62,0.35)",
                }}
              >
                {/* spiral binding */}
                <div className="absolute -left-3 top-6 flex flex-col gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span
                      key={i}
                      className="block h-3 w-3 rounded-full border-2"
                      style={{ borderColor: INK, background: PAPER }}
                    />
                  ))}
                </div>

                {/* tabs */}
                <div className="mb-5 flex gap-2 pl-3">
                  <button
                    onClick={() => setTab("tasks")}
                    className="rounded-t-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{
                      background: tab === "tasks" ? CORAL : "transparent",
                      color: tab === "tasks" ? "#fff" : INK,
                    }}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setTab("finance")}
                    className="rounded-t-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{
                      background: tab === "finance" ? MINT : "transparent",
                      color: tab === "finance" ? "#fff" : INK,
                    }}
                  >
                    Finance
                  </button>
                </div>

                <div className="paper-rules min-h-[280px] pl-3">
                  {tab === "tasks" ? (
                    <motion.ul
                      key="tasks"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-[35px] pt-1"
                    >
                      {[
                        { t: "Finish Econ 202 problem set", done: true },
                        { t: "Group project — draft slides", done: true },
                        { t: "Chem lab report", done: false },
                        { t: "Register for next term", done: false },
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <CheckCircle2
                            size={18}
                            style={{
                              color: item.done ? MINT : PAPER_LINE,
                            }}
                          />
                          <span
                            className={item.done ? "line-through opacity-50" : ""}
                          >
                            {item.t}
                          </span>
                        </li>
                      ))}
                    </motion.ul>
                  ) : (
                    <motion.div
                      key="finance"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center gap-6 pt-3"
                    >
                      <BudgetRing rotate={ringRotate} />
                      <ul className="flex-1 space-y-[18px] font-mono text-xs">
                        <li className="flex justify-between">
                          <span>Food</span>
                          <span style={{ color: CORAL }}>₱3,200</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Books &amp; supplies</span>
                          <span style={{ color: MUSTARD }}>₱1,150</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Transport</span>
                          <span style={{ color: MINT }}>₱900</span>
                        </li>
                        <li className="flex justify-between border-t pt-2 font-semibold">
                          <span>Left this month</span>
                          <span style={{ color: INK }}>₱2,150</span>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ---------------- WHAT IT DOES ---------------- */}
        <section className="px-6 py-20 sm:px-10 lg:py-28" style={{ background: INK, color: PAPER }}>
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-16 max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                Two notebooks. One student. Zero apps to juggle.
              </h2>
              <p className="mt-4 text-sm text-slate-300 sm:text-base">
                Every deadline and every peso, tracked in the same place your
                day already lives.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              <FeatureCard
                icon={<CalendarCheck size={22} />}
                accent={CORAL}
                title="Task organizer"
                body="Classes, assignments, and group projects laid out on a real calendar — with reminders before things are actually due, not after."
              />
              <FeatureCard
                icon={<Wallet size={22} />}
                accent={MINT}
                title="Finance tracking"
                body="Log allowance, part-time income, and spending in seconds. See exactly what's left before the month runs out, not after."
              />
              <FeatureCard
                icon={<BellRing size={22} />}
                accent={MUSTARD}
                title="Smart reminders"
                body="Nudges for upcoming deadlines and upcoming bills, tuned to how far ahead you actually plan."
              />
              <FeatureCard
                icon={<Users size={22} />}
                accent={CORAL}
                title="Shared expenses"
                body="Splitting rent, groceries, or a group trip? Track who owes what without the group-chat math."
              />
            </div>
          </div>
        </section>

        {/* ---------------- HOW IT WORKS ---------------- */}
        <section id="how-it-works" className="px-6 py-20 sm:px-10 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-14 text-center font-display text-3xl font-semibold sm:text-4xl"
            >
              Set up in three flips of the page
            </motion.h2>
            <div className="grid gap-10 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Create your account",
                  d: "Sign up in under a minute — no credit card, no syllabus required.",
                },
                {
                  n: "02",
                  t: "Add classes & budget",
                  d: "Drop in your term schedule and set a monthly spending target.",
                },
                {
                  n: "03",
                  t: "Stay ahead, automatically",
                  d: "Get reminders and a running total so nothing sneaks up on you.",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative rounded-2xl p-6"
                  style={{ background: "#FFFDF7", border: `1px solid ${PAPER_LINE}` }}
                >
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: CORAL }}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{s.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FINAL CTA ---------------- */}
        <section className="px-6 pb-24 sm:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-[28px] px-8 py-14 text-center sm:flex-row sm:justify-between sm:text-left"
            style={{ background: INK, color: PAPER }}
          >
            <div>
              <h3 className="font-display text-2xl font-semibold sm:text-3xl">
                Open your notebook.
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Tasks and money, finally on the same page.
              </p>
            </div>
            <Link
              href="/login"
              className="flex shrink-0 items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.04] active:scale-[0.98]"
              style={{ background: CORAL, color: "#fff" }}
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </section>

        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t px-6 py-8 text-center text-xs text-slate-500 sm:px-10" style={{ borderColor: PAPER_LINE }}>
          <p>Task organizer &amp; finance tracking — made for students, by students.</p>
        </footer>
      </div>
    </PageTransition>
  );
}

/* ---------- sub components ---------- */

function FeatureCard({
  icon,
  accent,
  title,
  body,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl p-6"
      style={{ background: "rgba(241,238,226,0.06)", border: "1px solid rgba(241,238,226,0.15)" }}
    >
      <span
        className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: accent, color: "#fff" }}
      >
        {icon}
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{body}</p>
    </motion.div>
  );
}

function BudgetRing({ rotate }: { rotate: any }) {
  const pct = 62; // percent of budget remaining, drives the ring fill
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <motion.svg
      width="92"
      height="92"
      viewBox="0 0 92 92"
      style={{ rotate }}
      className="shrink-0"
    >
      <circle
        cx="46"
        cy="46"
        r={r}
        fill="none"
        stroke={PAPER_LINE}
        strokeWidth="9"
      />
      <motion.circle
        cx="46"
        cy="46"
        r={r}
        fill="none"
        stroke={MINT}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c - (c * pct) / 100 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        transform="rotate(-90 46 46)"
      />
      <text
        x="46"
        y="51"
        textAnchor="middle"
        fontSize="16"
        fontWeight={700}
        fill={INK}
      >
        {pct}%
      </text>
    </motion.svg>
  );
}