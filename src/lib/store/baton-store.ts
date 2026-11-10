import fs from "fs";
import path from "path";
import { Role, AccessLevel, SourceType, ClaimKind, ClaimStatus, ReviewState } from "@/types/handover";
import { Project, Membership, Source, Passage, AuditLog } from "@/types/database";
import { parseSourceText } from "@/lib/pipeline/chunker";
import { VerifiedClaim, verifyClaimEvidence } from "@/lib/pipeline/integrity";
import { CACHED_SAMPLE_CLAIMS } from "@/lib/demo/cached-run";
import { ConflictGroup, GapItem } from "@/types/gaps";
import { detectRuleBasedGaps, detectConflictGroups } from "@/lib/pipeline/conflict-detector";

class BatonStore {
  private projects: Map<string, Project> = new Map();
  private memberships: Map<string, Membership[]> = new Map();
  private sources: Map<string, Source> = new Map();
  private passages: Map<string, Passage[]> = new Map();
  private claims: Map<string, VerifiedClaim> = new Map();
  private gaps: Map<string, GapItem> = new Map();
  private conflictGroups: ConflictGroup[] = [];
  private auditLogs: AuditLog[] = [];
  private isSeeded: boolean = false;
  private lastExtractionTime: string | null = null;

  constructor() {
    this.initStore();
  }

  private initStore() {
    if (this.projects.size === 0) {
      this.seedSampleProject();
    }
  }

  public canRoleAccessSource(role: Role, accessLevel: AccessLevel): boolean {
    if (role === "owner_reviewer") return true;
    if (role === "incoming_lead" && (accessLevel === "team" || accessLevel === "leads_only")) return true;
    if (role === "contributor" && accessLevel === "team") return true;
    return false;
  }

  public canRoleAccessClaim(role: Role, tier: AccessLevel): boolean {
    if (role === "owner_reviewer") return true;
    if (role === "incoming_lead" && (tier === "team" || tier === "leads_only")) return true;
    if (role === "contributor" && tier === "team") return true;
    return false;
  }

  public getSourcesForRole(role: Role, projectId: string = "nexus-tech-club"): Source[] {
    const all = Array.from(this.sources.values()).filter((s) => s.project_id === projectId);
    return all.filter((s) => this.canRoleAccessSource(role, s.access_level));
  }

  public getAllSourcesList(): Source[] {
    return Array.from(this.sources.values());
  }

  public getPassagesMap(): Map<string, Passage[]> {
    return new Map(this.passages);
  }

  public getSourceById(sourceId: string, role: Role): { source: Source | null; error?: string } {
    const source = this.sources.get(sourceId);
    if (!source) return { source: null, error: "Source not found" };

    if (!this.canRoleAccessSource(role, source.access_level)) {
      return { 
        source: null, 
        error: `403 Forbidden: Role '${role}' lacks clearance for '${source.access_level}' source.` 
      };
    }

    return { source };
  }

  public getPassagesForSource(sourceId: string, role: Role): { passages: Passage[]; error?: string } {
    const check = this.getSourceById(sourceId, role);
    if (check.error || !check.source) {
      return { passages: [], error: check.error || "Forbidden" };
    }

    const passages = this.passages.get(sourceId) || [];
    return { passages };
  }

