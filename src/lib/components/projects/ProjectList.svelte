<script lang="ts">
	import { cleanString } from '$lib/utils';
	import type { Project } from '$lib/schema';
	import ProjectCard from './ProjectCard.svelte';
	import { STAGES } from '$lib/schema';

	let { projects = [] }: { projects?: Project[] } = $props();

	let stageFilter = $state<string>('all');

	const filteredProjects = $derived(
		stageFilter === 'all'
			? projects
			: projects.filter((p) => {
					const stageIdx = p.sdata.filter((s) => s.approved).length;
					return STAGES[stageIdx].name === stageFilter;
				})
	);
</script>

<div class="space-y-4">
	<div class="flex items-center space-x-3">
		<label for="stage-filter" class="text-sm font-medium text-slate-700">Filter by stage:</label>
		<select id="stage-filter" bind:value={stageFilter}>
			{#each [{ name: 'all', label: 'All' }, ...STAGES] as stage (stage.name)}
				<option value={stage.name}>{cleanString(stage.label)}</option>
			{/each}
		</select>
		<span class="text-sm text-slate-500">
			{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
		</span>
	</div>

	{#if filteredProjects.length === 0}
		<div class="py-24 text-center">
			<div class="mb-4 text-4xl text-slate-300">
				<i class="bi bi-folder-x"></i>
			</div>
			<p class="text-slate-600">
				{stageFilter === 'all'
					? 'No projects yet.'
					: `No projects in ${cleanString(stageFilter)} stage.`}
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredProjects as project (project.id)}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</div>
