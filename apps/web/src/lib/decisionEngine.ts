import type { AgentResult, DecisionContext, FutureImpactReport } from "@/types/decision";
import { clampScore, futureValue, rupee } from "./scoring";
import { getMemoryInsight, storeDecisionMemory } from "./memoryStore";
import { addDecisionRecord } from "./historyStore";

const OPENAI_TIMEOUT_MS = 7000;

export async function runDecisionEngine(context: DecisionContext, demoMode = false): Promise<FutureImpactReport> {
  const [financialImpact, opportunityCost, riskAnalysis, emotionDetection, memory] = await Promise.all([
    financialImpactAgent(context),
    opportunityCostAgent(context),
    riskAnalysisAgent(context),
    emotionDetectionAgent(context),
    memoryAgent(context)
  ]);

  const weighted =
    financialImpact.score * 0.26 +
    opportunityCost.score * 0.2 +
    riskAnalysis.score * 0.28 +
    emotionDetection.score * 0.16 +
    memory.score * 0.1;

  const regretProbability = clampScore(weighted);
  const report: FutureImpactReport = {
    id: crypto.randomUUID(),
    decisionType: context.decisionType,
    regretProbability,
    confidenceScore: demoMode ? 84 : process.env.OPENAI_API_KEY ? 89 : 78,
    recommendation: recommendationFor(context, regretProbability),
    insights: buildInsights(context, regretProbability, opportunityCost, memory),
    agents: { financialImpact, opportunityCost, riskAnalysis, emotionDetection, memory },
    futureSelf: futureSelfSimulation(context, regretProbability),
    createdAt: new Date().toISOString()
  };

  const enrichedReport = await maybeEnrichWithOpenAI(context, report);

  await storeDecisionMemory(context, enrichedReport);
  addDecisionRecord({
    id: enrichedReport.id,
    context,
    report: enrichedReport,
    outcome: "pending",
    createdAt: enrichedReport.createdAt
  });

  return enrichedReport;
}

async function financialImpactAgent(context: DecisionContext): Promise<AgentResult> {
  const amount = context.price || 0;
  const score = context.decisionType === "purchase" || context.decisionType === "investment"
    ? clampScore(amount / 1800 + (amount > 100000 ? 18 : 0))
    : context.decisionType === "job"
      ? 24
      : 12;
  return {
    score,
    reasoning: amount
      ? `${rupee(amount)} creates a ${score > 65 ? "meaningful" : "manageable"} near-term cash impact.`
      : "No direct spend detected, so financial pressure is limited."
  };
}

async function opportunityCostAgent(context: DecisionContext): Promise<AgentResult> {
  const amount = context.price || 0;
  if (!amount) {
    return {
      score: context.decisionType === "job" ? 18 : 30,
      reasoning: context.decisionType === "job" ? "Applying preserves optionality with low immediate cost." : "No visible amount, so opportunity cost is estimated from action type."
    };
  }
  const future = futureValue(amount);
  return {
    score: clampScore(amount / 1500 + 8),
    reasoning: `${rupee(amount)} today could become about ${rupee(future)} in 10 years at an 11% annual return.`
  };
}

async function riskAnalysisAgent(context: DecisionContext): Promise<AgentResult> {
  const label = `${context.actionLabel || ""} ${context.title || ""}`.toLowerCase();
  const urgency = /(now|limited|last|urgent|immediately|flash|deal)/.test(label) ? 20 : 0;
  const reversibility = context.decisionType === "email" || context.decisionType === "investment" ? 28 : 14;
  const score = clampScore(28 + urgency + reversibility + (context.price && context.price > 75000 ? 16 : 0));
  return {
    score,
    reasoning: score > 65
      ? "The decision has urgency or low reversibility, so a pause is recommended."
      : "Downside risk is present but not extreme based on available page context."
  };
}

