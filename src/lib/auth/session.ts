import { cookies, headers } from "next/headers";
import { DEMO_USERS, DEFAULT_USER, getDemoUserById, getDemoUserByRole } from "./demo-users";
import { DemoUser, Role } from "@/types/handover";

export const SESSION_COOKIE_NAME = "baton_demo_user_id";

export async function getCurrentUser(): Promise<DemoUser> {
  // 1. Check custom headers (for programmatic API requests and automated testing)
  try {
    const headerList = headers();
    const roleHeader = headerList.get("x-baton-role");
    if (roleHeader) {
      const user = getDemoUserByRole(roleHeader);
      if (user) return user;
    }
    const userIdHeader = headerList.get("x-baton-user-id");
    if (userIdHeader) {
      const user = getDemoUserById(userIdHeader);
      if (user) return user;
    }
  } catch {
    // headers() may throw if outside request scope
  }

  // 2. Check session cookie
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (userId) {
      const user = getDemoUserById(userId);
      if (user) return user;
      const userByRole = getDemoUserByRole(userId);
      if (userByRole) return userByRole;
    }
  } catch {
    // cookies() may throw if outside request scope
  }

  // Fallback to reviewer for initial demo exploration
  return DEFAULT_USER;
}

export function isValidRole(role: string): role is Role {
  return ["owner_reviewer", "incoming_lead", "contributor"].includes(role);
}
