-- Baton Initial Schema Migration
-- Defines all 11 tables with strict Row-Level Security (RLS)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Memberships
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner_reviewer', 'incoming_lead', 'contributor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Helper function: Get current user's role in a project
CREATE OR REPLACE FUNCTION get_user_role(p_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM memberships 
        WHERE project_id = p_id 
          AND user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Sources
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('github', 'notes', 'chat')),
    title TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('team', 'leads_only', 'confidential')),
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Passages (Indexed extracted blocks from sources)
CREATE TABLE IF NOT EXISTS passages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    idx INTEGER NOT NULL,
    text TEXT NOT NULL,
    author TEXT,
    timestamp TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_id, idx)
);

-- 6. Claims
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('decision', 'owner', 'risk', 'open_question', 'dependency', 'blocker', 'recurring_problem', 'next_action', 'contact')),
    text TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('verified', 'inferred', 'conflicting', 'missing')),
    tier TEXT NOT NULL CHECK (tier IN ('team', 'leads_only', 'confidential')),
    review_state TEXT NOT NULL DEFAULT 'pending' CHECK (review_state IN ('pending', 'approved', 'rejected', 'edited')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Claim Evidence (Citations linked to raw passage quotes)
CREATE TABLE IF NOT EXISTS claim_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    passage_idx INTEGER NOT NULL,
    quote TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7b. Claim Versions (Immutable history of edits and reviews)
CREATE TABLE IF NOT EXISTS claim_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    text TEXT NOT NULL,
    status TEXT NOT NULL,
    review_state TEXT NOT NULL,
    edited_by TEXT NOT NULL,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diff_summary TEXT
);

-- 8. Gap Questions
CREATE TABLE IF NOT EXISTS gap_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    answer TEXT,
    answered_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Handovers
CREATE TABLE IF NOT EXISTS handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
    created_by UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Handover Items
CREATE TABLE IF NOT EXISTS handover_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_id UUID NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    role_visibility TEXT NOT NULL CHECK (role_visibility IN ('team', 'leads_only')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(handover_id, claim_id)
);

-- 11. Acknowledgements
CREATE TABLE IF NOT EXISTS acknowledgements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_id UUID NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    notes TEXT,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Projects RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Projects readable by members" ON projects
    FOR SELECT USING (
        id IN (SELECT project_id FROM memberships WHERE user_id = auth.uid())
    );

CREATE POLICY "Projects insertable by authenticated users" ON projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Projects editable by owner_reviewer" ON projects
    FOR UPDATE USING (
        get_user_role(id) = 'owner_reviewer'
    );

-- ----------------------------------------------------------------------------
-- Memberships RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Memberships readable by fellow project members" ON memberships
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM memberships m WHERE m.user_id = auth.uid())
    );

CREATE POLICY "Memberships manageable by project owner_reviewer" ON memberships
    FOR ALL USING (
        get_user_role(project_id) = 'owner_reviewer'
    );

-- ----------------------------------------------------------------------------
-- Sources RLS
-- Strict access levels:
--   - 'team': all roles
--   - 'leads_only': incoming_lead and owner_reviewer
--   - 'confidential': owner_reviewer ONLY
-- ----------------------------------------------------------------------------
CREATE POLICY "Sources SELECT policy based on role and tier" ON sources
    FOR SELECT USING (
        (get_user_role(project_id) = 'owner_reviewer')
        OR
        (get_user_role(project_id) = 'incoming_lead' AND access_level IN ('team', 'leads_only'))
        OR
        (get_user_role(project_id) = 'contributor' AND access_level = 'team')
    );

CREATE POLICY "Sources insertable by owner_reviewer" ON sources
    FOR INSERT WITH CHECK (
        get_user_role(project_id) = 'owner_reviewer'
    );

CREATE POLICY "Sources updatable by owner_reviewer" ON sources
    FOR UPDATE USING (
        get_user_role(project_id) = 'owner_reviewer'
    );

CREATE POLICY "Sources deletable by owner_reviewer" ON sources
    FOR DELETE USING (
        get_user_role(project_id) = 'owner_reviewer'
    );

-- ----------------------------------------------------------------------------
-- Passages RLS (Inherits source visibility)
-- ----------------------------------------------------------------------------
CREATE POLICY "Passages SELECT inherits source visibility" ON passages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sources s 
            WHERE s.id = passages.source_id
        )
    );

