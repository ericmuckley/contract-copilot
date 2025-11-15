import { getProject, listProjects, updateProject } from './db';
import { PROJECT_PERSONNEL_RATES } from '$lib/schema';

export interface ToolContext {
	activeProjectId?: number;
}

export class CheckTheWeatherTool {
	static spec = {
		toolSpec: {
			name: 'check_the_weather',
			description: 'Check the weather for a specific zip code.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						zip: {
							type: 'string',
							description: 'The zip code to check the weather for.'
						}
					},
					required: ['zip']
				}
			}
		}
	};
	static async run({ zip }: { zip: string }) {
		const text = `The weather is 67 degrees and sunny in ${zip}.`;
		return {
			response: [text],
			text: JSON.stringify(text)
		};
	}
}

export class GetCurrentProjectTool {
	static spec = {
		toolSpec: {
			name: 'get_current_project',
			description:
				'Get information about the currently active project, including its name, stage, tasks, and estimates.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {},
					required: []
				}
			}
		}
	};
	static async run(_input: Record<string, never>, context?: ToolContext) {
		if (!context?.activeProjectId) {
			return {
				response: ['No active project. Please navigate to a project page first.'],
				text: 'No active project'
			};
		}

		const project = await getProject(context.activeProjectId);
		if (!project) {
			return {
				response: ['Project not found'],
				text: 'Project not found'
			};
		}

		const currentStageIdx = project.sdata.filter((s) => s.approved).length;
		const currentStage = project.sdata[currentStageIdx];
		const estimateStage = project.sdata[4]; // estimate stage is always index 4
		const tasks = estimateStage.tasks || [];

		let summary = `**Project: ${project.project_name}**\n\n`;
		summary += `Current Stage: ${currentStage.name}\n`;
		summary += `Created by: ${project.created_by}\n\n`;

		if (tasks.length > 0) {
			const totalHours = tasks.reduce((sum, task) => sum + Number(task.hours), 0);
			const totalCost = tasks.reduce((sum, task) => {
				const rate =
					PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
				return sum + Number(task.hours) * rate;
			}, 0);

			summary += `**Estimate Summary:**\n`;
			summary += `- Total Hours: ${totalHours}\n`;
			summary += `- Total Cost: $${totalCost.toLocaleString()}\n`;
			summary += `- Number of Tasks: ${tasks.length}\n\n`;

			summary += `**Tasks:**\n`;
			tasks.forEach((task, idx) => {
				const rate =
					PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
				const cost = Number(task.hours) * rate;
				summary += `${idx + 1}. ${task.description} (${task.role}, ${task.hours}h @ $${rate}/h = $${cost})\n`;
			});
		}

		return {
			response: [summary],
			text: JSON.stringify({ project, currentStageIdx, tasks })
		};
	}
}

export class GetProjectByNameTool {
	static spec = {
		toolSpec: {
			name: 'get_project_by_name',
			description: 'Find and retrieve a project by its name. Supports partial name matching.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							description: 'The name or partial name of the project to find.'
						}
					},
					required: ['name']
				}
			}
		}
	};
	static async run({ name }: { name: string }) {
		const projects = await listProjects();
		const matchingProjects = projects.filter((p) =>
			p.project_name.toLowerCase().includes(name.toLowerCase())
		);

		if (matchingProjects.length === 0) {
			return {
				response: [`No projects found matching "${name}"`],
				text: 'No projects found'
			};
		}

		if (matchingProjects.length === 1) {
			const project = matchingProjects[0];
			const estimateStage = project.sdata[4];
			const tasks = estimateStage.tasks || [];
			const totalHours = tasks.reduce((sum, task) => sum + Number(task.hours), 0);
			const totalCost = tasks.reduce((sum, task) => {
				const rate =
					PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
				return sum + Number(task.hours) * rate;
			}, 0);

			let summary = `**Project: ${project.project_name}**\n\n`;
			summary += `ID: ${project.id}\n`;
			summary += `Created by: ${project.created_by}\n`;
			summary += `Total Hours: ${totalHours}\n`;
			summary += `Total Cost: $${totalCost.toLocaleString()}\n`;
			summary += `Number of Tasks: ${tasks.length}\n`;

			return {
				response: [summary],
				text: JSON.stringify({ project, tasks, totalHours, totalCost })
			};
		}

		// Multiple matches
		let summary = `Found ${matchingProjects.length} projects matching "${name}":\n\n`;
		matchingProjects.forEach((p) => {
			const tasks = p.sdata[4].tasks || [];
			const totalHours = tasks.reduce((sum, task) => sum + Number(task.hours), 0);
			summary += `- ${p.project_name} (ID: ${p.id}, ${totalHours}h)\n`;
		});

		return {
			response: [summary],
			text: JSON.stringify({ matchingProjects })
		};
	}
}

