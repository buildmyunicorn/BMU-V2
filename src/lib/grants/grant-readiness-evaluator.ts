import type { ActiveStartupPlan } from '@/lib/auth/session-store';
import { DETAILED_GRANT_PORTALS, type GrantPortalDetail } from './grant-directory';

export interface GrantReadinessChecklistItem {
  key: string;
  title: string;
  moduleCode:
    | 'MOD_A_IDEATION'
    | 'MOD_B_MARKET'
    | 'MOD_C_SURVEYS_FEEDBACK'
    | 'MOD_D_PRODUCT_BUILD'
    | 'MOD_E_OPERATIONS'
    | 'MOD_F_COFOUNDER_TEAM'
    | 'MOD_G_LAUNCHPAD'
    | 'MOD_H_REVENUE'
    | 'MOD_I_MARKETING'
    | 'MOD_J_FINANCE'
    | 'MOD_K_GRANTS_FUNDING'
    | 'MOD_L_BUSINESS_PLAN';
  stepNumber: number;
  isComplete: boolean;
  summary: string;
  actionPrompt: string;
  isExternalUpload?: boolean;
}

export interface EvaluatedGrantReadiness {
  grantSlug: string;
  grantDetail: GrantPortalDetail;
  items: GrantReadinessChecklistItem[];
  completedCount: number;
  totalCount: number;
  readinessPercentage: number;
  isReadyToSubmit: boolean;
  criticalMissingCount: number;
}

