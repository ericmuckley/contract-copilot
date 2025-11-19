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

	const typeColors: Record<string, { bg: string; text: string; border: string }> = {
		MSA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
		SOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
		NDA: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
	};

	const originColors: Record<string, { bg: string; text: string }> = {
		client: { bg: 'bg-orange-50', text: 'text-orange-700' },
		internal: { bg: 'bg-slate-50', text: 'text-slate-600' }
	};
</script>

<a
	href="/contracts/{agreement.root_id}"
	class="group relative block overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-indigo-200 hover:shadow-lg"
>
	<div class="mb-4 flex items-start justify-between gap-3">
		<h3
			class="flex-1 text-lg leading-tight font-semibold text-slate-700 transition-colors group-hover:text-indigo-700"
		>
			{agreement.agreement_name}
		</h3>

		<span
			class="inline-flex shrink-0 items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all {typeColors[
				agreement.agreement_type
			]?.bg || 'bg-slate-50'} {typeColors[agreement.agreement_type]?.text ||
				'text-slate-600'} {typeColors[agreement.agreement_type]?.border || 'border-slate-200'}"
		>
			{agreement.agreement_type}
		</span>
	</div>

	<div class="mb-3 flex items-center gap-2 text-sm text-slate-600">
		<i class="bi bi-building text-slate-400"></i>
		<span class="font-medium">{agreement.counterparty}</span>
		<span class="mx-2 text-slate-300">•</span>
		<span class="text-slate-500">v{agreement.version_number}</span>
	</div>

	<div class="flex items-center gap-4 text-xs text-slate-400">
		<span class="flex items-center gap-1">
			<i class="bi bi-calendar-plus"></i>
			{formatDate(agreement.created_at)}
		</span>
		<span class="flex items-center gap-1">
			<i class="bi bi-calendar-check"></i>
			{formatDate(agreement.updated_at)}
		</span>
	</div>

	<!-- Hover effect gradient -->
	<div
		class="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	></div>
</a>
