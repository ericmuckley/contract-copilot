import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { TOOLS } from '$lib/server/bedrockToolList';

interface ToolExecutionRequest {
	toolUseId: string;
	name: string;
	input: Record<string, unknown>;
}

export async function POST({ request }: RequestEvent) {
	try {
		const { toolUseId, name, input }: ToolExecutionRequest = await request.json();

		// Find the tool by name
		const tool = TOOLS.find((t) => t.spec.toolSpec.name === name);

		if (!tool) {
			return json({ error: `Tool '${name}' not found` }, { status: 404 });
		}

		// Execute the tool
		console.log(`Executing tool: ${name} with input:`, input);
		const result = await tool.run(input as any);

		return json({
			toolUseId,
			name,
			input,
			content: result.text || JSON.stringify(result.response)
		});
	} catch (error) {
		console.error('Tool execution error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error occurred' },
			{ status: 500 }
		);
	}
}
