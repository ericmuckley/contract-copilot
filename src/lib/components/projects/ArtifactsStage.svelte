<script lang="ts">
	import type { Artifact } from '$lib/schema';
	import Spinner from '../Spinner.svelte';

	let {
		projectId,
		artifacts = [],
		onRefresh
	}: {
		projectId: number;
		artifacts?: Artifact[];
		onRefresh: () => Promise<void>;
	} = $props();

	let isUploading = $state(false);
	let uploadError = $state('');

	async function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target.files;

		if (!files || files.length === 0) return;

		isUploading = true;
		uploadError = '';

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const formData = new FormData();
				formData.append('file', file);

				const response = await fetch(`/api/projects/${projectId}/artifacts`, {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					throw new Error(`Failed to upload ${file.name}`);
				}
			}

			// Reset input
			target.value = '';

			// Refresh artifacts list
			await onRefresh();
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="">
		<h1 class="mb-4">Upload Artifacts</h1>
		<p class="standard mb-4 text-sm">
			Upload documents, transcripts, notes, or any other files that provide context for this
			project. At least 2 artifacts are required to advance to the next stage.
		</p>

		{#if isUploading}
			<div class="my-4 flex justify-center">
				<Spinner />
			</div>
		{:else}
			<div class="mb-4">
				<label
					for="artifact-upload"
					class="btn btn-primary flex cursor-pointer items-center justify-center space-x-2 rounded-lg text-center"
				>
					<i class="bi bi-upload"></i>
					<span>{isUploading ? 'Uploading...' : 'Upload Files'}</span>
				</label>
				<input
					id="artifact-upload"
					type="file"
					multiple
					onchange={handleFileUpload}
					disabled={isUploading}
					accept=".pdf,.docx,.txt,.md,.json"
					class="hidden"
				/>
			</div>
		{/if}

		{#if uploadError}
			<div class="my-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<i class="bi bi-exclamation-triangle-fill mr-2"></i>
				{uploadError}
			</div>
		{/if}

		{#if artifacts.length < 2}
			<div class="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
				<i class="bi bi-exclamation-circle mr-2"></i>
				You need at least {2 - artifacts.length} more artifact{artifacts.length === 1 ? '' : 's'} to
				advance to the next stage.
			</div>
		{/if}
	</div>

	{#if artifacts.length > 0}
		<div class="">
			<div class="space-y-2">
				{#each artifacts as artifact (artifact.id)}
					<div
						class="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
					>
						<div class="flex items-center space-x-3">
							<i class="bi bi-file-earmark-text muted text-2xl"></i>
							<div>
								<div class="font-medium text-slate-800">{artifact.file_name}</div>
							</div>
						</div>
						<div class="flex items-center space-x-2">
							<a
								href={artifact.file_url}
								target="_blank"
								class="rounded px-3 py-1 text-sm text-sky-600 hover:bg-sky-50"
							>
								<i class="bi bi-download"></i>
								Download
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
