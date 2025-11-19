<script lang="ts">
	import Spinner from '$lib/components/Spinner.svelte';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import { reviewAgreementPrompt } from '$lib/prompts';
	import type { Agreement } from '$lib/schema';
	import { safeJsonParse, applyEditsToText, saveNewAgreement } from '$lib/utils';

	let {
		agreement
	}: {
		agreement: Agreement;
	} = $props();

	let isReviewing = $state(false);
	let isApplyingChanges = $state(false);
	let edits = $state<{ old: string; new: string; note: string; checked: boolean }[]>([]);
	let reviewError = $state('');
	let streamingText = $state('');
	let hasEdits = $state(false);
	let applyError = $state('');

	async function reviewAgreement() {
		if (!agreement?.text_content) {
			reviewError = 'No agreement text available to review.';
			return;
		}

		isReviewing = true;
		reviewError = '';
		edits = [];
		streamingText = '';
		hasEdits = false;

		try {
			// Fetch the policy text
			const policyResponse = await fetch('/api/policies');
			const policyData = await policyResponse.json();
			const policyText = policyData.text;

			if (!policyText) {
				throw new Error('No policy text available.');
			}

			// Build the prompt
			const prompt = reviewAgreementPrompt(policyText, agreement.text_content);

			// Call the Bedrock API
			const response = await fetch('/api/bedrock', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [{ role: 'user', content: [{ text: prompt }] }],
					systemMessages: [
						{
							text: 'You are a legal contract review assistant. Always respond with valid JSON only.'
						}
					],
					useTools: false
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get review from AI');
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let accumulatedText = '';
			let buffer = '';

			if (reader) {
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
								accumulatedText += data.text;
								streamingText = accumulatedText;
							}
						} catch {
							console.error('Failed to parse line:', line);
						}
					}
				}
			}

			// Parse the JSON response
			try {
				console.log(accumulatedText);
				const result = safeJsonParse(accumulatedText, []);
				if (Array.isArray(result)) {
					// Add checked property to each edit (default to true)
					edits = result.map((edit) => ({ ...edit, checked: true }));
					hasEdits = true;
					streamingText = '';
				} else {
					throw new Error('Invalid response format from AI');
				}
			} catch (parseError) {
				console.error('Failed to parse AI response:', accumulatedText);
				throw new Error('Failed to parse AI response. Please try again.');
			}
		} catch (error) {
			console.error('Review error:', error);
			reviewError = error instanceof Error ? error.message : 'Failed to review agreement';
			streamingText = '';
		} finally {
			isReviewing = false;
		}
	}

	async function applyChanges() {
		if (!agreement?.id || !edits?.length) {
			applyError = 'No agreement or edits to apply';
			return;
		}

		// Filter to only include checked edits
		const checkedEdits = edits.filter((edit) => edit.checked);

		if (checkedEdits.length === 0) {
			applyError = 'Please select at least one edit to apply';
			return;
		}

		isApplyingChanges = true;
		applyError = '';

		try {
			// Step 1: Save edits to the database in JSONB format
			const updateResponse = await fetch(`/api/agreements/${agreement.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ edits: checkedEdits })
			});

			if (!updateResponse.ok) {
				throw new Error('Failed to save edits to database');
			}

			// Step 2: Apply edits to text_content (only checked ones)
			const updatedTextContent = applyEditsToText(agreement.text_content, checkedEdits);

			// Step 3: Save a new version of the agreement with updated text_content
			const newAgreement = await saveNewAgreement({
				origin: agreement.origin,
				created_by: agreement.created_by,
				agreement_name: agreement.agreement_name,
				agreement_type: agreement.agreement_type,
				counterparty: agreement.counterparty || '',
				text_content: updatedTextContent,
				root_id: agreement.root_id,
				version_number: (agreement.version_number || 1) + 1
			});

			if (!newAgreement) {
				throw new Error('Failed to save new agreement version');
			}

			// Success! Redirect to the new version
			window.location.href = `/contracts/${newAgreement.root_id}`;
		} catch (error) {
			console.error('Error applying changes:', error);
			applyError = error instanceof Error ? error.message : 'Failed to apply changes';
		}
	}

	function cancelEdits() {
		edits = [];
		hasEdits = false;
		applyError = '';
	}

	function toggleAllEdits() {
		const allChecked = edits.every((edit) => edit.checked);
		edits = edits.map((edit) => ({ ...edit, checked: !allChecked }));
	}

	/*
    const exampleEdits = [
        {
            old: "The lessee shall maintain insurance coverage.",
            new: "The lessee is required to maintain insurance coverage at all times during the lease period.",
            note: "Clarified the obligation of the lessee regarding insurance coverage."
        },
        {
            old: "Payment is due within 30 days of invoice receipt.",
            new: "Payment must be made within 30 days from the date the invoice is received by the payer.",
            note: "Specified the starting point for the payment due date."
        }
    ];

    hasEdits = true;
    edits = exampleEdits;
    */
</script>

<div class="mt-8">
	{#if hasEdits}
		<div class="mt-6">
			<div class="mb-4 flex items-center justify-between">
				<h2>Suggested Edits</h2>
				<button class="btn btn-sm btn-outline" onclick={toggleAllEdits}>
					{edits.every((edit) => edit.checked) ? 'Deselect All' : 'Select All'}
				</button>
			</div>

			{#if edits?.length}
				<div class="space-y-4">
					{#each edits as edit, index}
						<div class="card border border-slate-200">
							<div class="flex gap-3">
								<div class="shrink-0 pt-1">
									<input
										type="checkbox"
										bind:checked={edit.checked}
										class="h-5 w-5 cursor-pointer"
										id="edit-{index}"
									/>
								</div>
								<label for="edit-{index}" class="flex-1 cursor-pointer">
									{#if edit.note?.length}
										<p>
											<span class="font-bold">
												Edit {index + 1}:
											</span>
											<span>
												{edit.note}
											</span>
										</p>
									{/if}

									{#if edit.old?.length}
										<div class="text-red-600">
											- {edit.old}
										</div>
									{/if}

									{#if edit.new?.length}
										<div class="text-green-600">
											+ {edit.new}
										</div>
									{/if}
								</label>
							</div>
						</div>
					{/each}
				</div>

				{#if applyError}
					<div class="mt-4 rounded-lg bg-red-100 px-4 py-3 text-red-800">
						{applyError}
					</div>
				{/if}

				{#if isApplyingChanges}
					<div class="my-4 flex justify-center">
						<Spinner />
					</div>
				{:else}
					<div class="mt-4 flex gap-2">
						<button class="btn btn-outline" onclick={cancelEdits} disabled={isApplyingChanges}>
							Cancel
						</button>
						<button class="btn btn-primary" onclick={applyChanges} disabled={isApplyingChanges}>
							Apply Changes
						</button>
					</div>
				{/if}
			{:else}
				<p class="mt-4">No edits suggested. The agreement appears to be compliant.</p>
			{/if}
		</div>
	{:else}
		<div class="mb-4">
			{#if isReviewing}
				<div class="my-4 flex justify-center">
					<Spinner />
				</div>
			{:else}
				<button class="btn btn-primary" onclick={reviewAgreement} disabled={isReviewing}>
					<i class="bi bi-pencil mr-2"></i>Review Agreement
				</button>
			{/if}
		</div>

		{#if reviewError}
			<div class="mb-4 rounded-lg bg-red-100 px-4 py-3 text-red-800">
				{reviewError}
			</div>
		{/if}

		{#if streamingText}
			<div class="card mb-4 max-h-96 overflow-y-auto bg-slate-100!">
				<LLMOutput text={streamingText} />
			</div>
		{/if}
	{/if}
</div>
