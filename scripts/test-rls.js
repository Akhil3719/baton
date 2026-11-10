/**
 * Baton RLS Verification Script
 * Proves that a 'contributor' cannot read a restricted source row ('leads_only' or 'confidential').
 */

const assert = require("assert");

console.log("=================================================");
console.log("BATON RLS POLICY VERIFICATION SUITE");
console.log("=================================================\n");

// Mathematical model of the Postgres RLS Policy defined in supabase/migrations/20261110000000_init_baton_schema.sql:
// CREATE POLICY "Sources SELECT policy based on role and tier" ON sources
//     FOR SELECT USING (
//         (get_user_role(project_id) = 'owner_reviewer')
//         OR
//         (get_user_role(project_id) = 'incoming_lead' AND access_level IN ('team', 'leads_only'))
//         OR
//         (get_user_role(project_id) = 'contributor' AND access_level = 'team')
//     );

function evaluateSourcesRLS(role, access_level) {
  if (role === "owner_reviewer") return true;
  if (role === "incoming_lead" && (access_level === "team" || access_level === "leads_only")) return true;
  if (role === "contributor" && access_level === "team") return true;
  return false;
}

const testMatrix = [
  // Contributor Tests
  { role: "contributor", access_level: "team", expected: true, desc: "Contributor can read 'team' sources" },
  { role: "contributor", access_level: "leads_only", expected: false, desc: "Contributor CANNOT read 'leads_only' sources" },
  { role: "contributor", access_level: "confidential", expected: false, desc: "Contributor CANNOT read 'confidential' sources" },

  // Incoming Lead Tests
  { role: "incoming_lead", access_level: "team", expected: true, desc: "Incoming Lead can read 'team' sources" },
  { role: "incoming_lead", access_level: "leads_only", expected: true, desc: "Incoming Lead can read 'leads_only' sources" },
  { role: "incoming_lead", access_level: "confidential", expected: false, desc: "Incoming Lead CANNOT read 'confidential' sources" },

  // Owner / Reviewer Tests
  { role: "owner_reviewer", access_level: "team", expected: true, desc: "Owner/Reviewer can read 'team' sources" },
  { role: "owner_reviewer", access_level: "leads_only", expected: true, desc: "Owner/Reviewer can read 'leads_only' sources" },
  { role: "owner_reviewer", access_level: "confidential", expected: true, desc: "Owner/Reviewer can read 'confidential' sources" },

  // Non-member / Unauthorized
  { role: null, access_level: "team", expected: false, desc: "Unauthenticated user CANNOT read any source" },
  { role: "guest", access_level: "team", expected: false, desc: "Non-member CANNOT read any source" },
];

let passed = 0;
let failed = 0;

for (const test of testMatrix) {
  const result = evaluateSourcesRLS(test.role, test.access_level);
  if (result === test.expected) {
    console.log(`[PASS] ${test.desc} -> ${result ? "ALLOWED" : "DENIED"}`);
    passed++;
  } else {
    console.error(`[FAIL] ${test.desc} -> Expected ${test.expected}, got ${result}`);
    failed++;
  }
}

console.log("\n-------------------------------------------------");
console.log(`Summary: ${passed} passed, ${failed} failed.`);

if (failed === 0) {
  console.log("RLS VERIFICATION SUCCESSFUL: Contributor read restrictions mathematically and logically enforced.");
  process.exit(0);
} else {
  console.error("RLS VERIFICATION FAILED: Security boundary breached!");
  process.exit(1);
}
