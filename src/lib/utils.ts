import { type ProjectTask, type Agreement, PROJECT_PERSONNEL_RATES } from './schema';

// Make a string more pretty
export const cleanString = (input: string | null | undefined): string => {
	if (!input) return '';
	input = input.replace(/_/g, ' ').trim();
	return input.charAt(0).toUpperCase() + input.slice(1);
};

export const makeShortId = (length: number = 8): string => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

// Safely parse JSON from a string, returning a fallback value if parsing fails
export const safeJsonParse = (input: string, fallback: any = {}) => {
	try {
		const start = Math.min(...[input.indexOf('{'), input.indexOf('[')].filter((i) => i >= 0));
		const end = Math.max(input.lastIndexOf('}'), input.lastIndexOf(']'));
		if (start === Infinity || end === -1) {
			return fallback;
		}
		const jsonString = input.slice(start, end + 1).trim();
		return JSON.parse(jsonString);
	} catch (e) {
		console.error(`Error parsing JSON: ${e}. Original input: ${input}`);
		return fallback;
	}
};

// Generate a CSV string from a list of project tasks for quote stage
export const generateQuoteCSV = (taskList: ProjectTask[]): string => {
	const headers = ['Task', 'Role', 'Hours', 'Rate/Hour', 'Total Cost'];
	const rows = taskList.map((task) => {
		const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
		const cost = Number(task.hours) * rate;
		return [task.description, task.role, task.hours.toString(), rate.toString(), cost.toFixed(2)];
	});

	// Calculate totals
	const totalHours = taskList.reduce((sum, task) => sum + Number(task.hours), 0);
	const totalCost = taskList.reduce((sum, task) => {
		const rate = PROJECT_PERSONNEL_RATES[task.role as keyof typeof PROJECT_PERSONNEL_RATES] || 0;
		return sum + Number(task.hours) * rate;
	}, 0);
	const timelineWeeks = Math.ceil(totalHours / 40);

	// Add summary rows
	rows.push(['', '', '', '', '']);
	rows.push(['Total Hours', '', totalHours.toString(), '', '']);
	rows.push(['Total Cost', '', '', '', totalCost.toFixed(2)]);
	rows.push(['Timeline (weeks)', '', timelineWeeks.toString(), '', '']);

	return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
};

// Apply a list of edits to text content
export const applyEditsToText = (
	textContent: string,
	edits: { old: string; new: string; note: string }[]
): string => {
	let updatedText = textContent;

	for (const edit of edits) {
		if (edit.old && edit.new) {
			// Replace all occurrences of the old text with the new text
			updatedText = updatedText.split(edit.old).join(edit.new);
		}
	}

	return updatedText;
};

export const saveNewAgreement = async ({
	origin,
	created_by,
	agreement_name,
	agreement_type,
	counterparty,
	text_content,
	root_id,
	version_number
}: {
	origin: 'client' | 'internal';
	created_by: string;
	agreement_name: string;
	agreement_type: string;
	counterparty: string;
	text_content: string;
	root_id?: string;
	version_number?: number;
}): Promise<Agreement | null> => {
	// Build Agreement object based on selected origin

	const _root_id = root_id || makeShortId();
	const _version_number = version_number || 1;

	const agreementData = {
		root_id: _root_id,
		version_number: _version_number,
		origin,
		created_by,
		agreement_name,
		agreement_type,
		counterparty: counterparty,
		text_content
	};

	try {
		const response = await fetch('/api/agreements', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(agreementData)
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('Failed to save agreement:', error);
			return null;
		}

		const savedAgreement: Agreement = await response.json();
		return savedAgreement;
	} catch (error) {
		console.error('Error saving agreement:', error);
		return null;
	}
};
