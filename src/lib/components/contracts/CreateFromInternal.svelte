<script lang="ts">
	import { createInternalContractPrompt } from '$lib/prompts';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import { saveNewAgreement } from '$lib/utils';
	import { AGREEMENT_TYPES } from '$lib/schema';
	import Ping from '../Ping.svelte';
	import type { Message } from '@aws-sdk/client-bedrock-runtime';
	import { goto } from '$app/navigation';
	let {
		origin,
		createdBy
	}: {
		origin: 'client' | 'internal';
		createdBy: string;
	} = $props();

	let counterparty = $state('');
	let agreementName = $state<string>('');
	let agreementType = $state<string>('SOW');
	let isGenerating = $state<boolean>(false);
	let text_content = $state<string>('');
	let isSaving = $state<boolean>(false);
	let error = $state<string>('');

	const handleGenerateContent = async () => {
		isGenerating = true;
		text_content = '';
		error = '';

		const messages: Message[] = [
			{
				role: 'user',
				content: [
					{ text: await createInternalContractPrompt(agreementName, agreementType, counterparty) }
				]
			}
		];

		try {
			const response = await fetch(`/api/bedrock`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages,
					useTools: false
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate content');
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const data = JSON.parse(line);
						if (data.type === 'text') {
							text_content += data.text;
						}
					} catch {
						console.error('Failed to parse line:', line);
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Generation failed';
		} finally {
			isGenerating = false;
		}
	};

	const handleSave = async () => {
		isSaving = true;
		const newAgreement = await saveNewAgreement({
			origin,
			created_by: createdBy,
			agreement_name: agreementName,
			agreement_type: agreementType,
			counterparty,
			text_content
		});
		if (newAgreement) {
			await goto(`/contracts/${newAgreement.root_id}`);
		}
	};
</script>

<div>
	<label for="agreement-type-internal" class="standard mb-1 block text-sm">
		Agreement Type <span class="text-red-500">*</span>
	</label>
	<select id="agreement-type-internal" bind:value={agreementType} class="w-full">
		{#each AGREEMENT_TYPES as type}
			<option value={type}>{type}</option>
		{/each}
	</select>
</div>

<div class="mt-8 space-y-1">
	<label for="approver-name" class="standard block text-sm">
		Agreement Name <span class="text-red-500">*</span>
	</label>
	<input
		id="approver-name"
		type="text"
		bind:value={agreementName}
		placeholder={`Enter agreement name...`}
		class="text-input w-full"
	/>
</div>

<div class="mt-8">
	<label for="counterparty" class="standard mb-1 block text-sm">
		Counterparty <span class="text-red-500">*</span>
	</label>
	<input
		id="counterparty"
		type="text"
		bind:value={counterparty}
		placeholder="Enter counterparty name..."
		required
		class="text-input"
	/>
</div>

{#if isGenerating}
	<div class="my-4 flex justify-center">
		<Ping />
	</div>
	<div>
		<div class="mt-8 overflow-x-auto">
			<LLMOutput text={text_content} />
		</div>
	</div>
{:else if text_content.length}
	<div class="mt-8 space-y-4">
		<textarea
			bind:value={text_content}
			rows="20"
			class="w-full rounded-lg border border-slate-300 p-4 font-mono text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
			placeholder="Enter content in Markdown format..."
		></textarea>
		<div class="flex space-x-2">
			<button onclick={handleSave} disabled={isSaving} class="btn btn-primary">
				{#if isSaving}
					<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
					Saving...
				{:else}
					<i class="bi bi-check-lg mr-2"></i>
					Save
				{/if}
			</button>
			<a href="/" class="btn btn-outline"> Cancel </a>
		</div>
	</div>
{:else}
	<div class="mt-16 flex justify-end gap-4">
		<a href="/" class="btn btn-outline">Cancel</a>
		<button
			class="btn btn-primary"
			onclick={handleGenerateContent}
			disabled={createdBy.trim() === '' ||
				!origin ||
				!agreementType?.trim()?.length ||
				agreementName.trim() === '' ||
				counterparty.trim() === ''}
		>
			Generate Agreement
		</button>
	</div>
{/if}
