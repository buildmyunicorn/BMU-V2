'use server';

import { db } from '@/db';
import { cohortInquiries, emailLogs } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import { checkRateLimit, getAdminSessionCookie } from '@/lib/auth/server-auth';
import { resend, EMAIL_DEFAULTS } from '@/lib/email/resend';

export interface SubmitCohortInquiryInput {
  name: string;
  email: string;
  organizationName: string;
  organizationType: string;
  customOrganizationType?: string | null;
  cohortSize: string;
  regionalFocus: string;
  targetStartDate?: string | null;
  goals?: string[];
  notes?: string | null;
}

export interface SubmitCohortInquiryResponse {
  ok: boolean;
  inquiryId?: string;
  error?: string;
}

const globalForCohort = globalThis as unknown as {
  spfCohortInquiriesTableEnsured?: boolean;
};

async function ensureTableReady() {
  if (globalForCohort.spfCohortInquiriesTableEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cohort_inquiries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL,
        organization_name text NOT NULL,
        organization_type text NOT NULL,
        cohort_size text NOT NULL,
        regional_focus text NOT NULL DEFAULT 'IE_UK',
        target_start_date text,
        goals_json jsonb DEFAULT '[]'::jsonb,
        notes text,
        status text NOT NULL DEFAULT 'NEW',
        metadata_json jsonb DEFAULT '{}'::jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);
    globalForCohort.spfCohortInquiriesTableEnsured = true;
  } catch (err) {
    console.error('[Cohort Inquiry Action] Error ensuring cohort_inquiries table:', err);
  }
}

/**
 * Public server action to submit an inquiry for Preflight for Accelerators & Cohorts.
 * Performs server-side sanitization, rate limiting, database insertion, and admin notification email.
 */
export async function submitCohortInquiryAction(
  input: SubmitCohortInquiryInput
): Promise<SubmitCohortInquiryResponse> {
  const cleanName = (input.name || '').trim();
  const cleanEmail = (input.email || '').trim().toLowerCase();
  const cleanOrgName = (input.organizationName || '').trim();
  const cleanOrgType = (input.organizationType || '').trim();
  const cleanCohortSize = (input.cohortSize || '').trim();
  const cleanRegionalFocus = (input.regionalFocus || 'IE_UK').trim();
  const cleanStartDate = (input.targetStartDate || '').trim();
  const cleanNotes = (input.notes || '').trim();
  const goals = Array.isArray(input.goals) ? input.goals : [];

  // Validation
  if (!cleanName) {
    return { ok: false, error: 'Please enter your name.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { ok: false, error: 'Please provide a valid work email address.' };
  }
  if (!cleanOrgName) {
    return { ok: false, error: 'Please provide your organization or program name.' };
  }
  if (!cleanOrgType) {
    return { ok: false, error: 'Please select an organization type.' };
  }
  if (!cleanCohortSize) {
    return { ok: false, error: 'Please select your estimated cohort or batch size.' };
  }

  // Rate limiting: max 5 submissions per 10 minutes per IP/email
  const rateLimitKey = `cohort_inquiry:${cleanEmail}`;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);
  const globalLimit = checkRateLimit('cohort_inquiry:global', 25, 10 * 60 * 1000);
  if (!rateLimit.allowed || !globalLimit.allowed) {
    return {
      ok: false,
      error: 'You have submitted several inquiries recently. Please wait a few minutes before submitting again.',
    };
  }

  await ensureTableReady();

  const finalOrgType =
    cleanOrgType === 'OTHER' && input.customOrganizationType?.trim()
      ? `OTHER: ${input.customOrganizationType.trim()}`
      : cleanOrgType;

  let inquiryId = `ci-${Date.now()}`;

  try {
    const [inserted] = await db
      .insert(cohortInquiries)
      .values({
        name: cleanName,
        email: cleanEmail,
        organizationName: cleanOrgName,
        organizationType: finalOrgType,
        cohortSize: cleanCohortSize,
        regionalFocus: cleanRegionalFocus,
        targetStartDate: cleanStartDate || null,
        goalsJson: goals,
        notes: cleanNotes || null,
        status: 'NEW',
        metadataJson: {
          submittedAt: new Date().toISOString(),
          source: 'COHORTS_PAGE',
        },
      })
      .returning({ id: cohortInquiries.id });

    if (inserted?.id) {
      inquiryId = inserted.id;
    }
  } catch (err) {
    console.error('[Cohort Inquiry Action] Database insert error:', err);
    // Non-fatal if DB insert fails so lead notification can still fire
  }

  // Dispatch email notification to admin
  try {
    await sendAdminNotification({
      inquiryId,
      name: cleanName,
      email: cleanEmail,
      organizationName: cleanOrgName,
      organizationType: finalOrgType,
      cohortSize: cleanCohortSize,
      regionalFocus: cleanRegionalFocus,
      targetStartDate: cleanStartDate,
      goals,
      notes: cleanNotes,
    });
  } catch (emailErr) {
    console.error('[Cohort Inquiry Action] Email notification error:', emailErr);
  }

  return {
    ok: true,
    inquiryId,
  };
}

