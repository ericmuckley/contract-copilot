import { listAgreements, listProjects, getProjectArtifacts } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends }) => {
	// Register dependency for invalidation
	depends('project:data');
	depends('agreement:data');

	const projects = await listProjects();
	const agreements = await listAgreements();
	const policyArtifacts = await getProjectArtifacts(null);
	return {
		projects,
		agreements,
		policyArtifacts
	};
};
