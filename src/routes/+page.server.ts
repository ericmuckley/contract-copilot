import { listProjects } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const projects = await listProjects();
	return {
		projects
	};
};
