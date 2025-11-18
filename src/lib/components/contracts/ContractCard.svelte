<script lang="ts">
	import type { Agreement } from '$lib/schema';

	let { agreement }: { agreement: Agreement } = $props();

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	const typeColors: Record<string, { bg: string; text: string }> = {
		MSA: { bg: 'bg-blue-200', text: 'text-blue-700' },
		SOW: { bg: 'bg-green-200', text: 'text-green-700' },
		NDA: { bg: 'bg-purple-200', text: 'text-purple-700' }
	};

	const originColors: Record<string, { bg: string; text: string }> = {
		client: { bg: 'bg-orange-200', text: 'text-orange-700' },
		internal: { bg: 'bg-slate-200', text: 'standard' }
	};
</script>

<a
	href="/contracts/{agreement.root_id}"
	class="card block border border-slate-200 bg-white transition-shadow hover:shadow-lg"
>
	<div class="mb-3 flex items-start justify-between">
		<h3>
			{agreement.agreement_name}
		</h3>

		<div class="flex flex-col gap-1">
			<span
				class="rounded-full px-3 py-1 text-xs font-semibold {typeColors[agreement.agreement_type]
					?.bg || 'bg-slate-200'} {typeColors[agreement.agreement_type]?.text || 'standard'}"
			>
				{agreement.agreement_type}
			</span>
		</div>
	</div>

	<div class="standard mt-3 flex items-center justify-between text-xs">
		<span>
			<i class="bi bi-building"></i>
			{agreement.counterparty}
		</span>
		<span>Version {agreement.version_number}</span>
	</div>

	<div class="muted mt-2 flex items-center justify-between space-x-6 text-xs">
		<span>Created: {formatDate(agreement.created_at)}</span>
		<span>Updated: {formatDate(agreement.updated_at)}</span>
	</div>
</a>
