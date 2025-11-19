import { BLOB_READ_WRITE_TOKEN, BLOB_BASE_URL, DATABASE_URL } from '$env/static/private';

export const AWS_REGION = 'us-west-2';
export const LLM_MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
//export const LLM_MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";
export const LLM_MAX_TOKENS = 4192;
export const LLM_TEMPERATURE = 0.15;

export { BLOB_BASE_URL, BLOB_READ_WRITE_TOKEN, DATABASE_URL };
