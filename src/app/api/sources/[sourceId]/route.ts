import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const currentUser = await getCurrentUser();
  const { sourceId } = params;

  const { source, error } = batonStore.getSourceById(sourceId, currentUser.role);

  if (error || !source) {
    return NextResponse.json(
      { error: error || "Source not found" },
      { status: error?.includes("403") ? 403 : 404 }
    );
  }

  const { passages } = batonStore.getPassagesForSource(sourceId, currentUser.role);

  return NextResponse.json({
    source,
    passages,
  });
}
