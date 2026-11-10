/**
 * Unit Tests for Code-Level Quote Verifier and Status Assignment Rules
 * Verifies Trust Rules #1, #2, #3, and #7.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=================================================");
console.log("UNIT TESTS: DETERMINISTIC CITATION VERIFIER & STATUS RULES");
console.log("=================================================\n");

// Implementation under test
function normalizeWhitespace(str) {
  if (!str) return "";
  return str.replace(/\s+/g, " ").trim();
}

function verifyQuoteAgainstText(exactQuote, sourceRawText) {
  if (!exactQuote || !sourceRawText) {
    return { verified: false, matchIndex: -1, normalizedQuote: "" };
  }
  const normQuote = normalizeWhitespace(exactQuote).toLowerCase();
  const normSource = normalizeWhitespace(sourceRawText).toLowerCase();
  const matchIndex = normSource.indexOf(normQuote);
  return {
    verified: matchIndex !== -1 && normQuote.length > 0,
    matchIndex,
    normalizedQuote: normQuote,
  };
}

function determineStatus(initialStatus, verifiedEvidenceList) {
  if (initialStatus === "conflicting") return "conflicting";
  if (initialStatus === "missing") return "missing";

  const hasPassingQuote = verifiedEvidenceList.some((e) => e.verified);
  if (hasPassingQuote) return "verified";
  return "inferred";
}

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name} -> ${err.message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// Test Suite 1: Whitespace Normalisation
// -------------------------------------------------------------
console.log("--- 1. Whitespace Normalisation Tests ---");

runTest("collapses multiple spaces, tabs, and newlines into single spaces", () => {
  const input = "  Hello \t\t world \n\n this is \r\n a test   ";
  const output = normalizeWhitespace(input);
  assert.strictEqual(output, "Hello world this is a test");
});

runTest("handles empty and null inputs safely", () => {
  assert.strictEqual(normalizeWhitespace(""), "");
  assert.strictEqual(normalizeWhitespace(null), "");
});

// -------------------------------------------------------------
// Test Suite 2: Deterministic Substring Matching
// -------------------------------------------------------------
console.log("\n--- 2. Substring Matching Tests ---");

const sampleSource = `
Production deployment pipeline has been configured in GitHub Actions.
The production environment is configured to deploy exclusively from the release-v2.1 branch upon tag push.
Any hotfix must be merged into release-v2.1 before triggering deployment.
`;

runTest("verifies exact verbatim quote in source", () => {
  const quote = "The production environment is configured to deploy exclusively from the release-v2.1 branch upon tag push.";
  const result = verifyQuoteAgainstText(quote, sampleSource);
  assert.strictEqual(result.verified, true);
  assert.ok(result.matchIndex > 0);
});

runTest("verifies quote with line-break or whitespace variance", () => {
  const quote = "The production environment is configured to deploy exclusively\n   from the release-v2.1 branch upon tag push.";
  const result = verifyQuoteAgainstText(quote, sampleSource);
  assert.strictEqual(result.verified, true);
});

runTest("REJECTS fabricated/hallucinated words (Trust Rule #3)", () => {
  // Altered "release-v2.1" to "main"
  const quote = "The production environment is configured to deploy exclusively from the main branch upon tag push.";
  const result = verifyQuoteAgainstText(quote, sampleSource);
  assert.strictEqual(result.verified, false);
  assert.strictEqual(result.matchIndex, -1);
});

runTest("REJECTS empty or blank quotes", () => {
  assert.strictEqual(verifyQuoteAgainstText("", sampleSource).verified, false);
  assert.strictEqual(verifyQuoteAgainstText("   ", sampleSource).verified, false);
});

// -------------------------------------------------------------
// Test Suite 3: Status Assignment Rules
// -------------------------------------------------------------
console.log("\n--- 3. Status Assignment Rules Tests ---");

runTest("claim with at least one passing quote is marked Verified", () => {
  const evidence = [{ exact_quote: "valid quote", verified: true }];
  const status = determineStatus("verified", evidence);
  assert.strictEqual(status, "verified");
});

runTest("claim with FAILING quote is DOWNGRADED from Verified to Inferred (Trust Rule #1 & #3)", () => {
  const evidence = [{ exact_quote: "hallucinated quote", verified: false }];
  const status = determineStatus("verified", evidence);
  assert.strictEqual(status, "inferred", "Must downgrade to inferred when citation fails verification");
});

runTest("claim with zero evidence is always Inferred", () => {
  const evidence = [];
  const status = determineStatus("verified", evidence);
  assert.strictEqual(status, "inferred");
});

runTest("conflicting claims retain 'conflicting' status regardless of quote match", () => {
  const evidence = [{ exact_quote: "valid quote", verified: true }];
  const status = determineStatus("conflicting", evidence);
  assert.strictEqual(status, "conflicting");
});

runTest("missing claims retain 'missing' status (Trust Rule #7)", () => {
  const evidence = [{ exact_quote: "valid quote", verified: true }];
  const status = determineStatus("missing", evidence);
  assert.strictEqual(status, "missing");
});

// -------------------------------------------------------------
// Test Suite 4: Real Sample Project Data Verification
// -------------------------------------------------------------
console.log("\n--- 4. Real Sample Dataset Verification ---");

const sampleDir = path.join(__dirname, "..", "data", "sample");
const issuesRaw = fs.readFileSync(path.join(sampleDir, "github_issues.json"), "utf8");
const notes1Raw = fs.readFileSync(path.join(sampleDir, "meeting_notes_1.md"), "utf8");
const chatRaw = fs.readFileSync(path.join(sampleDir, "chat_export.txt"), "utf8");

runTest("verifies Issue #42 deployment quote against raw JSON", () => {
  const quote = "The production environment is configured to deploy exclusively from the release-v2.1 branch upon tag push.";
  const res = verifyQuoteAgainstText(quote, issuesRaw);
  assert.strictEqual(res.verified, true);
});

runTest("verifies Meeting Notes #1 rollback quote against raw markdown", () => {
  const quote = "Production deployment was reverted back to track the `main` branch directly on AWS ECS.";
  const res = verifyQuoteAgainstText(quote, notes1Raw);
  assert.strictEqual(res.verified, true);
});

runTest("verifies Sponsor Sarah Chen contact quote against chat export", () => {
  const quote = "sarah.chen@cloudsponsor.io";
  const res = verifyQuoteAgainstText(quote, chatRaw);
  assert.strictEqual(res.verified, true);
});

console.log("\n-------------------------------------------------");
console.log(`Test Results: ${passed} passed, ${failed} failed.`);

if (failed === 0) {
  console.log("ALL UNIT TESTS PASSED: Citation integrity and status rules verified.");
  process.exit(0);
} else {
  console.error("UNIT TESTS FAILED: Trust rules violation detected!");
  process.exit(1);
}
