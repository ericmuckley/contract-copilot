<script lang="ts">
	import { marked } from 'marked';
	import type { EstimateTask } from '$lib/types/project';

	let {
		projectId,
		assumptions = null,
		tasks = [],
		onRefresh
	}: {
		projectId: number;
		assumptions?: string | null;
		tasks?: EstimateTask[];
		onRefresh: () => void;
	} = $props();

	let isEditing = $state(false);
	let editedAssumptions = $state(assumptions || '');
	let editedTasks = $state<EstimateTask[]>([...tasks]);
	let isGenerating = $state(false);
	let isSaving = $state(false);
	let error = $state('');
	let generatedContent = $state('');

	const totalHours = $derived(tasks.reduce((sum, task) => sum + Number(task.hours), 0));

	async function generateEstimate() {
		isGenerating = true;
		generatedContent = '';
		error = '';

		try {
			const response = await fetch(`/api/projects/${projectId}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stage: 'EffortEstimate' })
			});

			if (!response.ok) {
				throw new Error('Failed to generate estimate');
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const data = JSON.parse(line);
						if (data.type === 'text') {
							generatedContent += data.text;
						}
					} catch {
						console.error('Failed to parse line:', line);
					}
				}
			}

			// Parse the generated content to extract assumptions and tasks
			parseGeneratedContent(generatedContent);
			isEditing = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Generation failed';
		} finally {
			isGenerating = false;
		}
	}

	function parseGeneratedContent(content: string) {
		// Extract assumptions (everything before the JSON block)
		const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

		if (jsonMatch) {
			// Get assumptions (everything before the JSON block)
			const assumptionsText = content.substring(0, jsonMatch.index).trim();
			editedAssumptions = assumptionsText;

			// Parse JSON tasks
			try {
				const parsedTasks = JSON.parse(jsonMatch[1]);
				if (Array.isArray(parsedTasks)) {
					editedTasks = parsedTasks.map((t, index) => ({
						id: -(index + 1), // Temporary negative ID for new tasks
						estimate_id: 0,
						task_description: t.task_description,
						assigned_role: t.assigned_role,
						hours: Number(t.hours)
					}));
				}
			} catch (e) {
				console.error('Failed to parse tasks JSON:', e);
			}
		} else {
			editedAssumptions = content;
		}
	}

	async function saveEstimate() {
		isSaving = true;
		error = '';

		try {
			const response = await fetch(`/api/projects/${projectId}/effort-estimate`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					assumptions: editedAssumptions,
					tasks: editedTasks.map((t) => ({
						task_description: t.task_description,
						assigned_role: t.assigned_role,
						hours: t.hours
					}))
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save estimate');
			}

			isEditing = false;
			onRefresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Save failed';
		} finally {
			isSaving = false;
		}
	}

	function startEditing() {
		editedAssumptions = assumptions || '';
		editedTasks = [...tasks];
		isEditing = true;
	}

	function cancelEditing() {
		editedAssumptions = assumptions || '';
		editedTasks = [...tasks];
		isEditing = false;
		error = '';
	}

	function addTask() {
		editedTasks = [
			...editedTasks,
			{
				id: -(editedTasks.length + 1),
				estimate_id: 0,
				task_description: '',
				assigned_role: '',
				hours: 0
			}
		];
	}

	function removeTask(index: number) {
		editedTasks = editedTasks.filter((_, i) => i !== index);
	}

	const renderedAssumptions = $derived(assumptions ? marked(assumptions) : '');
</script>

<div class="space-y-4">
	<div class="card bg-white">
		<h3 class="mb-4 text-lg font-semibold text-slate-800">Effort Estimate (WBS)</h3>
		<p class="mb-4 text-sm text-slate-600">
			Generate a detailed Work Breakdown Structure with tasks, assigned roles, and estimated hours
			based on all previous stages.
		</p>

		{#if !assumptions && !isEditing}
			<button
				onclick={generateEstimate}
				disabled={isGenerating}
				class="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isGenerating}
					<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
					Generating...
				{:else}
					<i class="bi bi-stars mr-2"></i>
					Generate Effort Estimate with AI
				{/if}
			</button>
		{/if}

		{#if assumptions && !isEditing}
			<div class="mb-6">
				<h4 class="mb-2 font-semibold text-slate-700">Assumptions:</h4>
				<div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
					<div class="boilerplate prose max-w-none">
						{@html renderedAssumptions}
					</div>
				</div>
			</div>

			<div class="mb-6">
				<h4 class="mb-2 font-semibold text-slate-700">
					Tasks ({tasks.length} tasks, {totalHours} hours total):
				</h4>
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="border-b border-slate-200 bg-slate-50">
								<th class="px-4 py-2 text-left text-sm font-semibold text-slate-700">Task</th>
								<th class="px-4 py-2 text-left text-sm font-semibold text-slate-700">Role</th>
								<th class="px-4 py-2 text-right text-sm font-semibold text-slate-700">Hours</th>
							</tr>
						</thead>
						<tbody>
							{#each tasks as task (task.id)}
								<tr class="border-b border-slate-100">
									<td class="px-4 py-2 text-sm">{task.task_description}</td>
									<td class="px-4 py-2 text-sm">{task.assigned_role}</td>
									<td class="px-4 py-2 text-right text-sm">{task.hours}</td>
								</tr>
							{/each}
							<tr class="bg-slate-50 font-semibold">
								<td class="px-4 py-2 text-sm" colspan="2">Total</td>
								<td class="px-4 py-2 text-right text-sm">{totalHours} hours</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="flex space-x-2">
				<button onclick={startEditing} class="btn bg-slate-500 text-white hover:bg-slate-600">
					<i class="bi bi-pencil mr-2"></i>
					Edit
				</button>
				<button onclick={generateEstimate} disabled={isGenerating} class="btn btn-primary">
					<i class="bi bi-arrow-clockwise mr-2"></i>
					Regenerate
				</button>
			</div>
		{/if}

		{#if isEditing}
			<div class="space-y-6">
				<div>
					<label class="mb-2 block text-sm font-semibold text-slate-700">Assumptions:</label>
					<textarea
						bind:value={editedAssumptions}
						rows="10"
						class="w-full rounded-lg border border-slate-300 p-4 font-mono text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
						placeholder="Enter assumptions in Markdown format..."
					></textarea>
				</div>

				<div>
					<div class="mb-2 flex items-center justify-between">
						<label class="text-sm font-semibold text-slate-700">Tasks:</label>
						<button onclick={addTask} class="text-sm text-sky-600 hover:text-sky-700">
							<i class="bi bi-plus-lg mr-1"></i>
							Add Task
						</button>
					</div>
					<div class="space-y-2">
						{#each editedTasks as task, index (task.id)}
							<div class="rounded-lg border border-slate-200 p-3">
								<div class="grid grid-cols-12 gap-2">
									<input
										type="text"
										bind:value={task.task_description}
										placeholder="Task description"
										class="col-span-6 rounded border border-slate-300 px-2 py-1 text-sm"
									/>
									<input
										type="text"
										bind:value={task.assigned_role}
										placeholder="Role"
										class="col-span-3 rounded border border-slate-300 px-2 py-1 text-sm"
									/>
									<input
										type="number"
										bind:value={task.hours}
										placeholder="Hours"
										min="0"
										step="0.5"
										class="col-span-2 rounded border border-slate-300 px-2 py-1 text-sm"
									/>
									<button
										onclick={() => removeTask(index)}
										class="col-span-1 text-red-600 hover:text-red-700"
									>
										<i class="bi bi-trash"></i>
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex space-x-2">
					<button
						onclick={saveEstimate}
						disabled={isSaving}
						class="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSaving}
							<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
							Saving...
						{:else}
							<i class="bi bi-check-lg mr-2"></i>
							Save
						{/if}
					</button>
					<button onclick={cancelEditing} disabled={isSaving} class="btn bg-slate-500 text-white">
						Cancel
					</button>
				</div>
			</div>
		{/if}

		{#if error}
			<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<i class="bi bi-exclamation-triangle-fill mr-2"></i>
				{error}
			</div>
		{/if}

		{#if isGenerating && generatedContent}
			<div class="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
				<div class="mb-2 text-sm font-semibold text-sky-700">
					<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
					Generating estimate...
				</div>
				<div class="boilerplate prose max-w-none text-slate-700">
					{@html marked(generatedContent)}
				</div>
			</div>
		{/if}
	</div>
</div>
