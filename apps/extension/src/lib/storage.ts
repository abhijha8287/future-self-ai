import type { DecisionContext, FutureImpactReport } from "./types";

const HISTORY_KEY = "futureself_decision_history";

export async function saveDecision(context: DecisionContext, report: FutureImpactReport, outcome: string) {
  const record = {
    id: report.id,
    context,
    report,
    outcome,
    createdAt: new Date().toISOString()
  };
  const existing = await chrome.storage.local.get(HISTORY_KEY);
  const history = Array.isArray(existing[HISTORY_KEY]) ? existing[HISTORY_KEY] : [];
  await chrome.storage.local.set({
    [HISTORY_KEY]: [
      record,
      ...history
    ].slice(0, 100)
  });

  await sendMessage({ type: "FUTURESELF_SAVE", payload: record }).catch(() => undefined);
}

export async function getDecisionHistory() {
  const existing = await chrome.storage.local.get(HISTORY_KEY);
  return Array.isArray(existing[HISTORY_KEY]) ? existing[HISTORY_KEY] : [];
}

function sendMessage(message: unknown) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });
}
