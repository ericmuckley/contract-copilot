import { listProjects } from './db';

export const getCopilotSystemPrompt = async (projectId: number | null) => {
	const allProjects = await listProjects();
	let projectsString = '';
	if (allProjects.length > 0) {
		projectsString = allProjects
			.map((p) => `- ${p.project_name} (project ID ${p.id}), created by ${p.created_by}`)
			.join('\n');
	} else {
		projectsString = 'There are no existing projects.';
	}

	let prompt = `

    # Overview

    You are an AI copilot designed to assist with contract analysis and project planning, effort, quotes, and pricing estimates.

    ## Project overview

    Here are the existing projects we're currently evaluating for pricing estimates and planning:

    ${projectsString}

    ## Current active project

    ${projectId ? `The current active selected project is: project ID ${projectId}` : 'There is no current active project selected.'}

    ## Instructions

    - The user might ask about the currently selected project, or they may ask about other existing projects.
    - If they ask about the current active project, or ask about a project but don't specify which project, assume they are referring to the current active project.
    - If they ask about a specific project by name or project ID, fetch that project's information ising the project ID.
    `;

	return prompt.trim();
};
