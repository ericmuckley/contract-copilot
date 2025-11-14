<script lang="ts">
	import type { Artifact } from '$lib/types/project';

	let {
		projectId,
		artifacts = [],
		onRefresh
	}: {
		projectId: number;
		artifacts?: Artifact[];
		onRefresh: () => void;
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
				formData.append('artifact_type', 'document');

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
			onRefresh();
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			isUploading = false;
		}
	}

	function formatFileSize(url: string): string {
		return 'Unknown size';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-4">
	<div class="card bg-white">
		<h3 class="mb-4 text-lg font-semibold text-slate-800">Upload Artifacts</h3>
		<p class="mb-4 text-sm text-slate-600">
			Upload documents, transcripts, notes, or any other files that provide context for this
			project. At least 2 artifacts are required to advance to the next stage.
		</p>

		<div class="mb-4">
			<label
				for="artifact-upload"
				class="inline-flex cursor-pointer items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 {isUploading
					? 'cursor-not-allowed opacity-50'
					: ''}"
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
				accept=".pdf,.doc,.docx,.txt,.md"
				class="hidden"
			/>
		</div>

		{#if uploadError}
			<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<i class="bi bi-exclamation-triangle-fill mr-2"></i>
				{uploadError}
			</div>
		{/if}

		{#if artifacts.length < 2}
			<div class="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
				<i class="bi bi-exclamation-circle mr-2"></i>
				You need at least {2 - artifacts.length} more artifact{artifacts.length === 1
					? ''
					: 's'} to advance to the next stage.
			</div>
		{/if}
	</div>

	{#if artifacts.length > 0}
		<div class="card bg-white">
			<h3 class="mb-4 text-lg font-semibold text-slate-800">
				Uploaded Artifacts ({artifacts.length})
			</h3>
			<div class="space-y-2">
				{#each artifacts as artifact (artifact.id)}
					<div
						class="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
					>
						<div class="flex items-center space-x-3">
							<i class="bi bi-file-earmark-text text-2xl text-slate-400"></i>
							<div>
								<div class="font-medium text-slate-800">{artifact.file_name}</div>
								<div class="text-xs text-slate-500">
									Uploaded {formatDate(artifact.uploaded_at)}
									{#if artifact.artifact_type}
										• {artifact.artifact_type}
									{/if}
								</div>
							</div>
						</div>
						<div class="flex items-center space-x-2">
							<a
								href={artifact.file_url}
								target="_blank"
								class="rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
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
