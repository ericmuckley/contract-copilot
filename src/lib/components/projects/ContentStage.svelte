<script lang="ts">
	import { marked } from 'marked';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import Spinner from '../Spinner.svelte';
	import { STAGES } from '$lib/schema';

	let {
		projectId,
		stageIndex,
		content = null,
		onRefresh
	}: {
		projectId: number;
		stageIndex: number;
		content?: string | null;
		onRefresh: () => void;
	} = $props();

	const stage = STAGES[stageIndex];

	let isEditing = $state(false);
	let editedContent = $state(content || '');
	let isGenerating = $state(false);
	let isSaving = $state(false);
	let error = $state('');
	let generatedContent = $state('');

	const stageInfo: Record<string, { description: string }> = {
		business_case: {
			description:
				'Generate a comprehensive business case including scope, outcomes, constraints, and risks.'
		},
		requirements: {
			description:
				'Generate detailed functional and non-functional requirements based on the business case.'
		},
		architecture: {
			description:
				'Document the technical approach, architecture, tech stack, and risk mitigation strategies.'
		}
	};

	const info = $derived(stageInfo[stage.name]);

	async function generateContent() {
		isGenerating = true;
		generatedContent = '';
		error = '';
		content = null;

		try {
			const response = await fetch(`/api/projects/${projectId}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stage: stage.name })
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
							generatedContent += data.text;
						}
					} catch {
						console.error('Failed to parse line:', line);
					}
				}
			}

			editedContent = generatedContent;
			isEditing = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Generation failed';
		} finally {
			isGenerating = false;
		}
	}

	async function saveContent() {
		isSaving = true;
		error = '';

		try {
			const response = await fetch(`/api/projects/${projectId}/stage-content`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					stageIndex,
					content: editedContent
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save content');
			}

			isEditing = false;
			onRefresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Save failed';
		} finally {
			isSaving = false;
		}
	}

	function startEditing() {
		editedContent = content || '';
		isEditing = true;
	}

	function cancelEditing() {
		editedContent = content || '';
		isEditing = false;
		error = '';
	}
</script>

<div class="space-y-4">
	<div class="card bg-white">
		<h1 class="mb-4">{stage.label}</h1>
		<p class="mb-4 text-sm text-slate-600">{info.description}</p>

		{#if error}
			<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<i class="bi bi-exclamation-triangle-fill mr-2"></i>
				{error}
			</div>
		{/if}

		{#if isGenerating}
			<div class="mb-2 flex justify-center">
				<Spinner />
			</div>

			{#if generatedContent}
				<div class="mt-8 overflow-x-auto">
					<LLMOutput text={generatedContent} />
				</div>
			{/if}
		{:else if !content && !isEditing}
			<button onclick={generateContent} disabled={isGenerating} class="btn btn-primary">
				<i class="bi bi-stars mr-2"></i>
				Generate {stage.label}
			</button>
		{/if}

		{#if content && !isEditing}
			<div class="mb-4 max-h-96 overflow-y-auto rounded-xl border border-slate-200 px-6 py-4">
				<LLMOutput text={content} />
			</div>

			<div class="flex space-x-2">
				<button
					onclick={startEditing}
					class="btn flex w-full justify-center bg-slate-500 text-white hover:bg-slate-600"
				>
					<i class="bi bi-pencil mr-2"></i>
					<span>Edit</span>
				</button>
				<button
					onclick={generateContent}
					disabled={isGenerating}
					class="btn btn-primary flex w-full justify-center space-x-1 whitespace-nowrap"
				>
					<i class="bi bi-arrow-clockwise mr-2"></i>
					<span>Regenerate</span>
				</button>
			</div>
		{/if}

		{#if isEditing}
			<div class="space-y-4">
				<textarea
					bind:value={editedContent}
					rows="20"
					class="w-full rounded-lg border border-slate-300 p-4 font-mono text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
					placeholder="Enter content in Markdown format..."
				></textarea>
				<div class="flex space-x-2">
					<button onclick={saveContent} disabled={isSaving} class="btn btn-primary">
						{#if isSaving}
							<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
							Saving...
						{:else}
							<i class="bi bi-check-lg mr-2"></i>
							Save
						{/if}
					</button>
					<button onclick={cancelEditing} disabled={isSaving} class="btn bg-slate-500 text-white">
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
