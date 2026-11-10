import { z } from "zod";

export const EvidenceSchema = z.object({
  source_id: z.string().describe("ID or title identifier of the cited source"),
  locator: z.string().describe("Segment locator e.g. Issue #42 (description) or Line range"),
  exact_quote: z.string().describe("Verbatim excerpt from the source passage. Must match text exactly."),
});

export type ExtractedEvidence = z.infer<typeof EvidenceSchema>;

export const ExtractedClaimSchema = z.object({
  id: z.string().optional(),
  kind: z.enum([
    "decision",
    "owner",
    "risk",
    "open_question",
    "dependency",
    "blocker",
    "recurring_problem",
    "next_action",
    "contact",
  ]),
  text: z.string().describe("Factual summary of the extracted claim."),
  status: z.enum(["verified", "inferred", "conflicting", "missing"]).default("inferred"),
  tier: z.enum(["team", "leads_only", "confidential"]).default("team"),
  evidence: z.array(EvidenceSchema).default([]),
  conflict_details: z.string().optional().describe("Description of contradictory statements, if conflicting."),
  gap_details: z.string().optional().describe("Description of missing information, if missing."),
});

export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;

export const ExtractionOutputSchema = z.object({
  claims: z.array(ExtractedClaimSchema),
  run_summary: z.string().optional(),
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;
