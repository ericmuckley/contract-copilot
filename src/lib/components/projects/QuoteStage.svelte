<script lang="ts">
	import type { ProjectTask } from '$lib/schema';

	interface QuoteRate {
		role: string;
		rate: number;
	}

	let {
		projectId,
		stageIndex,
		content = null,
		tasks = [],
		onRefresh
	}: {
		projectId: number;
		stageIndex: number;
		content?: string | null;
		tasks?: ProjectTask[];
		onRefresh: () => void;
	} = $props();

	// Parse content if it exists (should contain payment terms, timeline, and rates as JSON)
	let quoteData = $state<{ paymentTerms: string; timeline: string; rates: QuoteRate[] }>({
		paymentTerms: '',
		timeline: '',
		rates: []
	});

	$effect(() => {
		if (content) {
			try {
				quoteData = JSON.parse(content);
			} catch {
				quoteData = { paymentTerms: content, timeline: '', rates: [] };
			}
		}
	});

	let isEditing = $state(false);
	let editedPaymentTerms = $state('');
	let editedTimeline = $state('');
	let editedRates = $state<QuoteRate[]>([]);
	let isSaving = $state(false);
	let error = $state('');

	// Initialize edited values when quoteData changes
	$effect(() => {
		if (!isEditing) {
			editedPaymentTerms = quoteData.paymentTerms || '';
			editedTimeline = quoteData.timeline || '';
			editedRates = [...quoteData.rates];
		}
	});

	// Get unique roles from tasks
	const uniqueRoles = $derived(Array.from(new Set(tasks.map((t) => t.role))).sort());

	// Calculate total cost
	const totalCost = $derived(() => {
		let total = 0;
		for (const task of tasks) {
			const rate = editedRates.find((r) => r.role === task.role);
			if (rate) {
				total += Number(task.hours) * Number(rate.rate);
			}
		}
		return total;
	});

	// Initialize rates from unique roles if not already set
	$effect(() => {
		if (editedRates.length === 0 && uniqueRoles.length > 0) {
			editedRates = uniqueRoles.map((role) => ({
				role: role,
				rate: 0
			}));
		}
	});

	async function saveQuote() {
		isSaving = true;
		error = '';

		try {
			const quoteContent = JSON.stringify({
				paymentTerms: editedPaymentTerms,
				timeline: editedTimeline,
				rates: editedRates
			});

			const response = await fetch(`/api/projects/${projectId}/stage-content`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					stageIndex,
					content: quoteContent
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
		editedPaymentTerms = quoteData.paymentTerms || '';
		editedTimeline = quoteData.timeline || '';
		editedRates =
			quoteData.rates.length > 0
				? [...quoteData.rates]
				: uniqueRoles.map((role) => ({ role: role, rate: 0 }));
		isEditing = true;
	}

	function cancelEditing() {
		editedPaymentTerms = quoteData.paymentTerms || '';
		editedTimeline = quoteData.timeline || '';
		editedRates = [...quoteData.rates];
		isEditing = false;
		error = '';
	}

	function exportToCSV() {
		const headers = ['Task', 'Role', 'Hours', 'Rate/Hour', 'Cost'];
		const rows = tasks.map((task) => {
			const rate = quoteData.rates.find((r) => r.role === task.role);
			const ratePerHour = rate ? rate.rate : 0;
			const cost = Number(task.hours) * Number(ratePerHour);
			return [task.description, task.role, task.hours, ratePerHour, cost.toFixed(2)];
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
		text += `Payment Terms:\n${quoteData.paymentTerms || 'Not specified'}\n\n`;
		text += `Timeline:\n${quoteData.timeline || 'Not specified'}\n\n`;
		text += `COST BREAKDOWN:\n\n`;

		const roleHours: Record<string, number> = {};
		tasks.forEach((task) => {
			roleHours[task.role] = (roleHours[task.role] || 0) + Number(task.hours);
		});

		for (const [role, hours] of Object.entries(roleHours)) {
			const rate = quoteData.rates.find((r) => r.role === role);
			const ratePerHour = rate ? rate.rate : 0;
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

		{#if !content && !isEditing}
			<button onclick={startEditing} class="btn btn-primary">
				<i class="bi bi-plus-lg mr-2"></i>
				Create Quote
			</button>
		{/if}

		{#if content && !isEditing}
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
									{@const rate = quoteData.rates.find((r) => r.role === role)}
									{@const ratePerHour = rate ? rate.rate : 0}
									{@const totalHoursForRole = tasks
										.filter((t) => t.role === role)
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

				{#if quoteData.paymentTerms}
					<div>
						<h4 class="mb-2 font-semibold text-slate-700">Payment Terms:</h4>
						<div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
							<p class="text-sm whitespace-pre-wrap">{quoteData.paymentTerms}</p>
						</div>
					</div>
				{/if}

				{#if quoteData.timeline}
					<div>
						<h4 class="mb-2 font-semibold text-slate-700">Timeline:</h4>
						<div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
							<p class="text-sm whitespace-pre-wrap">{quoteData.timeline}</p>
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
						{#each editedRates as rate (rate.role)}
							<div class="grid grid-cols-2 gap-2">
								<input
									type="text"
									value={rate.role}
									disabled
									class="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
								/>
								<input
									type="number"
									bind:value={rate.rate}
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
					<button onclick={saveQuote} disabled={isSaving} class="btn btn-primary">
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
