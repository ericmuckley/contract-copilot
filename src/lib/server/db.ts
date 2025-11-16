import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$lib/server/settings';
import type {
	Project,
	Artifact,
	Policy,
	Agreement,
	AgreementVersion,
	AgreementReview
} from '$lib/schema';

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

// ============================================================================
// CONTRACTS WORKFLOW - POLICIES
// ============================================================================

export async function listPolicies(): Promise<Policy[]> {
	const result = await sql`
		SELECT id, policy_type, agreement_type, title, content, metadata, created_at, updated_at
		FROM "policies"
		ORDER BY policy_type, agreement_type, title
	`;
	return result as Policy[];
}

export async function getPolicy(id: number): Promise<Policy | null> {
	const result = await sql`
		SELECT id, policy_type, agreement_type, title, content, metadata, created_at, updated_at
		FROM "policies"
		WHERE id = ${id}
	`;
	return result.length > 0 ? (result[0] as Policy) : null;
}

export async function getPoliciesByType(
	policyType: 'rule' | 'example',
	agreementType?: string
): Promise<Policy[]> {
	if (agreementType) {
		const result = await sql`
			SELECT id, policy_type, agreement_type, title, content, metadata, created_at, updated_at
			FROM "policies"
			WHERE policy_type = ${policyType} AND agreement_type = ${agreementType}
			ORDER BY title
		`;
		return result as Policy[];
	} else {
		const result = await sql`
			SELECT id, policy_type, agreement_type, title, content, metadata, created_at, updated_at
			FROM "policies"
			WHERE policy_type = ${policyType}
			ORDER BY agreement_type, title
		`;
		return result as Policy[];
	}
}

export async function createPolicy(
	policy: Omit<Policy, 'id' | 'created_at' | 'updated_at'>
): Promise<Policy> {
	const result = await sql`
		INSERT INTO "policies" (policy_type, agreement_type, title, content, metadata)
		VALUES (
			${policy.policy_type},
			${policy.agreement_type || null},
			${policy.title},
			${policy.content},
			${JSON.stringify(policy.metadata || {})}
		)
		RETURNING id, policy_type, agreement_type, title, content, metadata, created_at, updated_at
	`;
	return result[0] as Policy;
}

export async function updatePolicy(id: number, policy: Partial<Policy>): Promise<Policy | null> {
	const updates: string[] = [];
	const values: unknown[] = [];

	if (policy.policy_type !== undefined) {
		values.push(policy.policy_type);
		updates.push(`policy_type = $${values.length}`);
	}
	if (policy.agreement_type !== undefined) {
		values.push(policy.agreement_type || null);
		updates.push(`agreement_type = $${values.length}`);
	}
	if (policy.title !== undefined) {
		values.push(policy.title);
		updates.push(`title = $${values.length}`);
	}
	if (policy.content !== undefined) {
		values.push(policy.content);
		updates.push(`content = $${values.length}`);
	}
	if (policy.metadata !== undefined) {
		values.push(JSON.stringify(policy.metadata));
		updates.push(`metadata = $${values.length}`);
	}

	if (updates.length === 0) return getPolicy(id);

	values.push(id);
	updates.push('updated_at = NOW()');

	const result = await sql`
		UPDATE "policies"
		SET ${sql.unsafe(updates.join(', '))}
		WHERE id = $${values.length}
		RETURNING id, policy_type, agreement_type, title, content, metadata, created_at, updated_at
	`;
	return result.length > 0 ? (result[0] as Policy) : null;
}

