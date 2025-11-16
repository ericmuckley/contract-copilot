<script lang="ts">
	import { onMount } from 'svelte';
	import type { Project } from '$lib/schema';
	import ProjectList from '$lib/components/projects/ProjectList.svelte';
	import ProjectListHeading from '$lib/components/projects/ProjectListHeading.svelte';
	import ContractListHeading from './contracts/ContractListHeading.svelte';
	import { activeProjectId } from '$lib/stores';

	let { projects = [] }: { projects?: Project[] } = $props();

	onMount(() => {
		activeProjectId.set(null);
	});
</script>

<div class="space-y-4">
	<div class="card">
		<div class="mb-4">
			<ProjectListHeading {projects} />
		</div>

		<ProjectList {projects} />
	</div>
	<div class="card">
		<div class="mb-8">
			<ContractListHeading contracts={[]} />
		</div>

		<p>Coming soon</p>
	</div>
</div>
