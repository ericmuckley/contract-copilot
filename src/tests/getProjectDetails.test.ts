// Test for GetProjectDetailsTool
import { GetProjectDetailsTool } from '$lib/server/bedrockTools';
import { runTest, assert, createTestProject, cleanupTestProject } from './testUtils';
import type { TestResult } from './testUtils';

export async function testGetProjectDetails(): Promise<TestResult> {
	return runTest('GetProjectDetailsTool', async () => {
		let testProjectId: number | undefined;

		try {
			// Create a test project
			const testProject = await createTestProject();
			testProjectId = testProject.id as number;

			// Test getting project details
			const result = await GetProjectDetailsTool.run({ id: testProjectId });

			// Verify the response structure
			assert(result.response !== null, 'Response should not be null');
			assert(result.text !== null, 'Text should not be null');

			// If project found, verify details
			if (typeof result.response === 'object' && 'project_name' in result.response) {
				assert(
					result.response.project_name === testProject.project_name,
					'Project name should match'
				);
				assert(result.response.created_by === 'test-user', 'Created by should match');
				assert(Array.isArray(result.response.sdata), 'Project should have sdata array');
			}

			// Test with non-existent project
			const notFoundResult = await GetProjectDetailsTool.run({ id: 999999 });
			assert(
				notFoundResult.text.includes('not found'),
				'Should return not found message for non-existent project'
			);
		} finally {
			// Cleanup
			if (testProjectId) {
				await cleanupTestProject(testProjectId);
			}
		}
	});
}
