<script lang="ts">
	import type { Project, ProjectStage } from '$lib/types/project';
	import ProjectCard from './ProjectCard.svelte';

	let { projects = [] }: { projects?: Project[] } = $props();

	let stageFilter = $state<ProjectStage | 'all'>('all');

	const stages: Array<{ value: ProjectStage | 'all'; label: string }> = [
		{ value: 'all', label: 'All Stages' },
		{ value: 'Artifacts', label: 'Artifacts' },
		{ value: 'BusinessCase', label: 'Business Case' },
		{ value: 'Requirements', label: 'Requirements' },
		{ value: 'SolutionArchitecture', label: 'Solution/Architecture' },
		{ value: 'EffortEstimate', label: 'Effort Estimate' },
		{ value: 'Quote', label: 'Quote' }
	];

	const filteredProjects = $derived(
		stageFilter === 'all' ? projects : projects.filter((p) => p.current_stage === stageFilter)
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
			{#each stages as stage (stage.value)}
				<option value={stage.value}>{stage.label}</option>
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
				{stageFilter === 'all' ? 'No projects yet.' : `No projects in ${stageFilter} stage.`}
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredProjects as project (project.id)}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</div>
