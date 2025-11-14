<script lang="ts">
	import { slide } from 'svelte/transition';
	import StageStepper from '$lib/components/projects/StageStepper.svelte';
	import ArtifactsStage from '$lib/components/projects/ArtifactsStage.svelte';
	import ContentStage from '$lib/components/projects/ContentStage.svelte';
	import EffortEstimateStage from '$lib/components/projects/EffortEstimateStage.svelte';
	import QuoteStage from '$lib/components/projects/QuoteStage.svelte';
	import ProjectHistory from '$lib/components/projects/ProjectHistory.svelte';

	let { data } = $props();

	let isAdvancing = $state(false);
	let advanceError = $state('');
	let showHistory = $state(false);

	async function refreshData() {
		// Reload the page data
		window.location.reload();
	}

	async function advanceStage() {
		isAdvancing = true;
		advanceError = '';

		try {
			const response = await fetch(`/api/projects/${data.project.id}/advance`, {
				method: 'POST'
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to advance stage');
			}

			// Refresh the page to show new stage
			await refreshData();
		} catch (err) {
			advanceError = err instanceof Error ? err.message : 'Failed to advance';
		} finally {
			isAdvancing = false;
		}
	}

	const canAdvance = $derived(() => {
		const stage = data.project.current_stage;

		if (stage === 'Artifacts') {
			return data.artifacts.length >= 2;
		} else if (stage === 'BusinessCase') {
			return data.businessCase?.content != null;
		} else if (stage === 'Requirements') {
			return data.requirements?.content != null;
		} else if (stage === 'SolutionArchitecture') {
			return data.solutionArchitecture?.content != null;
		} else if (stage === 'EffortEstimate') {
			return data.effortEstimate && data.effortEstimate.tasks.length > 0;
		} else if (stage === 'Quote') {
			return false; // Final stage
		}

		return false;
	});

	const isLastStage = $derived(data.project.current_stage === 'Quote');
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<a href="/" class="link mb-2 inline-flex items-center space-x-2 text-sm">
				<i class="bi bi-arrow-left"></i>
				<span>Back to Dashboard</span>
			</a>
			<h1 class="mb-0">{data.project.name}</h1>
		</div>
		<button
			onclick={() => (showHistory = !showHistory)}
			class="btn bg-slate-500 text-white hover:bg-slate-600"
		>
			<i class="bi bi-clock-history mr-2"></i>
			{showHistory ? 'Hide' : 'Show'} History
		</button>
	</div>

	<StageStepper currentStage={data.project.current_stage} />

	{#if showHistory}
		<div in:slide out:slide>
			<ProjectHistory history={data.history} />
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2">
			{#if data.project.current_stage === 'Artifacts'}
				<ArtifactsStage
					projectId={data.project.id}
					artifacts={data.artifacts}
					onRefresh={refreshData}
				/>
			{:else if data.project.current_stage === 'BusinessCase'}
				<ContentStage
					projectId={data.project.id}
					stage="BusinessCase"
					content={data.businessCase?.content}
					onRefresh={refreshData}
				/>
			{:else if data.project.current_stage === 'Requirements'}
				<ContentStage
					projectId={data.project.id}
					stage="Requirements"
					content={data.requirements?.content}
					onRefresh={refreshData}
				/>
			{:else if data.project.current_stage === 'SolutionArchitecture'}
				<ContentStage
					projectId={data.project.id}
					stage="SolutionArchitecture"
					content={data.solutionArchitecture?.content}
					onRefresh={refreshData}
				/>
			{:else if data.project.current_stage === 'EffortEstimate'}
				<EffortEstimateStage
					projectId={data.project.id}
					assumptions={data.effortEstimate?.assumptions}
					tasks={data.effortEstimate?.tasks || []}
					onRefresh={refreshData}
				/>
			{:else if data.project.current_stage === 'Quote'}
				<QuoteStage
					projectId={data.project.id}
					paymentTerms={data.quote?.payment_terms}
					timeline={data.quote?.timeline}
					isDelivered={data.quote?.is_delivered || false}
					rates={data.quote?.rates || []}
					tasks={data.effortEstimate?.tasks || []}
					onRefresh={refreshData}
				/>
			{/if}
		</div>

		<div class="space-y-4">
			<div class="">
				<h3 class="mb-4 text-lg font-semibold text-slate-800">Stage Actions</h3>

				{#if !isLastStage}
					<p class="mb-4 text-sm text-slate-600">
						{#if canAdvance()}
							You've completed this stage. Click below to advance to the next stage.
						{:else}
							Complete the requirements for this stage before advancing.
						{/if}
					</p>

					<button
						onclick={advanceStage}
						disabled={!canAdvance() || isAdvancing}
						class="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isAdvancing}
							<i class="bi bi-hourglass-split mr-2 animate-spin"></i>
							Advancing...
						{:else}
							<i class="bi bi-arrow-right mr-2"></i>
							Advance to Next Stage
						{/if}
					</button>

					{#if advanceError}
						<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
							<i class="bi bi-exclamation-triangle-fill mr-2"></i>
							{advanceError}
						</div>
					{/if}
				{:else}
					<p class="mb-4 text-sm text-slate-600">
						This is the final stage. Your quote is ready to be delivered to the client.
					</p>
					<div class="rounded-lg bg-green-50 p-4 text-center">
						<i class="bi bi-check-circle-fill mb-2 text-4xl text-green-600"></i>
						<p class="font-semibold text-green-800">Project Complete!</p>
					</div>
				{/if}
			</div>

			<div class="card bg-slate-50">
				<h4 class="mb-2 text-sm font-semibold text-slate-700">Current Stage</h4>
				<p class="mb-4 text-xs text-slate-600">
					{#if data.project.current_stage === 'Artifacts'}
						Upload at least 2 artifacts (documents, notes, transcripts) to provide context for the
						project.
					{:else if data.project.current_stage === 'BusinessCase'}
						Generate and review the business case, including scope, outcomes, and constraints.
					{:else if data.project.current_stage === 'Requirements'}
						Generate and review the functional and non-functional requirements.
					{:else if data.project.current_stage === 'SolutionArchitecture'}
						Document the technical approach, architecture, and risks.
					{:else if data.project.current_stage === 'EffortEstimate'}
						Generate the Work Breakdown Structure with tasks, roles, and hours.
					{:else if data.project.current_stage === 'Quote'}
						Set rates, payment terms, and timeline. Export or copy your quote.
					{/if}
				</p>
			</div>

			<div class="card bg-slate-50">
				<h4 class="mb-2 text-sm font-semibold text-slate-700">Project Info</h4>
				<div class="space-y-1 text-xs text-slate-600">
					<div>
						<strong>Created:</strong>
						{new Date(data.project.created_at).toLocaleDateString()}
					</div>
					<div>
						<strong>Last Updated:</strong>
						{new Date(data.project.updated_at).toLocaleDateString()}
					</div>
					<div>
						<strong>Artifacts:</strong>
						{data.artifacts.length}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
