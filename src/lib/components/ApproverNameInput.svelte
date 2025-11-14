<script lang="ts">
	let {
		value = $bindable(''),
		required = true,
		placeholder = 'Enter your name'
	}: {
		value?: string;
		required?: boolean;
		placeholder?: string;
	} = $props();
</script>

<div class="space-y-2">
	<label for="approver-name" class="block text-sm font-semibold text-slate-700">
		Approved By {required ? '*' : ''}
	</label>
	<input
		id="approver-name"
		type="text"
		bind:value
		{required}
		{placeholder}
		class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
	/>
	{#if required}
		<p class="text-xs text-slate-500">Required to advance to the next stage</p>
	{/if}
</div>
