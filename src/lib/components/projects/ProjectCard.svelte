<script lang="ts">
	import type { Project } from '$lib/types/project';

	let { project }: { project: Project } = $props();

	const stageColors: Record<string, string> = {
		Artifacts: 'bg-slate-200 text-slate-700',
		BusinessCase: 'bg-sky-200 text-sky-700',
		Requirements: 'bg-purple-200 text-purple-700',
		SolutionArchitecture: 'bg-green-200 text-green-700',
		EffortEstimate: 'bg-yellow-200 text-yellow-700',
		Quote: 'bg-pink-200 text-pink-700'
	};

	const stageLabels: Record<string, string> = {
		Artifacts: 'Artifacts',
		BusinessCase: 'Business Case',
		Requirements: 'Requirements',
		SolutionArchitecture: 'Solution/Architecture',
		EffortEstimate: 'Effort Estimate',
		Quote: 'Quote'
	};

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<a href="/projects/{project.id}" class="card border border-slate-200 block bg-white transition-shadow hover:shadow-lg">
	<div class="mb-3 flex items-start justify-between">
		<h3 class="text-xl font-semibold text-slate-800">{project.name}</h3>
		<span class="rounded-full px-3 py-1 text-xs font-semibold {stageColors[project.current_stage]}">
			{stageLabels[project.current_stage]}
		</span>
	</div>
	<div class="flex items-center justify-between text-sm text-slate-500">
		<span>Created: {formatDate(project.created_at)}</span>
		<span>Updated: {formatDate(project.updated_at)}</span>
	</div>
</a>
