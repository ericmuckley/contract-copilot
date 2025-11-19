// Test for UpdateProjectTasksTool
import { UpdateProjectTasksTool } from '$lib/server/bedrockTools';
import { runTest, assert, createTestProject, cleanupTestProject } from './testUtils';
import type { TestResult } from './testUtils';
import { getProject } from '$lib/server/db';

export async function testUpdateProjectTasks(): Promise<TestResult> {
	return runTest('UpdateProjectTasksTool', async () => {
		let testProjectId: number | undefined;

		try {
			// Create a test project
			const testProject = await createTestProject();
			testProjectId = testProject.id as number;

			// Get initial task hours
			const estimateStage = testProject.sdata.find((stage) => stage.name === 'estimate');
			assert(estimateStage !== undefined, 'Project should have estimate stage');
			assert(
				estimateStage !== undefined && estimateStage.tasks !== null,
				'Estimate stage should have tasks'
			);

			const initialTasks = estimateStage!.tasks || [];
			const initialBackendHours = initialTasks.find((t) => t.role === 'Backend Dev')
				?.hours as number;

			// Test updating tasks with a simple request
			const result = await UpdateProjectTasksTool.run({
				id: testProjectId,
				request: 'increase backend dev hours by 10'
			});

			// Verify the response structure
			assert(result.response !== null, 'Response should not be null');
			assert(result.text !== null, 'Text should not be null');

			// Verify success
			if (typeof result.response === 'object' && 'success' in result.response) {
				assert(result.response.success === true, 'Should return success: true');
				assert('newTasks' in result.response, 'Should include newTasks in response');
				assert('changes' in result.response, 'Should include changes summary in response');

				// Verify the tasks were updated in the database
				const updatedProject = await getProject(testProjectId);
				assert(updatedProject !== null, 'Project should still exist');

				const updatedEstimateStage = updatedProject!.sdata.find(
					(stage) => stage.name === 'estimate'
				);
				assert(updatedEstimateStage !== undefined, 'Updated project should have estimate stage');

				const updatedTasks = updatedEstimateStage!.tasks || [];
				const updatedBackendTask = updatedTasks.find((t) => t.role === 'Backend Dev');

				assert(updatedBackendTask !== undefined, 'Should still have Backend Dev task');
				assert(
					updatedBackendTask!.hours >= initialBackendHours,
					'Backend hours should have increased'
				);
			}

			// Test with non-existent project
			const notFoundResult = await UpdateProjectTasksTool.run({
				id: 999999,
				request: 'increase hours by 10'
			});
			assert(
				notFoundResult.text.includes('not found') || notFoundResult.text.includes('error'),
				'Should return error for non-existent project'
			);
		} finally {
			// Cleanup
			if (testProjectId) {
				await cleanupTestProject(testProjectId);
			}
		}
	});
}
