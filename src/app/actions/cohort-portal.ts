'use server';

import { eq, and, sql, inArray, desc } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  cohorts,
  cohortStaff,
  users,
  startupPlans,
  planModulesData,
  planCollaborators,
  validationSurveys,
  surveyResponses,
  openQuestionsParkingLot,
  emailLogs,
  type CohortMilestoneConfig,
} from '@/db';
import {
  getServerSessionCookie,
  getAdminSessionCookie,
} from '@/lib/auth/server-auth';
import { resend, EMAIL_DEFAULTS } from '@/lib/email/resend';
import {
  deduplicateSurveyResponses,
  type ActiveStartupPlan,
  type SavedConceptCanvas,
  type SavedFounderMotivation,
  type SavedTeamAndBudget,
  type SavedFounderRealityCheck,
  type SavedGrantEligibilityCheck,
  type SavedMasterDocumentData,
  type SavedModuleBData,
  type SavedModuleCData,
  type SavedModuleDData,
  type SavedModuleEData,
  type SavedModuleFData,
  type SavedModuleGData,
  type SavedModuleHData,
  type SavedModuleIData,
  type SavedModuleJData,
  type SavedModuleKData,
  type SavedModuleLData,
  type SavedValidationSurvey,
  type SavedSurveyResponse,
  type SavedCustomerInterviewLog,
  type SurveyQuestionItem,
  type SurveyAiInsightsSummary,
  type SurveyOutreachTemplates,
  type SurveyResponseAnswerValue,
  type IndustryCategory,
} from '@/lib/auth/session-store';
import {
  extractMasterDocumentVerifiedFacts,
  buildDeterministicMasterStory,
  sanitizeSurveyTerminologyForReader,
  type MasterDocumentVerifiedFacts,
} from '@/lib/export/master-document-brief';
import type { SupportedCountryCode } from '@/lib/localization';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CohortPortalStartup {
  id: string;
  name: string;
  category: string;
  founders: string;
  founderEmail: string;
  avatarBg: string;
  hqCountryCode: string;
  baseCurrency: string;
  grantFocus: string;
  targetGrantAmount: string;
  overallProgress: number; // 0-100%
  currentModuleName: string;
  surveyResponsesCount: number;
  willingnessToPay: string;
  status: 'GRANT_READY' | 'ON_TRACK' | 'VALIDATING' | 'NEEDS_ATTENTION' | 'MILESTONE_CLAIMED';
  statusBadge: {
    label: string;
    bg: string;
    dot: string;
  };
  oneLiner: string;
  keyMetric: string;
  coFounderScore: number;
  coFounderStatus: string;
  mentorFlag?: string;
  mentorNotes?: string;
  modulesBreakdown: {
    ideation: number; // Mod A-B
    surveys: number; // Mod C
    product: number; // Mod D-E
    team: number; // Mod F
    financials: number; // Mod H-J
    grantPack: number; // Mod K-L
  };
  milestoneStatus: 'IN_PROGRESS' | 'ELIGIBLE_TO_CLAIM' | 'CLAIMED_PARTNER_NOTIFIED' | 'REWARD_ACTIVATED';
  milestoneClaimedAt?: string | null;
  verifiedDomain?: string | null;
  verifiedWorkEmail?: string | null;
  claimDossier?: any;
  createdAt: string;
}

export interface CohortPortalData {
  cohort: {
    id: string;
    name: string;
    organizationName: string;
    partnerLogoUrl?: string | null;
    intakeType: 'FIXED_BATCH' | 'ROLLING';
    inviteCode: string;
    maxSeats: number;
    seatsUsed: number;
    accessDurationMonths: number;
    milestoneConfig?: CohortMilestoneConfig;
    createdAt: string;
  };
  staff: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
  }>;
  startups: CohortPortalStartup[];
  aggregates: {
    totalStartups: number;
    averageBatchProgress: number;
    grantReadyCount: number;
    customerSignalsTotal: number;
    milestoneClaimsPendingCount: number;
    milestoneClaimsApprovedCount: number;
    attentionNeededCount: number;
  };
  sampleStartups?: CohortPortalStartup[];
  isSampleData?: boolean;
}

// Sample fallback batch data (from the NovaUCD & Tangent mockup)
const SAMPLE_STARTUPS: CohortPortalStartup[] = [
  {
    id: 'sample-startup-1',
    name: 'AeroThermal Bio',
    category: 'MedTech / BioTech',
    founders: 'Dr. Liam O’Connor & Sarah Chen',
    founderEmail: 'liam@aerothermalbio.com',
    avatarBg: 'bg-indigo-600',
    hqCountryCode: 'IE',
    baseCurrency: 'EUR',
    grantFocus: 'Enterprise Ireland PSSF (€100k)',
    targetGrantAmount: '€100,000',
    overallProgress: 92,
    currentModuleName: 'Mod K: Non-Dilutive Grant Hub',
    surveyResponsesCount: 142,
    willingnessToPay: '€1,200/mo Hospital Lab SLA',
    status: 'GRANT_READY',
    statusBadge: {
      label: 'Grant-Ready (PSSF Matched)',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
    },
    oneLiner:
      'Continuous sterile cryogenic sample transport monitored via low-power satellite IoT.',
    keyMetric: '3 LOIs Signed / €140k Seed Secured',
    coFounderScore: 96,
    coFounderStatus: 'High Alignment (48-Mo Vesting Active)',
    mentorFlag: 'Ready for Enterprise Ireland technical evaluation review.',
    mentorNotes: 'Excellent progress. Clinical trial protocol appendices attached to Module L.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 100,
      product: 95,
      team: 96,
      financials: 88,
      grantPack: 92,
    },
    milestoneStatus: 'REWARD_ACTIVATED',
    milestoneClaimedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    verifiedDomain: 'aerothermalbio.com',
    verifiedWorkEmail: 'liam@aerothermalbio.com',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'sample-startup-2',
    name: 'Dockside Automation',
    category: 'Robotics / Logistics',
    founders: 'Cian Murphy & Declan Foley',
    founderEmail: 'cian@docksideauto.ie',
    avatarBg: 'bg-emerald-600',
    hqCountryCode: 'IE',
    baseCurrency: 'EUR',
    grantFocus: 'LEO Priming Grant (€50k 50% Match)',
    targetGrantAmount: '€50,000',
    overallProgress: 100,
    currentModuleName: 'Mod L: LEO Official Form Complete',
    surveyResponsesCount: 68,
    willingnessToPay: '€450/terminal/mo Enterprise',
    status: 'GRANT_READY',
    statusBadge: {
      label: 'Pre-Flight Audit Passed (100%)',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
    },
    oneLiner:
      'Autonomous micro-forklifts for cross-dock warehouse pallet consolidation.',
    keyMetric: '€184k Projected Y1 Revenue / €42k Funding Gap',
    coFounderScore: 100,
    coFounderStatus: 'Perfect Alignment',
    mentorFlag: 'Official LEO Feasibility/Priming pack compiled with non-displacement certification.',
    mentorNotes: 'All 3 equipment quotes verified. Ready for LEO evaluation committee.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 100,
      product: 100,
      team: 100,
      financials: 100,
      grantPack: 100,
    },
    milestoneStatus: 'CLAIMED_PARTNER_NOTIFIED',
    milestoneClaimedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    verifiedDomain: 'docksideauto.ie',
    verifiedWorkEmail: 'cian@docksideauto.ie',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'sample-startup-3',
    name: 'Verdant Power Tiles',
    category: 'CleanTech / Manufacturing',
    founders: 'Marcus Vance & Tom Sterling',
    founderEmail: 'marcus@verdanttiles.co.uk',
    avatarBg: 'bg-violet-600',
    hqCountryCode: 'GB',
    baseCurrency: 'GBP',
    grantFocus: 'Innovate UK Smart Grant (£150k)',
    targetGrantAmount: '£150,000',
    overallProgress: 68,
    currentModuleName: 'Mod H: Pocket Profit Breakeven Model',
    surveyResponsesCount: 84,
    willingnessToPay: '£85/sqm Contractor Target',
    status: 'ON_TRACK',
    statusBadge: {
      label: 'On Track (Financial Modeling)',
      bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      dot: 'bg-indigo-500',
    },
    oneLiner:
      'Building-integrated photovoltaic solar roof tiles engineered for UK building safety codes.',
    keyMetric: 'UK NIC, Pension & Corporation Tax Modeled',
    coFounderScore: 88,
    coFounderStatus: 'Strong Alignment (Minor runway variance)',
    mentorFlag: 'Currently stress-testing Worst-Case & Survival Ramen cashflow in Module H sandbox.',
    mentorNotes: 'Encouraged founders to check capital depreciation schedule in Module E.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 90,
      product: 80,
      team: 88,
      financials: 65,
      grantPack: 30,
    },
    milestoneStatus: 'ELIGIBLE_TO_CLAIM',
    verifiedDomain: 'verdanttiles.co.uk',
    verifiedWorkEmail: 'marcus@verdanttiles.co.uk',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'sample-startup-4',
    name: 'CareLoop Health',
    category: 'Digital Health / Elder Care',
    founders: 'Sophie Ward & Tariq Al-Mansoor',
    founderEmail: 'sophie@careloophealth.com',
    avatarBg: 'bg-amber-600',
    hqCountryCode: 'GB',
    baseCurrency: 'GBP',
    grantFocus: 'British Business Bank Start Up Loans (£50k)',
    targetGrantAmount: '£50,000',
    overallProgress: 44,
    currentModuleName: 'Mod F: Blind Co-Founder Alignment',
    surveyResponsesCount: 310,
    willingnessToPay: '£19/mo Family B2C',
    status: 'NEEDS_ATTENTION',
    statusBadge: {
      label: 'Attention: Co-Founder Equity Gap',
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      dot: 'bg-amber-500',
    },
    oneLiner:
      'Family caregiver coordination platform for medication tracking and live vitals monitoring.',
    keyMetric: '310 Waitlist Signups (/v/careloop)',
    coFounderScore: 54,
    coFounderStatus: 'Equity & Time Commitment Discrepancy',
    mentorFlag: 'Sophie submitted 65/35 equity split; Tariq submitted 50/50. Mentor mediation scheduled.',
    mentorNotes: 'Facilitating 1-on-1 alignment meeting next Tuesday.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 85,
      product: 60,
      team: 54,
      financials: 15,
      grantPack: 10,
    },
    milestoneStatus: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'sample-startup-5',
    name: 'KiteCommerce API',
    category: 'B2B SaaS / FinTech',
    founders: 'Niall Brogan (Solo Founder)',
    founderEmail: 'niall@kitecommerce.io',
    avatarBg: 'bg-blue-600',
    hqCountryCode: 'IE',
    baseCurrency: 'EUR',
    grantFocus: 'LEO Feasibility Study Grant (€15k)',
    targetGrantAmount: '€15,000',
    overallProgress: 35,
    currentModuleName: 'Mod C: Mom Test Survey Builder',
    surveyResponsesCount: 22,
    willingnessToPay: 'Exploring €49 vs €99/mo',
    status: 'VALIDATING',
    statusBadge: {
      label: 'In Validation (Drafting Survey)',
      bg: 'bg-blue-100 text-blue-800 border-blue-300',
      dot: 'bg-blue-500',
    },
    oneLiner:
      'Unified multi-currency checkout orchestrator with automatic VAT OSS compliance.',
    keyMetric: 'Survival Budget: €2,200/mo Baseline',
    coFounderScore: 100,
    coFounderStatus: 'Solo Founder Model Complete',
    mentorFlag: 'Needs 3 formal developer quotes to satisfy LEO feasibility criteria (Module D Concierge).',
    modulesBreakdown: {
      ideation: 95,
      surveys: 45,
      product: 30,
      team: 85,
      financials: 20,
      grantPack: 5,
    },
    milestoneStatus: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

