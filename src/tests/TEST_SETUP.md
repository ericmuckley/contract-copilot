# Test Setup Guide

This guide explains how to set up and run the LLM tools test suite.

## Prerequisites

1. **Node.js**: Version 20 or higher (the project uses Node.js 22.x)
2. **PostgreSQL Database**: A PostgreSQL database instance for testing
3. **AWS Credentials** (optional): Required only for testing LLM-dependent tools (UpdateProjectTasksTool, CreateNewContractVersionTool, CreateNewContractTool)

## Database Setup

The tests require a PostgreSQL database. You have two options:

### Option 1: Use Existing Database

If you already have the Contract Copilot database set up, you can use the same `DATABASE_URL` from your `.env` file.

**Note**: Tests create and delete test data, but they clean up after themselves. All test objects use unique identifiers like `Test Project [timestamp]` and `TEST-[timestamp]`.

### Option 2: Create a Test Database

For safer testing, create a separate test database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE contract_copilot_test;

# Exit psql
\q
```

Then use a separate connection string for testing:

```
DATABASE_URL=postgresql://user:password@localhost:5432/contract_copilot_test
```

You'll need to run the same schema migrations on the test database as the production database.

## Running Tests

### Set Environment Variables

Tests use the same environment variables as production. Set them via `.env` file or directly:

**Required for all tests:**

- `DATABASE_URL` - PostgreSQL connection string

**Required only for LLM tool tests:**

- AWS Bedrock credentials (configured via AWS CLI or environment variables)

Option 1: Create a `.env` file in the project root:

```bash
# Edit .env and set your DATABASE_URL
DATABASE_URL=postgresql://user:password@localhost:5432/your_database
```

Option 2: Set the environment variable directly when running tests:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/your_database" npm run test
```

**Note**: Tests import the actual functions from `bedrockTools.ts`, so LLM-dependent tests will make real AWS Bedrock API calls if credentials are configured. Non-LLM tests (GetProjectDetailsTool, GetContractDetailsTool, etc.) work without AWS credentials.

### Execute Tests

```bash
npm run test
```

## Test Output

Successful output looks like:

```
Starting LLM Tool Tests...

Running GetProjectDetailsTool test...
Running GetContractDetailsTool test...
Running GetContractEditsSummaryTool test...
Running AddNoteToContractTool test...
Running UpdateProjectTasksTool test...
Running CreateNewContractVersionTool test...
Running CreateNewContractTool test...

========================================
Test Results
========================================

✓ PASS GetProjectDetailsTool
✓ PASS GetContractDetailsTool
✓ PASS GetContractEditsSummaryTool
✓ PASS AddNoteToContractTool
✓ PASS UpdateProjectTasksTool
✓ PASS CreateNewContractVersionTool
✓ PASS CreateNewContractTool

========================================
Total: 7 | Passed: 7 | Failed: 0
========================================
```

Failed tests will show in red with error messages explaining what went wrong.

## Troubleshooting

### "Cannot find package '$env'"

This error means you're trying to import from SvelteKit's environment module directly. The tests should use `testDb.ts` and `testSettings.ts` instead, which read from `process.env`.

### "Error connecting to database"

- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check that the database exists
- Verify your user has appropriate permissions

### "Test Project [timestamp] not found"

This usually indicates a database connection issue or that the test cleanup didn't run properly from a previous test run. Check your database connection and manually clean up any test data if needed:

```sql
-- Clean up test projects
DELETE FROM projects WHERE project_name LIKE 'Test Project%';

-- Clean up test agreements
DELETE FROM agreements WHERE root_id LIKE 'TEST-%';
```

## Test Data Cleanup

Tests automatically clean up their data using `try/finally` blocks. Even if a test fails, the cleanup code will run.

However, if the test process is forcefully terminated (e.g., CTRL+C during execution), some test data might remain. You can manually clean it up using the SQL commands above.

## CI/CD Integration

To run tests in a CI/CD pipeline:

1. Set up a test database (or use a temporary database service)
2. Set the `DATABASE_URL` environment variable as a secret
3. Run `npm run test` in your CI pipeline

Example GitHub Actions workflow:

```yaml
- name: Run Tests
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  run: npm run test
```

## Adding New Tests

See the main [README.md](./README.md) for information on adding tests for new tools.
