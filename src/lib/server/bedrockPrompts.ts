import { listProjects, listAgreements } from './db';

export const getCopilotSystemPrompt = async (
	projectId: number | null,
	activeAgreementRootId: string | null
) => {
	const allProjects = await listProjects();
	let projectsString = '';
	if (allProjects.length > 0) {
		projectsString = allProjects
			.map((p) => `- ${p.project_name} (project ID ${p.id}), created by ${p.created_by}`)
			.join('\n');
	} else {
		projectsString = 'There are no existing projects.';
	}

	const allAgreements = await listAgreements();
	let agreementsString = '';
	if (allAgreements.length > 0) {
		// Group by root_id and keep only the highest version
		const latestAgreements = Object.values(
			allAgreements.reduce(
				(acc, agreement) => {
					const existing = acc[agreement.root_id];
					if (!existing || agreement.version_number > existing.version_number) {
						acc[agreement.root_id] = agreement;
					}
					return acc;
				},
				{} as Record<string, (typeof allAgreements)[0]>
			)
		);

		agreementsString = latestAgreements
			.map(
				(a) =>
					`- ${a.agreement_name} (root_id: ${a.root_id}, version: ${a.version_number}, type: ${a.agreement_type})`
			)
			.join('\n');
	} else {
		agreementsString = 'There are no existing agreements.';
	}

	let prompt = `

    # Overview

    You are an AI copilot designed to assist with contract analysis and project planning, effort, quotes, and pricing estimates.

    ## Project overview

    Here are the existing projects we're currently evaluating for pricing estimates and planning:

    ${projectsString}

    ## Current active project

    ${projectId ? `The current active selected project is: project ID ${projectId}` : 'There is no current active project selected.'}

    ## Contracts and Agreements overview

    Here are the existing contracts and agreements in the system:

    ${agreementsString}

    ## Current active contract / agreement

    ${activeAgreementRootId ? `The current active selected contract/agreement root_id is: ${activeAgreementRootId}` : 'There is no current active contract/agreement selected.'}


    ## Instructions

    - The user might ask about the currently selected project estimate, or they may ask about other existing project estimates.
    - If they ask about the current active project, or ask about a project but don't specify which project, assume they are referring to the current active project.
    - If they ask about a specific project by name or project ID, fetch that project's information using the project ID.

    - The user might ask about the currently selected contract/agreement, or they may ask about other existing contracts/agreements.
    - If they ask about the current active contract/agreement, or ask about a contract/agreement but don't specify which one, assume they are referring to the current active contract/agreement.
    - If they ask about a specific contract/agreement by name or root_id, fetch that contract/agreement's information using the root_id.

    `;

	return prompt.trim();
};
