import { writable, derived } from 'svelte/store';
import type { Project } from '$lib/schema';

export const activeProject = writable<Project | null>(null);
