import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$lib/server/settings';
import type {
	//Project,
	Artifact,
	BusinessCase,
	Requirements,
	SolutionArchitecture,
	EffortEstimate,
	EstimateTask,
	Quote,
	QuoteRate,
	ProjectHistory,
	ProjectStage
} from '$lib/types/project';
import type { Project } from '$lib/schema';

const sql = neon(DATABASE_URL);

// Project operations
export async function createProject(name: string, approved_by: string): Promise<Project> {
	const result = await sql`
		INSERT INTO "Project" (name, current_stage, approved_by, created_at, updated_at)
		VALUES (${name}, 'Artifacts', ${approved_by}, NOW(), NOW())
		RETURNING *
	`;
	return result[0] as Project;
}

export async function getProject(id: number): Promise<Project | null> {
	const result = await sql`
		SELECT * FROM "Project" WHERE id = ${id}
	`;
	return result.length > 0 ? (result[0] as Project) : null;
}

export async function updateProject(
	id: number,
	name?: string,
	current_stage?: ProjectStage
): Promise<Project | null> {
	if (name && current_stage) {
		const result = await sql`
			UPDATE "Project" 
			SET name = ${name}, current_stage = ${current_stage}, updated_at = NOW()
			WHERE id = ${id}
			RETURNING *
		`;
		return result.length > 0 ? (result[0] as Project) : null;
	} else if (name) {
		const result = await sql`
			UPDATE "Project" 
			SET name = ${name}, updated_at = NOW()
			WHERE id = ${id}
			RETURNING *
		`;
		return result.length > 0 ? (result[0] as Project) : null;
	} else if (current_stage) {
		const result = await sql`
			UPDATE "Project" 
			SET current_stage = ${current_stage}, updated_at = NOW()
			WHERE id = ${id}
			RETURNING *
		`;
		return result.length > 0 ? (result[0] as Project) : null;
	}
	return null;
}

export async function deleteProject(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "Project" WHERE id = ${id}
	`;
	return result.length > 0;
}

// Artifact operations
export async function createArtifact(
	project_id: number,
	file_name: string,
	file_url: string,
	approved_by: string,
	artifact_type?: string
): Promise<Artifact> {
	const result = await sql`
		INSERT INTO "Artifact" (project_id, file_name, file_url, approved_by, artifact_type, uploaded_at)
		VALUES (${project_id}, ${file_name}, ${file_url}, ${approved_by}, ${artifact_type || null}, NOW())
		RETURNING *
	`;
	return result[0] as Artifact;
}

export async function listArtifacts(project_id: number): Promise<Artifact[]> {
	const result = await sql`
		SELECT * FROM "Artifact" WHERE project_id = ${project_id} ORDER BY uploaded_at DESC
	`;
	return result as Artifact[];
}

export async function deleteArtifact(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "Artifact" WHERE id = ${id}
	`;
	return result.length > 0;
}

export async function updateArtifactsApprover(
	project_id: number,
	approved_by: string
): Promise<void> {
	await sql`
		UPDATE "Artifact" 
		SET approved_by = ${approved_by}
		WHERE project_id = ${project_id}
	`;
}

// Business Case operations
export async function getBusinessCase(project_id: number): Promise<BusinessCase | null> {
	const result = await sql`
		SELECT * FROM "BusinessCase" WHERE project_id = ${project_id}
	`;
	return result.length > 0 ? (result[0] as BusinessCase) : null;
}

export async function upsertBusinessCase(
	project_id: number,
	content: string
): Promise<BusinessCase> {
	const existing = await getBusinessCase(project_id);
	if (existing) {
		const result = await sql`
			UPDATE "BusinessCase" 
			SET content = ${content}, updated_at = NOW()
			WHERE project_id = ${project_id}
			RETURNING *
		`;
		return result[0] as BusinessCase;
	} else {
		const result = await sql`
			INSERT INTO "BusinessCase" (project_id, content, created_at, updated_at)
			VALUES (${project_id}, ${content}, NOW(), NOW())
			RETURNING *
		`;
		return result[0] as BusinessCase;
	}
}

// Requirements operations
export async function getRequirements(project_id: number): Promise<Requirements | null> {
	const result = await sql`
		SELECT * FROM "Requirements" WHERE project_id = ${project_id}
	`;
	return result.length > 0 ? (result[0] as Requirements) : null;
}

export async function upsertRequirements(
	project_id: number,
	content: string
): Promise<Requirements> {
	const existing = await getRequirements(project_id);
	if (existing) {
		const result = await sql`
			UPDATE "Requirements" 
			SET content = ${content}, updated_at = NOW()
			WHERE project_id = ${project_id}
			RETURNING *
		`;
		return result[0] as Requirements;
	} else {
		const result = await sql`
			INSERT INTO "Requirements" (project_id, content, created_at, updated_at)
			VALUES (${project_id}, ${content}, NOW(), NOW())
			RETURNING *
		`;
		return result[0] as Requirements;
	}
}

// Solution Architecture operations
export async function getSolutionArchitecture(
	project_id: number
): Promise<SolutionArchitecture | null> {
	const result = await sql`
		SELECT * FROM "SolutionArchitecture" WHERE project_id = ${project_id}
	`;
	return result.length > 0 ? (result[0] as SolutionArchitecture) : null;
}

