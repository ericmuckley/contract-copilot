<script lang="ts">
	//import type { Contract } from '$lib/schema';
	let { contracts = [] }: { contracts?: any[] } = $props();
</script>

<div class="flex items-center justify-between">
	<div class="flex space-x-2">
		<h1>Contracts</h1>
		{#if contracts.length > 0}
			<div>
				<div class="rounded-xl bg-slate-200 px-3 py-1 font-bold text-slate-600">
					{contracts.length}
				</div>
			</div>
		{/if}
	</div>
	<div class="flex space-x-2">
		<div>
			<a href="/contracts/policy-manager" class="btn btn-outline">
				<i class="bi bi-gear-fill"></i>
				Policies
			</a>
		</div>
		<div>
			<a href="/contracts/new" class="btn btn-primary">
				<i class="bi bi-plus-lg"></i>
				New
			</a>
		</div>
	</div>
</div>
