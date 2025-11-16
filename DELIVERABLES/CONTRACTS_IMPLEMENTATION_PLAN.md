# Contracts Workflow Implementation Plan

## Overview

This document provides a detailed plan for implementing the Contracts workflow feature in the Contract Copilot application. The workflow enables policy-based contract generation, review, and version management.

## Architecture Summary

### Database Schema

The implementation uses a **simplified, JSONB-heavy approach** to minimize table complexity:

- **policies**: Stores both policy rules and example agreements (distinguished by `policy_type`)
- **agreements**: Main contracts table with metadata and current version tracking
- **agreement_versions**: Version history with full content and change summaries (JSONB)
- **agreement_reviews**: Review results with proposed changes stored as JSONB arrays

### Reusable Capabilities

The implementation leverages existing application infrastructure:

✅ **LLM Integration**: Existing Bedrock client and streaming infrastructure  
✅ **File Upload/Storage**: Existing Vercel Blob storage integration  
✅ **File Parsing**: Existing `readFileContent.ts` supports PDF, DOCX, TXT, MD, JSON  
✅ **Database**: Existing Neon PostgreSQL connection  
✅ **UI Components**: Existing Tailwind styling, Svelte 5 patterns, form components

**No new dependencies required** - all necessary packages are already installed.

## Implementation Phases

### Phase 1: Database Schema & TypeScript Types ✅ COMPLETED

**Effort: 2 hours**

#### Deliverables:

- [x] SQL schema file: `DELIVERABLES/CONTRACTS_SCHEMA.sql`
- [x] TypeScript interfaces in `src/lib/schema.ts`:
  - `Policy`, `Agreement`, `AgreementVersion`, `AgreementReview`
  - `ProposedChange`, `EstimateValidationResult`, `Discrepancy`
- [x] Database CRUD functions in `src/lib/server/db.ts`:
  - Policy operations: `listPolicies`, `getPolicy`, `createPolicy`, `updatePolicy`, `deletePolicy`
  - Agreement operations: `listAgreements`, `getAgreement`, `createAgreement`, `updateAgreement`, `deleteAgreement`
  - Version operations: `getAgreementVersions`, `getAgreementVersion`, `createAgreementVersion`
  - Review operations: `listAgreementReviews`, `getAgreementReview`, `createAgreementReview`, `updateAgreementReview`

#### Technical Notes:

- Used JSONB for `metadata`, `changes_summary`, and `proposed_changes` to avoid additional tables
- Included indexes on frequently queried columns for performance
- Used LEFT JOINs in list/get operations to efficiently fetch related data
- Followed existing patterns from projects workflow

---

### Phase 2: LLM Prompt Functions ✅ COMPLETED

**Effort: 3 hours**

#### Deliverables:

- [x] Created `src/lib/server/contractPrompts.ts` with specialized prompt generators:
  - `generateAgreementPrompt()` - Creates new agreements from policies
  - `reviewAgreementPrompt()` - Reviews client drafts against policies
  - `validateAgainstEstimatePrompt()` - Validates SOWs against project estimates
  - `applyChangesPrompt()` - Applies selected changes to create new versions
  - `summarizeVersionChangesPrompt()` - Summarizes differences between versions

#### Technical Notes:

- All prompts follow best practices: clear instructions, structured output (JSON), examples
- Prompts reference policy rules explicitly and request specific output formats
- Review prompt focuses on "material changes" to avoid minor edits
- Validation prompt cross-references SOW with WBS, costs, timeline from estimate

---

### Phase 3: API Routes

**Effort: 4 hours**

#### Routes to Create:

1. **`/api/contracts/+server.ts`**
   - `GET`: List all agreements (with optional filters: type, status, counterparty)
   - `POST`: Create new agreement (upload file or generate from policies)

2. **`/api/contracts/[id]/+server.ts`**
   - `GET`: Get agreement details with all versions
   - `PUT`: Update agreement metadata (title, status, linked_project_id, etc.)
   - `DELETE`: Delete agreement and all versions

3. **`/api/contracts/[id]/generate/+server.ts`**
   - `POST`: Generate new agreement using LLM
   - Input: `{ agreementType, counterparty, policyIds, additionalContext }`
   - Output: Streaming LLM response with generated agreement text
   - Creates version 1 when complete