  public addSource(
    projectId: string,
    title: string,
    type: SourceType,
    rawText: string,
    accessLevel: AccessLevel,
    uploadedBy: string = "alex.leaver"
  ): { source: Source; passages: Passage[] } {
    const sourceId = `src-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSource: Source = {
      id: sourceId,
      project_id: projectId,
      title,
      type,
      raw_text: rawText,
      access_level: accessLevel,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    };

    this.sources.set(sourceId, newSource);

    const parsed = parseSourceText(type, rawText, title);
    const passagesList: Passage[] = parsed.map((p) => ({
      id: `pas-${sourceId}-${p.idx}`,
      source_id: sourceId,
      idx: p.idx,
      locator: p.locator,
      text: p.text,
      author: p.author,
      timestamp: p.timestamp,
      created_at: new Date().toISOString(),
    }));

    this.passages.set(sourceId, passagesList);

    this.addAuditLog(
      projectId,
      uploadedBy,
      "SOURCE_UPLOAD",
      newSource.title,
      { sourceId, accessLevel, passageCount: passagesList.length }
    );

    return { source: newSource, passages: passagesList };
  }

  public saveClaims(claimsList: VerifiedClaim[]): void {
    this.claims.clear();
    for (const c of claimsList) {
      const claimId = c.id || `claim-${Math.random().toString(36).substring(2, 8)}`;
      this.claims.set(claimId, {
        ...c,
        id: claimId,
        review_state: (c as any).review_state || "pending",
        version: (c as any).version || 1,
      });
    }
    this.lastExtractionTime = new Date().toISOString();

    // Re-run gap and conflict detectors
    this.refreshGapsAndConflicts();
  }

  public getClaimsForRole(
    role: Role,
    kindFilter?: string,
    statusFilter?: string
  ): VerifiedClaim[] {
    const all = Array.from(this.claims.values());

    return all.filter((c) => {
      if (!this.canRoleAccessClaim(role, c.tier)) return false;
      if (kindFilter && kindFilter !== "all" && c.kind !== kindFilter) return false;
      if (statusFilter && statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }

  public updateClaimReview(
    claimId: string,
    action: "approve" | "reject" | "edit",
    actor: string,
    editedText?: string
  ): { claim: VerifiedClaim | null; error?: string } {
    const claim = this.claims.get(claimId);
    if (!claim) return { claim: null, error: "Claim not found" };

    const previousVersion = (claim as any).version || 1;
    let newReviewState: ReviewState = "pending";

    if (action === "approve") {
      newReviewState = "approved";
    } else if (action === "reject") {
      newReviewState = "rejected";
    } else if (action === "edit") {
      newReviewState = "edited";
      if (editedText && editedText.trim()) {
        claim.text = editedText.trim();
      }
    }

    const updatedClaim: VerifiedClaim = {
      ...claim,
      review_state: newReviewState,
      version: previousVersion + 1,
    } as any;

    this.claims.set(claimId, updatedClaim);

    this.addAuditLog(
      "nexus-tech-club",
      actor,
      `CLAIM_${action.toUpperCase()}`,
      updatedClaim.text.slice(0, 50),
      { claimId, action, version: updatedClaim.version, newStatus: updatedClaim.status }
    );

    return { claim: updatedClaim };
  }

  public refreshGapsAndConflicts() {
    const sources = this.getAllSourcesList();
    const passagesMap = this.getPassagesMap();
    const claims = Array.from(this.claims.values());

    const detectedGaps = detectRuleBasedGaps(sources, passagesMap, claims);
    this.gaps.clear();
    for (const g of detectedGaps) {
      this.gaps.set(g.id, g);
    }

    this.conflictGroups = detectConflictGroups(claims);
  }

  public getGaps(): GapItem[] {
    if (this.gaps.size === 0) {
      this.refreshGapsAndConflicts();
    }
    return Array.from(this.gaps.values());
  }

  public getConflictGroups(): ConflictGroup[] {
    if (this.conflictGroups.length === 0) {
      this.refreshGapsAndConflicts();
    }
    return this.conflictGroups;
  }

  /**
   * Section 5F: Answer a gap question as reviewer.
   * Creates a 'leaver_response' source with access level 'leads_only',
   * attaches as evidence with a 'Stated by leaver' badge,
   * updates claim to 'inferred' (stays inferred until approved).
   */
  public answerGapQuestion(
    gapId: string,
    answerText: string,
    answeredBy: string = "alex.leaver@nexustech.club"
  ): { gap: GapItem | null; source: Source | null; updatedClaim: VerifiedClaim | null; error?: string } {
    const gap = this.gaps.get(gapId);
    if (!gap) return { gap: null, source: null, updatedClaim: null, error: "Gap not found" };

    // 1. Create leaver_response source with access_level: leads_only
    const sourceTitle = `Leaver Response: ${gap.title}`;
    const { source, passages } = this.addSource(
      "nexus-tech-club",
      sourceTitle,
      "notes",
      answerText,
      "leads_only", // access level leads
      answeredBy
    );

    // 2. Update gap record
    gap.answer = answerText;
    gap.answered_by = answeredBy;
    gap.answered_at = new Date().toISOString();
    this.gaps.set(gapId, gap);

    // 3. Attach as evidence with "Stated by leaver" badge to associated claim
    let updatedClaim: VerifiedClaim | null = null;
    if (gap.associated_claim_id && this.claims.has(gap.associated_claim_id)) {
      const claim = this.claims.get(gap.associated_claim_id)!;

      const leaverEvidence = {
        source_id: source.id,
        locator: `Leaver Statement (line 1)`,
        exact_quote: answerText,
        verified: true, // verbatim match against created leaver source
        resolved_source_id: source.id,
        source_title: sourceTitle,
        passage_idx: passages[0]?.idx || 1,
        is_leaver_statement: true, // "Stated by leaver" badge
      };

      // Claim stays Inferred until approved
      updatedClaim = {
        ...claim,
        status: "inferred", // stays Inferred until approved
        evidence: [leaverEvidence, ...claim.evidence],
        gap_details: undefined, // resolved gap note
        audit_note: `Answered by leaver (${answeredBy}). Marked Inferred pending review approval.`,
      };

      this.claims.set(claim.id!, updatedClaim);
    }

    this.addAuditLog(
      "nexus-tech-club",
      answeredBy,
      "LEAVER_QUESTION_ANSWERED",
      gap.title,
      { gapId, sourceId: source.id, claimId: gap.associated_claim_id }
    );

    return { gap, source, updatedClaim };
  }

  public getExtractionStatus() {
    return {
      hasRun: this.claims.size > 0,
      claimCount: this.claims.size,
      lastExtractionTime: this.lastExtractionTime,
    };
  }

  public loadCachedExtraction(projectId: string = "nexus-tech-club"): VerifiedClaim[] {
    const sources = this.getAllSourcesList();
    const passagesMap = this.getPassagesMap();

    const verified = CACHED_SAMPLE_CLAIMS.map((claim) =>
      verifyClaimEvidence(claim, sources, passagesMap)
    );

    this.saveClaims(verified);

    this.addAuditLog(
      projectId,
      "system",
      "CACHED_EXTRACTION_LOADED",
      "Nexus Tech Club",
      { claimCount: verified.length }
    );

    return verified;
  }

  public addAuditLog(
    projectId: string,
    actor: string,
    action: string,
    target: string,
    details: Record<string, unknown> = {}
  ) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      actor,
      action,
      target,
      details,
      at: new Date().toISOString(),
    });
  }

  public getAuditLogs(projectId: string = "nexus-tech-club"): AuditLog[] {
    return this.auditLogs.filter((l) => l.project_id === projectId);
  }

  public seedSampleProject(): { success: boolean; sourcesCount: number; passagesCount: number } {
    const projectId = "nexus-tech-club";

    this.sources.clear();
    this.passages.clear();
    this.claims.clear();
    this.gaps.clear();
    this.conflictGroups = [];
    this.auditLogs = [];

    const project: Project = {
      id: projectId,
      name: "Nexus Tech Club",
      description: "University Engineering Organization Handover",
      created_by: "11111111-1111-4111-8111-111111111111",
      created_at: new Date().toISOString(),
    };
    this.projects.set(projectId, project);

    const sampleDir = path.join(process.cwd(), "data", "sample");
    let totalPassages = 0;

    const filesToLoad: Array<{
      filename: string;
      title: string;
      type: SourceType;
      accessLevel: AccessLevel;
      author: string;
    }> = [
      {
        filename: "github_issues.json",
        title: "GitHub Issues & Release PRs",
        type: "github",
        accessLevel: "team",
        author: "GitHub Automation",
      },
      {
        filename: "meeting_notes_1.md",
        title: "Sprint 14 Retrospective & Release Debrief",
        type: "notes",
        accessLevel: "leads_only",
        author: "Marcus Vance",
      },
      {
        filename: "meeting_notes_2.md",
        title: "Architecture Alignment: Auth & Sessions",
        type: "notes",
        accessLevel: "leads_only",
        author: "Morgan Stone",
      },
      {
        filename: "meeting_notes_3.md",
        title: "All-Hands Weekly Team Sync",
        type: "notes",
        accessLevel: "team",
        author: "Alex Leaver",
      },
      {
        filename: "chat_export.txt",
        title: "Executive Chat & Credentials Channel",
        type: "chat",
        accessLevel: "confidential",
        author: "Slack Channel: #exec-confidential",
      },
      {
        filename: "sponsor_terms.md",
        title: "CloudSponsor Grant Terms & Agreements",
        type: "notes",
        accessLevel: "leads_only",
        author: "Sarah Chen (CloudSponsor)",
      },
    ];

    for (const f of filesToLoad) {
      const filePath = path.join(sampleDir, f.filename);
      let content = "";
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, "utf-8");
      } else {
        content = `Sample content for ${f.title}`;
      }

      const { passages } = this.addSource(
        projectId,
        f.title,
        f.type,
        content,
        f.accessLevel,
        "alex.leaver@nexustech.club"
      );
      totalPassages += passages.length;
    }

    this.loadCachedExtraction(projectId);

    this.addAuditLog(
      projectId,
      "alex.leaver@nexustech.club",
      "SAMPLE_PROJECT_SEEDED",
      "Nexus Tech Club",
      { sourcesCount: filesToLoad.length, passagesCount: totalPassages }
    );

    this.isSeeded = true;
    return {
      success: true,
      sourcesCount: this.sources.size,
      passagesCount: totalPassages,
    };
  }
}

const globalForStore = globalThis as unknown as { batonStore: BatonStore };
export const batonStore = globalForStore.batonStore || new BatonStore();
if (process.env.NODE_ENV !== "production") globalForStore.batonStore = batonStore;
