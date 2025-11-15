<script lang="ts">
	import { STAGES } from '$lib/schema';

	let { currentStageIndex }: { currentStageIndex: number } = $props();
</script>

<div class="card bg-white">
	<div class="flex items-center">
		{#each STAGES as stage, index (stage.name)}
			<div class="flex flex-col items-center">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors {index <=
					currentStageIndex
						? `${STAGES[index].bordercolor} ${STAGES[index].textcolor} ${STAGES[index].bgcolor}`
						: 'border-slate-300 bg-white text-slate-400'}"
				>
					<i class="bi {stage.icon}"></i>
				</div>
				<div
					class="mt-2 text-center text-xs font-medium {index === currentStageIndex
						? 'text-sky-700'
						: index < currentStageIndex
							? `${STAGES[index].textcolor}`
							: 'text-slate-400'}"
				>
					{stage.label}
				</div>
			</div>
			{#if index < STAGES.length - 1}
				<div
					class="mx-2 h-0.5 flex-1 {index < currentStageIndex ? 'bg-sky-500' : 'bg-slate-300'}"
				></div>
			{/if}
		{/each}
	</div>
</div>
