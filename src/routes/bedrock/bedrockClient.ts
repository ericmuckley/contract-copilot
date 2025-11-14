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
import { AWS_REGION, LLM_MODEL_ID, LLM_MAX_TOKENS, LLM_TEMPERATURE } from '$lib/settings';
import { CheckTheWeatherTool } from './bedrockTools';

export const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

const SYSTEM_PROMPT = 'You are an expert at analyzing contracts and project planning.';
const TOOLS = [CheckTheWeatherTool];

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
		llmInput.system = [{ text: SYSTEM_PROMPT } as SystemContentBlock];
	}

	// Stream the results
	const response = await bedrockClient.send(new ConverseStreamCommand(llmInput));
	return response.stream;
};

/*
// Simple single LLM inference
export const handleLLMInference = async (payload: LLMInferencePayload): Promise<string> => {
	const response = await bedrockClient.send(
		new ConverseCommand({
			modelId: LLM_MODEL_ID,
			messages: payload.messages,
			system: payload.systemMessages || [],
			inferenceConfig: {
				maxTokens: LLM_MAX_TOKENS,
				temperature: LLM_TEMPERATURE
			}
		})
	);
	const responseText = response.output?.message?.content?.[0]?.text ?? '';
	return responseText;
};

// Execute an LLM tool call by name
export const executeToolCall = async (toolUseBlock: ToolUseBlock, userData: UserData) => {
	// Find the tool class by name and execute it
	console.log(`Executing tool call: ${JSON.stringify(toolUseBlock)}`);
	for (const tool of TOOLS) {
		if (tool.spec.toolSpec.name === toolUseBlock.name) {
			return await tool.run(toolUseBlock.input as any, userData);
		}
	}
};
*/
