<script lang="ts">
	import type { ProjectTask } from '$lib/schema';
	import { PROJECT_PERSONNEL_RATES } from '$lib/schema';

	let {
		projectId,
		tasks = []
	}: {
		projectId: number;
		stageIndex: number;
		content?: string | null;
		tasks?: ProjectTask[];
		onRefresh: () => void;
	} = $props();

	// Calculate total hours
	const totalHours = $derived(tasks.reduce((sum, task) => sum + Number(task.hours), 0));

	// Calculate total cost
	const totalCost = $derived(
		tasks.reduce((sum, task) => {
			const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
			return sum + Number(task.hours) * rate;
		}, 0)
	);

	// Calculate project timeline (assuming 40-hour work weeks)
	const timelineWeeks = $derived(Math.ceil(totalHours / 40));

	function exportToCSV() {
		const headers = ['Task', 'Role', 'Hours', 'Rate/Hour', 'Total Cost'];
		const rows = tasks.map((task) => {
			const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
			const cost = Number(task.hours) * rate;
			return [task.description, task.role, task.hours, rate, cost.toFixed(2)];
		});

		// Add summary rows
		rows.push(['', '', '', '', '']);
		rows.push(['Total Hours', '', totalHours.toString(), '', '']);
		rows.push(['Total Cost', '', '', '', totalCost.toFixed(2)]);
		rows.push(['Timeline (weeks)', '', timelineWeeks.toString(), '', '']);

		const csv = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell}"`).join(','))
			.join('\n');

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `ProjectQuote.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function copyToClipboard() {
		const headers = ['Task', 'Role', 'Hours', 'Rate/Hour', 'Total Cost'];
		const rows = tasks.map((task) => {
			const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
			const cost = Number(task.hours) * rate;
			return [
				task.description,
				task.role,
				task.hours.toString(),
				`$${rate}`,
				`$${cost.toFixed(2)}`
			];
		});

		const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

		const summaryText = `\n\nTotal Hours: ${totalHours}\nTotal Cost: $${totalCost.toFixed(2)}\nTimeline: ${timelineWeeks} weeks`;

		navigator.clipboard.writeText(csv + summaryText).then(() => {
			alert('Quote data copied to clipboard!');
		});
	}
</script>

<div class="space-y-4">
	<div class="card bg-white">
		<h1 class="mb-4">Project Quote</h1>
		<p class="mb-4 text-sm text-slate-600">
			Review the project tasks with rates and costs. Export to CSV or copy to clipboard.
		</p>

		{#if tasks.length === 0}
			<div class="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
				No tasks available. Please complete the Effort Estimate stage first.
			</div>
		{:else}
			<div class="flex space-x-4">
				<button onclick={exportToCSV} class="btn btn-primary">
					<i class="bi bi-download mr-2"></i>
					Download CSV
				</button>
				<button onclick={copyToClipboard} class="btn btn-primary">
					<i class="bi bi-clipboard mr-2"></i>
					Copy to Clipboard
				</button>
			</div>

			<div class="mt-6 space-y-6">
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="border-b-2 border-slate-300 bg-slate-50">
								<th class="px-4 py-3 text-left text-sm font-semibold text-slate-700">Task</th>
								<th class="px-4 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
								<th class="px-4 py-3 text-right text-sm font-semibold text-slate-700">Hours</th>
								<th class="px-4 py-3 text-right text-sm font-semibold text-slate-700">
									Rate/Hour
								</th>
								<th class="px-4 py-3 text-right text-sm font-semibold text-slate-700">
									Total Cost
								</th>
							</tr>
						</thead>
						<tbody>
							{#each tasks as task, t (t)}
								{@const rate =
									PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0}
								{@const cost = Number(task.hours) * rate}
								<tr class="border-b border-slate-100 hover:bg-slate-50">
									<td class="px-4 py-3 text-sm">{task.description}</td>
									<td class="px-4 py-3 text-sm">{task.role}</td>
									<td class="px-4 py-3 text-right text-sm">{task.hours}</td>
									<td class="px-4 py-3 text-right text-sm">${rate}</td>
									<td class="px-4 py-3 text-right text-sm">${cost.toFixed(2)}</td>
								</tr>
							{/each}
							<tr class="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-600">
								<td class="px-4 py-3 text-sm" colspan="2">Total Project Cost</td>
								<td class="px-4 py-3 text-right text-sm">{totalHours} hrs</td>
								<td class="px-4 py-3 text-right text-sm">—</td>
								<td class="px-4 py-3 text-right text-sm">${totalCost.toFixed(2)}</td>
							</tr>
							<tr class="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">
								<td class="px-4 py-3 text-sm" colspan="4">Project Timeline (at 40 hrs/week)</td>
								<td class="px-4 py-3 text-right text-sm">{timelineWeeks} weeks</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
