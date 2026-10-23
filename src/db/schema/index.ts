import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. ENUMS
// ==========================================
export const userRoleEnum = pgEnum('user_role', [
  'FOUNDER',
  'MENTOR',
  'TENANT_ADMIN',
  'SUPER_ADMIN',
]);

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'SOFT_DELETED',
]);

export const entitlementPlanTypeEnum = pgEnum('entitlement_plan_type', [
  'FREE_HOOK',
  'SIX_MONTH_SOLO',
  'SIX_MONTH_COFOUNDER',
  'APPSUMO_LTD',
  'COHORT_PASS',
]);

export const voucherSourceEnum = pgEnum('voucher_source', [
  'APPSUMO',
  'COHORT',
  'PROMO',
]);

export const voucherStatusEnum = pgEnum('voucher_status', [
  'UNCLAIMED',
  'REDEEMED',
  'REFUNDED_REVOKED',
]);

export const planStatusEnum = pgEnum('plan_status', ['ACTIVE', 'ARCHIVED']);

export const collaboratorRoleEnum = pgEnum('collaborator_role', [
  'OWNER',
  'CO_FOUNDER',
  'ADVISOR_READONLY',
]);

export const moduleCodeEnum = pgEnum('module_code', [
  'MOD_A_IDEATION',
  'MOD_B_MARKET',
  'MOD_C_OPERATIONS_TEAM',
  'MOD_D_REVENUE',
  'MOD_E_MARKETING',
  'MOD_F_FINANCE_GRANTS',
  'MOD_G_BUSINESS_PLAN',
]);

export const questionStatusEnum = pgEnum('question_status', [
  'OPEN',
  'RESOLVED',
]);

export type StartupHat =
  | 'VISION_INVESTOR'
  | 'PRODUCT_TECH'
  | 'SALES'
  | 'MARKETING'
  | 'CUSTOMER_SUPPORT'
  | 'OPERATIONS_ADMIN'
  | 'FINANCE_BOOKS';

export type BlindSpotItem = {
  id: string;
  title: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  explanation: string;
  suggestedAction: string;
};

