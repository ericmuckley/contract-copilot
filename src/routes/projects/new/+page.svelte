<script lang="ts">
	import { goto } from '$app/navigation';

	let projectName = $state('');
	let files = $state<FileList | null>(null);
	let isCreating = $state(false);
	let error = $state('');
	let uploadProgress = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!projectName.trim()) {
			error = 'Project name is required';
			return;
		}

		if (!files || files.length < 2) {
			error = 'At least 2 artifacts are required';
			return;
		}

		isCreating = true;
		error = '';
		uploadProgress = 'Creating project...';

		try {
			// Create project
			const createResponse = await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: projectName.trim() })
			});

			if (!createResponse.ok) {
				throw new Error('Failed to create project');
			}

			const { project } = await createResponse.json();
			
			// Upload artifacts
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				uploadProgress = `Uploading artifact ${i + 1} of ${files.length}...`;
				
				const formData = new FormData();
				formData.append('file', file);
				formData.append('artifact_type', 'document');

				const uploadResponse = await fetch(`/api/projects/${project.id}/artifacts`, {
					method: 'POST',
					body: formData
				});

				if (!uploadResponse.ok) {
					throw new Error(`Failed to upload ${file.name}`);
				}
			}

			uploadProgress = 'Project created successfully!';
			
			// Redirect to project detail page
			setTimeout(() => {
				goto(`/projects/${project.id}`);
			}, 500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			isCreating = false;
			uploadProgress = '';
		}
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		files = target.files;
		error = '';
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

		<form onsubmit={handleSubmit} class="space-y-6">
			<div>
				<label for="project-name" class="mb-2 block text-sm font-medium text-slate-700">
					Project Name <span class="text-red-500">*</span>
				</label>
				<input
					id="project-name"
					type="text"
					bind:value={projectName}
					disabled={isCreating}
					placeholder="Enter project name"
					class="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
				/>
			</div>

			<div>
				<label for="artifacts" class="mb-2 block text-sm font-medium text-slate-700">
					Upload Artifacts <span class="text-red-500">*</span>
					<span class="ml-2 font-normal text-slate-500">(minimum 2 files required)</span>
				</label>
				<input
					id="artifacts"
					type="file"
					multiple
					onchange={handleFileChange}
					disabled={isCreating}
					accept=".pdf,.doc,.docx,.txt,.md"
					class="w-full rounded-lg border border-slate-300 px-4 py-2 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
				/>
				{#if files && files.length > 0}
					<div class="mt-2 text-sm text-slate-600">
						{files.length} file{files.length !== 1 ? 's' : ''} selected
					</div>
				{/if}
			</div>

			{#if error}
				<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
					<i class="bi bi-exclamation-triangle-fill mr-2"></i>
					{error}
				</div>
			{/if}

			{#if uploadProgress}
				<div class="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
					<i class="bi bi-hourglass-split mr-2"></i>
					{uploadProgress}
				</div>
			{/if}

			<div class="flex space-x-4">
				<button
					type="submit"
					disabled={isCreating}
					class="btn btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
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
					class="btn flex-1 bg-slate-500 text-white hover:bg-slate-700 {isCreating
						? 'pointer-events-none opacity-50'
						: ''}"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>

	<div class="card mt-6 bg-slate-50">
		<h3 class="mb-3 text-sm font-semibold text-slate-700">
			<i class="bi bi-info-circle mr-2"></i>
			About the Project Workflow
		</h3>
		<div class="space-y-2 text-sm text-slate-600">
			<p>
				Your project will go through 6 stages: <strong>Artifacts</strong> →
				<strong>Business Case</strong> → <strong>Requirements</strong> →
				<strong>Solution/Architecture</strong> → <strong>Effort Estimate</strong> →
				<strong>Quote</strong>
			</p>
			<p>
				At each stage, our AI will help generate content based on your artifacts and previous
				stages. You can edit and approve the content before advancing to the next stage.
			</p>
		</div>
	</div>
</div>