/**
 * Fetch Cohort Portal Data for Lead Directors & Mentors
 */
export async function getCohortPortalDataAction(cohortIdOrCode: string): Promise<{
  success: boolean;
  data?: CohortPortalData;
  error?: string;
  isAuthorized?: boolean;
}> {
  try {
    await ensureDatabaseSchemaSynced();

    const founderSession = await getServerSessionCookie();
    const adminSession = await getAdminSessionCookie();
    const isSuperAdmin =
      Boolean(adminSession && adminSession.role === 'SUPER_ADMIN') ||
      founderSession?.userId === 'super-admin-root' ||
      founderSession?.userId === 'super-admin-local';

    const cleanInput = (cohortIdOrCode || '').trim();

    // 1. Locate Cohort by UUID or Invite Code
    let cohortRecord: any = null;
    if (UUID_REGEX.test(cleanInput)) {
      const [found] = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.id, cleanInput))
        .limit(1);
      cohortRecord = found;
    }

    if (!cohortRecord) {
      const [found] = await db
        .select()
        .from(cohorts)
        .where(sql`LOWER(${cohorts.inviteCode}) = ${cleanInput.toLowerCase()}`)
        .limit(1);
      cohortRecord = found;
    }

    // Demo Mode handling
    if (!cohortRecord && cleanInput.toLowerCase() === 'demo') {
      cohortRecord = {
        id: 'demo-cohort-novaucd',
        name: 'NovaUCD & Tangent Venture Batch 2027',
        organizationName: 'NovaUCD & Trinity Tangent',
        partnerLogoUrl: null,
        intakeType: 'FIXED_BATCH',
        inviteCode: 'BMU-UCD-2027',
        maxSeats: 30,
        seatsUsed: 24,
        accessDurationMonths: 6,
        milestoneConfigJson: {
          milestoneGateName: 'Google for Startups Cloud & Grant Acceleration',
          requiredProgressPercent: 65,
          requiredModules: ['MOD_A_IDEATION', 'MOD_B_MARKET', 'MOD_C_SURVEYS', 'MOD_D_PRODUCT', 'MOD_F_TEAM'],
          requireOfficialDomain: true,
          requireWorkEmail: true,
          rewardLabel: '$25,000 Google Cloud Credits & Partner Perks',
          partnerNotificationEmails: ['programs@novaucd.ie'],
        },
        createdAt: new Date().toISOString(),
      };
    }

    if (!cohortRecord) {
      return {
        success: false,
        error: `Institutional cohort "${cleanInput}" could not be found.`,
      };
    }

    // 2. Fetch Cohort Staff
    let staffRecords: any[] = [];
    if (UUID_REGEX.test(cohortRecord.id)) {
      staffRecords = await db
        .select({
          id: cohortStaff.id,
          name: cohortStaff.name,
          email: cohortStaff.email,
          role: cohortStaff.role,
        })
        .from(cohortStaff)
        .where(eq(cohortStaff.cohortId, cohortRecord.id));
    }

    // Check Authorization:
    // If Super Admin, always allowed.
    // If Founder Session, check if their email or userId matches staff.
    let isStaffMember = false;
    if (founderSession?.email) {
      const lowerSessionEmail = founderSession.email.toLowerCase();
      isStaffMember = staffRecords.some(
        (s) => s.email && s.email.toLowerCase() === lowerSessionEmail
      );
    }

    // In production, strictly enforce director/mentor or super-admin role
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !isSuperAdmin && !isStaffMember) {
      return {
        success: false,
        error: 'Unauthorized: Access restricted to assigned institutional cohort staff, directors, and administrators.',
        isAuthorized: false,
      };
    }

    const isAuthorized = isSuperAdmin || isStaffMember || !isProduction;

    // 3. Fetch Enrolled Startup Plans
    let startupList: CohortPortalStartup[] = [];

    if (UUID_REGEX.test(cohortRecord.id)) {
      // Find plans linked directly to cohortId
      const plans = await db
        .select({
          plan: startupPlans,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(startupPlans)
        .leftJoin(users, eq(startupPlans.ownerUserId, users.id))
        .where(eq(startupPlans.cohortId, cohortRecord.id))
        .orderBy(desc(startupPlans.createdAt));

      // Also find users with cohortId whose plans might not have had cohortId backfilled
      const cohortUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.cohortId, cohortRecord.id));

      const existingPlanIds = new Set(plans.map((p) => p.plan.id));
      const orphanUserIds = cohortUsers
        .map((u) => u.id)
        .filter((uid) => !plans.some((p) => p.user?.id === uid));

      if (orphanUserIds.length > 0) {
        const orphanPlans = await db
          .select({
            plan: startupPlans,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(startupPlans)
          .leftJoin(users, eq(startupPlans.ownerUserId, users.id))
          .where(inArray(startupPlans.ownerUserId, orphanUserIds));

        for (const op of orphanPlans) {
          if (!existingPlanIds.has(op.plan.id)) {
            plans.push(op);
            existingPlanIds.add(op.plan.id);
          }
        }
      }

      // Populate rich startup telemetry for each enrolled plan
      for (const item of plans) {
        const p = item.plan;
        const u = item.user;

        // Fetch Module Progress for this plan
        const moduleRows = await db
          .select({
            moduleCode: planModulesData.moduleCode,
            completionPercentage: planModulesData.completionPercentage,
          })
          .from(planModulesData)
          .where(eq(planModulesData.planId, p.id));

        const modMap = new Map<string, number>();
        moduleRows.forEach((r) => modMap.set(r.moduleCode, r.completionPercentage || 0));

        // Group into 6 Milestones
        const ideationScore = Math.round(
          ((modMap.get('MOD_A_IDEATION') || 0) + (modMap.get('MOD_B_MARKET') || 0)) / 2
        );
        const surveysScore = modMap.get('MOD_C_SURVEYS_FEEDBACK') || 0;
        const productScore = Math.round(
          ((modMap.get('MOD_D_PRODUCT_BUILD') || 0) + (modMap.get('MOD_E_OPERATIONS') || 0)) / 2
        );
        const teamScore = modMap.get('MOD_F_COFOUNDER_TEAM') || 0;
        const financialsScore = Math.round(
          ((modMap.get('MOD_H_REVENUE') || 0) + (modMap.get('MOD_J_FINANCE') || 0)) / 2
        );
        const grantScore = Math.round(
          ((modMap.get('MOD_K_GRANTS_FUNDING') || 0) + (modMap.get('MOD_L_BUSINESS_PLAN') || 0)) / 2
        );

        // Overall progress
        const overallProgress = Math.min(
          100,
          Math.round(
            (ideationScore + surveysScore + productScore + teamScore + financialsScore + grantScore) / 6
          )
        );

        // Survey Responses Count
        const [survey] = await db
          .select({ id: validationSurveys.id })
          .from(validationSurveys)
          .where(eq(validationSurveys.planId, p.id))
          .limit(1);

        let surveyCount = 0;
        if (survey) {
          const countRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(surveyResponses)
            .where(eq(surveyResponses.surveyId, survey.id));
          surveyCount = Number(countRes[0]?.count || 0);
        }

        // Collaborators & Co-Founder Alignment
        const collabs = await db
          .select()
          .from(planCollaborators)
          .where(eq(planCollaborators.planId, p.id));

        let coFounderScore = 100;
        let coFounderStatus = 'Solo Founder Model Complete';
        if (collabs.length > 0) {
          const completedCount = collabs.filter((c) => c.alignmentInterviewCompleted).length;
          if (completedCount === collabs.length) {
            coFounderScore = 95;
            coFounderStatus = 'All Founders Completed Blind Alignment';
          } else {
            coFounderScore = 60;
            coFounderStatus = `${completedCount}/${collabs.length} Alignment Surveys Submitted`;
          }
        }

        // Target Grant
        const grantMeta = p.grantComplianceMetadataJson || {};
        const targetGrantStr =
          grantMeta.selectedTargetGrants && grantMeta.selectedTargetGrants.length > 0
            ? grantMeta.selectedTargetGrants[0].replace(/_/g, ' ')
            : p.hqCountryCode === 'GB'
              ? 'Innovate UK Smart Grant / Start Up Loans'
              : 'LEO Feasibility / Priming Grant';

        // Milestone Status
        const mStatus = (p.cohortMilestoneStatus as any) || 'IN_PROGRESS';
        const claimData = p.cohortMilestoneClaimDataJson as any;

        // Categorize Startup Status
        let status: CohortPortalStartup['status'] = 'VALIDATING';
        let statusBadge = {
          label: 'In Validation',
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
        };

        if (mStatus === 'REWARD_ACTIVATED') {
          status = 'MILESTONE_CLAIMED';
          statusBadge = {
            label: 'Milestone Activated 🎁',
            bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            dot: 'bg-emerald-500',
          };
        } else if (mStatus === 'CLAIMED_PARTNER_NOTIFIED') {
          status = 'MILESTONE_CLAIMED';
          statusBadge = {
            label: 'Claim Under Review ⚡',
            bg: 'bg-amber-100 text-amber-900 border-amber-300',
            dot: 'bg-amber-500',
          };
        } else if (overallProgress >= 85) {
          status = 'GRANT_READY';
          statusBadge = {
            label: 'Grant-Ready (Audited)',
            bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            dot: 'bg-emerald-500',
          };
        } else if (coFounderScore < 65) {
          status = 'NEEDS_ATTENTION';
          statusBadge = {
            label: 'Attention: Co-Founder Alignment',
            bg: 'bg-amber-100 text-amber-900 border-amber-300',
            dot: 'bg-amber-500',
          };
        } else if (overallProgress >= 40) {
          status = 'ON_TRACK';
          statusBadge = {
            label: 'On Track (Executing)',
            bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
            dot: 'bg-indigo-500',
          };
        }

        // Color avatar by plan name hash
        const colorPalette = [
          'bg-indigo-600',
          'bg-emerald-600',
          'bg-violet-600',
          'bg-blue-600',
          'bg-teal-600',
          'bg-rose-600',
        ];
        const hash = (p.title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const avatarBg = colorPalette[hash % colorPalette.length];

        startupList.push({
          id: p.id,
          name: p.title || 'Untitled Startup',
          category: p.industryCategory || 'Technology / General',
          founders: u?.name || 'Founder',
          founderEmail: u?.email || '',
          avatarBg,
          hqCountryCode: p.hqCountryCode || 'IE',
          baseCurrency: p.baseCurrency || 'EUR',
          grantFocus: targetGrantStr,
          targetGrantAmount: p.hqCountryCode === 'GB' ? '£50,000' : '€50,000',
          overallProgress,
          currentModuleName: p.currentModuleStep || 'Mod A: Concept Canvas',
          surveyResponsesCount: surveyCount,
          willingnessToPay: surveyCount > 0 ? `${surveyCount} verified leads` : 'Gathering signals',
          status,
          statusBadge,
          oneLiner: p.oneLinerSummary || 'Building next-generation solution.',
          keyMetric: `${overallProgress}% Milestone Velocity`,
          coFounderScore,
          coFounderStatus,
          mentorFlag: claimData?.mentorFlag || undefined,
          mentorNotes: claimData?.mentorNotes || undefined,
          modulesBreakdown: {
            ideation: ideationScore,
            surveys: surveysScore,
            product: productScore,
            team: teamScore,
            financials: financialsScore,
            grantPack: grantScore,
          },
          milestoneStatus: mStatus,
          milestoneClaimedAt: p.cohortMilestoneClaimedAt ? p.cohortMilestoneClaimedAt.toISOString() : null,
          verifiedDomain: p.verifiedCohortDomain,
          verifiedWorkEmail: p.verifiedCohortWorkEmail,
          claimDossier: claimData,
          createdAt: p.createdAt.toISOString(),
        });
      }
    }

    // Only use SAMPLE_STARTUPS for the explicit Demo route (/cohort-portal/demo)
    const isDemo = cleanInput.toLowerCase() === 'demo' || cohortRecord.id === 'demo-cohort-novaucd';
    const isSampleData = isDemo;
    const finalStartups = isDemo ? SAMPLE_STARTUPS : startupList;

    // 4. Compute Aggregate Metrics
    const totalCount = finalStartups.length;
    const avgProgress = totalCount > 0
      ? Math.round(finalStartups.reduce((sum, s) => sum + s.overallProgress, 0) / totalCount)
      : 0;
    const grantReadyCount = finalStartups.filter((s) => s.overallProgress >= 80).length;
    const customerSignalsTotal = finalStartups.reduce((sum, s) => sum + s.surveyResponsesCount, 0);
    const milestoneClaimsPendingCount = finalStartups.filter(
      (s) => s.milestoneStatus === 'CLAIMED_PARTNER_NOTIFIED'
    ).length;
    const milestoneClaimsApprovedCount = finalStartups.filter(
      (s) => s.milestoneStatus === 'REWARD_ACTIVATED'
    ).length;
    const attentionNeededCount = finalStartups.filter(
      (s) => s.status === 'NEEDS_ATTENTION'
    ).length;

    return {
      success: true,
      isAuthorized,
      data: {
        cohort: {
          id: cohortRecord.id,
          name: cohortRecord.name,
          organizationName: cohortRecord.organizationName || 'Accelerator Partner',
          partnerLogoUrl: cohortRecord.partnerLogoUrl,
          intakeType: (cohortRecord.intakeType as any) || 'FIXED_BATCH',
          inviteCode: cohortRecord.inviteCode,
          maxSeats: cohortRecord.maxSeats,
          seatsUsed: cohortRecord.seatsUsed || startupList.length,
          accessDurationMonths: cohortRecord.accessDurationMonths || 6,
          milestoneConfig: cohortRecord.milestoneConfigJson || undefined,
          createdAt: cohortRecord.createdAt ? new Date(cohortRecord.createdAt).toISOString() : new Date().toISOString(),
        },
        staff: staffRecords,
        startups: finalStartups,
        sampleStartups: SAMPLE_STARTUPS,
        aggregates: {
          totalStartups: totalCount,
          averageBatchProgress: avgProgress,
          grantReadyCount,
          customerSignalsTotal,
          milestoneClaimsPendingCount,
          milestoneClaimsApprovedCount,
          attentionNeededCount,
        },
        isSampleData,
      },
    };
  } catch (error: any) {
    console.error('[getCohortPortalDataAction] Error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to retrieve cohort portal data.',
    };
  }
}

/**
 * Save Mentor Intelligence Note for a Startup in the Cohort
 */
export async function updateCohortStartupMentorNoteAction(params: {
  planId: string;
  mentorNote: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { planId, mentorNote } = params;
    if (!planId) return { success: false, error: 'Missing plan ID' };

    await ensureDatabaseSchemaSynced();

    const founderSession = await getServerSessionCookie();
    const adminSession = await getAdminSessionCookie();
    if (!founderSession && !adminSession) {
      return { success: false, error: 'Unauthorized session.' };
    }

    if (planId.startsWith('sample-') || !UUID_REGEX.test(planId)) {
      // Local preview mutation
      return { success: true };
    }

    const [plan] = await db
      .select({
        id: startupPlans.id,
        cohortId: startupPlans.cohortId,
        cohortMilestoneClaimDataJson: startupPlans.cohortMilestoneClaimDataJson,
      })
      .from(startupPlans)
      .where(eq(startupPlans.id, planId))
      .limit(1);

    if (!plan) return { success: false, error: 'Startup plan not found' };

    // Verify caller is Super Admin OR an assigned Director/Mentor for this cohort
    const isSuperAdmin =
      Boolean(adminSession && adminSession.role === 'SUPER_ADMIN') ||
      founderSession?.userId === 'super-admin-root' ||
      founderSession?.userId === 'super-admin-local';

    if (!isSuperAdmin) {
      if (!plan.cohortId) {
        return {
          success: false,
          error: 'Unauthorized: Startup plan is not assigned to an institutional cohort.',
        };
      }

      const staffCheck = await db
        .select({ id: cohortStaff.id })
        .from(cohortStaff)
        .where(
          and(
            eq(cohortStaff.cohortId, plan.cohortId),
            founderSession?.email
              ? sql`LOWER(${cohortStaff.email}) = ${founderSession.email.toLowerCase().trim()}`
              : eq(cohortStaff.userId, founderSession?.userId || '')
          )
        )
        .limit(1);

      if (staffCheck.length === 0) {
        return {
          success: false,
          error: 'Unauthorized: Only assigned cohort directors and mentors can update notes for this startup.',
        };
      }
    }

    const currentData = (plan.cohortMilestoneClaimDataJson as any) || {};
    const updatedData = {
      ...currentData,
      mentorNotes: mentorNote.trim(),
      mentorNotesUpdatedAt: new Date().toISOString(),
    };

    await db
      .update(startupPlans)
      .set({
        cohortMilestoneClaimDataJson: updatedData,
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, planId));

    return { success: true };
  } catch (error: any) {
    console.error('[updateCohortStartupMentorNoteAction] Error:', error);
    return { success: false, error: error?.message || 'Failed to save mentor note.' };
  }
}

/**
 * Review & Activate Milestone Reward for a Startup (e.g. Google Cloud Credits, Grant Voucher)
 */
export async function reviewCohortMilestoneClaimAction(params: {
  planId: string;
  decision: 'APPROVE' | 'REQUEST_INFO';
  approvalNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { planId, decision, approvalNotes } = params;
    if (!planId) return { success: false, error: 'Missing plan ID' };

    await ensureDatabaseSchemaSynced();

    const founderSession = await getServerSessionCookie();
    const adminSession = await getAdminSessionCookie();
    if (!founderSession && !adminSession) {
      return { success: false, error: 'Unauthorized session.' };
    }

    if (planId.startsWith('sample-') || !UUID_REGEX.test(planId)) {
      // Local preview mutation
      return { success: true };
    }

    const [plan] = await db
      .select({
        id: startupPlans.id,
        title: startupPlans.title,
        cohortId: startupPlans.cohortId,
        verifiedCohortWorkEmail: startupPlans.verifiedCohortWorkEmail,
        verifiedCohortDomain: startupPlans.verifiedCohortDomain,
        cohortMilestoneClaimDataJson: startupPlans.cohortMilestoneClaimDataJson,
      })
      .from(startupPlans)
      .where(eq(startupPlans.id, planId))
      .limit(1);

    if (!plan) return { success: false, error: 'Startup plan not found.' };

    // Verify caller is Super Admin OR an assigned Director/Mentor for this cohort
    const isSuperAdmin =
      Boolean(adminSession && adminSession.role === 'SUPER_ADMIN') ||
      founderSession?.userId === 'super-admin-root' ||
      founderSession?.userId === 'super-admin-local';

    if (!isSuperAdmin) {
      if (!plan.cohortId) {
        return {
          success: false,
          error: 'Unauthorized: Startup plan is not assigned to an institutional cohort.',
        };
      }

      const staffCheck = await db
        .select({ id: cohortStaff.id })
        .from(cohortStaff)
        .where(
          and(
            eq(cohortStaff.cohortId, plan.cohortId),
            founderSession?.email
              ? sql`LOWER(${cohortStaff.email}) = ${founderSession.email.toLowerCase().trim()}`
              : eq(cohortStaff.userId, founderSession?.userId || '')
          )
        )
        .limit(1);

      if (staffCheck.length === 0) {
        return {
          success: false,
          error: 'Unauthorized: Only assigned cohort directors and mentors can review or approve milestone claims.',
        };
      }
    }

    const currentData = (plan.cohortMilestoneClaimDataJson as any) || {};
    const newStatus = decision === 'APPROVE' ? 'REWARD_ACTIVATED' : 'IN_PROGRESS';

    const updatedData = {
      ...currentData,
      reviewDecision: decision,
      reviewNotes: approvalNotes || '',
      reviewedAt: new Date().toISOString(),
    };

    await db
      .update(startupPlans)
      .set({
        cohortMilestoneStatus: newStatus,
        cohortMilestoneClaimDataJson: updatedData,
        updatedAt: new Date(),
      })
      .where(eq(startupPlans.id, planId));

    // If approved, notify founder via email
    if (decision === 'APPROVE' && plan.verifiedCohortWorkEmail && resend) {
      try {
        const rewardLabel = currentData?.rewardTier?.label || 'Milestone Acceleration Perk';
        await resend.emails.send({
          from: EMAIL_DEFAULTS.notificationsFrom,
          to: [plan.verifiedCohortWorkEmail],
          subject: `🎉 Congratulations! Your ${rewardLabel} has been approved!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
              <h2 style="color: #4f46e5; margin-top: 0;">Milestone Reward Activated!</h2>
              <p>Hi team <strong>${plan.title}</strong>,</p>
              <p>Great news! Your program directors have reviewed and approved your Milestone Acceleration Claim for <strong>${rewardLabel}</strong>.</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Verified Domain:</strong> ${plan.verifiedCohortDomain || 'Registered Domain'}</p>
                <p style="margin: 8px 0 0; font-size: 14px;"><strong>Status:</strong> Approved &amp; Active</p>
                ${approvalNotes ? `<p style="margin: 8px 0 0; font-size: 14px;"><strong>Director Note:</strong> ${approvalNotes}</p>` : ''}
              </div>
              <p>You can view your activation dossier inside your Startup Preflight workspace at any time.</p>
              <p style="margin-top: 32px; font-size: 12px; color: #64748b;">Startup Preflight Cohort Operations Team</p>
            </div>
          `,
        });

        await db.insert(emailLogs).values({
          recipient: plan.verifiedCohortWorkEmail,
          fromEmail: EMAIL_DEFAULTS.notificationsFrom,
          subject: `Milestone Reward Approved: ${plan.title}`,
          template: 'COHORT_MILESTONE_APPROVED',
          status: 'SENT',
        });
      } catch (mailErr) {
        console.warn('[reviewCohortMilestoneClaimAction] Non-fatal email dispatch warning:', mailErr);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('[reviewCohortMilestoneClaimAction] Error:', error);
    return { success: false, error: error?.message || 'Failed to update milestone review.' };
  }
}

// ==========================================
// 8. MASTER DOCUMENT FOR COHORT DIRECTORS & VENTURE SWITCHER
// ==========================================

export interface CohortFounderPlanSummary {
  id: string;
  title: string;
  oneLiner: string;
  overallProgress: number;
  isCurrent: boolean;
  isPivot: boolean;
  createdAt: string;
}

export interface CohortStartupMasterDocumentData {
  cohort: {
    id: string;
    name: string;
    organizationName: string | null;
    partnerLogoUrl: string | null;
    inviteCode: string;
    milestoneConfig?: CohortMilestoneConfig;
  };
  startup: CohortPortalStartup;
  founderPlans: CohortFounderPlanSummary[];
  plan: ActiveStartupPlan;
  facts: MasterDocumentVerifiedFacts;
  story: SavedMasterDocumentData;
  founderName: string;
  founderEmail: string;
  mentorNotes?: string;
}

/**
 * Hydrates an ActiveStartupPlan and owner details from PostgreSQL for Master Document rendering
 */
async function hydratePlanFromDb(planId: string): Promise<{
  plan: ActiveStartupPlan;
  ownerUser: { id: string; name: string; email: string };
  moduleProgressMap: Map<string, number>;
} | null> {
  const [plan] = await db
    .select()
    .from(startupPlans)
    .where(eq(startupPlans.id, planId))
    .limit(1);

  if (!plan) return null;

  const [dbUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, plan.ownerUserId))
    .limit(1);

  const modRows = await db
    .select()
    .from(planModulesData)
    .where(eq(planModulesData.planId, plan.id));

  const modMap = new Map<string, number>();
  modRows.forEach((r) => modMap.set(r.moduleCode, r.completionPercentage || 0));

  const modA = modRows.find((m) => m.moduleCode === 'MOD_A_IDEATION');
  const modB = modRows.find((m) => m.moduleCode === 'MOD_B_MARKET');
  const modC = modRows.find((m) => m.moduleCode === 'MOD_C_SURVEYS_FEEDBACK');
  const modD = modRows.find((m) => m.moduleCode === 'MOD_D_PRODUCT_BUILD');
  const modE = modRows.find((m) => m.moduleCode === 'MOD_E_OPERATIONS');
  const modF = modRows.find((m) => m.moduleCode === 'MOD_F_COFOUNDER_TEAM');
  const modG = modRows.find((m) => m.moduleCode === 'MOD_G_LAUNCHPAD');
  const modH = modRows.find((m) => m.moduleCode === 'MOD_H_REVENUE');
  const modI = modRows.find((m) => m.moduleCode === 'MOD_I_MARKETING');
  const modJ = modRows.find((m) => m.moduleCode === 'MOD_J_FINANCE');
  const modK = modRows.find((m) => m.moduleCode === 'MOD_K_GRANTS_FUNDING');
  const modL = modRows.find(
    (m) =>
      m.moduleCode === 'MOD_L_BUSINESS_PLAN' ||
      (m.moduleCode as string) === 'MOD_K_BUSINESS_PLAN'
  );

  const structuredInputs = (modA?.structuredInputsJsonb ?? {}) as {
    brainDumpText?: string;
    exportPotential?: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
    conceptCanvas?: SavedConceptCanvas;
    founderMotivation?: SavedFounderMotivation;
    teamAndBudget?: SavedTeamAndBudget;
    founderRealityCheck?: SavedFounderRealityCheck;
    grantEligibilityCheck?: SavedGrantEligibilityCheck;
    masterDocumentData?: SavedMasterDocumentData;
  };

  const modBInputs = (modB?.structuredInputsJsonb ?? {}) as SavedModuleBData;
  const modCInputs = (modC?.structuredInputsJsonb ?? {}) as SavedModuleCData;
  const modDInputs = (modD?.structuredInputsJsonb ?? {}) as SavedModuleDData;
  const modEInputs = (modE?.structuredInputsJsonb ?? {}) as SavedModuleEData;
  const modFInputs = (modF?.structuredInputsJsonb ?? {}) as SavedModuleFData;
  const modGInputs = (modG?.structuredInputsJsonb ?? {}) as SavedModuleGData;
  const modHInputs = (modH?.structuredInputsJsonb ?? {}) as SavedModuleHData;
  const modIInputs = (modI?.structuredInputsJsonb ?? {}) as SavedModuleIData;
  const modJInputs = (modJ?.structuredInputsJsonb ?? {}) as SavedModuleJData;
  const modKInputs = (modK?.structuredInputsJsonb ?? {}) as SavedModuleKData;
  const modLInputs = (modL?.structuredInputsJsonb ?? {}) as SavedModuleLData & {
    masterDocumentData?: SavedMasterDocumentData;
  };

  // Merge surveys from validation_surveys table
  const mergedSurveysBySlug = new Map<string, SavedValidationSurvey>();
  for (const s of modCInputs.surveys || []) {
    if (s.publicSlug) mergedSurveysBySlug.set(s.publicSlug, s);
  }

  try {
    const dbSurveys = await db
      .select()
      .from(validationSurveys)
      .where(eq(validationSurveys.planId, plan.id));

    for (const row of dbSurveys) {
      const dbRespRows = await db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, row.id))
        .orderBy(desc(surveyResponses.submittedAt));

      const mappedDbResponses: Array<SavedSurveyResponse & { clientResponseId?: string }> = dbRespRows.map((r) => {
        const rawAns = (r.answersJsonb || {}) as any;
        const answersMap = rawAns.answers && typeof rawAns.answers === 'object' ? rawAns.answers : rawAns;
        return {
          id: r.id,
          surveyId: r.surveyId,
          answers: answersMap,
          respondentNameOrRole: typeof rawAns.respondentNameOrRole === 'string' ? rawAns.respondentNameOrRole : undefined,
          respondentEmail: r.respondentEmail || undefined,
          joinedWaitlist: r.joinedWaitlist,
          isSimulated: Boolean(rawAns.isSimulated),
          submittedAt: r.submittedAt.toISOString(),
          clientResponseId: typeof rawAns.clientResponseId === 'string' ? rawAns.clientResponseId : undefined,
        };
      });

      const existingInMod = mergedSurveysBySlug.get(row.publicSlug);
      const dbQuestions = (row.questionsJsonb || []) as SurveyQuestionItem[];
      const chosenQuestions =
        (existingInMod?.questions?.length || 0) >= dbQuestions.length && (existingInMod?.questions?.length || 0) > 0
          ? existingInMod!.questions
          : dbQuestions;

      const mergedResponses = deduplicateSurveyResponses([
        ...mappedDbResponses,
        ...(existingInMod?.responses || []),
      ]);

      mergedSurveysBySlug.set(row.publicSlug, {
        id: existingInMod?.id || row.id,
        planId: row.planId,
        publicSlug: row.publicSlug,
        title: row.title || 'Validation Survey',
        introDescription: existingInMod?.introDescription || row.introDescription || '',
        isActive: row.isActive,
        isPublished: true,
        collectLeadEmails: row.collectLeadEmails,
        waitlistIncentiveText: existingInMod?.waitlistIncentiveText || row.waitlistIncentiveText || '',
        focusAreas: existingInMod?.focusAreas || ['PROBLEM_AND_PAIN', 'CURRENT_WORKAROUNDS'],
        otherFocusAreaText: existingInMod?.otherFocusAreaText || '',
        customAiFocusPrompt: existingInMod?.customAiFocusPrompt || '',
        questions: chosenQuestions,
        responses: mergedResponses,
        outreachTemplates: existingInMod?.outreachTemplates,
        interviewLogs: existingInMod?.interviewLogs || [],
        aiInsightsSummary: existingInMod?.aiInsightsSummary,
        createdAt: existingInMod?.createdAt || row.createdAt.toISOString(),
        updatedAt: existingInMod?.updatedAt || row.createdAt.toISOString(),
      });
    }
  } catch (err) {
    console.warn('[hydratePlanFromDb] Error reading validation surveys:', err);
  }

  const finalSurveys = Array.from(mergedSurveysBySlug.values());
  const finalInterviews = modCInputs.interviewLogs || [];

  let questionRows: Array<typeof openQuestionsParkingLot.$inferSelect> = [];
  try {
    questionRows = await db
      .select()
      .from(openQuestionsParkingLot)
      .where(eq(openQuestionsParkingLot.planId, plan.id));
  } catch {
    // Non-fatal
  }

  const targetMarkets = Array.isArray(plan.targetMarketsArray)
    ? plan.targetMarketsArray
    : [plan.hqCountryCode];

  const activeStartupPlan: ActiveStartupPlan = {
    id: plan.id,
    title: plan.title,
    oneLinerSummary: plan.oneLinerSummary || '',
    industryCategory: (plan.industryCategory as IndustryCategory) || 'B2B SaaS / AI App',
    hqCountryCode: (plan.hqCountryCode as SupportedCountryCode) || 'IE',
    baseCurrency: plan.baseCurrency || 'EUR',
    targetMarketsArray: targetMarkets,
    exportPotential:
      structuredInputs.exportPotential ||
      (targetMarkets.length > 1 ? 'EXPORTING_INTERNATIONALLY' : 'DOMESTIC_ONLY'),
    fundingTrackMode:
      (plan.grantComplianceMetadataJson as any)?.fundingTrackMode ||
      (plan.hqCountryCode === 'IE' || plan.hqCountryCode === 'GB' ? 'GRANT_AND_INVESTOR' : 'COMMERCIAL_ONLY'),
    currentModuleStep: plan.currentModuleStep || 'MOD_A_STEP_1',
    isPivot: Boolean(plan.parentPlanId),
    brainDumpText: structuredInputs.brainDumpText || plan.oneLinerSummary || '',
    conceptCanvas: structuredInputs.conceptCanvas,
    founderMotivation: structuredInputs.founderMotivation,
    teamAndBudget: structuredInputs.teamAndBudget,
    founderRealityCheck: structuredInputs.founderRealityCheck,
    grantEligibilityCheck: structuredInputs.grantEligibilityCheck,
    thingsToConsider: Array.isArray(modA?.aiThingsToConsiderJsonb) ? modA.aiThingsToConsiderJsonb : undefined,
    moduleBData: modB ? { ...modBInputs, thingsToConsider: modB.aiThingsToConsiderJsonb as any } : undefined,
    moduleCData: {
      ...modCInputs,
      surveys: finalSurveys,
      interviewLogs: finalInterviews,
      thingsToConsider: modC?.aiThingsToConsiderJsonb as any,
    },
    moduleDData: modD ? { ...modDInputs, thingsToConsider: modD.aiThingsToConsiderJsonb as any } : undefined,
    moduleEData: modE ? { ...modEInputs, thingsToConsider: modE.aiThingsToConsiderJsonb as any } : undefined,
    moduleFData: modF ? { ...modFInputs, thingsToConsider: modF.aiThingsToConsiderJsonb as any } : undefined,
    moduleGData: modG ? { ...modGInputs, thingsToConsider: modG.aiThingsToConsiderJsonb as any } : undefined,
    moduleHData: modH ? { ...modHInputs, thingsToConsider: modH.aiThingsToConsiderJsonb as any } : undefined,
    moduleIData: modI ? { ...modIInputs, thingsToConsider: modI.aiThingsToConsiderJsonb as any } : undefined,
    moduleJData: modJ ? { ...modJInputs, thingsToConsider: modJ.aiThingsToConsiderJsonb as any } : undefined,
    moduleKData: modK ? { ...modKInputs, thingsToConsider: modK.aiThingsToConsiderJsonb as any } : undefined,
    moduleLData: modL ? { ...modLInputs, thingsToConsider: modL.aiThingsToConsiderJsonb as any } : undefined,
    masterDocumentData: modLInputs.masterDocumentData || structuredInputs.masterDocumentData,
    openQuestions: questionRows.map((q) => q.questionText),
  };

  return {
    plan: activeStartupPlan,
    ownerUser: dbUser || { id: plan.ownerUserId, name: 'Anonymous Founder', email: '' },
    moduleProgressMap: modMap,
  };
}

