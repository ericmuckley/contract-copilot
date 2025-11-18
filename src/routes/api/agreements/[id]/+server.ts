import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateAgreementNotes } from '$lib/server/db';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid agreement ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { notes } = body;

		if (!Array.isArray(notes)) {
			return json({ error: 'Notes must be an array' }, { status: 400 });
		}

		const updated = await updateAgreementNotes(id, notes);

		if (!updated) {
			return json({ error: 'Agreement not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		console.error('Error updating agreement notes:', error);
		return json({ error: 'Failed to update agreement notes' }, { status: 500 });
	}
};
