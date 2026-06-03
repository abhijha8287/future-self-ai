import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const feedback = await request.json();
  return NextResponse.json({
    ok: true,
    message: "Feedback captured for memory tuning",
    feedback
  });
}
