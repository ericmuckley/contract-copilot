import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL environment variable is not set');
	process.exit(1);
}

const sql = neon(DATABASE_URL);

async function seedDatabase() {
	try {
		console.log('📦 Starting database seed...');
		console.log(`🔗 Connecting to database...`);

		// Read the SQL file
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const sqlFilePath = join(__dirname, 'create_tables.sql');

		console.log(`📄 Reading SQL file: ${sqlFilePath}`);
		const sqlContent = readFileSync(sqlFilePath, 'utf-8');

		// Split SQL content into individual statements
		const statements = sqlContent
			.split(';')
			.map((stmt) => stmt.trim())
			.filter((stmt) => stmt.length > 0);

		console.log(`🔧 Found ${statements.length} SQL statements to execute`);

		// Execute each statement
		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			console.log(`\n▶️  Executing statement ${i + 1}/${statements.length}:`);
			console.log(statement.substring(0, 100) + '...');

			try {
				// Use sql.query() for raw SQL execution
				await sql.query(statement);
				console.log(`✓ Statement ${i + 1} executed successfully`);
			} catch (error) {
				console.error(`✗ Error executing statement ${i + 1}:`, error);
				throw error;
			}
		}

		// Verify tables were created
		console.log('\n🔍 Verifying tables...');
		const tables = await sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public'
			ORDER BY table_name
		`;

		console.log('📊 Tables in database:');
		tables.forEach((row) => {
			console.log(`  - ${row.table_name}`);
		});

		console.log('\n✅ Database seeded successfully!');
	} catch (error) {
		console.error('\n❌ Error seeding database:', error);
		process.exit(1);
	}
}

seedDatabase();
