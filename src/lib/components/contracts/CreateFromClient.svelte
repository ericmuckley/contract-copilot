<script lang="ts">
	import { extractAgreementMetadataPrompt } from '$lib/prompts';
	import { saveNewAgreement, safeJsonParse } from '$lib/utils';
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

	let fileInput: HTMLInputElement;
	let uploadedFiles = $state<File[]>([]);
	let counterparty = $state('');
	let agreementName = $state<string>('');
	let agreementType = $state<string>('SOW');
	let isProcessing = $state<boolean>(false);
	let text_content = $state<string>('');
	let isSaving = $state<boolean>(false);
	let error = $state<string>('');
	let metadataExtracted = $state<boolean>(false);

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			uploadedFiles = Array.from(target.files);
		}
	}

	const handleProcessFile = async () => {
		if (uploadedFiles.length === 0) {
			error = 'Please select a file first';
			return;
		}

		isProcessing = true;
		error = '';
		metadataExtracted = false;

		try {
			// Extract text content from file using file-extractor endpoint
			const file = uploadedFiles[0];
			const formData = new FormData();
			formData.append('file', file);

			const extractResponse = await fetch('/api/file-extractor', {
				method: 'POST',
				body: formData
			});

			if (!extractResponse.ok) {
				const errorData = await extractResponse.json();
				throw new Error(errorData.error || 'Failed to extract text from file');
			}

			const { text_content: extractedContent } = await extractResponse.json();
			text_content = extractedContent;

			if (!text_content.trim()) {
				throw new Error('File is empty or could not be read');
			}

			// Extract metadata using LLM
			const messages: Message[] = [
				{
					role: 'user',
					content: [{ text: extractAgreementMetadataPrompt(text_content) }]
				}
			];

			const response = await fetch(`/api/bedrock`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages,
					useTools: false
				})
			});

			if (!response.ok) {
				throw new Error('Failed to extract metadata from contract');
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let buffer = '';
			let llmResponse = '';

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
							llmResponse += data.text;
						}
					} catch {
						console.error('Failed to parse line:', line);
					}
				}
			}

			// Parse JSON response from LLM using safeJsonParse
			const metadata = safeJsonParse(llmResponse, {});

			if (!metadata.agreement_name || !metadata.counterparty || !metadata.agreement_type) {
				throw new Error('Could not extract required metadata from contract');
			}

			// Validate agreement_type
			if (!AGREEMENT_TYPES.includes(metadata.agreement_type)) {
				metadata.agreement_type = 'OTHER';
			}

			agreementName = metadata.agreement_name || '';
			counterparty = metadata.counterparty || '';
			agreementType = metadata.agreement_type || 'OTHER';
			metadataExtracted = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to process file';
			console.error('Processing error:', err);
		} finally {
			isProcessing = false;
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
		isSaving = false;
	};
</script>

<div class="space-y-4">
	<div>
		<label for="file-upload" class="mb-1 block text-sm text-slate-700">
			Upload File from Client <span class="text-red-500">*</span>
		</label>
		<input
			id="file-upload"
			type="file"
			accept=".txt,.md,.json,.pdf,.docx"
			onchange={handleFileChange}
			bind:this={fileInput}
			class="hidden"
		/>
		<button
			type="button"
			onclick={() => fileInput.click()}
			class="btn btn-outline flex w-full items-center justify-center gap-2"
			disabled={isProcessing || metadataExtracted}
		>
			<i class="bi bi-cloud-upload"></i>
			Choose File
		</button>
		{#if uploadedFiles.length > 0}
			<p class="mt-2 text-sm text-slate-600">
				Selected: {uploadedFiles[0].name}
			</p>
		{/if}
	</div>

	{#if uploadedFiles.length > 0 && !metadataExtracted && !isProcessing}
		<div class="flex justify-end">
			<button onclick={handleProcessFile} class="btn btn-primary" disabled={isProcessing}>
				<i class="bi bi-file-earmark-text mr-2"></i>
				Process File
			</button>
		</div>
	{/if}

	{#if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-700">
			<i class="bi bi-exclamation-triangle mr-2"></i>
			{error}
		</div>
	{/if}

	{#if isProcessing}
		<div class="my-8 flex flex-col items-center gap-4">
			<Ping />
			<p class="text-sm text-slate-600">Processing contract and extracting metadata...</p>
		</div>
	{/if}

	{#if metadataExtracted}
		<div class="mt-8 space-y-4">
			<div>
				<label for="agreement-type-client" class="mb-1 block text-sm text-slate-700">
					Agreement Type <span class="text-red-500">*</span>
				</label>
				<select id="agreement-type-client" bind:value={agreementType} class="w-full">
					{#each AGREEMENT_TYPES as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="agreement-name" class="mb-1 block text-sm text-slate-700">
					Agreement Name <span class="text-red-500">*</span>
				</label>
				<input
					id="agreement-name"
					type="text"
					bind:value={agreementName}
					placeholder="Enter agreement name..."
					class="text-input w-full"
				/>
			</div>

			<div>
				<label for="counterparty-client" class="mb-1 block text-sm text-slate-700">
					Counterparty <span class="text-red-500">*</span>
				</label>
				<input
					id="counterparty-client"
					type="text"
					bind:value={counterparty}
					placeholder="Enter counterparty name..."
					required
					class="text-input w-full"
				/>
			</div>

			<div>
				<label for="text-content" class="mb-1 block text-sm text-slate-700">
					Contract Content <span class="text-red-500">*</span>
				</label>
				<textarea
					id="text-content"
					bind:value={text_content}
					rows="20"
					class="w-full rounded-lg border border-slate-300 p-4 font-mono text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
					placeholder="Contract content..."
				></textarea>
			</div>

			<div class="flex space-x-2">
				<button
					onclick={handleSave}
					disabled={isSaving ||
						!agreementName.trim() ||
						!counterparty.trim() ||
						!text_content.trim()}
					class="btn btn-primary"
				>
					{#if isSaving}
						<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
						Saving...
					{:else}
						<i class="bi bi-check-lg mr-2"></i>
						Save Agreement
					{/if}
				</button>
				<a href="/" class="btn btn-outline"> Cancel </a>
			</div>
		</div>
	{/if}
</div>
