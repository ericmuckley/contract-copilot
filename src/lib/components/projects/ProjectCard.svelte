<script lang="ts">
	import type { Project } from '$lib/schema';
	import { STAGES } from '$lib/schema';

	let { project }: { project: Project } = $props();

	const stageIdx = $derived(project.sdata.filter((s) => s.approved).length);
	const progressPercentage = $derived((stageIdx / (STAGES.length - 1)) * 100);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<a
	href="/projects/{project.id}"
	class="group relative block overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-indigo-200 hover:shadow-lg"
>
	<div class="mb-4 flex items-start justify-between gap-3">
		<div class="flex flex-1 items-center gap-2">
			<h3
				class="text-lg leading-tight font-semibold text-slate-700 transition-colors group-hover:text-indigo-700"
			>
				{project.project_name}
			</h3>

			{#if project.sdata[stageIdx]?.name === 'quote'}
				<span class="text-emerald-500 transition-transform group-hover:scale-110">
					<i class="bi bi-check-circle-fill"></i>
				</span>
			{/if}
		</div>

		<span
			class="inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {STAGES[
				stageIdx
			].bgcolor} {STAGES[stageIdx].textcolor}"
		>
			{STAGES[stageIdx].label}
		</span>
	</div>

	<div class="mb-4 flex items-center gap-4 text-xs text-slate-400">
		<span class="flex items-center gap-1">
			<i class="bi bi-calendar-plus"></i>
			{formatDate(project.created_at as string)}
		</span>
		<span class="flex items-center gap-1">
			<i class="bi bi-calendar-check"></i>
			{formatDate(project.updated_at as string)}
		</span>
	</div>

	<!-- Progress bar -->
	<div class="relative">
		<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
			<div
				class="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-400 shadow-sm transition-all duration-500"
				style="width: {progressPercentage}%"
			></div>
		</div>
		<span class="mt-1 block text-xs font-medium text-slate-500">
			{Math.round(progressPercentage)}% Complete
		</span>
	</div>

	<!-- Hover effect gradient -->
	<div
		class="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	></div>
</a>
