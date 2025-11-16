export const STAGES = [
	{
		idx: 0,
		name: 'artifacts',
		label: 'Artifacts',
		icon: 'bi-file-earmark-text',
		bgcolor: 'bg-slate-200',
		textcolor: 'text-slate-700',
		bordercolor: 'border-slate-700'
	},
	{
		idx: 1,
		name: 'business_case',
		label: 'Business Case',
		icon: 'bi-briefcase',
		bgcolor: 'bg-sky-200',
		textcolor: 'text-sky-700',
		bordercolor: 'border-sky-700'
	},
	{
		idx: 2,
		name: 'requirements',
		label: 'Requirements',
		icon: 'bi-list-check',
		bgcolor: 'bg-purple-200',
		textcolor: 'text-purple-700',
		bordercolor: 'border-purple-700'
	},
	{
		idx: 3,
		name: 'architecture',
		label: 'Architecture',
		icon: 'bi-diagram-3',
		bgcolor: 'bg-green-200',
		textcolor: 'text-green-700',
		bordercolor: 'border-green-700'
	},
	{
		idx: 4,
		name: 'estimate',
		label: 'Effort Estimate',
		icon: 'bi-calculator',
		bgcolor: 'bg-yellow-200',
		textcolor: 'text-yellow-700',
		bordercolor: 'border-yellow-700'
	},
	{
		idx: 5,
		name: 'quote',
		label: 'Quote',
		icon: 'bi-currency-dollar',
		bgcolor: 'bg-pink-200',
		textcolor: 'text-pink-700',
		bordercolor: 'border-pink-700'
	}
];
export const PROJECT_PERSONNEL_RATES = {
	'Backend Dev': 150,
	'Frontend Dev': 120,
	'SW Engineer': 180,
	'SW Architect': 220,
	'QA Engineer': 100,
	'DevOps Engineer': 180,
	'Project Manager': 180,
	'Business Analyst': 85
};

export interface Stage {
	name: string;
	approved?: boolean | null;
	approved_by?: string | null;
	updated_at?: string | null;
}

export interface Artifact {
	id: number;
	project_id?: number | null;
	file_name: string;
	file_url: string;
}

export interface Project {
	id?: number | string | null;
	created_at?: string | null;
	updated_at?: string | null;
	project_name: string;
	created_by: string;
	sdata: StageData[];
	artifacts?: Artifact[];
}

export interface StageData {
	name: string;
	content: string | null;
	approved_by: string | null;
	approved: boolean | null;
	updated_at: string | null;
	tasks?: ProjectTask[] | null;
}

export interface ProjectTask {
	role: string;
	description: string;
	hours: number;
}

export const emptyProject: Project = {
	project_name: '',
	created_by: '',
	sdata: STAGES.map((stage) => ({
		name: stage.name,
		content: null,
		approved: null,
		approved_by: null,
		updated_at: null,
		tasks: stage.name === 'estimate' ? [] : null
	}))
};

// Legacy contract interface (deprecated - kept for backward compatibility)
export interface Contract {
	id?: number | string | null;
	created_at?: string | null;
	updated_at?: string | null;
	contract_name: string;
	party_a: string;
	party_b: string;
	effective_date: string;
	expiration_date: string;
	terms: string;
}

// New Contracts Workflow Interfaces

export interface Policy {
	id?: number | null;
	policy_type: 'rule' | 'example';
	agreement_type?: string | null; // 'MSA', 'SOW', 'NDA', etc. (for examples only)
	title: string;
	content: string;
	metadata?: Record<string, unknown>;
	created_at?: string | null;
	updated_at?: string | null;
}

export interface Agreement {
	id?: number | null;
	agreement_type: string; // 'MSA', 'SOW', 'NDA', etc.
	title: string;
	counterparty: string;
	linked_project_id?: number | null;
	current_version_number?: number;
	status?: 'draft' | 'in_review' | 'approved' | 'signed' | 'archived';
	metadata?: Record<string, unknown>;
	created_at?: string | null;
	updated_at?: string | null;
	// Included from joins
	versions?: AgreementVersion[];
	current_version?: AgreementVersion;
}

export interface AgreementVersion {
	id?: number | null;
	agreement_id: number;
	version_number: number;
	content: string;
	notes?: string | null;
	created_by?: string | null;
	changes_summary?: ChangesSummary | null;
	created_at?: string | null;
}

export interface ChangesSummary {
	added?: number;
	removed?: number;
	modified?: number;
	sections_changed?: string[];
}

export interface AgreementReview {
	id?: number | null;
	agreement_id: number;
	source_version_number: number;
	review_type: 'policy_review' | 'estimate_validation' | 'manual';
	proposed_changes: ProposedChange[];
	applied_changes?: number[]; // IDs of changes that were applied
	notes?: string | null;
	created_at?: string | null;
}

export interface ProposedChange {
	id?: number; // Local ID for tracking which changes were applied
	section: string;
	before: string;
	after: string;
	rationale: string;
	applied?: boolean;
}

export interface EstimateValidationResult {
	discrepancies: Discrepancy[];
	alignment_score: number; // 0-100
	summary: string;
}

export interface Discrepancy {
	category: 'scope' | 'cost' | 'timeline' | 'deliverables';
	severity: 'low' | 'medium' | 'high';
	description: string;
	sow_reference?: string;
	estimate_reference?: string;
}
