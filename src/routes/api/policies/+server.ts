import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getTextOverviewOfInternalArtifacts } from '$lib/server/internalArtifactsReader';

// GET /api/policies - Get all text from internal documents and policies
export async function GET({ params }: RequestEvent) {
	try {
		const text = await getTextOverviewOfInternalArtifacts();
		return json({ text });
	} catch (error) {
		console.error('Error listing artifacts:', error);
		return json({ text: 'No documents available.' });
	}
}
