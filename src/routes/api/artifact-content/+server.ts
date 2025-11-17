import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getTextOverviewOfInternalArtifacts } from '$lib/server/internalArtifactsReader';

// GET /api/projects/[id]/artifacts/content - Get text overview of internal artifacts
export async function GET({ params }: RequestEvent) {
	try {
		const text = await getTextOverviewOfInternalArtifacts();
		return json({ text });
	} catch (error) {
		console.error('Error getting artifacts content:', error);
		return json({ text: 'No documents available.' });
	}
}
