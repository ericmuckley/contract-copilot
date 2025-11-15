<script lang="ts">
	import type { Project, StageData } from '$lib/schema';
	import { STAGES } from '$lib/schema';

	let { sdata }: { sdata: StageData[] } = $props();

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="">
	<h3 class="mb-4 text-lg font-semibold text-slate-800">Project History</h3>

	{#if sdata.filter((s) => s.approved).length === 0}
		<p class="text-sm text-slate-500">No history yet.</p>
	{:else}
		<div class="space-y-3">
			{#each sdata as stage, s (stage.name)}
				{#if stage.approved}
					<div class="flex items-start space-x-3">
						<div class="mt-1">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full {STAGES[s].bgcolor}"
							>
								<i class="bi bi-circle-fill text-xs"></i>
							</div>
						</div>
						<div class="flex-1">
							<div class="flex items-start justify-between">
								<div>
									<p class="font-medium text-slate-800">Approved by {stage.approved_by}</p>
									<p class="text-xs text-slate-500">{formatDate(stage.updated_at as string)}</p>
								</div>
								<span class="rounded-full px-2 py-0.5 text-xs font-medium {STAGES[s].textcolor}">
									{STAGES[s].label}
								</span>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
