'use server';

import { db } from '@/db';
import { emailLogs } from '@/db/schema';
import { desc, eq, ilike, or } from 'drizzle-orm';
import {
  sendSystemEmail,
  renderEmailHtml,
  EmailTemplateType,
  TemplatePropsMap,
} from '@/lib/email/send';
import { EMAIL_DEFAULTS } from '@/lib/email/resend';
import { getAdminSessionCookie } from '@/lib/auth/server-auth';

async function requireSuperAdmin() {
  const session = await getAdminSessionCookie();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return null;
  }
  return session;
}

export interface EmailLogSummary {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  status: string;
  resendId: string | null;
  fromEmail: string;
  replyTo: string | null;
  metadataJson: Record<string, unknown> | null;
  errorMessage: string | null;
  openedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ListEmailLogsResult {
  ok: boolean;
  logs: EmailLogSummary[];
  stats: {
    totalSent: number;
    delivered: number;
    bouncedOrFailed: number;
    mockDev: number;
  };
  error?: string;
}

/**
 * Lists the most recent transactional email logs for super admin audit.
 */
export async function listAdminEmailLogsAction(
  searchQuery?: string
): Promise<ListEmailLogsResult> {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) {
      return {
        ok: false,
        logs: [],
        stats: { totalSent: 0, delivered: 0, bouncedOrFailed: 0, mockDev: 0 },
        error: 'Unauthorized: Super Admin session required.',
      };
    }
    const rows = await db
      .select()
      .from(emailLogs)
      .orderBy(desc(emailLogs.createdAt))
      .limit(100);

    const filtered = searchQuery?.trim()
      ? rows.filter(
          (r) =>
            r.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.template.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : rows;

    const stats = {
      totalSent: rows.length,
      delivered: rows.filter((r) => r.status === 'DELIVERED').length,
      bouncedOrFailed: rows.filter(
        (r) => r.status === 'BOUNCED' || r.status === 'FAILED'
      ).length,
      mockDev: rows.filter((r) => r.status === 'MOCK_DEV').length,
    };

    return {
      ok: true,
      logs: filtered.map((r) => ({
        id: r.id,
        recipient: r.recipient,
        template: r.template,
        subject: r.subject,
        status: r.status,
        resendId: r.resendId,
        fromEmail: r.fromEmail,
        replyTo: r.replyTo,
        metadataJson: (r.metadataJson as Record<string, unknown>) || {},
        errorMessage: r.errorMessage,
        openedAt: r.openedAt ? r.openedAt.toISOString() : null,
        deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
      stats,
    };
  } catch (err: unknown) {
    console.error('[listAdminEmailLogsAction Error]:', err);
    return {
      ok: false,
      logs: [],
      stats: { totalSent: 0, delivered: 0, bouncedOrFailed: 0, mockDev: 0 },
      error: 'Failed to retrieve email logs from database.',
    };
  }
}

/**
 * Preview any template rendered as HTML for visual inspection in the admin studio.
 */
export async function previewAdminEmailAction(
  template: EmailTemplateType,
  sampleProps?: Record<string, unknown>
): Promise<{ ok: boolean; html?: string; error?: string }> {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) {
      return { ok: false, error: 'Unauthorized: Super Admin session required.' };
    }
    const props =
      sampleProps || getDefaultSamplePropsForTemplate(template);
    const html = await renderEmailHtml(
      template,
      props as unknown as TemplatePropsMap[EmailTemplateType]
    );
    return { ok: true, html };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Render failed';
    return { ok: false, error: msg };
  }
}

/**
 * Send a live test email directly to the admin's personal inbox via Resend.
 */
export async function sendAdminTestEmailAction(
  targetEmail: string,
  template: EmailTemplateType
): Promise<{ ok: boolean; resendId?: string; isMockDev?: boolean; error?: string }> {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return { ok: false, error: 'Unauthorized: Super Admin session required.' };
  }
  if (!targetEmail || !targetEmail.includes('@')) {
    return { ok: false, error: 'Please provide a valid destination email address.' };
  }

