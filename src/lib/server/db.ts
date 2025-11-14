import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$lib/server/settings';

const sql = neon(DATABASE_URL);

export async function load() {
	const response = await sql`SELECT version()`;
	const { version } = response[0];
	return {
		version
	};
}