/**
 * Builds demo Master Document facts and story for sample preview startups
 */
function buildDemoStartupMasterDoc(sample: CohortPortalStartup, isPivot: boolean = false): {
  plan: ActiveStartupPlan;
  facts: MasterDocumentVerifiedFacts;
  story: SavedMasterDocumentData;
} {
  const planTitle = isPivot ? `${sample.name} (Modular Diagnostics)` : sample.name;
  const oneLiner = isPivot
    ? `Modular plug-and-play cold-chain telemetry unit for hospital pathology labs and point-of-care transport.`
    : sample.oneLiner;

  const mockPlan: any = {
    id: isPivot ? `${sample.id}-pivot` : sample.id,
    title: planTitle,
    oneLinerSummary: oneLiner,
    industryCategory: 'B2B SaaS / AI App' as IndustryCategory,
    hqCountryCode: (sample.hqCountryCode as SupportedCountryCode) || 'IE',
    baseCurrency: sample.baseCurrency || 'EUR',
    targetMarketsArray: [sample.hqCountryCode, 'GB', 'DE'],
    exportPotential: 'EXPORTING_INTERNATIONALLY',
    fundingTrackMode: 'GRANT_AND_INVESTOR',
    currentModuleStep: 'MOD_L_STEP_5',
    isPivot,
    brainDumpText: oneLiner,
    conceptCanvas: {
      coreProblem: `Temperature excursions during specialized clinical specimen logistics cause an estimated 18% biological sample loss across Europe.`,
      targetCustomer: `Clinical Logistics Directors at Phase II/III biopharmaceutical sponsors and university biobanks.`,
      proposedSolution: `Satellite IoT connected smart cryoshippers with active thermal monitoring and automated chain-of-custody compliance.`,
      unfairAdvantage: `Patented phase-change composite container providing 144hr continuous hold-time with zero hazardous dry ice.`,
      revenueAndGrantFit: `€1,200/mo hardware-enabled subscription per fleet container + ${sample.grantFocus}.`,
    },
    founderMotivation: {
      primaryMotivation: 'SCALE_STARTUP',
      weeklyHoursAvailable: '40_PLUS_HRS',
      twelveMonthSuccessVision: 'Commercial fleet of 50 active shippers with certified ISO-13485 audit trail.',
    },
    teamAndBudget: {
      teamStructureType: 'COFOUNDER_TEAM',
      skillCoverage: 'BUILD_IN_HOUSE',
      startingBudgetBracket: '5K_TO_25K',
    },
    founderRealityCheck: {
      industryConnection: 'DIRECT_EXPERIENCE',
      personalIncomeUrgency: 'COMFORTABLE_12_PLUS_MONTHS',
      dealbreakers: [],
      growthTradeoff: 'MAXIMUM_GROWTH_OUTSIDE_INVESTMENT',
      biggestWorryPreset: 'WILL_THEY_PAY',
      biggestWorryNotes: 'Ensuring enterprise hospital procurement cycles can be compressed via pre-approved trial SLAs.',
    },
    moduleBData: {
      beachhead: {
        beachheadSegment: 'Phase II/III Biopharmaceutical Clinical Trial Logistics Managers in Ireland and the UK',
        urgencyDrivers: ['High monetary value per patient sample', 'Zero margin for temperature excursions'],
        whyNow: 'Accelerating volume of cell and gene therapies requiring cryogenic transport.',
      },
      competitorsAndStatusQuo: {
        competitors: [
          {
            id: 'c-1',
            name: 'Legacy Styrofoam + Dry Ice Boxes',
            type: 'DIRECT',
            advantageVsUs: 'Low upfront unit cost, ubiquitous courier availability.',
            disadvantageVsUs: 'Zero real-time telemetry, 48hr limit, classified as dangerous goods on airlines.',
            ourWedgeVsThem: '144hr hold-time with continuous satellite IoT GPS and temperature telemetry without dry ice.',
          },
          {
            id: 'c-2',
            name: 'CryoPort Systems',
            type: 'DIRECT',
            advantageVsUs: 'Established enterprise life sciences brand.',
            disadvantageVsUs: 'Extremely expensive (€3,500/trip), cumbersome booking portal, heavy legacy dewars.',
            ourWedgeVsThem: 'Modern lightweight composite dewar at 40% lower cost with plug-and-play SaaS dashboard.',
          },
        ],
      },
      swot: {
        strengths: ['Patented phase-change composite insulation', 'Full-stack IoT and firmware IP', 'University research spin-out pedigree'],
        weaknesses: ['Hardware capital requirements before volume production', 'Need ISO-13485 medical packaging audit'],
        opportunities: ['Rapid growth of mRNA and personalized cell therapies requiring -80°C transit', 'Enterprise Ireland PSSF match funding'],
        threats: ['Global supply chain delays on semiconductor microcontrollers', 'Legacy courier inertia'],
      },
      marketSizing: {
        som: 12240000,
        sam: 480000000,
        tam: 2400000000,
        somSummary: 'Capturing 850 biotech fleet containers across Ireland and the UK within 36 months.',
        targetCustomerCount: 850,
        averageAnnualSpend: 14400,
        widerMarketMultiplier: 'MEDIUM_5X',
      },
    },
    moduleCData: {
      surveys: [
        {
          id: 'survey-demo-1',
          planId: sample.id,
          publicSlug: 'aerothermal-validation',
          title: 'Clinical Sample Cold-Chain Reliability Survey',
          introDescription: 'Evaluating temperature failure rates in European clinical trial logistics.',
          isActive: true,
          isPublished: true,
          collectLeadEmails: true,
          waitlistIncentiveText: 'Priority pilot access to 5 demo cryoshipper units',
          focusAreas: ['PROBLEM_AND_PAIN', 'CURRENT_WORKAROUNDS'],
          questions: [],
          responses: Array.from({ length: sample.surveyResponsesCount }).map((_, i) => ({
            id: `resp-${i}`,
            surveyId: 'survey-demo-1',
            answers: {
              feedback: {
                value: sample.willingnessToPay,
              },
            },
            respondentNameOrRole: i % 3 === 0 ? 'Clinical Logistics Director' : 'Biobank Operations Lead',
            joinedWaitlist: i % 2 === 0,
            isSimulated: false,
            submittedAt: new Date(Date.now() - (i + 1) * 3600000 * 4).toISOString(),
          })),
          interviewLogs: [
            {
              id: 'int-1',
              intervieweeRoleOrName: 'Dr. Helen Ward (Director of Biobanking, St. James Hospital)',
              channel: 'IN_PERSON_1_ON_1',
              signal: 'STRONG_POSITIVE_PULL',
              willingnessToPay: 'CONFIRMED_HIGH',
              commitmentObtained: 'SIGNED_LOI_OR_PILOT',
              goldenQuote: 'We spend €30,000 on each patient sample; losing one because dry ice melted in transit is completely unacceptable.',
              rawNotes: 'Helen confirmed they lost 3 critical clinical trial samples last winter due to unexpected flight delays. Stated they would pay €1,200/mo without question if it guaranteed real-time temperature telemetry and 120+ hours hold time.',
              createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            },
          ],
        },
      ],
      interviewLogs: [],
    },
    moduleDData: {
      vehicleAndChannel: {
        vehicleType: 'HYBRID_HARDWARE_SOFTWARE',
        formFactor: 'DEVICE_PLUS_COMPANION_APP',
        prototypeApproach: 'CUSTOM_HARDWARE_AND_APP',
        targetLaunchTimeline: '3_TO_6_MONTHS',
        salesChannel: 'B2B_DIRECT',
        channelOwnershipModel: 'FULLY_OWNED_DIRECT',
        channelRationaleNarrative: 'Direct enterprise sales to hospital procurement and biobanks.',
      },
      buildVsBuy: {
        selectedTier: 'TIER_3_CUSTOM_FULL_STACK',
        decisionRationale: 'Proprietary IoT firmware and thermal container design require custom engineering.',
        v1TechStackSummary: 'Next.js, Node.js microservices, AWS IoT Core, custom embedded C firmware.',
      },
    },
    moduleEData: {
      operationsBlueprint: {
        fulfillmentMode: 'CONTRACT_MANUFACTURED_3PL',
        orderTurnaroundSla: 'SAME_OR_NEXT_DAY_24_48H',
        endToEndFulfillmentNarrative: 'Contract manufactured composite shells assembled in Shannon, provisioned via automated cloud testing, and dispatched via express courier.',
        premisesMode: 'SHARED_COWORKING_INCUBATOR_HUB',
      },
    },
    moduleFData: {
      promoterProfiles: {
        executiveTeamCapabilityNarrative: 'Dr. Liam O’Connor (PhD Cryogenics, 10 yrs sensor R&D) and Sarah Chen (ex-Almac Clinical Trial Operations Lead).',
        promoters: [
          {
            id: 'p-1',
            name: 'Dr. Liam O’Connor',
            roleTitle: 'CTO & Co-Founder',
            bio150Words: 'Holds a PhD in Cryogenic Engineering from UCD with 8 patents in passive thermal insulation.',
          },
          {
            id: 'p-2',
            name: 'Sarah Chen',
            roleTitle: 'CEO & Co-Founder',
            bio150Words: 'Former Clinical Trial Logistics Lead with 12 years managing international sample transit across Europe.',
          },
        ],
      },
      step2RoleMatrixData: {
        hatAssignments: [
          { hatId: 'PRODUCT_ARCHITECTURE', owner: 'Dr. Liam O’Connor' },
          { hatId: 'COMMERCIAL_SALES', owner: 'Sarah Chen' },
        ],
      },
      step3SurvivalBudgetData: {
        founderBudgets: [
          { founderName: 'Dr. Liam O’Connor', monthlySurvivalAmount: 3500 },
          { founderName: 'Sarah Chen', monthlySurvivalAmount: 3500 },
        ],
      },
      step4CoFounderAgreementData: {
        equitySplitProposal: {
          splitSummary: '50/50 with 48-month vesting and 12-month cliff.',
        },
      },
    },
    moduleGData: {
      completionPercentage: 85,
      step1: { registeredEntityName: `${sample.name} Ltd`, croOrCompaniesHouseNumber: 'IE-748921', isRegistered: true },
      step2: { officialDomainName: sample.verifiedDomain || 'aerothermalbio.com', officialBusinessEmail: sample.verifiedWorkEmail || 'liam@aerothermalbio.com' },
      step3: { hasBusinessBankAccount: true, bankProviderName: 'Bank of Ireland' },
      step4: { hasBookkeepingSystem: true, bookkeepingPlatform: 'Xero' },
      step5: { hasStatutoryInsurance: true, insuranceTypes: ['PUBLIC_LIABILITY', 'PRODUCT_LIABILITY'] },
      step6: { hasBaselineGdprAndIpAssignments: true },
    },
    moduleHData: {
      step1RevenueModel: {
        primaryPricingModel: 'MONTHLY_RECURRING_SUBSCRIPTION',
        revenueStrategyNarrative: 'Subscription hardware-enabled SLA at €1,200/month per active fleet dewar.',
      },
      step2PricingTiers: {
        tiers: [
          {
            id: 'tier-1',
            name: 'Clinical Pilot Fleet',
            headlinePrice: 1200,
            billingFrequency: 'MONTHLY',
            cogsDirectUnitCost: 320,
          },
        ],
      },
      step3BreakevenCalculator: {
        monthlyBreakevenUnits: 18,
        breakevenNarrative: 'Requires 18 active containers in circulation to cover fixed overheads and founders survival draw.',
      },
    },
    moduleIData: {
      step1Positioning: {
        elevatorHook140: 'Continuous cryogenic sample telemetry with 144hr hold-time and zero dry ice hazard.',
      },
      step3First10: {
        first10StrategyNarrative: 'Converting 3 LOIs from Trinity Biobank and St. James Hospital into founding commercial pilots.',
      },
    },
    moduleJData: {
      step3CashflowGap: {
        fundingGapAmount: 85000,
        cashTroughMonth: 7,
        runwayMonths: 18,
      },
    },
    moduleKData: {
      step1Audit: {
        selectedGrantKey: sample.hqCountryCode === 'GB' ? 'INNOVATE_UK_SMART_GRANT' : 'ENTERPRISE_IRELAND_PSSF',
        overallReadinessScore: 92,
      },
    },
    moduleLData: {
      step1Mode: {
        compilerMode: sample.hqCountryCode === 'GB' ? 'UK_INNOVATE_UK_IFS' : 'IE_LEO_OFFICIAL_APPLICATION',
      },
    },
  };

  const facts = extractMasterDocumentVerifiedFacts({
    plan: mockPlan,
    founderName: sample.founders,
    brainDumpText: oneLiner,
    conceptCanvas: mockPlan.conceptCanvas!,
    founderMotivation: mockPlan.founderMotivation!,
    teamAndBudget: mockPlan.teamAndBudget!,
    founderRealityCheck: mockPlan.founderRealityCheck!,
    moduleABlindSpots: [],
  });

  const story = buildDeterministicMasterStory(facts);

  return { plan: mockPlan, facts, story };
}

