<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Message } from '@aws-sdk/client-bedrock-runtime';
	import ChatInput from './ChatInput.svelte';
	import ChatHistory from './ChatHistory.svelte';
	import {
		fetchBedrockStream,
		processStream,
		buildAssistantMessage,
		executeToolCalls
	} from './chatbotUtils';

	let messages: Message[] = $state([]);
	let chatInputValue = $state('');
	let streamingContent = $state('');
	let isStreaming = $state(false);
	let toolCallsInProgress: string[] = $state([]);

	let { useTools = true, activeProjectId }: { useTools?: boolean; activeProjectId?: number } =
		$props();

	const handleSubmit = async () => {
		if (!chatInputValue.trim()) return;

		// Add user message to chat history
		const userMessage: Message = {
			role: 'user',
			content: [{ text: chatInputValue }]
		};
		messages = [...messages, userMessage];

		chatInputValue = ''; // Clear input

		// Start the inference loop (may need multiple rounds for tool calling)
		await runInferenceLoop();
	};

	const runInferenceLoop = async () => {
		let continueLoop = true;

		while (continueLoop) {
			isStreaming = true;
			streamingContent = '';

			try {
				// Fetch streaming response from Bedrock
				const response = await fetchBedrockStream(messages, useTools);

				// Process the stream with callbacks for UI updates
				const state = await processStream(response, {
					onTextDelta: (text) => {
						streamingContent += text;
					},
					onToolStart: (name) => {
						toolCallsInProgress = [...toolCallsInProgress, name];
					},
					onToolComplete: () => {
						// Tool tracking handled by state
					}
				});

				// Build assistant message from stream results
				const assistantContent = buildAssistantMessage(state);

				// Add assistant message to history
				if (assistantContent.length > 0) {
					const assistantMessage: Message = {
						role: 'assistant',
						content: assistantContent
					};
					messages = [...messages, assistantMessage];
				}

				streamingContent = '';

				// If there are tool calls, execute them and continue the loop
				if (state.toolUses.size > 0) {
					const { toolResults, updateRequired } = await executeToolCalls(state.toolUses, {
						activeProjectId
					});
					toolCallsInProgress = [];

					// If the tool call requires a UI update, dispatch an event
					if (updateRequired) {
						window.dispatchEvent(new CustomEvent('project-updated'));
					}

					// Add tool results as a user message (required by Bedrock API)
					if (toolResults.length > 0) {
						const toolResultMessage: Message = {
							role: 'user',
							content: toolResults
						};
						messages = [...messages, toolResultMessage];
					}

					continueLoop = true; // Continue to get the final response
				} else {
					continueLoop = false; // No more tool calls, we're done
				}
			} catch (error) {
				console.error('Streaming error:', error);
				// Add error message to chat
				const errorMessage: Message = {
					role: 'assistant',
					content: [
						{
							text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
						}
					]
				};
				messages = [...messages, errorMessage];
				continueLoop = false;
			} finally {
				isStreaming = false;
			}
		}
	};
</script>

<div class="flex h-full flex-col">
	{#if messages.length}
		<div class="min-h-0 flex-1 overflow-y-auto pr-3 pl-2">
			<div in:slide>
				<ChatHistory {messages} {streamingContent} {isStreaming} {toolCallsInProgress} />
			</div>
		</div>
	{:else}
		<div class="flex-1"></div>
	{/if}

	{#if 1 || !isStreaming}
		<div class="mt-2 px-2">
			<ChatInput bind:chatInputValue {handleSubmit} />
		</div>
	{/if}
</div>
