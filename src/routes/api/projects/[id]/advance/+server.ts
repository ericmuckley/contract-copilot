import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getProject, updateProject, getProjectArtifacts } from '$lib/server/db';
import { STAGES, PROJECT_PERSONNEL_RATES } from '$lib/schema';
import type { ProjectTask } from '$lib/schema';

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

		// Get current stage index (number of approved stages)
		const currentStageIdx = project.sdata.filter((s) => s.approved).length;

		// Validate we're not at the final stage
		if (currentStageIdx >= STAGES.length - 1) {
			return json({ error: 'Project is already at final stage' }, { status: 400 });
		}

		// Validate current stage requirements before advancing
		const validation = await validateStageRequirements(projectId, currentStageIdx, project);
		if (!validation.valid) {
			return json({ error: validation.message }, { status: 400 });
		}

		// Mark current stage as approved
		const updatedSdata = [...project.sdata];
		updatedSdata[currentStageIdx] = {
			...updatedSdata[currentStageIdx],
			approved: true,
			approved_by: approvedBy.trim(),
			updated_at: new Date().toISOString()
		};

		// If advancing from Effort Estimate to Quote stage, generate the CSV content
		if (currentStageIdx === 4 && updatedSdata.length > 5) {
			const tasks = project.sdata[4].tasks || [];
			const quoteCSV = generateQuoteCSV(tasks);
			updatedSdata[5] = {
				...updatedSdata[5],
				content: quoteCSV,
				updated_at: new Date().toISOString()
			};
		}

		// Update project with new sdata
		const updatedProject = await updateProject(projectId, { sdata: updatedSdata });
		if (!updatedProject) {
			return json({ error: 'Failed to update project' }, { status: 500 });
		}

		return json({ project: updatedProject });
	} catch (error) {
		console.error('Error advancing project:', error);
		return json({ error: 'Failed to advance project' }, { status: 500 });
	}
}

function generateQuoteCSV(tasks: ProjectTask[]): string {
	const headers = ['Task', 'Role', 'Hours', 'Rate/Hour', 'Total Cost'];
	const rows = tasks.map((task) => {
		const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
		const cost = Number(task.hours) * rate;
		return [task.description, task.role, task.hours.toString(), rate.toString(), cost.toFixed(2)];
	});

	// Calculate totals
	const totalHours = tasks.reduce((sum, task) => sum + Number(task.hours), 0);
	const totalCost = tasks.reduce((sum, task) => {
		const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
		return sum + Number(task.hours) * rate;
	}, 0);
	const timelineWeeks = Math.ceil(totalHours / 40);

	// Add summary rows
	rows.push(['', '', '', '', '']);
	rows.push(['Total Hours', '', totalHours.toString(), '', '']);
	rows.push(['Total Cost', '', '', '', totalCost.toFixed(2)]);
	rows.push(['Timeline (weeks)', '', timelineWeeks.toString(), '', '']);

	// Generate CSV string
	const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

	return csv;
}

async function validateStageRequirements(
	projectId: number,
	stageIdx: number,
	project: any
): Promise<{ valid: boolean; message?: string }> {
	const stageName = STAGES[stageIdx].name;

	switch (stageName) {
		case 'artifacts': {
			const artifacts = await getProjectArtifacts(projectId);
			if (artifacts.length < 2) {
				return {
					valid: false,
					message: 'At least 2 artifacts are required to advance from Artifacts stage'
				};
			}
			return { valid: true };
		}
		case 'business_case':
		case 'requirements':
		case 'architecture': {
			if (!project.sdata[stageIdx].content) {
				return {
					valid: false,
					message: `Content is required to advance from ${STAGES[stageIdx].label} stage`
				};
			}
			return { valid: true };
		}
		case 'estimate': {
			if (!project.sdata[stageIdx].content) {
				return {
					valid: false,
					message: 'Assumptions are required to advance from Effort Estimate stage'
				};
			}
			if (!project.sdata[stageIdx].tasks || project.sdata[stageIdx].tasks.length === 0) {
				return {
					valid: false,
					message: 'At least one task is required to advance from Effort Estimate stage'
				};
			}
			return { valid: true };
		}
		case 'quote': {
			if (!project.sdata[stageIdx].content) {
				return {
					valid: false,
					message: 'Quote details are required'
				};
			}
			return { valid: true };
		}
		default:
			return { valid: true };
	}
}
