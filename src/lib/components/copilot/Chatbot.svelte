<script lang="ts">
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import type { Message } from '@aws-sdk/client-bedrock-runtime';
	import ChatInput from './ChatInput.svelte';
	import ChatHistory from './ChatHistory.svelte';
	import {
		fetchBedrockStream,
		processStream,
		buildAssistantMessage,
		executeToolCalls
	} from './chatbotUtils';
	import { activeProjectId, chatMessages } from '$lib/stores';

	let messages: Message[] = $state([]);
	let chatInputValue = $state('');
	let streamingContent = $state('');
	let isStreaming = $state(false);
	let toolCallsInProgress: string[] = $state([]);

	let { useTools = true }: { useTools?: boolean } = $props();

	// Load messages from store on mount only
	onMount(() => {
		const stored = get(chatMessages);
		if (stored && stored.length > 0) {
			messages = stored;
		}
	});

	// Update store whenever messages change (but not during initial load)
	$effect(() => {
		if (messages.length > 0) {
			chatMessages.set(messages);
		}
	});

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

	const resetChat = () => {
		messages = [];
		chatMessages.set([]);
	};

	const runInferenceLoop = async () => {
		let continueLoop = true;

		while (continueLoop) {
			isStreaming = true;
			streamingContent = '';

			try {
				// Fetch streaming response from Bedrock
				const response = await fetchBedrockStream(messages, useTools, $activeProjectId);

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
					const toolResults = await executeToolCalls(state.toolUses);
					toolCallsInProgress = [];

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

<div class="flex h-full flex-col overflow-hidden">
	<!-- Scrollable chat messages area -->
	<div class="min-h-0 flex-1 overflow-y-auto px-4 py-2">
		{#if messages.length}
			<div in:slide>
				<ChatHistory {messages} {streamingContent} {isStreaming} {toolCallsInProgress} />
			</div>
		{:else}
			<div class="py-24 text-center">
				<div class="text-9xl text-slate-400">
					<i class="bi bi-chat-dots"></i>
				</div>
				<div class="mt-4 text-slate-400">Ask about your project estimates or contracts</div>
			</div>
		{/if}
	</div>

	<!-- Fixed bottom input area -->
	<div class="shrink-0 border-t border-gray-200 bg-white px-2">
		{#if 1 || !isStreaming}
			<div class="px-2 pt-2">
				<ChatInput bind:chatInputValue {handleSubmit} />
			</div>
		{/if}

		{#if messages.length > 0 && !isStreaming}
			<div class="px-2 pt-1 pb-1 text-center">
				<button onclick={resetChat} class="link text-xs"> Reset chat </button>
			</div>
		{/if}
	</div>
</div>