CREATE POLICY "Passages manageable by owner_reviewer" ON passages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sources s 
            WHERE s.id = passages.source_id 
              AND get_user_role(s.project_id) = 'owner_reviewer'
        )
    );

-- ----------------------------------------------------------------------------
-- Claims RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Claims SELECT policy" ON claims
    FOR SELECT USING (
        (get_user_role(project_id) = 'owner_reviewer')
        OR
        (get_user_role(project_id) = 'incoming_lead' AND tier IN ('team', 'leads_only'))
        OR
        (get_user_role(project_id) = 'contributor' AND tier = 'team' AND review_state = 'approved')
    );

CREATE POLICY "Claims manageable by owner_reviewer" ON claims
    FOR ALL USING (
        get_user_role(project_id) = 'owner_reviewer'
    );

-- ----------------------------------------------------------------------------
-- Claim Evidence RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Claim evidence inherits claim visibility" ON claim_evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM claims c 
            WHERE c.id = claim_evidence.claim_id
        )
    );

CREATE POLICY "Claim evidence manageable by owner_reviewer" ON claim_evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM claims c 
            WHERE c.id = claim_evidence.claim_id 
              AND get_user_role(c.project_id) = 'owner_reviewer'
        )
    );

-- ----------------------------------------------------------------------------
-- Claim Versions RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Claim versions inherits claim visibility" ON claim_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM claims c 
            WHERE c.id = claim_versions.claim_id
        )
    );

CREATE POLICY "Claim versions insertable by owner_reviewer" ON claim_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM claims c 
            WHERE c.id = claim_versions.claim_id 
              AND get_user_role(c.project_id) = 'owner_reviewer'
        )
    );

-- ----------------------------------------------------------------------------
-- Gap Questions RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Gap questions readable by project members" ON gap_questions
    FOR SELECT USING (
        get_user_role(project_id) IN ('owner_reviewer', 'incoming_lead')
    );

CREATE POLICY "Gap questions manageable by owner_reviewer" ON gap_questions
    FOR ALL USING (
        get_user_role(project_id) = 'owner_reviewer'
    );

-- ----------------------------------------------------------------------------
-- Handovers RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Handovers SELECT policy" ON handovers
    FOR SELECT USING (
        (get_user_role(project_id) = 'owner_reviewer')
        OR
        (get_user_role(project_id) IN ('incoming_lead', 'contributor') AND status = 'published')
    );

CREATE POLICY "Handovers manageable by owner_reviewer" ON handovers
    FOR ALL USING (
        get_user_role(project_id) = 'owner_reviewer'
    );

-- ----------------------------------------------------------------------------
-- Handover Items RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Handover items SELECT policy" ON handover_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM handovers h 
            WHERE h.id = handover_items.handover_id
              AND (
                  (get_user_role(h.project_id) = 'owner_reviewer')
                  OR
                  (get_user_role(h.project_id) = 'incoming_lead' AND role_visibility IN ('team', 'leads_only') AND h.status = 'published')
                  OR
                  (get_user_role(h.project_id) = 'contributor' AND role_visibility = 'team' AND h.status = 'published')
              )
        )
    );

CREATE POLICY "Handover items manageable by owner_reviewer" ON handover_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM handovers h 
            WHERE h.id = handover_items.handover_id 
              AND get_user_role(h.project_id) = 'owner_reviewer'
        )
    );

-- ----------------------------------------------------------------------------
-- Acknowledgements RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Acknowledgements readable by project members" ON acknowledgements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM handovers h 
            WHERE h.id = acknowledgements.handover_id 
              AND get_user_role(h.project_id) IS NOT NULL
        )
    );

CREATE POLICY "Acknowledgements insertable by project members" ON acknowledgements
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM handovers h 
            WHERE h.id = acknowledgements.handover_id 
              AND h.status = 'published'
        )
    );

-- ----------------------------------------------------------------------------
-- Audit Log RLS
-- ----------------------------------------------------------------------------
CREATE POLICY "Audit log readable by owner_reviewer" ON audit_log
    FOR SELECT USING (
        get_user_role(project_id) = 'owner_reviewer'
    );

CREATE POLICY "Audit log insertable by authenticated members" ON audit_log
    FOR INSERT WITH CHECK (
        get_user_role(project_id) IS NOT NULL
    );
