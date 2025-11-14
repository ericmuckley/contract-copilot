import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { upsertBusinessCase, createProjectHistory } from '$lib/server/projectDb';

// PUT /api/projects/[id]/business-case - Update business case content
export async function PUT({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const { content } = await request.json();
		if (!content || typeof content !== 'string') {
			return json({ error: 'Content is required' }, { status: 400 });
		}

		const businessCase = await upsertBusinessCase(projectId, content);

		// Log in project history
		await createProjectHistory(projectId, 'BusinessCase', 'Business case content updated');

		return json({ businessCase });
	} catch (error) {
		console.error('Error updating business case:', error);
		return json({ error: 'Failed to update business case' }, { status: 500 });
	}
}
