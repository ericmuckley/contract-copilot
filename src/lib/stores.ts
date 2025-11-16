import { writable } from 'svelte/store';
import type { Project } from '$lib/schema';
import type { Message } from '@aws-sdk/client-bedrock-runtime';

export const allProjects = writable<Project[]>([]);
export const activeProjectId = writable<number | null>(null);
export const chatMessages = writable<Message[]>([]);
