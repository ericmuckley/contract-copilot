// Test for AddNoteToContractTool
import { AddNoteToContractTool } from '$lib/server/bedrockTools';
import { runTest, assert, createTestAgreement, cleanupTestAgreement } from './testUtils';
import type { TestResult } from './testUtils';

export async function testAddNoteToContract(): Promise<TestResult> {
	return runTest('AddNoteToContractTool', async () => {
		let testAgreementId: number | undefined;

		try {
			// Create a test agreement
			const testAgreement = await createTestAgreement();
			testAgreementId = testAgreement.id as number;

			// Test adding a note
			const testNote = 'This is a test note added by automated test';
			const result = await AddNoteToContractTool.run({
				root_id: testAgreement.root_id,
				note: testNote
			});

			// Verify the response structure
			assert(result.response !== null, 'Response should not be null');
			assert(result.text !== null, 'Text should not be null');

			// Verify success
			if (typeof result.response === 'object' && 'success' in result.response) {
				assert(result.response.success === true, 'Should return success: true');
				assert('added_note' in result.response, 'Should include added_note in response');
				assert(result.response.added_note === testNote, 'Added note should match the input note');

				// Verify the note was actually added
				if ('agreement' in result.response && result.response.agreement) {
					const agreement = result.response.agreement as {
						notes: string[];
					};
					assert(Array.isArray(agreement.notes), 'Agreement should have notes array');
					assert(agreement.notes.includes(testNote), 'Notes should include the added note');
				}
			}

			// Test adding another note
			const secondNote = 'Second test note';
			const result2 = await AddNoteToContractTool.run({
				root_id: testAgreement.root_id,
				note: secondNote
			});

			if (typeof result2.response === 'object' && 'agreement' in result2.response) {
				const agreement = result2.response.agreement as {
					notes: string[];
				};
				assert(agreement.notes.length === 2, 'Should have 2 notes after adding second note');
				assert(agreement.notes.includes(secondNote), 'Should include the second note');
			}

			// Test with non-existent contract
			const notFoundResult = await AddNoteToContractTool.run({
				root_id: 'NON-EXISTENT',
				note: 'Test'
			});
			assert(
				notFoundResult.text.includes('not found') || notFoundResult.text.includes('error'),
				'Should return error for non-existent contract'
			);
		} finally {
			// Cleanup
			if (testAgreementId) {
				await cleanupTestAgreement(testAgreementId);
			}
		}
	});
}
