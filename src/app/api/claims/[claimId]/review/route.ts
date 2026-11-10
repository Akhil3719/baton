import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

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
    const body = await request.json();
    const { action, editedText } = body;

    if (!["approve", "reject", "edit"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid review action. Must be 'approve', 'reject', or 'edit'." },
        { status: 400 }
      );
    }

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
