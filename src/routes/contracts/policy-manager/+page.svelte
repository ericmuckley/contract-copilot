<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import type { Artifact } from '$lib/schema';
	import Spinner from '$lib/components/Spinner.svelte';

	let artifacts = $state<Artifact[]>([]);
	let isLoading = $state(false);
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);
	let deleteError = $state<string | null>(null);
	let deletingId = $state<number | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let editingId = $state<number | null>(null);
	let editedContent = $state<string>('');
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);

	onMount(() => {
		loadArtifacts();
	});

	async function loadArtifacts() {
		isLoading = true;
		try {
			// Use 'null' as project ID to get orphaned artifacts (policy files)
			const response = await fetch('/api/projects/null/artifacts');
			if (!response.ok) {
				throw new Error('Failed to load artifacts');
			}
			const data = await response.json();
			artifacts = data.artifacts || [];
		} catch (error) {
			console.error('Error loading artifacts:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) return;

		isUploading = true;
		uploadError = null;

		try {
			for (const file of Array.from(files)) {
				// Validate file type
				const extension = file.name.toLowerCase().split('.').pop();
				const allowedTypes = ['docx', 'pdf', 'txt', 'md', 'json'];

				if (!extension || !allowedTypes.includes(extension)) {
					uploadError = `File type .${extension} is not supported. Please upload: ${allowedTypes.join(', ')}`;
					continue;
				}

				const formData = new FormData();
				formData.append('file', file);

				const response = await fetch('/api/projects/null/artifacts', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					throw new Error(`Failed to upload ${file.name}`);
				}

				const data = await response.json();
				artifacts = [...artifacts, data.artifact];
			}

			// Clear file input
			if (fileInput) {
				fileInput.value = '';
			}
		} catch (error) {
			console.error('Error uploading file:', error);
			uploadError = error instanceof Error ? error.message : 'Failed to upload file';
		} finally {
			isUploading = false;
		}
	}

	function formatFileSize(url: string): string {
		// This is a placeholder - in production you might want to track file size
		return 'N/A';
	}

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString();
	}

	async function handleDelete(artifactId: number) {
		deletingId = artifactId;
		deleteError = null;

		try {
			const response = await fetch(`/api/projects/null/artifacts?artifactId=${artifactId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete artifact');
			}

			// Remove from local state
			artifacts = artifacts.filter((a) => a.id !== artifactId);
		} catch (error) {
			console.error('Error deleting artifact:', error);
			deleteError = error instanceof Error ? error.message : 'Failed to delete artifact';
		} finally {
			deletingId = null;
		}
	}

	function handleEdit(artifact: Artifact) {
		editingId = artifact.id;
		editedContent = artifact.file_content || '';
		saveError = null;
	}

	function handleCancelEdit() {
		editingId = null;
		editedContent = '';
		saveError = null;
	}

	async function handleSave(artifactId: number) {
		isSaving = true;
		saveError = null;

		try {
			const response = await fetch(`/api/projects/null/artifacts?artifactId=${artifactId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ file_content: editedContent })
			});

			if (!response.ok) {
				throw new Error('Failed to save artifact');
			}

			const data = await response.json();

			// Update local state
			artifacts = artifacts.map((a) => (a.id === artifactId ? data.artifact : a));

			// Close the edit form
			editingId = null;
			editedContent = '';
		} catch (error) {
			console.error('Error saving artifact:', error);
			saveError = error instanceof Error ? error.message : 'Failed to save artifact';
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="card">
	<div class="mb-4 flex text-sm text-slate-600">
		<a href="/" class="link">
			<span>Dashboard</span>
		</a>
		<span class="mx-1">/</span>
		<span>Policy Manager</span>
	</div>

	<h1 class="mb-6">Policy Manager</h1>

	<div class="mb-6">
		<p class="mb-4 text-slate-600">
			Upload policy documents to be used for contract analysis. Supported formats: .docx, .pdf,
			.txt, .md, .json
		</p>

		<!-- File Upload Section -->
		<div class="mt-12 flex justify-center">
			{#if isUploading}
				<Spinner />
			{:else}
				<div>
					<label for="file-upload" class="btn btn-primary cursor-pointer items-center text-center">
						<i class="bi-upload mr-2 pl-4"></i>
						<span class="pr-4">Upload Policy or Example Agreement</span>
					</label>
					<input
						bind:this={fileInput}
						id="file-upload"
						type="file"
						multiple
						accept=".docx,.pdf,.txt,.md,.json"
						onchange={handleFileUpload}
						class="hidden"
						disabled={isUploading}
					/>
				</div>
			{/if}
		</div>

		{#if uploadError}
			<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
				<i class="bi-exclamation-triangle mr-2"></i>
				{uploadError}
			</div>
		{/if}

		{#if deleteError}
			<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
				<i class="bi-exclamation-triangle mr-2"></i>
				{deleteError}
			</div>
		{/if}
	</div>

	<!-- Artifacts List -->
	<div class="mt-12">
		<h3 class="mb-4">Policies and Example Agreements</h3>

		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<Spinner />
			</div>
		{:else if artifacts.length === 0}
			<div class="rounded-md bg-slate-50 p-6 text-center text-slate-400">
				<i class="bi-file-earmark-text mb-2 text-4xl"></i>
				<p>No documents uploaded yet</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-lg border border-slate-200">
				<table class="min-w-full divide-y divide-slate-200">
					<thead class="bg-slate-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
							>
								File Name
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
							>
								Status
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200 bg-white">
						{#each artifacts as artifact, index (artifact.id)}
							<tr class="hover:bg-slate-50" in:slide out:slide>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<i class="bi-file-earmark-text mr-3 text-lg text-slate-400"></i>
										<div>
											<div class="text-sm font-medium text-slate-900">{artifact.file_name}</div>
											{#if artifact.file_content}
												<div class="text-xs text-slate-500">
													Content extracted ({artifact.file_content.length.toLocaleString()} characters)
												</div>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if artifact.file_content}
										<span
											class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"
										>
											<i class="bi-check-circle mr-1"></i>
											Processed
										</span>
									{:else}
										<span
											class="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800"
										>
											<i class="bi-exclamation-circle mr-1"></i>
											No Content
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap">
									<div class="flex items-center gap-2">
										<button
											onclick={() => handleEdit(artifact)}
											disabled={editingId !== null || !artifact.file_content}
											class="btn btn-bg"
											aria-label="Edit"
											title={artifact.file_content ? 'Edit content' : 'No content to edit'}
										>
											<i class="bi-pencil"></i>
										</button>
										<a
											href={artifact.file_url}
											target="_blank"
											rel="noopener noreferrer"
											class="btn btn-bg"
											aria-label="Download"
										>
											<i class="bi-download"></i>
										</a>
										<button
											onclick={() => handleDelete(artifact.id)}
											disabled={deletingId === artifact.id}
											class="btn btn-bg"
											aria-label="Delete"
										>
											{#if deletingId === artifact.id}
												<i class="bi-hourglass-split"></i>
											{:else}
												<i class="bi-trash"></i>
											{/if}
										</button>
									</div>
								</td>
							</tr>
							{#if editingId === artifact.id}
								<tr transition:slide>
									<td colspan="3" class="bg-slate-50 px-6 py-4">
										<div class="space-y-4">
											<div>
												<div class="mb-2 flex justify-between px-6">
													<p class="font-bold">Edit content of {artifact.file_name}</p>
													<button onclick={handleCancelEdit} aria-label="Close" class="link">
														<i class="bi bi-x-lg"></i>
													</button>
												</div>
												<textarea
													bind:value={editedContent}
													rows="15"
													class="text-input w-full font-mono"
													placeholder="Enter content..."
												></textarea>
											</div>

											{#if saveError}
												<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">
													<i class="bi-exclamation-triangle mr-2"></i>
													{saveError}
												</div>
											{/if}

											<div class="flex justify-end gap-4">
												<button
													onclick={handleCancelEdit}
													disabled={isSaving}
													class="btn btn-outline"
												>
													Cancel
												</button>
												<button
													onclick={() => handleSave(artifact.id)}
													disabled={isSaving}
													class="btn btn-primary"
												>
													{#if isSaving}
														<i class="bi-hourglass-split mr-2"></i>
														Saving...
													{:else}
														<i class="bi-check-lg mr-2"></i>
														Save
													{/if}
												</button>
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
