<script lang="ts">
	import { onMount } from 'svelte';
	import type { Project } from '$lib/schema';
	import ProjectList from '$lib/components/projects/ProjectList.svelte';
	import ProjectListHeading from '$lib/components/projects/ProjectListHeading.svelte';
	import ContractListHeading from '$lib/components/contracts/ContractListHeading.svelte';
	import { activeProjectId, activeAgreementId } from '$lib/stores';

	let { data } = $props();

	onMount(() => {
		activeProjectId.set(null);
		activeAgreementId.set(null);
	});
</script>

<div class="space-y-4">
	<div class="card">
		<div class="mb-4">
			<ProjectListHeading projects={data.projects} />
		</div>

		<ProjectList projects={data.projects} />
	</div>
	<div class="card">
		<div class="mb-8">
			<ContractListHeading contracts={[]} />
		</div>

		<p>Coming soon</p>
	</div>
</div>
