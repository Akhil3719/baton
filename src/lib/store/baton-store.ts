import fs from "fs";
import path from "path";
import { Role, AccessLevel, SourceType } from "@/types/handover";
import { Project, Membership, Source, Passage, AuditLog } from "@/types/database";
import { parseSourceText } from "@/lib/pipeline/chunker";

export interface SourceWithPassages extends Source {
  passages: Passage[];
}

// In-memory persistent singleton for development / zero-setup demo
class BatonStore {
  private projects: Map<string, Project> = new Map();
  private memberships: Map<string, Membership[]> = new Map(); // projectId -> memberships
  private sources: Map<string, Source> = new Map();
  private passages: Map<string, Passage[]> = new Map(); // sourceId -> passages
  private auditLogs: AuditLog[] = [];
  private isSeeded: boolean = false;

  constructor() {
    // Check if sample project should be auto-initialized
    this.initStore();
  }

  private initStore() {
    if (this.projects.size === 0) {
      this.seedSampleProject();
    }
  }

  /**
   * Evaluates RLS for Sources table:
   * owner_reviewer: all tiers
   * incoming_lead: team + leads_only
   * contributor: team only
   */
  public canRoleAccessSource(role: Role, accessLevel: AccessLevel): boolean {
    if (role === "owner_reviewer") return true;
    if (role === "incoming_lead" && (accessLevel === "team" || accessLevel === "leads_only")) return true;
    if (role === "contributor" && accessLevel === "team") return true;
    return false;
  }

  /**
   * Get all sources filtered strictly by RLS role boundaries
   */
  public getSourcesForRole(role: Role, projectId: string = "nexus-tech-club"): Source[] {
    const all = Array.from(this.sources.values()).filter((s) => s.project_id === projectId);
    return all.filter((s) => this.canRoleAccessSource(role, s.access_level));
  }

  /**
   * Get a single source by ID with RLS verification
   */
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

  /**
   * Get passages for a source with RLS verification
   */
  public getPassagesForSource(sourceId: string, role: Role): { passages: Passage[]; error?: string } {
    const check = this.getSourceById(sourceId, role);
    if (check.error || !check.source) {
      return { passages: [], error: check.error || "Forbidden" };
    }

    const passages = this.passages.get(sourceId) || [];
    return { passages };
  }

  /**
   * Add a new source (reviewer only) and parse into numbered passage segments
   */
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

    // Parse into numbered passages with locators
    const parsed = parseSourceText(type, rawText, title);
    const passagesList: Passage[] = parsed.map((p) => ({
      id: `pas-${sourceId}-${p.idx}`,
      source_id: sourceId,
      idx: p.idx,
      text: p.text,
      author: p.author,
      timestamp: p.timestamp,
      created_at: new Date().toISOString(),
    }));

    this.passages.set(sourceId, passagesList);

    // Audit event
    this.addAuditLog(
      projectId,
      uploadedBy,
      "SOURCE_UPLOAD",
      newSource.title,
      { sourceId, accessLevel, passageCount: passagesList.length }
    );

    return { source: newSource, passages: passagesList };
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

  /**
   * Resets and seeds the complete Nexus Tech Club sample project with all 9 planted items
   */
  public seedSampleProject(): { success: boolean; sourcesCount: number; passagesCount: number } {
    const projectId = "nexus-tech-club";

    // Clear existing sample project
    this.sources.clear();
    this.passages.clear();
    this.auditLogs = [];

    // 1. Create Project
    const project: Project = {
      id: projectId,
      name: "Nexus Tech Club",
      description: "University Engineering Organization Handover",
      created_by: "11111111-1111-4111-8111-111111111111",
      created_at: new Date().toISOString(),
    };
    this.projects.set(projectId, project);

    // 2. Load Sample Files
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

// Global singleton instance across Next.js re-renders
const globalForStore = globalThis as unknown as { batonStore: BatonStore };
export const batonStore = globalForStore.batonStore || new BatonStore();
if (process.env.NODE_ENV !== "production") globalForStore.batonStore = batonStore;
