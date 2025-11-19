#!/usr/bin/env node
/**
 * Test suite entry point for LLM tool tests
 *
 * This file runs all tests for the Bedrock LLM tools.
 * Tests can be run directly or through an LLM by calling the tool functions.
 */

import { printTestResults } from './testUtils';
import type { TestResult } from './testUtils';

// Import all test functions
import { testGetProjectDetails } from './getProjectDetails.test';
import { testGetContractDetails } from './getContractDetails.test';
import { testGetContractEditsSummary } from './getContractEditsSummary.test';
import { testAddNoteToContract } from './addNoteToContract.test';
import { testUpdateProjectTasks } from './updateProjectTasks.test';
import { testCreateNewContractVersion } from './createNewContractVersion.test';
import { testCreateNewContract } from './createNewContract.test';

async function runAllTests(): Promise<void> {
	console.log('Starting LLM Tool Tests...\n');

	const results: TestResult[] = [];

	// Run all tests sequentially to avoid database conflicts
	console.log('Running GetProjectDetailsTool test...');
	results.push(await testGetProjectDetails());

	console.log('Running GetContractDetailsTool test...');
	results.push(await testGetContractDetails());

	console.log('Running GetContractEditsSummaryTool test...');
	results.push(await testGetContractEditsSummary());

	console.log('Running AddNoteToContractTool test...');
	results.push(await testAddNoteToContract());

	console.log('Running UpdateProjectTasksTool test...');
	results.push(await testUpdateProjectTasks());

	console.log('Running CreateNewContractVersionTool test...');
	results.push(await testCreateNewContractVersion());

	console.log('Running CreateNewContractTool test...');
	results.push(await testCreateNewContract());

	// Print results
	printTestResults(results);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runAllTests().catch((error) => {
		console.error('Fatal error running tests:', error);
		process.exit(1);
	});
}

export { runAllTests };