export async function upsertSolutionArchitecture(
	project_id: number,
	content: string
): Promise<SolutionArchitecture> {
	const existing = await getSolutionArchitecture(project_id);
	if (existing) {
		const result = await sql`
			UPDATE "SolutionArchitecture" 
			SET content = ${content}, updated_at = NOW()
			WHERE project_id = ${project_id}
			RETURNING *
		`;
		return result[0] as SolutionArchitecture;
	} else {
		const result = await sql`
			INSERT INTO "SolutionArchitecture" (project_id, content, created_at, updated_at)
			VALUES (${project_id}, ${content}, NOW(), NOW())
			RETURNING *
		`;
		return result[0] as SolutionArchitecture;
	}
}

// Effort Estimate operations
export async function getEffortEstimate(project_id: number): Promise<EffortEstimate | null> {
	const result = await sql`
		SELECT * FROM "EffortEstimate" WHERE project_id = ${project_id}
	`;
	return result.length > 0 ? (result[0] as EffortEstimate) : null;
}

export async function upsertEffortEstimate(
	project_id: number,
	assumptions: string
): Promise<EffortEstimate> {
	const existing = await getEffortEstimate(project_id);
	if (existing) {
		const result = await sql`
			UPDATE "EffortEstimate" 
			SET assumptions = ${assumptions}, updated_at = NOW()
			WHERE project_id = ${project_id}
			RETURNING *
		`;
		return result[0] as EffortEstimate;
	} else {
		const result = await sql`
			INSERT INTO "EffortEstimate" (project_id, assumptions, created_at, updated_at)
			VALUES (${project_id}, ${assumptions}, NOW(), NOW())
			RETURNING *
		`;
		return result[0] as EffortEstimate;
	}
}

// Estimate Task operations
export async function createEstimateTask(
	estimate_id: number,
	task_description: string,
	assigned_role: string,
	hours: number
): Promise<EstimateTask> {
	const result = await sql`
		INSERT INTO "EstimateTask" (estimate_id, task_description, assigned_role, hours)
		VALUES (${estimate_id}, ${task_description}, ${assigned_role}, ${hours})
		RETURNING *
	`;
	return result[0] as EstimateTask;
}

export async function listEstimateTasks(estimate_id: number): Promise<EstimateTask[]> {
	const result = await sql`
		SELECT * FROM "EstimateTask" WHERE estimate_id = ${estimate_id}
	`;
	return result as EstimateTask[];
}

export async function deleteEstimateTask(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "EstimateTask" WHERE id = ${id}
	`;
	return result.length > 0;
}

// Quote operations
export async function getQuote(project_id: number): Promise<Quote | null> {
	const result = await sql`
		SELECT * FROM "Quote" WHERE project_id = ${project_id}
	`;
	return result.length > 0 ? (result[0] as Quote) : null;
}

export async function upsertQuote(
	project_id: number,
	payment_terms: string | null,
	timeline: string | null,
	is_delivered: boolean = false
): Promise<Quote> {
	const existing = await getQuote(project_id);
	if (existing) {
		const result = await sql`
			UPDATE "Quote" 
			SET payment_terms = ${payment_terms}, timeline = ${timeline}, 
			    is_delivered = ${is_delivered}, updated_at = NOW()
			WHERE project_id = ${project_id}
			RETURNING *
		`;
		return result[0] as Quote;
	} else {
		const result = await sql`
			INSERT INTO "Quote" (project_id, payment_terms, timeline, is_delivered, created_at, updated_at)
			VALUES (${project_id}, ${payment_terms}, ${timeline}, ${is_delivered}, NOW(), NOW())
			RETURNING *
		`;
		return result[0] as Quote;
	}
}

// Quote Rate operations
export async function createQuoteRate(
	quote_id: number,
	role_name: string,
	rate_per_hour: number
): Promise<QuoteRate> {
	const result = await sql`
		INSERT INTO "QuoteRate" (quote_id, role_name, rate_per_hour)
		VALUES (${quote_id}, ${role_name}, ${rate_per_hour})
		ON CONFLICT (quote_id, role_name) 
		DO UPDATE SET rate_per_hour = ${rate_per_hour}
		RETURNING *
	`;
	return result[0] as QuoteRate;
}

export async function listQuoteRates(quote_id: number): Promise<QuoteRate[]> {
	const result = await sql`
		SELECT * FROM "QuoteRate" WHERE quote_id = ${quote_id}
	`;
	return result as QuoteRate[];
}

export async function deleteQuoteRate(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "QuoteRate" WHERE id = ${id}
	`;
	return result.length > 0;
}

// Project History operations
export async function createProjectHistory(
	project_id: number,
	stage: ProjectStage,
	action: string,
	user_id?: number
): Promise<ProjectHistory> {
	const result = await sql`
		INSERT INTO "ProjectHistory" (project_id, stage, action, user_id, timestamp)
		VALUES (${project_id}, ${stage}, ${action}, ${user_id || null}, NOW())
		RETURNING *
	`;
	return result[0] as ProjectHistory;
}

export async function listProjectHistory(project_id: number): Promise<ProjectHistory[]> {
	const result = await sql`
		SELECT * FROM "ProjectHistory" WHERE project_id = ${project_id} ORDER BY timestamp DESC
	`;
	return result as ProjectHistory[];
}
