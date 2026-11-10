import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";
import { SourceType, AccessLevel } from "@/types/handover";

export async function GET() {
  const currentUser = await getCurrentUser();
  const sources = batonStore.getSourcesForRole(currentUser.role);
  return NextResponse.json({
    role: currentUser.role,
    count: sources.length,
    sources,
  });
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  // Non-negotiable rule: only owner/reviewer can upload new project sources
  if (currentUser.role !== "owner_reviewer") {
    return NextResponse.json(
      { error: "403 Forbidden: Only Owner / Reviewer can upload and ingest sources." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, type, rawText, accessLevel } = body;

    if (!title || !type || !rawText || !accessLevel) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, rawText, accessLevel" },
        { status: 400 }
      );
    }

    const validTypes: SourceType[] = ["github", "notes", "chat"];
    const validLevels: AccessLevel[] = ["team", "leads_only", "confidential"];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (!validLevels.includes(accessLevel)) {
      return NextResponse.json(
        { error: `Invalid accessLevel. Must be one of: ${validLevels.join(", ")}` },
        { status: 400 }
      );
    }

    const { source, passages } = batonStore.addSource(
      "nexus-tech-club",
      title,
      type,
      rawText,
      accessLevel,
      currentUser.email
    );

    return NextResponse.json({
      success: true,
      source,
      passagesCount: passages.length,
      passages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process source";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