async function emotionDetectionAgent(context: DecisionContext): Promise<AgentResult> {
  const body = context.emailBody || "";
  if (!body) {
    return { score: 8, reasoning: "No emotional message content detected for this action." };
  }
  const chargedWords = ["unacceptable", "angry", "tired", "immediately", "frustrated", "ridiculous", "never"];
  const matches = chargedWords.filter((word) => body.toLowerCase().includes(word)).length;
  const punctuation = (body.match(/[!?]/g) || []).length;
  const score = clampScore(30 + matches * 14 + punctuation * 8);
  return {
    score,
    reasoning: score > 70
      ? "The email reads emotionally charged and may benefit from a calmer rewrite."
      : "Tone appears mostly controlled, with limited emotional intensity."
  };
}

async function memoryAgent(context: DecisionContext): Promise<AgentResult> {
  const insight = await getMemoryInsight(context);
  const repeatImpulse = /similar history/i.test(insight) && context.decisionType === "purchase";
  return {
    score: repeatImpulse ? 72 : 42,
    reasoning: insight
  };
}

function recommendationFor(context: DecisionContext, regretProbability: number) {
  if (context.decisionType === "email" && regretProbability > 55) return "Wait 30 minutes or rewrite professionally";
  if (context.decisionType === "job" && regretProbability < 50) return "Apply";
  if (regretProbability > 70) return "Wait 48 hours";
  if (regretProbability > 48) return "Pause and compare alternatives";
  return "Proceed with awareness";
}

function buildInsights(context: DecisionContext, regretProbability: number, opportunityCost: AgentResult, memory: AgentResult) {
  const insights = [opportunityCost.reasoning, memory.reasoning];
  if (context.decisionType === "email") insights.unshift("Emotionally charged messages tend to age poorly after the immediate moment passes.");
  if (context.decisionType === "job") insights.unshift(`${context.company || "This company"} appears worth evaluating for growth, compensation, and role fit.`);
  if (regretProbability > 65) insights.push("A short delay is likely to improve decision quality without closing the option.");
  return insights.slice(0, 4);
}

function futureSelfSimulation(context: DecisionContext, regretProbability: number) {
  const object = context.title || context.jobTitle || context.actionLabel || "this decision";
  if (regretProbability > 65) {
    return {
      oneMonth: `I am relieved you paused before committing to ${object}.`,
      oneYear: "That extra moment helped us avoid a decision made under pressure.",
      fiveYears: "The habit of pausing before high-impact choices became more valuable than any single decision."
    };
  }
  return {
    oneMonth: `I am glad you made ${object} deliberately instead of impulsively.`,
    oneYear: "This decision fit the bigger direction because you checked the tradeoffs first.",
    fiveYears: "Calm, examined choices built a life with fewer avoidable regrets."
  };
}

async function maybeEnrichWithOpenAI(context: DecisionContext, report: FutureImpactReport) {
  if (!process.env.OPENAI_API_KEY || process.env.DISABLE_OPENAI === "true") return report;

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are FutureSelf AI. Improve the insights and future-self messages in concise, practical language. Return JSON only."
          },
          {
            role: "user",
            content: JSON.stringify({ context, report })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "future_self_enrichment",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                insights: { type: "array", items: { type: "string" } },
                futureSelf: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    oneMonth: { type: "string" },
                    oneYear: { type: "string" },
                    fiveYears: { type: "string" }
                  },
                  required: ["oneMonth", "oneYear", "fiveYears"]
                }
              },
              required: ["insights", "futureSelf"]
            }
          }
        }
      })
    }, OPENAI_TIMEOUT_MS);

    if (!response.ok) return report;
    const json = await response.json();
    const text = json.output_text || json.output?.[0]?.content?.[0]?.text;
    const enriched = text ? JSON.parse(text) : undefined;
    return enriched ? { ...report, insights: enriched.insights, futureSelf: enriched.futureSelf } : report;
  } catch {
    return report;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
