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
							controller.enqueue(new TextEncoder().encode(text));
						}
						// Handle other event types as needed
						if (chunk.messageStop) {
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
			'Content-Type': 'text/plain'
		}
	});
}
