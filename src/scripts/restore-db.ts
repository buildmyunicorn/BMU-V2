import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import 'dotenv/config';

const TABLES_IN_ORDER = [
  'tenants',
  'cohorts',
  'users',
  'user_entitlements',
  'vouchers',
  'startup_plans',
  'plan_collaborators',
  'plan_modules_data',
  'open_questions_parking_lot',
  'validation_surveys',
  'survey_responses',
  'early_access_waitlist',
  'support_tickets',
  'ai_usage_logs',
  'country_rules',
  'grants_directory',
  'ai_prompts',
];

async function restore() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const customBackupFile = process.argv[2];
  const backupPath = customBackupFile
    ? path.resolve(process.cwd(), customBackupFile)
    : path.resolve(process.cwd(), 'backups', 'latest_backup.json');

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found at: ${backupPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(raw);

  console.log(`📥 Starting restore into: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`   Source backup created at: ${backup.createdAt}`);
  console.log(`   Total rows in backup: ${backup.totalRows}\n`);

  const client = new Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 15000,
  });

  await client.connect();

  let restoredTotal = 0;

  for (const table of TABLES_IN_ORDER) {
    const rows: Record<string, unknown>[] = backup.tables[table] || [];
    if (!rows.length) {
      console.log(`  - ${table.padEnd(28)} : 0 rows (skipped)`);
      continue;
    }

    try {
      // Use transaction per table or per row with ON CONFLICT DO UPDATE
      for (const rawRow of rows) {
        const row = { ...rawRow };
        // Handle enum migration from V1 (MOD_K_BUSINESS_PLAN -> MOD_L_BUSINESS_PLAN)
        if (table === 'plan_modules_data' && row.module_code === 'MOD_K_BUSINESS_PLAN') {
          row.module_code = 'MOD_L_BUSINESS_PLAN';
        }
        if (table === 'ai_prompts') {
          if (row.module_code === 'MOD_G_BUSINESS_PLAN' || row.module_code === 'MOD_K_BUSINESS_PLAN') {
            row.module_code = 'MOD_L_BUSINESS_PLAN';
          }
        }
        if (table === 'grants_directory' && !row.slug && row.grant_name) {
          row.slug = String(row.grant_name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        const columns = Object.keys(row);
        const values = Object.values(row).map((v) => {
          // If object or array and not date, JSON stringify for jsonb columns
          if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
            return JSON.stringify(v);
          }
          return v;
        });

        const quotedCols = columns.map((c) => `"${c}"`).join(', ');
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        // Determine conflict target (primary key 'id' for most tables, prompt_key for ai_prompts, etc.)
        let conflictClause = 'ON CONFLICT DO NOTHING';
        if (columns.includes('id')) {
          const updateAssignments = columns
            .filter((c) => c !== 'id' && c !== 'created_at')
            .map((c) => `"${c}" = EXCLUDED."${c}"`)
            .join(', ');
          if (updateAssignments.length > 0) {
            conflictClause = `ON CONFLICT ("id") DO UPDATE SET ${updateAssignments}`;
          }
        } else if (table === 'ai_prompts' && columns.includes('prompt_key')) {
          conflictClause = `ON CONFLICT ("prompt_key") DO NOTHING`;
        } else if (table === 'country_rules' && columns.includes('country_code')) {
          conflictClause = `ON CONFLICT ("country_code") DO NOTHING`;
        }

        const query = `
          INSERT INTO "${table}" (${quotedCols})
          VALUES (${placeholders})
          ${conflictClause};
        `;

        await client.query(query, values);
      }

      console.log(`  ✓ ${table.padEnd(28)} : ${rows.length} rows restored/synced`);
      restoredTotal += rows.length;
    } catch (err) {
      console.error(`  ❌ Failed restoring table "${table}":`, (err as Error).message);
    }
  }

  await client.end();
  console.log(`\n🎉 Restore complete! Restored/synced ${restoredTotal} records.`);
}

restore().catch((err) => {
  console.error('❌ Restore failed:', err);
  process.exit(1);
});
