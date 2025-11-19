# Contract Copilot

AI copilot that helps review contracts and generate project requirements and pricing estimates.

The application is live at [my-app.com](https://my-app.com)

## Deliverables

Please see deliverables in

- [APPROACH.md](./APPROACH.md)
- [AI_ARTIFACTS.md](./AI_ARTIFACTS.md)
- [TESTING.md](./TESTING.md)

## Running locally

### 1. Set environment variables

Copy the `.env.example` file, rename to `.env`, and populate with values.

### 2. Install dependencies

```bash

npm i

```

### 3. Run local development server

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
