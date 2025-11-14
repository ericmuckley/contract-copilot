import type { RequestEvent } from '@sveltejs/kit';
import { streamInference } from './bedrockClient';
import type { LLMInferencePayload } from '$lib/types';

export async function POST({ request }: RequestEvent) {
	const payload: LLMInferencePayload = await request.json();

	const bedrockStream = await streamInference(payload);

	// Create a ReadableStream that processes the Bedrock response
	const stream = new ReadableStream({
		async start(controller) {
			try {
				if (bedrockStream) {
					for await (const chunk of bedrockStream) {
						// Handle content block delta (text chunks)
						if (chunk.contentBlockDelta?.delta?.text) {
							const text = chunk.contentBlockDelta.delta.text;
							controller.enqueue(
								new TextEncoder().encode(
									JSON.stringify({
										type: 'text',
										text
									}) + '\n'
								)
							);
						}

						// Handle tool use blocks
						if (chunk.contentBlockStart?.start?.toolUse) {
							const toolUse = chunk.contentBlockStart.start.toolUse;
							controller.enqueue(
								new TextEncoder().encode(
									JSON.stringify({
										type: 'tool_use_start',
										toolUseId: toolUse.toolUseId,
										name: toolUse.name
									}) + '\n'
								)
							);
						}

						// Handle tool input deltas
						if (chunk.contentBlockDelta?.delta?.toolUse) {
							const toolUseDelta = chunk.contentBlockDelta.delta.toolUse;
							controller.enqueue(
								new TextEncoder().encode(
									JSON.stringify({
										type: 'tool_use_delta',
										input: toolUseDelta.input
									}) + '\n'
								)
							);
						}

						// Handle tool use completion
						if (chunk.contentBlockStop) {
							controller.enqueue(
								new TextEncoder().encode(
									JSON.stringify({
										type: 'content_block_stop'
									}) + '\n'
								)
							);
						}

						// Handle message stop
						if (chunk.messageStop) {
							controller.enqueue(
								new TextEncoder().encode(
									JSON.stringify({
										type: 'message_stop',
										stopReason: chunk.messageStop.stopReason
									}) + '\n'
								)
							);
							break;
						}
					}
				}
				controller.close();
			} catch (error) {
				console.error('Streaming error:', error);
				controller.error(error);
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/x-ndjson'
		}
	});
}
