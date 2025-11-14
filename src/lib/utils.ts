export const cleanString = (input: string | null | undefined): string => {
	if (!input) return '';
	input = input.replace(/_/g, ' ').trim();
	return input.charAt(0).toUpperCase() + input.slice(1);
};
