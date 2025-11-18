Create these tables in Postgres:

```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    sdata JSONB NOT NULL,
    project_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE artifacts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_content TEXT
);


CREATE TABLE agreements(
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    root_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    origin TEXT NOT NULL,
    counterparty TEXT,
    text_content TEXT,
    notes TEXT[],
    edits JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    agreement_type TEXT NOT NULL,
    agreement_name TEXT NOT NULL,
    created_by TEXT NOT NULL
)

```

# Refactor

## Initial prompt

# Overview

I want to drastically simplify my architecture and schema.

## Original goals

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

## Current implementation

The current implementation is overengineered - there are different interfaces and API endpoints for each stage in the process, and there used to be different database tables for each stage in the process as well. I want to drastically simplify the architecture.

## New requested implementation

Please look at my new schema in `schema.ts`. This contains all the simplified data structures I want for the new architecture. I only have two database tables now - `projects`, and `artifacts`. All the data for the workflow stages is stored as jsonb inside a project object.

The updated database calls I'm using are in `db.ts`. These contain the simplified interactions with the `projects` and `artifacts` tables. You may need to create a new `createArtifact` method in that table to accomplish the goal.

## Your goal

Your goal is to refactor the project workflow infrastructure in `routes/projects/[id]/+page.svelte`, where most of the workflow logic throughout the stages takes place. The system is very complicated now, and uses lots of old components and backend API calls. I want you to simplify these using my new database schema, and remove lots of deprecated methods and endpoints if you can. The goal at the end is to have a full working workflow, where we're only manipulating the `project` and `artifact` objects, and all the information from the workflow stages is contained in jsonb structure in the project stage data, or `sdata` column.

[schema.ts](https://github.com/user-attachments/files/23559816/schema.ts)

[db.ts](https://github.com/user-attachments/files/23559824/db.ts)

# Simplifying Quote Stage Component

I want you to drastically simplify my QuoteStage component. It should have no LLM calls or API requests of any kind.

It should create a table of the prokect tasks, along with a column for rate (coming from the PROJECT_PERSONNEL_RATES variable), and another column for total cost.

Then add final rows at the bottom for total project cost and project timeline, based on the number of hours for each task.

Finally, let the user copy or download the take cata to a CSV file.

# Adding project modifications to the copilot

# Purpose

The application has a chatbot with tool-calling capabilities, with one example "check the weather" tool available to it now.

The chatbot needs to turn into a full copilot capable of assisting in the project estimation workflow. It should know which project is active, and which stage the project is in. It should be able to modify the current project stage data (`project.sdata`). Think of it as the command line for the whole app—fast, context-aware, and consistent.

## Example capabilities

- "Increase Backend hours by 10% in the current project"
- "Add a QA line: 40h at $90/hr, rationale 'regression pass'"
- "What's the current total for Project Apollo?"

When the copilot chatbot calls server functions/tools to make updates to the current project, it must update the UI accordingly (no manual refresh).

## Your task

You must extend the current chatbot with basic "check weather" tool to include tools for modifying the stage data of the current project. When that data is modified, it should automatically update in the UI. The copilot should also be able to query other projects, based on the project name.

# GOOD for Loom conversation:"Implementing a "review agreement"
