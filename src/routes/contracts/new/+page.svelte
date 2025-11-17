<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Agreement } from '$lib/schema';
	import CreateFromClient from '$lib/components/contracts/CreateFromClient.svelte';
	import CreateFromInternal from '$lib/components/contracts/CreateFromInternal.svelte';
	import ApproverNameInput from '$lib/components/ApproverNameInput.svelte';

	const originOptions = [
		{
			id: 'client',
			title: 'Use documents from client',
			icon: 'bi-person-fill-up',
			description:
				'Create a new agreement based on documents submitted by a client, which we will evaluate and refine.'
		},
		{
			id: 'internal',
			title: 'Use internal documents',
			icon: 'bi-folder2-open',
			description:
				'Create a new agreement based on our own internal policy documents and previous projects.'
		}
	];

	let createdBy = $state('');
	let origin = $state<'client' | 'internal'>('client');
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
						onclick={() => (origin = option.id as 'client' | 'internal')}
						class="rounded-lg border-2 p-4 text-left transition-all duration-200 hover:shadow-md
                            {origin === option.id
							? 'border-sky-600 bg-sky-50 shadow-lg'
							: 'border-slate-200 bg-white hover:border-slate-600'}"
					>
						<div class="standard mb-1 font-bold">
							<i class="bi {option.icon} mr-2 text-2xl"></i>
							{option.title}
						</div>
						<p class="text-sm">
							{option.description}
						</p>
					</button>
				{/each}
			</div>

			<!-- Approver Name Input (always shown) -->
			<div class="mt-8">
				<ApproverNameInput bind:value={createdBy} placeholder="Created by" />
			</div>

			<!-- Conditional Component Rendering -->
			<div class="mt-8">
				{#if origin === 'client'}
					<div in:fade>
						<CreateFromClient {origin} {createdBy} />
					</div>
				{:else}
					<div in:fade>
						<CreateFromInternal {origin} {createdBy} />
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
