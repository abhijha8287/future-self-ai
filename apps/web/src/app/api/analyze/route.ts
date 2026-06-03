import { NextRequest, NextResponse } from "next/server";
import { runDecisionEngine } from "@/lib/decisionEngine";
import type { DecisionContext } from "@/types/decision";

export async function POST(request: NextRequest) {
  const context = (await request.json()) as DecisionContext;
  if (!context?.decisionType || !context?.website) {
    return NextResponse.json({ error: "Invalid decision context" }, { status: 400 });
  }

  const report = await runDecisionEngine(context, request.headers.get("x-demo-mode") === "true");
  return NextResponse.json(report);
}
