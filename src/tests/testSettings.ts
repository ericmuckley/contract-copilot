/**
 * Test settings module
 * This module provides settings for test execution without relying on SvelteKit's $env module
 */

// Load environment variables from process.env for tests
export const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
export const LLM_MODEL_ID =
	process.env.LLM_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
export const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || '4192', 10);
export const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || '0.25');

export const BLOB_BASE_URL = process.env.BLOB_BASE_URL || '';
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';

// Validate required environment variables
if (!DATABASE_URL) {
	console.error('\n⚠️  WARNING: DATABASE_URL is not set. Tests requiring database will fail.\n');
}

if (!process.env.AWS_BEARER_TOKEN_BEDROCK) {
	console.error(
		'\n⚠️  WARNING: AWS_BEARER_TOKEN_BEDROCK is not set. Tests requiring LLM calls will fail.\n'
	);
}
