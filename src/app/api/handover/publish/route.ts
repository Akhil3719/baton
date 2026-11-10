import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (currentUser.role !== "owner_reviewer") {
    return NextResponse.json(
      { error: "403 Forbidden: Only Owner / Reviewer can publish handover packages." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { targetRole } = body;

    const newHandover = batonStore.publishHandover(currentUser.email, targetRole);

    return NextResponse.json({
      success: true,
      message: `Handover v${newHandover.version}.0 published successfully.`,
      handover: newHandover,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
