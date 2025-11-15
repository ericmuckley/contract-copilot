<script lang="ts">
	import { goto } from '$app/navigation';
	import ApproverNameInput from '$lib/components/ApproverNameInput.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { emptyProject, type Project } from '$lib/schema';

	let project = $state<Project>(emptyProject);
	let isCreating = $state(false);
	let error = $state('');

	async function handleSubmit() {
		console.log($state.snapshot(project));
		isCreating = true;

		try {
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(project)
			});

			if (response.ok) {
				const { project } = await response.json();
				goto(`/projects/${project.id}`);
			}
		} catch (err) {
			alert(err);
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

	<div class="card bg-white">
		<h1 class="mb-6">Create New Project</h1>

		<div class="space-y-6">
			<div>
				<label for="project-name" class="mb-1 block text-sm text-slate-600">
					Project Name <span class="text-red-500">*</span>
				</label>
				<input
					id="project-name"
					type="text"
					bind:value={project.project_name}
					disabled={isCreating}
					placeholder="Enter project name"
					class="text-input"
				/>
			</div>

			<div>
				<ApproverNameInput
					bind:value={project.created_by}
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

			{#if isCreating}
				<div class="flex justify-center py-2">
					<Spinner />
				</div>
			{:else}
				<div class="flex space-x-4">
					<button
						disabled={project.project_name.trim().length < 1 ||
							project.created_by.trim().length < 1}
						class="btn btn-primary flex-1"
						onclick={handleSubmit}
					>
						<i class="bi bi-plus-lg mr-2"></i>
						Create Project
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
			{/if}
		</div>
	</div>
</div>
