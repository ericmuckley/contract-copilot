<script lang="ts">
	import { marked } from 'marked';
	import type { ProjectTask } from '$lib/schema';
	import Spinner from '../Spinner.svelte';
	import { safeJsonParse } from '$lib/utils';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import { PROJECT_PERSONNEL_RATES } from '$lib/schema';

	let {
		projectId,
		stageIndex,
		assumptions = null,
		tasks = [],
		onRefresh
	}: {
		projectId: number;
		stageIndex: number;
		assumptions?: string | null;
		tasks?: ProjectTask[];
		onRefresh: () => void;
	} = $props();

	let isEditing = $state(false);
	let editedAssumptions = $state(assumptions || '');
	let editedTasks = $state<ProjectTask[]>([...tasks]);
	let isGenerating = $state(false);
	let isSaving = $state(false);
	let error = $state('');
	let generatedAssumptions = $state('');
	let generatedTasks = $state('');

	const totalHours = $derived(tasks.reduce((sum, task) => sum + Number(task.hours), 0));

	async function generateEstimate() {
		isGenerating = true;
		generatedAssumptions = '';
		generatedTasks = '';
		error = '';

		try {
			// First call: Generate assumptions
			await generateAssumptions();

			// Second call: Generate tasks
			await generateTasks();

			// Parse the generated tasks
			parseGeneratedTasks(generatedTasks);
			editedAssumptions = generatedAssumptions;
			isEditing = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Generation failed';
		} finally {
			isGenerating = false;
		}
	}

	async function generateAssumptions() {
		const response = await fetch(`/api/projects/${projectId}/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stage: 'estimate', type: 'assumptions' })
		});

		if (!response.ok) {
			throw new Error('Failed to generate assumptions');
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
						generatedAssumptions += data.text;
					}
				} catch {
					console.error('Failed to parse line:', line);
				}
			}
		}
	}

	async function generateTasks() {
		const response = await fetch(`/api/projects/${projectId}/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stage: 'estimate', type: 'tasks' })
		});

		if (!response.ok) {
			throw new Error('Failed to generate tasks');
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
						generatedTasks += data.text;
					}
				} catch {
					console.error('Failed to parse line:', line);
				}
			}
		}
	}

	function parseGeneratedTasks(content: string) {
		// Parse JSON tasks from the generated content
		try {
			const parsedTasks = safeJsonParse(content.trim(), []);
			if (Array.isArray(parsedTasks)) {
				editedTasks = parsedTasks.map((t) => ({
					role: t.role || t.assigned_role,
					description: t.description || t.task_description,
					hours: Number(t.hours)
				}));
			}
		} catch (e) {
			console.error('Failed to parse tasks JSON:', e);
			error = 'Failed to parse tasks. Please try again.';
		}
	}

	async function saveEstimate() {
		isSaving = true;
		error = '';

		try {
			const response = await fetch(`/api/projects/${projectId}/stage-content`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					stageIndex,
					content: editedAssumptions,
					tasks: editedTasks
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
				role: '',
				description: '',
				hours: 0
			}
		];
	}

	function removeTask(index: number) {
		editedTasks = editedTasks.filter((_, i) => i !== index);
	}
</script>

