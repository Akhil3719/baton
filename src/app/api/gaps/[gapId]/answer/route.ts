import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";
import { AnswerGapInputSchema } from "@/lib/validations/api-schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: { gapId: string } }
) {
  const currentUser = await getCurrentUser();

  // Non-negotiable rule: only owner/reviewer (leaver) can answer leaver questions
  if (currentUser.role !== "owner_reviewer") {
    return NextResponse.json(
      { error: "403 Forbidden: Only Owner / Reviewer can record leaver responses." },
      { status: 403 }
    );
  }

  try {
    const { gapId } = params;
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const parseResult = AnswerGapInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
        .join(", ");
      return NextResponse.json(
        { error: `Validation error: ${errorMsg}`, issues: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { answer } = parseResult.data;

    const result = batonStore.answerGapQuestion(
      gapId,
      answer.trim(),
      currentUser.email
    );

    if (result.error || !result.gap) {
      return NextResponse.json(
        { error: result.error || "Failed to answer gap question" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Answer recorded. Leaver response source created with clearance 'leads_only' and attached as evidence with 'Stated by leaver' badge.",
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
