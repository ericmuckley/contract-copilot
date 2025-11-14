<script lang="ts">
	import type { ProjectHistory } from '$lib/types/project';

	let { history = [] }: { history?: ProjectHistory[] } = $props();

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

	const stageColors: Record<string, string> = {
		Artifacts: 'bg-slate-100 text-slate-700',
		BusinessCase: 'bg-sky-100 text-sky-700',
		Requirements: 'bg-purple-100 text-purple-700',
		SolutionArchitecture: 'bg-green-100 text-green-700',
		EffortEstimate: 'bg-yellow-100 text-yellow-700',
		Quote: 'bg-pink-100 text-pink-700'
	};
</script>

<div class="card bg-white">
	<h3 class="mb-4 text-lg font-semibold text-slate-800">Project History</h3>

	{#if history.length === 0}
		<p class="text-sm text-slate-500">No history yet.</p>
	{:else}
		<div class="space-y-3">
			{#each history as event (event.id)}
				<div class="flex items-start space-x-3">
					<div class="mt-1">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full {stageColors[
								event.stage
							]}"
						>
							<i class="bi bi-circle-fill text-xs"></i>
						</div>
					</div>
					<div class="flex-1">
						<div class="flex items-start justify-between">
							<div>
								<p class="font-medium text-slate-800">{event.action}</p>
								<p class="text-xs text-slate-500">{formatDate(event.timestamp)}</p>
							</div>
							<span class="rounded-full px-2 py-0.5 text-xs font-medium {stageColors[event.stage]}">
								{event.stage}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
