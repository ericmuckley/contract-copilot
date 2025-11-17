import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import {
	createArtifact,
	getProjectArtifacts,
	deleteArtifact,
	updateArtifact
} from '$lib/server/db';
import { BLOB_READ_WRITE_TOKEN } from '$lib/server/settings';
import { readFileContent } from '$lib/server/readFileContent';

// GET /api/projects/[id]/artifacts - List project artifacts or internal document artifacts
export async function GET({ params }: RequestEvent) {
	try {
		// Handle null/undefined project ID to get orphaned artifacts
		const projectIdParam = params.id || '';
		let projectId: number | null = null;

		if (projectIdParam === 'null' || projectIdParam === 'undefined' || projectIdParam === '') {
			projectId = null;
		} else {
			projectId = parseInt(projectIdParam);
			if (isNaN(projectId)) {
				return json({ error: 'Invalid project ID' }, { status: 400 });
			}
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
		// Handle null/undefined project ID to create orphaned artifacts
		const projectIdParam = params.id || '';
		let projectId: number | null = null;

		if (projectIdParam === 'null' || projectIdParam === 'undefined' || projectIdParam === '') {
			projectId = null;
		} else {
			projectId = parseInt(projectIdParam);
			if (isNaN(projectId)) {
				return json({ error: 'Invalid project ID' }, { status: 400 });
			}
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

		// Read file content from the uploaded blob
		let fileContent: string | null = null;
		try {
			fileContent = await readFileContent(blob.url);
		} catch (error) {
			console.warn('Could not read file content:', error);
			// Continue without file content if reading fails
		}

		// Save artifact record in database
		const artifact = await createArtifact({
			project_id: projectId,
			file_name: file.name,
			file_url: blob.url,
			file_content: fileContent
		});

		return json({ artifact }, { status: 201 });
	} catch (error) {
		console.error('Error uploading artifact:', error);
		return json({ error: 'Failed to upload artifact' }, { status: 500 });
	}
}

// PATCH /api/projects/[id]/artifacts?artifactId=123 - Update an artifact
export async function PATCH({ url, request }: RequestEvent) {
	try {
		const artifactIdParam = url.searchParams.get('artifactId');

		if (!artifactIdParam) {
			return json({ error: 'Artifact ID is required' }, { status: 400 });
		}

		const artifactId = parseInt(artifactIdParam);
		if (isNaN(artifactId)) {
			return json({ error: 'Invalid artifact ID' }, { status: 400 });
		}

		const body = await request.json();
		const { file_content } = body;

		if (file_content === undefined) {
			return json({ error: 'file_content is required' }, { status: 400 });
		}

		// Update artifact in database
		const artifact = await updateArtifact(artifactId, { file_content });

		if (!artifact) {
			return json({ error: 'Artifact not found' }, { status: 404 });
		}

		return json({ artifact }, { status: 200 });
	} catch (error) {
		console.error('Error updating artifact:', error);
		return json({ error: 'Failed to update artifact' }, { status: 500 });
	}
}

// DELETE /api/projects/[id]/artifacts?artifactId=123 - Delete an artifact
export async function DELETE({ url }: RequestEvent) {
	try {
		const artifactIdParam = url.searchParams.get('artifactId');

		if (!artifactIdParam) {
			return json({ error: 'Artifact ID is required' }, { status: 400 });
		}

		const artifactId = parseInt(artifactIdParam);
		if (isNaN(artifactId)) {
			return json({ error: 'Invalid artifact ID' }, { status: 400 });
		}

		// Delete from database
		const success = await deleteArtifact(artifactId);

		if (!success) {
			return json({ error: 'Artifact not found' }, { status: 404 });
		}

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error deleting artifact:', error);
		return json({ error: 'Failed to delete artifact' }, { status: 500 });
	}
}
