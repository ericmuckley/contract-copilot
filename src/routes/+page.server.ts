import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	// Inherit projects and agreements from layout
	const { projects, agreements } = await parent();
	return { projects, agreements };
};
