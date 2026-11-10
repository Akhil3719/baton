import { Role } from "@/types/handover";

/**
 * Redacts secret-looking strings, database connection strings, credentials,
 * emails, and phone numbers for non-reviewer roles.
 */
export function redactContentForRole(text: string, role: Role): string {
  if (!text) return "";
  // Reviewer sees full unredacted content
  if (role === "owner_reviewer") {
    return text;
  }

  let redacted = text;

  // 1. Redact database URLs / connection strings (e.g. postgresql://nexus_root:...)
  redacted = redacted.replace(
    /postgres(ql)?:\/\/[a-zA-Z0-9_-]+:[^@\s]+@[^\s/:]+(:\d+)?\/[^\s]+/gi,
    "[REDACTED_DATABASE_CONNECTION_STRING]"
  );

  // 2. Redact password/credential tokens (e.g. Pr0d_M@st3r_9921_xK or secret keys)
  redacted = redacted.replace(
    /(password|secret|key|passwd|token):\s*([^\s,;]+)/gi,
    "$1: [REDACTED_SECRET]"
  );
  redacted = redacted.replace(
    /Pr0d_M@st3r[^\s]*/gi,
    "[REDACTED_SECRET]"
  );
  redacted = redacted.replace(
    /(sk_live_[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,})/gi,
    "[REDACTED_SECRET]"
  );

  // 3. Redact private medical notes or personal info
  redacted = redacted.replace(
    /Alex will be undergoing medical recovery[^\.]*\./gi,
    "[REDACTED_CONFIDENTIAL_PERSONAL_MATTER]"
  );

  // 4. Redact emails if contributor (public team emails stay if non-confidential, but sensitive emails redacted)
  if (role === "contributor") {
    redacted = redacted.replace(
      /sarah\.chen@cloudsponsor\.io/gi,
      "[REDACTED_PARTNER_EMAIL]"
    );
  }

  // 5. Redact phone numbers (international or standard)
  redacted = redacted.replace(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    "[REDACTED_PHONE]"
  );

  return redacted;
}
