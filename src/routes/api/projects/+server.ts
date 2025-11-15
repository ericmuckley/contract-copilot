import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createProject, listProjects } from '$lib/server/db';

// GET /api/projects - List all projects
export async function GET() {
	try {
		const projects = await listProjects();
		return json({ projects });
	} catch (error) {
		console.error('Error listing projects:', error);
		return json({ error: 'Failed to list projects' }, { status: 500 });
	}
}

// POST /api/projects - Create a new project
export async function POST({ request }: RequestEvent) {
	try {
		const _project = await request.json();
		const project = await createProject(_project);

		return json({ project }, { status: 201 });
	} catch (error) {
		console.error('Error creating project:', error);
		return json({ error: 'Failed to create project' }, { status: 500 });
	}
}
