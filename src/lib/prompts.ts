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

export const extractAgreementMetadataPrompt = (text_content: string): string => {
	const prompt = `You are an expert contract analyzer. Analyze the following contract text and extract key metadata.

<CONTRACT_TEXT>
${text_content}
</CONTRACT_TEXT>

Extract the following information from the contract:
1. agreement_name - A clear, descriptive name for this agreement
2. counterparty - The name of the other party in the agreement (not our company)
3. agreement_type - The type of agreement. Must be ONE of these exact values: MSA, SOW, NDA, or OTHER

Return your response as a JSON object with ONLY these three fields. Do not include any additional text or explanation. If you don't know the value to any field, use OTHER.
Example format:
{
  "agreement_name": "Software Development Agreement",
  "counterparty": "Acme Corporation",
  "agreement_type": "SOW"
}`;

	return prompt;
};
