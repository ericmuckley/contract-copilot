# Test Implementation Notes

## Overview

This document explains the design decisions and implementation details of the LLM tools test suite.

## Design Decisions

### 1. Testing Actual Production Code

**Problem**: The original LLM tools import from SvelteKit-specific modules (`$env/static/private`) which are not available when running tests with tsx.

**Solution**: Modified `src/lib/server/settings.ts` to support both environments:

- Uses try/catch to conditionally import from `$env/static/private` (SvelteKit) or `process.env` (tests)
- Created `tsconfig.test.json` with path aliases (`$lib`, `$lib/*`) for tsx to resolve imports
- Tests import actual tool classes from `bedrockTools.ts` instead of creating duplicates

**Benefit**: Tests validate the actual production code, ensuring changes to tools are automatically reflected in tests.

### 2. LLM Tool Testing Strategy

**Approach**: Tests call the actual tool implementations, including those that make LLM calls.

**For LLM-dependent tools** (UpdateProjectTasksTool, CreateNewContractVersionTool, CreateNewContractTool):

- Tests will make real LLM API calls if AWS credentials are available
- Tests will fail if AWS credentials are not configured
- This is intentional - we want to test the real behavior

**For non-LLM tools** (GetProjectDetailsTool, GetContractDetailsTool, etc.):

- Tests work without AWS credentials
- Only DATABASE_URL is required

**Benefit**: We test the actual code paths and behaviors, not simplified mocks.

### 3. Environment Setup

**Challenge**: Making SvelteKit modules work in test environment.

**Solution**: 

- Modified `settings.ts` to check if it can load `$env/static/private`
- If that fails (test environment), it falls back to `process.env`
- This allows the same code to work in both contexts

**Code pattern in settings.ts**:

```typescript
let envModule: any = null;

try {
	envModule = require('$env/static/private');
} catch {
	envModule = {
		DATABASE_URL: process.env.DATABASE_URL || '',
		// ... other env vars
	};
}
```

### 4. Database Cleanup Strategy

**Problem**: Tests create database records that need to be cleaned up, even if the test fails.

**Solution**: Used try/finally blocks in every test:

```typescript
export async function testTool(): Promise<TestResult> {
	return runTest('ToolName', async () => {
		let testId: number | undefined;

		try {
			// Create test data
			const testData = await createTestObject();
			testId = testData.id;

			// Run tests
			const result = await Tool.run({ id: testId });
			assert(result.success === true, 'Should succeed');
		} finally {
			// Always cleanup, even if test fails
			if (testId) {
				await cleanupTestObject(testId);
			}
		}
	});
}
```

**Benefit**: Database stays clean even when tests fail.

### 4. Test Utilities Architecture

**testUtils.ts** provides:

- `createTestProject()` - Creates a complete project with all stages
- `createTestAgreement()` - Creates a test agreement/contract
- `cleanupTestProject()` - Deletes a project
- `cleanupTestAgreement()` - Deletes an agreement
- `runTest()` - Wraps test logic with error handling
- `assert()` - Simple assertion function
- `printTestResults()` - Formatted output with colors

**Benefit**: DRY (Don't Repeat Yourself) - common logic is reused across all tests.

### 5. Sequential Test Execution

**Problem**: Running tests in parallel could cause database conflicts (race conditions).

**Solution**: Tests run sequentially in `index.ts`:

```typescript
console.log('Running GetProjectDetailsTool test...');
results.push(await testGetProjectDetails());

console.log('Running GetContractDetailsTool test...');
results.push(await testGetContractDetails());
// etc...
```

**Benefit**: No race conditions, predictable execution order, clear progress output.

## Test Data Patterns

### Unique Identifiers

All test data uses timestamps to ensure uniqueness:

- Projects: `Test Project ${Date.now()}`
- Agreement root_ids: `TEST-${Date.now()}`

**Benefit**: Multiple test runs can happen simultaneously without conflicts.

### Realistic Data Structure

Test projects include all stages with realistic content:

- artifacts stage (empty)
- business_case stage (text content)
- requirements stage (text content)
- architecture stage (text content)
- estimate stage (with tasks array)
- quote stage (with CSV content)

**Benefit**: Tests validate realistic scenarios, not just happy paths.

## Testing Philosophy

### Unit Tests, Not Integration Tests

These tests focus on validating:

1. Tool API structure (inputs/outputs)
2. Database CRUD operations
3. Error handling for edge cases
4. Data cleanup

They do NOT test:

- LLM response quality
- Actual AWS Bedrock integration
- Full end-to-end workflows

**Rationale**: LLM integration should be tested separately, probably with mock LLM responses or in a dedicated integration test suite.

### Fast Feedback Loop

Tests execute in under a second (when database is available):

- No network calls
- No LLM processing
- Simple database operations
- Sequential but fast

**Benefit**: Developers can run tests frequently during development.

## Extending the Test Suite

### Adding Tests for New Tools

1. Create `[toolName].test.ts`
2. Implement simplified version of the tool (if it uses LLM)
3. Create test function following existing patterns
4. Add test to `index.ts` import and execution list
5. Update README with the new tool

### Adding Integration Tests

For actual LLM integration testing:

1. Create separate `integration/` directory
2. Use real AWS credentials (from CI/CD secrets)
3. Accept non-deterministic responses
4. Mock or stub expensive operations
5. Run less frequently (e.g., only on PR merge)

### Adding More Comprehensive Tests

Current tests are smoke tests. To add more:

- Test edge cases (null values, empty arrays, etc.)
- Test concurrent operations
- Test large datasets
- Test error recovery
- Test transaction rollback scenarios

## Known Limitations

1. **No Actual LLM Testing**: Simplified implementations don't test LLM integration
2. **Basic Assertions**: Tests use simple assertions, not a full testing framework
3. **No Mocking**: Tests use real database (requires DATABASE_URL)
4. **No Code Coverage**: No coverage metrics collected
5. **Sequential Only**: Tests can't run in parallel

## Future Improvements

1. Add a proper testing framework (Jest, Vitest, etc.)
2. Add code coverage reporting
3. Create integration tests with real LLM calls
4. Add performance benchmarks
5. Add database migration tests
6. Add API endpoint tests
7. Mock database for truly unit tests
8. Add CI/CD integration examples
