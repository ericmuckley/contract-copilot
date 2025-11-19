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
	class="card block border border-slate-200 bg-white transition-shadow hover:shadow-lg"
>
	<div class="mb-3 flex items-start justify-between">
		<h3>
			{project.project_name}

			{#if project.sdata[stageIdx]?.name === 'quote'}
				<span class="text-green-600">
					<i class="bi bi-check-circle-fill"></i>
				</span>
			{/if}
		</h3>

		<div>
			<span
				class="rounded-full px-3 py-1 text-xs font-semibold {STAGES[stageIdx].bgcolor} {STAGES[
					stageIdx
				].textcolor}"
			>
				{STAGES[stageIdx].label}
			</span>
		</div>
	</div>
	<div class="standard flex items-center justify-between space-x-6 text-xs">
		<span>Created: {formatDate(project.created_at as string)}</span>
		<span>Updated: {formatDate(project.updated_at as string)}</span>
	</div>
	<!-- Progress bar -->
	<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-200">
		<div
			class="h-full rounded-full bg-green-600 transition-all duration-500"
			style="width: {progressPercentage}%"
		></div>
	</div>
</a>
