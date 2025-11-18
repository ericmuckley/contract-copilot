import { getProject, updateProject, getAgreementsByRootId, updateAgreementNotes } from './db';
import { bedrockClient } from './bedrockClient';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { LLM_MODEL_ID } from './settings';
import type { ProjectTask, StageData } from '$lib/schema';
import { generateQuoteCSV } from '$lib/utils';

export class GetProjectDetailsTool {
	static spec = {
		toolSpec: {
			name: 'get_project_details',
			description: 'Get details for a specific project.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'The ID of the project to get details for.'
						}
					},
					required: ['id']
				}
			}
		}
	};
	static async run({ id }: { id: number | string }) {
		const project = await getProject(parseInt(id as string));
		if (!project) {
			return {
				response: [`Project with ID ${id} not found.`],
				text: JSON.stringify(`Project with ID ${id} not found.`)
			};
		}
		return {
			response: project,
			text: JSON.stringify(project)
		};
	}
}

export class GetContractDetailsTool {
	static spec = {
		toolSpec: {
			name: 'get_contract_details',
			description: 'Get details for a specific contract or agreement.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						root_id: {
							type: 'string',
							description: 'The root_id of the contract to get details for.'
						}
					},
					required: ['root_id']
				}
			}
		}
	};
	static async run({ root_id }: { root_id: string }) {
		const agreements = await getAgreementsByRootId(root_id);
		if (!agreements || agreements.length === 0) {
			return {
				response: [`Contract with root_id ${root_id} not found.`],
				text: JSON.stringify(`Contract with root_id ${root_id} not found.`)
			};
		}
		// The agreements are already sorted by version_number DESC, so take the first one
		const latestAgreement = agreements[0];
		return {
			response: latestAgreement,
			text: JSON.stringify(latestAgreement)
		};
	}
}

export class GetContractEditsSummaryTool {
	static spec = {
		toolSpec: {
			name: 'get_contract_edits_summary',
			description:
				'Get a summary of all edits / pushbacks / changes made across all versions of a contract or agreement.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						root_id: {
							type: 'string',
							description: 'The root_id of the contract to get edit history for.'
						}
					},
					required: ['root_id']
				}
			}
		}
	};
	static async run({ root_id }: { root_id: string }) {
		const agreements = await getAgreementsByRootId(root_id);
		if (!agreements || agreements.length === 0) {
			return {
				response: [`Contract with root_id ${root_id} not found.`],
				text: JSON.stringify(`Contract with root_id ${root_id} not found.`)
			};
		}

		// Extract all edits from all agreement versions
		const editsHistory = agreements.map((agreement) => ({
			version_number: agreement.version_number,
			created_at: agreement.created_at,
			edits: agreement.edits || 'No edits recorded for this version'
		}));

		return {
			response: {
				root_id,
				total_versions: agreements.length,
				edits_history: editsHistory
			},
			text: JSON.stringify({
				root_id,
				total_versions: agreements.length,
				edits_history: editsHistory
			})
		};
	}
}

export class AddNoteToContractTool {
	static spec = {
		toolSpec: {
			name: 'add_note_to_contract',
			description: 'Add a note to the latest version of a contract or agreement.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						root_id: {
							type: 'string',
							description: 'The root_id of the contract to add a note to.'
						},
						note: {
							type: 'string',
							description: 'The note to add to the contract.'
						}
					},
					required: ['root_id', 'note']
				}
			}
		}
	};
	static async run({ root_id, note }: { root_id: string; note: string }) {
		const agreements = await getAgreementsByRootId(root_id);
		if (!agreements || agreements.length === 0) {
			return {
				response: { error: `Contract with root_id ${root_id} not found.` },
				text: JSON.stringify({ error: `Contract with root_id ${root_id} not found.` })
			};
		}

		// The agreements are already sorted by version_number DESC, so take the first one
		const latestAgreement = agreements[0];

		// Ensure the agreement has an id
		if (!latestAgreement.id) {
			return {
				response: { error: `Contract with root_id ${root_id} has no valid id.` },
				text: JSON.stringify({ error: `Contract with root_id ${root_id} has no valid id.` })
			};
		}

		// Get existing notes or initialize empty array
		const existingNotes = latestAgreement.notes || [];
		const updatedNotes = [...existingNotes, note];

		// Update the agreement with the new notes
		const updatedAgreement = await updateAgreementNotes(latestAgreement.id, updatedNotes);

		if (!updatedAgreement) {
			return {
				response: { error: `Failed to update contract with root_id ${root_id}.` },
				text: JSON.stringify({ error: `Failed to update contract with root_id ${root_id}.` })
			};
		}

		return {
			response: {
				success: true,
				message: 'Note added successfully',
				agreement: updatedAgreement,
				added_note: note
			},
			text: JSON.stringify({
				success: true,
				message: 'Note added successfully',
				added_note: note
			})
		};
	}
}

