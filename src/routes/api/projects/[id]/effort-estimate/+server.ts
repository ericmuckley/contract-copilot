import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import {
	upsertEffortEstimate,
	getEffortEstimate,
	createEstimateTask,
	listEstimateTasks,
	deleteEstimateTask,
	createProjectHistory
} from '$lib/server/projectDb';

// GET /api/projects/[id]/effort-estimate - Get effort estimate with tasks
export async function GET({ params }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const estimate = await getEffortEstimate(projectId);
		if (!estimate) {
			return json({ estimate: null, tasks: [] });
		}

		const tasks = await listEstimateTasks(estimate.id);
		return json({ estimate, tasks });
	} catch (error) {
		console.error('Error fetching effort estimate:', error);
		return json({ error: 'Failed to fetch effort estimate' }, { status: 500 });
	}
}

// PUT /api/projects/[id]/effort-estimate - Update effort estimate
export async function PUT({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const { assumptions, tasks } = await request.json();

		// Update or create effort estimate
		const estimate = await upsertEffortEstimate(projectId, assumptions || '');

		// If tasks are provided, replace all tasks
		if (tasks && Array.isArray(tasks)) {
			// Delete existing tasks
			const existingTasks = await listEstimateTasks(estimate.id);
			await Promise.all(existingTasks.map((task) => deleteEstimateTask(task.id)));

			// Create new tasks
			await Promise.all(
				tasks.map((task: { task_description: string; assigned_role: string; hours: number }) =>
					createEstimateTask(
						estimate.id,
						task.task_description,
						task.assigned_role,
						task.hours
					)
				)
			);
		}

		// Log in project history
		await createProjectHistory(projectId, 'EffortEstimate', 'Effort estimate updated');

		const updatedTasks = await listEstimateTasks(estimate.id);
		return json({ estimate, tasks: updatedTasks });
	} catch (error) {
		console.error('Error updating effort estimate:', error);
		return json({ error: 'Failed to update effort estimate' }, { status: 500 });
	}
}
