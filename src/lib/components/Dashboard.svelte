<script lang="ts">
	import type { Project } from '$lib/schema';

	import ProjectList from '$lib/components/projects/ProjectList.svelte';
	import ProjectListHeading from '$lib/components/projects/ProjectListHeading.svelte';
	import ContractListHeading from './contracts/ContractListHeading.svelte';

	let { projects = [] }: { projects?: Project[] } = $props();
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
	<div class="card">

		<div class="mb-8">
			<ProjectListHeading projects={projects} />
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
