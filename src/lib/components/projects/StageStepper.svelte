<script lang="ts">
	import type { ProjectStage } from '$lib/types/project';

	let { currentStage }: { currentStage: ProjectStage } = $props();

	const stages: Array<{ key: ProjectStage; label: string; icon: string }> = [
		{ key: 'Artifacts', label: 'Artifacts', icon: 'bi-file-earmark-text' },
		{ key: 'BusinessCase', label: 'Business Case', icon: 'bi-briefcase' },
		{ key: 'Requirements', label: 'Requirements', icon: 'bi-list-check' },
		{ key: 'SolutionArchitecture', label: 'Solution', icon: 'bi-diagram-3' },
		{ key: 'EffortEstimate', label: 'Estimate', icon: 'bi-calculator' },
		{ key: 'Quote', label: 'Quote', icon: 'bi-currency-dollar' }
	];

	const currentIndex = $derived(stages.findIndex((s) => s.key === currentStage));
</script>

<div class="card bg-white">
	<div class="flex items-center justify-between">
		{#each stages as stage, index (stage.key)}
			<div class="flex flex-1 items-center">
				<div class="flex flex-col items-center">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors {index <=
						currentIndex
							? 'border-sky-500 bg-sky-500 text-white'
							: 'border-slate-300 bg-white text-slate-400'}"
					>
						<i class="bi {stage.icon}"></i>
					</div>
					<div
						class="mt-2 text-center text-xs font-medium {index === currentIndex
							? 'text-sky-700'
							: index < currentIndex
								? 'text-slate-600'
								: 'text-slate-400'}"
					>
						{stage.label}
					</div>
				</div>
				{#if index < stages.length - 1}
					<div
						class="mx-2 h-0.5 flex-1 {index < currentIndex ? 'bg-sky-500' : 'bg-slate-300'}"
					></div>
				{/if}
			</div>
		{/each}
	</div>
</div>
