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

async function backup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  console.log('📦 Starting database backup from:', dbUrl.replace(/:[^:@]+@/, ':***@'));

  const client = new Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 15000,
  });

  await client.connect();

  const backupData: Record<string, unknown[]> = {};
  let totalRows = 0;

  for (const table of TABLES_IN_ORDER) {
    try {
      const res = await client.query(`SELECT * FROM "${table}";`);
      backupData[table] = res.rows;
      totalRows += res.rows.length;
      console.log(`  ✓ ${table.padEnd(28)} : ${res.rows.length} rows`);
    } catch (err) {
      console.warn(`  ⚠️ Could not export table "${table}":`, (err as Error).message);
    }
  }

  await client.end();

  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `db_backup_${timestamp}.json`;
  const latestFilename = `latest_backup.json`;

  const backupPath = path.join(backupDir, filename);
  const latestPath = path.join(backupDir, latestFilename);

  const payload = JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      sourceDatabaseUrl: dbUrl.replace(/:[^:@]+@/, ':***@'),
      totalRows,
      tables: backupData,
    },
    null,
    2
  );

  fs.writeFileSync(backupPath, payload, 'utf-8');
  fs.writeFileSync(latestPath, payload, 'utf-8');

  console.log(`\n✅ Backup successfully saved!`);
  console.log(`  File: ${backupPath}`);
  console.log(`  Latest symlink copy: ${latestPath}`);
  console.log(`  Total rows exported: ${totalRows}`);
}

backup().catch((err) => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
