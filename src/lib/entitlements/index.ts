import type {
  entitlementPlanTypeEnum,
  moduleCodeEnum,
} from '@/db/schema';

export type EntitlementPlanType =
  (typeof entitlementPlanTypeEnum.enumValues)[number];
export type ModuleCode = (typeof moduleCodeEnum.enumValues)[number];

export interface EntitlementSnapshot {
  userId: string;
  planType: EntitlementPlanType;
  stackedCodesCount: number;
  maxStartupPlans: number;
  maxSeatsPerPlan: number;
  monthlyAiCreditsLimit: number;
  aiCreditsUsedThisMonth: number;
  whiteLabelExportEnabled: boolean;
  customApiKeyEncrypted?: string | null;
  accessExpiresAt?: Date | null;
  isVaultReadonly: boolean;
}

export type PaywallFeature =
  | 'MODULE_A_IDEATION'
  | 'MODULE_B_THROUGH_G'
  | 'MODULE_B_THROUGH_I'
  | 'PUBLIC_SURVEY_PUBLISH'
  | 'MULTI_PLAN_CREATE'
  | 'CLONE_AND_PIVOT'
  | 'IDEA_COMPARATOR'
  | 'COFOUNDER_INVITE'
  | 'COFOUNDER_ALIGNMENT_INTERVIEW'
  | 'GRANT_MATCHER'
  | 'DOCUMENT_EXPORT'
  | 'WHITE_LABEL_EXPORT'
  | 'BYOK_API_KEY';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: 'SIX_MONTH_SOLO' | 'SIX_MONTH_COFOUNDER' | 'APPSUMO_STACK' | 'RENEW_VAULT';
  currentLimit?: number;
}

/**
 * Calculates the exact AppSumo Lifetime Deal (LTD) tier entitlements
 * based on how many voucher codes a user has stacked (1, 2, or 3+).
 */
export function calculateAppSumoTierLimits(stackedCodesCount: number): {
  tierName: string;
  stackedCodesCount: number;
  maxStartupPlans: number;
  maxSeatsPerPlan: number;
  monthlyAiCreditsLimit: number;
  whiteLabelExportEnabled: boolean;
  byokAllowed: boolean;
} {
  const count = Math.max(1, stackedCodesCount);

  if (count === 1) {
    return {
      tierName: 'AppSumo Tier 1 — Solo Founder',
      stackedCodesCount: 1,
      maxStartupPlans: 1,
      maxSeatsPerPlan: 1,
      monthlyAiCreditsLimit: 150,
      whiteLabelExportEnabled: false,
      byokAllowed: false,
    };
  }

  if (count === 2) {
    return {
      tierName: 'AppSumo Tier 2 — Co-Founder & Pivot Tier',
      stackedCodesCount: 2,
      maxStartupPlans: 3,
      maxSeatsPerPlan: 3,
      monthlyAiCreditsLimit: 450,
      whiteLabelExportEnabled: false,
      byokAllowed: false,
    };
  }

  // 3+ Codes (Tier 3: Serial Entrepreneur / Advisor Tier)
  return {
    tierName: `AppSumo Tier 3 — Serial Entrepreneur (${count} Codes)`,
    stackedCodesCount: count,
    maxStartupPlans: count >= 5 ? 25 : 10,
    maxSeatsPerPlan: 5,
    monthlyAiCreditsLimit: 1500,
    whiteLabelExportEnabled: true,
    byokAllowed: true,
  };
}

/**
 * Calculates default entitlements for Direct 6-Month Passes and Institutional Cohort Passes.
 */
export function calculatePassLimits(
  planType: 'FREE_HOOK' | 'SIX_MONTH_SOLO' | 'SIX_MONTH_COFOUNDER' | 'COHORT_PASS',
  durationMonths = 6
) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  switch (planType) {
    case 'FREE_HOOK':
      return {
        planType: 'FREE_HOOK' as const,
        maxStartupPlans: 1,
        maxSeatsPerPlan: 1,
        monthlyAiCreditsLimit: 50,
        whiteLabelExportEnabled: false,
        accessExpiresAt: null,
      };
    case 'SIX_MONTH_SOLO':
      return {
        planType: 'SIX_MONTH_SOLO' as const,
        maxStartupPlans: 1,
        maxSeatsPerPlan: 1,
        monthlyAiCreditsLimit: 250,
        whiteLabelExportEnabled: false,
        accessExpiresAt: expiresAt,
      };
    case 'SIX_MONTH_COFOUNDER':
    case 'COHORT_PASS':
      return {
        planType,
        maxStartupPlans: 3,
        maxSeatsPerPlan: 3,
        monthlyAiCreditsLimit: 500,
        whiteLabelExportEnabled: false,
        accessExpiresAt: expiresAt,
      };
  }
}

/**
 * Checks whether a time-limited pass (6-Month Pass or Cohort Pass) has expired
 * and should drop into Read-Only "Vault Mode".
 */
