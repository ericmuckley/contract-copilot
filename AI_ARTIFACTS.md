# AI Artifacts - A Glimpse into My AI-Assisted Development Process

## Table of Contents

- [IDE Use](#ide-use)
- [Prompts Used for Planning](#prompts-used-for-planning)
- [Prompts Used for Architecture](#prompts-used-for-architecture)
- [Prompts Used for Implementation](#prompts-used-for-implementation)
- [Prompts Used for Testing](#prompts-used-for-testing)
- [Example Where the AI Output Needed Significant Fixing](#example-where-the-ai-output-needed-significant-fixing)

## IDE Use

All code was written in VS Code with GitHub Copilot and GitHub Copilot in asynchronous agent mode at GitHub.com.

## Prompts Used for Planning

```md
Here are requirements for a project. I will build the solution as a full-stack web app. It will be centered on a chatbot (the copilot) with tool-calling abilities. The tools will be able to interact with the two workflows (i.e. CRUD apps, more or less). I will use one relational database with one file storage solution. For convenience, I will use Sveltekit with Tailwindcss and the hosting, database, and file storage will likely utilize Vercel's free tier services.

 
Read through the requirements and be honest about whether you think my plan will suffice. Then, lay out a clean implementation plan for me. Don't be vague or high-level with generic bullet points, I need a technical plan to implement this quickly and efficiently.
```

## Prompts Used for Architecture

```md
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
- Use the existing Tailwind CSS styling in the `app.css` file when you can, rather than creating new custom styles on each component.
- Use the existing resources in the app, but keep your workflow components separate and modular so it's easy to integrate or remove them.
```

```md
Look at my LLM tools in `bedrockTools.ts`. Currently, the existing tool uses a project ID to look up project details in a database.

Now I need a tool that can also write to the database. The tool should take as input the project ID and a request from the user. Likely, it would be to modify the project's tasks, which are stored as JSONB in Postgres. For example, if the user says "increase the backend effort by 10%", the agent would pull up the project, modify the project's tasks, and save the modified tasks to the database.

What would be your plan for implementing this? It's a little challenging because the user could ask to modify the project in many different ways, so there may need to be an LLM layer inside the tool that determines which part (database column) of the project to modify, and what the new value should be.
```

```md
In my "New Agreement" component, I need:

User chooses between "From internal policy templates", or "From Client"
If user selects "from client", show the "CreateFromClient.svelte" component. This should allow files to be uploaded.
If the user selects from policies, show the "CreateFromInternal.svelte" component. This should allow them to choose a type (MSA, SOW, etc), and a counterparty as text input fields.

In either case, we need to build an Agreement object, as specified in schema.ts.
Regardless of which component is shown, the ApproverNameInput component will also be shown so the created_by field in the Agreement object can be populated.
Let me know if you have questions.
```

## Prompts Used for Implementation

```md
Look at my Chatbot component, and my server endpoint that produces a readable stream. When the user submits a chat message, it should send a POST request to my server endpoint and create a stream of response objects back. Finish my chatbot component by adding a `ChatHistory` component in it, showing the chat messages including the newest content as it's streamed in real-time.
```

```md
Take a look at my chatbot, and the server endpoint which streams from the LLM. My server endpoint is configured to also accept a parameter called useTools. Please modify my API endpoint and my chatbot to accept tool-calling. When the chatbot calls a tool, it should call the tool and add it to the chat history. You may have to make a new API endpoint in tools/+server.ts for executing tool calls. Ask me if you need help.
```

```md
I added a new VARCHAR field called `approved_by` in these database tables: Project, BusinessCase, Requirements, SolutionArchitecture, EffortEstimate, EstimateTask, Quote.

I need the approved_by field to be populated whenever there is a new record added to the database in these tables. At each project stage, when the user is wants to approve and move to the next stage, add a required text input that they must use to enter their name in. That is the name that will get saved in the `approved_by` column. Make one reusable component for the name so you don't have to replicate it inside each component.
```

```md
In the module that estimates project effort, the `components/projects/EffortEstimationState.svelte` component, a single LLM inference stream is generated using the `/api/projects/${projectId}/generate` endpoint. The streamed text is then split into two segments: project assumptions, and project tasks. We are currently keeping the project assumptions as unstructured text, and parsing the project tasks as a JSON list of project tasks.

I would like to refactor the `EffortEstimationState.svelte` component so that it actually generates two distinct LLM streams sequentially - one for the project assumptions, which remains unstructured text, and the other for the project tasks, which gets parsed as JSON.

Then, both the assumptions and tasks data will be saved to the database, using the existing PUT request to the `/api/projects/${projectId}/effort-estimate` endpoint, which is currently being done in the `EffortEstimationState.svelte` component.

Your task:

- Refactor the `EffortEstimationState.svelte` component and the `/api/projects/${projectId}/generate` endpoint, so that the component generates two separate streams sequentially
- Keep the assumptions streamed text as unstructured
- Parse the tasks streamed text as JSON
- Save assumptions and tasks to the database using the existing PUT request to `/api/projects/${projectId}/effort-estimate` in the component.
```

```md
Look how I'm uploading files to Vercel blob storage in my server.ts file. Now I need to be able to read the text content out of these files.

Build my `readFileContent` function in `readFileContent.ts`. The function should accept a filename as input. This is the filename that has been uploaded to Vercel blob storage. The function should return all the text content extracted from the file. It must work for docx files, pdf files, txt, md, and json files. If you need to install additional libraries to do this, let me know and I will install them for you.
```

```md
Ok, look at the project interfaces and my schema. The project has stage data. The last stage, the quote stage, contains a task array. I want you to build an LLM tool that takes as input the project ID and a request from the user about how to modify the tasks array in the project quote stage. An LLM in the tool should take the existing tasks array, modify it according to the user's request, then save it back to the project in the database. Let me know if you have questions or concerns about this.
```

```md
I need a button on my contract/agreement page that says "Review Agreement". When the user clicks it, it performs these actions:

- It fetches the current policy text using GET `/api/policies`
- It builds an LLM prompt with the policy text and the current agreement.text_content.
- The prompt asks the LLM to compare the policy text and current agreement, and make suggestions if there are any issues, discrepancies, or anything missing from the current agreement.
- The prompt should tell the LLM to output the issues as a JSON list of "edits", where each edit is an object with "old", "new", and "note" keys. The values should be the old text in the agreement, the new text in the agreement, and a note describing the reason for the change. If it's just adding text (no old text), then leave old as an empty string.
- Finally, the user should be presented with this list of edits. They should be able to edit them further, and then "save" them, and they will get saved to the `edits` JSONB field of the agreement in the database.

Put the LLM prompt you used in lib/prompts.ts and import it from there.
```

```md
This component should allow the user to validate whether the current agreement.text_content is consistent with a project estimate. First provide a select element that lets the user select which project they want to validate against. Then add a button that says "Perform Validation". It should trigger an LLM stream, just like the one in `ContentStage.svelte`. The prompt to the LLM should be placed in `lib/prompts.ts`.

For context, the prompt should use the agreement.text_content, and the content of the estimate stage of the selected project. Then using that context, ask the LLM if the project scope / estimate is aligned with the current agreement text. If not, provide a list of issues that need to be resolved.
```

```md
Create a new Bedrock tool. It should be called `CreateNewContract`. The inputs will be `contract_type` (one of AGREEMENT_TYPES in schema.ts), and `project_name`.

First, the function will find the project ID associated with the project name. Then it will run the getProject(project_id) function to get the project details.

Next, take all the content out of the project.stages, and feed it to an LLM. It should be prompted to turn the project into a contract and return JSON that includes:
```

{
contract_name,
counterparty (or UNKNOWN),
text_content (the content of the contract)
}

```

Finally, parse the LLM output as JSON to get the values of these items. Once we have the values, we can create the new contract.

To create the new contract, we need to call the `saveNewAgreement` function.

That function will need multiple inputs:

- origin: use 'internal'
- created_by: use the project.created_by
- agreement_name: from the LLM output
- agreement_type: any of AGREEMENT_TYPES in schema.ts, passed to the function by the user
- counterparty: from the LLM output
- text_content: from the LLM output
- root_id: use `makeShortId()`
- version_number: 1
```

## Prompts Used for Testing

```md
# Overview

We have a suite of LLM tool calls available in `server/bedrockTools.ts`. We need to create tests for these tools.

## Tasks

- Create a `tests` directory where it makes sense to do so
- Put an `index.ts` file in there. That will be the entry point to all the tests.
- Make tests for all the LLM tools in the tests directory. The tool calls can be called directly from the tests, we don't need to call them from an LLM.
- Set up a command in our package.json like `npm run test`. This should run the test suite and print to the console whether each test passed or failed, and why it failed.
- If the test functions create database objects, they should delete the objects afterwards to not clutter up the db tables.
```

## Example Where the AI Output Needed Significant Fixing

First, I prompted to create the contract generation from client documents:

```md
Fill in my `CreateFromClient` component. It should follow a similar pattern to the `CreateFromInternal` component, culminating with the creation of a new agreement object saved to the database, but with a couple key differences:

Instead of generating the text_content for the agreement, it should read the text content from the uploaded file and use that for the `text_content` field. The `agreement_name`, `counterparty`, and `agreement_type` fields should be inferred automatically from the text_content, using an LLM call to my bedrock API.

Make sure the LLM outputs JSON so that we can read the `agreement_name`, `counterparty`, and `agreement_type` values from the LLM output and parse them into the agreement object so we can save it to the database. Also make sure the LLM knows what valid AGREEMENT_TYPES to use, as found in schema.ts. Put your prompt in `lib/prompts.ts`.
```

Then, I needed to force it to actually read the content of the documents:

```md
Allow docx, pdf, md, txt, or json input files. To extract the text from the uploaded file, use the `readFileContent` method.
```

Next, I needed it to safely parse potentially malformed JSON using a custom function:

```md
We need to make sure the LLM response is clean so we can use JSON.parse. I already have a function for this: `safeJsonParse`. Use it before trying to parse the LLM output.
```

Finally, I needed to push it to create a new API endpoint for extracting text from files, since that was going to be easier server-side:

```md
OK, since I'm already using those libraries on the server, create a new server endpoint called file-extractor, and put the file-reading logic in there. We should be able to send the file blob directly to the endpoint and read it that way, without uploading to Vercel or modifying the existing endpoint. Make sure the endpoint can handle docx, pdf, txt, json, and md, just so it's all conveniently located in the same place, rather than parsing plaintext on the client, and docx/pdf on the server.
```
