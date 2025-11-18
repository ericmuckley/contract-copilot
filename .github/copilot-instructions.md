# Contract Copilot - GitHub Copilot Instructions

## Project Overview

Contract Copilot is an AI-powered application that helps users review contracts and estimate pricing. The application leverages AWS Bedrock for AI capabilities and provides an interactive web interface for contract analysis.

## Tech Stack

- **Framework**: SvelteKit with TypeScript
- **UI**: Svelte 5, Tailwind CSS 4
- **AI Integration**: AWS Bedrock Runtime SDK (@aws-sdk/client-bedrock-runtime)
- **Database**: Neon Serverless PostgreSQL (@neondatabase/serverless, @vercel/postgres)
- **Storage**: Vercel Blob Storage (@vercel/blob)
- **Build Tools**: Vite 7, TypeScript 5
- **Linting/Formatting**: ESLint 9, Prettier 3
- **Deployment**: Vercel (@sveltejs/adapter-vercel)

## Project Structure

```
contract-copilot/
├── src/
│   ├── app.html          # HTML template
│   ├── app.css           # Global styles
│   ├── routes/           # SvelteKit routes
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── bedrock/      # AI model endpoints
│   │   ├── contracts/    # Contract management
│   │   ├── projects/     # Project management
│   │   └── tools/        # Utility endpoints
│   └── lib/
│       ├── components/   # Reusable Svelte components
│       ├── server/       # Server-side utilities
│       ├── assets/       # Static assets
│       ├── types.ts      # TypeScript type definitions
│       └── utils.ts      # Utility functions
├── static/               # Static files served at root
├── DELIVERABLES/         # Project deliverables and documentation
└── [config files]        # Various configuration files
```

## Development Workflow

### Setup

1. Copy `.env.example` to `.env` and populate with required environment variables:
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
   - `BLOB_BASE_URL` - Vercel Blob storage URL
   - `DATABASE_URL` - PostgreSQL connection string

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Available Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build
- `npm run check` - Run Svelte and TypeScript checks
- `npm run check:watch` - Run checks in watch mode
- `npm run format` - Format code with Prettier
- `npm run lint` - Check formatting and run ESLint

## Code Style and Conventions

### TypeScript

- Use TypeScript for all new files
- Define types in `src/lib/schema.ts` or co-located with components
- Look in `src/lib/schema.ts` to see existing type definitions and other schema used throughout the app
- Avoid using `any` type; use proper type definitions

### Svelte

- Use Svelte 5 syntax (runes: `$state`, `$derived`, `$effect`)
- Always favor onMount over $effect for client-side initialization when possible
- Place components in `src/lib/components/`
- Keep components focused and single-purpose

### Styling

- Use Tailwind CSS utility classes
- When possible, use existing Tailwind utility classes defined in `app.css` instead of defining custom tailwind in every component
- Custom CSS should be minimal and placed in component `<style>` blocks or `app.css`

### Formatting and Linting

- Code is formatted with Prettier (see `.prettierrc`)
- ESLint configuration is in `eslint.config.js`
- Always run `npm run lint` before committing
- Use `npm run format` to auto-fix formatting issues

### File Naming

- Routes follow SvelteKit conventions: `+page.svelte`, `+layout.svelte`, `+server.ts`
- Components use PascalCase: `MyComponent.svelte`
- Utilities use camelCase: `llmUtils.ts`, `types.ts`

## Key Dependencies

### AI and Data

- **@aws-sdk/client-bedrock-runtime**: Interface with AWS Bedrock AI models
- **marked**: Markdown parsing for formatted responses

### Database and Storage

- **@vercel/postgres / @neondatabase/serverless**: PostgreSQL database access
- **@vercel/blob**: Blob storage for file uploads

### UI Components

- **bootstrap-icons**: Icon library

## SvelteKit Specifics

- Use SvelteKit's file-based routing
- Server-side code goes in `+server.ts` or `src/lib/server/`
- Use `$env/static/private` for server-side environment variables
- Use `$env/static/public` for client-side environment variables (prefix with `PUBLIC_`)
- Load data in `+page.ts` or `+page.server.ts` files

## Testing

Currently, the project does not have a test suite configured. When adding tests:

- Use a testing framework compatible with Svelte and Vite (e.g., Vitest)
- Place unit tests next to components: `Component.test.ts`
- Place integration tests in a `tests/` directory

## Environment Variables

The application requires these environment variables (see `.env.example`):

- `BLOB_READ_WRITE_TOKEN` - Required for file storage
- `BLOB_BASE_URL` - Required for file storage
- `DATABASE_URL` - Required for database connections

## Deployment

The application is configured for Vercel deployment using `@sveltejs/adapter-vercel`. Build artifacts are generated with `npm run build`.

## Notes for Copilot

- When suggesting changes to Svelte components, use Svelte 5 runes syntax
- Be mindful of server vs. client code boundaries in SvelteKit
- Tailwind CSS 4 is used; refer to latest Tailwind documentation
- The project uses ES modules (`"type": "module"` in package.json)
- Node.js types are available via `@types/node`
