import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Message } from '@aws-sdk/client-bedrock-runtime';
import { streamInference } from '$lib/server/bedrockClient';
import {
	getProject,
	listArtifacts,
	getBusinessCase,
	getRequirements,
	getSolutionArchitecture
} from '$lib/server/projectDb';
import type { ProjectStage } from '$lib/types/project';

// POST /api/projects/[id]/generate - Generate content for a stage using LLM
export async function POST({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const { stage, contentType } = await request.json();
		if (!stage) {
			return json({ error: 'Stage is required' }, { status: 400 });
		}

		const project = await getProject(projectId);
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		// Build the context from artifacts and previous stages
		const context = await buildContextForStage(projectId, stage as ProjectStage);

		// Generate the prompt based on the stage and content type
		const prompt = generatePromptForStage(
			stage as ProjectStage,
			project.name,
			context,
			contentType
		);

		// Create message for LLM
		const messages: Message[] = [
			{
				role: 'user',
				content: [{ text: prompt }]
			}
		];

		// Stream the LLM response
		const bedrockStream = await streamInference({
			messages,
			systemMessages: [
				{
					text: 'You are an expert at project planning, cost estimation, and solution architecture. Provide detailed, structured, and professional responses.'
				}
			],
			useTools: false
		});

		// Create a ReadableStream that processes the Bedrock response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					if (bedrockStream) {
						for await (const chunk of bedrockStream) {
							// Handle content block delta (text chunks)
							if (chunk.contentBlockDelta?.delta?.text) {
								const text = chunk.contentBlockDelta.delta.text;
								controller.enqueue(
									new TextEncoder().encode(
										JSON.stringify({
											type: 'text',
											text
										}) + '\n'
									)
								);
							}

							// Handle message stop
							if (chunk.messageStop) {
								controller.enqueue(
									new TextEncoder().encode(
										JSON.stringify({
											type: 'message_stop',
											stopReason: chunk.messageStop.stopReason
										}) + '\n'
									)
								);
								break;
							}
						}
					}
					controller.close();
				} catch (error) {
					console.error('Streaming error:', error);
					controller.error(error);
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'application/x-ndjson'
			}
		});
	} catch (error) {
		console.error('Error generating content:', error);
		return json({ error: 'Failed to generate content' }, { status: 500 });
	}
}

async function buildContextForStage(projectId: number, stage: ProjectStage): Promise<string> {
	const parts: string[] = [];

	// Always include artifacts
	const artifacts = await listArtifacts(projectId);
	if (artifacts.length > 0) {
		parts.push('### Uploaded Artifacts:');
		artifacts.forEach((artifact) => {
			parts.push(`- ${artifact.file_name} (${artifact.artifact_type || 'document'})`);
		});
		parts.push(
			'\nNote: The actual content of these artifacts would be analyzed, but for this generation we will work with the context provided.'
		);
	}

	// Include previous stage content based on current stage
	if (stage === 'Requirements' || stage === 'SolutionArchitecture' || stage === 'EffortEstimate') {
		const businessCase = await getBusinessCase(projectId);
		if (businessCase?.content) {
			parts.push('\n### Business Case:');
			parts.push(businessCase.content);
		}
	}

	if (stage === 'SolutionArchitecture' || stage === 'EffortEstimate') {
		const requirements = await getRequirements(projectId);
		if (requirements?.content) {
			parts.push('\n### Requirements:');
			parts.push(requirements.content);
		}
	}

	if (stage === 'EffortEstimate') {
		const solution = await getSolutionArchitecture(projectId);
		if (solution?.content) {
			parts.push('\n### Solution/Architecture:');
			parts.push(solution.content);
		}
	}

	return parts.join('\n');
}

