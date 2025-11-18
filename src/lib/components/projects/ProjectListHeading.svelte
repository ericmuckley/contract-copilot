<script lang="ts">
	import type { Project } from '$lib/schema';
	let { projects = [] }: { projects?: Project[] } = $props();
</script>

<div class="flex items-center justify-between">
	<div class="flex space-x-2">
		<h1>Project Estimates</h1>
		{#if projects.length > 0}
			<div>
				<div class="standard rounded-xl bg-slate-200 px-3 py-1 font-bold">
					{projects.length}
				</div>
			</div>
		{/if}
	</div>
</div>
