# Contracts Workflow - Implementation Summary

## Overview

This document provides direct answers to the questions posed in the GitHub issue requesting a plan for implementing the Contracts workflow.

---

## Question 1: Which new database tables do we need, and which fields in each table?

### Answer: 4 Tables with Simplified JSONB Approach

#### Table 1: `policies`
Stores both policy rules and example agreements in a single table.

```sql
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    policy_type VARCHAR(50) NOT NULL,      -- 'rule' or 'example'
    agreement_type VARCHAR(50),            -- 'MSA', 'SOW', 'NDA' (for examples only)
    title TEXT NOT NULL,
    content TEXT NOT NULL,                 -- The actual policy/agreement text
    metadata JSONB DEFAULT '{}',           -- Additional metadata (tags, etc.)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Why this design?**
- Single table for both rules and examples (distinguished by `policy_type`)
- `agreement_type` is nullable (only used for examples)
- JSONB `metadata` allows custom fields without schema changes

#### Table 2: `agreements`
Main contracts/agreements table.

```sql
CREATE TABLE agreements (
    id SERIAL PRIMARY KEY,
    agreement_type VARCHAR(50) NOT NULL,   -- 'MSA', 'SOW', 'NDA', etc.
    title TEXT NOT NULL,
    counterparty TEXT NOT NULL,            -- The other party
    linked_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    current_version_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',  -- 'draft', 'in_review', 'approved', 'signed', 'archived'
    metadata JSONB DEFAULT '{}',           -- Additional fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Why this design?**
- `linked_project_id` enables SOW validation against estimates
- `current_version_number` tracks which version is active
- `status` field for workflow management
- JSONB `metadata` for extensibility

#### Table 3: `agreement_versions`
Version history with full content snapshots.

```sql
CREATE TABLE agreement_versions (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,                 -- Full text of agreement
    notes TEXT,                            -- User notes about this version
    created_by TEXT,                       -- Name of creator
    changes_summary JSONB,                 -- Summary of changes from previous version
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(agreement_id, version_number)
);
```

**Why this design?**
- Full content in each version (no diffs to reconstruct)
- `changes_summary` JSONB stores structured change metadata
- UNIQUE constraint prevents duplicate version numbers
- CASCADE delete ensures versions are deleted with agreement

#### Table 4: `agreement_reviews`
Review results with proposed changes.

```sql
CREATE TABLE agreement_reviews (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    source_version_number INTEGER NOT NULL,
    review_type VARCHAR(50) NOT NULL,      -- 'policy_review', 'estimate_validation', 'manual'
    proposed_changes JSONB NOT NULL,       -- Array of change proposals
    applied_changes JSONB DEFAULT '[]',    -- Track which changes were applied
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Why this design?**
- `proposed_changes` JSONB array stores structured change objects
- `applied_changes` tracks which change IDs were applied
- Audit trail of all reviews performed
- Supports multiple review types

### Indexes for Performance

```sql
CREATE INDEX idx_policies_type ON policies(policy_type);
CREATE INDEX idx_policies_agreement_type ON policies(agreement_type);
CREATE INDEX idx_agreements_type ON agreements(agreement_type);
CREATE INDEX idx_agreements_status ON agreements(status);
CREATE INDEX idx_agreements_project ON agreements(linked_project_id);
CREATE INDEX idx_agreement_versions_agreement ON agreement_versions(agreement_id);
CREATE INDEX idx_agreement_reviews_agreement ON agreement_reviews(agreement_id);
```

### Complete SQL

The complete, executable SQL is in: **`DELIVERABLES/CONTRACTS_SCHEMA.sql`**

---

## Question 2: Make a plan for which main UI components we need, how they should interact, and which data will be shown on each.

### Answer: 15 Main Components Across 5 Screens

#### Screen 1: Policy Management (`/policies`)

**Component: `PolicyList.svelte`**
- **Purpose**: Display all policy rules and example agreements
- **Data shown**: 
  - Policy type badge (rule/example)
  - Agreement type (for examples)
  - Title
  - Content preview (first 100 chars)
- **Actions**: Edit, Delete
- **Interaction**: Opens `PolicyForm` modal on edit/add

**Component: `PolicyForm.svelte`**
- **Purpose**: Create/edit policies
- **Data shown**: 
  - Policy type dropdown (rule/example)
  - Agreement type dropdown (conditional)
  - Title input
  - Content textarea (large)
- **Actions**: Save, Cancel
- **Interaction**: POST/PUT to `/api/policies`

#### Screen 2: Agreements List (`/contracts`)

**Component: `ContractListHeading.svelte`** (update existing)
- **Purpose**: Page header with actions
- **Data shown**: 
  - Total agreement count
  - Count by status (draft: 5, approved: 3, etc.)
- **Actions**: "New Agreement" button
- **Interaction**: Navigate to `/contracts/new`

**Component: `AgreementList.svelte`**
- **Purpose**: Grid of all agreements
- **Data shown**: Grid of `AgreementCard` components
- **Filters**: Type, Status, Counterparty (search)
- **Interaction**: Click card → navigate to detail

**Component: `AgreementCard.svelte`**
- **Purpose**: Single agreement preview
- **Data shown**:
  - Title
  - Type badge (MSA/SOW/NDA)
  - Counterparty
  - Status badge (colored)
  - Current version number
  - Linked project name (if applicable)
- **Actions**: Quick actions (Review, Validate)
- **Interaction**: Click → navigate to `/contracts/:id`

#### Screen 3: Agreement Detail (`/contracts/:id`)

**Component: `AgreementDetail.svelte`**
- **Purpose**: Main agreement view
- **Data shown**:
  - Current version content (rendered markdown)
  - Metadata sidebar:
    - Type, counterparty, status
    - Linked project (with link)
    - Current version info
  - Version selector dropdown
  - Action buttons
- **Actions**: Edit, Review, Validate (if SOW), New Version
- **Interaction**: 
  - Version selector changes displayed content
  - Action buttons navigate or open modals

**Component: `VersionTimeline.svelte`**
- **Purpose**: Timeline of all versions
- **Data shown** (for each version):
  - Version number
  - Created date
  - Created by (name)
  - Notes
  - Changes summary (added/modified/removed counts)
- **Actions**: Click to view that version
- **Interaction**: Updates `AgreementDetail` content

#### Screen 4: Generate Agreement (`/contracts/new`)

**Component: `GenerateAgreement.svelte`**
- **Purpose**: Generate new agreement from policies
- **Data shown**:
  - Agreement type dropdown (MSA/SOW/NDA)
  - Counterparty input
  - Policy rules (multi-select checkboxes)
  - Example agreements (multi-select checkboxes)
  - Additional context textarea (optional)
  - LLM streaming output (real-time)
- **Actions**: Generate, Save, Cancel
- **Interaction**: 
  - Generate → POST `/api/contracts/:id/generate`
  - Streams LLM response in real-time
  - Save creates Agreement + Version 1

#### Screen 5: Review Agreement (`/contracts/:id/review`)

**Component: `ReviewAgreement.svelte`**
- **Purpose**: Review and apply policy changes
- **Data shown**:
  - List of `ChangePreview` components
  - Apply selected button
  - Select all / deselect all
- **Actions**: Apply Changes, Cancel
- **Interaction**: 
  - Load → POST `/api/contracts/:id/review`
  - Apply → POST `/api/contracts/:id/versions` with selected changes

**Component: `ChangePreview.svelte`**
- **Purpose**: Single proposed change
- **Data shown**:
  - Section name
  - Before text (red highlight for removed)
  - After text (green highlight for added)
  - Rationale (below)
  - Checkbox (selected/not)
- **Actions**: Check/uncheck
- **Interaction**: Toggles selection state

#### Screen 6: Validate SOW (`/contracts/:id/validate`)

**Component: `ValidateSOW.svelte`**
- **Purpose**: Show SOW vs estimate discrepancies
- **Data shown**:
  - Alignment score (0-100) with color-coded badge
  - Summary paragraph
  - Discrepancies list:
    - Category badge (scope/cost/timeline/deliverables)
    - Severity badge (low/medium/high)
    - Description
    - SOW reference (excerpt)
    - Estimate reference (excerpt)
- **Actions**: Edit SOW, Edit Estimate (links)
- **Interaction**: POST `/api/contracts/:id/validate` on load

### Component Interaction Flow

```
Dashboard
  └─> AgreementList (shows cards)
        └─> AgreementCard (click)
              └─> AgreementDetail
                    ├─> VersionTimeline (sidebar)
                    ├─> "Review" button → ReviewAgreement
                    │     └─> ChangePreview × N
                    ├─> "Validate" button → ValidateSOW
                    └─> "New Version" → Opens modal/form

PolicyList
  └─> PolicyCard (click edit)
        └─> PolicyForm (modal)

New Agreement
  ├─> Option 1: GenerateAgreement
  └─> Option 2: Upload file + metadata form
```

---

## Question 3: Look at the existing app architecture, and determine whether we need any additional capabilities, or whether we can reuse capabilities we already have.

### Answer: We Can Reuse Everything! No New Dependencies Needed.

#### ✅ Reusable Capabilities

**1. LLM Integration**
- **Existing**: `bedrockClient.ts` with streaming support
- **Reuse for**: Agreement generation, review, validation
- **Pattern**: Same as chatbot streaming
- **No changes needed**: Just add new prompt functions

**2. File Upload & Storage**
- **Existing**: Vercel Blob integration in `/api/projects/[id]/artifacts`
- **Reuse for**: Uploading client draft agreements
- **Pattern**: Same upload flow, different endpoint
- **Code location**: Already imported `@vercel/blob`

**3. File Parsing**
- **Existing**: `readFileContent.ts` supports PDF, DOCX, TXT, MD, JSON
- **Reuse for**: Extracting text from uploaded agreements
- **Libraries**: Already installed (`pdf-parse`, `mammoth`)
- **No changes needed**: Function is generic

**4. Database Connection**
- **Existing**: Neon PostgreSQL via `db.ts`
- **Reuse for**: All contract CRUD operations
- **Pattern**: Same parameterized query approach
- **Connection**: Uses existing `DATABASE_URL` env var

**5. Markdown Rendering**
- **Existing**: `marked` library (used in LLM output)
- **Reuse for**: Rendering agreement content
- **Code location**: Already in `package.json`
- **No changes needed**: Same API

**6. UI Components & Styling**
- **Existing**: Tailwind CSS, Svelte 5 patterns
- **Reuse for**: All new components
- **Patterns**: 
  - Card layouts (from `ProjectCard.svelte`)
  - Forms (from `ApproverNameInput.svelte`)
  - Badges (from stage stepper)
- **No new libraries needed**

**7. Streaming UI Pattern**
- **Existing**: `LLMStream.svelte` for real-time output
- **Reuse for**: Agreement generation streaming
- **Code location**: `src/lib/components/copilot/LLMStream.svelte`
- **No changes needed**: Just pass different API endpoint

#### ❌ No Additional Capabilities Needed

**What we DON'T need:**
- ❌ New database system
- ❌ New LLM provider
- ❌ New file storage
- ❌ New CSS framework
- ❌ New frontend framework
- ❌ New parsing libraries
- ❌ Authentication system (not in scope)
- ❌ E-signature integration (nice-to-have, not MVP)

### Dependency Check

**Already installed packages we'll use:**
- `@aws-sdk/client-bedrock-runtime` → LLM
- `@neondatabase/serverless` → Database
- `@vercel/blob` → File storage
- `marked` → Markdown rendering
- `pdf-parse` → PDF parsing
- `mammoth` → DOCX parsing
- `svelte` → UI framework
- `tailwindcss` → Styling

**Verdict: Zero new npm packages needed!**

---

## Question 4: If we need specialized LLM prompts for any of these tasks, write out the Typescript functions that will generate those prompts and include the proper context in each prompt.

### Answer: 5 Specialized Prompt Functions (Already Written!)

All prompt functions are in: **`src/lib/server/contractPrompts.ts`**

#### Prompt 1: `generateAgreementPrompt()`

**Purpose**: Generate new agreement from scratch

```typescript
export const generateAgreementPrompt = (
  agreementType: string,        // 'MSA', 'SOW', 'NDA'
  counterparty: string,         // Other party name
  policyRules: Policy[],        // Company policy rules
  exampleAgreements: Policy[],  // Example agreements as templates
  additionalContext?: string    // Optional extra instructions
): string
```

**Context included in prompt:**
- Agreement type and counterparty
- Full text of all selected policy rules
- Full text of all selected example agreements
- Additional user-provided context

**Output format**: Plain text agreement with standard sections

**Key instruction**: "Draft a complete, professional ${agreementType} that incorporates all policy rules"

#### Prompt 2: `reviewAgreementPrompt()`

**Purpose**: Review client's draft against company policies

```typescript
export const reviewAgreementPrompt = (
  agreementType: string,        // 'MSA', 'SOW', 'NDA'
  clientDraft: string,          // Full text of client's draft
  policyRules: Policy[],        // Company policy rules
  _exampleAgreements: Policy[]  // For future use
): string
```

**Context included in prompt:**
- Client's complete draft agreement
- Full text of all policy rules
- Agreement type

**Output format**: JSON array of `ProposedChange[]`

```json
[
  {
    "section": "Section name",
    "before": "Exact text from client draft",
    "after": "Proposed replacement text",
    "rationale": "One-sentence explanation with policy reference"
  }
]
```

**Key instruction**: "Focus ONLY on material changes that affect rights, obligations, liability, payment terms, termination, IP, confidentiality, or other substantive business terms."

#### Prompt 3: `validateAgainstEstimatePrompt()`

**Purpose**: Validate SOW against project estimate

```typescript
export const validateAgainstEstimatePrompt = (
  sowContent: string,           // Full SOW text
  projectTasks: ProjectTask[],  // WBS from estimate
  projectDetails: {
    name: string;
    businessCase?: string;
    requirements?: string;
    architecture?: string;
    estimate?: string;
    quote?: string;
  }
): string
```

**Context included in prompt:**
- Full SOW content
- Complete work breakdown structure (tasks, roles, hours)
- Project name and all stage content (business case, requirements, etc.)

**Output format**: JSON with alignment score and discrepancies

```json
{
  "alignment_score": 85,
  "summary": "Overall summary text",
  "discrepancies": [
    {
      "category": "scope",
      "severity": "high",
      "description": "Description of issue",
      "sow_reference": "Text from SOW",
      "estimate_reference": "Text from estimate"
    }
  ]
}
```

**Key instruction**: "Carefully compare the SOW with the project estimate and identify discrepancies in: Scope, Cost, Timeline, Deliverables"

#### Prompt 4: `applyChangesPrompt()`

**Purpose**: Apply selected changes to create new version

```typescript
export const applyChangesPrompt = (
  originalContent: string,      // Current version text
  selectedChanges: ProposedChange[]  // User-selected changes to apply
): string
```

**Context included in prompt:**
- Full original agreement text
- List of exact before/after changes to apply
- Rationale for each change

**Output format**: Plain text with changes applied

**Key instruction**: "Carefully locate each 'Before' text in the original agreement and replace it with the corresponding 'After' text. Maintain all other content unchanged."

#### Prompt 5: `summarizeVersionChangesPrompt()`

**Purpose**: Summarize differences between versions

```typescript
export const summarizeVersionChangesPrompt = (
  previousVersion: string,
  currentVersion: string
): string
```

**Context included in prompt:**
- Full text of previous version
- Full text of current version

**Output format**: JSON summary

```json
{
  "added": 2,
  "removed": 1,
  "modified": 3,
  "sections_changed": ["Section 1.3", "Section 4.2", "Section 7"]
}
```

**Key instruction**: "Identify and summarize all substantive changes between the versions. Focus on: Added sections, Removed sections, Modified terms, Changes to dates/amounts."

### Prompt Engineering Strategies Used

1. **Structured Output**: All prompts request specific JSON formats for easy parsing
2. **Clear Instructions**: Explicit steps and requirements
3. **Context Isolation**: Each prompt includes only relevant context
4. **Error Prevention**: Instructions to avoid common mistakes (e.g., "ONLY material changes")
5. **Examples**: Some prompts include example output formats
6. **Low Temperature**: Review/validation use temp=0.1 for consistency
7. **High Temperature**: Generation uses default temp for creativity

---

## Question 5: Generate a succinct, informative plan for implementing the changes, along with the amount of effort you estimate needed for each change.

### Answer: 8 Phases, ~24 Hours Total

#### Phase 1: Database Schema & Types ✅ COMPLETED
**Effort: 2 hours**
- Create SQL schema (4 tables, indexes, constraints)
- Add TypeScript interfaces (9 new types)
- Implement database CRUD functions (20+ functions)
- **Status**: ✅ Done

#### Phase 2: LLM Prompt Functions ✅ COMPLETED
**Effort: 3 hours**
- Write 5 specialized prompt generators
- Test prompt output formats
- Document prompt strategies
- **Status**: ✅ Done

#### Phase 3: API Routes
**Effort: 4 hours**
- `/api/policies` - CRUD endpoints (1 hour)
- `/api/contracts` - CRUD endpoints (1 hour)
- `/api/contracts/:id/generate` - LLM streaming (0.5 hour)
- `/api/contracts/:id/review` - LLM review (0.5 hour)
- `/api/contracts/:id/validate` - Estimate validation (0.5 hour)
- `/api/contracts/:id/versions` - Version management (0.5 hour)
- **Status**: ⏳ Next

#### Phase 4: Policy Management UI
**Effort: 3 hours**
- `PolicyList.svelte` (1 hour)
- `PolicyForm.svelte` (1 hour)
- `/policies` route page (0.5 hour)
- Update `Navbar.svelte` (0.5 hour)
- **Status**: ⏳ Pending

#### Phase 5: Agreements List & Detail UI
**Effort: 5 hours**
- `AgreementCard.svelte` (0.5 hour)
- `AgreementList.svelte` (1 hour)
- Update `ContractListHeading.svelte` (0.5 hour)
- `/contracts` route page (0.5 hour)
- `AgreementDetail.svelte` (1.5 hours)
- `VersionTimeline.svelte` (1 hour)
- `/contracts/:id` route (0.5 hour)
- **Status**: ⏳ Pending

#### Phase 6: Review & Generation UI
**Effort: 4 hours**
- `GenerateAgreement.svelte` (1.5 hours)
- `ReviewAgreement.svelte` (1 hour)
- `ChangePreview.svelte` (0.5 hour)
- `ValidateSOW.svelte` (0.5 hour)
- `/contracts/new` route (0.5 hour)
- **Status**: ⏳ Pending

#### Phase 7: Integration
**Effort: 2 hours**
- Update `Dashboard.svelte` (0.5 hour)
- Add navigation links (0.5 hour)
- Wire up all interactions (1 hour)
- **Status**: ⏳ Pending

#### Phase 8: Testing
**Effort: 3 hours**
- End-to-end workflow testing (1.5 hours)
- Error handling validation (0.5 hour)
- Edge case testing (0.5 hour)
- Performance testing (0.5 hour)
- **Status**: ⏳ Pending

### Effort Breakdown by Role

| Role | Hours | Tasks |
|------|-------|-------|
| Backend Dev | 9 | Database, API routes, LLM prompts |
| Frontend Dev | 12 | UI components, routing, forms |
| Full-stack Dev | 3 | Integration, testing |
| **Total** | **24** | **All phases** |

### Critical Path

```
Phase 1 (Schema) → Phase 2 (Prompts) → Phase 3 (API) → Phase 4-6 (UI) → Phase 7-8 (Integration/Testing)
```

**Current status**: ✅ Phases 1-2 complete (~5 hours done)  
**Remaining**: ⏳ Phases 3-8 (~19 hours to go)

### Confidence Level

- **High Confidence** (Phases 1-2): ✅ Complete, tested, no blockers
- **High Confidence** (Phase 3): API patterns established, clear requirements
- **Medium Confidence** (Phases 4-6): UI complexity, may need iteration
- **High Confidence** (Phases 7-8): Straightforward integration

### Risk Factors

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM output format errors | Medium | High | Strict prompt instructions, retry logic |
| UI/UX complexity | Low | Medium | Follow existing patterns, user testing |
| Database performance | Low | Medium | Indexes in place, pagination for large datasets |
| File parsing failures | Low | Low | Already tested in projects workflow |

---

## Summary of Deliverables

### Files Created

1. **`DELIVERABLES/CONTRACTS_SCHEMA.sql`** (81 lines)
   - Executable SQL for creating all tables
   - Indexes for performance
   - Comments for documentation

2. **`src/lib/schema.ts`** (updated, +93 lines)
   - 9 new TypeScript interfaces
   - Type-safe data structures
   - JSDoc comments

3. **`src/lib/server/db.ts`** (updated, +420 lines)
   - 20+ database CRUD functions
   - Efficient queries with JOINs
   - Proper error handling

4. **`src/lib/server/contractPrompts.ts`** (240 lines)
   - 5 specialized prompt generators
   - Context-aware prompts
   - Structured output formats

5. **`DELIVERABLES/CONTRACTS_IMPLEMENTATION_PLAN.md`** (350 lines)
   - Phase-by-phase roadmap
   - Component specifications
   - API designs
   - Effort estimates

6. **`DELIVERABLES/CONTRACTS_ARCHITECTURE.md`** (630 lines)
   - Executive summary
   - Design rationale
   - Workflow diagrams
   - Security & performance considerations

### Key Achievements

✅ **Complete database design** - Ready to execute  
✅ **Type-safe implementation** - Full TypeScript coverage  
✅ **Reusable architecture** - Zero new dependencies  
✅ **Comprehensive documentation** - 1,300+ lines of docs  
✅ **Security validated** - CodeQL found 0 alerts  
✅ **Build successful** - Code compiles without errors  

### What's Ready to Use Right Now

1. Execute `CONTRACTS_SCHEMA.sql` → Database ready
2. Import types from `schema.ts` → Type safety ready
3. Call functions from `db.ts` → Data layer ready
4. Use prompts from `contractPrompts.ts` → LLM integration ready
5. Follow `CONTRACTS_IMPLEMENTATION_PLAN.md` → Implementation ready

### Next Steps for Implementation

1. **Execute SQL** (5 minutes)
   ```bash
   psql $DATABASE_URL < DELIVERABLES/CONTRACTS_SCHEMA.sql
   ```

2. **Seed initial data** (15 minutes)
   - Add sample policy rules
   - Add example MSA/SOW templates

3. **Implement API routes** (4 hours)
   - Follow designs in implementation plan
   - Reuse existing patterns from projects

4. **Build UI components** (12 hours)
   - Follow specifications in architecture doc
   - Reuse existing Svelte/Tailwind patterns

5. **Integrate and test** (5 hours)
   - Wire up all interactions
   - Test complete workflows
   - Fix any bugs

**Total remaining: ~21 hours of development work**

---

## Conclusion

This implementation plan provides:

1. ✅ **Complete database schema** with all necessary tables, fields, and indexes
2. ✅ **Full UI component plan** with interaction flows and data specifications
3. ✅ **Capability analysis** showing we can reuse all existing infrastructure
4. ✅ **5 specialized LLM prompts** ready to use for all contract operations
5. ✅ **Detailed implementation plan** with realistic effort estimates

**Everything is ready for the next phase of development.**

The architecture is:
- ✅ **Simple**: Only 4 database tables with JSONB flexibility
- ✅ **Reusable**: Leverages all existing infrastructure
- ✅ **Maintainable**: Follows established patterns
- ✅ **Extensible**: Easy to add features without refactoring
- ✅ **Secure**: No vulnerabilities detected
- ✅ **Performant**: Proper indexes and efficient queries

**Total estimated effort**: ~24 hours (~5 hours completed, ~19 hours remaining)
