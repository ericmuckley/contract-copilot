<script lang="ts">
	import { slide } from 'svelte/transition';
	import StageStepper from '$lib/components/projects/StageStepper.svelte';
	import ArtifactsStage from '$lib/components/projects/ArtifactsStage.svelte';
	import ContentStage from '$lib/components/projects/ContentStage.svelte';
	import EffortEstimateStage from '$lib/components/projects/EffortEstimateStage.svelte';
	import QuoteStage from '$lib/components/projects/QuoteStage.svelte';
	import ProjectHistory from '$lib/components/projects/ProjectHistory.svelte';
	import ApproverNameInput from '$lib/components/ApproverNameInput.svelte';
	import { STAGES, type Artifact } from '$lib/schema';

	let { data } = $props();

	let isAdvancing = $state(false);
	let advanceError = $state('');
	let showHistory = $state(false);
	let approverName = $state('');

	let stageIdx = $derived(
		() => data.project.sdata.filter((s) => s.approved).length
	);

	async function refreshData() {
		// Reload the page data
		window.location.reload();
	}

	async function advanceStage() {
		// Validate approver name
		if (!approverName || approverName.trim() === '') {
			advanceError = 'Please enter your name before advancing';
			return;
		}

		isAdvancing = true;
		advanceError = '';

		try {
			const response = await fetch(`/api/projects/${data.project.id}/advance`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					approved_by: approverName.trim()
				})
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

	/*
	const canAdvance = $derived(() => {
		//const stage = data.project.current_stage;

		// Always require a valid approver name
		if (!approverName || approverName.trim() === '') {
			return false;
		}

		const stageName = STAGES[stageIdx()].name;

		if (stageName === 'artifacts') {
			return data.artifacts.length >= 2;
		} else if (stageName === 'BusinessCase') {
			return data.project.sdata[1].content != null;
		} else if (stageName === 'Requirements') {
			return data.project.sdata[2].content != null;
		} else if (stageName === 'SolutionArchitecture') {
			return data.project.sdata[3].content != null;
		} else if (stageName === 'EffortEstimate') {
			return data.project.sdata[4].content != null && data.project.sdata[4]?.tasks?.length > 0;
		} else if (stageName === 'Quote') {
			return false; // Final stage
		}

		return false;
	});
	*/

	//const isLastStage = $derived(data.project.data.current_stage === 'Quote');
</script>



<div class="card">
	<div class="flex items-center justify-between">
		<div>
			<a href="/" class="link mb-2 inline-flex items-center space-x-2 text-sm">
				<i class="bi bi-arrow-left"></i>
				<span>Back to Dashboard</span>
			</a>
			<h1 class="mb-0">{data.project.project_name}</h1>
		</div>
		<button
			onclick={() => (showHistory = !showHistory)}
			class="btn bg-slate-500 text-white hover:bg-slate-600"
		>
			<i class="bi bi-clock-history mr-2"></i>
			{showHistory ? 'Hide' : 'Show'} History
		</button>
	</div>


	<div class="space-y-1 text-xs w-64">
		<p class="flex justify-between">
			<span>Created</span>
			<span>{new Date(data.project.created_at as string).toLocaleDateString()}</span>
		</p>
		<p class="flex justify-between">
			<span>Last Updated:</span>
			<span>{new Date(data.project.updated_at as string).toLocaleDateString()}</span>
		</p>
		<p class="flex justify-between">
			<span>Artifacts:</span>
			<span>{data.artifacts.length}</span>
		</p>
	</div>


	{#if showHistory}
		<div in:slide out:slide class="mt-8">
			<ProjectHistory sdata={data.project.sdata} />
		</div>
	{/if}


</div>

<div class="mt-4">
	<StageStepper currentStageIndex={stageIdx()} />
</div>


<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<div class="card lg:col-span-2">
		{#if STAGES[stageIdx()].name === 'artifacts'}
			<ArtifactsStage
				projectId={data.project.id as number}
				artifacts={data.artifacts as Artifact[]}
				onRefresh={refreshData}
				{approverName}
			/>
		{:else if STAGES[stageIdx()].name === 'business_case'}
			<ContentStage
				projectId={data.project.id}
				stage="BusinessCase"
				content={data.businessCase?.content}
				onRefresh={refreshData}
				{approverName}
			/>
		{:else if STAGES[stageIdx()].name === 'requirements'}
			<ContentStage
				projectId={data.project.id}
				stage="Requirements"
				content={data.requirements?.content}
				onRefresh={refreshData}
				{approverName}
			/>
		{:else if STAGES[stageIdx()].name === 'architecture'}
			<ContentStage
				projectId={data.project.id}
				stage="SolutionArchitecture"
				content={data.solutionArchitecture?.content}
				onRefresh={refreshData}
				{approverName}
			/>
		{:else if STAGES[stageIdx()].name === 'estimate'}
			<EffortEstimateStage
				projectId={data.project.id}
				assumptions={data.effortEstimate?.assumptions}
				tasks={data.effortEstimate?.tasks || []}
				onRefresh={refreshData}
				{approverName}
			/>
		{:else if STAGES[stageIdx()].name === 'quote'}
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

	<div class="card space-y-4">
		<div class="">
			<h3 class="mb-4 text-lg font-semibold text-slate-800">Approval</h3>

			{#if stageIdx() < STAGES.length - 1}
				<div class="mb-4">
					<ApproverNameInput bind:value={approverName} />
				</div>

				<button
					onclick={advanceStage}
					disabled={!canAdvance() || isAdvancing}
					class="btn btn-primary w-full"
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

		<div class="mt-8">
			<p class="font-bold">Current Stage</p>
			<p class="mb-4 text-xs">
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

		<div class="mt-8">
			<p class="font-bold">Project Info</p>
			<div class="space-y-1 text-xs">
				<p class="flex justify-between">
					<span>Created</span>
					<span>{new Date(data.project.created_at as string).toLocaleDateString()}</span>
				</p>
				<p class="flex justify-between">
					<span>Last Updated:</span>
					<span>{new Date(data.project.updated_at as string).toLocaleDateString()}</span>
				</p>
				<p class="flex justify-between">
					<span>Artifacts:</span>
					<span>{data.artifacts.length}</span>
				</p>
			</div>
		</div>
	</div>
</div>


