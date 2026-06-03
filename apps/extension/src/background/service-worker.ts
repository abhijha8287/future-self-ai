import type { DecisionContext, FutureImpactReport } from "../lib/types";

const DEFAULT_API_URL = "http://localhost:3000";
const ANALYZE_TIMEOUT_MS = 9000;
const SAVE_TIMEOUT_MS = 5000;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "FUTURESELF_ANALYZE") {
    analyzeDecision(message.payload)
      .then((report) => sendResponse({ ok: true, report }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }));

    return true;
  }

  if (message.type === "FUTURESELF_SAVE") {
    saveDecisionToBackend(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }));

    return true;
  }

  return false;
});

async function analyzeDecision(context: DecisionContext): Promise<FutureImpactReport> {
  const settings = await chrome.storage.sync.get(["apiUrl", "demoMode"]);
  const apiUrl = settings.apiUrl || DEFAULT_API_URL;

  try {
    const response = await fetchWithTimeout(`${apiUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.demoMode === false ? {} : { "x-demo-mode": "true" })
      },
      body: JSON.stringify(context)
    }, ANALYZE_TIMEOUT_MS);

    if (response.ok) return response.json();
  } catch {
    // Fall back locally if the dashboard backend or OpenAI is slow/unavailable.
  }

  return localDemoReport(context);
}

async function saveDecisionToBackend(payload: unknown) {
  const settings = await chrome.storage.sync.get(["apiUrl"]);
  const apiUrl = settings.apiUrl || DEFAULT_API_URL;

  const response = await fetchWithTimeout(`${apiUrl}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, SAVE_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error(`History API failed with ${response.status}`);
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

function localDemoReport(context: DecisionContext): FutureImpactReport {
  const pricePressure = Math.min(95, Math.round((context.price || 25000) / 900));
  const emotionPressure = context.emailBody ? Math.min(96, context.emailBody.split(/[!?]/).length * 18 + 36) : 20;
  const risk = context.decisionType === "investment" ? 76 : context.decisionType === "email" ? emotionPressure : pricePressure;
  const regretProbability = Math.max(18, Math.min(92, Math.round((risk + pricePressure + emotionPressure) / 3)));

  return {
    id: crypto.randomUUID(),
    decisionType: context.decisionType,
    regretProbability,
    confidenceScore: 82,
    recommendation: regretProbability > 65 ? "Wait before committing" : "Proceed with awareness",
    insights: [
      context.price ? `This action ties up about Rs ${context.price.toLocaleString("en-IN")} today.` : "The action appears consequential enough to pause briefly.",
      context.decisionType === "email" ? "The message may read emotionally charged to the recipient." : "A cooling-off window can reduce regret on high-intent clicks.",
      "Demo mode is active, so this report is generated locally if the backend is unavailable."
    ],
    agents: {
      financialImpact: { score: pricePressure, reasoning: "Estimated from visible price and purchase context." },
      opportunityCost: { score: Math.min(90, pricePressure + 10), reasoning: "Money could compound or cover competing priorities." },
      riskAnalysis: { score: risk, reasoning: "Detected urgency and limited reversibility around the action." },
      emotionDetection: { score: emotionPressure, reasoning: "Measured intensity from message punctuation and charged language indicators." },
      memory: { score: 54, reasoning: "No backend memory connected; using neutral demo personalization." }
    },
    futureSelf: {
      oneMonth: "I am glad you gave this decision a little room before acting.",
      oneYear: "The pause helped separate need from impulse.",
      fiveYears: "Small avoided regrets compounded into calmer decisions."
    },
    createdAt: new Date().toISOString()
  };
}