4. **`/api/contracts/[id]/review/+server.ts`**
   - `POST`: Review agreement against policies using LLM
   - Input: `{ versionNumber, policyIds }`
   - Output: `AgreementReview` object with `proposed_changes[]`
   - Saves review to database

5. **`/api/contracts/[id]/validate/+server.ts`**
   - `POST`: Validate SOW against linked project estimate
   - Input: `{ versionNumber }`
   - Output: `EstimateValidationResult` with discrepancies
   - Requires `linked_project_id` to be set

6. **`/api/contracts/[id]/versions/+server.ts`**
   - `GET`: List all versions for agreement
   - `POST`: Create new version (apply changes or manual edit)
   - Input: `{ content, notes, createdBy, changesSummary }`

7. **`/api/policies/+server.ts`**
   - `GET`: List all policies (with optional filters: type, agreement_type)
   - `POST`: Create new policy

8. **`/api/policies/[id]/+server.ts`**
   - `GET`: Get single policy
   - `PUT`: Update policy
   - `DELETE`: Delete policy

#### Technical Notes:

- Reuse existing streaming patterns from `/api/bedrock/+server.ts`
- Use existing `bedrockClient.streamInference()` for LLM calls
- Follow RESTful conventions and error handling patterns from projects API
- Return proper status codes (200, 201, 400, 404, 500)

---

### Phase 4: UI Components - Policy Management

**Effort: 3 hours**

#### Components:

1. **`PolicyList.svelte`**
   - Display policies grouped by type (rules vs examples)
   - For examples, sub-group by agreement_type (MSA, SOW, NDA, etc.)
   - Show title, snippet of content, edit/delete actions
   - Filter by type and agreement_type

2. **`PolicyForm.svelte`**
   - Form for creating/editing policies
   - Fields: policy_type (dropdown), agreement_type (conditional dropdown), title, content (textarea)
   - Validation: title and content required
   - Save/cancel actions

3. **`/routes/policies/+page.svelte`**
   - Page layout with heading and "Add Policy" button
   - Renders `PolicyList`
   - Opens modal/drawer with `PolicyForm` for add/edit

4. **`/routes/policies/+page.server.ts`**
   - Load policies from database: `load()` function calls `listPolicies()`

#### Technical Notes:

- Use existing card styles from projects (`.card` class)
- Follow Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- Use existing form patterns (e.g., `ApproverNameInput.svelte` for reference)
- Add to main navigation (update `Navbar.svelte`)

---

### Phase 5: UI Components - Agreements List & Detail

**Effort: 5 hours**

#### Components:

1. **`AgreementCard.svelte`**
   - Display: title, type badge, counterparty, status badge, current version #
   - Show linked project if applicable (with link)
   - Click to navigate to detail page
   - Quick actions: review, generate new version

2. **`AgreementList.svelte`**
   - Grid of `AgreementCard` components
   - Filter by type, status, counterparty (search)
   - Sort by updated_at, created_at

3. **`ContractListHeading.svelte`** (update existing)
   - Add "New Agreement" button
   - Show count of agreements by status

4. **`/routes/contracts/+page.svelte`**
   - Page layout with heading
   - Renders `AgreementList`

5. **`/routes/contracts/+page.server.ts`**
   - `load()`: Fetch agreements via `listAgreements()`

6. **`AgreementDetail.svelte`**
   - Display current version content (markdown rendering)
   - Metadata sidebar: type, counterparty, status, linked project
   - Version selector dropdown (load different versions)
   - Timeline of all versions with notes, created_by, timestamps
   - Actions: Edit, Review, Validate (if SOW), Generate New Version

7. **`/routes/contracts/[id]/+page.svelte`**
   - Renders `AgreementDetail`
   - Handle version switching (update URL query param or local state)

8. **`/routes/contracts/[id]/+page.server.ts`**
   - `load()`: Fetch agreement with `getAgreement(id)`

9. **`VersionTimeline.svelte`**
   - List of versions in timeline format
   - For each: version #, notes, created_by, created_at, changes_summary
   - Click to view that version

