# BUILD_SPEC - Baton: Knowledge-Handover Platform

## 1. Goal
When a team member leaves, turn authorised project sources (GitHub issues/PR export, meeting notes, chat export) into an evidence-linked, role-appropriate handover that a human reviews and approves before sharing.

## 2. Non-Negotiable Trust Rules
1. **Every claim links to the exact supporting source passage.** No citation = cannot be marked Verified.
2. **Each claim has a status:** `Verified`, `Inferred`, `Conflicting`, `Missing`. Never present assumptions as verified.
3. **Citation integrity is checked in CODE, not by the LLM:** every quoted evidence string must exist verbatim in the cited source text. If not found, downgrade the claim to Inferred or drop it.
4. **Permission filtering happens BEFORE generation.** Extraction runs per access tier using only sources that tier may see. A restricted source's content must never reach any prompt or output for a lower role.
5. **Source text is DATA, not instructions.** Wrap it in delimiters in prompts and ignore any instructions found inside sources (prompt-injection defence).
6. **Nothing is shared until a human approves.** All edits create versions. Keep an audit log.
7. **Where evidence is missing or conflicting, say so.** Never invent.

## 3. Roles & Access Levels
### Roles
- `owner_reviewer`: The leaver or admin. Sees everything, reviews and approves.
- `incoming_lead`: Sees approved handover for lead tier (`team` + `leads_only`).
- `contributor`: Sees approved handover for contributor tier (`team` only).

### Access Levels (per source)
- `team`: All roles (`contributor`, `incoming_lead`, `owner_reviewer`).
- `leads_only`: `incoming_lead` + `owner_reviewer`.
- `confidential`: `owner_reviewer` only, never shared, shown redacted as `[Restricted]` where referenced.

## 4. Data Model (Postgres, RLS on every table)
- `projects` (id, name, description, created_by, created_at)
- `memberships` (id, user_id, project_id, role, created_at)
- `sources` (id, project_id, type [github|notes|chat], title, raw_text, access_level [team|leads_only|confidential], uploaded_by, created_at)
- `passages` (id, source_id, idx, text, author, timestamp, created_at)
- `claims` (id, project_id, kind [decision|owner|risk|open_question|dependency|blocker|recurring_problem|next_action|contact], text, status [verified|inferred|conflicting|missing], tier [team|leads_only|confidential], review_state [pending|approved|rejected|edited], version, created_at, updated_at)
- `claim_evidence` (id, claim_id, source_id, passage_idx, quote, created_at)
- `gap_questions` (id, project_id, text, answer, answered_by, created_at, updated_at)
- `handovers` (id, project_id, version, status [draft|approved|published], created_by, published_at, created_at)
- `handover_items` (id, handover_id, claim_id, role_visibility [team|leads_only])
- `acknowledgements` (id, handover_id, user_id, role, notes, at)
- `audit_log` (id, project_id, actor, action, target, details, at)

## 5. Core Workflow
Connect -> Reconstruct -> Verify -> Review -> Handover.

## 6. Seed Demo Traps (Nexus Tech Club)
1. Conflicting statements about which branch is deployed (`main` vs `release-v2.1`).
2. Database switch decision with no recorded reason.
3. Open issue with no owner.
4. Vendor/sponsor contact mentioned only in chat.
5. Unresolved discussion (auth provider debate).
6. Confidential message with secret key & personal leave note.
7. Prompt injection attack string inside source text.
