<script lang="ts">
	import type { Message, ContentBlock } from '@aws-sdk/client-bedrock-runtime';
	import LLMOutput from './LLMOutput.svelte';
	import Ping from './Ping.svelte';

	let {
		messages = [],
		streamingContent = '',
		isStreaming = false
	}: {
		messages: Message[];
		streamingContent?: string;
		isStreaming?: boolean;
	} = $props();

	function getMessageText(content: ContentBlock[] | undefined): string {
		if (!content || content.length === 0) return '';
		return content
			.map((block) => {
				if ('text' in block && block.text) return block.text;
				return '';
			})
			.join('');
	}
</script>

<div class="space-y-2">
	{#each messages as message, i (i)}
		{#if message.role === 'user'}
			<div class="message flex justify-end">
				<p class="max-w-[80%] rounded-xl bg-slate-200 px-4 py-2">
					{getMessageText(message.content)}
				</p>
			</div>
		{:else}
			<div class="flex justify-start">
				<div class="max-w-[80%]">
					<LLMOutput text={getMessageText(message.content)} />
				</div>
			</div>
		{/if}
	{/each}

	{#if isStreaming}
		<div class="flex justify-start">
			<div class="max-w-[80%]">
				<LLMOutput text={streamingContent} />
				<Ping />
			</div>
		</div>
	{/if}
</div>
