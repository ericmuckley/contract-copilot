import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateAgreementNotes, updateAgreementEdits } from '$lib/server/db';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid agreement ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { notes, edits } = body;

		// Handle notes update
		if (notes !== undefined) {
			if (!Array.isArray(notes)) {
				return json({ error: 'Notes must be an array' }, { status: 400 });
			}

			const updated = await updateAgreementNotes(id, notes);

			if (!updated) {
				return json({ error: 'Agreement not found' }, { status: 404 });
			}

			return json(updated);
		}

		// Handle edits update
		if (edits !== undefined) {
			if (!Array.isArray(edits)) {
				return json({ error: 'Edits must be an array' }, { status: 400 });
			}

			// Validate edits structure
			for (const edit of edits) {
				if (typeof edit !== 'object' || !('old' in edit) || !('new' in edit) || !('note' in edit)) {
					return json(
						{ error: 'Each edit must have old, new, and note properties' },
						{ status: 400 }
					);
				}
			}

			const updated = await updateAgreementEdits(id, edits);

			if (!updated) {
				return json({ error: 'Agreement not found' }, { status: 404 });
			}

			return json(updated);
		}

		return json({ error: 'Either notes or edits must be provided' }, { status: 400 });
	} catch (error) {
		console.error('Error updating agreement:', error);
		return json({ error: 'Failed to update agreement' }, { status: 500 });
	}
};
