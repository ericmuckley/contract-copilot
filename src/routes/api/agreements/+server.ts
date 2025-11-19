import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createAgreement,
	getAgreement,
	listAgreements,
	updateAgreement,
	deleteAgreement
} from '$lib/server/db';
import type { Agreement } from '$lib/schema';

// GET - Retrieve agreement(s)
// Query params: id (optional) - if provided, returns single agreement, otherwise returns all
export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');

		if (id) {
			const agreement = await getAgreement(parseInt(id));
			if (!agreement) {
				return json({ error: 'Agreement not found' }, { status: 404 });
			}
			return json(agreement);
		}

		// Return all agreements
		const agreements = await listAgreements();
		return json(agreements);
	} catch (error) {
		console.error('Error fetching agreement(s):', error);
		return json({ error: 'Failed to fetch agreement(s)' }, { status: 500 });
	}
};

// PUT - Create a new agreement
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		// Validate required fields
		const requiredFields = [
			'root_id',
			'version_number',
			'origin',
			'agreement_name',
			'agreement_type',
			'created_by',
			'text_content'
		];

		for (const field of requiredFields) {
			if (!data[field]) {
				return json({ error: `Missing required field: ${field}` }, { status: 400 });
			}
		}

		// Validate origin
		if (data.origin !== 'client' && data.origin !== 'internal') {
			return json({ error: 'Invalid origin. Must be "client" or "internal"' }, { status: 400 });
		}

		const agreement: Omit<Agreement, 'id' | 'created_at' | 'updated_at'> = {
			root_id: data.root_id,
			version_number: data.version_number,
			origin: data.origin,
			agreement_name: data.agreement_name,
			agreement_type: data.agreement_type,
			notes: [],
			edits: [],
			created_by: data.created_by,
			text_content: data.text_content,
			counterparty: data.counterparty || undefined,
			project_id: data.project_id || null
		};

		const created = await createAgreement(agreement);
		return json(created, { status: 201 });
	} catch (error) {
		console.error('Error creating agreement:', error);
		return json({ error: 'Failed to create agreement' }, { status: 500 });
	}
};

// PATCH - Update an existing agreement
export const PATCH: RequestHandler = async ({ request, url }) => {
	try {
		const id = url.searchParams.get('id');
		if (!id) {
			return json({ error: 'Missing agreement id' }, { status: 400 });
		}

		const updates = await request.json();
		const updated = await updateAgreement(parseInt(id), updates);

		if (!updated) {
			return json({ error: 'Agreement not found' }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		console.error('Error updating agreement:', error);
		return json({ error: 'Failed to update agreement' }, { status: 500 });
	}
};

// DELETE - Delete an agreement
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		if (!id) {
			return json({ error: 'Missing agreement id' }, { status: 400 });
		}

		const success = await deleteAgreement(parseInt(id));
		if (success) {
			return json({ success: true });
		}

		return json({ error: 'Agreement not found' }, { status: 404 });
	} catch (error) {
		console.error('Error deleting agreement:', error);
		return json({ error: 'Failed to delete agreement' }, { status: 500 });
	}
};
