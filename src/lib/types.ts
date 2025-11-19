import type { Message } from '@aws-sdk/client-bedrock-runtime';

export interface LLMInferencePayload {
	messages: Message[];
	systemMessages?: { text: string }[];
	useTools?: boolean;
	activeProjectId?: number | null;
	activeAgreementRootId?: string | null;
}
