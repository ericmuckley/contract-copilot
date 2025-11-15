<script lang="ts">
	import type { Project } from '$lib/schema';
	import { STAGES } from '$lib/schema';

	let { project }: { project: Project } = $props();

	const stageIdx = $derived(project.sdata.filter((s) => s.approved).length);

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
		<h3 class="text-xl font-semibold text-slate-800">{project.project_name}</h3>
		<span
			class="rounded-full px-3 py-1 text-xs font-semibold {STAGES[stageIdx].bgcolor} {STAGES[
				stageIdx
			].textcolor}"
		>
			{STAGES[stageIdx].label}
		</span>
	</div>
	<div class="flex items-center justify-between space-x-6 text-xs text-slate-500">
		<span>Created: {formatDate(project.created_at as string)}</span>
		<span>Updated: {formatDate(project.updated_at as string)}</span>
	</div>
</a>
