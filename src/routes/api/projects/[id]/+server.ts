import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import {
	getProject,
	updateProject,
	deleteProject,
	listArtifacts,
	getBusinessCase,
	getRequirements,
	getSolutionArchitecture,
	getEffortEstimate,
	listEstimateTasks,
	getQuote,
	listQuoteRates,
	listProjectHistory
} from '$lib/server/projectDb';
import type { ProjectStage, EstimateTask, QuoteRate } from '$lib/types/project';

// GET /api/projects/[id] - Get project with all stage data
export async function GET({ params }: RequestEvent) {
	try {
		const id = parseInt(params.id || '');
		if (isNaN(id)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const project = await getProject(id);
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		// Fetch all related data
		const [
			artifacts,
			businessCase,
			requirements,
			solutionArchitecture,
			effortEstimate,
			quote,
			history
		] = await Promise.all([
			listArtifacts(id),
			getBusinessCase(id),
			getRequirements(id),
			getSolutionArchitecture(id),
			getEffortEstimate(id),
			getQuote(id),
			listProjectHistory(id)
		]);

		// If there's an effort estimate, fetch tasks
		let tasks: EstimateTask[] = [];
		if (effortEstimate) {
			tasks = await listEstimateTasks(effortEstimate.id);
		}

		// If there's a quote, fetch rates
		let rates: QuoteRate[] = [];
		if (quote) {
			rates = await listQuoteRates(quote.id);
		}

		return json({
			project,
			artifacts,
			businessCase,
			requirements,
			solutionArchitecture,
			effortEstimate: effortEstimate ? { ...effortEstimate, tasks } : null,
			quote: quote ? { ...quote, rates } : null,
			history
		});
	} catch (error) {
		console.error('Error fetching project:', error);
		return json({ error: 'Failed to fetch project' }, { status: 500 });
	}
}

// PATCH /api/projects/[id] - Update project
export async function PATCH({ params, request }: RequestEvent) {
	try {
		const id = parseInt(params.id || '');
		if (isNaN(id)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const { name, current_stage } = await request.json();

		const project = await updateProject(
			id,
			name as string | undefined,
			current_stage as ProjectStage | undefined
		);

		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		return json({ project });
	} catch (error) {
		console.error('Error updating project:', error);
		return json({ error: 'Failed to update project' }, { status: 500 });
	}
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE({ params }: RequestEvent) {
	try {
		const id = parseInt(params.id || '');
		if (isNaN(id)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const success = await deleteProject(id);
		if (!success) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting project:', error);
		return json({ error: 'Failed to delete project' }, { status: 500 });
	}
}
