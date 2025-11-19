/*
AWS Bedrock foundation models:
https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html

*/

import {
	type ToolConfiguration,
	type SystemContentBlock,
	type ConverseStreamCommandInput,
	ConverseStreamCommand
} from '@aws-sdk/client-bedrock-runtime';
import type { LLMInferencePayload } from '$lib/types';
import { LLM_MODEL_ID, LLM_MAX_TOKENS, LLM_TEMPERATURE } from '$lib/server/settings';
import { getCopilotSystemPrompt } from '$lib/server/bedrockPrompts';
import { TOOLS } from '$lib/server/bedrockToolList';
import { bedrockClient } from '$lib/server/bedrockClientInstance';

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
			{
				text: await getCopilotSystemPrompt(
					payload.activeProjectId ?? null,
					payload.activeAgreementRootId ?? null
				)
			} as SystemContentBlock
		];
	}

	// Stream the results
	const response = await bedrockClient.send(new ConverseStreamCommand(llmInput));
	return response.stream;
};
