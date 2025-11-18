import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Message } from '@aws-sdk/client-bedrock-runtime';
import { streamInference } from '$lib/server/bedrockClient';
import { getAgreement } from '$lib/server/db';
import { getProject } from '$lib/server/db';
import { validateAgreementAlignmentPrompt } from '$lib/prompts';

// POST /api/agreements/[id]/validate-alignment - Validate agreement against project estimate
export async function POST({ params, request }: RequestEvent) {
	try {
		const agreementId = parseInt(params.id || '');
		if (isNaN(agreementId)) {
			return json({ error: 'Invalid agreement ID' }, { status: 400 });
		}

		const { projectId } = await request.json();
		if (!projectId) {
			return json({ error: 'Project ID is required' }, { status: 400 });
		}

		// Fetch the agreement
		const agreement = await getAgreement(agreementId);
		if (!agreement) {
			return json({ error: 'Agreement not found' }, { status: 404 });
		}

		// Fetch the project
		const project = await getProject(projectId);
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		// Get the estimate stage content
		const estimateStage = project.sdata?.find((stage) => stage.name === 'estimate');
		if (!estimateStage || !estimateStage.content) {
			return json({ error: 'Project estimate not found or empty' }, { status: 400 });
		}

		// Build the context: Include business case, requirements, architecture, and estimate
		const contextStages = ['architecture', 'estimate'];
		let fullEstimateContext = '';

		for (const stageName of contextStages) {
			const stage = project.sdata?.find((s) => s.name === stageName);
			if (stage && stage.content) {
				fullEstimateContext += `\n\n## ${stageName.toUpperCase()}\n\n${stage.content}`;
			}
		}

		// Generate the validation prompt
		const prompt = validateAgreementAlignmentPrompt(agreement.text_content, fullEstimateContext);

		// Create message for LLM
		const messages: Message[] = [
			{
				role: 'user',
				content: [{ text: prompt }]
			}
		];

		// Stream the LLM response
		const bedrockStream = await streamInference({
			messages,
			systemMessages: [
				{
					text: 'You are an expert contract and project scope analyst. Provide concise, detailed analysis to help identify alignment issues between contracts and project estimates.'
				}
			],
			useTools: false
		});

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
	} catch (error) {
		console.error('Error validating alignment:', error);
		return json({ error: 'Failed to validate alignment' }, { status: 500 });
	}
}
