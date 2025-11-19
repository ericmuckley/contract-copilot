// Test environment settings - uses process.env instead of SvelteKit's $env/static/private

export const AWS_REGION = 'us-west-2';
export const LLM_MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
//export const LLM_MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";
export const LLM_MAX_TOKENS = 4192;
export const LLM_TEMPERATURE = 0.25;

export const BLOB_BASE_URL = process.env.BLOB_BASE_URL || '';
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';
