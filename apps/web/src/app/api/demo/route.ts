import { NextResponse } from "next/server";
import { generateDemoRecords } from "@/lib/demoData";
import { addDecisionRecords } from "@/lib/historyStore";

export async function GET() {
  return NextResponse.json(await generateDemoRecords());
}

export async function POST() {
  const records = await generateDemoRecords();
  return NextResponse.json(addDecisionRecords(records));
}
