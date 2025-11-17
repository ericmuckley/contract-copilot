<script lang="ts">
	let {
		origin,
		createdBy
	}: {
		origin: string;
		createdBy: string;
	} = $props();

	let fileInput: HTMLInputElement;
	let uploadedFiles = $state<File[]>([]);

	// TODO: Populate agreement type and name from LLM
	let agreementType = $state<string>('SOW');
	let agreementName = $state<string>('');

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			uploadedFiles = Array.from(target.files);
		}
	}

	function removeFile(index: number) {
		uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
	}
</script>

<div class="space-y-4">
	<div>
		<label for="agreement-name" class="mb-1 block text-sm text-slate-700">
			Agreement Name <span class="text-red-500">*</span>
		</label>
		<input
			id="agreement-name"
			type="text"
			bind:value={agreementName}
			placeholder="Enter agreement name..."
			required
			class="text-input"
		/>
	</div>

	<div>
		<label for="file-upload" class="mb-1 block text-sm text-slate-700">
			Upload Agreement Files <span class="text-red-500">*</span>
		</label>
		<input
			id="file-upload"
			type="file"
			multiple
			accept=".pdf,.doc,.docx,.txt"
			onchange={handleFileChange}
			bind:this={fileInput}
			class="hidden"
		/>
		<button
			type="button"
			onclick={() => fileInput.click()}
			class="btn btn-outline flex w-full items-center justify-center gap-2"
		>
			<i class="bi bi-cloud-upload"></i>
			Choose Files
		</button>

		{#if uploadedFiles.length > 0}
			<div class="mt-3 space-y-2">
				<p class="text-sm font-semibold text-slate-600">Selected files:</p>
				{#each uploadedFiles as file, i}
					<div class="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2">
						<div class="flex items-center gap-2">
							<i class="bi bi-file-earmark text-slate-500"></i>
							<span class="text-sm text-slate-700">{file.name}</span>
							<span class="text-xs text-slate-500">
								({(file.size / 1024).toFixed(1)} KB)
							</span>
						</div>
						<button
							type="button"
							onclick={() => removeFile(i)}
							class="link"
							aria-label={`Remove ${file.name}`}
						>
							<i class="bi bi-x-lg"></i>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Submit Button 
<div class="mt-12 flex justify-end gap-4">
	<a href="/" class="btn btn-outline">Cancel</a>
	<button
		class="btn btn-primary"
		onclick={handleSubmit}
		disabled={createdBy.trim() === '' || !selectedOrigin || !agreementType?.trim()?.length}
	>
		Create Agreement
	</button>
</div>
-->
