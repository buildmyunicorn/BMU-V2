'use server';

import { eq, sql } from 'drizzle-orm';
import {
  db,
  ensureDatabaseSchemaSynced,
  cohorts,
  users,
  startupPlans,
  planModulesData,
  emailLogs,
  type CohortMilestoneConfig,
} from '@/db';
import {
  verifyActiveSessionAndPlanOwnership,
  checkRateLimit,
} from '@/lib/auth/server-auth';
import { resend, EMAIL_DEFAULTS } from '@/lib/email/resend';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONSUMER_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.ie',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'mail.com',
  'yandex.com',
  'zoho.com',
]);

export interface CohortMilestoneExecutiveSummary {
  startupTitle: string;
  oneLiner: string;
  industryCategory: string;
  hqCountryCode: string;
  coreProblem?: string;
  proposedSolution?: string;
  beachheadPersona?: string;
  mvpProductVehicle?: string;
  surveyRespondentsCount?: number;
  waitlistLeadsCount?: number;
}

export interface CohortMilestoneClaimDossier {
  claimedAtIso: string;
  claimedByName: string;
  claimedByAccountEmail: string;
  verifiedDomain: string;
  verifiedWorkEmail: string;
  founderNotes?: string;
  cohortId: string;
  cohortName: string;
  organizationName: string;
  inviteCode: string;
  rewardLabel: string;
  overallProgressPercent: number;
  requiredProgressPercent: number;
  requiredModules: string[];
  completedRequiredModules: string[];
  moduleProgressMap: Record<string, number>;
  executiveSummary: CohortMilestoneExecutiveSummary;
  partnerNotifiedEmails: string[];
  resendMessageId?: string | null;
}

export interface CohortMilestonePlanState {
  ok: boolean;
  enrolledInCohort: boolean;
  cohort?: {
    id: string;
    name: string;
    organizationName: string;
    partnerLogoUrl: string | null;
    inviteCode: string;
    intakeType: string;
    milestoneConfig: Required<
      Pick<
        CohortMilestoneConfig,
        | 'enabled'
        | 'rewardLabel'
        | 'requiredProgressPercent'
        | 'requiredModules'
        | 'partnerNotificationEmails'
        | 'bccSuperAdmin'
        | 'requireOfficialDomain'
        | 'requireWorkEmail'
      >
    > & {
      instructionNotes?: string;
    };
  };
  claimState?: {
    status:
      | 'IN_PROGRESS'
      | 'ELIGIBLE_TO_CLAIM'
      | 'CLAIMED_PARTNER_NOTIFIED'
      | 'REWARD_ACTIVATED';
    claimedAtIso: string | null;
    verifiedDomain: string | null;
    verifiedWorkEmail: string | null;
    dossier: CohortMilestoneClaimDossier | null;
  };
  prefilledDomain?: string;
  prefilledWorkEmail?: string;
  error?: string;
}

function normalizeMilestoneConfig(
  raw?: CohortMilestoneConfig | null,
  orgName?: string | null
): NonNullable<CohortMilestonePlanState['cohort']>['milestoneConfig'] {
  const defaultLabel = orgName?.toLowerCase().includes('google')
    ? 'Activate Google for Startups Cloud Credits'
    : 'Unlock Institutional Partner Milestone Reward';

  return {
    enabled: Boolean(raw?.enabled),
    rewardLabel: raw?.rewardLabel?.trim() || defaultLabel,
    requiredProgressPercent:
      typeof raw?.requiredProgressPercent === 'number' &&
      raw.requiredProgressPercent >= 10 &&
      raw.requiredProgressPercent <= 100
        ? raw.requiredProgressPercent
        : 50,
    requiredModules:
      Array.isArray(raw?.requiredModules) && raw.requiredModules.length > 0
        ? raw.requiredModules
        : [
            'MOD_A_IDEATION',
            'MOD_B_MARKET',
            'MOD_C_SURVEYS_FEEDBACK',
            'MOD_D_PRODUCT_BUILD',
          ],
    partnerNotificationEmails: Array.isArray(raw?.partnerNotificationEmails)
      ? raw.partnerNotificationEmails.filter(Boolean)
      : [],
    bccSuperAdmin: raw?.bccSuperAdmin !== false,
    requireOfficialDomain: raw?.requireOfficialDomain !== false,
    requireWorkEmail: raw?.requireWorkEmail !== false,
    instructionNotes: raw?.instructionNotes?.trim() || undefined,
  };
}

