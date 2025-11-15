import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProject, getProjectArtifacts } from '$lib/server/db';
import { get } from 'http';

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

	console.log('Page data:', { project, artifacts });

	return { project, artifacts };
};
