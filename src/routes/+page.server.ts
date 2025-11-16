import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	// Inherit projects from layout
	const { projects } = await parent();
	return { projects };
};
