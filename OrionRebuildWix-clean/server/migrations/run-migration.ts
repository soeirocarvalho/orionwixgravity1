import { pool } from "../db";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigration(migrationFile: string) {
  const client = await pool.connect();
  
  try {
    console.log(`[Migration] Running migration: ${migrationFile}`);
    
    // Read migration SQL
    const sqlPath = join(__dirname, migrationFile);
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute migration
    await client.query(sql);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`[Migration] Successfully completed: ${migrationFile}`);
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error(`[Migration] Failed: ${migrationFile}`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration('001_add_multi_tenant_support.sql')
    .then(() => {
      console.log('[Migration] Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Migration] Migration failed:', error);
      process.exit(1);
    });
}