#### Technical Notes:

- Render markdown with existing `marked` library (already used in LLM output)
- Status badges: use Tailwind colors (draft: gray, in_review: yellow, approved: green, signed: blue)
- Version selector: dropdown or radio buttons, updates displayed content
- Timeline: vertical layout with connecting lines (similar to stage stepper)

---

### Phase 6: UI Components - Review & Generation

**Effort: 4 hours**

#### Components:

1. **`GenerateAgreement.svelte`**
   - Form: agreement type (dropdown), counterparty (input), select policies (multi-select)
   - Optional: additional context (textarea)
   - "Generate" button triggers `/api/contracts/[id]/generate`
   - Stream LLM output in real-time (reuse `LLMStream.svelte` pattern)
   - Save as version 1 when complete

2. **`ReviewAgreement.svelte`**
   - Trigger review via `/api/contracts/[id]/review`
   - Display loading state while LLM reviews
   - Show results: `ProposedChange[]` with checkboxes
   - Side-by-side view: original (before) vs proposed (after) for each change
   - Rationale displayed below each change
   - "Apply Selected Changes" button

3. **`ChangePreview.svelte`**
   - Single proposed change display component
   - Checkbox to select/deselect
   - Before/after text with diff highlighting (red for removed, green for added)
   - Rationale text below

4. **`ValidateSOW.svelte`**
   - Trigger validation via `/api/contracts/[id]/validate`
   - Display loading state
   - Show validation results:
     - Alignment score (0-100) with color coding
     - Summary paragraph
     - List of discrepancies grouped by category (scope, cost, timeline, deliverables)
     - Each discrepancy shows severity badge, description, SOW reference, estimate reference

5. **`/routes/contracts/new/+page.svelte`**
   - Options: "Generate from Policies" or "Upload Existing"
   - If generate: render `GenerateAgreement`
   - If upload: file upload + metadata form → creates agreement with version 1

#### Technical Notes:

- Diff highlighting: simple approach using `<del>` and `<ins>` tags with Tailwind colors
- Advanced option (nice-to-have): use a diff library (not required initially)
- Multi-select policies: checkboxes with labels showing policy title
- Validation score: color-coded badge (0-60: red, 61-85: yellow, 86-100: green)
- Apply changes: send selected change IDs to `/api/contracts/[id]/versions` to create new version

---

### Phase 7: Integration & Testing

**Effort: 3 hours**

#### Tasks:

1. **Update Dashboard** (`Dashboard.svelte`)
   - Agreements section already exists with `ContractListHeading`
   - Replace "Coming soon" with actual `AgreementList` component
   - Show recent agreements (limit 5)

2. **Update Navigation** (`Navbar.svelte`)
   - Add "Policies" link
   - Add "Contracts" link (if not already present)

3. **Add Chatbot Tools** (optional, nice-to-have)
   - Create `GetAgreementDetailsTool` (similar to `GetProjectDetailsTool`)
   - Add to `bedrockTools.ts` and register in `bedrockClient.ts`
   - Update `getCopilotSystemPrompt()` to include agreement context

4. **End-to-End Testing**
   - Create policy rules and example agreements
   - Generate a new MSA from policies
   - Upload a client's SOW draft
   - Review client draft against policies
   - Apply selected changes to create new version
   - Link SOW to a project and validate alignment
   - Test version timeline and switching between versions

5. **Edge Cases**
   - Handle empty states (no policies, no agreements)
   - Handle errors from LLM (invalid JSON, timeout, etc.)
   - Handle deleted linked projects (gracefully show "Project deleted")
   - Validate required fields in forms

#### Technical Notes:

- Test with real Bedrock LLM (ensure prompts work as expected)
- Verify database constraints (foreign keys, unique constraints)
- Ensure all API routes have proper error handling
- Test file upload/parsing for various formats (PDF, DOCX, TXT)

---

## Dependencies & Prerequisites

### Already Available:

- ✅ PostgreSQL database (Neon)
- ✅ AWS Bedrock LLM integration
- ✅ Vercel Blob storage
- ✅ File parsing utilities (PDF, DOCX, TXT, MD, JSON)
- ✅ Tailwind CSS styling
- ✅ Svelte 5 with TypeScript
- ✅ `marked` library for markdown rendering

