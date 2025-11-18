<script lang="ts">
	import type { Agreement, Project } from '$lib/schema';
	import { allProjects } from '$lib/stores';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let { agreement }: { agreement: Agreement } = $props();

	let selectedProjectId = $state<number | null>(agreement.project_id || null);
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

	// Get the linked project details
	const linkedProject = $derived(
		selectedProjectId ? ($allProjects || []).find((p) => p.id === selectedProjectId) : null
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

			// Update the agreement object with the linked project
			agreement.project_id = selectedProjectId;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Validation failed';
		} finally {
			isValidating = false;
		}
	}

	function reset() {
		validationResult = '';
		error = '';
	}
</script>

<div class="space-y-4">
	{#if error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
			<i class="bi bi-exclamation-triangle-fill mr-2"></i>
			{error}
		</div>
	{/if}

	{#if linkedProject}
		<!-- Show linked project thumbnail -->
		<div class="space-y-4">
			<div class="rounded-lg border border-slate-200 bg-white p-4">
				<div class="mb-2 text-sm font-medium text-slate-600">Linked to Project:</div>
				<a
					target="_blank"
					href="/projects/{linkedProject.id}"
					class="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-slate-50"
				>
					<div class="flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-blue-600">
						<i class="bi bi-folder text-lg"></i>
					</div>
					<div class="flex-1">
						<div class="font-medium text-slate-900">{linkedProject.project_name}</div>
						<div class="text-xs text-slate-500">Click to view project</div>
					</div>
					<i class="bi bi-arrow-right text-slate-400"></i>
				</a>
			</div>
		</div>
	{/if}

	{#if linkedProject && !validationResult}
		<div class="flex justify-center">
			<button onclick={performValidation} disabled={isValidating} class="btn btn-primary">
				<i class="bi bi-check-circle mr-2"></i>
				Validate Against Project Estimate
			</button>
		</div>
	{:else if !isValidating && !validationResult}
		<!-- Show project selector -->
		<div class="space-y-4">
			<div>
				<label for="project-select" class="standard mb-2 block">
					Select Project to link and validate against
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
					Link Project and Validate
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
			<!-- Show linked project info after validation -->
			{#if linkedProject}
				<div class="rounded-lg border border-green-200 bg-green-50 p-3">
					<div class="flex items-center gap-2 text-sm text-green-700">
						<i class="bi bi-check-circle-fill"></i>
						<span>Linked to project:</span>
						<a href="/projects/{linkedProject.id}" class="font-medium underline hover:no-underline">
							{linkedProject.project_name}
						</a>
					</div>
				</div>
			{/if}

			<div class="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-6">
				<LLMOutput text={validationResult} />
			</div>

			<button onclick={reset} class="btn btn-outline w-full">
				<i class="bi bi-arrow-clockwise mr-2"></i>
				Run Validation Again
			</button>
		</div>
	{/if}
</div>
