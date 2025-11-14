import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { upsertRequirements, createProjectHistory } from '$lib/server/projectDb';

// PUT /api/projects/[id]/requirements - Update requirements content
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

		const requirements = await upsertRequirements(projectId, content);

		// Log in project history
		await createProjectHistory(projectId, 'Requirements', 'Requirements content updated');

		return json({ requirements });
	} catch (error) {
		console.error('Error updating requirements:', error);
		return json({ error: 'Failed to update requirements' }, { status: 500 });
	}
}
