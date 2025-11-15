import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import { createArtifact, listArtifacts, createProjectHistory } from '$lib/server/projectDb';
import { BLOB_READ_WRITE_TOKEN } from '$lib/server/settings';

// GET /api/projects/[id]/artifacts - List artifacts for a project
export async function GET({ params }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const artifacts = await listArtifacts(projectId);
		return json({ artifacts });
	} catch (error) {
		console.error('Error listing artifacts:', error);
		return json({ error: 'Failed to list artifacts' }, { status: 500 });
	}
}

// POST /api/projects/[id]/artifacts - Upload an artifact
export async function POST({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const artifactType = formData.get('artifact_type') as string | null;
		const approved_by = formData.get('approved_by') as string | null;

		if (!file) {
			return json({ error: 'File is required' }, { status: 400 });
		}

		// Upload to Vercel Blob storage
		const blob = await put(file.name, file, {
			access: 'public',
			token: BLOB_READ_WRITE_TOKEN,
			addRandomSuffix: false,
			allowOverwrite: true
		});

		// Save artifact record in database
		const artifact = await createArtifact(
			projectId,
			file.name,
			blob.url,
			approved_by || 'unknown',
			artifactType || undefined
		);

		// Log in project history
		await createProjectHistory(projectId, 'Artifacts', `Artifact uploaded: ${file.name}`);

		return json({ artifact }, { status: 201 });
	} catch (error) {
		console.error('Error uploading artifact:', error);
		return json({ error: 'Failed to upload artifact' }, { status: 500 });
	}
}
