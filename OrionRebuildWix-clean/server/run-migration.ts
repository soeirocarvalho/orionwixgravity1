import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('[Migration] Reading migration file...');
        const migrationPath = path.join(__dirname, 'migrations', '003_add_user_project_state.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('[Migration] Executing migration...');
        await db.execute(sql.raw(migrationSQL));

        console.log('[Migration] ✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('[Migration] ❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