async function sendAdminNotification(data: {
  inquiryId: string;
  name: string;
  email: string;
  organizationName: string;
  organizationType: string;
  cohortSize: string;
  regionalFocus: string;
  targetStartDate?: string;
  goals: string[];
  notes?: string;
}) {
  const adminRecipient =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    'tom@startuppreflight.com';

  const subject = `[Startup Preflight] 🎓 New Cohort / Enterprise Inquiry: ${data.organizationName} (${data.name})`;

  const goalsListHtml =
    data.goals && data.goals.length > 0
      ? `<ul style="margin: 6px 0 0 16px; padding: 0;">${data.goals.map((g) => `<li style="font-size: 13px; color: #334155;">${escapeHtml(g)}</li>`).join('')}</ul>`
      : '<span style="color: #94a3b8; font-style: italic;">None specified</span>';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 24px; background: #f8fafc; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 22px 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #e0e7ff; color: #3730a3; }
    .content { padding: 24px; }
    .field-row { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
    .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 14px; color: #0f172a; font-weight: 500; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px; color: #334155; margin-top: 8px; white-space: pre-wrap; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="margin-bottom: 8px;">
        <span class="badge">🎓 Institutional / Cohort Lead</span>
      </div>
      <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${escapeHtml(data.organizationName)}</h2>
      <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1;">Contact: ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p>
    </div>
    <div class="content">
      <div class="field-row">
        <div class="label">Organization &amp; Type</div>
        <div class="value"><strong>${escapeHtml(data.organizationName)}</strong> (${escapeHtml(data.organizationType)})</div>
      </div>

      <div class="field-row">
        <div class="label">Cohort / Batch Size</div>
        <div class="value">${escapeHtml(data.cohortSize)} Startups</div>
      </div>

      <div class="field-row">
        <div class="label">Regional Focus &amp; Target Start Date</div>
        <div class="value">
          Region: <strong>${escapeHtml(data.regionalFocus)}</strong>
          ${data.targetStartDate ? ` · Intake Date: <strong>${escapeHtml(data.targetStartDate)}</strong>` : ''}
        </div>
      </div>

      <div class="field-row">
        <div class="label">Program Goals</div>
        ${goalsListHtml}
      </div>

      ${
        data.notes
          ? `
      <div class="field-row">
        <div class="label">Notes / Specific Requirements</div>
        <div class="box">${escapeHtml(data.notes)}</div>
      </div>
      `
          : ''
      }

      <div style="margin-top: 24px; text-align: center;">
        <a href="mailto:${escapeHtml(data.email)}?subject=Re:%20Startup%20Preflight%20Cohort%20Licensing%20for%20${encodeURIComponent(data.organizationName)}" class="btn">
          Reply to ${escapeHtml(data.name)} directly →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: EMAIL_DEFAULTS.from,
        to: adminRecipient,
        replyTo: data.email,
        subject,
        html,
      });

      await db
        .insert(emailLogs)
        .values({
          recipient: adminRecipient,
          template: 'COHORT_INQUIRY',
          subject,
          status: 'SENT',
          resendId: result.data?.id || null,
          fromEmail: EMAIL_DEFAULTS.from,
          replyTo: data.email,
          metadataJson: {
            inquiryId: data.inquiryId,
            organizationName: data.organizationName,
          },
        })
        .catch(() => {});
    } catch (resendErr) {
      console.error('[Cohort Inquiry Action] Resend dispatch error:', resendErr);
    }
  } else {
    // Development fallback
    console.log('[Cohort Inquiry Mock Email]:', {
      to: adminRecipient,
      subject,
      inquiryId: data.inquiryId,
      org: data.organizationName,
      contact: data.email,
    });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface AdminCohortInquiryRecord {
  id: string;
  name: string;
  email: string;
  organizationName: string;
  organizationType: string;
  cohortSize: string;
  regionalFocus: string;
  targetStartDate: string | null;
  goals: string[];
  notes: string | null;
  status: 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'CONVERTED' | 'ARCHIVED';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Super Admin: List all cohort & accelerator inquiries.
 */
export async function listCohortInquiriesAdminAction(): Promise<{
  ok: boolean;
  inquiries: AdminCohortInquiryRecord[];
  error?: string;
}> {
  try {
    const session = await getAdminSessionCookie();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return { ok: false, inquiries: [], error: 'Unauthorized: Super Admin access required.' };
    }

    await ensureTableReady();

    const rows = await db
      .select()
      .from(cohortInquiries)
      .orderBy(desc(cohortInquiries.createdAt));

    const inquiries: AdminCohortInquiryRecord[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      organizationName: r.organizationName,
      organizationType: r.organizationType,
      cohortSize: r.cohortSize,
      regionalFocus: r.regionalFocus,
      targetStartDate: r.targetStartDate,
      goals: Array.isArray(r.goalsJson) ? (r.goalsJson as string[]) : [],
      notes: r.notes,
      status: (r.status as AdminCohortInquiryRecord['status']) || 'NEW',
      metadata: (r.metadataJson as Record<string, unknown>) || {},
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { ok: true, inquiries };
  } catch (err) {
    console.error('[Cohort Inquiries Admin] List failed:', err);
    return { ok: false, inquiries: [], error: 'Failed to retrieve cohort inquiries.' };
  }
}

/**
 * Super Admin: Update status or internal notes on a cohort inquiry.
 */
export async function updateCohortInquiryStatusAdminAction(params: {
  inquiryId: string;
  status: AdminCohortInquiryRecord['status'];
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getAdminSessionCookie();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return { ok: false, error: 'Unauthorized: Super Admin access required.' };
    }

    await ensureTableReady();

    await db
      .update(cohortInquiries)
      .set({
        status: params.status,
        ...(params.notes !== undefined ? { notes: params.notes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(cohortInquiries.id, params.inquiryId));

    return { ok: true };
  } catch (err) {
    console.error('[Cohort Inquiries Admin] Update status failed:', err);
    return { ok: false, error: 'Failed to update cohort inquiry status.' };
  }
}
