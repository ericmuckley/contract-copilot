import { getProject } from './db';

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
