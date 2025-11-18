<script lang="ts">
	import { STAGES } from '$lib/schema';
	import type { StageData } from '$lib/schema';

	let { currentStageIndex, sdata }: { currentStageIndex: number; sdata: StageData[] } = $props();

	// TODO: possibly here? but somewhere, add ability to view project Markdown content at all previous stages.
</script>

<div class="flex">
	{#each STAGES as stage, index (stage.name)}
		<div class="flex flex-col items-center">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors {index <=
				currentStageIndex
					? `${STAGES[index].bordercolor} ${STAGES[index].textcolor} ${STAGES[index].bgcolor}`
					: 'muted border-slate-300 bg-white'}"
			>
				<i class="bi {stage.icon}"></i>
			</div>
			<div
				class="mt-1 text-center text-xs font-bold whitespace-nowrap {index === currentStageIndex
					? `${STAGES[index].textcolor}`
					: index < currentStageIndex
						? `${STAGES[index].textcolor}`
						: 'muted'}"
			>
				{stage.label}
			</div>
			{#if sdata[index]?.approved_by}
				<p class="muted text-xs whitespace-nowrap">
					Approved by {sdata[index]?.approved_by || 'user'}
				</p>
			{/if}
			{#if sdata[index]?.updated_at}
				<p class="muted text-xs whitespace-nowrap">
					{new Date(sdata[index]?.updated_at).toLocaleDateString()}
				</p>
			{/if}
		</div>
		{#if index < STAGES.length - 1}
			<div class="w-full pt-8">
				<div
					class="mx-2 h-0.5 flex-1 {index < currentStageIndex ? 'bg-sky-500' : 'bg-slate-300'}"
				></div>
			</div>
		{/if}
	{/each}
</div>
