<script lang="ts">
	import type { Agreement, Artifact } from '$lib/schema';
	import ContractCard from './ContractCard.svelte';
	import { AGREEMENT_TYPES } from '$lib/schema';

	let {
		agreements = [],
		policyArtifacts
	}: { agreements?: Agreement[]; policyArtifacts: Artifact[] } = $props();

	let typeFilter = $state<string>('all');

	// Get only the latest version for each unique root_id
	const latestAgreements = $derived(() => {
		const agreementsByRootId = new Map<string, Agreement>();

		for (const agreement of agreements) {
			const existing = agreementsByRootId.get(agreement.root_id);
			if (!existing || agreement.version_number > existing.version_number) {
				agreementsByRootId.set(agreement.root_id, agreement);
			}
		}

		return Array.from(agreementsByRootId.values());
	});

	const filteredAgreements = $derived(
		typeFilter === 'all'
			? latestAgreements()
			: latestAgreements().filter((a) => a.agreement_type === typeFilter)
	);

	const lastUpdated = $derived(() => {
		let latestDate: Date | null = null;

		for (const agreement of latestAgreements()) {
			if (agreement.updated_at) {
				const date = new Date(agreement.updated_at);
				if (!latestDate || date > latestDate) {
					latestDate = date;
				}
			}
		}

		return latestDate;
	});
</script>

<div class="mb-8 flex space-x-4">
	{#if policyArtifacts.length > 0}
		<div>
			<a href="/contracts/new" class="btn btn-primary">
				<i class="bi bi-plus-lg"></i>
				New Contract / Agreement
			</a>
		</div>
	{/if}
	<div>
		<a href="/contracts/policy-manager" class="btn btn-outline">
			<i class="bi bi-gear-fill"></i>
			Policies
		</a>
	</div>
</div>

{#if policyArtifacts.length}
	<div>
		{#if lastUpdated()}
			<div class="standard mb-4 text-sm">
				<span class="font-medium">Last contract update:</span>
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
			<select id="type-filter" bind:value={typeFilter}>
				<option value="all">All</option>
				{#each AGREEMENT_TYPES as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
			<span class="text-sm text-slate-500">
				{filteredAgreements.length}/{latestAgreements().length} agreement{latestAgreements()
					.length !== 1
					? 's'
					: ''}
			</span>
		</div>

		{#if filteredAgreements.length === 0}
			<div class="py-24 text-center">
				<div class="mb-4 text-4xl text-slate-300">
					<i class="bi bi-file-earmark-x"></i>
				</div>
				<p class="standard">
					{typeFilter === 'all' ? 'No agreements yet.' : `No ${typeFilter} agreements found.`}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredAgreements as agreement (agreement.id)}
					<ContractCard {agreement} />
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div class="text-center">
		<div class="flex justify-center">
			<p>Upload some policy documents to get started</p>
		</div>
		<div class="mt-6 flex justify-center">
			<a href="/contracts/policy-manager" class="btn btn-outline">
				<i class="bi bi-gear-fill"></i>
				Add Policies
			</a>
		</div>
	</div>
{/if}
