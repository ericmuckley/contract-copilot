<script lang="ts">
	import type { Agreement } from '$lib/schema';
	let { agreements = [] }: { agreements?: Agreement[] } = $props();
</script>

<div class="flex items-center justify-between">
	<div class="flex items-center gap-3">
		<h2 class="text-2xl font-bold tracking-tight">Contracts & Agreements</h2>
		{#if agreements.length > 0}
			<span
				class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700"
			>
				{agreements.length}
			</span>
		{/if}
	</div>
</div>