/**
 * Fetch Cohort Startup Master Document Data for Lead Directors & Mentors
 * Supports Venture Switcher across all plans owned by the founder in this cohort.
 */
export async function getCohortStartupMasterDocumentAction(params: {
  cohortIdOrCode: string;
  planId: string;
}): Promise<{
  success: boolean;
  data?: CohortStartupMasterDocumentData;
  error?: string;
  isAuthorized?: boolean;
}> {
  try {
    const { cohortIdOrCode, planId } = params;
    if (!cohortIdOrCode || !planId) {
      return { success: false, error: 'Missing cohort or plan ID.' };
    }

    await ensureDatabaseSchemaSynced();

    const founderSession = await getServerSessionCookie();
    const adminSession = await getAdminSessionCookie();
    const isSuperAdmin =
      Boolean(adminSession && adminSession.role === 'SUPER_ADMIN') ||
      founderSession?.userId === 'super-admin-root' ||
      founderSession?.userId === 'super-admin-local';

    const cleanCohort = cohortIdOrCode.trim();

    // 1. Locate Cohort Record
    let cohortRecord: any = null;
    if (UUID_REGEX.test(cleanCohort)) {
      const [found] = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.id, cleanCohort))
        .limit(1);
      cohortRecord = found;
    }

    if (!cohortRecord) {
      const [found] = await db
        .select()
        .from(cohorts)
        .where(sql`LOWER(${cohorts.inviteCode}) = ${cleanCohort.toLowerCase()}`)
        .limit(1);
      cohortRecord = found;
    }

    // Demo Mode handling
    if (!cohortRecord && cleanCohort.toLowerCase() === 'demo') {
      cohortRecord = {
        id: 'demo-cohort-novaucd',
        name: 'NovaUCD & Tangent Venture Batch 2027',
        organizationName: 'NovaUCD & Trinity Tangent',
        partnerLogoUrl: null,
        inviteCode: 'BMU-UCD-2027',
        milestoneConfigJson: {
          milestoneGateName: 'Google for Startups Cloud & Grant Acceleration',
          requiredProgressPercent: 65,
          rewardLabel: '$25,000 Google Cloud Credits & Partner Perks',
        },
      };
    }

    if (!cohortRecord) {
      return {
        success: false,
        error: `Institutional cohort "${cleanCohort}" could not be found.`,
      };
    }

    // 2. Authorization Verification
    let staffRecords: any[] = [];
    if (UUID_REGEX.test(cohortRecord.id)) {
      staffRecords = await db
        .select({
          id: cohortStaff.id,
          name: cohortStaff.name,
          email: cohortStaff.email,
          role: cohortStaff.role,
        })
        .from(cohortStaff)
        .where(eq(cohortStaff.cohortId, cohortRecord.id));
    }

    let isStaffMember = false;
    if (founderSession?.email) {
      const lowerSessionEmail = founderSession.email.toLowerCase();
      isStaffMember = staffRecords.some(
        (s) => s.email && s.email.toLowerCase() === lowerSessionEmail
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !isSuperAdmin && !isStaffMember && cleanCohort.toLowerCase() !== 'demo') {
      return {
        success: false,
        error: 'Unauthorized: Access restricted to assigned institutional cohort directors and mentors.',
        isAuthorized: false,
      };
    }

    // 3. Demo / Mock Preview Path
    if (cleanCohort.toLowerCase() === 'demo' || planId.startsWith('sample-')) {
      const cleanPlanId = planId.replace(/-pivot$/, '');
      const sample = SAMPLE_STARTUPS.find((s) => s.id === cleanPlanId) || SAMPLE_STARTUPS[0];
      const isPivotSelected = planId.endsWith('-pivot');

      const demoData = buildDemoStartupMasterDoc(sample, isPivotSelected);

      const founderPlans: CohortFounderPlanSummary[] = [
        {
          id: sample.id,
          title: sample.name,
          oneLiner: sample.oneLiner,
          overallProgress: sample.overallProgress,
          isCurrent: !isPivotSelected,
          isPivot: false,
          createdAt: sample.createdAt,
        },
        {
          id: `${sample.id}-pivot`,
          title: `${sample.name} (Modular Diagnostics)`,
          oneLiner: `Modular plug-and-play cold-chain telemetry unit for hospital pathology labs.`,
          overallProgress: 48,
          isCurrent: isPivotSelected,
          isPivot: true,
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
      ];

      return {
        success: true,
        data: {
          cohort: {
            id: cohortRecord.id,
            name: cohortRecord.name,
            organizationName: cohortRecord.organizationName,
            partnerLogoUrl: cohortRecord.partnerLogoUrl,
            inviteCode: cohortRecord.inviteCode,
            milestoneConfig: cohortRecord.milestoneConfigJson,
          },
          startup: {
            ...sample,
            id: isPivotSelected ? `${sample.id}-pivot` : sample.id,
            name: isPivotSelected ? `${sample.name} (Modular Diagnostics)` : sample.name,
            overallProgress: isPivotSelected ? 48 : sample.overallProgress,
          },
          founderPlans,
          plan: demoData.plan,
          facts: demoData.facts,
          story: demoData.story,
          founderName: sample.founders,
          founderEmail: sample.founderEmail,
          mentorNotes: sample.mentorNotes,
        },
      };
    }

    // 4. Real Database Path
    const hydrated = await hydratePlanFromDb(planId);
    if (!hydrated) {
      return { success: false, error: 'Startup plan could not be found.' };
    }

    const { plan: activePlan, ownerUser, moduleProgressMap } = hydrated;

    // Fetch all plans owned by this founder in this cohort (or across their account) for the Venture Switcher
    const allFounderPlans = await db
      .select({
        id: startupPlans.id,
        title: startupPlans.title,
        oneLinerSummary: startupPlans.oneLinerSummary,
        cohortId: startupPlans.cohortId,
        parentPlanId: startupPlans.parentPlanId,
        createdAt: startupPlans.createdAt,
      })
      .from(startupPlans)
      .where(eq(startupPlans.ownerUserId, ownerUser.id))
      .orderBy(desc(startupPlans.createdAt));

    // Filter to plans associated with this cohort (or all if user enrolled in cohort)
    const cohortFounderPlans = allFounderPlans.filter(
      (p) => p.cohortId === cohortRecord.id || !p.cohortId || p.id === planId
    );

    // Compute progress for each founder plan
    const founderPlans: CohortFounderPlanSummary[] = [];
    for (const fp of cohortFounderPlans) {
      if (fp.id === planId) {
        // Use already calculated progress
        const ideation = Math.round(((moduleProgressMap.get('MOD_A_IDEATION') || 0) + (moduleProgressMap.get('MOD_B_MARKET') || 0)) / 2);
        const surveys = moduleProgressMap.get('MOD_C_SURVEYS_FEEDBACK') || 0;
        const product = Math.round(((moduleProgressMap.get('MOD_D_PRODUCT_BUILD') || 0) + (moduleProgressMap.get('MOD_E_OPERATIONS') || 0)) / 2);
        const team = moduleProgressMap.get('MOD_F_COFOUNDER_TEAM') || 0;
        const financials = Math.round(((moduleProgressMap.get('MOD_H_REVENUE') || 0) + (moduleProgressMap.get('MOD_J_FINANCE') || 0)) / 2);
        const grants = Math.round(((moduleProgressMap.get('MOD_K_GRANTS_FUNDING') || 0) + (moduleProgressMap.get('MOD_L_BUSINESS_PLAN') || 0)) / 2);
        const overall = Math.min(100, Math.round((ideation + surveys + product + team + financials + grants) / 6));

        founderPlans.push({
          id: fp.id,
          title: fp.title,
          oneLiner: fp.oneLinerSummary || '',
          overallProgress: overall,
          isCurrent: true,
          isPivot: Boolean(fp.parentPlanId),
          createdAt: fp.createdAt.toISOString(),
        });
      } else {
        const fpModRows = await db
          .select({
            moduleCode: planModulesData.moduleCode,
            completionPercentage: planModulesData.completionPercentage,
          })
          .from(planModulesData)
          .where(eq(planModulesData.planId, fp.id));

        const subMap = new Map<string, number>();
        fpModRows.forEach((r) => subMap.set(r.moduleCode, r.completionPercentage || 0));

        const subIdeation = Math.round(((subMap.get('MOD_A_IDEATION') || 0) + (subMap.get('MOD_B_MARKET') || 0)) / 2);
        const subSurveys = subMap.get('MOD_C_SURVEYS_FEEDBACK') || 0;
        const subProduct = Math.round(((subMap.get('MOD_D_PRODUCT_BUILD') || 0) + (subMap.get('MOD_E_OPERATIONS') || 0)) / 2);
        const subTeam = subMap.get('MOD_F_COFOUNDER_TEAM') || 0;
        const subFin = Math.round(((subMap.get('MOD_H_REVENUE') || 0) + (subMap.get('MOD_J_FINANCE') || 0)) / 2);
        const subGrants = Math.round(((subMap.get('MOD_K_GRANTS_FUNDING') || 0) + (subMap.get('MOD_L_BUSINESS_PLAN') || 0)) / 2);
        const subOverall = Math.min(100, Math.round((subIdeation + subSurveys + subProduct + subTeam + subFin + subGrants) / 6));

        founderPlans.push({
          id: fp.id,
          title: fp.title,
          oneLiner: fp.oneLinerSummary || '',
          overallProgress: subOverall,
          isCurrent: false,
          isPivot: Boolean(fp.parentPlanId),
          createdAt: fp.createdAt.toISOString(),
        });
      }
    }

    // Extract facts and build story
    const facts = extractMasterDocumentVerifiedFacts({
      plan: activePlan,
      founderName: ownerUser.name || 'Founder',
      brainDumpText: activePlan.brainDumpText || '',
      conceptCanvas: activePlan.conceptCanvas || {
        coreProblem: '',
        targetCustomer: '',
        proposedSolution: '',
        unfairAdvantage: '',
        revenueAndGrantFit: '',
      },
      founderMotivation: activePlan.founderMotivation || {
        primaryMotivation: 'SCALE_STARTUP',
        weeklyHoursAvailable: '40_PLUS_HRS',
        twelveMonthSuccessVision: 'Commercial launch and grant-assisted expansion.',
      },
      teamAndBudget: activePlan.teamAndBudget || {
        teamStructureType: 'SOLO_FOUNDER',
        skillCoverage: 'BUILD_IN_HOUSE',
        startingBudgetBracket: 'UNDER_1K',
        teamAndFundingNotes: '',
      },
      founderRealityCheck: activePlan.founderRealityCheck || {
        industryConnection: 'LIVED_IT_INSIDER',
        personalIncomeUrgency: 'NO_RUSH_12M_PLUS',
        dealbreakers: [],
        growthTradeoff: 'BOOTSTRAP_100_CONTROL',
        biggestWorryPreset: 'WILL_THEY_PAY',
        biggestWorryNotes: '',
      },
      moduleABlindSpots: activePlan.thingsToConsider || [],
    });

    const deterministicStory = buildDeterministicMasterStory(facts);
    const effectiveStory: SavedMasterDocumentData = activePlan.masterDocumentData?.paragraph1OpportunityAndMarket
      ? {
          ...deterministicStory,
          ...activePlan.masterDocumentData,
          paragraph1OpportunityAndMarket: sanitizeSurveyTerminologyForReader(
            activePlan.masterDocumentData.paragraph1OpportunityAndMarket
          ),
          paragraph2ValidationAndProduct: sanitizeSurveyTerminologyForReader(
            activePlan.masterDocumentData.paragraph2ValidationAndProduct
          ),
          paragraph3OperationsAndExecution: sanitizeSurveyTerminologyForReader(
            activePlan.masterDocumentData.paragraph3OperationsAndExecution
          ),
        }
      : deterministicStory;

    // Build the CohortPortalStartup representation
    const currentPlanProgress = founderPlans.find((p) => p.isCurrent)?.overallProgress || 50;

    const [dbPlanRaw] = await db
      .select({
        cohortMilestoneStatus: startupPlans.cohortMilestoneStatus,
        cohortMilestoneClaimedAt: startupPlans.cohortMilestoneClaimedAt,
        verifiedCohortDomain: startupPlans.verifiedCohortDomain,
        verifiedCohortWorkEmail: startupPlans.verifiedCohortWorkEmail,
        cohortMilestoneClaimDataJson: startupPlans.cohortMilestoneClaimDataJson,
      })
      .from(startupPlans)
      .where(eq(startupPlans.id, planId))
      .limit(1);

    const mStatus = (dbPlanRaw?.cohortMilestoneStatus as any) || 'IN_PROGRESS';
    const claimData = (dbPlanRaw?.cohortMilestoneClaimDataJson as any) || {};

    const startupSummary: CohortPortalStartup = {
      id: activePlan.id,
      name: activePlan.title,
      category: activePlan.industryCategory,
      founders: ownerUser.name,
      founderEmail: ownerUser.email,
      avatarBg: 'bg-indigo-600',
      hqCountryCode: activePlan.hqCountryCode,
      baseCurrency: activePlan.baseCurrency,
      grantFocus: activePlan.hqCountryCode === 'GB' ? 'Innovate UK Smart Grant' : 'LEO Feasibility / Priming',
      targetGrantAmount: activePlan.hqCountryCode === 'GB' ? '£100,000' : '€50,000',
      overallProgress: currentPlanProgress,
      currentModuleName: activePlan.currentModuleStep,
      surveyResponsesCount: activePlan.moduleCData?.surveys?.reduce((acc, s) => acc + (s.responses?.length || 0), 0) || 0,
      willingnessToPay: activePlan.moduleHData?.step2PricingTiers?.tiers?.[0]?.priceNetOfTax
        ? `${activePlan.baseCurrency} ${activePlan.moduleHData.step2PricingTiers.tiers[0].priceNetOfTax}`
        : 'Validated via Survey',
      status: currentPlanProgress >= 80 ? 'GRANT_READY' : currentPlanProgress >= 50 ? 'ON_TRACK' : 'VALIDATING',
      statusBadge: {
        label: currentPlanProgress >= 80 ? 'Grant-Ready' : currentPlanProgress >= 50 ? 'On Track' : 'In Validation',
        bg: currentPlanProgress >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-blue-800 border-blue-300',
        dot: currentPlanProgress >= 80 ? 'bg-emerald-500' : 'bg-blue-500',
      },
      oneLiner: activePlan.oneLinerSummary || activePlan.conceptCanvas?.proposedSolution || 'Early Stage Venture',
      keyMetric: `${currentPlanProgress}% Blueprint Complete`,
      coFounderScore: 95,
      coFounderStatus: 'Active',
      mentorNotes: claimData.mentorNotes || '',
      modulesBreakdown: {
        ideation: Math.round(((moduleProgressMap.get('MOD_A_IDEATION') || 0) + (moduleProgressMap.get('MOD_B_MARKET') || 0)) / 2),
        surveys: moduleProgressMap.get('MOD_C_SURVEYS_FEEDBACK') || 0,
        product: Math.round(((moduleProgressMap.get('MOD_D_PRODUCT_BUILD') || 0) + (moduleProgressMap.get('MOD_E_OPERATIONS') || 0)) / 2),
        team: moduleProgressMap.get('MOD_F_COFOUNDER_TEAM') || 0,
        financials: Math.round(((moduleProgressMap.get('MOD_H_REVENUE') || 0) + (moduleProgressMap.get('MOD_J_FINANCE') || 0)) / 2),
        grantPack: Math.round(((moduleProgressMap.get('MOD_K_GRANTS_FUNDING') || 0) + (moduleProgressMap.get('MOD_L_BUSINESS_PLAN') || 0)) / 2),
      },
      milestoneStatus: mStatus,
      milestoneClaimedAt: dbPlanRaw?.cohortMilestoneClaimedAt ? dbPlanRaw.cohortMilestoneClaimedAt.toISOString() : null,
      verifiedDomain: dbPlanRaw?.verifiedCohortDomain || null,
      verifiedWorkEmail: dbPlanRaw?.verifiedCohortWorkEmail || null,
      claimDossier: claimData,
      createdAt: activePlan.id,
    };

    return {
      success: true,
      data: {
        cohort: {
          id: cohortRecord.id,
          name: cohortRecord.name,
          organizationName: cohortRecord.organizationName,
          partnerLogoUrl: cohortRecord.partnerLogoUrl,
          inviteCode: cohortRecord.inviteCode,
          milestoneConfig: cohortRecord.milestoneConfigJson,
        },
        startup: startupSummary,
        founderPlans,
        plan: activePlan,
        facts,
        story: effectiveStory,
        founderName: ownerUser.name,
        founderEmail: ownerUser.email,
        mentorNotes: claimData.mentorNotes || '',
      },
    };
  } catch (error: any) {
    console.error('[getCohortStartupMasterDocumentAction] Error:', error);
    return { success: false, error: error?.message || 'Failed to load master document.' };
  }
}
