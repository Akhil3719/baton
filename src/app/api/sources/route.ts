import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { batonStore } from "@/lib/store/baton-store";
import { SourceUploadInputSchema } from "@/lib/validations/api-schemas";
import { ZodError } from "zod";

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
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body. Please provide a valid JSON payload." },
        { status: 400 }
      );
    }

    const parseResult = SourceUploadInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i) => `${i.path.join(".") || "field"}: ${i.message}`)
        .join(", ");
      return NextResponse.json(
        { error: `Validation error: ${errorMsg}`, issues: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { title, type, rawText, accessLevel } = parseResult.data;

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
