<script lang="ts">
	import type { Agreement } from '$lib/schema';
	let { agreements = [] }: { agreements?: Agreement[] } = $props();
</script>

<div class="flex items-center justify-between">
	<div class="flex space-x-2">
		<h1>Contracts & Agreements</h1>
		{#if agreements.length > 0}
			<div>
				<div class="standard rounded-xl bg-slate-200 px-3 py-1 font-bold">
					{agreements.length}
				</div>
			</div>
		{/if}
	</div>
</div>
