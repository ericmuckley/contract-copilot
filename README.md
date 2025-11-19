# Contract Copilot

AI copilot that helps review contracts and generate project requirements and pricing estimates.

The application is live at [https://contract-copilot-tau.vercel.app/](https://contract-copilot-tau.vercel.app/)

## Deliverables

Please see deliverables in

- [APPROACH.md](./APPROACH.md): my approach to AI-assisted engineering
- [AI_ARTIFACTS.md](./AI_ARTIFACTS.md): prompts and artifacts from the development process
- [TESTING.md](./TESTING.md): instructions for running server-side tests

## Running locally

### 1. Set environment variables

Copy the `.env.example` file, rename to `.env`, and populate with values.

### 2. Install dependencies

```bash

npm i

```

### 3. Seed the database

Executes `src/db/create_tables.sql` to create the required database tables.

```bash

npm run seed

```

### 4. Run local development server

```bash

npm run dev -- --open

```

## Stack

- Fullstack Sveltekit application written in Typescript
- Styling with TailwindCSS
- Hosted on Vercel with CI/CD via GitHub
- Vercel Blob Store for persistent file storage
- Neon hosted Postgres database for persistent relational data
- AWS Bedrock with Claude for LLM streaming and tool calling.
