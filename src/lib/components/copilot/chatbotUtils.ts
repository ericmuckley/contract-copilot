import type { Message, ContentBlock } from '@aws-sdk/client-bedrock-runtime';

export interface ToolUse {
	toolUseId: string;
	name: string;
	input: string;
}

export interface StreamEvent {
	type: 'text' | 'tool_use_start' | 'tool_use_delta' | 'content_block_stop' | 'message_stop';
	text?: string;
	toolUseId?: string;
	name?: string;
	input?: string;
	stopReason?: string;
}

export interface InferenceState {
	streamingContent: string;
	toolUses: Map<string, ToolUse>;
	currentToolUseId: string | null;
	currentToolName: string | null;
	currentToolInput: string;
	stopReason: string | undefined;
}

export interface StreamCallbacks {
	onTextDelta: (text: string) => void;
	onToolStart: (name: string) => void;
	onToolComplete: () => void;
}

/**
 * Fetches a streaming response from the Bedrock API
 */
export async function fetchBedrockStream(
	messages: Message[],
	useTools: boolean,
	activeProjectId: number | null
): Promise<Response> {
	const response = await fetch('/api/bedrock', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			messages,
			useTools,
			activeProjectId
		})
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return response;
}

/**
 * Processes a stream chunk and updates the inference state
 */
export function processStreamEvent(
	event: StreamEvent,
	state: InferenceState,
	callbacks: StreamCallbacks
): void {
	switch (event.type) {
		case 'text':
			if (event.text) {
				state.streamingContent += event.text;
				callbacks.onTextDelta(event.text);
			}
			break;

		case 'tool_use_start':
			if (event.toolUseId && event.name) {
				state.currentToolUseId = event.toolUseId;
				state.currentToolName = event.name;
				state.currentToolInput = '';
				callbacks.onToolStart(event.name);
			}
			break;

		case 'tool_use_delta':
			if (event.input) {
				state.currentToolInput += event.input;
			}
			break;

		case 'content_block_stop':
			if (state.currentToolUseId && state.currentToolName) {
				state.toolUses.set(state.currentToolUseId, {
					toolUseId: state.currentToolUseId,
					name: state.currentToolName,
					input: state.currentToolInput
				});
				state.currentToolUseId = null;
				state.currentToolName = null;
				state.currentToolInput = '';
				callbacks.onToolComplete();
			}
			break;

		case 'message_stop':
			state.stopReason = event.stopReason;
			break;
	}
}

/**
 * Processes the streaming response from Bedrock
 */
export async function processStream(
	response: Response,
	callbacks: StreamCallbacks
): Promise<InferenceState> {
	const reader = response.body?.getReader();
	const decoder = new TextDecoder();

	const state: InferenceState = {
		streamingContent: '',
		toolUses: new Map(),
		currentToolUseId: null,
		currentToolName: null,
		currentToolInput: '',
		stopReason: undefined
	};

	if (!reader) {
		return state;
	}

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		const chunk = decoder.decode(value, { stream: true });
		const lines = chunk.split('\n').filter((line) => line.trim());

		for (const line of lines) {
			try {
				const event = JSON.parse(line) as StreamEvent;
				processStreamEvent(event, state, callbacks);
			} catch (parseError) {
				console.error('Failed to parse event:', line, parseError);
			}
		}
	}

	return state;
}

/**
 * Builds the assistant message content from inference results
 */
export function buildAssistantMessage(state: InferenceState): ContentBlock[] {
	const assistantContent: ContentBlock[] = [];

	if (state.streamingContent) {
		assistantContent.push({ text: state.streamingContent });
	}

	// Add tool use blocks
	for (const toolUse of state.toolUses.values()) {
		const parsedInput = JSON.parse(toolUse.input);
		assistantContent.push({
			toolUse: {
				toolUseId: toolUse.toolUseId,
				name: toolUse.name,
				input: parsedInput
			}
		});
	}

	return assistantContent;
}

/**
 * Executes a single tool call
 */
export async function executeToolCall(toolUse: ToolUse): Promise<ContentBlock> {
	try {
		const parsedInput = JSON.parse(toolUse.input);

		const response = await fetch('/api/tools', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				toolUseId: toolUse.toolUseId,
				name: toolUse.name,
				input: parsedInput
			})
		});

		if (!response.ok) {
			throw new Error(`Tool execution failed: ${response.status}`);
		}

		const result = await response.json();

		return {
			toolResult: {
				toolUseId: toolUse.toolUseId,
				content: [{ text: result.content }]
			}
		};
	} catch (error) {
		console.error(`Error executing tool ${toolUse.name}:`, error);
		return {
			toolResult: {
				toolUseId: toolUse.toolUseId,
				content: [
					{ text: `Error: ${error instanceof Error ? error.message : 'Tool execution failed'}` }
				],
				status: 'error'
			}
		};
	}
}

/**
 * Executes all tool calls and returns results as content blocks
 */
export async function executeToolCalls(toolUses: Map<string, ToolUse>): Promise<ContentBlock[]> {
	const toolResults: ContentBlock[] = [];

	for (const toolUse of toolUses.values()) {
		const result = await executeToolCall(toolUse);
		toolResults.push(result);
	}

	return toolResults;
}
