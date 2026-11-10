export type Role = 'owner_reviewer' | 'incoming_lead' | 'contributor';

export type AccessLevel = 'team' | 'leads_only' | 'confidential';

export type SourceType = 'github' | 'notes' | 'chat';

export type ClaimKind = 
  | 'decision' 
  | 'owner' 
  | 'risk' 
  | 'open_question' 
  | 'dependency' 
  | 'blocker' 
  | 'recurring_problem' 
  | 'next_action' 
  | 'contact';

export type ClaimStatus = 'verified' | 'inferred' | 'conflicting' | 'missing';

export type ReviewState = 'pending' | 'approved' | 'rejected' | 'edited';

export type HandoverStatus = 'draft' | 'approved' | 'published';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  title: string;
  description: string;
}
