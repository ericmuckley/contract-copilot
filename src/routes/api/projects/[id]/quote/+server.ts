import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import {
	upsertQuote,
	getQuote,
	createQuoteRate,
	listQuoteRates,
	deleteQuoteRate,
	createProjectHistory
} from '$lib/server/projectDb';

// GET /api/projects/[id]/quote - Get quote with rates
export async function GET({ params }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const quote = await getQuote(projectId);
		if (!quote) {
			return json({ quote: null, rates: [] });
		}

		const rates = await listQuoteRates(quote.id);
		return json({ quote, rates });
	} catch (error) {
		console.error('Error fetching quote:', error);
		return json({ error: 'Failed to fetch quote' }, { status: 500 });
	}
}

// PUT /api/projects/[id]/quote - Update quote
export async function PUT({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const { payment_terms, timeline, is_delivered, rates } = await request.json();

		// Update or create quote
		const quote = await upsertQuote(
			projectId,
			payment_terms || null,
			timeline || null,
			is_delivered || false
		);

		// If rates are provided, replace all rates
		if (rates && Array.isArray(rates)) {
			// Delete existing rates
			const existingRates = await listQuoteRates(quote.id);
			await Promise.all(existingRates.map((rate) => deleteQuoteRate(rate.id)));

			// Create new rates
			await Promise.all(
				rates.map((rate: { role_name: string; rate_per_hour: number }) =>
					createQuoteRate(quote.id, rate.role_name, rate.rate_per_hour)
				)
			);
		}

		// Log in project history
		await createProjectHistory(projectId, 'Quote', 'Quote updated');

		const updatedRates = await listQuoteRates(quote.id);
		return json({ quote, rates: updatedRates });
	} catch (error) {
		console.error('Error updating quote:', error);
		return json({ error: 'Failed to update quote' }, { status: 500 });
	}
}
