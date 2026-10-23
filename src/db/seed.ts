import 'dotenv/config';
import { eq } from 'drizzle-orm';
import {
  db,
  pool,
  tenants,
  cohorts,
  users,
  userEntitlements,
  vouchers,
  startupPlans,
  countryRules,
  grantsDirectory,
  aiPrompts,
} from './index';
import {
  DEFAULT_COUNTRY_RULES,
  DEFAULT_GRANTS_DIRECTORY,
} from '@/lib/localization';

export { DEFAULT_COUNTRY_RULES, DEFAULT_GRANTS_DIRECTORY };

export const DEFAULT_AI_PROMPTS = [
  {
    promptKey: 'MOD_A_CONCEPT_CANVAS',
    moduleCode: 'MOD_A_IDEATION' as const,
    modelName: 'gemini-2.5-flash',
    systemInstruction:
      'You are the Build My Unicorn (BMU) 2.0 Supportive Co-Founder. Follow the "Capture First, Expand Second" philosophy. Extract a crisp, enthusiastic 1-Page Concept Canvas from the founder’s raw brain dump without criticizing the idea.',
  },
  {
    promptKey: 'MOD_A_THINGS_TO_CONSIDER',
    moduleCode: 'MOD_A_IDEATION' as const,
    modelName: 'gemini-2.5-flash',
    systemInstruction:
      'You are the BMU 2.0 Blind-Spot Engine. After capturing the founder’s Module A Concept Canvas, surface 3–5 constructive "Things to Consider" operational realities, industry traps, and open questions framed as helpful prompts.',
  },
  {
    promptKey: 'MOD_B_MOM_TEST_CHECK',
    moduleCode: 'MOD_B_MARKET' as const,
    modelName: 'gemini-2.5-flash',
    systemInstruction:
      'Analyze customer discovery survey questions against "The Mom Test" principles. Flag leading or compliment-seeking questions and rewrite them to focus on past behaviors, concrete spending, and real workflow friction.',
  },
  {
    promptKey: 'MOD_G_RED_FLAG_AUDIT',
    moduleCode: 'MOD_G_BUSINESS_PLAN' as const,
    modelName: 'gemini-2.5-pro',
    systemInstruction:
      'Perform a deep narrative-vs-financial contradiction audit across Modules A through F. Highlight discrepancies between pricing, hiring timelines, marketing budgets, and cashflow runway.',
  },
];

