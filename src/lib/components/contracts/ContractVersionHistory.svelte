<script lang="ts">
	import { slide } from 'svelte/transition';
	import LLMOutput from '$lib/components/copilot/LLMOutput.svelte';
	import type { Agreement } from '$lib/schema';
	import ContractToolbar from './ContractToolbar.svelte';

	let { versions }: { versions: Agreement[] } = $props();

	let expandedVersionId = $state<number | null>(null);

	function toggleVersion(versionId: number) {
		expandedVersionId = expandedVersionId === versionId ? null : versionId;
	}
</script>

{#if versions.length > 0}
	<div class="card mt-8">
		<h2 class="mb-4 flex items-center">
			<i class="bi bi-clock-history mr-2"></i>
			Version History
		</h2>
		<p class="muted mb-6 text-sm">
			{versions.length} previous {versions.length === 1 ? 'version' : 'versions'}
		</p>

		<div class="space-y-4">
			{#each versions as version, idx}
				{@const isExpanded = expandedVersionId === version.id}
				<div class="card border border-slate-200 bg-slate-50 transition-all duration-300">
					<div class="p-4">
						<div class="flex items-start justify-between">
							<div class="standard flex-1">
								<div class="flex items-center gap-3">
									<span class="rounded-full bg-slate-200 px-3 py-1 text-sm">
										Version {version.version_number}
									</span>
									<span class="standard text-xs">
										{new Date(version.created_at as string).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								</div>

								<div class="standard mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
									<div>
										<span class="muted text-xs">Created By:</span>
										<span class="ml-2">{version.created_by}</span>
									</div>
									<div>
										<span class="muted text-xs">Counterparty:</span>
										<span class="ml-2 capitalize">{version.counterparty}</span>
									</div>
									{#if version.notes && version.notes.length > 0}
										<div class="">
											<span class="muted text-xs">Notes:</span>
											<span class="ml-2"
												>{version.notes.length}
												{version.notes.length === 1 ? 'note' : 'notes'}</span
											>
										</div>
									{/if}
									{#if version.edits && version.edits.length > 0}
										<div class="">
											<span class="muted text-xs">Edits:</span>
											<span class="ml-2"
												>{version.edits.length}
												{version.edits.length === 1 ? 'edit' : 'edits'}</span
											>
										</div>
									{/if}
									<div>
										<span class="muted text-xs">Type:</span>
										<span class="ml-2">{version.agreement_type}</span>
									</div>
								</div>
							</div>

							<button
								onclick={() => version.id && toggleVersion(version.id)}
								class="btn btn-outline ml-4 flex items-center gap-2"
							>
								{isExpanded ? 'Hide Details' : 'View Details'}
								<i class="bi {isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}"></i>
							</button>
						</div>
					</div>

					<!-- Expandable details section -->
					{#if isExpanded}
						<div class="animate-in slide-in-from-top p-6 duration-300" in:slide out:slide>
							<div>
								<ContractToolbar agreement={version} />
							</div>

							<div class="mt-6 mb-10">
								<h3 class="mb-3 text-lg font-semibold">Agreement Text</h3>
								<div
									class="card max-h-96 overflow-x-auto overflow-y-auto bg-slate-100! shadow-inner"
								>
									<LLMOutput text={version.text_content} />
								</div>
							</div>

							{#if version.notes && version.notes.length > 0}
								<div class="standard mb-10">
									<h3 class="mb-3">Notes</h3>
									<ul class="list-inside list-disc space-y-1">
										{#each version.notes as note}
											<li class="text-sm">{note}</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if version.edits && version.edits.length > 0}
								<div>
									<h3 class="mb-3">Edits</h3>
									<div class="space-y-3">
										{#each version.edits as edit}
											<div class="card border border-slate-200 bg-slate-50">
												<div class="standard mb-2">{edit.note}</div>
												<div class="grid gap-2 md:grid-cols-2">
													<div>
														<div class="mb-1 text-xs text-red-600">Old:</div>
														<div class="rounded bg-red-50 p-2 text-sm">{edit.old}</div>
													</div>
													<div>
														<div class="mb-1 text-xs text-green-600">New:</div>
														<div class="rounded bg-green-50 p-2 text-sm">{edit.new}</div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
