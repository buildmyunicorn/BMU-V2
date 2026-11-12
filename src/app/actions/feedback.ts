'use server';

import { db } from '@/db';
import { supportTickets, emailLogs, users, userEntitlements } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import { getServerSessionCookie, checkRateLimit } from '@/lib/auth/server-auth';
import { resend, EMAIL_DEFAULTS } from '@/lib/email/resend';
import type {
  SupportTicketType,
  SupportTicketPriority,
  SupportModuleScope,
  SupportTicketSource,
  SupportTicketRecord,
} from '@/lib/support-tracker-store';

export interface SubmitFeedbackInput {
  ticketType: SupportTicketType;
  customTypeText?: string | null;
  priority?: SupportTicketPriority;
  moduleScope?: SupportModuleScope;
  stepContext?: string | null;
  pageUrl?: string | null;
  planId?: string | null;
  planTitle?: string | null;
  title: string;
  description: string;
  expectedBehavior?: string | null;
  reporterEmail?: string | null;
  reporterName?: string | null;
  deviceInfo?: string | null;
  deviceMetadata?: Record<string, unknown> | null;
}

export interface SubmitFeedbackResponse {
  ok: boolean;
  ticketId?: string;
  source?: SupportTicketSource;
  error?: string;
}

const globalForSupport = globalThis as unknown as {
  bmuSupportTicketsTableEnsured?: boolean;
};

