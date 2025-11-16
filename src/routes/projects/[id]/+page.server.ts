import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProject, getProjectArtifacts } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const projectId = parseInt(params.id);

	if (isNaN(projectId)) {
		throw error(400, 'Invalid project ID');
	}

	const project = await getProject(projectId);

	if (!project) {
		throw error(404, 'Project not found');
	}

	const artifacts = await getProjectArtifacts(projectId);

	return { project, artifacts };
};
