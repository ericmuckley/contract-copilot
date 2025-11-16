import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$lib/server/settings';
import type { Project, Artifact } from '$lib/schema';

const sql = neon(DATABASE_URL);

export async function listProjects(): Promise<Project[]> {
	const result = await sql`
		SELECT 
			p.id, 
			p.project_name, 
			p.sdata, 
			p.created_at, 
			p.updated_at, 
			p.created_by,
			a.id as artifact_id,
			a.file_name,
			a.file_url
		FROM "projects" p
		LEFT JOIN "artifacts" a ON p.id = a.project_id
		ORDER BY p.updated_at DESC
	`;

	// Group artifacts by project
	const projectsMap = new Map<number, Project>();

	for (const row of result) {
		const projectId = row.id;

		if (!projectsMap.has(projectId)) {
			projectsMap.set(projectId, {
				id: row.id,
				project_name: row.project_name,
				sdata: row.sdata,
				updated_at: row.updated_at,
				created_at: row.created_at,
				created_by: row.created_by,
				artifacts: []
			});
		}

		// Add artifact if it exists
		if (row.artifact_id) {
			projectsMap.get(projectId)!.artifacts!.push({
				id: row.artifact_id,
				project_id: projectId,
				file_name: row.file_name,
				file_url: row.file_url
			});
		}
	}

	return Array.from(projectsMap.values());
}

export async function getProject(id: number): Promise<Project | null> {
	const result = await sql`
		SELECT 
			p.id, 
			p.project_name, 
			p.created_by, 
			p.sdata, 
			p.created_at, 
			p.updated_at,
			a.id as artifact_id,
			a.file_name,
			a.file_url
		FROM "projects" p
		LEFT JOIN "artifacts" a ON p.id = a.project_id
		WHERE p.id = ${id}
	`;
	if (result.length === 0) return null;

	const row = result[0];
	const project: Project = {
		id: row.id,
		project_name: row.project_name,
		created_by: row.created_by,
		sdata: row.sdata,
		created_at: row.created_at,
		updated_at: row.updated_at,
		artifacts: []
	};

	// Add all artifacts
	for (const row of result) {
		if (row.artifact_id) {
			project.artifacts!.push({
				id: row.artifact_id,
				project_id: row.id,
				file_name: row.file_name,
				file_url: row.file_url
			});
		}
	}

	return project;
}

export async function getProjectArtifacts(project_id: number): Promise<Artifact[]> {
	const result = await sql`
		SELECT id, project_id, file_name, file_url FROM "artifacts" WHERE project_id = ${project_id}
	`;
	return result.map(
		(row) =>
			({
				id: row.id,
				project_id: row.project_id,
				file_name: row.file_name,
				file_url: row.file_url
			}) as Artifact
	);
}

export async function createProject(project: Project): Promise<Project> {
	const result = await sql`
		INSERT INTO "projects" (project_name, created_by, sdata)
		VALUES (${project.project_name}, ${project.created_by}, ${JSON.stringify(project.sdata)})
		RETURNING id, project_name, created_by, sdata, created_at, updated_at
	`;
	const row = result[0];
	console.log(row);
	return {
		id: row.id,
		project_name: row.project_name,
		created_by: row.created_by,
		sdata: row.sdata,
		created_at: row.created_at,
		updated_at: row.updated_at
	} as Project;
}

export async function updateProject(
	id: number,
	project: Partial<Project>
): Promise<Project | null> {
	// Handle different update scenarios
	if (project.project_name !== undefined && project.sdata !== undefined) {
		const result = await sql`
			UPDATE "projects"
			SET project_name = ${project.project_name}, sdata = ${JSON.stringify(project.sdata)}, updated_at = NOW()
			WHERE id = ${id}
			RETURNING id, project_name, created_by, sdata, created_at, updated_at
		`;
		if (result.length === 0) return null;
		return result[0] as Project;
	} else if (project.project_name !== undefined) {
		const result = await sql`
			UPDATE "projects"
			SET project_name = ${project.project_name}, updated_at = NOW()
			WHERE id = ${id}
			RETURNING id, project_name, created_by, sdata, created_at, updated_at
		`;
		if (result.length === 0) return null;
		return result[0] as Project;
	} else if (project.sdata !== undefined) {
		const result = await sql`
			UPDATE "projects"
			SET sdata = ${JSON.stringify(project.sdata)}, updated_at = NOW()
			WHERE id = ${id}
			RETURNING id, project_name, created_by, sdata, created_at, updated_at
		`;
		if (result.length === 0) return null;
		return result[0] as Project;
	}

	return getProject(id);
}

export async function deleteProject(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "projects" WHERE id = ${id}
	`;
	return result.length > 0;
}

export async function createArtifact(artifact: Omit<Artifact, 'id'>): Promise<Artifact> {
	const result = await sql`
		INSERT INTO "artifacts" (project_id, file_name, file_url)
		VALUES (${artifact.project_id}, ${artifact.file_name}, ${artifact.file_url})
		RETURNING id, project_id, file_name, file_url
	`;
	const row = result[0];
	return {
		id: row.id,
		project_id: row.project_id,
		file_name: row.file_name,
		file_url: row.file_url
	} as Artifact;
}

export async function deleteArtifact(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "artifacts" WHERE id = ${id}
	`;
	return result.length > 0;
}
