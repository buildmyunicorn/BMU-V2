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
  emailLogs,
  type CohortMilestoneConfig,
} from '@/db';
import {
  getServerSessionCookie,
  getAdminSessionCookie,
} from '@/lib/auth/server-auth';
import { resend, EMAIL_DEFAULTS } from '@/lib/email/resend';

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
