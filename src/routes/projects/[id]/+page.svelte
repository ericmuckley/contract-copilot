<script lang="ts">
	import { cleanString } from '$lib/utils';
	import StageStepper from '$lib/components/projects/StageStepper.svelte';
	import ArtifactsStage from '$lib/components/projects/ArtifactsStage.svelte';
	import ContentStage from '$lib/components/projects/ContentStage.svelte';
	import EffortEstimateStage from '$lib/components/projects/EffortEstimateStage.svelte';
	import QuoteStage from '$lib/components/projects/QuoteStage.svelte';
	import ApproverNameInput from '$lib/components/ApproverNameInput.svelte';
	import { STAGES, type Artifact } from '$lib/schema';
	import Spinner from '$lib/components/Spinner.svelte';

	let { data } = $props();

	let isAdvancing = $state(false);
	let advanceError = $state('');
	let approverName = $state('');

	let stageIdx = $derived(data.project.sdata.filter((s) => s.approved).length);

	async function refreshData() {
		// Reload the page data
		window.location.reload();
	}

	// Listen for project updates from chatbot
	$effect(() => {
		const handleUpdate = () => {
			refreshData();
		};

		window.addEventListener('project-updated', handleUpdate);

		return () => {
			window.removeEventListener('project-updated', handleUpdate);
		};
	});

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
		}
	}

	const canAdvance = $derived(() => {
		// Always require a valid approver name
		if (!approverName || approverName.trim() === '') {
			return false;
		}

		const stageName = STAGES[stageIdx].name;

		if (stageName === 'artifacts') {
			return data.artifacts.length >= 2;
		} else if (stageName === 'business_case') {
			return data.project.sdata[1].content != null;
		} else if (stageName === 'requirements') {
			return data.project.sdata[2].content != null;
		} else if (stageName === 'architecture') {
			return data.project.sdata[3].content != null;
		} else if (stageName === 'estimate') {
			return (
				data.project.sdata[4].content != null &&
				data.project.sdata[4]?.tasks?.length &&
				data.project.sdata[4].tasks.length > 0
			);
		} else if (stageName === 'quote') {
			return false; // Final stage
		}

		return false;
	});
</script>

<div class="card">
	<div class="mb-1 flex text-sm">
		<a href="/projects" class="link">
			<span>All Projects</span>
		</a>
		<span class="muted mx-1">/</span>
		<span>{data.project.project_name}</span>
	</div>

	<h1 class="mb-0 text-5xl!">{data.project.project_name}</h1>

	<div class="flex justify-between">
		<div class="w-56 space-y-1">
			<p>
				Created by {data.project.created_by}
			</p>
			<p>
				Current Stage: {cleanString(data.project.sdata[stageIdx]?.name) || 'Unknown'}
			</p>
		</div>

		<div class="w-48 space-y-1">
			<p class="flex justify-between">
				<span>Created</span>
				<span>{new Date(data.project.created_at as string).toLocaleDateString()}</span>
			</p>
			<p class="flex justify-between">
				<span>Last Updated</span>
				<span>{new Date(data.project.updated_at as string).toLocaleDateString()}</span>
			</p>
		</div>
	</div>

	<div class="mt-6">
		<StageStepper sdata={data.project.sdata} currentStageIndex={stageIdx} />
	</div>
</div>

<div class="card mt-4">
	{#if STAGES[stageIdx].name === 'artifacts'}
		<ArtifactsStage
			projectId={data.project.id as number}
			artifacts={data.artifacts as Artifact[]}
			onRefresh={refreshData}
		/>
	{:else if STAGES[stageIdx].name === 'business_case'}
		<ContentStage
			projectId={data.project.id as number}
			stageIndex={stageIdx}
			content={data.project.sdata[stageIdx].content}
			onRefresh={refreshData}
		/>
	{:else if STAGES[stageIdx].name === 'requirements'}
		<ContentStage
			projectId={data.project.id as number}
			stageIndex={stageIdx}
			content={data.project.sdata[stageIdx].content}
			onRefresh={refreshData}
		/>
	{:else if STAGES[stageIdx].name === 'architecture'}
		<ContentStage
			projectId={data.project.id as number}
			stageIndex={stageIdx}
			content={data.project.sdata[stageIdx].content}
			onRefresh={refreshData}
		/>
	{:else if STAGES[stageIdx].name === 'estimate'}
		<EffortEstimateStage
			projectId={data.project.id as number}
			stageIndex={stageIdx}
			assumptions={data.project.sdata[stageIdx].content}
			tasks={data.project.sdata[stageIdx].tasks || []}
			onRefresh={refreshData}
		/>
	{:else if STAGES[stageIdx].name === 'quote'}
		<QuoteStage
			projectId={data.project.id as number}
			stageIndex={stageIdx}
			content={data.project.sdata[stageIdx].content}
			tasks={data.project.sdata[4].tasks || []}
			onRefresh={refreshData}
		/>
	{/if}
</div>

<div class="card mt-4">
	{#if stageIdx < STAGES.length - 1}
		<h1>Stage Approval</h1>

		<div class="mt-4 flex items-end space-x-8">
			<div class="w-full">
				<ApproverNameInput bind:value={approverName} />
			</div>

			<div class="w-full">
				{#if isAdvancing}
					<div class="my-2 flex justify-center"><Spinner /></div>
				{:else}
					<button
						onclick={advanceStage}
						disabled={!canAdvance() || isAdvancing}
						class="btn btn-primary flex w-full justify-center space-x-1"
					>
						<i class="bi bi-arrow-right mr-2"></i>
						<span>Advance to next stage</span>
					</button>
				{/if}
			</div>

			{#if advanceError}
				<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
					<i class="bi bi-exclamation-triangle-fill mr-2"></i>
					{advanceError}
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-center text-2xl">
			<i class="bi bi-check-circle-fill mb-2 text-4xl text-green-600"></i>
			<div class="font-bold text-green-600">Project Complete!</div>
		</div>
		<p class="mt-4 text-center">Your quote is ready to be delivered to the client.</p>
	{/if}
</div>
