<script lang="ts">
	import { AGREEMENT_TYPES } from '$lib/schema';
	let {
		agreementType = $bindable(''),
		counterparty = $bindable('')
	}: {
		agreementType?: string;
		counterparty?: string;
	} = $props();
</script>

<div class="space-y-4">
	<div>
		<label for="agreement-type-internal" class="mb-1 block text-sm text-slate-700">
			Agreement Type <span class="text-red-500">*</span>
		</label>
		<select id="agreement-type-internal" bind:value={agreementType} required class="w-full">
			<option value="" disabled>Select agreement type...</option>
			{#each AGREEMENT_TYPES as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
	</div>

	<div>
		<label for="counterparty" class="mb-1 block text-sm text-slate-700">
			Counterparty <span class="text-red-500">*</span>
		</label>
		<input
			id="counterparty"
			type="text"
			bind:value={counterparty}
			placeholder="Enter counterparty name..."
			required
			class="text-input"
		/>
	</div>
</div>
