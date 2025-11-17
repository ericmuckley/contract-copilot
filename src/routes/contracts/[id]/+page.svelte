<script lang="ts">
	import { activeAgreementId } from '$lib/stores';
	let { data } = $props();

	activeAgreementId.set(data?.agreement?.id ? Number(data.agreement.id) : null);
</script>

<div class="card">
	<div class="mb-1 flex text-sm text-slate-600">
		<a href="/" class="link">
			<span>Dashboard</span>
		</a>
		<span class="mx-1">/</span>
		<span>{data.agreement.agreement_name}</span>
	</div>

	<div class="flex items-center justify-between">
		<h1 class="mb-0 text-5xl!">{data.agreement.agreement_name}</h1>
	</div>
</div>