function cleanAndValidateDomain(rawDomain: string): {
  valid: boolean;
  cleanDomain: string;
  error?: string;
} {
  const trimmed = (rawDomain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .split('?')[0]
    .trim();

  if (!trimmed) {
    return {
      valid: false,
      cleanDomain: '',
      error: 'Please enter your official company domain (e.g., acme.ai or acme.ie).',
    };
  }

  // Basic domain syntax check with at least one dot and valid TLD
  const domainRegex =
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  if (!domainRegex.test(trimmed) || trimmed.length < 4 || !trimmed.includes('.')) {
    return {
      valid: false,
      cleanDomain: trimmed,
      error:
        'Please enter a valid domain name (e.g., yourstartup.com, yourstartup.ie, or yourstartup.co.uk).',
    };
  }

  return { valid: true, cleanDomain: trimmed };
}

function validateCorporateWorkEmail(
  rawEmail: string,
  requireNonConsumer: boolean
): {
  valid: boolean;
  cleanEmail: string;
  isConsumerDomain: boolean;
  emailDomain: string;
  error?: string;
} {
  const cleanEmail = (rawEmail || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return {
      valid: false,
      cleanEmail,
      isConsumerDomain: false,
      emailDomain: '',
      error: 'Please enter a valid email address.',
    };
  }

  const emailDomain = cleanEmail.split('@')[1] || '';
  const isConsumerDomain = CONSUMER_EMAIL_DOMAINS.has(emailDomain);

  if (requireNonConsumer && isConsumerDomain) {
    return {
      valid: false,
      cleanEmail,
      isConsumerDomain: true,
      emailDomain,
      error: `Institutional partners require an official @company domain email address rather than a personal @${emailDomain} address to provision startup credits.`,
    };
  }

  return {
    valid: true,
    cleanEmail,
    isConsumerDomain,
    emailDomain,
  };
}

/**
 * Fetches the active Cohort & Milestone Gate status for a founder's Startup Plan.
 */
export async function getCohortMilestoneStateForPlanAction(
  planId: string,
  clientFallback?: { cohortCode?: string; userEmail?: string }
): Promise<CohortMilestonePlanState> {
  try {
    await ensureDatabaseSchemaSynced();

    const authCheck = await verifyActiveSessionAndPlanOwnership(planId);
    if (!authCheck.authorized && !authCheck.isLocalPreview) {
      return { ok: false, enrolledInCohort: false, error: 'Unauthorized' };
    }

    let planRow: (typeof startupPlans.$inferSelect) | undefined;
    if (planId && UUID_REGEX.test(planId)) {
      const [foundPlan] = await db
        .select()
        .from(startupPlans)
        .where(eq(startupPlans.id, planId))
        .limit(1);
      planRow = foundPlan;
    }

    let userRow: (typeof users.$inferSelect) | undefined;
    if (authCheck.userId && UUID_REGEX.test(authCheck.userId)) {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, authCheck.userId))
        .limit(1);
      userRow = foundUser;
    } else if (authCheck.email || clientFallback?.userEmail) {
      const targetEmail = (authCheck.email || clientFallback?.userEmail || '')
        .trim()
        .toLowerCase();
      if (targetEmail) {
        const [foundUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, targetEmail))
          .limit(1);
        userRow = foundUser;
      }
    }

    // Resolve Cohort ID from plan -> user -> fallback inviteCode
    let resolvedCohortId = planRow?.cohortId || userRow?.cohortId || null;
    let cohortRow: (typeof cohorts.$inferSelect) | undefined;

    if (resolvedCohortId && UUID_REGEX.test(resolvedCohortId)) {
      const [foundCohort] = await db
        .select()
        .from(cohorts)
        .where(eq(cohorts.id, resolvedCohortId))
        .limit(1);
      cohortRow = foundCohort;
    }

    if (!cohortRow && clientFallback?.cohortCode) {
      const cleanCode = clientFallback.cohortCode.trim().toUpperCase();
      const cleanAlpha = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (cleanCode) {
        const [foundByCode] = await db
          .select()
          .from(cohorts)
          .where(
            sql`UPPER(${cohorts.inviteCode}) = ${cleanCode} OR UPPER(REPLACE(${cohorts.inviteCode}, '-', '')) = ${cleanAlpha}`
          )
          .limit(1);
        cohortRow = foundByCode;
        if (cohortRow) {
          resolvedCohortId = cohortRow.id;
        }
      }
    }

    if (!cohortRow) {
      return { ok: true, enrolledInCohort: false };
    }

    // Auto-backfill planRow.cohortId if the user belongs to this cohort but the plan wasn't tagged yet
    if (planRow && !planRow.cohortId && resolvedCohortId) {
      try {
        await db
          .update(startupPlans)
          .set({ cohortId: resolvedCohortId, updatedAt: new Date() })
          .where(eq(startupPlans.id, planRow.id));
      } catch {
        // Non-fatal
      }
    }

    const milestoneConfig = normalizeMilestoneConfig(
      cohortRow.milestoneConfigJson,
      cohortRow.organizationName || cohortRow.name
    );

    const rawClaimData =
      planRow?.cohortMilestoneClaimDataJson &&
      typeof planRow.cohortMilestoneClaimDataJson === 'object' &&
      Object.keys(planRow.cohortMilestoneClaimDataJson as object).length > 0
        ? (planRow.cohortMilestoneClaimDataJson as CohortMilestoneClaimDossier)
        : null;

    const rawStatus = (planRow?.cohortMilestoneStatus || 'IN_PROGRESS') as
      | 'IN_PROGRESS'
      | 'ELIGIBLE_TO_CLAIM'
      | 'CLAIMED_PARTNER_NOTIFIED'
      | 'REWARD_ACTIVATED';

    return {
      ok: true,
      enrolledInCohort: true,
      cohort: {
        id: cohortRow.id,
        name: cohortRow.name,
        organizationName: cohortRow.organizationName || cohortRow.name,
        partnerLogoUrl: cohortRow.partnerLogoUrl || null,
        inviteCode: cohortRow.inviteCode,
        intakeType: cohortRow.intakeType || 'FIXED_BATCH',
        milestoneConfig,
      },
      claimState: {
        status: rawStatus,
        claimedAtIso: planRow?.cohortMilestoneClaimedAt
          ? planRow.cohortMilestoneClaimedAt.toISOString()
          : rawClaimData?.claimedAtIso || null,
        verifiedDomain:
          planRow?.verifiedCohortDomain || rawClaimData?.verifiedDomain || null,
        verifiedWorkEmail:
          planRow?.verifiedCohortWorkEmail ||
          rawClaimData?.verifiedWorkEmail ||
          null,
        dossier: rawClaimData,
      },
      prefilledDomain: planRow?.verifiedCohortDomain || undefined,
      prefilledWorkEmail:
        planRow?.verifiedCohortWorkEmail || userRow?.email || undefined,
    };
  } catch (err) {
    console.error('[Cohort Milestone State] Error:', err);
    return {
      ok: false,
      enrolledInCohort: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to load cohort milestone status.',
    };
  }
}

