import { writable } from 'svelte/store';
import type { Project } from '$lib/schema';

export const allProjects = writable<Project[]>([]);
export const activeProject = writable<Project | null>(null);
