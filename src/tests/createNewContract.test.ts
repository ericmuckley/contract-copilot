// Test for CreateNewContractTool
import { CreateNewContractTool } from '$lib/server/bedrockTools';
import {
	runTest,
	assert,
	createTestProject,
	cleanupTestProject,
	cleanupTestAgreement
} from './testUtils';
import type { TestResult } from './testUtils';

export async function testCreateNewContract(): Promise<TestResult> {
	return runTest('CreateNewContractTool', async () => {
		let testProjectId: number | undefined;
		let createdAgreementId: number | undefined;

		try {
			// Create a test project
			const testProject = await createTestProject();
			testProjectId = testProject.id as number;

			// Test creating a new contract from the project
			const result = await CreateNewContractTool.run({
				project_id: testProjectId,
				contract_type: 'SOW'
			});

			// Verify the response structure
			assert(result.response !== null, 'Response should not be null');
			assert(result.text !== null, 'Text should not be null');

			// Verify success
			if (typeof result.response === 'object' && 'success' in result.response) {
				assert(result.response.success === true, 'Should return success: true');
				assert('agreement' in result.response, 'Should include agreement in response');

				const agreement = result.response.agreement as {
					id: number;
					root_id: string;
					version_number: number;
					agreement_type: string;
					project_id: number;
					text_content: string;
				};
				assert(agreement !== null, 'Agreement should not be null');
				assert(agreement.id !== undefined, 'Agreement should have an ID');
				assert(agreement.root_id !== undefined, 'Agreement should have a root_id');
				assert(agreement.version_number === 1, 'New contract should be version 1');
				assert(agreement.agreement_type === 'SOW', 'Agreement type should be SOW');
				assert(agreement.project_id === testProjectId, 'Agreement should be linked to the project');
				assert(
					typeof agreement.text_content === 'string' && agreement.text_content.length > 0,
					'Agreement should have text content'
				); // Store the agreement ID for cleanup
				createdAgreementId = agreement.id;
			}

			// Test with non-existent project
			const notFoundResult = await CreateNewContractTool.run({
				project_id: 999999,
				contract_type: 'MSA'
			});
			assert(
				notFoundResult.text.includes('not found') || notFoundResult.text.includes('error'),
				'Should return error for non-existent project'
			);
		} finally {
			// Cleanup - delete agreement first, then project
			if (createdAgreementId) {
				await cleanupTestAgreement(createdAgreementId);
			}
			if (testProjectId) {
				await cleanupTestProject(testProjectId);
			}
		}
	});
}
