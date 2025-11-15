<script lang="ts">
	import type { Project } from '$lib/types/project';
	import ProjectList from '$lib/components/projects/ProjectList.svelte';

	let { projects = [] }: { projects?: Project[] } = $props();
</script>

<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
	<div class="card border border-slate-200">
		<ProjectList {projects} />
	</div>
	<div class="card border border-slate-200">
		<h1>Placeholder for Contracts</h1>
		<p>Coming soon</p>
	</div>
</div>
