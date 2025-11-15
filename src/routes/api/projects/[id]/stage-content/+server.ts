import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getProject, updateProject } from '$lib/server/db';

// PUT /api/projects/[id]/stage-content - Update content for a specific stage
export async function PUT({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const body = await request.json();
		const { stageIndex, content, tasks } = body;

		if (typeof stageIndex !== 'number' || stageIndex < 0) {
			return json({ error: 'Invalid stage index' }, { status: 400 });
		}

		const project = await getProject(projectId);
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		// Update the specific stage's content
		const updatedSdata = [...project.sdata];
		const updatedStage: any = {
			...updatedSdata[stageIndex],
			content: content,
			updated_at: new Date().toISOString()
		};
		
		// If tasks are provided, update them too
		if (tasks !== undefined) {
			updatedStage.tasks = tasks;
		}
		
		updatedSdata[stageIndex] = updatedStage;

		// Update project with new sdata
		const updatedProject = await updateProject(projectId, { sdata: updatedSdata });
		if (!updatedProject) {
			return json({ error: 'Failed to update project' }, { status: 500 });
		}

		return json({ project: updatedProject });
	} catch (error) {
		console.error('Error updating stage content:', error);
		return json({ error: 'Failed to update stage content' }, { status: 500 });
	}
}
