import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import {
	CheckTheWeatherTool,
	GetCurrentProjectTool,
	GetProjectByNameTool,
	UpdateProjectTasksTool,
	type ToolContext
} from '$lib/server/bedrockTools';

const TOOLS = [
	CheckTheWeatherTool,
	GetCurrentProjectTool,
	GetProjectByNameTool,
	UpdateProjectTasksTool
];

interface ToolExecutionRequest {
	toolUseId: string;
	name: string;
	input: Record<string, unknown>;
	context?: ToolContext;
}

export async function POST({ request }: RequestEvent) {
	try {
		const { toolUseId, name, input, context }: ToolExecutionRequest = await request.json();

		// Find the tool by name
		const tool = TOOLS.find((t) => t.spec.toolSpec.name === name);

		if (!tool) {
			return json({ error: `Tool '${name}' not found` }, { status: 404 });
		}

		// Execute the tool
		console.log(`Executing tool: ${name} with input:`, input);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await tool.run(input as any, context);

		return json({
			toolUseId,
			name,
			input,
			content: result.text || JSON.stringify(result.response),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			updateRequired: (result as any).updateRequired || false
		});
	} catch (error) {
		console.error('Tool execution error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error occurred' },
			{ status: 500 }
		);
	}
}