function generatePromptForStage(
	stage: ProjectStage,
	projectName: string,
	context: string,
	contentType?: string
): string {
	switch (stage) {
		case 'BusinessCase':
			return `You are analyzing the project "${projectName}" to create a comprehensive business case.

${context}

Based on the artifacts and context provided, generate a detailed business case that includes:

1. **Project Scope**: What is included and what is explicitly out of scope
2. **Business Outcomes**: Expected benefits, ROI, and success metrics
3. **Constraints**: Timeline constraints, budget considerations, technical limitations, resource availability
4. **Risks**: Key risks and mitigation strategies
5. **Stakeholders**: Key stakeholders and their interests

Format your response in clear sections with markdown formatting.`;

		case 'Requirements':
			return `You are analyzing the project "${projectName}" to create a detailed requirements summary.

${context}

Based on the artifacts and business case, generate a comprehensive requirements summary that includes:

1. **Functional Requirements**: Key features and capabilities the system must have
2. **Non-Functional Requirements**: Performance, security, scalability, usability requirements
3. **User Stories**: Main user stories or use cases (if applicable)
4. **Acceptance Criteria**: How we'll know the requirements are met
5. **Dependencies**: External systems, APIs, or resources required

Format your response in clear sections with markdown formatting.`;

		case 'SolutionArchitecture':
			return `You are designing the solution architecture for project "${projectName}".

${context}

Based on all the information provided, create a detailed solution/architecture document that includes:

1. **Approach**: Overall approach and methodology
2. **System Architecture**: High-level system architecture and components
3. **Technology Stack**: Recommended technologies, frameworks, and tools
4. **Integration Points**: How different components/systems will integrate
5. **Security Considerations**: Security measures and best practices
6. **Risks and Mitigation**: Technical risks and how to address them
7. **Alternatives Considered**: Other approaches considered and why this one was chosen

Format your response in clear sections with markdown formatting.`;

		case 'EffortEstimate':
			if (contentType === 'assumptions') {
				return `You are creating the assumptions section for a detailed effort estimate for project "${projectName}".

${context}

Based on all the information provided, list the key assumptions underlying this effort estimate.

Format your response as clear, structured markdown. Include assumptions about:
- Team composition and skill levels
- Working hours and availability
- Technology and tools available
- External dependencies
- Project constraints
- Risk factors

Keep the response concise but comprehensive.`;
			} else if (contentType === 'tasks') {
				return `You are creating the Work Breakdown Structure (WBS) for project "${projectName}".

${context}

Based on all the information provided, create a detailed list of tasks for this project.

Provide ONLY a JSON array where each task has:
- task_description: Clear description of the task
- assigned_role: Role responsible (e.g., "Backend Developer", "Frontend Developer", "QA Engineer", "DevOps", "Project Manager")
- hours: Estimated hours for the task

Output ONLY the JSON array with no additional text or formatting:
[
  {
    "task_description": "Task description here",
    "assigned_role": "Role name",
    "hours": 8
  }
]

Be thorough and include all phases of work: planning, design, development, testing, deployment, and project management, but create a maximum of 20 separate tasks.`;
			} else {
				// Fallback to original combined format for backward compatibility
				return `You are creating a detailed effort estimate (Work Breakdown Structure) for project "${projectName}".

${context}

Based on all the information provided, create a detailed effort estimate that includes:

1. **Assumptions**: Key assumptions underlying this estimate
2. **Work Breakdown Structure**: A detailed list of tasks

For the WBS, format it as a JSON array where each task has:
- task_description: Clear description of the task
- assigned_role: Role responsible (e.g., "Backend Developer", "Frontend Developer", "QA Engineer", "DevOps", "Project Manager")
- hours: Estimated hours for the task

After the assumptions section, provide the tasks in this JSON format:
\`\`\`json
[
  {
    "task_description": "Task description here",
    "assigned_role": "Role name",
    "hours": 8
  }
]
\`\`\`

Be thorough and include all phases of work: planning, design, development, testing, deployment, and project management, but create a maximum of 20 separate tasks.`;
			}

		default:
			return `Generate content for the ${stage} stage of project "${projectName}".\n\n${context}`;
	}
}
