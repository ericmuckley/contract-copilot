<script lang="ts">
	import { goto } from '$app/navigation';
	import ApproverNameInput from '$lib/components/ApproverNameInput.svelte';

	let projectName = $state('');
	let approverName = $state('');
	let isCreating = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!projectName.trim()) {
			error = 'Project name is required';
			return;
		}

		if (!approverName.trim()) {
			error = 'Your name is required';
			return;
		}

		isCreating = true;
		error = '';

		try {
			// Create project
			const createResponse = await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: projectName.trim(), approved_by: approverName.trim() })
			});

			if (!createResponse.ok) {
				throw new Error('Failed to create project');
			}

			const { project } = await createResponse.json();

			// Redirect to project detail page
			goto(`/projects/${project.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			isCreating = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6">
		<a href="/" class="link inline-flex items-center space-x-2">
			<i class="bi bi-arrow-left"></i>
			<span>Back to Dashboard</span>
		</a>
	</div>

	<div>
		<h1 class="mb-6">Create New Project</h1>

		<form onsubmit={handleSubmit} class="space-y-6">
			<div>
				<label for="project-name" class="mb-1 block text-sm text-slate-600">
					Project Name <span class="text-red-500">*</span>
				</label>
				<input
					id="project-name"
					type="text"
					bind:value={projectName}
					disabled={isCreating}
					placeholder="Enter project name"
					class="text-input"
				/>
			</div>

			<div>
				<ApproverNameInput
					bind:value={approverName}
					disabled={isCreating}
					placeholder="Enter your name"
				/>
			</div>

			{#if error}
				<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
					<i class="bi bi-exclamation-triangle-fill mr-2"></i>
					{error}
				</div>
			{/if}

			<div class="flex space-x-4">
				<button
					type="submit"
					disabled={isCreating}
					class="btn btn-primary flex-1"
				>
					{#if isCreating}
						<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
						Creating...
					{:else}
						<i class="bi bi-plus-lg mr-2"></i>
						Create Project
					{/if}
				</button>
				<a
					href="/"
					class="btn flex-1 bg-slate-500 text-center text-white hover:bg-slate-700 {isCreating
						? 'pointer-events-none opacity-50'
						: ''}"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>
