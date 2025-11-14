<script lang="ts">
	import type { Project } from '$lib/types/project';
	import ProjectList from '$lib/components/projects/ProjectList.svelte';

	let { projects = [] }: { projects?: Project[] } = $props();
</script>

<ProjectList {projects} />
