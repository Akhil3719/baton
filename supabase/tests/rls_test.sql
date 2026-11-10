-- ============================================================================
-- Supabase RLS Verification Test
-- Proves that a 'contributor' cannot read 'leads_only' or 'confidential' sources
-- ============================================================================

BEGIN;

-- 1. Setup Test Project
INSERT INTO projects (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Security Project', 'Verifying RLS access boundaries')
ON CONFLICT (id) DO NOTHING;

-- 2. Setup Three Test Users / Memberships
-- Owner / Reviewer
INSERT INTO memberships (id, user_id, project_id, role)
VALUES ('00000000-0000-0000-0000-000000000011', '11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000001', 'owner_reviewer')
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Incoming Lead
INSERT INTO memberships (id, user_id, project_id, role)
VALUES ('00000000-0000-0000-0000-000000000022', '22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000001', 'incoming_lead')
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Contributor
INSERT INTO memberships (id, user_id, project_id, role)
VALUES ('00000000-0000-0000-0000-000000000033', '33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000001', 'contributor')
ON CONFLICT (user_id, project_id) DO NOTHING;

-- 3. Insert Sources with Different Access Tiers
-- Team source (public to project)
INSERT INTO sources (id, project_id, type, title, raw_text, access_level)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000001',
    'github',
    'Public Issues Export',
    'General bug reports and issue discussion.',
    'team'
) ON CONFLICT (id) DO NOTHING;

-- Leads-only source
INSERT INTO sources (id, project_id, type, title, raw_text, access_level)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000001',
    'notes',
    'Lead Retrospective Notes',
    'Architectural changes and deployment strategy.',
    'leads_only'
) ON CONFLICT (id) DO NOTHING;

-- Confidential source
INSERT INTO sources (id, project_id, type, title, raw_text, access_level)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '00000000-0000-0000-0000-000000000001',
    'chat',
    'Executive Credentials & Chat',
    'Database passwords and personal medical notes.',
    'confidential'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES USING SET LOCAL ROLE & auth.uid()
-- ============================================================================

-- A. Simulate Contributor (User ID: 33333333-3333-4333-8333-333333333333)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '33333333-3333-4333-8333-333333333333';

-- Test 1: Contributor MUST see exactly 1 source (the 'team' source)
DO $$
DECLARE
    source_count INTEGER;
    restricted_leak INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count FROM sources;
    SELECT COUNT(*) INTO restricted_leak FROM sources WHERE access_level IN ('leads_only', 'confidential');

    IF source_count != 1 THEN
        RAISE EXCEPTION 'RLS FAILURE: Contributor saw % sources, expected exactly 1.', source_count;
    END IF;

    IF restricted_leak > 0 THEN
        RAISE EXCEPTION 'CRITICAL SECURITY BREACH: Contributor read % restricted sources!', restricted_leak;
    END IF;

    RAISE NOTICE 'SUCCESS: Contributor RLS verified. 0 restricted rows accessible.';
END $$;

-- B. Simulate Incoming Lead (User ID: 22222222-2222-4222-8222-222222222222)
SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-4222-8222-222222222222';

-- Test 2: Incoming Lead MUST see 2 sources ('team' and 'leads_only'), but 0 'confidential'
DO $$
DECLARE
    source_count INTEGER;
    confidential_leak INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count FROM sources;
    SELECT COUNT(*) INTO confidential_leak FROM sources WHERE access_level = 'confidential';

    IF source_count != 2 THEN
        RAISE EXCEPTION 'RLS FAILURE: Incoming Lead saw % sources, expected 2.', source_count;
    END IF;

    IF confidential_leak > 0 THEN
        RAISE EXCEPTION 'CRITICAL SECURITY BREACH: Incoming Lead read confidential source!';
    END IF;

    RAISE NOTICE 'SUCCESS: Incoming Lead RLS verified. Confidential sources blocked.';
END $$;

-- C. Simulate Owner / Reviewer (User ID: 11111111-1111-4111-8111-111111111111)
SET LOCAL "request.jwt.claim.sub" TO '11111111-1111-4111-8111-111111111111';

-- Test 3: Owner / Reviewer MUST see all 3 sources
DO $$
DECLARE
    source_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count FROM sources;

    IF source_count != 3 THEN
        RAISE EXCEPTION 'RLS FAILURE: Owner saw % sources, expected 3.', source_count;
    END IF;

    RAISE NOTICE 'SUCCESS: Owner RLS verified. All 3 sources accessible.';
END $$;

ROLLBACK;
