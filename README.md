# Contract Copilot

AI copilot that helps review contracts and generate project requirements and pricing estimates.

For additional artifacts, please see the [./DELIVERABLES](DELIVERABLES) directory.

## Stack

- Fullstack Sveltekit application written in Typescript
- Styling with TailwindCSS
- Hosted on Vercel with CI/CD via GitHub
- Vercel Blob Store for persistent file storage
- Neon hosted Postgres database for persistent relational data
- AWS Bedrock with Claude for LLM streaming and tool calling

## Running locally

1. **Set environment variables**: Copy the `.env.example` file, rename to `.env`, and populate with correct values.
1. **Install dependencies**: `npm i`
1. **Run local development server**: `npm run dev -- --open`
