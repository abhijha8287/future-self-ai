import type { DecisionRecord } from "@/types/decision";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function RegretHeatmap({ records }: { records: DecisionRecord[] }) {
  const cells = Array.from({ length: 28 }, (_, index) => {
    const record = records[index % records.length];
    const value = record ? Math.max(18, Math.min(95, record.report.regretProbability + ((index * 7) % 26) - 13)) : 0;
    return value;
  });

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Regret Heatmap</h2>
        <span className="text-xs text-white/45">{records.length ? "Live pattern" : "Waiting"}</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => <span key={day} className="text-center text-[11px] text-white/35">{day}</span>)}
        {cells.map((value, index) => (
          <div
            key={index}
            className="aspect-square rounded-[6px] border border-white/5"
            title={`${value}% regret pressure`}
            style={{ backgroundColor: heatColor(value) }}
          />
        ))}
      </div>
    </div>
  );
}

function heatColor(value: number) {
  if (value > 70) return "rgba(255, 184, 107, 0.85)";
  if (value > 45) return "rgba(167, 139, 250, 0.58)";
  return "rgba(112, 225, 200, 0.38)";
}
