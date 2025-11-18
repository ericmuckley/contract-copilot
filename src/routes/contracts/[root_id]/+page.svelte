<script lang="ts">
	import { goto } from '$app/navigation';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import AgreementNotes from '$lib/components/contracts/AgreementNotes.svelte';
	import AgreementReview from '$lib/components/contracts/AgreementReview.svelte';
	import ContractVersionHistory from '$lib/components/contracts/ContractVersionHistory.svelte';
	import { activeAgreementRootId } from '$lib/stores';
	import { onMount } from 'svelte';

	let { data } = $props();

	// The agreements are sorted by version_number DESC, so [0] is the highest version
	const currentAgreement = $derived(data.agreements?.[0]);
	const previousVersions = $derived(data.agreements?.slice(1) || []);

	onMount(async () => {
		if (!currentAgreement) {
			await goto('/error');
		}

		activeAgreementRootId.set(currentAgreement?.root_id ? Number(currentAgreement.root_id) : null);
	});
</script>

<div class="card">
	<div class="standard mb-2 flex text-sm">
		<a href="/" class="link">
			<span>Dashboard</span>
		</a>
		<span class="mx-1">/</span>
		<span>{currentAgreement?.agreement_name}</span>
	</div>

	<div class="flex items-center justify-between">
		<h1 class="mb-0 text-5xl!">{currentAgreement?.agreement_name}</h1>
	</div>
	<div
		class="w-min rounded-full bg-green-100 px-4 py-2 text-sm font-bold whitespace-nowrap text-green-700"
	>
		Version {currentAgreement?.version_number} (Current)
	</div>

	<div class="standard mt-6 grid grid-cols-2 gap-4">
		<div class="flex flex-col">
			<span class="muted text-xs font-medium tracking-wide uppercase">Created By</span>
			<span class="mt-1 text-sm">{currentAgreement?.created_by}</span>
		</div>
		<div class="flex flex-col">
			<span class="muted text-xs font-medium tracking-wide uppercase">Created On</span>
			<span class="mt-1 text-sm"
				>{new Date(currentAgreement?.created_at as string).toLocaleDateString()}</span
			>
		</div>
		<div class="flex flex-col">
			<span class="muted text-xs font-medium tracking-wide uppercase">Type</span>
			<span class="mt-1 text-sm">{currentAgreement?.agreement_type}</span>
		</div>
		<div class="flex flex-col">
			<span class="muted text-xs font-medium tracking-wide uppercase">Counterparty</span>
			<span class="mt-1 text-sm">{currentAgreement?.counterparty}</span>
		</div>
		<div class="flex flex-col">
			<span class="muted text-xs font-medium tracking-wide uppercase">Origin</span>
			<span class="mt-1 text-sm capitalize">{currentAgreement?.origin}</span>
		</div>
	</div>

	<div class="mt-12">
		<h2>Agreement Text</h2>
		<div class="card max-h-96 overflow-x-auto overflow-y-auto bg-slate-100! shadow-inner">
			<LLMOutput text={currentAgreement?.text_content || 'No contract text available.'} />
		</div>
	</div>

	{#if currentAgreement}
		<AgreementReview agreement={currentAgreement} />
	{/if}

	{#if currentAgreement}
		<div class="mt-8">
			<AgreementNotes agreement={currentAgreement} />
		</div>
	{/if}
</div>

<ContractVersionHistory versions={previousVersions} />

<!-- Debug: Uncomment to see raw data
<div class="card mt-4">
	<details>
		<summary class="cursor-pointer font-medium">Debug: All Agreements Data</summary>
		<div class="mt-4 max-w-[750px] overflow-x-auto text-xs">
			<pre>{JSON.stringify(data.agreements, null, 2)}</pre>
		</div>
	</details>
</div>
-->
