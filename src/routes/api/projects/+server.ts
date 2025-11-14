import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createProject, listProjects, createProjectHistory } from '$lib/server/projectDb';
import type { ProjectStage } from '$lib/types/project';

// GET /api/projects - List all projects with optional stage filter
export async function GET({ url }: RequestEvent) {
	try {
		const stageFilter = url.searchParams.get('stage') as ProjectStage | null;
		const projects = await listProjects(stageFilter || undefined);
		return json({ projects });
	} catch (error) {
		console.error('Error listing projects:', error);
		return json({ error: 'Failed to list projects' }, { status: 500 });
	}
}

// POST /api/projects - Create a new project
export async function POST({ request }: RequestEvent) {
	try {
		const { name } = await request.json();

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return json({ error: 'Project name is required' }, { status: 400 });
		}

		const project = await createProject(name.trim());

		// Log creation in project history
		await createProjectHistory(project.id, 'Artifacts', 'Project created');

		return json({ project }, { status: 201 });
	} catch (error) {
		console.error('Error creating project:', error);
		return json({ error: 'Failed to create project' }, { status: 500 });
	}
}