// ==========================================
// 2. MULTI-TENANT & COHORT TABLES (Phase 2 Ready)
// ==========================================
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // e.g., 'default', 'ucd-nova', 'leo-dublin'
  customDomain: text('custom_domain'),
  brandingJson: jsonb('branding_json')
    .$type<{
      logoUrl?: string;
      primaryColor?: string;
      accentColor?: string;
    }>()
    .default({}),
  customRubricJson: jsonb('custom_rubric_json').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cohorts = pgTable('cohorts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(), // e.g., 'Spring 2027 Accelerator Batch'
  inviteCode: text('invite_code').notNull().unique(), // e.g., 'BMU-UCD-2027'
  maxSeats: integer('max_seats').default(50).notNull(),
  seatsUsed: integer('seats_used').default(0).notNull(),
  accessDurationMonths: integer('access_duration_months').default(6).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 3. USERS, ENTITLEMENTS & APPSUMO VOUCHERS
// ==========================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  cohortId: uuid('cohort_id').references(() => cohorts.id),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: userRoleEnum('role').default('FOUNDER').notNull(),
  status: userStatusEnum('status').default('ACTIVE').notNull(),
  suspensionReason: text('suspension_reason'),
  adminInternalNotes: text('admin_internal_notes'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  deletedAt: timestamp('deleted_at'), // For 30-day Soft Delete recovery window
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userEntitlements = pgTable('user_entitlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  planType: entitlementPlanTypeEnum('plan_type').default('FREE_HOOK').notNull(),
  stackedCodesCount: integer('stacked_codes_count').default(0).notNull(), // AppSumo 1, 2, 3+ codes
  maxStartupPlans: integer('max_startup_plans').default(1).notNull(),
  maxSeatsPerPlan: integer('max_seats_per_plan').default(1).notNull(),
  monthlyAiCreditsLimit: integer('monthly_ai_credits_limit').default(50).notNull(),
  aiCreditsUsedThisMonth: integer('ai_credits_used_this_month').default(0).notNull(),
  creditsResetAt: timestamp('credits_reset_at'),
  whiteLabelExportEnabled: boolean('white_label_export_enabled').default(false).notNull(),
  customApiKeyEncrypted: text('custom_api_key_encrypted'), // BYOK for Tier 3 AppSumo
  accessExpiresAt: timestamp('access_expires_at'), // NULL for AppSumo LTD, +6 months for Passes
  isVaultReadonly: boolean('is_vault_readonly').default(false).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vouchers = pgTable('vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // e.g., 'SUMO-BMU-8842-991A'
  batchName: text('batch_name').notNull(), // e.g., 'AppSumo_Launch_Batch_1'
  source: voucherSourceEnum('source').default('APPSUMO').notNull(),
  status: voucherStatusEnum('status').default('UNCLAIMED').notNull(),
  redeemedByUserId: uuid('redeemed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  redeemedAt: timestamp('redeemed_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 4. STARTUP PLANS (1-TO-MANY WORKSPACES) & COLLABORATORS
// ==========================================
export const startupPlans = pgTable('startup_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  cohortId: uuid('cohort_id').references(() => cohorts.id),
  parentPlanId: uuid('parent_plan_id'), // Populated when a founder uses "Clone & Pivot"
  title: text('title').notNull(),
  oneLinerSummary: text('one_liner_summary'),
  industryCategory: text('industry_category'),
  hqCountryCode: text('hq_country_code').default('IE').notNull(), // 'IE', 'GB', 'US', 'AU', 'CA', 'EU', 'ROW'
  baseCurrency: text('base_currency').default('EUR').notNull(), // 'EUR', 'GBP', 'USD', 'AUD', 'CAD'
  targetMarketsArray: jsonb('target_markets_array').$type<string[]>().default(['IE']),
  currentModuleStep: text('current_module_step').default('MOD_A_STEP_1').notNull(),
  ideaComparatorScoresJson: jsonb('idea_comparator_scores_json')
    .$type<{
      easeOfLaunch?: number;
      founderFit?: number;
      timeToRevenue?: number;
      capitalRequired?: number;
    }>()
    .default({}),
  status: planStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const planCollaborators = pgTable(
  'plan_collaborators',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    planId: uuid('plan_id')
      .references(() => startupPlans.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    invitedEmail: text('invited_email').notNull(),
    inviteAccepted: boolean('invite_accepted').default(false).notNull(),
    role: collaboratorRoleEnum('role').default('CO_FOUNDER').notNull(),
    // Module C Step 3: Startup Hats assigned to this person
    assignedHatsArray: jsonb('assigned_hats_array')
      .$type<StartupHat[]>()
      .default([]),
    // Module C Step 4: Blind-Reveal Co-Founder Alignment Answers (Locked until all submit)
    alignmentInterviewCompleted: boolean('alignment_interview_completed')
      .default(false)
      .notNull(),
    alignmentInterviewAnswersJson: jsonb('alignment_interview_answers_json')
      .$type<{
        mediaSpokesperson?: string;
        willingToRelocate?: string;
        weeklyHoursCommitment?: string;
        personalRunwayMonths?: number;
        earlyExit2MDecision?: string;
        deadlockResolutionMethod?: string;
      }>()
      .default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    planCollaboratorUniqueIdx: uniqueIndex('plan_collab_email_idx').on(
      table.planId,
      table.invitedEmail
    ),
  })
);

// ==========================================
// 5. MODULE DATA, BLIND SPOTS & OPEN QUESTIONS PARKING LOT
// ==========================================
export const planModulesData = pgTable(
  'plan_modules_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    planId: uuid('plan_id')
      .references(() => startupPlans.id, { onDelete: 'cascade' })
      .notNull(),
    moduleCode: moduleCodeEnum('module_code').notNull(),
    structuredInputsJsonb: jsonb('structured_inputs_jsonb').default({}).notNull(),
    aiThingsToConsiderJsonb: jsonb('ai_things_to_consider_jsonb')
      .$type<BlindSpotItem[]>()
      .default([]),
    completionPercentage: integer('completion_percentage').default(0).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    planModuleUniqueIdx: uniqueIndex('plan_module_unique_idx').on(
      table.planId,
      table.moduleCode
    ),
  })
);

export const openQuestionsParkingLot = pgTable('open_questions_parking_lot', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: uuid('plan_id')
    .references(() => startupPlans.id, { onDelete: 'cascade' })
    .notNull(),
  sourceModule: moduleCodeEnum('source_module').notNull(),
  questionText: text('question_text').notNull(),
  status: questionStatusEnum('status').default('OPEN').notNull(),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// ==========================================
// 6. MODULE B: HOSTED VALIDATION SURVEY ENGINE
// ==========================================
export const validationSurveys = pgTable('validation_surveys', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: uuid('plan_id')
    .references(() => startupPlans.id, { onDelete: 'cascade' })
    .notNull(),
  publicSlug: text('public_slug').notNull().unique(), // buildmyunicorn.com/v/[publicSlug]
  title: text('title').notNull(),
  introDescription: text('intro_description'),
  isActive: boolean('is_active').default(true).notNull(), // Auto-disabled if user is suspended
  collectLeadEmails: boolean('collect_lead_emails').default(true).notNull(),
  questionsJsonb: jsonb('questions_jsonb')
    .$type<
      Array<{
        id: string;
        questionText: string;
        type: 'MULTIPLE_CHOICE' | 'SCALE_1_5' | 'OPEN_TEXT';
        options?: string[];
        momTestPassed: boolean;
      }>
    >()
    .default([])
    .notNull(),
  aiInsightsSummaryJsonb: jsonb('ai_insights_summary_jsonb').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  surveyId: uuid('survey_id')
    .references(() => validationSurveys.id, { onDelete: 'cascade' })
    .notNull(),
  answersJsonb: jsonb('answers_jsonb').notNull(),
  respondentEmail: text('respondent_email'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

// ==========================================
// 7. ADMIN CMS: COUNTRY RULES, GRANTS & AI TELEMETRY
// ==========================================
export const countryRules = pgTable('country_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryCode: text('country_code').notNull().unique(), // 'IE', 'GB', 'US', 'AU', 'CA', 'EU', 'ROW'
  countryName: text('country_name').notNull(),
  defaultCurrency: text('default_currency').notNull(),
  taxName: text('tax_name').notNull(), // 'VAT', 'Sales Tax', 'GST'
  standardTaxRatePercent: numeric('standard_tax_rate_percent').notNull(),
  employerPayrollTaxName: text('employer_payroll_tax_name').notNull(), // 'Employer PRSI', 'Employer NIC', 'FICA'
  employerPayrollTaxPercent: numeric('employer_payroll_tax_percent').notNull(),
  commonEntityTypesJson: jsonb('common_entity_types_json').$type<string[]>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const grantsDirectory = pgTable('grants_directory', {
  id: uuid('id').defaultRandom().primaryKey(),
  countryCode: text('country_code').notNull(), // 'IE', 'GB', 'US', 'AU', 'CA', 'EU'
  grantName: text('grant_name').notNull(), // e.g., 'LEO Feasibility Study Grant'
  providerAgency: text('provider_agency').notNull(), // e.g., 'Local Enterprise Office (Ireland)'
  fundingType: text('funding_type').notNull(), // 'GRANT', 'TAX_RELIEF', 'R_AND_D_CREDIT', 'EQUITY_MATCH'
  maxAmountFormatted: text('max_amount_formatted').notNull(), // e.g., '€15,000 (50% Match)'
  reimbursementWarning: text('reimbursement_warning').notNull(),
  eligibilityRulesJsonb: jsonb('eligibility_rules_jsonb').default({}).notNull(),
  officialUrl: text('official_url'),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiPrompts = pgTable('ai_prompts', {
  id: uuid('id').defaultRandom().primaryKey(),
  promptKey: text('prompt_key').notNull().unique(), // e.g., 'MOD_A_CONCEPT_CANVAS', 'MOD_B_MOM_TEST_CHECK'
  moduleCode: moduleCodeEnum('module_code').notNull(),
  modelName: text('model_name').default('gemini-2.5-flash').notNull(),
  systemInstruction: text('system_instruction').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  planId: uuid('plan_id').references(() => startupPlans.id, {
    onDelete: 'set null',
  }),
  promptKey: text('prompt_key').notNull(),
  modelUsed: text('model_used').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  usedByokKey: boolean('used_byok_key').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 8. DRIZZLE RELATIONS
// ==========================================
export const tenantsRelations = relations(tenants, ({ many }) => ({
  cohorts: many(cohorts),
  users: many(users),
  startupPlans: many(startupPlans),
}));

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [cohorts.tenantId],
    references: [tenants.id],
  }),
  users: many(users),
  startupPlans: many(startupPlans),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  cohort: one(cohorts, {
    fields: [users.cohortId],
    references: [cohorts.id],
  }),
  entitlement: one(userEntitlements, {
    fields: [users.id],
    references: [userEntitlements.userId],
  }),
  ownedPlans: many(startupPlans),
  collaborations: many(planCollaborators),
  redeemedVouchers: many(vouchers),
  aiUsageLogs: many(aiUsageLogs),
}));

export const userEntitlementsRelations = relations(
  userEntitlements,
  ({ one }) => ({
    user: one(users, {
      fields: [userEntitlements.userId],
      references: [users.id],
    }),
  })
);

export const vouchersRelations = relations(vouchers, ({ one }) => ({
  redeemedByUser: one(users, {
    fields: [vouchers.redeemedByUserId],
    references: [users.id],
  }),
}));

export const startupPlansRelations = relations(
  startupPlans,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [startupPlans.ownerUserId],
      references: [users.id],
    }),
    tenant: one(tenants, {
      fields: [startupPlans.tenantId],
      references: [tenants.id],
    }),
    cohort: one(cohorts, {
      fields: [startupPlans.cohortId],
      references: [cohorts.id],
    }),
    collaborators: many(planCollaborators),
    modulesData: many(planModulesData),
    openQuestions: many(openQuestionsParkingLot),
    validationSurveys: many(validationSurveys),
  })
);

export const planCollaboratorsRelations = relations(
  planCollaborators,
  ({ one }) => ({
    plan: one(startupPlans, {
      fields: [planCollaborators.planId],
      references: [startupPlans.id],
    }),
    user: one(users, {
      fields: [planCollaborators.userId],
      references: [users.id],
    }),
  })
);

export const planModulesDataRelations = relations(
  planModulesData,
  ({ one }) => ({
    plan: one(startupPlans, {
      fields: [planModulesData.planId],
      references: [startupPlans.id],
    }),
  })
);

export const openQuestionsParkingLotRelations = relations(
  openQuestionsParkingLot,
  ({ one }) => ({
    plan: one(startupPlans, {
      fields: [openQuestionsParkingLot.planId],
      references: [startupPlans.id],
    }),
  })
);

export const validationSurveysRelations = relations(
  validationSurveys,
  ({ one, many }) => ({
    plan: one(startupPlans, {
      fields: [validationSurveys.planId],
      references: [startupPlans.id],
    }),
    responses: many(surveyResponses),
  })
);

export const surveyResponsesRelations = relations(
  surveyResponses,
  ({ one }) => ({
    survey: one(validationSurveys, {
      fields: [surveyResponses.surveyId],
      references: [validationSurveys.id],
    }),
  })
);