export function isEntitlementInVaultMode(
  entitlement: Pick<
    EntitlementSnapshot,
    'planType' | 'accessExpiresAt' | 'isVaultReadonly'
  >,
  referenceDate: Date = new Date()
): boolean {
  if (entitlement.isVaultReadonly) {
    return true;
  }
  if (entitlement.planType === 'APPSUMO_LTD' || entitlement.planType === 'FREE_HOOK') {
    return false;
  }
  if (
    entitlement.accessExpiresAt &&
    entitlement.accessExpiresAt.getTime() < referenceDate.getTime()
  ) {
    return true;
  }
  return false;
}

/**
 * Checks if a user can access a specific Startup Preflight Module (MOD_A through MOD_I).
 * FREE_HOOK has full access to Module A (Steps 1-8), and triggers the paywall on Modules B-I.
 */
export function canAccessModule(
  entitlement: EntitlementSnapshot,
  moduleCode: ModuleCode
): EntitlementCheckResult {
  if (moduleCode === 'MOD_A_IDEATION') {
    return { allowed: true };
  }

  if (entitlement.planType === 'FREE_HOOK') {
    return {
      allowed: false,
      reason:
        'Module A (Ideation) is free forever. Upgrade to a 6-Month Launch Pass or redeem an AppSumo/Cohort code to unlock Modules B–I, Hosted Customer Surveys & Waitlist, Product Build Architecture, Financial Builder, and Grant Matcher.',
      upgradeRequired: 'SIX_MONTH_SOLO',
    };
  }

  return { allowed: true };
}

/**
 * Checks if the user can create an additional Startup Plan or Clone/Pivot an existing plan.
 */
export function canCreateStartupPlan(
  entitlement: EntitlementSnapshot,
  currentActivePlansCount: number
): EntitlementCheckResult {
  if (isEntitlementInVaultMode(entitlement)) {
    return {
      allowed: false,
      reason:
        'Your workspace is currently in Read-Only Vault Mode. Renew your pass or activate the $9/mo Keep-Warm extension to create or edit plans.',
      upgradeRequired: 'RENEW_VAULT',
      currentLimit: entitlement.maxStartupPlans,
    };
  }

  if (currentActivePlansCount >= entitlement.maxStartupPlans) {
    if (entitlement.planType === 'FREE_HOOK') {
      return {
        allowed: false,
        reason:
          'Free accounts include 1 Startup Plan. Upgrade to the Co-Founder & Pivot Pass or stack a 2nd AppSumo code to manage up to 3 Startup Plans and use Clone & Pivot.',
        upgradeRequired: 'SIX_MONTH_COFOUNDER',
        currentLimit: entitlement.maxStartupPlans,
      };
    }

    if (entitlement.planType === 'APPSUMO_LTD') {
      return {
        allowed: false,
        reason: `You have reached your limit of ${entitlement.maxStartupPlans} active Startup Plan(s). Stack an additional AppSumo code in Billing Settings to unlock up to ${
          entitlement.stackedCodesCount === 1 ? 3 : 10
        } plans!`,
        upgradeRequired: 'APPSUMO_STACK',
        currentLimit: entitlement.maxStartupPlans,
      };
    }

    return {
      allowed: false,
      reason: `You have reached your plan limit (${entitlement.maxStartupPlans} active Startup Plans). Upgrade to the Co-Founder & Pivot Pass to unlock Multi-Plan workspaces.`,
      upgradeRequired: 'SIX_MONTH_COFOUNDER',
      currentLimit: entitlement.maxStartupPlans,
    };
  }

  return { allowed: true, currentLimit: entitlement.maxStartupPlans };
}

/**
 * Checks if the user can invite another collaborator / co-founder to a specific Startup Plan,
 * and whether the Blind-Reveal Co-Founder Alignment Interview (Module C Step 4) is unlocked.
 */
export function canInviteCollaborator(
  entitlement: EntitlementSnapshot,
  currentPlanSeatsUsed: number
): EntitlementCheckResult {
  if (isEntitlementInVaultMode(entitlement)) {
    return {
      allowed: false,
      reason: 'Workspace is in Read-Only Vault Mode. Renew your pass to invite collaborators.',
      upgradeRequired: 'RENEW_VAULT',
      currentLimit: entitlement.maxSeatsPerPlan,
    };
  }

  if (entitlement.maxSeatsPerPlan <= 1) {
    return {
      allowed: false,
      reason:
        'Solo plans include 1 founder seat. Upgrade to the Co-Founder & Pivot Pass (or stack a 2nd AppSumo code) to invite up to 3 Co-Founders and unlock the Blind-Reveal Co-Founder Alignment Interview.',
      upgradeRequired:
        entitlement.planType === 'APPSUMO_LTD'
          ? 'APPSUMO_STACK'
          : 'SIX_MONTH_COFOUNDER',
      currentLimit: entitlement.maxSeatsPerPlan,
    };
  }

  if (currentPlanSeatsUsed >= entitlement.maxSeatsPerPlan) {
    return {
      allowed: false,
      reason: `This plan has reached its maximum of ${entitlement.maxSeatsPerPlan} team seats.`,
      upgradeRequired:
        entitlement.planType === 'APPSUMO_LTD'
          ? 'APPSUMO_STACK'
          : 'SIX_MONTH_COFOUNDER',
      currentLimit: entitlement.maxSeatsPerPlan,
    };
  }

  return { allowed: true, currentLimit: entitlement.maxSeatsPerPlan };
}

