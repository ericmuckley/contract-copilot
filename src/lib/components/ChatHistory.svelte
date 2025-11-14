<script lang="ts">
	import type { Message, ContentBlock } from '@aws-sdk/client-bedrock-runtime';
	import LLMOutput from './LLMOutput.svelte';
	import Ping from './Ping.svelte';
	import { cleanString } from '$lib/utils';

	let {
		messages = [],
		streamingContent = '',
		isStreaming = false,
		toolCallsInProgress = []
	}: {
		messages: Message[];
		streamingContent?: string;
		isStreaming?: boolean;
		toolCallsInProgress?: string[];
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

	function getToolUseCalls(
		content: ContentBlock[] | undefined
	): Array<{ name: string; input: any }> {
		if (!content || content.length === 0) return [];
		return content
			.filter((block) => 'toolUse' in block && block.toolUse)
			.map((block) => {
				if ('toolUse' in block && block.toolUse) {
					return {
						name: block.toolUse.name || '',
						input: block.toolUse.input
					};
				}
				return { name: '', input: {} };
			})
			.filter((tool) => tool.name);
	}

	function getToolResults(
		content: ContentBlock[] | undefined
	): Array<{ toolUseId: string; content: string }> {
		if (!content || content.length === 0) return [];
		return content
			.filter((block) => 'toolResult' in block && block.toolResult)
			.map((block) => {
				if ('toolResult' in block && block.toolResult) {
					const resultContent = block.toolResult.content?.[0];
					const text = resultContent && 'text' in resultContent ? resultContent.text : '';
					return {
						toolUseId: block.toolResult.toolUseId || '',
						content: text || ''
					};
				}
				return { toolUseId: '', content: '' };
			})
			.filter((result) => result.toolUseId);
	}
</script>

<div class="space-y-2">
	{#each messages as message, i (i)}
		{#if message.role === 'user'}
			{@const toolResults = getToolResults(message.content)}
			{#if toolResults.length > 0}
				<!-- Display tool results -->
				{#each toolResults as result}
					<div class="message flex justify-end">
						<div class="max-w-[80%] rounded-xl bg-sky-100 px-4 py-2 text-sm">
							<div class="font-semibold text-sky-800">🔧 Tool Result</div>
							<div class="mt-1 text-gray-700">{result.content}</div>
						</div>
					</div>
				{/each}
			{:else}
				<!-- Display regular user message -->
				<div class="message flex justify-end">
					<p class="max-w-[80%] rounded-xl bg-slate-200 px-4 py-2">
						{getMessageText(message.content)}
					</p>
				</div>
			{/if}
		{:else}
			<!-- Assistant message -->
			{@const messageText = getMessageText(message.content)}
			{@const toolCalls = getToolUseCalls(message.content)}

			<div class="flex justify-start">
				<div class="max-w-[80%]">
					{#if messageText}
						<LLMOutput text={messageText} />
					{/if}

					{#if toolCalls.length > 0}
						<div class="mt-2 space-y-1">
							{#each toolCalls as tool}
								<div class="rounded-lg bg-purple-100 px-3 py-2 text-sm">
									<p class="font-semibold">
										{cleanString(tool.name)}
									</p>
									<div class="mt-1 text-xs text-gray-600">
										Input: {JSON.stringify(tool.input)}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/each}

	{#if isStreaming}
		<div class="flex justify-start">
			<div class="max-w-[80%]">
				{#if streamingContent}
					<LLMOutput text={streamingContent} />
				{/if}

				{#if toolCallsInProgress.length > 0}
					<div class="mt-2 space-y-1">
						{#each toolCallsInProgress as toolName}
							<div class="rounded-lg bg-purple-100 px-3 py-2 text-sm">
								<p class="font-semibold">
									{cleanString(toolName)}
								</p>
								<Ping />
							</div>
						{/each}
					</div>
				{:else}
					<Ping />
				{/if}
			</div>
		</div>
	{/if}
</div>
