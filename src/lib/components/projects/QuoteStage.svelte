<script lang="ts">
	import type { ProjectTask } from '$lib/schema';
	import { PROJECT_PERSONNEL_RATES } from '$lib/schema';
	import Spinner from '../Spinner.svelte';
	import { generateQuoteCSV } from '$lib/utils';

	let {
		projectId,
		tasks = [],
		content = null,
		onRefresh
	}: {
		projectId: number;
		stageIndex: number;
		content?: string | null;
		tasks?: ProjectTask[];
		onRefresh: () => void;
	} = $props();

	let isGenerating = $state(false);
	let error = $state('');

	// Parse CSV content from database or generate from tasks
	let csvData = $derived.by(() => {
		if (content) {
			return content;
		}
		return generateQuoteCSV(tasks);
	});

	// Parse tasks from CSV
	const parsedData = $derived.by(() => {
		const lines = csvData.split('\n');
		const dataRows: ProjectTask[] = [];
		let totalHours = 0;
		let totalCost = 0;
		let timelineWeeks = 0;

		// Skip header row and parse task rows
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			// Parse CSV (handle quoted values)
			const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map((v) => v.replace(/^"|"$/g, ''));
			if (!values || values.length < 5) continue;

			const [description, role, hours, rate, cost] = values;

			// Check if this is a summary row
			if (description === 'Total Hours') {
				totalHours = Number(hours);
			} else if (description === 'Total Cost') {
				totalCost = Number(cost);
			} else if (description === 'Timeline (weeks)') {
				timelineWeeks = Number(hours);
			} else if (description && role && hours) {
				// Regular task row
				dataRows.push({
					description,
					role,
					hours: Number(hours)
				});
			}
		}

		return { tasks: dataRows, totalHours, totalCost, timelineWeeks };
	});

	async function regenerateQuote() {
		isGenerating = true;
		error = '';

		try {
			// Generate new CSV from current tasks
			const newCSV = generateQuoteCSV(tasks);

			// Save to database
			const response = await fetch(`/api/projects/${projectId}/stage-content`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					stageIndex: 5,
					content: newCSV
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save quote');
			}

			onRefresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to regenerate quote';
		} finally {
			isGenerating = false;
		}
	}

	function exportToCSV() {
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `ProjectQuote.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function copyToClipboard() {
		const summaryText = `\n\nTotal Hours: ${parsedData.totalHours}\nTotal Cost: $${parsedData.totalCost.toFixed(2)}\nTimeline: ${parsedData.timelineWeeks} weeks`;

		navigator.clipboard.writeText(csvData + summaryText).then(() => {
			alert('Quote data copied to clipboard!');
		});
	}
</script>

<div class="space-y-4">
	<div class="card bg-white">
		<h1 class="mb-4">Project Quote</h1>
		<p class="standard mb-4 text-sm">
			Review the project tasks with rates and costs. Export to CSV or copy to clipboard.
		</p>

		{#if error}
			<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<i class="bi bi-exclamation-triangle-fill mr-2"></i>
				{error}
			</div>
		{/if}

		{#if isGenerating}
			<div class="mb-2 flex justify-center">
				<Spinner />
			</div>
		{:else if parsedData.tasks.length === 0}
			<div class="standard rounded-lg bg-slate-50 p-4 text-sm">
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
				<button
					onclick={regenerateQuote}
					disabled={isGenerating}
					class="btn btn-outline flex space-x-1 whitespace-nowrap"
				>
					<i class="bi bi-arrow-clockwise mr-2"></i>
					<span>Regenerate</span>
				</button>
			</div>

			<div class="mt-6 space-y-6">
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="border-b-2 border-slate-300 bg-slate-50">
								<th class="standard px-4 py-3 text-left text-sm font-semibold">Task</th>
								<th class="standard px-4 py-3 text-left text-sm font-semibold">Role</th>
								<th class="standard px-4 py-3 text-right text-sm font-semibold">Hours</th>
								<th class="standard px-4 py-3 text-right text-sm font-semibold"> Rate/Hour </th>
								<th class="standard px-4 py-3 text-right text-sm font-semibold"> Total Cost </th>
							</tr>
						</thead>
						<tbody>
							{#each parsedData.tasks as task, t (t)}
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
							<tr class="standard border-t-2 border-slate-300 bg-slate-50 font-bold">
								<td class="px-4 py-3 text-sm" colspan="2">Total Project Cost</td>
								<td class="px-4 py-3 text-right text-sm">{parsedData.totalHours} hrs</td>
								<td class="px-4 py-3 text-right text-sm">—</td>
								<td class="px-4 py-3 text-right text-sm">${parsedData.totalCost.toFixed(2)}</td>
							</tr>
							<tr class="standard border-b border-slate-200 bg-slate-50 font-bold">
								<td class="px-4 py-3 text-sm" colspan="4">Project Timeline (at 40 hrs/week)</td>
								<td class="px-4 py-3 text-right text-sm">{parsedData.timelineWeeks} weeks</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