async function seed() {
  console.log('🌱 Starting BMU 2.0 Sprint 1 Database Seed...');

  // 1. Seed Default Global Tenant + Sample University Tenant
  const [defaultTenant] = await db
    .insert(tenants)
    .values({
      name: 'Build My Unicorn Global',
      slug: 'default',
      brandingJson: {
        primaryColor: '#4f46e5',
        accentColor: '#f59e0b',
      },
    })
    .onConflictDoUpdate({
      target: tenants.slug,
      set: { name: 'Build My Unicorn Global' },
    })
    .returning();

  const [ucdTenant] = await db
    .insert(tenants)
    .values({
      name: 'UCD Nova Innovation Hub',
      slug: 'ucd-nova',
      customDomain: 'nova.buildmyunicorn.com',
      brandingJson: {
        primaryColor: '#003366',
        accentColor: '#eab308',
      },
    })
    .onConflictDoUpdate({
      target: tenants.slug,
      set: { name: 'UCD Nova Innovation Hub' },
    })
    .returning();

  // 2. Seed Sample Cohort
  await db
    .insert(cohorts)
    .values({
      tenantId: ucdTenant.id,
      name: 'Spring 2027 Accelerator Batch',
      inviteCode: 'BMU-UCD-2027',
      maxSeats: 50,
      seatsUsed: 1,
      accessDurationMonths: 6,
    })
    .onConflictDoNothing();

  // 3. Seed Country Rules
  for (const rule of DEFAULT_COUNTRY_RULES) {
    await db
      .insert(countryRules)
      .values(rule)
      .onConflictDoUpdate({
        target: countryRules.countryCode,
        set: {
          countryName: rule.countryName,
          defaultCurrency: rule.defaultCurrency,
          taxName: rule.taxName,
          standardTaxRatePercent: rule.standardTaxRatePercent,
          employerPayrollTaxName: rule.employerPayrollTaxName,
          employerPayrollTaxPercent: rule.employerPayrollTaxPercent,
          commonEntityTypesJson: rule.commonEntityTypesJson,
          updatedAt: new Date(),
        },
      });
  }

  // 4. Seed Grants Directory (if empty)
  const existingGrants = await db.select().from(grantsDirectory);
  if (existingGrants.length === 0) {
    await db.insert(grantsDirectory).values(DEFAULT_GRANTS_DIRECTORY);
  }

  // 5. Seed Default AI Prompts
  for (const prompt of DEFAULT_AI_PROMPTS) {
    await db
      .insert(aiPrompts)
      .values(prompt)
      .onConflictDoUpdate({
        target: aiPrompts.promptKey,
        set: {
          systemInstruction: prompt.systemInstruction,
          modelName: prompt.modelName,
          updatedAt: new Date(),
        },
      });
  }

  // 6. Seed Sample Users & Entitlements
  const [freeFounder] = await db
    .insert(users)
    .values({
      tenantId: defaultTenant.id,
      email: 'founder@buildmyunicorn.com',
      name: 'Aoife Brennan (Free Tier)',
      emailVerified: true,
      role: 'FOUNDER',
      status: 'ACTIVE',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: 'Aoife Brennan (Free Tier)' },
    })
    .returning();

  await db
    .insert(userEntitlements)
    .values({
      userId: freeFounder.id,
      planType: 'FREE_HOOK',
      stackedCodesCount: 0,
      maxStartupPlans: 1,
      maxSeatsPerPlan: 1,
      monthlyAiCreditsLimit: 50,
      aiCreditsUsedThisMonth: 12,
      isVaultReadonly: false,
    })
    .onConflictDoNothing();

  const [sumoFounder] = await db
    .insert(users)
    .values({
      tenantId: defaultTenant.id,
      email: 'appsumo@buildmyunicorn.com',
      name: 'Liam O’Connor (AppSumo Tier 2)',
      emailVerified: true,
      role: 'FOUNDER',
      status: 'ACTIVE',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: 'Liam O’Connor (AppSumo Tier 2)' },
    })
    .returning();

  await db
    .insert(userEntitlements)
    .values({
      userId: sumoFounder.id,
      planType: 'APPSUMO_LTD',
      stackedCodesCount: 2,
      maxStartupPlans: 3,
      maxSeatsPerPlan: 3,
      monthlyAiCreditsLimit: 450,
      aiCreditsUsedThisMonth: 45,
      isVaultReadonly: false,
    })
    .onConflictDoNothing();

  const [superAdmin] = await db
    .insert(users)
    .values({
      tenantId: defaultTenant.id,
      email: 'admin@buildmyunicorn.com',
      name: 'BMU Super Admin',
      emailVerified: true,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: 'SUPER_ADMIN' },
    })
    .returning();

  await db
    .insert(userEntitlements)
    .values({
      userId: superAdmin.id,
      planType: 'APPSUMO_LTD',
      stackedCodesCount: 5,
      maxStartupPlans: 10,
      maxSeatsPerPlan: 5,
      monthlyAiCreditsLimit: 5000,
      aiCreditsUsedThisMonth: 0,
      whiteLabelExportEnabled: true,
      isVaultReadonly: false,
    })
    .onConflictDoNothing();

  // 7. Seed Unclaimed AppSumo Vouchers for Testing /redeem & Code Stacking
  const sampleVouchers = [
    'SUMO-BMU-1001-ALPHA',
    'SUMO-BMU-1002-BRAVO',
    'SUMO-BMU-1003-CHARLIE',
    'SUMO-BMU-1004-DELTA',
    'SUMO-BMU-1005-ECHO',
  ];

  for (const code of sampleVouchers) {
    await db
      .insert(vouchers)
      .values({
        code,
        batchName: 'AppSumo_Launch_Batch_1',
        source: 'APPSUMO',
        status: 'UNCLAIMED',
      })
      .onConflictDoNothing();
  }

  // 8. Seed Default Startup Plans if none exist for Aoife
  const existingPlans = await db
    .select()
    .from(startupPlans)
    .where(eq(startupPlans.ownerUserId, freeFounder.id));

  if (existingPlans.length === 0) {
    await db.insert(startupPlans).values({
      ownerUserId: freeFounder.id,
      tenantId: defaultTenant.id,
      title: 'GreenCart AI — Zero-Waste Grocery Supply Chain',
      oneLinerSummary:
        'Automated expiry prediction & dynamic markdowns for independent supermarkets in Ireland & the UK.',
      industryCategory: 'B2B SaaS / RetailTech',
      hqCountryCode: 'IE',
      baseCurrency: 'EUR',
      targetMarketsArray: ['IE', 'GB'],
      currentModuleStep: 'MOD_A_STEP_4',
      ideaComparatorScoresJson: {
        easeOfLaunch: 7,
        founderFit: 9,
        timeToRevenue: 8,
        capitalRequired: 6,
      },
      status: 'ACTIVE',
    });
  }

  console.log('✅ BMU 2.0 Sprint 1 Database Seed completed successfully!');
  await pool.end();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
