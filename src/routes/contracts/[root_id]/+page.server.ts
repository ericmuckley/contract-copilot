import type { PageServerLoad } from './$types';
import { getAgreementsByRootId } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, depends }) => {
	depends('agreement:data');
	const rootId = params.root_id;
	const agreements = await getAgreementsByRootId(rootId);
	return { agreements };
};
