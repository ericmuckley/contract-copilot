import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getProject,
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

export const load: PageServerLoad = async ({ params }) => {
	const projectId = parseInt(params.id);
	
	if (isNaN(projectId)) {
		throw error(400, 'Invalid project ID');
	}

	const project = await getProject(projectId);
	
	if (!project) {
		throw error(404, 'Project not found');
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
		listArtifacts(projectId),
		getBusinessCase(projectId),
		getRequirements(projectId),
		getSolutionArchitecture(projectId),
		getEffortEstimate(projectId),
		getQuote(projectId),
		listProjectHistory(projectId)
	]);

	// If there's an effort estimate, fetch tasks
	let tasks: any[] = [];
	if (effortEstimate) {
		tasks = await listEstimateTasks(effortEstimate.id);
	}

	// If there's a quote, fetch rates
	let rates: any[] = [];
	if (quote) {
		rates = await listQuoteRates(quote.id);
	}

	return {
		project,
		artifacts,
		businessCase,
		requirements,
		solutionArchitecture,
		effortEstimate: effortEstimate ? { ...effortEstimate, tasks } : null,
		quote: quote ? { ...quote, rates } : null,
		history
	};
};
