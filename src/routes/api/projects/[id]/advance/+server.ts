import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import {
	getProject,
	updateProject,
	createProjectHistory,
	listArtifacts,
	getBusinessCase,
	getRequirements,
	getSolutionArchitecture,
	getEffortEstimate,
	listEstimateTasks,
	getQuote,
	updateProjectApprovedBy,
	updateBusinessCaseApprovedBy,
	updateRequirementsApprovedBy,
	updateSolutionArchitectureApprovedBy,
	updateEffortEstimateApprovedBy,
	updateQuoteApprovedBy,
	updateEstimateTasksApprovedBy
} from '$lib/server/projectDb';
import type { ProjectStage } from '$lib/types/project';

const STAGE_ORDER: ProjectStage[] = [
	'Artifacts',
	'BusinessCase',
	'Requirements',
	'SolutionArchitecture',
	'EffortEstimate',
	'Quote'
];

// POST /api/projects/[id]/advance - Advance project to next stage
export async function POST({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		// Parse request body
		const body = await request.json();
		const approvedBy = body.approved_by;

		// Validate approved_by field
		if (!approvedBy || typeof approvedBy !== 'string' || approvedBy.trim() === '') {
			return json({ error: 'Approver name is required' }, { status: 400 });
		}

		const project = await getProject(projectId);
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		// Validate current stage requirements before advancing
		const validation = await validateStageRequirements(projectId, project.current_stage);
		if (!validation.valid) {
			return json({ error: validation.message }, { status: 400 });
		}

		// Get next stage
		const currentIndex = STAGE_ORDER.indexOf(project.current_stage);
		if (currentIndex === STAGE_ORDER.length - 1) {
			return json({ error: 'Project is already at final stage' }, { status: 400 });
		}

		const nextStage = STAGE_ORDER[currentIndex + 1];

		// Update the approved_by field for the current stage
		await updateStageApprovedBy(projectId, project.current_stage, approvedBy.trim());

		// Update project to next stage
		const updatedProject = await updateProject(projectId, undefined, nextStage);
		if (!updatedProject) {
			return json({ error: 'Failed to update project' }, { status: 500 });
		}

		// Log in project history
		await createProjectHistory(
			projectId,
			nextStage,
			`Advanced from ${project.current_stage} to ${nextStage} (approved by ${approvedBy.trim()})`
		);

		return json({ project: updatedProject });
	} catch (error) {
		console.error('Error advancing project:', error);
		return json({ error: 'Failed to advance project' }, { status: 500 });
	}
}

async function validateStageRequirements(
	projectId: number,
	stage: ProjectStage
): Promise<{ valid: boolean; message?: string }> {
	switch (stage) {
		case 'Artifacts': {
			const artifacts = await listArtifacts(projectId);
			if (artifacts.length < 2) {
				return {
					valid: false,
					message: 'At least 2 artifacts are required to advance from Artifacts stage'
				};
			}
			return { valid: true };
		}
		case 'BusinessCase': {
			const businessCase = await getBusinessCase(projectId);
			if (!businessCase || !businessCase.content) {
				return {
					valid: false,
					message: 'Business case content is required to advance from BusinessCase stage'
				};
			}
			return { valid: true };
		}
		case 'Requirements': {
			const requirements = await getRequirements(projectId);
			if (!requirements || !requirements.content) {
				return {
					valid: false,
					message: 'Requirements content is required to advance from Requirements stage'
				};
			}
			return { valid: true };
		}
		case 'SolutionArchitecture': {
			const solution = await getSolutionArchitecture(projectId);
			if (!solution || !solution.content) {
				return {
					valid: false,
					message:
						'Solution/Architecture content is required to advance from SolutionArchitecture stage'
				};
			}
			return { valid: true };
		}
		case 'EffortEstimate': {
			const estimate = await getEffortEstimate(projectId);
			if (!estimate) {
				return {
					valid: false,
					message: 'Effort estimate is required to advance from EffortEstimate stage'
				};
			}
			const tasks = await listEstimateTasks(estimate.id);
			if (tasks.length === 0) {
				return {
					valid: false,
					message: 'At least one estimate task is required to advance from EffortEstimate stage'
				};
			}
			return { valid: true };
		}
		case 'Quote': {
			const quote = await getQuote(projectId);
			if (!quote) {
				return {
					valid: false,
					message: 'Quote is required to complete the project'
				};
			}
			return { valid: true };
		}
		default:
			return { valid: true };
	}
}

async function updateStageApprovedBy(
	projectId: number,
	stage: ProjectStage,
	approvedBy: string
): Promise<void> {
	switch (stage) {
		case 'Artifacts':
			await updateProjectApprovedBy(projectId, approvedBy);
			break;
		case 'BusinessCase':
			await updateBusinessCaseApprovedBy(projectId, approvedBy);
			break;
		case 'Requirements':
			await updateRequirementsApprovedBy(projectId, approvedBy);
			break;
		case 'SolutionArchitecture':
			await updateSolutionArchitectureApprovedBy(projectId, approvedBy);
			break;
		case 'EffortEstimate': {
			await updateEffortEstimateApprovedBy(projectId, approvedBy);
			// Also update all tasks in the effort estimate
			const estimate = await getEffortEstimate(projectId);
			if (estimate) {
				await updateEstimateTasksApprovedBy(estimate.id, approvedBy);
			}
			break;
		}
		case 'Quote':
			await updateQuoteApprovedBy(projectId, approvedBy);
			break;
	}
}
