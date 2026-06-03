export type DecisionType = "purchase" | "email" | "job" | "subscription" | "investment";

export type DecisionContext = {
  decisionType: DecisionType;
  website: string;
  title?: string;
  price?: number;
  category?: string;
  emailBody?: string;
  jobTitle?: string;
  company?: string;
  salary?: string;
  actionLabel?: string;
  url: string;
  capturedAt: string;
};

export type AgentResult = {
  score: number;
  reasoning: string;
};

export type FutureImpactReport = {
  id: string;
  decisionType: DecisionType;
  regretProbability: number;
  confidenceScore: number;
  recommendation: string;
  insights: string[];
  agents: {
    financialImpact: AgentResult;
    opportunityCost: AgentResult;
    riskAnalysis: AgentResult;
    emotionDetection: AgentResult;
    memory: AgentResult;
  };
  futureSelf: {
    oneMonth: string;
    oneYear: string;
    fiveYears: string;
  };
  createdAt: string;
};

export type DecisionRecord = {
  id: string;
  context: DecisionContext;
  report: FutureImpactReport;
  outcome: "pending" | "continued" | "cancelled" | "remind_later" | "rewritten" | "good" | "bad";
  createdAt: string;
};
