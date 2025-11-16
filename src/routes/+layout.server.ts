import { listProjects } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends }) => {
	// Register dependency for invalidation
	depends('project:data');

	const projects = await listProjects();
	return {
		projects
	};
};