async function ensureTableReady(): Promise<void> {
  if (globalForSupport.bmuSupportTicketsTableEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source text NOT NULL DEFAULT 'ADMIN_TRACKER',
        ticket_type text NOT NULL DEFAULT 'BUG',
        custom_type_text text,
        priority text NOT NULL DEFAULT 'MEDIUM',
        status text NOT NULL DEFAULT 'OPEN',
        module_scope text NOT NULL DEFAULT 'GLOBAL',
        step_context text,
        page_url text,
        plan_id text,
        plan_title text,
        reporter_email text,
        reporter_name text,
        user_plan_type text,
        title text NOT NULL,
        description text NOT NULL,
        expected_behavior text,
        admin_notes text,
        device_info text,
        device_metadata_json jsonb DEFAULT '{}'::jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS device_info text;
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS reporter_name text;
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_plan_type text;
      ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS device_metadata_json jsonb DEFAULT '{}'::jsonb;
    `);
    globalForSupport.bmuSupportTicketsTableEnsured = true;
  } catch (err) {
    console.error('[Feedback Action] Error ensuring support_tickets table:', err);
  }
}

/**
 * Public & authenticated action to submit feedback, bug reports, and UX suggestions.
 * Auto-detects founder session, attaches device and module telemetry, persists to DB,
 * and notifies the administrator via email.
 */
export async function submitFeedbackAction(
  input: SubmitFeedbackInput
): Promise<SubmitFeedbackResponse> {
  const cleanTitle = (input.title || '').replace(/[\r\n\t]+/g, ' ').trim();
  const cleanDesc = (input.description || '').trim();

  if (!cleanDesc) {
    return { ok: false, error: 'Please enter a description for your feedback.' };
  }

  // 1. Resolve User Session & Source
  const session = await getServerSessionCookie();
  let source: SupportTicketSource = 'PUBLIC_VISITOR';
  let finalEmail = (input.reporterEmail || '').trim() || null;
  let finalName = (input.reporterName || '').trim() || null;
  let finalPlanType: string | null = null;

  if (session && session.userId) {
    source = 'FOUNDER_SUPPORT';
    finalEmail = session.email || finalEmail;

    try {
      const [userRow] = await db
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (userRow?.name && !finalName) {
        finalName = userRow.name;
      }

      const [entitlementRow] = await db
        .select({
          planType: userEntitlements.planType,
        })
        .from(userEntitlements)
        .where(eq(userEntitlements.userId, session.userId))
        .limit(1);

      if (entitlementRow?.planType) {
        finalPlanType = entitlementRow.planType;
      }
    } catch {
      // Non-fatal if DB user lookup fails
    }
  }

  // Rate-limiting check for spam prevention (10 submissions per 5 minutes per email/IP)
  const rateLimitKey = `feedback:${finalEmail || 'anonymous'}`;
  const rateLimit = checkRateLimit(rateLimitKey, 10, 5 * 60 * 1000);
  const globalLimit = checkRateLimit('feedback:global', 40, 5 * 60 * 1000);
  if (!rateLimit.allowed || !globalLimit.allowed) {
    return {
      ok: false,
      error: 'You have submitted several feedback items recently. Please wait a few minutes before submitting again.',
    };
  }

  const oneLineSnippet = cleanDesc.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const effectiveTitle =
    cleanTitle ||
    `${input.ticketType === 'BUG' ? 'Bug Report' : input.ticketType === 'IMPROVEMENT' ? 'Feature Idea' : 'Feedback'}: ${oneLineSnippet}...`;

  const priority: SupportTicketPriority = input.priority || (input.ticketType === 'BUG' ? 'HIGH' : 'MEDIUM');
  const moduleScope: SupportModuleScope = input.moduleScope || 'GLOBAL';

  await ensureTableReady();

  // 2. Insert into PostgreSQL
  let ticketId = `tkt-${Date.now()}`;
  try {
    const [inserted] = await db
      .insert(supportTickets)
      .values({
        source,
        ticketType: input.ticketType || 'BUG',
        customTypeText: input.customTypeText || null,
        priority,
        status: 'OPEN',
        moduleScope,
        stepContext: input.stepContext || null,
        pageUrl: input.pageUrl || null,
        planId: input.planId || null,
        planTitle: input.planTitle || null,
        reporterEmail: finalEmail,
        reporterName: finalName,
        userPlanType: finalPlanType,
        title: effectiveTitle,
        description: cleanDesc,
        expectedBehavior: input.expectedBehavior || null,
        deviceInfo: input.deviceInfo || null,
        deviceMetadataJson: input.deviceMetadata || {},
      })
      .returning({ id: supportTickets.id });

    if (inserted?.id) {
      ticketId = inserted.id;
    }
  } catch (err) {
    console.error('[Feedback Action] Error saving support ticket to DB:', err);
    // Proceed so user is not blocked; fallback logged
  }

  // 3. Dispatch Notification Email to Admin
  try {
    await sendAdminNotificationEmail({
      ticketId,
      source,
      ticketType: input.ticketType,
      priority,
      moduleScope,
      stepContext: input.stepContext,
      pageUrl: input.pageUrl,
      planTitle: input.planTitle,
      reporterEmail: finalEmail,
      reporterName: finalName,
      userPlanType: finalPlanType,
      title: effectiveTitle,
      description: cleanDesc,
      expectedBehavior: input.expectedBehavior,
      deviceInfo: input.deviceInfo,
    });
  } catch (emailErr) {
    console.error('[Feedback Action] Non-fatal notification error:', emailErr);
  }

  return {
    ok: true,
    ticketId,
    source,
  };
}

async function sendAdminNotificationEmail(ticket: {
  ticketId: string;
  source: SupportTicketSource;
  ticketType: SupportTicketType;
  priority: SupportTicketPriority;
  moduleScope: SupportModuleScope;
  stepContext?: string | null;
  pageUrl?: string | null;
  planTitle?: string | null;
  reporterEmail?: string | null;
  reporterName?: string | null;
  userPlanType?: string | null;
  title: string;
  description: string;
  expectedBehavior?: string | null;
  deviceInfo?: string | null;
}) {
  const adminRecipient =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    'tom@startuppreflight.com';

  const originBadge =
    ticket.source === 'FOUNDER_SUPPORT'
      ? '🟢 LIVE FOUNDER'
      : ticket.source === 'PUBLIC_VISITOR'
        ? '🟡 PUBLIC VISITOR'
        : '🟣 ADMIN QA';

  const typeEmoji =
    ticket.ticketType === 'BUG'
      ? '🐞'
      : ticket.ticketType === 'IMPROVEMENT'
        ? '💡'
        : ticket.ticketType === 'USER_SUPPORT'
          ? '💬'
          : '📝';

  const rawSubject = `[Startup Preflight] ${originBadge} ${typeEmoji} ${ticket.title}`;
  const subject = rawSubject.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 24px; background: #f8fafc; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 20px 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-founder { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-visitor { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .badge-admin { background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe; }
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
        <span class="badge ${
          ticket.source === 'FOUNDER_SUPPORT'
            ? 'badge-founder'
            : ticket.source === 'PUBLIC_VISITOR'
              ? 'badge-visitor'
              : 'badge-admin'
        }">${originBadge}</span>
        <span style="font-size: 12px; color: #cbd5e1; margin-left: 8px;">Priority: <strong>${ticket.priority}</strong></span>
      </div>
      <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${ticket.title}</h2>
    </div>
    <div class="content">
      <div class="field-row">
        <div class="label">Reporter</div>
        <div class="value">
          ${ticket.reporterName ? `<strong>${ticket.reporterName}</strong> &lt;` : ''}${
            ticket.reporterEmail || 'Anonymous'
          }${ticket.reporterName ? '&gt;' : ''}
          ${ticket.userPlanType ? `<span style="color: #64748b; font-size: 12px;"> · Plan: ${ticket.userPlanType}</span>` : ''}
        </div>
      </div>

      <div class="field-row">
        <div class="label">Location &amp; Context</div>
        <div class="value">
          <strong>${ticket.moduleScope}</strong>
          ${ticket.stepContext ? ` › ${ticket.stepContext}` : ''}
          ${ticket.pageUrl ? `<br /><span style="font-size: 12px; color: #64748b;">Route: <code>${ticket.pageUrl}</code></span>` : ''}
          ${ticket.planTitle ? `<br /><span style="font-size: 12px; color: #64748b;">Active Plan: <strong>${ticket.planTitle}</strong></span>` : ''}
        </div>
      </div>

      ${
        ticket.deviceInfo
          ? `
      <div class="field-row">
        <div class="label">Device &amp; Telemetry</div>
        <div class="value" style="font-family: monospace; font-size: 12px; color: #475569;">
          📱 ${ticket.deviceInfo}
        </div>
      </div>
      `
          : ''
      }

      <div style="margin-top: 16px;">
        <div class="label">Feedback / Issue Details</div>
        <div class="box">${ticket.description}</div>
      </div>

      ${
        ticket.expectedBehavior
          ? `
      <div style="margin-top: 16px;">
        <div class="label">Expected Behavior</div>
        <div class="box" style="background: #f0fdf4; border-color: #bbf7d0; color: #166534;">${ticket.expectedBehavior}</div>
      </div>
      `
          : ''
      }

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://startuppreflight.com/admin?tab=support" class="btn">View in Admin Bug Tracker →</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_DEFAULTS.notificationsFrom,
        to: [adminRecipient],
        replyTo: ticket.reporterEmail || EMAIL_DEFAULTS.replyTo,
        subject,
        html,
      });

      if (error) {
        console.error('[Feedback Action] Resend returned error:', error);
        try {
          await db.insert(emailLogs).values({
            recipient: adminRecipient,
            template: 'FOUNDER_FEEDBACK_ALERT',
            subject,
            status: 'FAILED',
            fromEmail: EMAIL_DEFAULTS.notificationsFrom,
            replyTo: ticket.reporterEmail || EMAIL_DEFAULTS.replyTo,
            errorMessage: error.message || 'Resend validation/dispatch error',
            metadataJson: { ticketId: ticket.ticketId, source: ticket.source, error },
          });
        } catch (dbLogErr) {
          console.error('[Feedback Action] Error logging failed email to DB:', dbLogErr);
        }
      } else if (data?.id) {
        try {
          await db.insert(emailLogs).values({
            recipient: adminRecipient,
            template: 'FOUNDER_FEEDBACK_ALERT',
            subject,
            status: 'SENT',
            resendId: data.id,
            fromEmail: EMAIL_DEFAULTS.notificationsFrom,
            replyTo: ticket.reporterEmail || EMAIL_DEFAULTS.replyTo,
            metadataJson: { ticketId: ticket.ticketId, source: ticket.source },
          });
        } catch (dbLogErr) {
          console.error('[Feedback Action] Error logging sent email to DB:', dbLogErr);
        }
      }
    } catch (resendErr: unknown) {
      console.error('[Feedback Action] Exception sending Resend email:', resendErr);
      try {
        const errorMsg = resendErr instanceof Error ? resendErr.message : 'Unknown exception';
        await db.insert(emailLogs).values({
          recipient: adminRecipient,
          template: 'FOUNDER_FEEDBACK_ALERT',
          subject,
          status: 'FAILED',
          fromEmail: EMAIL_DEFAULTS.notificationsFrom,
          replyTo: ticket.reporterEmail || EMAIL_DEFAULTS.replyTo,
          errorMessage: errorMsg,
          metadataJson: { ticketId: ticket.ticketId, source: ticket.source },
        });
      } catch (dbLogErr) {
        console.error('[Feedback Action] Error logging failed email exception to DB:', dbLogErr);
      }
    }
  } else {
    // Dev Mock Logger
    console.log(`[Dev Mock Feedback Email] To: ${adminRecipient} | Subject: ${subject}`);
    try {
      await db.insert(emailLogs).values({
        recipient: adminRecipient,
        template: 'FOUNDER_FEEDBACK_ALERT',
        subject,
        status: 'MOCK_DEV',
        resendId: `mock_${Date.now()}`,
        fromEmail: EMAIL_DEFAULTS.notificationsFrom,
        replyTo: ticket.reporterEmail || EMAIL_DEFAULTS.replyTo,
        metadataJson: { ticketId: ticket.ticketId, isMockDev: true },
      });
    } catch {
      // ignore
    }
  }
}
