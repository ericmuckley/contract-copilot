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

<div class="mx-auto max-w-7xl">
	<div class="mb-8">
		<h1 class="text-5xl font-bold tracking-tight">
			<span
				class="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
			>
				Dashboard
			</span>
		</h1>
		<p class="mt-2 text-slate-500">
			Manage your projects, contracts, agreements, and policies here.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
		<div class="card group transition-all duration-300 hover:border-indigo-200/60 hover:shadow-lg">
			<div class="mb-6">
				<ProjectListHeading projects={data.projects} />
			</div>

			<ProjectList projects={data.projects} />
		</div>
		<div class="card group transition-all duration-300 hover:border-indigo-200/60 hover:shadow-lg">
			<div class="mb-6">
				<ContractListHeading agreements={data.agreements} />
			</div>

			<ContractList agreements={data.agreements} policyArtifacts={data.policyArtifacts} />
		</div>
	</div>
</div>
