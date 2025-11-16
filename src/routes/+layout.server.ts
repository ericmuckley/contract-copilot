import { listProjects } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const projects = await listProjects();
	return {
		projects
	};
};
