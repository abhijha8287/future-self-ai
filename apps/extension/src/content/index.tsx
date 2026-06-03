import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, Clock, PenLine, ShieldCheck, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import "./styles.css";
import { detectAction, replayAction } from "./detectors";
import { saveDecision } from "../lib/storage";
import type { DecisionContext, FutureImpactReport } from "../lib/types";

type PendingDecision = {
  element: HTMLElement;
  context: DecisionContext;
  emailBodyElement?: HTMLElement;
};

function FutureSelfOverlay() {
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [report, setReport] = useState<FutureImpactReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeNotice, setActiveNotice] = useState(true);
  const enabledRef = React.useRef(true);

  React.useEffect(() => {
    chrome.storage.sync.get(["enabled"]).then((settings) => {
      enabledRef.current = settings.enabled !== false;
    });
    const settingsHandler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "sync" && changes.enabled) enabledRef.current = changes.enabled.newValue !== false;
    };
    chrome.storage.onChanged.addListener(settingsHandler);

    const openReport = (event: Event, element: HTMLElement) => {
      if (!enabledRef.current) return;
      const context = detectAction(element);
      if (!context) return;

      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
      setPending({ element, context, emailBodyElement: context.decisionType === "email" ? findEmailBody(element) || undefined : undefined });
      setLoading(true);

      let settled = false;
      const fallbackTimer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        setLoading(false);
        setReport(localFallbackReport(context));
      }, 11000);

      chrome.runtime.sendMessage({ type: "FUTURESELF_ANALYZE", payload: context }, (response) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        setLoading(false);
        if (response?.ok) {
          setReport(response.report);
        } else {
          setReport(localFallbackReport(context));
        }
      });
    };

    const clickHandler = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (document.getElementById("futureself-ai-root")?.contains(event.target)) return;
      const element = event.target.closest("button, a, input, [role='button'], #buy-now-button, #add-to-cart-button, #submitOrderButtonId, .a-button, .a-button-input") as HTMLElement | null;
      if (element) openReport(event, element);
    };

    const submitHandler = (event: SubmitEvent) => {
      if (event.target instanceof Element && document.getElementById("futureself-ai-root")?.contains(event.target)) return;
      const submitter = event.submitter instanceof HTMLElement ? event.submitter : event.target instanceof HTMLElement ? event.target : null;
      if (submitter) openReport(event, submitter);
    };

    const noticeTimer = window.setTimeout(() => setActiveNotice(false), 4200);
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("submit", submitHandler, true);
    return () => {
      window.clearTimeout(noticeTimer);
      chrome.storage.onChanged.removeListener(settingsHandler);
      document.removeEventListener("click", clickHandler, true);
      document.removeEventListener("submit", submitHandler, true);
    };
  }, []);

  const close = () => {
    setPending(null);
    setReport(null);
    setLoading(false);
  };

  const continueAnyway = async () => {
    if (pending) replayAction(pending.element);
    if (pending && report) void saveDecision(pending.context, report, "continued");
    close();
  };

  const cancel = async () => {
    if (pending && report) void saveDecision(pending.context, report, "cancelled");
    close();
  };

  const remind = async () => {
    if (pending && report) void saveDecision(pending.context, report, "remind_later");
    close();
  };

  const rewriteEmail = async () => {
    if (!pending || !report) return;
    const rewritten = professionalRewrite(pending.context.emailBody || "");
    const body = pending.emailBodyElement || findEmailBody(pending.element);
    if (body instanceof HTMLElement) {
      body.focus();
      body.innerText = rewritten;
      body.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, inputType: "insertText", data: rewritten }));
      body.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, cancelable: true }));
    }
    void saveDecision({ ...pending.context, emailBody: rewritten }, report, "rewritten");
    close();
  };

  return (
    <AnimatePresence>
      {pending ? (
        <motion.div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="flex max-h-[min(760px,calc(100vh-32px))] w-full max-w-[560px] flex-col overflow-hidden rounded-[8px] border border-white/15 bg-[#0A0D12]/95 text-white shadow-2xl"
            initial={{ scale: 0.96, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 16 }}
          >
            <header className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#70E1C8]">
                  <ShieldCheck size={16} /> Future Impact Report
                </div>
                <h2 className="text-xl font-semibold leading-tight">{pending.context.title || pending.context.actionLabel}</h2>
                <p className="mt-1 text-sm text-white/60">{pending.context.website} - {pending.context.decisionType}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-[8px] border border-white/10 text-white/70 hover:bg-white/10" onClick={close} title="Close">
                <X size={18} />
              </button>
            </header>

            {loading ? (
              <div className="grid min-h-[320px] place-items-center overflow-y-auto p-8 text-center">
                <div>
                  <Sparkles className="mx-auto mb-4 text-[#70E1C8]" size={34} />
                  <p className="text-lg font-semibold">Agents are simulating the future...</p>
                  <p className="mt-2 text-sm text-white/55">Financial, risk, emotion, memory, and opportunity-cost checks are running.</p>
                </div>
              </div>
            ) : report ? (
              <div className="min-h-0 overflow-y-auto p-5">
                <div className="grid grid-cols-3 gap-3">
                  <Metric label="Regret" value={`${report.regretProbability}%`} hot={report.regretProbability > 60} />
                  <Metric label="Confidence" value={`${report.confidenceScore}%`} />
                  <Metric label="Price" value={pending.context.price ? `Rs ${pending.context.price.toLocaleString("en-IN")}` : "N/A"} />
                </div>

                <div className="mt-4 rounded-[8px] border border-[#FFB86B]/30 bg-[#FFB86B]/10 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 shrink-0 text-[#FFB86B]" size={22} />
                    <div>
                      <p className="font-semibold">{report.recommendation}</p>
                      <p className="mt-1 text-sm text-white/70">{report.insights[0]}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {Object.entries(report.agents).map(([name, agent]) => (
                    <div key={name} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                        <span className="text-sm text-[#70E1C8]">{agent.score}/100</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-white/55">{agent.reasoning}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                  <div className="mb-2 flex items-center gap-2 font-medium text-white"><Clock size={16} /> Future Self, 1 Year</div>
                  "{report.futureSelf.oneYear}"
                </div>

                <footer className="sticky bottom-0 mt-5 grid grid-cols-1 gap-3 border-t border-white/10 bg-[#0A0D12]/95 pt-4 sm:grid-cols-3">
                  {pending.context.decisionType === "email" ? (
                    <>
                      <button className="rounded-[8px] border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10" onClick={continueAnyway}>Send Anyway</button>
                      <button className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/85" onClick={rewriteEmail}><PenLine size={16} /> Rewrite Professionally</button>
                      <button className="rounded-[8px] border border-[#70E1C8]/40 px-3 py-2 text-sm font-semibold text-[#70E1C8] hover:bg-[#70E1C8]/10" onClick={cancel}>Cancel Send</button>
                    </>
                  ) : (
                    <>
                      <button className="rounded-[8px] border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10" onClick={continueAnyway}>Continue Anyway</button>
                      <button className="rounded-[8px] bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/85" onClick={cancel}>Cancel</button>
                      <button className="rounded-[8px] border border-[#70E1C8]/40 px-3 py-2 text-sm font-semibold text-[#70E1C8] hover:bg-[#70E1C8]/10" onClick={remind}>Remind Me Later</button>
                    </>
                  )}
                </footer>
              </div>
            ) : (
              <div className="p-6">
                <p className="font-semibold">FutureSelf could not generate a report.</p>
                <button className="mt-4 rounded-[8px] bg-white px-4 py-2 text-sm font-semibold text-black" onClick={continueAnyway}>Continue Anyway</button>
              </div>
            )}
          </motion.section>
        </motion.div>
      ) : null}
      {activeNotice && !pending ? (
        <motion.div
          className="fixed bottom-5 left-5 z-[2147483646] rounded-[8px] border border-white/15 bg-[#0A0D12]/92 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <span className="mr-2 text-[#70E1C8]">●</span> FutureSelf AI is active
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Metric({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${hot ? "text-[#FFB86B]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function professionalRewrite(body: string) {
  const cleaned = body
    .replace(/!+/g, ".")
    .replace(/\b(unacceptable|ridiculous)\b/gi, "concerning")
    .replace(/\bI am tired of\b/gi, "I am concerned about")
    .replace(/\bimmediately\b/gi, "as soon as possible")
    .trim();

  if (!cleaned) {
    return "Hi,\n\nI wanted to follow up on this and would appreciate your guidance when you have a chance.\n\nThank you.";
  }

  return `Hi,\n\nI wanted to share my concern in a constructive way:\n\n${cleaned}\n\nCould you please help clarify the next steps?\n\nThank you.`;
}

function findEmailBody(actionElement: HTMLElement) {
  const compose = actionElement.closest("[role='dialog'], .M9, .AD, .nH") || document;
  return compose.querySelector("[aria-label='Message Body'], div[role='textbox'][contenteditable='true'], .Am.Al.editable") as HTMLElement | null;
}

function localFallbackReport(context: DecisionContext): FutureImpactReport {
  const pricePressure = Math.min(95, Math.round((context.price || 25000) / 900));
  const emotionPressure = context.emailBody ? Math.min(96, context.emailBody.split(/[!?]/).length * 18 + 36) : 18;
  const risk = context.decisionType === "email" ? emotionPressure : context.decisionType === "investment" ? 76 : pricePressure;
  const regretProbability = Math.max(20, Math.min(92, Math.round((pricePressure + risk + emotionPressure) / 3)));

  return {
    id: crypto.randomUUID(),
    decisionType: context.decisionType,
    regretProbability,
    confidenceScore: 74,
    recommendation: context.decisionType === "email" && regretProbability > 55 ? "Wait 30 minutes or rewrite professionally" : regretProbability > 65 ? "Wait 48 hours" : "Proceed with awareness",
    insights: [
      context.price ? `This action ties up about Rs ${context.price.toLocaleString("en-IN")} today.` : "The backend took too long, so FutureSelf used local analysis.",
      context.decisionType === "email" ? "This message may be emotionally charged." : "A short pause can reduce regret on high-intent actions.",
      "Local fallback was used because the AI service did not respond quickly."
    ],
    agents: {
      financialImpact: { score: pricePressure, reasoning: "Estimated locally from visible price and page context." },
      opportunityCost: { score: Math.min(90, pricePressure + 10), reasoning: "The same money could be saved, invested, or used for higher-priority goals." },
      riskAnalysis: { score: risk, reasoning: "Estimated locally from urgency, reversibility, and action type." },
      emotionDetection: { score: emotionPressure, reasoning: context.emailBody ? "Estimated locally from punctuation and emotionally intense language." : "No email body was detected." },
      memory: { score: 45, reasoning: "Backend memory was unavailable during this analysis." }
    },
    futureSelf: {
      oneMonth: "I am glad you paused long enough to make this intentionally.",
      oneYear: "That pause helped separate pressure from preference.",
      fiveYears: "The habit of checking consequences before acting reduced avoidable regret."
    },
    createdAt: new Date().toISOString()
  };
}

const rootEl = document.createElement("div");
rootEl.id = "futureself-ai-root";
document.documentElement.appendChild(rootEl);
createRoot(rootEl).render(<FutureSelfOverlay />);
