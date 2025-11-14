<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Message } from '@aws-sdk/client-bedrock-runtime';
	import ChatInput from './ChatInput.svelte';
	import ChatHistory from './ChatHistory.svelte';

	let messages: Message[] = $state([]);
	let chatInputValue = $state('');
	let streamingContent = $state('');
	let isStreaming = $state(false);

	const handleSubmit = async () => {
		if (!chatInputValue.trim()) return;

		// Add user message to chat history
		const userMessage: Message = {
			role: 'user',
			content: [{ text: chatInputValue }]
		};
		messages = [...messages, userMessage];

		const userInput = chatInputValue;
		chatInputValue = ''; // Clear input

		// Start streaming
		isStreaming = true;
		streamingContent = '';

		try {
			const response = await fetch('/bedrock', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: messages
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					streamingContent += chunk;
				}
			}

			// Add assistant message to chat history
			const assistantMessage: Message = {
				role: 'assistant',
				content: [{ text: streamingContent }]
			};
			messages = [...messages, assistantMessage];
			streamingContent = '';
		} catch (error) {
			console.error('Streaming error:', error);
			// Add error message to chat
			const errorMessage: Message = {
				role: 'assistant',
				content: [
					{ text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}` }
				]
			};
			messages = [...messages, errorMessage];
		} finally {
			isStreaming = false;
		}
	};
</script>

{#if messages.length}
	<div class="mb-4" in:slide>
		<ChatHistory {messages} {streamingContent} {isStreaming} />
	</div>
{/if}
<ChatInput bind:chatInputValue {handleSubmit} />
