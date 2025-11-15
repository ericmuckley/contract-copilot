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