<script lang="ts">
	import { cleanString } from '$lib/utils';
	import type { Project } from '$lib/schema';
	import ProjectCard from './ProjectCard.svelte';
	import { STAGES } from '$lib/schema'

	let { projects = [] }: { projects?: Project[] } = $props();

	console.log(projects)

	let stageFilter = $state<string>('all');

	const filteredProjects = $derived(
		stageFilter === 'all' ? projects : projects.filter((p) => STAGES[p.data.stages.filter(s => s.approved).length].name === stageFilter)
	);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-slate-800">Project Estimates</h2>
		<a href="/projects/new" class="btn btn-primary">
			<i class="bi bi-plus-lg"></i>
			New Project
		</a>
	</div>

	<div class="flex items-center space-x-3">
		<label for="stage-filter" class="text-sm font-medium text-slate-700">Filter by stage:</label>
		<select
			id="stage-filter"
			bind:value={stageFilter}
			class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
		>
			{#each [{name: 'all'}, ...STAGES] as stage (stage.name)}
				<option value={stage.name}>{cleanString(stage.name)}</option>
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
				{stageFilter === 'all' ? 'No projects yet.' : `No projects in ${cleanString(stageFilter)} stage.`}
			</p>
		</div>
	{:else}
		<div class="flex flex-wrap">
			{#each filteredProjects as project (project.id)}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</div>
