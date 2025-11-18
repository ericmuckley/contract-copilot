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

	const lastUpdated = $derived(() => {
		let latestDate: Date | null = null;

		for (const project of projects) {
			for (const stage of project.sdata) {
				if (stage.updated_at) {
					const date = new Date(stage.updated_at);
					if (!latestDate || date > latestDate) {
						latestDate = date;
					}
				}
			}
		}

		return latestDate;
	});
</script>

<div class="mt-4 mb-8">
	<a href="/projects/new" class="btn btn-primary hover:bg-sky-700!">
		<i class="bi bi-plus-lg"></i>
		New Project
	</a>
</div>

<div>
	{#if lastUpdated()}
		<div class="standard mb-2 text-sm">
			<span>Last project update:</span>
			{lastUpdated()?.toLocaleString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			})}
		</div>
	{/if}

	<div class="mb-6 flex items-center space-x-3">
		<select id="stage-filter" bind:value={stageFilter}>
			{#each [{ name: 'all', label: 'All' }, ...STAGES] as stage (stage.name)}
				<option value={stage.name}>{cleanString(stage.label)}</option>
			{/each}
		</select>
		<span class="standard text-sm">
			{filteredProjects.length}/{projects.length} project{projects.length !== 1 ? 's' : ''}
		</span>
	</div>

	{#if filteredProjects.length === 0}
		<div class="py-24 text-center">
			<div class="muted mb-4 text-4xl">
				<i class="bi bi-folder-x"></i>
			</div>
			<p class="standard">
				{stageFilter === 'all'
					? 'No projects yet.'
					: `No projects in ${cleanString(stageFilter)} stage.`}
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredProjects as project (project.id)}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</div>
