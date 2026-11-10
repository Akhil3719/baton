import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  try {
    const body = await request.json();
    const { handoverId, notes } = body;

    if (!handoverId) {
      return NextResponse.json(
        { error: "handoverId is required" },
        { status: 400 }
      );
    }

    const ack = batonStore.acknowledgeHandover(
      handoverId,
      currentUser.email,
      currentUser.role,
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Handover receipt formally acknowledged by ${currentUser.name} (${currentUser.role}).`,
      acknowledgement: ack,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Acknowledgement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
