"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, CircleDollarSign, History, MailWarning, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DecisionTable } from "@/components/DecisionTable";
import { RegretHeatmap } from "@/components/RegretHeatmap";
import type { DecisionRecord } from "@/types/decision";

export default function DashboardPage() {
  const [records, setRecords] = React.useState<DecisionRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/history", { cache: "no-store" });
    setRecords(await response.json());
    setLoading(false);
  }, []);

  const loadDemo = React.useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/demo", { method: "POST" });
    setRecords(await response.json());
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadHistory();
    const interval = window.setInterval(loadHistory, 5000);
    return () => window.clearInterval(interval);
  }, [loadHistory]);

  const total = records.length;
  const regretPrevented = records.filter((record) => record.outcome === "cancelled" || record.outcome === "remind_later" || record.outcome === "rewritten").length;
  const moneySaved = records.reduce((sum, record) => sum + (record.outcome !== "continued" ? record.context.price || 0 : 0), 0);
  const emailsPrevented = records.filter((record) => record.context.decisionType === "email" && ["cancelled", "remind_later", "rewritten"].includes(record.outcome)).length;
  const strongestInsight = records[0]?.report.insights[0] || "Generate demo data to view agent insights.";

  return (
    <main className="min-h-screen px-5 py-6 md:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#70E1C8]/14 text-[#70E1C8]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">FutureSelf AI</h1>
            <p className="text-xs text-white/45">See the consequences before making the decision.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadHistory} className="grid h-10 w-10 place-items-center rounded-[8px] border border-white/10 text-white/75 hover:bg-white/10" title="Refresh history">
            <RefreshCw size={16} />
          </button>
          <button onClick={loadDemo} className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/85">
            <Sparkles size={16} /> Generate Demo
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 py-6 lg:grid-cols-[1fr_360px]">
        <div>
          <motion.div
            className="rounded-[8px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#70E1C8]">Decision intelligence</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">AI agents that pause consequential clicks before regret gets a vote.</h2>
              </div>
              <div className="rounded-[8px] border border-white/10 bg-black/20 p-4 md:w-72">
                <p className="text-xs text-white/45">Strongest live insight</p>
                <p className="mt-2 text-sm leading-6 text-white/75">{strongestInsight}</p>
              </div>
            </div>
          </motion.div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Decisions" value={loading ? "..." : String(total)} sublabel="Purchases, emails, jobs, subscriptions, investments" icon={History} />
            <MetricCard label="Regret Prevented" value={loading ? "..." : String(regretPrevented)} sublabel="Actions cancelled or delayed after report" icon={ShieldCheck} tone="violet" />
            <MetricCard label="Money Saved" value={loading ? "..." : `Rs ${moneySaved.toLocaleString("en-IN")}`} sublabel="Potential spend paused by FutureSelf" icon={CircleDollarSign} tone="ember" />
            <MetricCard label="Emails Prevented" value={loading ? "..." : String(emailsPrevented)} sublabel="Emotionally charged messages stopped" icon={MailWarning} />
          </div>

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Decision History</h2>
              <span className="text-xs text-white/40">Live extension decisions + demo generator</span>
            </div>
            {records.length ? (
              <DecisionTable records={records} />
            ) : (
              <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-8 text-center backdrop-blur">
                <ShieldCheck className="mx-auto text-[#70E1C8]" size={34} />
                <p className="mt-4 text-base font-semibold text-white">No decisions captured yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">Load the extension, click Buy Now or Add to Cart on Amazon, then choose an outcome in the report. This dashboard will update automatically.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Brain className="text-[#A78BFA]" size={20} />
              <h2 className="text-base font-semibold">Agent Insights</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {records[0] ? Object.entries(records[0].report.agents).map(([name, agent]) => (
                <div key={name} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm capitalize text-white/80">{name.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-sm font-semibold text-[#70E1C8]">{agent.score}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/45">{agent.reasoning}</p>
                </div>
              )) : (
                <p className="rounded-[8px] border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/50">Agent insights appear after the first captured decision or after generating demo data.</p>
              )}
            </div>
          </div>

          <RegretHeatmap records={records} />

          <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
            <h2 className="text-base font-semibold">Decision Journal</h2>
            <div className="mt-3 grid gap-3">
              {records.slice(0, 3).map((record) => (
                <article key={record.id} className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium text-white/85">{record.context.title || record.context.actionLabel}</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">{record.report.futureSelf.fiveYears}</p>
                </article>
              ))}
              {!records.length ? <p className="text-sm leading-6 text-white/50">Your future-self notes will appear here after decisions are analyzed.</p> : null}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