<div class="space-y-4">
	<div class="card bg-white">
		<h1 class="mb-4">Effort Estimate (WBS)</h1>
		<p class="standard mb-4 text-sm">
			Generate a detailed Work Breakdown Structure with tasks, assigned roles, and estimated hours
			based on all previous stages.
		</p>

		{#if isGenerating}
			<div class="mb-2 flex justify-center">
				<Spinner />
			</div>
		{/if}

		{#if !assumptions && !isEditing && !isGenerating}
			<button onclick={generateEstimate} disabled={isGenerating} class="btn btn-primary">
				<i class="bi bi-stars mr-2"></i>
				Generate Effort Estimate
			</button>
		{/if}

		{#if assumptions && !isEditing}
			<div class="mb-6 max-h-96 overflow-y-auto rounded-xl border border-slate-200 px-6 py-4">
				<LLMOutput text={assumptions} />
			</div>

			<div class="mb-6">
				<p class="mb-2 font-bold">
					Tasks ({tasks.length} tasks, {totalHours} hours total):
				</p>
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
							{#each tasks as task, index (index)}
								<tr class="border-b border-slate-100">
									<td class="px-4 py-2 text-sm">{task.description}</td>
									<td class="px-4 py-2 text-sm whitespace-nowrap">{task.role}</td>
									<td class="px-4 py-2 text-right text-sm">{task.hours}</td>
								</tr>
							{/each}
							<tr class="standard bg-slate-50 font-bold">
								<td class="px-4 py-2" colspan="2">Total</td>
								<td class="px-4 py-2 text-right whitespace-nowrap">{totalHours}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="flex space-x-2">
				<button onclick={startEditing} class="btn btn-outline flex w-full justify-center space-x-1">
					<i class="bi bi-pencil mr-2"></i>
					<span>Edit</span>
				</button>
				<button
					onclick={generateEstimate}
					disabled={isGenerating}
					class="btn btn-primary flex w-full justify-center space-x-1"
				>
					<i class="bi bi-arrow-clockwise mr-2"></i>
					<span>Regenerate</span>
				</button>
			</div>
		{/if}

		{#if isEditing}
			<div class="space-y-6">
				<div>
					<p class="mb-2 block text-sm font-semibold">Assumptions:</p>
					<textarea
						bind:value={editedAssumptions}
						rows="10"
						class="w-full rounded-lg border border-slate-300 p-4 font-mono text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
						placeholder="Enter assumptions in Markdown format..."
					></textarea>
				</div>

				<div>
					<div class="space-y-2">
						<div class="grid grid-cols-12 gap-2">
							{#each ['Task Description', 'Role', 'Hours', ''] as header, index (index)}
								<div
									class="col-span-{header === ''
										? 1
										: header === 'Task Description'
											? 6
											: header === 'Role'
												? 3
												: 2} font-semibold text-slate-700"
								>
									{header}
								</div>
							{/each}
						</div>
						{#each editedTasks as task, index (index)}
							<div class="rounded-lg border border-slate-200 p-3">
								<div class="grid grid-cols-12 gap-2">
									<input
										type="text"
										bind:value={task.description}
										placeholder="Task description"
										class="col-span-6 rounded border border-slate-300 px-2 py-1 text-sm"
									/>
									<select
										bind:value={task.role}
										class="col-span-3 rounded border border-slate-300 px-2 py-1 text-sm"
									>
										<option value="">Select role</option>
										{#each Object.keys(PROJECT_PERSONNEL_RATES) as role}
											<option value={role}>{role}</option>
										{/each}
									</select>
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
										aria-label="Remove Task"
										class="col-span-1 text-red-600 hover:text-red-700"
									>
										<i class="bi bi-trash"></i>
									</button>
								</div>
							</div>
						{/each}
					</div>

					<div class="my-8 flex justify-center font-bold">
						<button onclick={addTask} class="link">
							<i class="bi bi-plus-lg mr-1"></i>
							Add Task
						</button>
					</div>
				</div>

				<div class="flex space-x-2">
					<button onclick={saveEstimate} disabled={isSaving} class="btn btn-primary">
						{#if isSaving}
							<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
							Saving...
						{:else}
							<i class="bi bi-check-lg mr-2"></i>
							Save
						{/if}
					</button>
					<button onclick={cancelEditing} disabled={isSaving} class="btn btn-outline">
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

		{#if isGenerating && (generatedAssumptions || generatedTasks)}
			<div class="mt-4 space-y-4">
				{#if generatedAssumptions}
					<div>
						<h4 class="mb-2 font-semibold text-slate-700">Generating Assumptions:</h4>
						<LLMOutput text={generatedAssumptions} />
					</div>
				{/if}
				{#if generatedTasks}
					<div>
						<h4 class="mb-2 font-semibold text-slate-700">Generating Tasks:</h4>
						<div class="overflow-x-auto">
							<pre class="rounded-lg bg-slate-50 p-4 text-xs">{generatedTasks}</pre>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
