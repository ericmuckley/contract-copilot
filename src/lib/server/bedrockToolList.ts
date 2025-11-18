import {
	AddNoteToContractTool,
	GetContractDetailsTool,
	GetContractEditsSummaryTool,
	GetProjectDetailsTool,
	UpdateProjectTasksTool
} from './bedrockTools';

export const TOOLS = [
	GetProjectDetailsTool,
	UpdateProjectTasksTool,
	GetContractDetailsTool,
	GetContractEditsSummaryTool,
	AddNoteToContractTool
];
