import { DemoUser } from "@/types/handover";

export const DEMO_USERS: Record<string, DemoUser> = {
  reviewer: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "alex.leaver@nexustech.club",
    name: "Alex Leaver (Owner/Admin)",
    role: "owner_reviewer",
    title: "Project Lead (Departing)",
    description: "Full access: views all tiers including confidential, runs extraction, reviews claims, answers questions, and publishes.",
  },
  incoming_lead: {
    id: "22222222-2222-4222-8222-222222222222",
    email: "morgan.lead@nexustech.club",
    name: "Morgan Stone (Incoming Lead)",
    role: "incoming_lead",
    title: "Incoming Tech Lead",
    description: "Lead tier: views team & leads_only sources and claims. Acknowledges handover and receives lead onboarding actions.",
  },
  contributor: {
    id: "33333333-3333-4333-8333-333333333333",
    email: "jamie.dev@nexustech.club",
    name: "Jamie Dev (Contributor)",
    role: "contributor",
    title: "Frontend Contributor",
    description: "Contributor tier: views public team sources and approved claims only. Restricted content is hidden.",
  },
};

export const DEFAULT_USER = DEMO_USERS.reviewer;

export function getDemoUserByRole(role: string): DemoUser | undefined {
  return Object.values(DEMO_USERS).find((u) => u.role === role);
}

export function getDemoUserById(id: string): DemoUser | undefined {
  return Object.values(DEMO_USERS).find((u) => u.id === id);
}
