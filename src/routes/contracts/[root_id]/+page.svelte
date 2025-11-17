<script lang="ts">
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import { activeAgreementRootId } from '$lib/stores';

	let { data } = $props();

	activeAgreementRootId.set(
		data.agreements?.[data.agreements.length - 1]?.root_id
			? Number(data.agreements[data.agreements.length - 1].root_id)
			: null
	);

	const lastAgreement = $derived(data.agreements?.[data.agreements.length - 1]);
</script>

<div class="card">
	<div class="mb-2 flex text-sm text-slate-600">
		<a href="/" class="link">
			<span>Dashboard</span>
		</a>
		<span class="mx-1">/</span>
		<span>{lastAgreement?.agreement_name}</span>
	</div>

	<div class="flex items-center justify-between">
		<h1 class="mb-0 text-5xl!">{lastAgreement?.agreement_name}</h1>
	</div>

	<div class="mt-6 grid grid-cols-2 gap-4 text-slate-600">
		<div class="flex flex-col">
			<span class="text-xs font-medium tracking-wide text-slate-400 uppercase">Created By</span>
			<span class="mt-1 text-sm">{lastAgreement?.created_by}</span>
		</div>
		<div class="flex flex-col">
			<span class="text-xs font-medium tracking-wide text-slate-400 uppercase">Created On</span>
			<span class="mt-1 text-sm"
				>{new Date(lastAgreement?.created_at as string).toLocaleDateString()}</span
			>
		</div>
		<div class="flex flex-col">
			<span class="text-xs font-medium tracking-wide text-slate-400 uppercase">Type</span>
			<span class="mt-1 text-sm">{lastAgreement?.agreement_type}</span>
		</div>
		<div class="flex flex-col">
			<span class="text-xs font-medium tracking-wide text-slate-400 uppercase">Counterparty</span>
			<span class="mt-1 text-sm">{lastAgreement?.counterparty}</span>
		</div>
		<div class="flex flex-col">
			<span class="text-xs font-medium tracking-wide text-slate-400 uppercase">Version</span>
			<span class="mt-1 text-sm">{lastAgreement?.version_number}</span>
		</div>
	</div>

	<div class="mt-12">
		<h2>Agreement Text</h2>
		<div class="max-h-96 overflow-y-auto rounded-3xl bg-slate-100 px-6 py-4 pr-3 shadow-inner">
			<LLMOutput text={lastAgreement?.text_content || 'No contract text available.'} />
		</div>
	</div>
</div>

<div class="mt-4 max-w-[750px] overflow-x-auto text-xs">
	<pre>{JSON.stringify(data.agreements, null, 2)}</pre>
</div>
