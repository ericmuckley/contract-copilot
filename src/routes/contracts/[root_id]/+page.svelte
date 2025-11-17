<script lang="ts">
	import { activeAgreementRootId } from '$lib/stores';

	let { data } = $props();

	activeAgreementRootId.set(data.agreements?.[data.agreements.length - 1]?.root_id ? Number(data.agreements[data.agreements.length - 1].root_id) : null);

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
</div>


<div class="max-w-[750px] overflow-x-auto mt-4 text-xs">
	<pre>{JSON.stringify(data.agreements, null, 2)}</pre>
</div>