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
      'You are the Startup Preflight 2.0 Supportive Co-Founder. Follow the "Capture First, Expand Second" philosophy. Extract a crisp, enthusiastic 1-Page Concept Canvas from the founder’s raw brain dump without criticizing the idea.',
  },
  {
    promptKey: 'MOD_A_THINGS_TO_CONSIDER',
    moduleCode: 'MOD_A_IDEATION' as const,
    modelName: 'gemini-2.5-flash',
    systemInstruction:
      'You are the Startup Preflight 2.0 Blind-Spot Engine. After capturing the founder’s Module A Concept Canvas, surface 3–5 constructive "Things to Consider" operational realities, industry traps, and open questions framed as helpful prompts.',
  },
  {
    promptKey: 'MOD_C_MOM_TEST_SURVEY',
    moduleCode: 'MOD_C_SURVEYS_FEEDBACK' as const,
    modelName: 'gemini-2.5-flash',
    systemInstruction:
      'Analyze customer discovery survey questions against "The Mom Test" principles. Flag leading or compliment-seeking questions and rewrite them to focus on past behaviors, concrete spending, and real workflow friction.',
  },
  {
    promptKey: 'MOD_L_RED_FLAG_AUDIT',
    moduleCode: 'MOD_L_BUSINESS_PLAN' as const,
    modelName: 'gemini-2.5-pro',
    systemInstruction:
      'Perform a deep narrative-vs-financial and official grant pre-flight contradiction audit across Modules A through K. Highlight discrepancies between pricing, hiring timelines, marketing budgets, cashflow runway, and IE LEO / UK Innovate UK / Start Up Loans / SEIS compliance.',
  },
];

async function seed() {
  console.log('🌱 Starting Startup Preflight 2.0 Database Seed...');

  // 1. Seed Default Global Tenant + Sample University Tenant
  const [defaultTenant] = await db
    .insert(tenants)
    .values({
      name: 'Startup Preflight Global',
      slug: 'default',
      brandingJson: {
        primaryColor: '#4f46e5',
        accentColor: '#f59e0b',
      },
    })
    .onConflictDoUpdate({
      target: tenants.slug,
      set: { name: 'Startup Preflight Global' },
    })
    .returning();

  const [ucdTenant] = await db
    .insert(tenants)
    .values({
      name: 'UCD Nova Innovation Hub',
      slug: 'ucd-nova',
      customDomain: 'nova.startuppreflight.com',
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
      inviteCode: 'SPF-UCD-2027',
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

  // 6. Optional Sample Users (disabled to keep live database clean)
  // Seed sample users only if explicit flag ENABLE_DEMO_SEED_USERS is set
  if (process.env.ENABLE_DEMO_SEED_USERS === 'true') {
    const [freeFounder] = await db
      .insert(users)
      .values({
        tenantId: defaultTenant.id,
        email: 'founder@startuppreflight.com',
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
        email: 'appsumo@startuppreflight.com',
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
        email: 'admin@startuppreflight.com',
        name: 'Startup Preflight Super Admin',
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
    // Seed Default Startup Plans if none exist for Aoife
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
  }

  // 7. Seed Unclaimed AppSumo Vouchers for Testing /redeem & Code Stacking

  console.log('✅ Startup Preflight 2.0 Database Seed completed successfully!');
  await pool.end();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