export class UpdateProjectTasksTool {
	static spec = {
		toolSpec: {
			name: 'update_project_tasks',
			description:
				'Update tasks in the current project estimate stage. Can add new tasks, modify existing tasks, or adjust hours. Always operates on the currently active project.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						action: {
							type: 'string',
							enum: ['add', 'modify', 'adjust_hours', 'remove'],
							description:
								'Action to perform: "add" adds a new task, "modify" updates an existing task, "adjust_hours" adjusts hours by percentage or amount, "remove" deletes a task'
						},
						task_index: {
							type: 'number',
							description:
								'For modify/remove actions: zero-based index of the task to update (e.g., 0 for first task)'
						},
						role: {
							type: 'string',
							description:
								'For add/modify: Role for the task (e.g., "Backend Dev", "Frontend Dev", "QA Engineer")'
						},
						description: {
							type: 'string',
							description: 'For add/modify: Description of the task'
						},
						hours: {
							type: 'number',
							description: 'For add/modify: Number of hours for the task'
						},
						adjustment: {
							type: 'string',
							description:
								'For adjust_hours: Adjustment as percentage (e.g., "+10%", "-20%") or absolute hours (e.g., "+5", "-10")'
						},
						filter: {
							type: 'string',
							description:
								'For adjust_hours: Optional role filter to adjust only tasks for specific role (e.g., "Backend Dev")'
						}
					},
					required: ['action']
				}
			}
		}
	};
	static async run(
		input: {
			action: string;
			task_index?: number;
			role?: string;
			description?: string;
			hours?: number;
			adjustment?: string;
			filter?: string;
		},
		context?: ToolContext
	) {
		if (!context?.activeProjectId) {
			return {
				response: ['No active project. Please navigate to a project page first.'],
				text: 'No active project',
				updateRequired: false
			};
		}

		const project = await getProject(context.activeProjectId);
		if (!project) {
			return {
				response: ['Project not found'],
				text: 'Project not found',
				updateRequired: false
			};
		}

		const estimateStageIdx = 4;
		const estimateStage = project.sdata[estimateStageIdx];
		let tasks = [...(estimateStage.tasks || [])];

		let message = '';

		switch (input.action) {
			case 'add':
				if (!input.role || !input.description || input.hours === undefined) {
					return {
						response: [
							'Missing required fields: role, description, and hours are required for add action'
						],
						text: 'Invalid input',
						updateRequired: false
					};
				}
				tasks.push({
					role: input.role,
					description: input.description,
					hours: input.hours
				});
				message = `Added task: ${input.description} (${input.role}, ${input.hours}h)`;
				break;

			case 'modify':
				if (
					input.task_index === undefined ||
					input.task_index < 0 ||
					input.task_index >= tasks.length
				) {
					return {
						response: [`Invalid task index. Must be between 0 and ${tasks.length - 1}`],
						text: 'Invalid task index',
						updateRequired: false
					};
				}
				if (input.role) tasks[input.task_index].role = input.role;
				if (input.description) tasks[input.task_index].description = input.description;
				if (input.hours !== undefined) tasks[input.task_index].hours = input.hours;
				message = `Updated task ${input.task_index}: ${tasks[input.task_index].description}`;
				break;

			case 'adjust_hours':
				if (!input.adjustment) {
					return {
						response: ['Adjustment value is required for adjust_hours action'],
						text: 'Invalid input',
						updateRequired: false
					};
				}
				{
					const isPercentage = input.adjustment.includes('%');
					const value = parseFloat(input.adjustment.replace('%', ''));

					tasks = tasks.map((task) => {
						if (input.filter && task.role !== input.filter) {
							return task;
						}

						let newHours = task.hours;
						if (isPercentage) {
							newHours = task.hours * (1 + value / 100);
						} else {
							newHours = task.hours + value;
						}
						newHours = Math.max(0, Math.round(newHours * 10) / 10); // Round to 1 decimal

						return { ...task, hours: newHours };
					});

					message = `Adjusted hours by ${input.adjustment}`;
					if (input.filter) {
						message += ` for ${input.filter} tasks`;
					}
				}
				break;

			case 'remove':
				if (
					input.task_index === undefined ||
					input.task_index < 0 ||
					input.task_index >= tasks.length
				) {
					return {
						response: [`Invalid task index. Must be between 0 and ${tasks.length - 1}`],
						text: 'Invalid task index',
						updateRequired: false
					};
				}
				{
					const removedTask = tasks[input.task_index];
					tasks.splice(input.task_index, 1);
					message = `Removed task: ${removedTask.description}`;
				}
				break;

			default:
				return {
					response: ['Invalid action'],
					text: 'Invalid action',
					updateRequired: false
				};
		}

		// Update the project
		const updatedSdata = [...project.sdata];
		updatedSdata[estimateStageIdx] = {
			...estimateStage,
			tasks,
			updated_at: new Date().toISOString()
		};

		await updateProject(context.activeProjectId, { sdata: updatedSdata });

		const totalHours = tasks.reduce((sum, task) => sum + Number(task.hours), 0);
		const totalCost = tasks.reduce((sum, task) => {
			const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
			return sum + Number(task.hours) * rate;
		}, 0);

		return {
			response: [
				`${message}\n\nUpdated estimate: ${tasks.length} tasks, ${totalHours}h total, $${totalCost.toLocaleString()}`
			],
			text: JSON.stringify({ tasks, totalHours, totalCost }),
			updateRequired: true
		};
	}
}
