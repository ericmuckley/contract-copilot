<script lang="ts">
	import type { Agreement } from '$lib/schema';
	let { agreements = [] }: { agreements?: Agreement[] } = $props();
</script>

<div class="flex items-center justify-between">
	<div class="flex space-x-2">
		<h1>Contracts/Agreements</h1>
		{#if agreements.length > 0}
			<div>
				<div class="standard rounded-xl bg-slate-200 px-3 py-1 font-bold">
					{agreements.length}
				</div>
			</div>
		{/if}
	</div>
	<div class="flex space-x-4">
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