  const sampleProps = getDefaultSamplePropsForTemplate(template);
  const subjects: Record<EmailTemplateType, string> = {
    WELCOME_FOUNDER: 'Welcome to Startup Preflight — Your Founder Workspace is Ready [TEST]',
    PASSWORD_RESET: 'Reset your Startup Preflight password [TEST]',
    VOUCHER_REDEEMED: 'Pass Activated! [TEST]',
    COFOUNDER_INVITE: 'Co-Founder Workspace Invitation [TEST]',
    QUOTE_RFP_PARTNER_INVITE: '⚡ [New RFP] Quote Request [TEST]',
    QUOTE_RFP_FOUNDER_RECEIPT: '⚡ 3-Quote Request Dispatched [TEST]',
    QUOTE_RECEIVED_FOUNDER: '🎉 Official Supplier Quote Received! [TEST]',
  };

  const result = await sendSystemEmail({
    to: targetEmail,
    template,
    subject: subjects[template] || 'Startup Preflight Test Notification',
    props: sampleProps as unknown as TemplatePropsMap[EmailTemplateType],
    metadata: { isAdminManualTest: true },
  });

  return result;
}

function getDefaultSamplePropsForTemplate(
  template: EmailTemplateType
): Record<string, unknown> {
  const appUrl = EMAIL_DEFAULTS.appUrl;

  switch (template) {
    case 'WELCOME_FOUNDER':
      return {
        founderName: 'Alex Founder',
        loginEmail: 'founder@example.com',
        loginUrl: `${appUrl}/workspace`,
        tierName: '6-Month Founder Pass (Solo)',
        hqCountry: 'IE',
      };
    case 'PASSWORD_RESET':
      return {
        recipientEmail: 'founder@example.com',
        resetUrl: `${appUrl}/reset-password?token=sample_test_token_123`,
        expiresInMinutes: 60,
      };
    case 'VOUCHER_REDEEMED':
      return {
        founderName: 'Sarah Connors',
        recipientEmail: 'founder@example.com',
        voucherCode: 'PREFLIGHT-SUMO-TIER2',
        tierName: 'AppSumo Tier 2 (Co-Founder Edition)',
        maxPlans: 3,
        maxSeats: 3,
        aiCreditsMonthly: 50,
        loginUrl: `${appUrl}/workspace`,
      };
    case 'COFOUNDER_INVITE':
      return {
        inviterName: 'Thomas Walsh',
        planTitle: 'CleanEnergy Flow AI',
        inviteeEmail: 'cofounder@example.com',
        roleTitle: 'Co-Founder & CTO',
        acceptUrl: `${appUrl}/invite/accept?token=sample_invite_token_456`,
      };
    case 'QUOTE_RFP_PARTNER_INVITE':
      return {
        partnerName: 'Apex Dev Studio',
        projectTitle: 'PulseGuard AI — Remote Patient Monitoring',
        category: 'DEV_AGENCY',
        countryCode: 'IE',
        currency: 'EUR',
        budgetRange: '€10,000 - €25,000',
        targetTimeline: '3 Months',
        scopeSummary: 'Next.js SaaS dashboard with HIPAA-compliant telemetry API and Stripe subscriptions.',
        workPackagesCount: 3,
        magicPortalUrl: `${appUrl}/quotes/submit/test-token-123`,
      };
    case 'QUOTE_RFP_FOUNDER_RECEIPT':
      return {
        founderName: 'Ciarán O’Connor',
        planTitle: 'PulseGuard AI',
        projectTitle: 'PulseGuard AI Software Build',
        category: 'DEV_AGENCY',
        currency: 'EUR',
        budgetRange: '€10,000 - €25,000',
        partnersCount: 3,
        partnerNames: ['Apex Dev Studio', 'Dublin App Lab', 'Celtic Cloud Solutions'],
        workspaceUrl: `${appUrl}/workspace`,
      };
    case 'QUOTE_RECEIVED_FOUNDER':
      return {
        founderName: 'Ciarán O’Connor',
        planTitle: 'PulseGuard AI',
        partnerName: 'Apex Dev Studio',
        partnerLogo: '💻',
        quoteAmountNet: '14,500.00',
        quoteCurrency: 'EUR',
        estimatedWeeks: 8,
        quoteNotes: 'Includes full Figma prototype, Next.js build, and 60 days QA warranty.',
        quoteFileUrl: 'https://example.com/quote.pdf',
        workspaceUrl: `${appUrl}/workspace`,
      };
    default:
      return {};
  }
}
