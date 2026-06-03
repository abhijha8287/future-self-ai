import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, sublabel, icon: Icon, tone = "signal" }: { label: string; value: string; sublabel: string; icon: LucideIcon; tone?: "signal" | "ember" | "violet" }) {
  const color = tone === "ember" ? "text-[#FFB86B] bg-[#FFB86B]/12" : tone === "violet" ? "text-[#A78BFA] bg-[#A78BFA]/12" : "text-[#70E1C8] bg-[#70E1C8]/12";
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-black/10 backdrop-blur">
      <div className={`grid h-10 w-10 place-items-center rounded-[8px] ${color}`}>
        <Icon size={20} />
      </div>
      <p className="mt-5 text-sm text-white/55">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{sublabel}</p>
    </div>
  );
}
