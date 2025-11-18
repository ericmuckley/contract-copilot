// Test utilities for LLM tool tests
import type { Project, Agreement } from '$lib/schema';
import { createProject, deleteProject, createAgreement, deleteAgreement } from './testDb';

export interface TestResult {
	name: string;
	passed: boolean;
	error?: string;
}

// Helper to create a test project
export async function createTestProject(): Promise<Project> {
	const testProject: Project = {
		project_name: `Test Project ${Date.now()}`,
		created_by: 'test-user',
		sdata: [
			{
				name: 'artifacts',
				content: null,
				approved: null,
				approved_by: null,
				updated_at: null
			},
			{
				name: 'business_case',
				content: 'Test business case content',
				approved: null,
				approved_by: null,
				updated_at: null
			},
			{
				name: 'requirements',
				content: 'Test requirements content',
				approved: null,
				approved_by: null,
				updated_at: null
			},
			{
				name: 'architecture',
				content: 'Test architecture content',
				approved: null,
				approved_by: null,
				updated_at: null
			},
			{
				name: 'estimate',
				content: null,
				approved: null,
				approved_by: null,
				updated_at: null,
				tasks: [
					{
						role: 'Backend Dev',
						description: 'API Development',
						hours: 100
					},
					{
						role: 'Frontend Dev',
						description: 'UI Implementation',
						hours: 80
					}
				]
			},
			{
				name: 'quote',
				content:
					'Task,Role,Hours,Rate/Hour,Total Cost\nAPI Development,Backend Dev,100,150,15000.00',
				approved: null,
				approved_by: null,
				updated_at: null
			}
		]
	};

	return await createProject(testProject);
}

// Helper to create a test agreement
export async function createTestAgreement(projectId?: number): Promise<Agreement> {
	const testAgreement = {
		root_id: `TEST-${Date.now()}`,
		version_number: 1,
		origin: 'internal' as const,
		notes: [],
		edits: [],
		agreement_name: 'Test Agreement',
		agreement_type: 'MSA',
		created_by: 'test-user',
		text_content:
			'This is a test contract. Section 1: Terms and Conditions. Payment within 30 days.',
		counterparty: 'Test Client Corp',
		project_id: projectId || null
	};

	return await createAgreement(testAgreement);
}

// Helper to cleanup test project
export async function cleanupTestProject(projectId: number): Promise<void> {
	await deleteProject(projectId);
}

// Helper to cleanup test agreement
export async function cleanupTestAgreement(agreementId: number): Promise<void> {
	await deleteAgreement(agreementId);
}

// Test runner function
export async function runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
	try {
		await testFn();
		return { name: testName, passed: true };
	} catch (error) {
		return {
			name: testName,
			passed: false,
			error: error instanceof Error ? error.message : String(error)
		};
	}
}

// Assertion helper
export function assert(condition: boolean, message: string): void {
	if (!condition) {
		throw new Error(message);
	}
}

// Pretty print test results
export function printTestResults(results: TestResult[]): void {
	console.log('\n========================================');
	console.log('Test Results');
	console.log('========================================\n');

	const passed = results.filter((r) => r.passed).length;
	const failed = results.filter((r) => !r.passed).length;

	results.forEach((result) => {
		const status = result.passed ? '✓ PASS' : '✗ FAIL';
		const color = result.passed ? '\x1b[32m' : '\x1b[31m'; // Green or Red
		const reset = '\x1b[0m';
		console.log(`${color}${status}${reset} ${result.name}`);
		if (result.error) {
			console.log(`  Error: ${result.error}`);
		}
	});

	console.log('\n========================================');
	console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
	console.log('========================================\n');

	// Exit with error code if any tests failed
	if (failed > 0) {
		process.exit(1);
	}
}