function buildPartnerMilestoneNotificationHtml(
  dossier: CohortMilestoneClaimDossier
): string {
  const modBadgesHtml = dossier.requiredModules
    .map((modCode) => {
      const pct = dossier.moduleProgressMap[modCode] ?? 100;
      const shortLabel = modCode.replace('MOD_', 'Module ').replace(/_/g, ' ');
      return `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:6px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:12px;font-weight:600;">✓ ${shortLabel} (${pct}%)</span>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cohort Milestone Qualified: ${dossier.executiveSummary.startupTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.05);">
    <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:28px 32px;color:#ffffff;">
      <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(16,185,129,0.2);border:1px solid rgba(52,211,153,0.4);color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px;">
        ✓ Milestone Verification Passed
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">
        ${dossier.rewardLabel}
      </h1>
      <p style="margin:6px 0 0 0;font-size:13px;color:#c7d2fe;">
        Partner Program: <strong>${dossier.organizationName}</strong> (${dossier.cohortName} • Code: <code>${dossier.inviteCode}</code>)
      </p>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#334155;">
        A startup enrolled in <strong>${dossier.cohortName}</strong> has completed the mandatory Startup Preflight validation &amp; readiness gate (<strong>${dossier.overallProgressPercent}% progress</strong> vs. ${dossier.requiredProgressPercent}% required) and submitted their verified corporate details to claim <strong>${dossier.rewardLabel}</strong>.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:22px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:12px;">
          1. Verified Corporate &amp; Founder Identity
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:5px 0;color:#64748b;width:170px;">Startup / Venture Name:</td>
            <td style="padding:5px 0;font-weight:700;color:#0f172a;">${dossier.executiveSummary.startupTitle}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Official Company Domain:</td>
            <td style="padding:5px 0;font-weight:700;color:#4f46e5;">
              <a href="https://${dossier.verifiedDomain}" style="color:#4f46e5;text-decoration:none;">https://${dossier.verifiedDomain}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Verified Work Email:</td>
            <td style="padding:5px 0;font-weight:700;color:#0f172a;">
              <a href="mailto:${dossier.verifiedWorkEmail}" style="color:#0f172a;text-decoration:underline;">${dossier.verifiedWorkEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">Founder Name:</td>
            <td style="padding:5px 0;font-weight:600;color:#1e293b;">${dossier.claimedByName}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#64748b;">HQ &amp; Sector:</td>
            <td style="padding:5px 0;color:#334155;">${dossier.executiveSummary.hqCountryCode} • ${dossier.executiveSummary.industryCategory}</td>
          </tr>
        </table>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:22px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:10px;">
          2. Completed Milestone Gate (${dossier.overallProgressPercent}% Overall Readiness)
        </div>
        <div style="margin-bottom:8px;">
          ${modBadgesHtml}
        </div>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:22px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:12px;">
          3. Executive Venture Snapshot
        </div>
        <p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#1e293b;">
          <strong>One-Liner:</strong> ${dossier.executiveSummary.oneLiner || '—'}
        </p>
        ${
          dossier.executiveSummary.coreProblem
            ? `<p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#334155;"><strong>Core Problem:</strong> ${dossier.executiveSummary.coreProblem}</p>`
            : ''
        }
        ${
          dossier.executiveSummary.proposedSolution
            ? `<p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#334155;"><strong>Proposed Solution:</strong> ${dossier.executiveSummary.proposedSolution}</p>`
            : ''
        }
        ${
          dossier.executiveSummary.beachheadPersona
            ? `<p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#334155;"><strong>Beachhead Customer:</strong> ${dossier.executiveSummary.beachheadPersona}</p>`
            : ''
        }
        ${
          dossier.executiveSummary.mvpProductVehicle
            ? `<p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#334155;"><strong>Product Architecture (Module D):</strong> ${dossier.executiveSummary.mvpProductVehicle}</p>`
            : ''
        }
        <p style="margin:0;font-size:12px;color:#475569;">
          <strong>Customer Validation (Module C):</strong> ${dossier.executiveSummary.surveyRespondentsCount ?? 0} survey responses • ${dossier.executiveSummary.waitlistLeadsCount ?? 0} early waitlist leads
        </p>
        ${
          dossier.founderNotes
            ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;font-size:13px;color:#1e293b;"><strong>Founder Note / Account ID:</strong> ${dossier.founderNotes}</div>`
            : ''
        }
      </div>

      <div style="text-align:center;padding-top:8px;">
        <a href="${EMAIL_DEFAULTS.appUrl}/admin" style="display:inline-block;padding:12px 24px;border-radius:10px;background:#4f46e5;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">
          Review Cohort Dossier in Startup Preflight
        </a>
      </div>
    </div>

    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;font-size:11px;color:#64748b;text-align:center;">
      Automated Institutional Partner Verification • Startup Preflight (${EMAIL_DEFAULTS.appUrl})
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildFounderClaimReceiptHtml(
  dossier: CohortMilestoneClaimDossier,
  instructionNotes?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Milestone Reward Claim Submitted: ${dossier.rewardLabel}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#065f46 0%,#047857 100%);padding:26px 30px;color:#ffffff;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#a7f3d0;margin-bottom:6px;">
        ✓ Partner Verification Dispatched
      </div>
      <h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">
        Your Claim for "${dossier.rewardLabel}" Has Been Sent!
      </h1>
    </div>
    <div style="padding:26px 30px;">
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#334155;">
        Hi ${dossier.claimedByName},
      </p>
      <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#334155;">
        Congratulations on reaching <strong>${dossier.overallProgressPercent}% readiness</strong> on Startup Preflight! Your verified venture dossier for <strong>${dossier.executiveSummary.startupTitle}</strong> has been transmitted to the <strong>${dossier.organizationName}</strong> program team.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:20px;font-size:13px;">
        <div style="margin-bottom:6px;"><strong>Program Cohort:</strong> ${dossier.cohortName}</div>
        <div style="margin-bottom:6px;"><strong>Verified Domain:</strong> https://${dossier.verifiedDomain}</div>
        <div style="margin-bottom:6px;"><strong>Verified Work Email:</strong> ${dossier.verifiedWorkEmail}</div>
        <div><strong>Status:</strong> Partner Notified — Pending Benefit Activation</div>
      </div>

      ${
        instructionNotes
          ? `<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px 18px;margin-bottom:20px;font-size:13px;color:#1e1b4b;">
              <strong>Next Steps from ${dossier.organizationName}:</strong><br/>
              <span style="line-height:1.5;">${instructionNotes}</span>
            </div>`
          : ''
      }

      <div style="text-align:center;margin-top:20px;">
        <a href="${EMAIL_DEFAULTS.appUrl}/workspace" style="display:inline-block;padding:11px 22px;border-radius:10px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">
          Return to Your Founder Workspace
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Verifies that a founder's plan has passed the cohort milestone gate, validates their
 * official domain & work email, saves the claim dossier to PostgreSQL, and dispatches
 * the verification email to the partner organization (e.g., Google for Startups) + Super Admin.
 */
export async function claimCohortMilestoneRewardAction(input: {
  planId: string;
  verifiedDomain: string;
  verifiedWorkEmail: string;
  founderNotes?: string;
  clientFallback?: {
    cohortCode?: string;
    userEmail?: string;
    founderName?: string;
  };
  clientProgressSnapshot: {
    overallProgressPercent: number;
    moduleProgressMap: Record<string, number>;
    executiveSummary: CohortMilestoneExecutiveSummary;
  };
}): Promise<{
  ok: boolean;
  error?: string;
  dossier?: CohortMilestoneClaimDossier;
  isMockDev?: boolean;
}> {
  try {
    await ensureDatabaseSchemaSynced();

    const authCheck = await verifyActiveSessionAndPlanOwnership(input.planId);
    if (!authCheck.authorized && !authCheck.isLocalPreview) {
      return {
        ok: false,
        error: 'You must be signed in as the owner of this startup plan to claim cohort rewards.',
      };
    }

    const rateKey = `cohort:claim:${authCheck.userId || input.planId}`;
    const rateLimit = checkRateLimit(rateKey, 5, 60_000);
    if (!rateLimit.allowed) {
      return {
        ok: false,
        error: `Too many claim requests. Please wait ${rateLimit.retryAfterSeconds} seconds and try again.`,
      };
    }

    const stateRes = await getCohortMilestoneStateForPlanAction(input.planId, {
      cohortCode: input.clientFallback?.cohortCode,
      userEmail: input.clientFallback?.userEmail,
    });

    if (!stateRes.ok || !stateRes.enrolledInCohort || !stateRes.cohort) {
      return {
        ok: false,
        error:
          stateRes.error ||
          'This startup plan is not linked to an active institutional cohort.',
      };
    }

    const { cohort, claimState } = stateRes;
    const { milestoneConfig } = cohort;

    if (!milestoneConfig.enabled) {
      return {
        ok: false,
        error: 'Milestone reward claims are not currently enabled for this cohort.',
      };
    }

    if (
      claimState?.status === 'CLAIMED_PARTNER_NOTIFIED' ||
      claimState?.status === 'REWARD_ACTIVATED'
    ) {
      return {
        ok: true,
        dossier: claimState.dossier || undefined,
      };
    }

    // 1. Validate Official Company Domain if required
    let cleanDomain = (input.verifiedDomain || '').trim();
    if (milestoneConfig.requireOfficialDomain) {
      const domainCheck = cleanAndValidateDomain(cleanDomain);
      if (!domainCheck.valid) {
        return { ok: false, error: domainCheck.error };
      }
      cleanDomain = domainCheck.cleanDomain;
    } else if (cleanDomain) {
      const domainCheck = cleanAndValidateDomain(cleanDomain);
      cleanDomain = domainCheck.cleanDomain || cleanDomain;
    }

    // 2. Validate Official @company Work Email if required
    const emailCheck = validateCorporateWorkEmail(
      input.verifiedWorkEmail,
      milestoneConfig.requireWorkEmail
    );
    if (!emailCheck.valid) {
      return { ok: false, error: emailCheck.error };
    }
    const cleanWorkEmail = emailCheck.cleanEmail;

    // 3. Re-verify Milestone Progress & Required Modules (combining DB module rows & client snapshot)
    const mergedModuleProgress: Record<string, number> = {
      ...(input.clientProgressSnapshot?.moduleProgressMap || {}),
    };

    if (input.planId && UUID_REGEX.test(input.planId)) {
      const dbModRows = await db
        .select()
        .from(planModulesData)
        .where(eq(planModulesData.planId, input.planId));
      for (const row of dbModRows) {
        const dbPct = row.completionPercentage ?? 0;
        const currentPct = mergedModuleProgress[row.moduleCode] ?? 0;
        mergedModuleProgress[row.moduleCode] = Math.max(dbPct, currentPct);
      }
    }

    const requiredMods = milestoneConfig.requiredModules || [];
    const completedRequiredModules = requiredMods.filter(
      (modCode) => (mergedModuleProgress[modCode] ?? 0) >= 50
    );

    const overallProgressPercent = Math.max(
      input.clientProgressSnapshot?.overallProgressPercent || 0,
      requiredMods.length > 0
        ? Math.round(
            requiredMods.reduce(
              (sum, code) => sum + (mergedModuleProgress[code] ?? 0),
              0
            ) / requiredMods.length
          )
        : 0
    );

    if (overallProgressPercent < milestoneConfig.requiredProgressPercent) {
      return {
        ok: false,
        error: `Your plan is currently at ${overallProgressPercent}% milestone readiness, but ${cohort.organizationName} requires at least ${milestoneConfig.requiredProgressPercent}% completion before claiming ${milestoneConfig.rewardLabel}.`,
      };
    }

    if (completedRequiredModules.length < requiredMods.length) {
      const missing = requiredMods
        .filter((m) => !completedRequiredModules.includes(m))
        .map((m) => m.replace('MOD_', 'Module ').split('_')[0])
        .join(', ');
      return {
        ok: false,
        error: `Please complete at least 50% of all required modules (${missing}) before claiming ${milestoneConfig.rewardLabel}.`,
      };
    }

    // Resolve Founder Name & Account Email
    let founderName = input.clientFallback?.founderName?.trim() || 'Founder';
    let accountEmail =
      authCheck.email || input.clientFallback?.userEmail || cleanWorkEmail;

    if (authCheck.userId && UUID_REGEX.test(authCheck.userId)) {
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.id, authCheck.userId))
        .limit(1);
      if (u) {
        founderName = u.name || founderName;
        accountEmail = u.email || accountEmail;
      }
    }

    const partnerRecipients = Array.from(
      new Set(
        [
          ...(milestoneConfig.partnerNotificationEmails || []),
          ...(milestoneConfig.bccSuperAdmin !== false
            ? [EMAIL_DEFAULTS.replyTo || 'tom@startuppreflight.com']
            : []),
        ]
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (partnerRecipients.length === 0) {
      partnerRecipients.push(
        (EMAIL_DEFAULTS.replyTo || 'tom@startuppreflight.com').toLowerCase()
      );
    }

    const now = new Date();
    const dossier: CohortMilestoneClaimDossier = {
      claimedAtIso: now.toISOString(),
      claimedByName: founderName,
      claimedByAccountEmail: accountEmail,
      verifiedDomain: cleanDomain,
      verifiedWorkEmail: cleanWorkEmail,
      founderNotes: input.founderNotes?.trim() || undefined,
      cohortId: cohort.id,
      cohortName: cohort.name,
      organizationName: cohort.organizationName,
      inviteCode: cohort.inviteCode,
      rewardLabel: milestoneConfig.rewardLabel,
      overallProgressPercent,
      requiredProgressPercent: milestoneConfig.requiredProgressPercent,
      requiredModules: requiredMods,
      completedRequiredModules,
      moduleProgressMap: mergedModuleProgress,
      executiveSummary: input.clientProgressSnapshot.executiveSummary,
      partnerNotifiedEmails: partnerRecipients,
    };

    // 4. Dispatch Notification Email to Partner Team + Super Admin
    const partnerSubject = `[${cohort.organizationName}] Milestone Verified: ${dossier.executiveSummary.startupTitle} (${cleanDomain}) — ${milestoneConfig.rewardLabel}`.replace(/[\r\n\t]+/g, ' ').trim();
    const partnerHtml = buildPartnerMilestoneNotificationHtml(dossier);

    let resendMessageId: string | null = null;
    let isMockDev = false;

    if (resend) {
      try {
        const sendRes = await resend.emails.send({
          from: EMAIL_DEFAULTS.notificationsFrom,
          to: partnerRecipients,
          replyTo: cleanWorkEmail,
          subject: partnerSubject,
          html: partnerHtml,
        });
        resendMessageId = sendRes.data?.id || null;

        await db.insert(emailLogs).values({
          recipient: partnerRecipients.join(', '),
          template: 'COHORT_MILESTONE_PARTNER_ALERT',
          subject: partnerSubject,
          status: sendRes.error ? 'FAILED' : 'SENT',
          resendId: resendMessageId,
          fromEmail: EMAIL_DEFAULTS.notificationsFrom,
          replyTo: cleanWorkEmail,
          errorMessage: sendRes.error?.message || null,
          metadataJson: {
            planId: input.planId,
            cohortId: cohort.id,
            inviteCode: cohort.inviteCode,
            verifiedDomain: cleanDomain,
            verifiedWorkEmail: cleanWorkEmail,
          },
        });
      } catch (emailErr) {
        console.error('[Cohort Milestone Claim] Partner email error:', emailErr);
      }
    } else {
      isMockDev = true;
      resendMessageId = `mock_cohort_claim_${Date.now()}`;
      try {
        await db.insert(emailLogs).values({
          recipient: partnerRecipients.join(', '),
          template: 'COHORT_MILESTONE_PARTNER_ALERT',
          subject: partnerSubject,
          status: 'MOCK_DEV',
          resendId: resendMessageId,
          fromEmail: EMAIL_DEFAULTS.notificationsFrom,
          replyTo: cleanWorkEmail,
          metadataJson: {
            isMockDev: true,
            planId: input.planId,
            cohortId: cohort.id,
            inviteCode: cohort.inviteCode,
            verifiedDomain: cleanDomain,
            verifiedWorkEmail: cleanWorkEmail,
          },
        });
      } catch {
        // Non-fatal
      }
    }

    dossier.resendMessageId = resendMessageId;

    // 5. Also dispatch confirmation receipt to the founder's verified work email
    const founderSubject = `✓ Claim Submitted: ${milestoneConfig.rewardLabel} (${cohort.organizationName})`;
    const founderHtml = buildFounderClaimReceiptHtml(
      dossier,
      milestoneConfig.instructionNotes
    );

    if (resend) {
      resend.emails
        .send({
          from: EMAIL_DEFAULTS.from,
          to: [cleanWorkEmail],
          replyTo: EMAIL_DEFAULTS.replyTo,
          subject: founderSubject,
          html: founderHtml,
        })
        .catch(() => {});
    }

    // 6. Persist Claim Status & Dossier on startup_plans
    if (input.planId && UUID_REGEX.test(input.planId)) {
      await db
        .update(startupPlans)
        .set({
          cohortId: cohort.id,
          cohortMilestoneStatus: 'CLAIMED_PARTNER_NOTIFIED',
          cohortMilestoneClaimedAt: now,
          verifiedCohortDomain: cleanDomain,
          verifiedCohortWorkEmail: cleanWorkEmail,
          cohortMilestoneClaimDataJson: dossier,
          updatedAt: now,
        })
        .where(eq(startupPlans.id, input.planId));
    }

    return {
      ok: true,
      dossier,
      isMockDev,
    };
  } catch (err) {
    console.error('[Claim Cohort Milestone] Error:', err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while submitting your milestone claim.',
    };
  }
}
