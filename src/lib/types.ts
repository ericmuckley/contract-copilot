import type { Message } from '@aws-sdk/client-bedrock-runtime';

export interface LLMStreamProps {
	id: string;
	status: 'waiting' | 'active' | 'done' | 'error';
	error?: string | null;
	messages: Message[];
	useTools?: boolean;
	systemMessages?: { text: string }[];
}

export interface LLMInferencePayload {
	messages: Message[];
	systemMessages?: { text: string }[];
	useTools?: boolean;
}

export interface SavedChatMessage {
	id?: string | null;
	auth_id?: string | null;
	text_content?: string | null;
	created_at?: string | null;
	role: 'user' | 'assistant';
}

export interface ToolResults {
	[toolUseId: string]: {
		toolUseId: string;
		name: string;
		input: { [key: string]: string };
		response?: { [key: string]: string | number } | null;
		text?: string | null;
	};
}
