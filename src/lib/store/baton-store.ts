import fs from "fs";
import path from "path";
import { Role, AccessLevel, SourceType, ClaimKind, ClaimStatus, ReviewState } from "@/types/handover";
import { Project, Membership, Source, Passage, AuditLog } from "@/types/database";
import { parseSourceText } from "@/lib/pipeline/chunker";
import { VerifiedClaim, verifyClaimEvidence } from "@/lib/pipeline/integrity";
import { CACHED_SAMPLE_CLAIMS } from "@/lib/demo/cached-run";

// In-memory persistent singleton for development / zero-setup demo
class BatonStore {
  private projects: Map<string, Project> = new Map();
  private memberships: Map<string, Membership[]> = new Map();
  private sources: Map<string, Source> = new Map();
  private passages: Map<string, Passage[]> = new Map(); // sourceId -> passages
  private claims: Map<string, VerifiedClaim> = new Map(); // claimId -> VerifiedClaim
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

  /**
   * Save verified claims into the store
   */
  public saveClaims(claimsList: VerifiedClaim[]): void {
    this.claims.clear();
    for (const c of claimsList) {
      this.claims.set(c.id || `claim-${Math.random().toString(36).substring(2, 8)}`, c);
    }
    this.lastExtractionTime = new Date().toISOString();
  }

  /**
   * Get claims filtered by role and optional kind/status filters
   */
  public getClaimsForRole(
    role: Role,
    kindFilter?: string,
    statusFilter?: string
  ): VerifiedClaim[] {
    const all = Array.from(this.claims.values());

    return all.filter((c) => {
      // 1. RLS Tier Filter
      if (!this.canRoleAccessClaim(role, c.tier)) {
        return false;
      }

      // 2. Kind filter
      if (kindFilter && kindFilter !== "all" && c.kind !== kindFilter) {
        return false;
      }

      // 3. Status filter
      if (statusFilter && statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }

  public getExtractionStatus() {
    return {
      hasRun: this.claims.size > 0,
      claimCount: this.claims.size,
      lastExtractionTime: this.lastExtractionTime,
    };
  }

  /**
   * Load and verify the pre-cached sample extraction
   */
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

    // Pre-populate with cached verified extraction so app is immediately testable
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
