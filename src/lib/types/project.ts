// TypeScript types for the Project Cost Estimator Workflow database tables

export type ProjectStage =
	| 'Artifacts'
	| 'BusinessCase'
	| 'Requirements'
	| 'SolutionArchitecture'
	| 'EffortEstimate'
	| 'Quote';

export interface Project {
	id: number;
	name: string;
	current_stage: ProjectStage;
	approved_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface Artifact {
	id: number;
	project_id: number;
	file_name: string;
	file_url: string;
	artifact_type?: string;
	approved_by: string | null;
	uploaded_at: string;
}

export interface BusinessCase {
	id: number;
	project_id: number;
	content: string | null;
	approved_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface Requirements {
	id: number;
	project_id: number;
	content: string | null;
	approved_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface SolutionArchitecture {
	id: number;
	project_id: number;
	content: string | null;
	approved_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface EffortEstimate {
	id: number;
	project_id: number;
	assumptions: string | null;
	approved_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface EstimateTask {
	id: number;
	estimate_id: number;
	task_description: string;
	assigned_role: string;
	hours: number;
	approved_by: string | null;
}

export interface Quote {
	id: number;
	project_id: number;
	payment_terms: string | null;
	timeline: string | null;
	is_delivered: boolean;
	approved_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface QuoteRate {
	id: number;
	quote_id: number;
	role_name: string;
	rate_per_hour: number;
}

export interface ProjectHistory {
	id: number;
	project_id: number;
	stage: ProjectStage;
	user_id: number | null;
	action: string;
	timestamp: string;
}

export interface User {
	id: number;
	name: string;
	email: string;
}

// API request/response types
export interface CreateProjectRequest {
	name: string;
}

export interface UpdateProjectRequest {
	name?: string;
	current_stage?: ProjectStage;
}

export interface UploadArtifactRequest {
	project_id: number;
	file: File;
	artifact_type?: string;
}

export interface UpdateStageContentRequest {
	content: string;
}

export interface AdvanceStageRequest {
	project_id: number;
	current_stage: ProjectStage;
	action: string;
	approved_by: string | null;
}

export interface GenerateContentRequest {
	project_id: number;
	stage: ProjectStage;
}

export interface CreateQuoteRateRequest {
	role_name: string;
	rate_per_hour: number;
}

export interface CreateEstimateTaskRequest {
	task_description: string;
	assigned_role: string;
	hours: number;
}

// Extended types for UI
export interface ProjectWithDetails extends Project {
	artifact_count?: number;
	has_content?: boolean;
}

export interface EstimateWithTasks extends EffortEstimate {
	tasks: EstimateTask[];
}

export interface QuoteWithRates extends Quote {
	rates: QuoteRate[];
	total_cost?: number;
}
