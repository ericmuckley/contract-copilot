import {
	AddNoteToContractTool,
	CreateNewContractTool,
	CreateNewContractVersionTool,
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
	AddNoteToContractTool,
	CreateNewContractTool,
	CreateNewContractVersionTool
];
