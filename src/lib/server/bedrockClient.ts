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
import {
	CheckTheWeatherTool,
	GetCurrentProjectTool,
	GetProjectByNameTool,
	UpdateProjectTasksTool
} from './bedrockTools';

export const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

const SYSTEM_PROMPT = `You are a project estimation copilot assistant. You help users manage and analyze project estimates.

You have access to tools that allow you to:
- View the current active project and its estimates
- Find projects by name
- Update project tasks (add, modify, adjust hours, remove)

When the user asks about projects or wants to make changes:
1. Use get_current_project to see what project is active
2. Use get_project_by_name to find specific projects by name
3. Use update_project_tasks to modify the estimate

Be conversational and helpful. When making changes, confirm what was done and show the updated totals.`;

const TOOLS = [
	CheckTheWeatherTool,
	GetCurrentProjectTool,
	GetProjectByNameTool,
	UpdateProjectTasksTool
];

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

*/
