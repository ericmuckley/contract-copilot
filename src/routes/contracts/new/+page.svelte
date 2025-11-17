<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Agreement } from '$lib/schema';
	import CreateFromClient from '$lib/components/contracts/CreateFromClient.svelte';
	import CreateFromInternal from '$lib/components/contracts/CreateFromInternal.svelte';
	import ApproverNameInput from '$lib/components/ApproverNameInput.svelte';

	type Origin = 'client' | 'internal';

	const originOptions = [
		{
			id: 'client' as Origin,
			title: 'Use documents from client',
			icon: 'bi-person-fill-up',
			description:
				'Create a new agreement based on documents submitted by a client, which we will evaluate and refine.'
		},
		{
			id: 'internal' as Origin,
			title: 'Use internal documents',
			icon: 'bi-folder2-open',
			description:
				'Create a new agreement based on our own internal policy documents and previous projects.'
		}
	];

	let selectedOrigin = $state<Origin>('client');
	let createdBy = $state('');

	// Fields for client origin
	let agreementName = $state('');
	let agreementType = $state('');
	let description = $state('');
	let uploadedFiles = $state<File[]>([]);

	// Fields for internal origin
	let agreementTypeInternal = $state('');
	let counterparty = $state('');

	async function handleSubmit(event: Event) {
		event.preventDefault();

		// Build Agreement object based on selected origin
		const agreement: Partial<Agreement> = {
			root_id: crypto.randomUUID(),
			version_number: 1,
			origin: selectedOrigin,
			created_by: createdBy
		};

		if (selectedOrigin === 'client') {
			agreement.agreement_name = agreementName;
			// TODO: Handle file uploads here
		} else {
			agreement.agreement_name = `${agreementTypeInternal} - ${counterparty}`;
			agreement.agreement_type = agreementTypeInternal;
		}

		console.log('Agreement to create:', agreement);
		// TODO: Submit agreement to backend
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
		<h1>Create New Contract/Agreement</h1>

		<div class="mt-12">
			<!-- Origin Selection Cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each originOptions as option}
					<button
						type="button"
						onclick={() => (selectedOrigin = option.id)}
						class="rounded-lg border-2 p-4 text-left transition-all duration-200 hover:shadow-md
                            {selectedOrigin === option.id
							? 'border-sky-600 bg-sky-50 shadow-lg'
							: 'border-slate-200 bg-white hover:border-slate-600'}"
					>
						<div class="mb-1 font-bold text-slate-600">
							<i class="bi {option.icon} mr-2 text-2xl"></i>
							{option.title}
						</div>
						<p class="text-sm">
							{option.description}
						</p>
					</button>
				{/each}
			</div>

			<!-- Conditional Component Rendering -->
			<div class="mt-8 rounded-3xl border border-slate-200 px-6 py-6">
				{#if selectedOrigin === 'client'}
					<div in:fade>
						<CreateFromClient
							bind:agreementName
							bind:agreementType
							bind:description
							bind:uploadedFiles
						/>
					</div>
				{:else}
					<div in:fade>
						<CreateFromInternal bind:agreementType={agreementTypeInternal} bind:counterparty />
					</div>
				{/if}
			</div>

			<!-- Approver Name Input (always shown) -->
			<div class="mt-8">
				<ApproverNameInput bind:value={createdBy} placeholder="Created by" />
			</div>

			<!-- Submit Button -->
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
		</div>
	</div>
</div>
