<script lang="ts">
	import type { Message, ContentBlock } from '@aws-sdk/client-bedrock-runtime';
	import LLMOutput from './LLMOutput.svelte';
	import Ping from '../Ping.svelte';
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
		{#if message.role === 'user' && (message.content ?? [{}])[0].text}
			{@const toolResults = getToolResults(message.content)}
			{#if toolResults.length > 0}
				<!-- Display tool results -->
				{#each toolResults as result}
					<div class="message flex justify-end">
						<div class="max-w-[80%] rounded-xl bg-sky-100 px-4 py-2 text-sm">
							<div class="font-semibold text-sky-800">🔧 Tool Result</div>
							<div class="standard mt-1 max-h-32 overflow-x-auto overflow-y-auto">
								{result.content}
							</div>
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
									<p class="space-x-1 font-bold">
										<i class="bi bi-check-lg text-green-600"></i>
										<span>{cleanString(tool.name)}</span>
									</p>
									<div class="standard mt-1 max-h-32 overflow-x-auto overflow-y-auto text-xs">
										Input: {JSON.stringify(tool.input)}
									</div>
									{#if tool.name.toLowerCase().includes('create')}
										<div class="mt-1 text-xs text-purple-800">
											<i class="bi bi-info-circle-fill"></i>
											This task may take up to 1 min to finish
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/each}

	{#if isStreaming}
		{#if streamingContent}
			<div class="flex justify-start">
				<div class="max-w-[80%]">
					<LLMOutput text={streamingContent} />
					{#if toolCallsInProgress.length > 0 && 0}
						<div class="mt-2 space-y-1">
							{#each toolCallsInProgress as toolName}
								<div class="rounded-lg bg-purple-100 px-3 py-2 text-sm">
									<p class="font-semibold">
										{cleanString(toolName)}
									</p>
									<div class="my-2 flex justify-center px-6">
										<Ping />
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="my-2 flex justify-center px-6">
							<Ping />
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="my-2 flex justify-center px-6">
				<Ping />
			</div>
		{/if}
	{/if}
</div>
