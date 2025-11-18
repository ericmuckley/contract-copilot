# LLM Tools Test Suite

This directory contains tests for the Bedrock LLM tools defined in `src/lib/server/bedrockTools.ts`.

## Overview

The test suite validates all 7 LLM tool classes:

1. **GetProjectDetailsTool** - Retrieves project details by ID
2. **GetContractDetailsTool** - Retrieves contract/agreement details by root_id
3. **GetContractEditsSummaryTool** - Gets edit history across all contract versions
4. **AddNoteToContractTool** - Adds notes to contracts
5. **UpdateProjectTasksTool** - Modifies project tasks using natural language (requires LLM)
6. **CreateNewContractVersionTool** - Creates new contract versions with edits (requires LLM)
7. **CreateNewContractTool** - Generates contracts from projects (requires LLM)

## Running Tests

To run all tests:

```bash
npm run test
```

## Test Structure

- **index.ts** - Main entry point that runs all tests sequentially
- **testUtils.ts** - Shared utilities for test setup, assertions, and cleanup
- **[toolName].test.ts** - Individual test files for each LLM tool

## Test Features

### Database Cleanup

All tests automatically clean up any database objects they create:
- Test projects are deleted after tests complete
- Test agreements are deleted after tests complete
- Cleanup happens even if tests fail (using try/finally blocks)

### Test Output

Tests print colored results showing:
- ✓ PASS (green) for successful tests
- ✗ FAIL (red) for failed tests
- Error messages for failed tests
- Summary showing total, passed, and failed counts

### Direct Tool Calling

Tests call the tool's `run()` method directly without going through an LLM. This allows for:
- Faster test execution
- More predictable results
- Direct validation of tool functionality

## Environment Requirements

Tests require the following environment variables to be set:
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_BEARER_TOKEN_BEDROCK` - AWS Bedrock credentials (for LLM-dependent tests)

These can be set in a `.env` file or as environment variables.

## Test Design

Each test follows this pattern:

1. Create test data (projects, agreements, etc.)
2. Call the tool's `run()` method with test inputs
3. Assert expected results
4. Clean up test data (in finally block)

Tests validate:
- Successful operations return expected data structures
- Error cases (non-existent IDs) return appropriate error messages
- Database operations persist correctly
- LLM-generated content meets basic requirements

## Adding New Tests

To add a test for a new tool:

1. Create `[toolName].test.ts` in this directory
2. Export an async function named `test[ToolName]`
3. Use `runTest()` helper to wrap your test logic
4. Import and call your test function in `index.ts`
5. Clean up any database objects created

Example:

```typescript
import { runTest, assert } from './testUtils';
import type { TestResult } from './testUtils';

export async function testMyNewTool(): Promise<TestResult> {
  return runTest('MyNewTool', async () => {
    // Test logic here
    const result = await MyNewTool.run({ param: 'value' });
    assert(result.success === true, 'Should succeed');
  });
}
```
