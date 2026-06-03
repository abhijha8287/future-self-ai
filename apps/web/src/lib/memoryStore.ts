import type { DecisionContext, FutureImpactReport } from "@/types/decision";

type MemoryItem = {
  id: string;
  summary: string;
  metadata: Record<string, string | number | undefined>;
};

const inMemoryItems: MemoryItem[] = [];

export async function storeDecisionMemory(context: DecisionContext, report: FutureImpactReport) {
  const item: MemoryItem = {
    id: report.id,
    summary: `${context.decisionType}: ${context.title || context.actionLabel} -> ${report.recommendation}`,
    metadata: {
      decisionType: context.decisionType,
      website: context.website,
      regretProbability: report.regretProbability,
      price: context.price
    }
  };

  inMemoryItems.unshift(item);

  if (process.env.CHROMA_URL) {
    await upsertChroma(item).catch(() => undefined);
  }
}

export async function getMemoryInsight(context: DecisionContext) {
  const related = inMemoryItems.filter((item) => item.metadata.decisionType === context.decisionType).slice(0, 3);
  if (!related.length) {
    return "No strong personal history yet. FutureSelf is using general regret patterns.";
  }
  return `Similar history found: ${related.map((item) => item.summary).join("; ")}`;
}

async function upsertChroma(item: MemoryItem) {
  await fetch(`${process.env.CHROMA_URL}/api/v1/collections/${process.env.CHROMA_COLLECTION || "futureself_decisions"}/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ids: [item.id],
      documents: [item.summary],
      metadatas: [item.metadata]
    })
  });
}
