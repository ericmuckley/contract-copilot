export const createInternalContractPrompt = async (
	agreement_name: string,
	agreement_type: string,
	counterparty: string
): Promise<string> => {
	// Fetch internal artifacts content
	let artifactsContext = '';
	try {
		const response = await fetch('/api/artifact-content');
		const data = await response.json();
		artifactsContext = data.text || '';
	} catch (error) {
		console.error('Error fetching artifacts context:', error);
	}

	const prompt =
		`You are an expert contract drafter. Here are some examples of prior documents, contracts, and policies we've used:
	
	<EXAMPLE_POLICIES_AND_DOCUMENTS>
	
	${artifactsContext}
	
	</EXAMPLE_POLICIES_AND_DOCUMENTS>
	
	
	Now, using the example, create a detailed and professional ${agreement_type} agreement named "${agreement_name}" for the counterparty "${counterparty}". Ensure all standard clauses and legal language are included.`.trim();

	return prompt;
};
