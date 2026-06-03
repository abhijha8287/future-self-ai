"use client";

import { CheckCircle2, Clock, MessageSquareWarning, ShoppingBag, TrendingUp } from "lucide-react";
import type { DecisionRecord } from "@/types/decision";

export function DecisionTable({ records }: { records: DecisionRecord[] }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] backdrop-blur">
      <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr] border-b border-white/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-white/40">
        <span>Decision</span>
        <span>Agent View</span>
        <span>Regret</span>
        <span>Outcome</span>
      </div>
      {records.map((record) => (
        <div key={record.id} className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr] items-center gap-3 border-b border-white/5 px-4 py-4 last:border-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-white/8 text-[#70E1C8]">
              {iconFor(record.context.decisionType)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{record.context.title || record.context.jobTitle || record.context.actionLabel}</p>
              <p className="mt-1 text-xs text-white/45">{record.context.website} - {record.context.decisionType}</p>
            </div>
          </div>
          <p className="line-clamp-2 text-xs leading-5 text-white/55">{record.report.recommendation}</p>
          <div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#FFB86B]" style={{ width: `${record.report.regretProbability}%` }} />
            </div>
            <p className="mt-1 text-xs text-white/50">{record.report.regretProbability}%</p>
          </div>
          <span className="w-fit rounded-[8px] border border-white/10 px-2.5 py-1 text-xs capitalize text-white/65">{record.outcome.replace("_", " ")}</span>
        </div>
      ))}
    </div>
  );
}

function iconFor(type: string) {
  if (type === "purchase") return <ShoppingBag size={18} />;
  if (type === "email") return <MessageSquareWarning size={18} />;
  if (type === "investment") return <TrendingUp size={18} />;
  return <CheckCircle2 size={18} />;
}