export async function deletePolicy(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "policies" WHERE id = ${id}
	`;
	return result.length > 0;
}

// ============================================================================
// CONTRACTS WORKFLOW - AGREEMENTS
// ============================================================================

export async function listAgreements(): Promise<Agreement[]> {
	const result = await sql`
		SELECT 
			a.id, 
			a.agreement_type, 
			a.title, 
			a.counterparty,
			a.linked_project_id,
			a.current_version_number,
			a.status,
			a.metadata,
			a.created_at, 
			a.updated_at,
			v.id as version_id,
			v.content as version_content,
			v.notes as version_notes,
			v.created_by as version_created_by,
			v.created_at as version_created_at
		FROM "agreements" a
		LEFT JOIN "agreement_versions" v ON a.id = v.agreement_id AND a.current_version_number = v.version_number
		ORDER BY a.updated_at DESC
	`;

	const agreementsMap = new Map<number, Agreement>();

	for (const row of result) {
		if (!agreementsMap.has(row.id)) {
			agreementsMap.set(row.id, {
				id: row.id,
				agreement_type: row.agreement_type,
				title: row.title,
				counterparty: row.counterparty,
				linked_project_id: row.linked_project_id,
				current_version_number: row.current_version_number,
				status: row.status,
				metadata: row.metadata,
				created_at: row.created_at,
				updated_at: row.updated_at,
				current_version: row.version_id
					? {
							id: row.version_id,
							agreement_id: row.id,
							version_number: row.current_version_number,
							content: row.version_content,
							notes: row.version_notes,
							created_by: row.version_created_by,
							created_at: row.version_created_at
						}
					: undefined
			});
		}
	}

	return Array.from(agreementsMap.values());
}

export async function getAgreement(id: number): Promise<Agreement | null> {
	const result = await sql`
		SELECT 
			a.id, 
			a.agreement_type, 
			a.title, 
			a.counterparty,
			a.linked_project_id,
			a.current_version_number,
			a.status,
			a.metadata,
			a.created_at, 
			a.updated_at,
			v.id as version_id,
			v.version_number,
			v.content,
			v.notes,
			v.created_by,
			v.changes_summary,
			v.created_at as version_created_at
		FROM "agreements" a
		LEFT JOIN "agreement_versions" v ON a.id = v.agreement_id
		WHERE a.id = ${id}
		ORDER BY v.version_number DESC
	`;

	if (result.length === 0) return null;

	const row = result[0];
	const agreement: Agreement = {
		id: row.id,
		agreement_type: row.agreement_type,
		title: row.title,
		counterparty: row.counterparty,
		linked_project_id: row.linked_project_id,
		current_version_number: row.current_version_number,
		status: row.status,
		metadata: row.metadata,
		created_at: row.created_at,
		updated_at: row.updated_at,
		versions: []
	};

	// Add all versions
	for (const row of result) {
		if (row.version_id) {
			const version: AgreementVersion = {
				id: row.version_id,
				agreement_id: row.id,
				version_number: row.version_number,
				content: row.content,
				notes: row.notes,
				created_by: row.created_by,
				changes_summary: row.changes_summary,
				created_at: row.version_created_at
			};
			agreement.versions!.push(version);

			// Set current version
			if (row.version_number === row.current_version_number) {
				agreement.current_version = version;
			}
		}
	}

	return agreement;
}

export async function createAgreement(
	agreement: Omit<Agreement, 'id' | 'created_at' | 'updated_at' | 'current_version_number'>,
	initialContent: string,
	createdBy?: string
): Promise<Agreement> {
	// Create the agreement
	const agreementResult = await sql`
		INSERT INTO "agreements" (agreement_type, title, counterparty, linked_project_id, status, metadata)
		VALUES (
			${agreement.agreement_type},
			${agreement.title},
			${agreement.counterparty},
			${agreement.linked_project_id || null},
			${agreement.status || 'draft'},
			${JSON.stringify(agreement.metadata || {})}
		)
		RETURNING id, agreement_type, title, counterparty, linked_project_id, current_version_number, status, metadata, created_at, updated_at
	`;

	const newAgreement = agreementResult[0] as Agreement;

	// Create version 1
	await createAgreementVersion({
		agreement_id: newAgreement.id!,
		version_number: 1,
		content: initialContent,
		notes: 'Initial version',
		created_by: createdBy || null
	});

	return getAgreement(newAgreement.id!) as Promise<Agreement>;
}

export async function updateAgreement(
	id: number,
	agreement: Partial<Agreement>
): Promise<Agreement | null> {
	const updates: string[] = [];
	const values: unknown[] = [];

	if (agreement.agreement_type !== undefined) {
		values.push(agreement.agreement_type);
		updates.push(`agreement_type = $${values.length}`);
	}
	if (agreement.title !== undefined) {
		values.push(agreement.title);
		updates.push(`title = $${values.length}`);
	}
	if (agreement.counterparty !== undefined) {
		values.push(agreement.counterparty);
		updates.push(`counterparty = $${values.length}`);
	}
	if (agreement.linked_project_id !== undefined) {
		values.push(agreement.linked_project_id || null);
		updates.push(`linked_project_id = $${values.length}`);
	}
	if (agreement.current_version_number !== undefined) {
		values.push(agreement.current_version_number);
		updates.push(`current_version_number = $${values.length}`);
	}
	if (agreement.status !== undefined) {
		values.push(agreement.status);
		updates.push(`status = $${values.length}`);
	}
	if (agreement.metadata !== undefined) {
		values.push(JSON.stringify(agreement.metadata));
		updates.push(`metadata = $${values.length}`);
	}

	if (updates.length === 0) return getAgreement(id);

	values.push(id);
	updates.push('updated_at = NOW()');

	await sql`
		UPDATE "agreements"
		SET ${sql.unsafe(updates.join(', '))}
		WHERE id = $${values.length}
	`;

	return getAgreement(id);
}

export async function deleteAgreement(id: number): Promise<boolean> {
	const result = await sql`
		DELETE FROM "agreements" WHERE id = ${id}
	`;
	return result.length > 0;
}

// ============================================================================
// CONTRACTS WORKFLOW - AGREEMENT VERSIONS
// ============================================================================

export async function getAgreementVersions(agreementId: number): Promise<AgreementVersion[]> {
	const result = await sql`
		SELECT id, agreement_id, version_number, content, notes, created_by, changes_summary, created_at
		FROM "agreement_versions"
		WHERE agreement_id = ${agreementId}
		ORDER BY version_number DESC
	`;
	return result as AgreementVersion[];
}

export async function getAgreementVersion(
	agreementId: number,
	versionNumber: number
): Promise<AgreementVersion | null> {
	const result = await sql`
		SELECT id, agreement_id, version_number, content, notes, created_by, changes_summary, created_at
		FROM "agreement_versions"
		WHERE agreement_id = ${agreementId} AND version_number = ${versionNumber}
	`;
	return result.length > 0 ? (result[0] as AgreementVersion) : null;
}

export async function createAgreementVersion(
	version: Omit<AgreementVersion, 'id' | 'created_at'>
): Promise<AgreementVersion> {
	const result = await sql`
		INSERT INTO "agreement_versions" (agreement_id, version_number, content, notes, created_by, changes_summary)
		VALUES (
			${version.agreement_id},
			${version.version_number},
			${version.content},
			${version.notes || null},
			${version.created_by || null},
			${JSON.stringify(version.changes_summary || null)}
		)
		RETURNING id, agreement_id, version_number, content, notes, created_by, changes_summary, created_at
	`;
	return result[0] as AgreementVersion;
}

// ============================================================================
// CONTRACTS WORKFLOW - AGREEMENT REVIEWS
// ============================================================================

export async function listAgreementReviews(agreementId: number): Promise<AgreementReview[]> {
	const result = await sql`
		SELECT id, agreement_id, source_version_number, review_type, proposed_changes, applied_changes, notes, created_at
		FROM "agreement_reviews"
		WHERE agreement_id = ${agreementId}
		ORDER BY created_at DESC
	`;
	return result as AgreementReview[];
}

export async function getAgreementReview(id: number): Promise<AgreementReview | null> {
	const result = await sql`
		SELECT id, agreement_id, source_version_number, review_type, proposed_changes, applied_changes, notes, created_at
		FROM "agreement_reviews"
		WHERE id = ${id}
	`;
	return result.length > 0 ? (result[0] as AgreementReview) : null;
}

export async function createAgreementReview(
	review: Omit<AgreementReview, 'id' | 'created_at'>
): Promise<AgreementReview> {
	const result = await sql`
		INSERT INTO "agreement_reviews" (agreement_id, source_version_number, review_type, proposed_changes, applied_changes, notes)
		VALUES (
			${review.agreement_id},
			${review.source_version_number},
			${review.review_type},
			${JSON.stringify(review.proposed_changes)},
			${JSON.stringify(review.applied_changes || [])},
			${review.notes || null}
		)
		RETURNING id, agreement_id, source_version_number, review_type, proposed_changes, applied_changes, notes, created_at
	`;
	return result[0] as AgreementReview;
}

export async function updateAgreementReview(
	id: number,
	review: Partial<AgreementReview>
): Promise<AgreementReview | null> {
	const updates: string[] = [];
	const values: unknown[] = [];

	if (review.proposed_changes !== undefined) {
		values.push(JSON.stringify(review.proposed_changes));
		updates.push(`proposed_changes = $${values.length}`);
	}
	if (review.applied_changes !== undefined) {
		values.push(JSON.stringify(review.applied_changes));
		updates.push(`applied_changes = $${values.length}`);
	}
	if (review.notes !== undefined) {
		values.push(review.notes || null);
		updates.push(`notes = $${values.length}`);
	}

	if (updates.length === 0) return getAgreementReview(id);

	values.push(id);

	await sql`
		UPDATE "agreement_reviews"
		SET ${sql.unsafe(updates.join(', '))}
		WHERE id = $${values.length}
	`;

	return getAgreementReview(id);
}
