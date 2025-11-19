// Test for GetContractDetailsTool
import { GetContractDetailsTool } from '$lib/server/bedrockTools';
import { runTest, assert, createTestAgreement, cleanupTestAgreement } from './testUtils';
import type { TestResult } from './testUtils';

export async function testGetContractDetails(): Promise<TestResult> {
	return runTest('GetContractDetailsTool', async () => {
		let testAgreementId: number | undefined;

		try {
			// Create a test agreement
			const testAgreement = await createTestAgreement();
			testAgreementId = testAgreement.id as number;

			// Test getting contract details
			const result = await GetContractDetailsTool.run({ root_id: testAgreement.root_id });

			// Verify the response structure
			assert(result.response !== null, 'Response should not be null');
			assert(result.text !== null, 'Text should not be null');

			// If contract found, verify details
			if (typeof result.response === 'object' && 'agreement_name' in result.response) {
				assert(
					result.response.agreement_name === testAgreement.agreement_name,
					'Agreement name should match'
				);
				assert(result.response.root_id === testAgreement.root_id, 'Root ID should match');
				assert(
					result.response.version_number === 1,
					'Version number should be 1 for initial version'
				);
			}

			// Test with non-existent contract
			const notFoundResult = await GetContractDetailsTool.run({ root_id: 'NON-EXISTENT' });
			assert(
				notFoundResult.text.includes('not found'),
				'Should return not found message for non-existent contract'
			);
		} finally {
			// Cleanup
			if (testAgreementId) {
				await cleanupTestAgreement(testAgreementId);
			}
		}
	});
}
