import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Message } from '@aws-sdk/client-bedrock-runtime';
import { streamInference } from '$lib/server/bedrockClient';
import { getProject, getProjectArtifacts } from '$lib/server/db';
import { STAGES, PROJECT_PERSONNEL_RATES } from '$lib/schema';
import { readFileContent } from '$lib/server/readFileContent';

// POST /api/projects/[id]/generate - Generate content for a stage using LLM
export async function POST({ params, request }: RequestEvent) {
	try {
		const projectId = parseInt(params.id || '');
		if (isNaN(projectId)) {
			return json({ error: 'Invalid project ID' }, { status: 400 });
		}

		const { stage, type } = await request.json();
		if (!stage) {
			return json({ error: 'Stage is required' }, { status: 400 });
		}

		const project = await getProject(projectId);
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 });
		}

		// Build the context from artifacts and previous stages
		const context = await buildContextForStage(project, stage);

		// Generate the prompt based on the stage
		const prompt = generatePromptForStage(stage, project.project_name, context, type);

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
					text: 'You are an expert at project planning, cost estimation, and solution architecture. Provide concise, structured, and professional responses.'
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

async function buildContextForStage(project: any, stageName: string): Promise<string> {
	const parts: string[] = [];

	// Always include artifacts
	const artifacts = await getProjectArtifacts(project.id);
	if (artifacts.length > 0) {
		parts.push('# Uploaded Artifacts\n\n');
		for (const artifact of artifacts) {
			parts.push(`## ${artifact.file_name} Content\n\n`);
			const artifactText = await readFileContent(artifact.file_url);
			parts.push(artifactText + '\n\n\n\n');
		}
	}

	// Find the stage index
	const stageIndex = STAGES.findIndex((s) => s.name === stageName);

	// Include previous stage content
	if (stageIndex > 0) {
		for (let i = 1; i < stageIndex; i++) {
			if (project.sdata[i].content) {
				parts.push(`\n### ${STAGES[i].label}:`);
				parts.push(project.sdata[i].content);
			}
		}
	}

	console.log(parts);
	return parts.join('\n');
}

function generatePromptForStage(
	stageName: string,
	projectName: string,
	context: string,
	type?: string
): string {
	switch (stageName) {
		case 'business_case':
			return `You are analyzing the project "${projectName}" to create a comprehensive business case.
<CONTEXT>
${context}
</CONTEXT>

Based on the artifacts and context provided, generate a detailed business case that includes:

1. **Project Scope**: What is included and what is explicitly out of scope
2. **Business Outcomes**: Expected benefits, ROI, and success metrics
3. **Constraints**: Timeline constraints, budget considerations, technical limitations, resource availability
4. **Risks**: Key risks and mitigation strategies
5. **Stakeholders**: Key stakeholders and their interests

Format your response in clear sections with markdown formatting.`;

		case 'requirements':
			return `You are analyzing the project "${projectName}" to create a detailed requirements summary.

		
<CONTEXT>
${context}
</CONTEXT>


Based on the artifacts and business case, generate a comprehensive requirements summary that includes:

1. **Functional Requirements**: Key features and capabilities the system must have
2. **Non-Functional Requirements**: Performance, security, scalability, usability requirements
3. **User Stories**: Main user stories or use cases (if applicable)
4. **Acceptance Criteria**: How we'll know the requirements are met
5. **Dependencies**: External systems, APIs, or resources required

Format your response in clear sections with markdown formatting.`;

		case 'architecture':
			return `You are designing the solution architecture for project "${projectName}".

<CONTEXT>
${context}
</CONTEXT>


Based on all the information provided, create a detailed solution/architecture document that includes:

1. **Approach**: Overall approach and methodology
2. **System Architecture**: High-level system architecture and components
3. **Technology Stack**: Recommended technologies, frameworks, and tools
4. **Integration Points**: How different components/systems will integrate
5. **Security Considerations**: Security measures and best practices
6. **Risks and Mitigation**: Technical risks and how to address them
7. **Alternatives Considered**: Other approaches considered and why this one was chosen

Format your response in clear sections with markdown formatting.`;

		case 'estimate':
			if (type === 'assumptions') {
				return `You are creating key assumptions for an effort estimate (Work Breakdown Structure) for project "${projectName}".

<CONTEXT>
${context}
</CONTEXT>


Based on all the information provided, create a detailed list of assumptions that underlie the effort estimate. These assumptions should include:

- Technology choices and their implications
- Team composition and skill levels
- Development methodology (Agile, Waterfall, etc.)
- Timeline constraints
- Availability of resources
- Third-party dependencies
- Testing and quality assurance approach
- Deployment and infrastructure considerations
- Risk factors that could affect estimates

Format your response in clear markdown with bullet points or numbered lists. Be thorough and specific.`;
			} else if (type === 'tasks') {
				return `You are creating a detailed Work Breakdown Structure (WBS) for project "${projectName}".

<CONTEXT>
${context}
</CONTEXT>


Based on all the information provided, create a detailed list of tasks in JSON format.

Each task should have:
- description: Clear description of the task
- role: Role responsible. Use only one of these: [${Object.keys(PROJECT_PERSONNEL_RATES).join(', ')}]
- hours: Estimated hours for the task

Return ONLY a JSON array with no additional text or markdown formatting:
[
  {
    "description": "Task description here",
    "role": "Role name",
    "hours": 8
  }
]

Be thorough and include all phases of work: planning, design, development, testing, deployment, and project management, but create a maximum of 16 separate tasks.`;
			}
		default:
			return `Generate content for the ${stageName} stage of project "${projectName}".\n\n${context}`;
	}
}
