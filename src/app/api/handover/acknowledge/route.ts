import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";
import { AcknowledgeHandoverInputSchema } from "@/lib/validations/api-schemas";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const parseResult = AcknowledgeHandoverInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
        .join(", ");
      return NextResponse.json(
        { error: `Validation error: ${errorMsg}`, issues: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { handoverId, notes } = parseResult.data;

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