export function evaluatePlanGrantReadiness(
  plan: ActiveStartupPlan,
  grantSlug: string = 'ie-leo-feasibility'
): EvaluatedGrantReadiness {
  const detail =
    DETAILED_GRANT_PORTALS.find((g) => g.slug === grantSlug) ||
    DETAILED_GRANT_PORTALS[0];

  // 1. Concept Canvas (Module A Step 2)
  const hasConceptCanvas = Boolean(
    plan.conceptCanvas?.targetCustomer?.trim() &&
    plan.conceptCanvas?.proposedSolution?.trim()
  );

  // 2. Export / Non-Displacement (Module A Step 5 or Module B)
  const hasExportFocus =
    plan.exportPotential === 'EXPORTING_INTERNATIONALLY' ||
    Boolean(plan.moduleBData?.beachhead?.beachheadSegment?.trim()) ||
    Boolean(plan.moduleBData?.competitiveWedge?.competitiveEdgeSummary?.trim());

  // 3. Customer Validation Evidence (Module C)
  const surveys = plan.moduleCData?.surveys || [];
  const totalSurveyResponses = surveys.reduce(
    (acc, s) => acc + (s.responses?.length || 0),
    0
  );
  const totalInterviews = plan.moduleCData?.interviewLogs?.length || 0;
  const hasValidationProof = totalSurveyResponses >= 3 || totalInterviews >= 2;

  // 4. Technical Work Packages (Module D Step 5)
  const workPackagesCount =
    plan.moduleDData?.workPackagesAndFlow?.workPackages?.length || 0;
  const hasWorkPackages = workPackagesCount > 0;

  // 5. 3 Supplier Quotes (Module E Step 2)
  const equipmentItems =
    plan.moduleEData?.premisesAndEquipment?.equipmentItems || [];
  const quotesAttached = equipmentItems.some(
    (e) =>
      e.quoteComplianceStatus === 'THREE_QUOTES_UPLOADED_READY' ||
      e.quoteComplianceStatus === 'HAVE_3_WRITTEN_QUOTES' ||
      Boolean(e.supplierQuotesSummary?.trim()) ||
      Boolean(e.conciergeQuotesRequested)
  );
  const hasThreeQuotes = quotesAttached || equipmentItems.length === 0;

  // 6. Promoter Profiles & CVs (Module F Step 1)
  const promoterCount =
    plan.moduleFData?.promoterProfiles?.teamMembers?.length || 0;
  const hasPromoters = promoterCount > 0;

  // 7. Job Creation Schedule (Module F Step 5)
  const plannedHiresCount =
    plan.moduleFData?.step5HiringPlanData?.roles?.length || 0;
  const hasJobSchedule = plannedHiresCount > 0;

  // 8. Personal Survival Budget (Module F Step 3 - UK Start Up Loans requirement)
  const founderBudgets = plan.moduleFData?.step3SurvivalBudgetData?.founderBudgets || [];
  const personalExpensesTotal = founderBudgets.reduce(
    (acc, b) =>
      acc +
      (b.housingAndUtilities || 0) +
      (b.groceriesAndEssentials || 0) +
      (b.transportAndCommute || 0) +
      (b.debtAndLoanCommitments || 0),
    0
  );
  const hasPersonalSurvivalBudget = personalExpensesTotal > 0 || founderBudgets.length > 0;

  // 9. LTD Incorporated (Module G Launchpad Step 1 or Module J Step 4)
  const hasLtdIncorporated =
    plan.moduleGData?.step1?.state === 'ALREADY_HAVE' ||
    plan.moduleJData?.step4Statements?.corporateIpReadinessStatus ===
      'LTD_INCORPORATED_IP_ASSIGNED';

  // 10. Tax Clearance / Bank Account (Module G Launchpad Steps 3 & 5)
  const hasTaxClearance =
    plan.moduleGData?.step3?.state === 'ALREADY_HAVE' ||
    plan.moduleGData?.step5?.state === 'ALREADY_HAVE';

  // 11. 3-Year Financial Projections (Module J or Module H)
  const hasFinancialProjections = Boolean(
    plan.moduleJData?.step1OverheadsTax?.lastSavedAt ||
    plan.moduleHData?.step3BreakevenCalculator?.lastSavedAt
  );

  // 12. Co-Funding Proof / Capital Stack (Module K Step 2)
  const hasCoFundingProof = Boolean(
    plan.moduleKData?.step2CapitalStack?.lastSavedAt ||
    plan.teamAndBudget?.startingBudgetBracket
  );

  const allPossibleItems: Record<string, GrantReadinessChecklistItem> = {
    CONCEPT_CANVAS: {
      key: 'CONCEPT_CANVAS',
      title: '1-Page Concept Canvas & Solution Definition',
      moduleCode: 'MOD_A_IDEATION',
      stepNumber: 2,
      isComplete: hasConceptCanvas,
      summary: hasConceptCanvas
        ? `Canvas complete: "${plan.conceptCanvas?.proposedSolution?.slice(0, 48)}..."`
        : 'Target customer and proposed solution are not clearly defined yet.',
      actionPrompt: 'Open Module A Step 2 to finish your Concept Canvas',
    },
    EXPORT_NON_DISPLACEMENT: {
      key: 'EXPORT_NON_DISPLACEMENT',
      title: 'Export Focus & Non-Displacement Case',
      moduleCode: 'MOD_B_MARKET',
      stepNumber: 5,
      isComplete: hasExportFocus,
      summary: hasExportFocus
        ? 'Export potential verified; target market does not displace local domestic trade.'
        : 'Grant assessors will reject businesses that only compete with existing local retail.',
      actionPrompt: 'Open Module B Step 5 to articulate your export wedge',
    },
    CUSTOMER_VALIDATION: {
      key: 'CUSTOMER_VALIDATION',
      title: 'Primary Customer Proof (Surveys / Interviews)',
      moduleCode: 'MOD_C_SURVEYS_FEEDBACK',
      stepNumber: 4,
      isComplete: hasValidationProof,
      summary:
        totalSurveyResponses > 0 || totalInterviews > 0
          ? `${totalSurveyResponses} survey response(s) and ${totalInterviews} customer interview(s) logged.`
          : 'Evaluators want proof real customers will pay, not just founder opinions.',
      actionPrompt: 'Open Module C to share your survey link or log customer interviews',
    },
    WORK_PACKAGES: {
      key: 'WORK_PACKAGES',
      title: 'Technical Work Packages (WP1..n) & Build Plan',
      moduleCode: 'MOD_D_PRODUCT_BUILD',
      stepNumber: 5,
      isComplete: hasWorkPackages,
      summary: hasWorkPackages
        ? `${workPackagesCount} formal Work Packages defined with deliverables and milestones.`
        : 'R&D grants require engineering work to be split into measurable Work Packages.',
      actionPrompt: 'Open Module D Step 5 to define your Work Packages',
    },
    THREE_SUPPLIER_QUOTES: {
      key: 'THREE_SUPPLIER_QUOTES',
      title: 'Eligible Equipment & 3-Quote Procurement Rule',
      moduleCode: 'MOD_E_OPERATIONS',
      stepNumber: 2,
      isComplete: hasThreeQuotes,
      summary: hasThreeQuotes
        ? 'Equipment schedule audited; quotes attached or exemption verified.'
        : 'LEO / Innovate UK require 3 independent supplier quotes for capital items > €5k.',
      actionPrompt: 'Open Module E Step 2 to attach quotes or request via Concierge',
    },
    PROMOTER_PROFILES: {
      key: 'PROMOTER_PROFILES',
      title: 'Promoter Profiles (150-Word Bio & CVs)',
      moduleCode: 'MOD_F_COFOUNDER_TEAM',
      stepNumber: 1,
      isComplete: hasPromoters,
      summary: hasPromoters
        ? `${promoterCount} promoter profile(s) calibrated for grant committee assessment.`
        : 'Committees score heavily on founder track record and capability to deliver.',
      actionPrompt: 'Open Module F Step 1 to enter promoter profiles',
    },
    JOB_CREATION_SCHEDULE: {
      key: 'JOB_CREATION_SCHEDULE',
      title: '3-Year Job Creation Schedule',
      moduleCode: 'MOD_F_COFOUNDER_TEAM',
      stepNumber: 5,
      isComplete: hasJobSchedule,
      summary: hasJobSchedule
        ? `${plannedHiresCount} new jobs scheduled across Years 1 to 3.`
        : 'LEO Priming / Expansion grants are strictly calculated per full-time job created.',
      actionPrompt: 'Open Module F Step 5 to set your headcount roadmap',
    },
    PERSONAL_SURVIVAL_BUDGET: {
      key: 'PERSONAL_SURVIVAL_BUDGET',
      title: 'Personal Survival Budget',
      moduleCode: 'MOD_F_COFOUNDER_TEAM',
      stepNumber: 3,
      isComplete: hasPersonalSurvivalBudget,
      summary: hasPersonalSurvivalBudget
        ? `Survival budget verified at ${personalExpensesTotal}/month personal outlays.`
        : 'UK Start Up Loans loan underwriters require a verified personal survival budget.',
      actionPrompt: 'Open Module F Step 3 to fill your personal survival budget',
    },
    LTD_INCORPORATED: {
      key: 'LTD_INCORPORATED',
      title: 'Limited Company Registration (CRO / Companies House)',
      moduleCode: 'MOD_G_LAUNCHPAD',
      stepNumber: 1,
      isComplete: hasLtdIncorporated,
      summary: hasLtdIncorporated
        ? 'Limited Company (LTD) registered or in-progress.'
        : 'This grant requires a registered legal entity to sign the contract.',
      actionPrompt: 'Open Module G Launchpad Step 1 to record your CRO / Companies House status',
    },
    TAX_CLEARANCE_ETC: {
      key: 'TAX_CLEARANCE_ETC',
      title: 'Statutory Tax Clearance (eTC) & Bank Account',
      moduleCode: 'MOD_G_LAUNCHPAD',
      stepNumber: 3,
      isComplete: hasTaxClearance,
      summary: hasTaxClearance
        ? 'Business bank account and statutory compliance active.'
        : 'No grant can be drawn down without a verified Tax Clearance Access Number.',
      actionPrompt: 'Open Module G Launchpad to record your bank & tax clearance setup',
    },
    FINANCIAL_PROJECTIONS_3Y: {
      key: 'FINANCIAL_PROJECTIONS_3Y',
      title: '3-Year Integrated Financial Projections & Cashflow',
      moduleCode: 'MOD_J_FINANCE',
      stepNumber: 1,
      isComplete: hasFinancialProjections,
      summary: hasFinancialProjections
        ? '3-Year Profit & Loss, Balance Sheet, and Monthly Cashflow generated.'
        : 'Evaluators need to see your 36-month breakeven and cash trough.',
      actionPrompt: 'Open Module J to complete your 3-Year financial projections',
    },
    CO_FUNDING_PROOF: {
      key: 'CO_FUNDING_PROOF',
      title: 'Matching Co-Funding Cash Proof (50% / Match Ratio)',
      moduleCode: 'MOD_K_GRANTS_FUNDING',
      stepNumber: 2,
      isComplete: hasCoFundingProof,
      summary: hasCoFundingProof
        ? 'Co-funding capital stack mapped (founder savings, loan, or investment match).'
        : 'Grants only reimburse a percentage; you must prove you have matching cash in the bank.',
      actionPrompt: 'Open Module K Step 2 to verify your capital stack',
    },
  };

  const requiredKeys = detail.requiredPlanChecklistKeys;
  const items = requiredKeys
    .map((k) => allPossibleItems[k])
    .filter((item): item is GrantReadinessChecklistItem => Boolean(item));

  const completedCount = items.filter((i) => i.isComplete).length;
  const totalCount = items.length;
  const readinessPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
  const criticalMissingCount = totalCount - completedCount;

  return {
    grantSlug,
    grantDetail: detail,
    items,
    completedCount,
    totalCount,
    readinessPercentage,
    isReadyToSubmit: criticalMissingCount === 0,
    criticalMissingCount,
  };
}
