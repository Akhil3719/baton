import { Role, AccessLevel, SourceType, ClaimKind, ClaimStatus, ReviewState, HandoverStatus } from './handover';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  project_id: string;
  role: Role;
  created_at: string;
}

export interface Source {
  id: string;
  project_id: string;
  type: SourceType;
  title: string;
  raw_text: string;
  access_level: AccessLevel;
  uploaded_by: string | null;
  created_at: string;
}

export interface Passage {
  id: string;
  source_id: string;
  idx: number;
  text: string;
  author: string | null;
  timestamp: string | null;
  created_at: string;
}

export interface Claim {
  id: string;
  project_id: string;
  kind: ClaimKind;
  text: string;
  status: ClaimStatus;
  tier: AccessLevel;
  review_state: ReviewState;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ClaimEvidence {
  id: string;
  claim_id: string;
  source_id: string;
  passage_idx: number;
  quote: string;
  created_at: string;
}

export interface GapQuestion {
  id: string;
  project_id: string;
  text: string;
  answer: string | null;
  answered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Handover {
  id: string;
  project_id: string;
  version: number;
  status: HandoverStatus;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
}

export interface HandoverItem {
  id: string;
  handover_id: string;
  claim_id: string;
  role_visibility: 'team' | 'leads_only';
  created_at: string;
}

export interface Acknowledgement {
  id: string;
  handover_id: string;
  user_id: string;
  role: string;
  notes: string | null;
  at: string;
}

export interface AuditLog {
  id: string;
  project_id: string;
  actor: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
  at: string;
}
