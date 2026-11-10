import { cookies } from "next/headers";
import { DEMO_USERS, DEFAULT_USER, getDemoUserById, getDemoUserByRole } from "./demo-users";
import { DemoUser, Role } from "@/types/handover";

export const SESSION_COOKIE_NAME = "baton_demo_user_id";

export async function getCurrentUser(): Promise<DemoUser> {
  const cookieStore = cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (userId) {
    const user = getDemoUserById(userId);
    if (user) return user;
    const userByRole = getDemoUserByRole(userId);
    if (userByRole) return userByRole;
  }

  // Fallback to reviewer for initial demo exploration
  return DEFAULT_USER;
}

export function isValidRole(role: string): role is Role {
  return ["owner_reviewer", "incoming_lead", "contributor"].includes(role);
}
