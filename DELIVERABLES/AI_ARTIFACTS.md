Document your AI-assisted development:

- Include the actual prompts you used for each phase of your development process (planning, architecture, implementation, testing, etc.)
- Show the progression from initial problem understanding to final implementation
- Include at least one example where AI output required significant fixing and your follow-up prompts
- Note which IDE/tool you used (Cursor, Claude Code, Copilot, etc.)

## Prompts

### Planning

- Here are requirements for a project. I will build the solution as a full-stack web app. It will be centered on a chatbot (the copilot) with tool-calling abilities. The tools will be able to interact with the two workflows (i.e. CRUD apps, more or less). I will use one relational database with one file storage solution. For convenience, I will use Sveltekit with Tailwindcss and the hosting, database, and file storage will likely utilize Vercel's free tier services. Read through the requirements and be honest about whether you think my plan will suffice. Then, lay out a clean implementation plan for me. Don't be vague or high-level with generic bullet points, I need a technical plan to implement this quickly and efficiently.

### Implementation

- Change my POST function to take the user's request, then use my `streamInference` function to stream back the LLM response from the POST endpoint.

- Make the textarea in this component look good, and it should auto expand when text is added/removed, so it fits the size of the text. When the user clicks the "enter" button while the text area is focused, have it trigger a function called "handleSubmit"

- Look at my Chatbot component, and my server endpoint that produces a readable stream. When the user submits a chat message, it should send a post request to my server endpoint and create a stream of response objects back. Finish my chatbot component by adding a `ChatHistory` compnent in it, showing the chat messages including the newest content as its streamed in real-time.

- Take a look at my chatbot, and the server endpoint which streams from the LLM. My server endpoint is configured to also accept a parameter called useTools. Please modify my API endpoint and my chatbot to accept tool-calling. When the chatbot calls a tool, it should call the tool and add it to the chat history. You may have to make a new API endpoint in tools/+server.ts for executing tool calls. Ask me if you need help.


### Agent for estimates workflow

# Goal: Create a Project Cost Estimates Workflow in the application.

Purpose: take some unstructured documents, and move them through six stages, with LLM processing and user validation at each stage: Artifacts → Business Case → Requirements → Solution/Architecture → Effort Estimate → Quote.

Each stage has entry criteria and approval gates:

1. Artifacts: Create project and attach ≥2 artifacts (transcripts, documents, notes). Advance when ready.
2. Business Case: LLM generates business case from artifacts (scope, outcomes, constraints). Edit and approve to advance.
3. Requirements: LLM generates requirements summary from artifacts. Edit and validate to advance.
4. Solution/Architecture: Document approach and solution architecture, tech stack, risks. Approve to advance.
5. Effort Estimate: LLM generates WBS with tasks, assigned roles, hours per task, and assumptions from all prior artifacts. Approve to advance.
6. Quote: Apply rates to roles, add payment terms and timeline. Export CSV or copy-to-clipboard. Mark delivered.

Must-have screens:
- Projects list: Show all projects with current stage indicator, filter by stage. Put this project list on the Dashboard.svelte component.
- New Project screen: Create a new project by naming it and uploading some artifacts. Then give the option to advance it to the next stage.
- Project detail: Stage stepper/progress indicator at top, current stage content panel, stage transition history timeline with timestamps/approvers.
- Stage transitions: Validation before advancing (e.g., artifacts uploaded, approval recorded), clear advance/approve buttons per stage.

## How you should do it:

- Use the existing LLM APIs used by the current Chatbot component, paricularly the `bedrock` API endpoint for LLM interactions.
- Use the existing Postgres database hosted in vercel. The DB connection URL is available in `src/lib/server/db.ts`. For a look at the DB tables, look at the SQL commands in the `DELIVERABLES/AI_ARTIFACTS.md` file. You may want to create typescript types for those tables and use them in your implementation.
- For uploading / storing / download files, use the blob storage URL in `lib/server/settings.ts`, along with the `@vercel/blob` package, which is already installed.

## Ground rules:

