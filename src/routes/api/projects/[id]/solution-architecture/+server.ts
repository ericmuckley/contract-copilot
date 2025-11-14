import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { upsertSolutionArchitecture, createProjectHistory } from '$lib/server/projectDb';

// PUT /api/projects/[id]/solution-architecture - Update solution architecture content
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

		const solutionArchitecture = await upsertSolutionArchitecture(projectId, content);

		// Log in project history
		await createProjectHistory(
			projectId,
			'SolutionArchitecture',
			'Solution/Architecture content updated'
		);

		return json({ solutionArchitecture });
	} catch (error) {
		console.error('Error updating solution architecture:', error);
		return json({ error: 'Failed to update solution architecture' }, { status: 500 });
	}
}