/**
 * Checks if the user has available AI credits this month (or a valid BYOK API key configured).
 */
export function canConsumeAiCredits(
  entitlement: EntitlementSnapshot,
  estimatedCreditsCost = 1
): EntitlementCheckResult & { useByok: boolean; remainingCredits: number } {
  if (isEntitlementInVaultMode(entitlement)) {
    return {
      allowed: false,
      useByok: false,
      remainingCredits: 0,
      reason:
        'Your pass has expired and your workspace is in Read-Only Vault Mode. Renew your pass to re-enable Ask Preflight AI and editing.',
      upgradeRequired: 'RENEW_VAULT',
    };
  }

  const hasByok = Boolean(
    entitlement.customApiKeyEncrypted &&
      entitlement.customApiKeyEncrypted.trim().length > 0
  );

  if (hasByok) {
    return {
      allowed: true,
      useByok: true,
      remainingCredits: Math.max(
        0,
        entitlement.monthlyAiCreditsLimit - entitlement.aiCreditsUsedThisMonth
      ),
    };
  }

  const remaining =
    entitlement.monthlyAiCreditsLimit - entitlement.aiCreditsUsedThisMonth;

  if (remaining < estimatedCreditsCost) {
    return {
      allowed: false,
      useByok: false,
      remainingCredits: Math.max(0, remaining),
      reason:
        'You have used all of your monthly Preflight AI Credits. Stack an additional AppSumo code, add a $10 Credit Top-Up, or connect your own Gemini API key (BYOK on Tier 3).',
      upgradeRequired:
        entitlement.planType === 'APPSUMO_LTD'
          ? 'APPSUMO_STACK'
          : 'SIX_MONTH_COFOUNDER',
    };
  }

  return {
    allowed: true,
    useByok: false,
    remainingCredits: remaining,
  };
}

/**
 * Unified feature gate helper for UI components and Server Actions.
 */
export function checkFeatureEntitlement(
  entitlement: EntitlementSnapshot,
  feature: PaywallFeature,
  context?: {
    currentPlansCount?: number;
    currentSeatsCount?: number;
  }
): EntitlementCheckResult {
  switch (feature) {
    case 'MODULE_A_IDEATION':
      return { allowed: true };

    case 'MODULE_B_THROUGH_G':
    case 'MODULE_B_THROUGH_I':
    case 'PUBLIC_SURVEY_PUBLISH':
    case 'GRANT_MATCHER':
    case 'DOCUMENT_EXPORT':
      return canAccessModule(entitlement, 'MOD_B_MARKET');

    case 'MULTI_PLAN_CREATE':
    case 'CLONE_AND_PIVOT':
      return canCreateStartupPlan(
        entitlement,
        context?.currentPlansCount ?? 1
      );

    case 'IDEA_COMPARATOR':
      if (entitlement.maxStartupPlans < 2) {
        return {
          allowed: false,
          reason:
            'The Multi-Plan Idea Comparator requires a Multi-Plan tier (Co-Founder Pass or AppSumo Tier 2+).',
          upgradeRequired:
            entitlement.planType === 'APPSUMO_LTD'
              ? 'APPSUMO_STACK'
              : 'SIX_MONTH_COFOUNDER',
        };
      }
      return { allowed: true };

    case 'COFOUNDER_INVITE':
    case 'COFOUNDER_ALIGNMENT_INTERVIEW':
      return canInviteCollaborator(
        entitlement,
        context?.currentSeatsCount ?? 1
      );

    case 'WHITE_LABEL_EXPORT':
      if (!entitlement.whiteLabelExportEnabled) {
        return {
          allowed: false,
          reason:
            'Removing the "Powered by Startup Preflight" watermark requires AppSumo Tier 3 (3+ Stacked Codes).',
          upgradeRequired: 'APPSUMO_STACK',
        };
      }
      return { allowed: true };

    case 'BYOK_API_KEY':
      if (
        entitlement.planType !== 'APPSUMO_LTD' ||
        entitlement.stackedCodesCount < 3
      ) {
        return {
          allowed: false,
          reason:
            'Bring Your Own API Key (BYOK) is unlocked on AppSumo Tier 3 (3+ Stacked Codes).',
          upgradeRequired: 'APPSUMO_STACK',
        };
      }
      return { allowed: true };
  }
}
