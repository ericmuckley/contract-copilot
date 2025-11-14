import {
	BLOB_READ_WRITE_TOKEN as ENV_BLOB_TOKEN,
	BLOB_BASE_URL as ENV_BLOB_URL,
	DATABASE_URL as DB_URL
} from '$env/static/private';

export const AWS_REGION = 'us-west-2';
export const LLM_MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
export const LLM_MAX_TOKENS = 2048;
export const LLM_TEMPERATURE = 0.25;

export const BLOB_BASE_URL = ENV_BLOB_URL;
export const BLOB_READ_WRITE_TOKEN = ENV_BLOB_TOKEN;
export const DATABASE_URL = DB_URL;
