import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { AWS_REGION } from '$lib/server/settings';

export const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });
