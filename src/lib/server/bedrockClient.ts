/*
AWS Bedrock foundation models:
https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html

*/

import {
	type ToolConfiguration,
	type SystemContentBlock,
	type ConverseStreamCommandInput,
	BedrockRuntimeClient,
	ConverseStreamCommand
} from '@aws-sdk/client-bedrock-runtime';
import type { LLMInferencePayload } from '$lib/types';
import { AWS_REGION, LLM_MODEL_ID, LLM_MAX_TOKENS, LLM_TEMPERATURE } from '$lib/server/settings';
import { GetProjectDetailsTool } from './bedrockTools';
import { getCopilotSystemPrompt } from '$lib/server/bedrockPrompts';

export const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

const TOOLS = [GetProjectDetailsTool];

// Full streaming of LLM response with optional tool calls
export const streamInference = async (payload: LLMInferencePayload) => {
	// Prepare the LLM input
	const llmInput: ConverseStreamCommandInput = {
		modelId: LLM_MODEL_ID,
		messages: payload.messages,
		system: payload.systemMessages || [],
		inferenceConfig: {
			maxTokens: LLM_MAX_TOKENS,
			temperature: LLM_TEMPERATURE
		}
	};
	// If a toolset is specified, add the tool configuration
	if (payload.useTools) {
		const toolSpecs = TOOLS.map((t) => t.spec);
		console.log(
			'Registered tools:',
			toolSpecs.map((t) => t.toolSpec.name)
		);
		llmInput.toolConfig = { tools: toolSpecs } as ToolConfiguration;
		llmInput.system = [
			{ text: await getCopilotSystemPrompt(payload.activeProjectId ?? null) } as SystemContentBlock
		];
	}

	// Stream the results
	const response = await bedrockClient.send(new ConverseStreamCommand(llmInput));
	return response.stream;
};
