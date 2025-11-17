import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAgreement } from '$lib/server/db';

export const load: PageServerLoad = async ({ params, depends }) => {
	// Register dependency for invalidation
	depends('agreement:data');

	const agreementId = parseInt(params.id);

	if (isNaN(agreementId)) {
		throw error(400, 'Invalid agreement ID');
	}

	const agreement = await getAgreement(agreementId);

	if (!agreement) {
		throw error(404, 'Agreement not found');
	}

	return { agreement };
};
