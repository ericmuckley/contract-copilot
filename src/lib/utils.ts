import { type ProjectTask, PROJECT_PERSONNEL_RATES } from './schema';

// Make a string more pretty
export const cleanString = (input: string | null | undefined): string => {
	if (!input) return '';
	input = input.replace(/_/g, ' ').trim();
	return input.charAt(0).toUpperCase() + input.slice(1);
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
