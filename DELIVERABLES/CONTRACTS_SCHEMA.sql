-- Contracts Workflow Database Schema
-- This schema supports policy-based contract generation, review, and version management

-- Table: policies
-- Stores policy rules and example agreements used for contract generation
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    policy_type VARCHAR(50) NOT NULL, -- 'rule' or 'example'
    agreement_type VARCHAR(50), -- 'MSA', 'SOW', 'NDA', etc. (for examples only)
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- The actual policy rule text or example agreement text
    metadata JSONB DEFAULT '{}', -- Additional metadata (tags, categories, etc.)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: agreements
-- Main table for contracts/agreements
CREATE TABLE IF NOT EXISTS agreements (
    id SERIAL PRIMARY KEY,
    agreement_type VARCHAR(50) NOT NULL, -- 'MSA', 'SOW', 'NDA', etc.
    title TEXT NOT NULL,
    counterparty TEXT NOT NULL, -- The other party in the agreement
    linked_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, -- Optional link to estimate/project
    current_version_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'in_review', 'approved', 'signed', 'archived'
    metadata JSONB DEFAULT '{}', -- Additional fields (tags, notes, etc.)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: agreement_versions
-- Stores all versions of an agreement with full content and change tracking
CREATE TABLE IF NOT EXISTS agreement_versions (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL, -- Full text of the agreement at this version
    notes TEXT, -- User notes about this version
    created_by TEXT, -- Name of person who created this version
    changes_summary JSONB, -- Summary of changes from previous version (for display)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(agreement_id, version_number)
);

-- Table: agreement_reviews
-- Stores results of policy-based reviews of client drafts
CREATE TABLE IF NOT EXISTS agreement_reviews (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    source_version_number INTEGER NOT NULL, -- Version that was reviewed
    review_type VARCHAR(50) NOT NULL, -- 'policy_review', 'estimate_validation', etc.
    proposed_changes JSONB NOT NULL, -- Array of change proposals with before/after/rationale
    applied_changes JSONB DEFAULT '[]', -- Track which changes were applied
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_policies_agreement_type ON policies(agreement_type);
CREATE INDEX IF NOT EXISTS idx_agreements_type ON agreements(agreement_type);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_project ON agreements(linked_project_id);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_agreement ON agreement_versions(agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_reviews_agreement ON agreement_reviews(agreement_id);

-- Comments for documentation
COMMENT ON TABLE policies IS 'Stores policy rules and example agreements for contract generation';
COMMENT ON TABLE agreements IS 'Main contracts/agreements table with metadata and current version tracking';
COMMENT ON TABLE agreement_versions IS 'Version history for each agreement with full content';
COMMENT ON TABLE agreement_reviews IS 'Results of automated reviews with proposed changes';

COMMENT ON COLUMN policies.policy_type IS 'Type: rule (policy rule) or example (example agreement)';
COMMENT ON COLUMN policies.agreement_type IS 'Agreement type for examples: MSA, SOW, NDA, etc.';
COMMENT ON COLUMN agreements.linked_project_id IS 'Optional link to projects table for SOW validation';
COMMENT ON COLUMN agreement_reviews.proposed_changes IS 'JSONB array of {section, before, after, rationale, applied}';
