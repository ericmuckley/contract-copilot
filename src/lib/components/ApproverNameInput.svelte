<script lang="ts">
	let {
		value = $bindable(''),
		required = true,
		disabled = false,
		placeholder = 'Approver name'
	}: {
		value?: string;
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
	} = $props();
</script>

<div class="space-y-1">
	<label for="approver-name" class="block text-sm text-slate-700">
		{placeholder} <span class="text-red-500">{required ? '*' : ''}</span>
	</label>
	<input
		id="approver-name"
		type="text"
		bind:value
		{required}
		placeholder={`Enter ${placeholder.toLowerCase()}...`}
		{disabled}
		class="text-input"
	/>
</div>
