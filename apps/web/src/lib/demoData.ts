import type { DecisionContext, DecisionRecord } from "@/types/decision";
import { runDecisionEngine } from "./decisionEngine";

export const demoContexts: DecisionContext[] = [
  {
    decisionType: "purchase",
    website: "Amazon",
    title: "iPhone 17 Pro 256GB",
    price: 149900,
    category: "Smartphones",
    actionLabel: "Buy Now",
    url: "https://www.amazon.in/demo-iphone",
    capturedAt: new Date().toISOString()
  },
  {
    decisionType: "email",
    website: "Gmail",
    title: "Reply to manager",
    emailBody: "This is unacceptable! I am tired of this delay and need an answer immediately.",
    actionLabel: "Send",
    url: "https://mail.google.com/demo",
    capturedAt: new Date().toISOString()
  },
  {
    decisionType: "job",
    website: "LinkedIn Jobs",
    title: "Senior Product Engineer",
    jobTitle: "Senior Product Engineer",
    company: "NovaScale AI",
    salary: "Rs 35,00,000 - Rs 48,00,000",
    actionLabel: "Apply",
    url: "https://www.linkedin.com/jobs/demo",
    capturedAt: new Date().toISOString()
  },
  {
    decisionType: "investment",
    website: "Groww",
    title: "Small Cap Momentum Fund",
    price: 50000,
    category: "Mutual Fund",
    actionLabel: "Invest",
    url: "https://groww.in/demo",
    capturedAt: new Date().toISOString()
  }
];

export async function generateDemoRecords(): Promise<DecisionRecord[]> {
  const reports = await Promise.all(demoContexts.map((context) => runDecisionEngine(context, true)));
  return reports.map((report, index) => ({
    id: report.id,
    context: demoContexts[index],
    report,
    outcome: index === 1 ? "cancelled" : index === 2 ? "good" : "remind_later",
    createdAt: report.createdAt
  }));
}
