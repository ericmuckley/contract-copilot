<script lang="ts">
	import { onMount } from 'svelte';
	import type { Project, Agreement } from '$lib/schema';
	import ProjectList from '$lib/components/projects/ProjectList.svelte';
	import ProjectListHeading from '$lib/components/projects/ProjectListHeading.svelte';
	import ContractListHeading from '$lib/components/contracts/ContractListHeading.svelte';
	import { activeProjectId, activeAgreementRootId } from '$lib/stores';
	import ContractList from '$lib/components/contracts/ContractList.svelte';

	let { data } = $props();

	onMount(() => {
		activeProjectId.set(null);
		activeAgreementRootId.set(null);
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
			<ContractListHeading agreements={data.agreements} />
		</div>

		<ContractList agreements={data.agreements} />
	</div>
</div>
