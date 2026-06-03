import { NextRequest, NextResponse } from "next/server";
import { addDecisionRecord, listDecisionRecords } from "@/lib/historyStore";
import type { DecisionRecord } from "@/types/decision";

export async function GET() {
  return NextResponse.json(listDecisionRecords());
}

export async function POST(request: NextRequest) {
  const record = (await request.json()) as DecisionRecord;

  if (!record?.context?.decisionType || !record?.report?.id || !record?.outcome) {
    return NextResponse.json({ error: "Invalid decision record" }, { status: 400 });
  }

  return NextResponse.json(addDecisionRecord({
    ...record,
    id: record.id || record.report.id,
    createdAt: record.createdAt || new Date().toISOString()
  }));
}
