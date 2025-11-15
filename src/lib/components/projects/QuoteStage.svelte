<script lang="ts">
	import type { QuoteRate, EstimateTask } from '$lib/types/project';

	let {
		projectId,
		paymentTerms = null,
		timeline = null,
		isDelivered = false,
		rates = [],
		tasks = [],
		onRefresh
	}: {
		projectId: number;
		paymentTerms?: string | null;
		timeline?: string | null;
		isDelivered?: boolean;
		rates?: QuoteRate[];
		tasks?: EstimateTask[];
		onRefresh: () => void;
	} = $props();

	let isEditing = $state(false);
	let editedPaymentTerms = $state(paymentTerms || '');
	let editedTimeline = $state(timeline || '');
	let editedRates = $state<Array<{ role_name: string; rate_per_hour: number }>>([...rates]);
	let isSaving = $state(false);
	let error = $state('');

	// Get unique roles from tasks
	const uniqueRoles = $derived(Array.from(new Set(tasks.map((t) => t.assigned_role))).sort());

	// Calculate total cost
	const totalCost = $derived(() => {
		let total = 0;
		for (const task of tasks) {
			const rate = editedRates.find((r) => r.role_name === task.assigned_role);
			if (rate) {
				total += Number(task.hours) * Number(rate.rate_per_hour);
			}
		}
		return total;
	});

	// Initialize rates from unique roles if not already set
	$effect(() => {
		if (editedRates.length === 0 && uniqueRoles.length > 0) {
			editedRates = uniqueRoles.map((role) => ({
				role_name: role,
				rate_per_hour: 0
			}));
		}
	});

	async function saveQuote() {
		isSaving = true;
		error = '';

		try {
			const response = await fetch(`/api/projects/${projectId}/quote`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					payment_terms: editedPaymentTerms,
					timeline: editedTimeline,
					is_delivered: isDelivered,
					rates: editedRates
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save quote');
			}

			isEditing = false;
			onRefresh();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Save failed';
		} finally {
			isSaving = false;
		}
	}

	function startEditing() {
		editedPaymentTerms = paymentTerms || '';
		editedTimeline = timeline || '';
		editedRates =
			rates.length > 0
				? [...rates.map((r) => ({ role_name: r.role_name, rate_per_hour: r.rate_per_hour }))]
				: uniqueRoles.map((role) => ({ role_name: role, rate_per_hour: 0 }));
		isEditing = true;
	}

	function cancelEditing() {
		editedPaymentTerms = paymentTerms || '';
		editedTimeline = timeline || '';
		editedRates = [
			...rates.map((r) => ({ role_name: r.role_name, rate_per_hour: r.rate_per_hour }))
		];
		isEditing = false;
		error = '';
	}

	function exportToCSV() {
		const headers = ['Task', 'Role', 'Hours', 'Rate/Hour', 'Cost'];
		const rows = tasks.map((task) => {
			const rate = rates.find((r) => r.role_name === task.assigned_role);
			const ratePerHour = rate ? rate.rate_per_hour : 0;
			const cost = Number(task.hours) * Number(ratePerHour);
			return [task.task_description, task.assigned_role, task.hours, ratePerHour, cost.toFixed(2)];
		});

		const csv = [headers, ...rows]
			.map((row) => row.map((cell) => `"${cell}"`).join(','))
			.join('\n');

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `quote-project-${projectId}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function copyToClipboard() {
		const text = generateQuoteText();
		navigator.clipboard.writeText(text).then(() => {
			alert('Quote copied to clipboard!');
		});
	}

	function generateQuoteText(): string {
		let text = `PROJECT QUOTE\n\n`;
		text += `Payment Terms:\n${paymentTerms || 'Not specified'}\n\n`;
		text += `Timeline:\n${timeline || 'Not specified'}\n\n`;
		text += `COST BREAKDOWN:\n\n`;

		const roleHours: Record<string, number> = {};
		tasks.forEach((task) => {
			roleHours[task.assigned_role] = (roleHours[task.assigned_role] || 0) + Number(task.hours);
		});

		for (const [role, hours] of Object.entries(roleHours)) {
			const rate = rates.find((r) => r.role_name === role);
			const ratePerHour = rate ? rate.rate_per_hour : 0;
			const cost = hours * Number(ratePerHour);
			text += `${role}: ${hours} hours × $${ratePerHour}/hr = $${cost.toFixed(2)}\n`;
		}

		text += `\nTOTAL: $${totalCost().toFixed(2)}`;
		return text;
	}
</script>

<div class="space-y-4">
	<div class="card bg-white">
		<h3 class="mb-4 text-lg font-semibold text-slate-800">Quote</h3>
		<p class="mb-4 text-sm text-slate-600">
			Set rates for each role, define payment terms and timeline, then export or copy your quote.
		</p>

		{#if !paymentTerms && !isEditing && rates.length === 0}
			<button onclick={startEditing} class="btn btn-primary">
				<i class="bi bi-plus-lg mr-2"></i>
				Create Quote
			</button>
		{/if}

		{#if (paymentTerms || rates.length > 0) && !isEditing}
			<div class="space-y-6">
				<div>
					<h4 class="mb-2 font-semibold text-slate-700">Rates:</h4>
					<div class="overflow-x-auto">
						<table class="w-full border-collapse">
							<thead>
								<tr class="border-b border-slate-200 bg-slate-50">
									<th class="px-4 py-2 text-left text-sm font-semibold text-slate-700">Role</th>
									<th class="px-4 py-2 text-left text-sm font-semibold text-slate-700">
										Rate/Hour
									</th>
									<th class="px-4 py-2 text-left text-sm font-semibold text-slate-700">
										Total Hours
									</th>
									<th class="px-4 py-2 text-right text-sm font-semibold text-slate-700">Cost</th>
								</tr>
							</thead>
							<tbody>
								{#each uniqueRoles as role (role)}
									{@const rate = rates.find((r) => r.role_name === role)}
									{@const ratePerHour = rate ? rate.rate_per_hour : 0}
									{@const totalHoursForRole = tasks
										.filter((t) => t.assigned_role === role)
										.reduce((sum, t) => sum + Number(t.hours), 0)}
									{@const cost = totalHoursForRole * Number(ratePerHour)}
									<tr class="border-b border-slate-100">
										<td class="px-4 py-2 text-sm">{role}</td>
										<td class="px-4 py-2 text-sm">${ratePerHour}/hr</td>
										<td class="px-4 py-2 text-sm">{totalHoursForRole} hrs</td>
										<td class="px-4 py-2 text-right text-sm">${cost.toFixed(2)}</td>
									</tr>
								{/each}
								<tr class="bg-slate-50 font-semibold">
									<td class="px-4 py-2 text-sm" colspan="3">Total Cost</td>
									<td class="px-4 py-2 text-right text-sm">${totalCost().toFixed(2)}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{#if paymentTerms}
					<div>
						<h4 class="mb-2 font-semibold text-slate-700">Payment Terms:</h4>
						<div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
							<p class="text-sm whitespace-pre-wrap">{paymentTerms}</p>
						</div>
					</div>
				{/if}

				{#if timeline}
					<div>
						<h4 class="mb-2 font-semibold text-slate-700">Timeline:</h4>
						<div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
							<p class="text-sm whitespace-pre-wrap">{timeline}</p>
						</div>
					</div>
				{/if}

				<div class="flex flex-wrap gap-2">
					<button onclick={startEditing} class="btn bg-slate-500 text-white hover:bg-slate-600">
						<i class="bi bi-pencil mr-2"></i>
						Edit
					</button>
					<button onclick={exportToCSV} class="btn btn-primary">
						<i class="bi bi-download mr-2"></i>
						Export CSV
					</button>
					<button onclick={copyToClipboard} class="btn btn-primary">
						<i class="bi bi-clipboard mr-2"></i>
						Copy to Clipboard
					</button>
				</div>
			</div>
		{/if}

		{#if isEditing}
			<div class="space-y-6">
				<div>
					<p class="mb-2 block text-sm font-semibold">Rates:</p>
					<div class="space-y-2">
						{#each editedRates as rate (rate.role_name)}
							<div class="grid grid-cols-2 gap-2">
								<input
									type="text"
									value={rate.role_name}
									disabled
									class="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
								/>
								<input
									type="number"
									bind:value={rate.rate_per_hour}
									placeholder="Rate per hour"
									min="0"
									step="0.01"
									class="rounded border border-slate-300 px-3 py-2 text-sm"
								/>
							</div>
						{/each}
					</div>
				</div>

				<div>
					<p class="mb-2 block text-sm font-semibold">Payment Terms:</p>
					<textarea
						bind:value={editedPaymentTerms}
						rows="4"
						class="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
						placeholder="e.g., Net 30, 50% upfront 50% on completion..."
					></textarea>
				</div>

				<div>
					<p class="mb-2 block text-sm font-semibold">Timeline:</p>
					<textarea
						bind:value={editedTimeline}
						rows="4"
						class="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
						placeholder="e.g., 8 weeks from project start..."
					></textarea>
				</div>

				<div class="flex space-x-2">
					<button
						onclick={saveQuote}
						disabled={isSaving}
						class="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSaving}
							<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
							Saving...
						{:else}
							<i class="bi bi-check-lg mr-2"></i>
							Save
						{/if}
					</button>
					<button onclick={cancelEditing} disabled={isSaving} class="btn bg-slate-500 text-white">
						Cancel
					</button>
				</div>
			</div>
		{/if}

		{#if error}
			<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				<i class="bi bi-exclamation-triangle-fill mr-2"></i>
				{error}
			</div>
		{/if}
	</div>
</div>