### Database Setup Required:

- Execute `DELIVERABLES/CONTRACTS_SCHEMA.sql` in PostgreSQL to create tables

### No New Dependencies:

All required packages are already installed in `package.json`.

---

## Effort Summary

| Phase     | Description                 | Effort (hours) |
| --------- | --------------------------- | -------------- |
| 1         | Database Schema & Types     | 2 ✅           |
| 2         | LLM Prompt Functions        | 3 ✅           |
| 3         | API Routes                  | 4              |
| 4         | Policy Management UI        | 3              |
| 5         | Agreements List & Detail UI | 5              |
| 6         | Review & Generation UI      | 4              |
| 7         | Integration & Testing       | 3              |
| **Total** |                             | **~24 hours**  |

**Note**: Effort estimates assume familiarity with the codebase and uninterrupted development time.

---

## Optional Enhancements (Nice-to-Have)

These are not required for MVP but can be added later:

1. **Redline/Diff Preview** (2 hours)
   - Use a library like `diff-match-patch` for visual diff
   - Render side-by-side with line-by-line highlighting

2. **DOCX/PDF Export** (3 hours)
   - Generate DOCX from agreement text (use `docx` library)
   - Generate PDF (use `pdfkit` or server-side rendering)
   - Download button on agreement detail page

3. **Send for Signature Integration** (4 hours)
   - Mock integration with e-signature service (DocuSign, HelloSign, etc.)
   - Button to "Send for Signature" with recipient email
   - Status updates (sent, viewed, signed)

4. **Chatbot Contract Tools** (2 hours)
   - `GetAgreementDetailsTool` for querying agreements
   - `UpdateAgreementStatusTool` for changing status
   - Enable copilot to answer questions about contracts

5. **Bulk Operations** (2 hours)
   - Select multiple agreements for bulk status updates
   - Batch review against policies
   - Export multiple agreements

---

## Success Criteria

The implementation is complete when:

1. ✅ Database schema is created and functional
2. ✅ TypeScript types and database functions work correctly
3. ✅ LLM prompts generate expected outputs
4. ✅ All API routes respond correctly with proper error handling
5. ✅ Policy management UI allows CRUD operations
6. ✅ Agreements list and detail views display correctly
7. ✅ Generate new agreement from policies works end-to-end
8. ✅ Review client draft identifies material changes
9. ✅ Apply changes creates new version correctly
10. ✅ Validate SOW against estimate shows discrepancies
11. ✅ Version timeline displays all versions with notes
12. ✅ Integration with Dashboard and navigation is complete
13. ✅ All workflows tested with real data

---

## Risks & Mitigations

| Risk                                       | Impact | Mitigation                                                                       |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------- |
| LLM output format inconsistency            | High   | Use strict JSON output instructions, parse with error handling, retry on failure |
| Database performance with large agreements | Medium | Index frequently queried columns, paginate version lists                         |
| File parsing errors (corrupt uploads)      | Medium | Validate file format before processing, show clear error messages                |
| Complex diff logic for applying changes    | High   | Use simple text replacement initially, add advanced diff library later if needed |
| Missing policy rules                       | Low    | Allow agreements to be created without policies (with warning)                   |

---

## Next Steps

1. ✅ Complete Phase 1 and 2 (Schema, Types, Prompts) - **DONE**
2. Review and approve this implementation plan
3. Execute database schema creation (run SQL file)
4. Proceed with Phase 3 (API Routes)
5. Incrementally build and test each phase
6. Deploy to staging for user acceptance testing
7. Collect feedback and iterate

---

## Questions for Stakeholders

1. What are the most critical agreement types to support initially? (MSA, SOW, NDA, other?)
2. Should we support multiple counterparties per agreement (e.g., three-way contracts)?
3. What status values beyond draft/in_review/approved/signed/archived are needed?
4. Are there specific policy rules or example agreements ready to be loaded?
5. Should the system support multiple reviewers/approvers (workflow)?
6. Is there a preferred diff visualization style?

---

**End of Implementation Plan**
