<script lang="ts">
	import type { Agreement, Project } from '$lib/schema';
	import { allProjects } from '$lib/stores';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let { agreement }: { agreement: Agreement } = $props();

	let selectedProjectId = $state<number | null>(null);
	let isValidating = $state(false);
	let validationResult = $state('');
	let error = $state('');

	// Filter projects to only those that have estimate content
	const projectsWithEstimates = $derived(
		($allProjects || []).filter((project: Project) => {
			const estimateStage = project.sdata?.find((stage) => stage.name === 'estimate');
			return estimateStage && estimateStage.content && estimateStage.content.trim().length > 0;
		})
	);

	async function performValidation() {
		if (!selectedProjectId) {
			error = 'Please select a project';
			return;
		}

		isValidating = true;
		validationResult = '';
		error = '';

		try {
			const response = await fetch(`/api/agreements/${agreement.id}/validate-alignment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectId: selectedProjectId })
			});

			if (!response.ok) {
				throw new Error('Failed to validate alignment');
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
							validationResult += data.text;
						}
					} catch {
						console.error('Failed to parse line:', line);
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Validation failed';
		} finally {
			isValidating = false;
		}
	}

	function reset() {
		validationResult = '';
		error = '';
		selectedProjectId = null;
	}
</script>

<div class="space-y-4">
	{#if error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
			<i class="bi bi-exclamation-triangle-fill mr-2"></i>
			{error}
		</div>
	{/if}

	{#if !isValidating && !validationResult}
		<div class="space-y-4">
			<div>
				<label for="project-select" class="standard mb-2 block">
					Select Project to validate against
				</label>
				{#if projectsWithEstimates.length === 0}
					<p class="text-sm text-slate-500">
						No projects with estimates available. Create a project with an estimate first.
					</p>
				{:else}
					<select id="project-select" bind:value={selectedProjectId} class="text-input w-min">
						<option value={null}>-- Select a project --</option>
						{#each projectsWithEstimates as project}
							<option value={project.id}>
								{project.project_name}
							</option>
						{/each}
					</select>
				{/if}
			</div>

			{#if projectsWithEstimates.length > 0}
				<button
					onclick={performValidation}
					disabled={!selectedProjectId || isValidating}
					class="btn btn-primary w-full"
				>
					<i class="bi bi-check-circle mr-2"></i>
					Perform Validation
				</button>
			{/if}
		</div>
	{/if}

	{#if isValidating}
		<div class="flex justify-center py-8">
			<Spinner />
		</div>

		{#if validationResult}
			<div class="mt-4 overflow-x-auto">
				<LLMOutput text={validationResult} />
			</div>
		{/if}
	{/if}

	{#if validationResult && !isValidating}
		<div class="space-y-4">
			<div class="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-6">
				<LLMOutput text={validationResult} />
			</div>

			<button onclick={reset} class="btn btn-outline w-full">
				<i class="bi bi-arrow-clockwise mr-2"></i>
				Validate Against Different Project
			</button>
		</div>
	{/if}
</div>
