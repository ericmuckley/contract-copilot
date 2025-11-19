<script lang="ts">
	import type { Project } from '$lib/schema';
	let { projects = [] }: { projects?: Project[] } = $props();
</script>

<div class="flex items-center justify-between">
	<div class="flex items-center gap-3">
		<h2 class="text-2xl font-bold tracking-tight">Project Estimates</h2>
		{#if projects.length > 0}
			<span
				class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700"
			>
				{projects.length}
			</span>
		{/if}
	</div>
</div>
