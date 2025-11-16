/**
 * LLM prompt generation functions for contract workflow operations
 */

import type { Policy, ProjectTask, ProposedChange } from '$lib/schema';

/**
 * Generate prompt for creating a new agreement based on policies
 */
export const generateAgreementPrompt = (
	agreementType: string,
	counterparty: string,
	policyRules: Policy[],
	exampleAgreements: Policy[],
	additionalContext?: string
): string => {
	const rulesText = policyRules.map((p) => `- ${p.title}:\n${p.content}`).join('\n\n');
	const examplesText = exampleAgreements.map((p) => `## ${p.title}\n${p.content}`).join('\n\n');

	return `You are an expert legal contract drafting assistant. Your task is to generate a professional ${agreementType} agreement.

# Context
- Agreement Type: ${agreementType}
- Counterparty: ${counterparty}
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}

# Policy Rules to Follow
These are the mandatory policy rules that must be incorporated into the agreement:

${rulesText || 'No specific policy rules provided.'}

# Example Agreements for Reference
Use these examples as templates for structure and language, but adapt them based on the policy rules:

${examplesText || 'No example agreements provided.'}

# Instructions
1. Draft a complete, professional ${agreementType} that incorporates all policy rules
2. Use clear, unambiguous legal language
3. Structure the agreement with appropriate sections (e.g., Definitions, Scope, Terms, Termination, etc.)
4. Ensure consistency with the example agreements' tone and structure
5. Include placeholders like [DATE], [PARTY A NAME], [PARTY B NAME] where specific information needs to be filled in
6. Make sure all policy rules are addressed in the appropriate sections

Generate the complete ${agreementType} agreement now:`;
};

/**
 * Generate prompt for reviewing a client's draft agreement against policies
 */
export const reviewAgreementPrompt = (
	agreementType: string,
	clientDraft: string,
	policyRules: Policy[],
	_exampleAgreements: Policy[]
): string => {
	const rulesText = policyRules.map((p) => `- ${p.title}:\n${p.content}`).join('\n\n');

	return `You are an expert legal contract review assistant. Your task is to review a client's ${agreementType} draft and identify material changes needed to align it with company policies.

# Your Company's Policy Rules
${rulesText || 'No specific policy rules provided.'}

# Client's Draft Agreement
${clientDraft}

# Instructions
Carefully review the client's draft and identify all material discrepancies from your company's policy rules. For each discrepancy, provide:

1. **Section**: The section or clause in the client's draft that needs modification
2. **Before**: The exact text from the client's draft that conflicts with policy
3. **After**: The proposed replacement text that aligns with policy
4. **Rationale**: A one-sentence explanation of why this change is needed (reference the specific policy rule)

Focus ONLY on material changes that affect rights, obligations, liability, payment terms, termination, intellectual property, confidentiality, or other substantive business terms. Do not flag minor stylistic or formatting differences.

Respond with a JSON array of proposed changes in this exact format:
\`\`\`json
[
  {
    "section": "Section name or clause identifier",
    "before": "Exact text from client draft",
    "after": "Proposed replacement text",
    "rationale": "One-sentence explanation referencing policy"
  }
]
\`\`\`

If the client's draft already aligns with all policies, return an empty array: \`[]\`

Generate the review now:`;
};

/**
 * Generate prompt for validating an SOW against a project estimate
 */
export const validateAgainstEstimatePrompt = (
	sowContent: string,
	projectTasks: ProjectTask[],
	projectDetails: {
		name: string;
		businessCase?: string;
		requirements?: string;
		architecture?: string;
		estimate?: string;
		quote?: string;
	}
): string => {
	const tasksText = projectTasks
		.map((t) => `- ${t.role}: ${t.description} (${t.hours} hours)`)
		.join('\n');

	return `You are an expert contract validation assistant. Your task is to validate a Statement of Work (SOW) against a project estimate to identify any discrepancies or misalignments.

# Statement of Work (SOW)
${sowContent}

# Project Estimate Details
Project Name: ${projectDetails.name}

## Work Breakdown Structure (Tasks)
${tasksText}

${projectDetails.businessCase ? `## Business Case\n${projectDetails.businessCase}\n` : ''}
${projectDetails.requirements ? `## Requirements\n${projectDetails.requirements}\n` : ''}
${projectDetails.architecture ? `## Architecture\n${projectDetails.architecture}\n` : ''}
${projectDetails.estimate ? `## Estimate Summary\n${projectDetails.estimate}\n` : ''}
${projectDetails.quote ? `## Quote Details\n${projectDetails.quote}\n` : ''}

# Instructions
Carefully compare the SOW with the project estimate and identify discrepancies in:
1. **Scope**: Missing or extra deliverables, tasks not mentioned in estimate
2. **Cost**: Payment amounts, rates, or total costs that don't match the estimate
3. **Timeline**: Project duration or milestones that conflict with estimate
4. **Deliverables**: Outputs mentioned in SOW but not in estimate (or vice versa)

For each discrepancy, provide:
- **category**: "scope", "cost", "timeline", or "deliverables"
- **severity**: "low", "medium", or "high"
- **description**: Clear description of the discrepancy
- **sow_reference**: The relevant text or section from the SOW
- **estimate_reference**: The relevant information from the estimate

Also provide an **alignment_score** (0-100) indicating overall alignment, and a **summary** paragraph.

Respond with a JSON object in this exact format:
\`\`\`json
{
  "alignment_score": 85,
  "summary": "Overall summary of alignment and key issues",
  "discrepancies": [
    {
      "category": "scope",
      "severity": "high",
      "description": "Description of the discrepancy",
      "sow_reference": "Text from SOW",
      "estimate_reference": "Text from estimate"
    }
  ]
}
\`\`\`

If there are no significant discrepancies, return alignment_score of 95-100 with empty discrepancies array.

Generate the validation report now:`;
};

/**
 * Generate prompt for applying selected changes to create a new version
 */
export const applyChangesPrompt = (
	originalContent: string,
	selectedChanges: ProposedChange[]
): string => {
	const changesText = selectedChanges
		.map(
			(c, idx) =>
				`${idx + 1}. Section: ${c.section}
   Before: ${c.before}
   After: ${c.after}
   Rationale: ${c.rationale}`
		)
		.join('\n\n');

	return `You are an expert legal document editor. Your task is to apply specific changes to an agreement to create a new version.

# Original Agreement
${originalContent}

# Changes to Apply
${changesText}

# Instructions
1. Carefully locate each "Before" text in the original agreement
2. Replace it with the corresponding "After" text
3. Maintain all other content unchanged
4. Ensure the resulting document is well-formatted and coherent
5. Preserve all section numbering, formatting, and structure

Generate the updated agreement with all changes applied:`;
};

/**
 * Generate prompt for summarizing changes between two versions
 */
export const summarizeVersionChangesPrompt = (
	previousVersion: string,
	currentVersion: string
): string => {
	return `You are an expert document comparison assistant. Compare these two versions of an agreement and summarize the changes.

# Previous Version
${previousVersion}

# Current Version
${currentVersion}

# Instructions
Identify and summarize all substantive changes between the versions. Focus on:
- Added sections or clauses
- Removed sections or clauses
- Modified terms, conditions, or obligations
- Changes to dates, amounts, or other key details

Respond with a JSON object in this format:
\`\`\`json
{
  "added": 2,
  "removed": 1,
  "modified": 3,
  "sections_changed": ["Section 1.3", "Section 4.2", "Section 7"]
}
\`\`\`

Generate the changes summary now:`;
};
