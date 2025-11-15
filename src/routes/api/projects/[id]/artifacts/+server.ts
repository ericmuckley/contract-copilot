import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import { createArtifact, getProjectArtifacts } from '$lib/server/db';
import { BLOB_READ_WRITE_TOKEN } from '$lib/server/settings';

// GET /api/projects/[id]/artifacts - List artifacts for a project
export async function GET({ params }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const artifacts = await getProjectArtifacts(projectId);
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
		const artifact = await createArtifact({
			project_id: projectId,
			file_name: file.name,
			file_url: blob.url
		});

		return json({ artifact }, { status: 201 });
	} catch (error) {
		console.error('Error uploading artifact:', error);
		return json({ error: 'Failed to upload artifact' }, { status: 500 });
	}
}
