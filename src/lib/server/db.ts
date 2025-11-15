import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$lib/server/settings';
import type { Project, Artifact } from '$lib/schema';


const sql = neon(DATABASE_URL);


export async function listProjects(): Promise<Project[]> {
	const result = await sql`
		SELECT id, project_name, sdata, created_at, updated_at, created_by FROM "projects" ORDER BY updated_at DESC
	`;
	return result.map(row => ({
		id: row.id,
		project_name: row.project_name,
		sdata: row.sdata,
		updated_at: row.updated_at,
		created_at: row.created_at,
		created_by: row.created_by
	})) as Project[];
}


export async function getProject(id: number): Promise<Project | null> {
	const result = await sql`
		SELECT id, project_name, created_by, sdata, created_at, updated_at FROM "projects" WHERE id = ${id}
	`;
	if (result.length === 0) return null;
	const row = result[0];
	return {
		id: row.id,
		project_name: row.project_name,
		created_by: row.created_by,
		sdata: row.sdata,
		created_at: row.created_at,
		updated_at: row.updated_at
	} as Project;
}

export async function getProjectArtifacts(project_id: number): Promise<Artifact[]> {
	const result = await sql`
		SELECT id, project_id, file_name, file_url FROM "artifacts" WHERE project_id = ${project_id}
	`;
	return result.map(row => ({
		id: row.id,
		project_id: row.project_id,
		file_name: row.file_name,
		file_url: row.file_url
	}) as Artifact);
}


export async function createProject(project: Project): Promise<Project> {

	const result = await sql`
		INSERT INTO "projects" (project_name, created_by, sdata)
		VALUES (${project.project_name}, ${project.created_by}, ${JSON.stringify(project.sdata)})
		RETURNING id, project_name, created_by, sdata, created_at, updated_at
	`;
	const row = result[0];
	console.log(row)
	return {
		id: row.id,
		project_name: row.project_name,
		created_by: row.created_by,
		sdata: row.sdata,
		created_at: row.created_at,
		updated_at: row.updated_at
	} as Project;
}


export async function updateProject(id: number, project: Project): Promise<Project | null> {
	const result = await sql`
		UPDATE "projects"
		SET data = ${JSON.stringify(project)}, updated_at = NOW()
		WHERE id = ${id}
		RETURNING id, data, created_at, updated_at
	`;
	if (result.length === 0) return null;
	const row = result[0];
	return {
		id: row.id,
		...row.data as Omit<Project, 'id'>,
		updated_at: row.updated_at
	} as Project;
}


export async function deleteProject(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "projects" WHERE id = ${id}
	`;
	return result.length > 0;
}
