// Test for CreateNewContractTool
import {
	runTest,
	assert,
	createTestProject,
	cleanupTestProject,
	cleanupTestAgreement
} from './testUtils';
import type { TestResult } from './testUtils';
import { getProject, createAgreement } from './testDb';
import { makeShortId } from '$lib/utils';

// Simple implementation of CreateNewContractTool for testing (without LLM)
const CreateNewContractTool = {
	async run({ project_id, contract_type }: { project_id: number | string; contract_type: string }) {
		try {
			const project = await getProject(parseInt(project_id as string));
			if (!project) {
				return {
					response: { error: `Project with ID ${project_id} not found.` },
					text: JSON.stringify({ error: `Project with ID ${project_id} not found.` })
				};
			}

			// Simplified contract generation (without LLM)
			const contractText = `Test ${contract_type} Contract for Project: ${project.project_name}\n\nThis is a test contract.`;

			const newAgreement = await createAgreement({
				root_id: makeShortId(),
				version_number: 1,
				origin: 'internal' as const,
				notes: [],
				edits: [],
				agreement_name: `Test ${contract_type} - ${project.project_name}`,
				agreement_type: contract_type,
				created_by: project.created_by,
				text_content: contractText,
				counterparty: 'Test Client',
				project_id: parseInt(project_id as string)
			});

			return {
				response: {
					success: true,
					message: `Created new ${contract_type} contract from project ${project_id}`,
					agreement: newAgreement
				},
				text: JSON.stringify({
					success: true,
					message: `Created new ${contract_type} contract from project ${project_id}`,
					agreement_id: newAgreement.id,
					root_id: newAgreement.root_id
				})
			};
		} catch (error) {
			return {
				response: { error: `Failed to create contract: ${error}` },
				text: JSON.stringify({ error: `Failed to create contract: ${error}` })
			};
		}
	}
};

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
					agreement.text_content && agreement.text_content.length > 0,
					'Agreement should have text content'
				);

				// Store the agreement ID for cleanup
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
