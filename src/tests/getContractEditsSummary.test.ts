// Test for GetContractEditsSummaryTool
import { GetContractEditsSummaryTool } from '$lib/server/bedrockTools';
import { runTest, assert, createTestAgreement, cleanupTestAgreement } from './testUtils';
import type { TestResult } from './testUtils';
import { createAgreement } from '$lib/server/db';

export async function testGetContractEditsSummary(): Promise<TestResult> {
	return runTest('GetContractEditsSummaryTool', async () => {
		const testAgreementIds: number[] = [];

		try {
			// Create a test agreement (version 1)
			const testAgreement = await createTestAgreement();
			testAgreementIds.push(testAgreement.id as number);

			// Create version 2 with edits
			const version2 = await createAgreement({
				root_id: testAgreement.root_id,
				version_number: 2,
				origin: 'internal',
				notes: [],
				edits: [
					{
						old: 'Payment within 30 days',
						new: 'Payment within 60 days',
						note: 'Extended payment terms'
					}
				],
				agreement_name: testAgreement.agreement_name,
				agreement_type: testAgreement.agreement_type,
				created_by: testAgreement.created_by,
				text_content:
					'This is a test contract. Section 1: Terms and Conditions. Payment within 60 days.',
				counterparty: testAgreement.counterparty,
				project_id: testAgreement.project_id
			});
			testAgreementIds.push(version2.id as number);

			// Test getting edits summary
			const result = await GetContractEditsSummaryTool.run({ root_id: testAgreement.root_id });

			// Verify the response structure
			assert(result.response !== null, 'Response should not be null');
			assert(result.text !== null, 'Text should not be null');

			// Verify edits history
			if (typeof result.response === 'object' && 'edits_history' in result.response) {
				assert(result.response.total_versions === 2, 'Should have 2 versions');
				assert(Array.isArray(result.response.edits_history), 'Should have edits_history array');
				assert(result.response.edits_history.length === 2, 'Should have 2 edit history entries');

				// Verify version 2 has edits
				const version2History = result.response.edits_history.find(
					(h: { version_number: number }) => h.version_number === 2
				);
				assert(version2History !== undefined, 'Should find version 2 in history');
			}

			// Test with non-existent contract
			const notFoundResult = await GetContractEditsSummaryTool.run({ root_id: 'NON-EXISTENT' });
			assert(
				notFoundResult.text.includes('not found'),
				'Should return not found message for non-existent contract'
			);
		} finally {
			// Cleanup all created agreements
			for (const id of testAgreementIds) {
				await cleanupTestAgreement(id);
			}
		}
	});
}
