import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";
import { ReviewActionInputSchema } from "@/lib/validations/api-schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  const currentUser = await getCurrentUser();

  if (currentUser.role !== "owner_reviewer") {
    return NextResponse.json(
      { error: "403 Forbidden: Only Owner / Reviewer can review or edit claims." },
      { status: 403 }
    );
  }

  try {
    const { claimId } = params;
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const parseResult = ReviewActionInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
        .join(", ");
      return NextResponse.json(
        { error: `Validation error: ${errorMsg}`, issues: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { action, editedText } = parseResult.data;

    const result = batonStore.updateClaimReview(
      claimId,
      action,
      currentUser.email,
      editedText
    );

    if (result.error || !result.claim) {
      return NextResponse.json(
        { error: result.error || "Claim review failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      claim: result.claim,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Review update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