- Always use Svelte5 syntax with Runes mode. Do NOT use old svelte syntax. If you need to check, look at the existing components and use them as a guide.
- Use existing packages which are already installed: `@vercel/blob`, `@neondatabase/serverless`, and `@vercel/postgres`, rather than installing new packages.
- Use the existing tailwindcss styling in the `app.css` file when you can, rather than creating new custom styles on each component.
- Use the existing resources in the app, but keep your workflow components separate and modular so its easy to integrate or remove them. 



### Database

From Google Gemini:

```sql
-- Create a custom ENUM type for the fixed project stages [cite: 15]
CREATE TYPE project_stage AS ENUM (
    'Artifacts',
    'BusinessCase',
    'Requirements',
    'SolutionArchitecture',
    'EffortEstimate',
    'Quote'
);

-- A simple User table for tracking "approvers" [cite: 29]
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL
);

-- The main Project table, which tracks the current stage [cite: 18, 26]
CREATE TABLE "Project" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "current_stage" project_stage NOT NULL DEFAULT 'Artifacts',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores file references (from Vercel Blob Storage) for each project [cite: 18]
CREATE TABLE "Artifact" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(1024) NOT NULL, -- This would be the Vercel Blob URL
    "artifact_type" VARCHAR(100), -- e.g., 'transcript', 'notes', 'document' [cite: 18]
    "uploaded_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores the content for the Business Case stage [cite: 19]
CREATE TABLE "BusinessCase" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL UNIQUE REFERENCES "Project"("id") ON DELETE CASCADE,
    "content" TEXT, -- LLM-generated scope, outcomes, constraints [cite: 19]
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores the content for the Requirements stage [cite: 20]
CREATE TABLE "Requirements" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL UNIQUE REFERENCES "Project"("id") ON DELETE CASCADE,
    "content" TEXT, -- LLM-generated requirements summary [cite: 20]
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores the content for the Solution/Architecture stage [cite: 21]
CREATE TABLE "SolutionArchitecture" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL UNIQUE REFERENCES "Project"("id") ON DELETE CASCADE,
    "content" TEXT, -- Documented approach, tech stack, risks [cite: 21]
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores the high-level effort estimate details [cite: 22]
CREATE TABLE "EffortEstimate" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL UNIQUE REFERENCES "Project"("id") ON DELETE CASCADE,
    "assumptions" TEXT, -- WBS assumptions [cite: 22]
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores individual line items (WBS) for an estimate [cite: 22]
CREATE TABLE "EstimateTask" (
    "id" SERIAL PRIMARY KEY,
    "estimate_id" INTEGER NOT NULL REFERENCES "EffortEstimate"("id") ON DELETE CASCADE,
    "task_description" TEXT NOT NULL,
    "assigned_role" VARCHAR(255) NOT NULL, -- "Backend", "QA" [cite: 22, 72]
    "hours" DECIMAL(10, 2) NOT NULL
);

-- Stores the final Quote details [cite: 24]
CREATE TABLE "Quote" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL UNIQUE REFERENCES "Project"("id") ON DELETE CASCADE,
    "payment_terms" TEXT,
    "timeline" TEXT,
    "is_delivered" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores the rates applied to roles for a specific quote [cite: 24]
CREATE TABLE "QuoteRate" (
    "id" SERIAL PRIMARY KEY,
    "quote_id" INTEGER NOT NULL REFERENCES "Quote"("id") ON DELETE CASCADE,
    "role_name" VARCHAR(255) NOT NULL,
    "rate_per_hour" DECIMAL(10, 2) NOT NULL,
    UNIQUE("quote_id", "role_name") -- Ensures one rate per role per quote
);

-- Tracks all stage transitions, approvals, and history [cite: 29]
CREATE TABLE "ProjectHistory" (
    "id" SERIAL PRIMARY KEY,
    "project_id" INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
    "stage" project_stage NOT NULL,
    "user_id" INTEGER REFERENCES "User"("id"), -- The "approver" [cite: 29]
    "action" VARCHAR(255) NOT NULL, -- e.g., 'Approved', 'Advanced', 'Artifact Uploaded'
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