export class UpdateProjectTasksTool {
	static spec = {
		toolSpec: {
			name: 'update_project_tasks',
			description:
				"Update the tasks array in a project's quote stage based on a natural language request. Can modify task hours, add/remove tasks, change roles, etc.",
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'The ID of the project to update.'
						},
						request: {
							type: 'string',
							description:
								'Natural language description of how to modify the tasks (e.g., "increase backend dev hours by 10%", "add a new QA task for 20 hours", "remove all frontend tasks")'
						}
					},
					required: ['id', 'request']
				}
			}
		}
	};

	static async run({ id, request }: { id: number | string; request: string }) {
		try {
			// 1. Fetch the project
			const project = await getProject(parseInt(id as string));
			if (!project) {
				return {
					response: { error: `Project with ID ${id} not found.` },
					text: JSON.stringify({ error: `Project with ID ${id} not found.` })
				};
			}

			// 2. Find the estimate stage
			const estimateStage = project.sdata.find((stage: StageData) => stage.name === 'estimate');
			if (!estimateStage) {
				return {
					response: { error: 'Estimate stage not found in project.' },
					text: JSON.stringify({ error: 'Estimate stage not found in project.' })
				};
			}

			// 3. Get current tasks (initialize if null)
			const currentTasks: ProjectTask[] = estimateStage.tasks || [];

			// 4. Use LLM to modify tasks based on request
			const modifiedTasks = await this.modifyTasksWithLLM(currentTasks, request);

			// 5. Update the project with modified tasks, in both estimate and quote stages
			let updatedSdata = project.sdata.map((stage: StageData) =>
				stage.name === 'estimate' ? { ...stage, tasks: modifiedTasks } : stage
			);
			// 6. Update the CSV-ready string for the quote stage
			const newCsvString = generateQuoteCSV(modifiedTasks);
			console.log(newCsvString);
			updatedSdata = updatedSdata.map((stage: StageData) =>
				stage.name === 'quote' ? { ...stage, content: newCsvString } : stage
			);

			await updateProject(parseInt(id as string), { sdata: updatedSdata });

			// 6. Return summary of changes
			return {
				response: {
					success: true,
					message: 'Tasks updated successfully',
					oldTasks: currentTasks,
					newTasks: modifiedTasks,
					changes: this.summarizeChanges(currentTasks, modifiedTasks)
				},
				text: JSON.stringify({
					success: true,
					message: 'Tasks updated successfully',
					newTasks: modifiedTasks,
					changes: this.summarizeChanges(currentTasks, modifiedTasks)
				})
			};
		} catch (error) {
			return {
				response: { error: `Failed to update tasks: ${error}` },
				text: JSON.stringify({ error: `Failed to update tasks: ${error}` })
			};
		}
	}

	private static async modifyTasksWithLLM(
		currentTasks: ProjectTask[],
		request: string
	): Promise<ProjectTask[]> {
		const systemPrompt = `You are a task modification assistant. You will receive:
1. A current array of project tasks (JSON format)
2. A user request describing how to modify those tasks

Your job is to apply the requested modifications and return ONLY the modified tasks array as valid JSON.

Each task has this structure:
{
  "role": "string (e.g., 'Backend Dev', 'Frontend Dev', 'QA Engineer')",
  "description": "string describing the task",
  "hours": number (positive integer or decimal)
}

Valid roles: Backend Dev, Frontend Dev, SW Engineer, SW Architect, QA Engineer, DevOps Engineer, Project Manager, Business Analyst

Rules:
- Respond with ONLY a JSON array, no other text
- Preserve existing tasks unless explicitly asked to modify/remove them
- When increasing/decreasing by percentage, apply to the relevant tasks
- When adding tasks, use appropriate roles and reasonable hour estimates
- Ensure all hours values are positive numbers
- Maintain the same structure for each task

Example request: "increase backend dev hours by 10%"
If current tasks = [{"role": "Backend Dev", "description": "API development", "hours": 100}]
Your response: [{"role": "Backend Dev", "description": "API development", "hours": 110}]`;

		const userPrompt = `Current tasks:
${JSON.stringify(currentTasks, null, 2)}

User request: "${request}"

Return the modified tasks array as JSON:`;

		const response = await bedrockClient.send(
			new ConverseCommand({
				modelId: LLM_MODEL_ID,
				messages: [
					{
						role: 'user',
						content: [{ text: userPrompt }]
					}
				],
				system: [{ text: systemPrompt }],
				inferenceConfig: {
					maxTokens: 2000,
					temperature: 0.1 // Low temperature for consistent, deterministic output
				}
			})
		);

		// Extract the text response
		const outputText = response.output?.message?.content?.[0]?.text || JSON.stringify(currentTasks);

		// Parse JSON from response (handle potential markdown code blocks)
		const jsonMatch = outputText.match(/\[[\s\S]*\]/);
		if (!jsonMatch) {
			throw new Error('LLM did not return valid JSON array');
		}

		const modifiedTasks = JSON.parse(jsonMatch[0]) as ProjectTask[];

		// Validate the structure
		if (!Array.isArray(modifiedTasks)) {
			throw new Error('LLM response is not an array');
		}

		for (const task of modifiedTasks) {
			if (!task.role || !task.description || typeof task.hours !== 'number' || task.hours <= 0) {
				throw new Error(`Invalid task structure: ${JSON.stringify(task)}`);
			}
		}

		return modifiedTasks;
	}

	private static summarizeChanges(
		oldTasks: ProjectTask[],
		newTasks: ProjectTask[]
	): { added: number; removed: number; modified: number; totalHoursDiff: number } {
		const added = Math.max(0, newTasks.length - oldTasks.length);
		const removed = Math.max(0, oldTasks.length - newTasks.length);
		const modified = Math.min(oldTasks.length, newTasks.length);

		const oldTotalHours = oldTasks.reduce((sum, t) => sum + t.hours, 0);
		const newTotalHours = newTasks.reduce((sum, t) => sum + t.hours, 0);

		return {
			added,
			removed,
			modified,
			totalHoursDiff: Math.round((newTotalHours - oldTotalHours) * 100) / 100
		};
	}
}
