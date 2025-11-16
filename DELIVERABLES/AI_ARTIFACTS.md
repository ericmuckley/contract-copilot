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

## Adding approved_by

I added a new VARCHAR field called `approved_by` in these database tables: Project, BusinessCase, Requirements, SolutionArchitecture, EffortEstimate, EstimateTask, Quote.

I need the approved_by field to be populated whenever there is a new record added to the database in these tables. At each project stage, when the user is wants to approve and move to the next stage, add a required text input that they must use to enter their name in. That is the name that will get saved in the `approved_by` column. Make one reusable component for the name so you don't have to replicate it inside each component.

## Separating LLM streams for project estimation

In the module that estimates project effort, the `components/projects/EffortEstimationState.svelte` component, a single LLM inference stream is generated using the `/api/projects/${projectId}/generate` endpoint. The streamed text is then split into two segments: project assumptions, and project tasks. We are currently keeping the project assumptions as unstructured text, and parsing the project tasks as a JSON list of project tasks.

I would like to refactor the `EffortEstimationState.svelte` component so that it actually generates two distinct LLM streams sequentially - one for the project assumptions, which remains unstructured text, and the other for the project tasks, which gets parsed as JSON.

Then, the both the assumptions and tasks data will be saved to the database, using the existing PUT request to the `/api/projects/${projectId}/effort-estimate` endpoint, which is currently being done in the `EffortEstimationState.svelte` component.

Your task:

- refactor the `EffortEstimationState.svelte` component and the `/api/projects/${projectId}/generate` endpoint, so that the component generates two separate streams sequentially
- keep the assumptions streamed text as unstructured
- parse the tasks streamed text as json
- save assumptions and tasks to the database using the existing PUT request to `/api/projects/${projectId}/effort-estimate` in the component.

# Text extraction from uploaded files

Look how im uploading files to Vercel blob storage in my server.ts file. Now I need to be able to read the text content out of these files.

Build my `readFileContent` function in `readFileContent.ts`. The function should accept a filename as input. This is the filename that has been uploaded to Vercel blob storage. The function should return all the text content extracted from the file. It must must work for docx files, pdf files, txt, md, and json files. If you need to install additional libraries to do this, let me know and I will install them for you.

# LLM tools with write capability

This was my original prompt to start probing options for the architecture:

```md
Look at my LLM tools in `bedrockTools.ts`. Currently, the existing tool uses a project ID to look up project details in a database.

Now I need a tool that can also write to the database. The tool should take as input the project ID and a request from the user. Likeiy, it would be to modify the projects tasks, which are stored as JSONB in Postgres. For example, if the user says "increase the backend effort by 10%", the agent would pull up the project, modify the projects tasks, and save the modified tasks to the database.

What would be your plan for implementing this? Its a little challenging because the user could ask to modify the project in many different ways, so there may need to be an LLM layer inside the tool that determines which part (database column) of the project to modify, and what the new value should be.
```

Then I simplified the scope here so it could be implemented quickly:

```md
Ok, look at the project interfaces and my schema. The project has stage data. The last stage, the quote stage, contains a task array. I want you to build an LLM tool that takes as input the project ID and a request from the user about how to modify the tasks array in the project quote stage. An LLM in the tool should take the existing tasks array, modify it according to the user's request, then save it back to the project in the database. Let me know if you have questions or concerns about this.
```

Then I modified the chatbot so that the UI would reflect changes caused by teh tool calling without a manual refresh:

```md
great, and now i need to make sure that when this tool runs in my chatbot, the frontend automatically re-fetches the projects (and active project, if any) from the database so that the updated tasks change as soon as they've been modified, without the user having to manually refresh
```


# Contracts architecture


```md

# Contracts Workflow Overview

The application needs to have a built-in workflow for creating, analyzing, and modifying contracts. We will start with policy rules and example agreements. Then, the applicatino will use an LLM to draft new MSAs/SOWs that follow those rules. When a client sends their own draft, we can run a
review that proposes only the material changes, showing exact before → after text with a one-line why. We can apply the selected changes to produce a new version and keep a simple timeline of versions and notes.

## Contract capabilities

Policy setup (do this first): Add Policy Rules and Example Agreements (MSA, SOW, NDA, etc).

Then handle contracts in any order:

- Create new agreement: Generate LLM-powered agreement from policies
- Choose type (MSA or SOW) + counterparty
- System feeds Policy Rules + Example Agreements to LLM
- Save as Agreement v1
- Review client draft: Upload/paste client's agreement → save as incoming v1 → run policy-based review
- LLM returns material change proposals based on your policies
- Each proposal shows exact before → after text + rationale
- Apply selected changes to create new version
- Validate against estimate: Link SOW to an estimate to check alignment
- Agent validates against WBS (tasks, roles, hours) and quote (rates, totals, terms)
- Returns discrepancies (e.g., missing WBS tasks, payment mismatch)
- Version management: Add new versions and notes; view timeline of all changes.


## Must-have screens

- Policy management: List of policy rules and example agreements, add/edit/delete functionality.
- Agreements list: Show all agreements with type (MSA/SOW/NDA), counterparty, current version number.
- Agreement detail: Current agreement text, version selector/timeline on side, linked estimate indicator if applicable.
- Review screen: Side-by-side view showing proposed changes with before/after text, checkboxes to accept/reject each change.

## Nice-to-have (optional)

- Redline/diff preview (as enhancement to Review screen)
- DOCX/PDF generation (export feature from Agreement detail)
- "Send for signature" mock/adapter (action from Agreement detail).

## Goal

Your job is to help architect the schema, models, and patterns needed for these capabilities. Specifically:

- Determine which new database tables we need, and which fields in each table. Generate the SQL for creating those tables. Keep things as simple as you can. For example, make use of JSONB when it makes sense, rather than using lots of different tables. We are using Postgres for a db, with Vercel blob storage for file storage.
- Make a plan for which main UI components we need, how they should interact, and which data will be shown on each.
- Look at the existing app architecture, and determine whether we need any additional capabilities, like LLM patterns, file parsing, etc, or whether we can reuse capabilities we already have.
- If we need specialized LLM prompts for any of these tasks, write out the Typescript functions that will generate those prompts and include the proper context in each prompt.
- Generate a succinct, informative plan for implementing the changes, along with the amount of effort you estimate needed for each change.

```

