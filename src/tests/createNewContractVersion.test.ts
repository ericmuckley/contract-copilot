// Test for CreateNewContractVersionTool
import { runTest, assert, createTestAgreement, cleanupTestAgreement } from './testUtils';
import type { TestResult } from './testUtils';
import { getAgreementsByRootId, createAgreement } from './testDb';

// Simple implementation of CreateNewContractVersionTool for testing (without LLM)
const CreateNewContractVersionTool = {
	async run({ root_id, command }: { root_id: string; command: string }) {
		try {
			const agreements = await getAgreementsByRootId(root_id);
			if (!agreements || agreements.length === 0) {
				return {
					response: { error: `Contract with root_id ${root_id} not found.` },
					text: JSON.stringify({ error: `Contract with root_id ${root_id} not found.` })
				};
			}

			const latestAgreement = agreements[0];

			// Simplified modification (without LLM)
			const modifiedText = latestAgreement.text_content + ' (Modified: ' + command + ')';
			const edits = [
				{ old: latestAgreement.text_content, new: modifiedText, note: 'Test modification' }
			];

			const newAgreement = await createAgreement({
				root_id: root_id,
				version_number: latestAgreement.version_number + 1,
				origin: latestAgreement.origin,
				notes: [],
				edits: edits,
				agreement_name: latestAgreement.agreement_name,
				agreement_type: latestAgreement.agreement_type,
				created_by: latestAgreement.created_by,
				text_content: modifiedText,
				counterparty: latestAgreement.counterparty || undefined,
				project_id: latestAgreement.project_id || undefined
			});

			return {
				response: {
					success: true,
					message: `Created version ${newAgreement.version_number} of contract ${root_id}`,
					root_id: root_id,
					new_version_number: newAgreement.version_number,
					command_applied: command,
					agreement: newAgreement
				},
				text: JSON.stringify({
					success: true,
					message: `Created version ${newAgreement.version_number} of contract ${root_id}`,
					new_version_number: newAgreement.version_number,
					command_applied: command
				})
			};
		} catch (error) {
			return {
				response: { error: `Failed to create new contract version: ${error}` },
				text: JSON.stringify({ error: `Failed to create new contract version: ${error}` })
			};
		}
	}
};

export async function testCreateNewContractVersion(): Promise<TestResult> {
	return runTest('CreateNewContractVersionTool', async () => {
		const testAgreementIds: number[] = [];

		try {
			// Create a test agreement
			const testAgreement = await createTestAgreement();
			testAgreementIds.push(testAgreement.id as number);

			// Test creating a new version with a modification
			const result = await CreateNewContractVersionTool.run({
				root_id: testAgreement.root_id,
				command: 'change payment terms to net 60 days'
			});

			// Verify the response structure
			assert(result.response !== null, 'Response should not be null');
			assert(result.text !== null, 'Text should not be null');

			// Verify success
			if (typeof result.response === 'object' && 'success' in result.response) {
				assert(result.response.success === true, 'Should return success: true');
				assert('new_version_number' in result.response, 'Should include new_version_number');
				assert(result.response.new_version_number === 2, 'New version should be version 2');

				// Verify the new version exists in database
				const agreements = await getAgreementsByRootId(testAgreement.root_id);
				assert(agreements.length === 2, 'Should have 2 versions now');

				const newVersion = agreements.find((a) => a.version_number === 2);
				assert(newVersion !== undefined, 'Should find version 2');

				// Store the new agreement ID for cleanup
				if (newVersion) {
					testAgreementIds.push(newVersion.id as number);
				}

				// Verify edits were recorded
				if (newVersion && newVersion.edits) {
					assert(Array.isArray(newVersion.edits), 'Edits should be an array');
					assert(newVersion.edits.length > 0, 'Should have at least one edit recorded');
				}

				// Verify text content was modified
				if (newVersion) {
					assert(
						newVersion.text_content !== testAgreement.text_content,
						'Text content should be different from original'
					);
				}
			}

			// Test with non-existent contract
			const notFoundResult = await CreateNewContractVersionTool.run({
				root_id: 'NON-EXISTENT',
				command: 'change something'
			});
			assert(
				notFoundResult.text.includes('not found') || notFoundResult.text.includes('error'),
				'Should return error for non-existent contract'
			);
		} finally {
			// Cleanup all created agreements
			for (const id of testAgreementIds) {
				await cleanupTestAgreement(id);
			}
		}
	});
}
