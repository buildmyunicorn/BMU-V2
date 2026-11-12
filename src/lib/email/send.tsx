import React from 'react';
import { render } from '@react-email/components';
import { resend, EMAIL_DEFAULTS } from './resend';
import { db } from '@/db';
import { emailLogs } from '@/db/schema';
import {
  WelcomeFounderEmail,
  WelcomeFounderEmailProps,
} from './templates/welcome';
import {
  PasswordResetEmail,
  PasswordResetEmailProps,
} from './templates/password-reset';
import {
  VoucherRedeemedEmail,
  VoucherRedeemedEmailProps,
} from './templates/voucher-redeemed';
import {
  CofounderInviteEmail,
  CofounderInviteEmailProps,
} from './templates/cofounder-invite';
import {
  QuoteRfpPartnerInviteEmail,
  QuoteRfpPartnerInviteEmailProps,
} from './templates/quote-rfp-partner-invite';
import {
  QuoteRfpDispatchedFounderReceipt,
  QuoteRfpDispatchedFounderReceiptProps,
} from './templates/quote-rfp-dispatched-founder-receipt';
import {
  QuoteReceivedFounderEmail,
  QuoteReceivedFounderEmailProps,
} from './templates/quote-received-founder';
import {
  AdminNewUserSignupEmail,
  AdminNewUserSignupEmailProps,
} from './templates/admin-new-user-signup';

export type EmailTemplateType =
  | 'WELCOME_FOUNDER'
  | 'PASSWORD_RESET'
  | 'VOUCHER_REDEEMED'
  | 'COFOUNDER_INVITE'
  | 'QUOTE_RFP_PARTNER_INVITE'
  | 'QUOTE_RFP_FOUNDER_RECEIPT'
  | 'QUOTE_RECEIVED_FOUNDER'
  | 'ADMIN_NEW_SIGNUP';

export type TemplatePropsMap = {
  WELCOME_FOUNDER: WelcomeFounderEmailProps;
  PASSWORD_RESET: PasswordResetEmailProps;
  VOUCHER_REDEEMED: VoucherRedeemedEmailProps;
  COFOUNDER_INVITE: CofounderInviteEmailProps;
  QUOTE_RFP_PARTNER_INVITE: QuoteRfpPartnerInviteEmailProps;
  QUOTE_RFP_FOUNDER_RECEIPT: QuoteRfpDispatchedFounderReceiptProps;
  QUOTE_RECEIVED_FOUNDER: QuoteReceivedFounderEmailProps;
  ADMIN_NEW_SIGNUP: AdminNewUserSignupEmailProps;
};

export interface SendSystemEmailParams<T extends EmailTemplateType> {
  to: string;
  template: T;
  subject: string;
  props: TemplatePropsMap[T];
  from?: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  ok: boolean;
  resendId?: string;
  error?: string;
  isMockDev?: boolean;
}

/**
 * Renders the chosen React Email template to an HTML string.
 */
export async function renderEmailHtml<T extends EmailTemplateType>(
  template: T,
  props: TemplatePropsMap[T]
): Promise<string> {
  let element: React.ReactElement;

  switch (template) {
    case 'WELCOME_FOUNDER':
      element = <WelcomeFounderEmail {...(props as WelcomeFounderEmailProps)} />;
      break;
    case 'PASSWORD_RESET':
      element = <PasswordResetEmail {...(props as PasswordResetEmailProps)} />;
      break;
    case 'VOUCHER_REDEEMED':
      element = <VoucherRedeemedEmail {...(props as VoucherRedeemedEmailProps)} />;
      break;
    case 'COFOUNDER_INVITE':
      element = <CofounderInviteEmail {...(props as CofounderInviteEmailProps)} />;
      break;
    case 'QUOTE_RFP_PARTNER_INVITE':
      element = <QuoteRfpPartnerInviteEmail {...(props as QuoteRfpPartnerInviteEmailProps)} />;
      break;
    case 'QUOTE_RFP_FOUNDER_RECEIPT':
      element = <QuoteRfpDispatchedFounderReceipt {...(props as QuoteRfpDispatchedFounderReceiptProps)} />;
      break;
    case 'QUOTE_RECEIVED_FOUNDER':
      element = <QuoteReceivedFounderEmail {...(props as QuoteReceivedFounderEmailProps)} />;
      break;
    case 'ADMIN_NEW_SIGNUP':
      element = <AdminNewUserSignupEmail {...(props as AdminNewUserSignupEmailProps)} />;
      break;
    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  return await render(element);
}

/**
 * Centralized, fail-safe system email dispatcher.
 * Logs all dispatches to PostgreSQL (email_logs) for auditability.
 * In development without RESEND_API_KEY, safely logs mock delivery.
 */
export async function sendSystemEmail<T extends EmailTemplateType>({
  to,
  template,
  subject,
  props,
  from = EMAIL_DEFAULTS.from,
  replyTo = EMAIL_DEFAULTS.replyTo,
  metadata = {},
}: SendSystemEmailParams<T>): Promise<SendEmailResult> {
  const recipientClean = to.trim().toLowerCase();
  const cleanSubject = subject.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

  try {
    const html = await renderEmailHtml(template, props);

    // Development / fallback if Resend client is uninitialized
    if (!resend) {
      console.warn(
        `[Email Dev Mock] RESEND_API_KEY not configured. Mocking email to ${recipientClean}: "${cleanSubject}"`
      );

      // Log mock send to database audit trail
      try {
        await db.insert(emailLogs).values({
          recipient: recipientClean,
          template,
          subject: cleanSubject,
          status: 'MOCK_DEV',
          fromEmail: from,
          replyTo,
          metadataJson: { ...metadata, isMockDev: true },
          resendId: `mock_${Date.now()}`,
        });
      } catch (dbErr) {
        console.error('[Email Logger] Could not record mock email log:', dbErr);
      }

      return {
        ok: true,
        resendId: `mock_${Date.now()}`,
        isMockDev: true,
      };
    }

    // Live send via Resend SDK
    const { data, error } = await resend.emails.send({
      from,
      to: [recipientClean],
      replyTo,
      subject: cleanSubject,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);

      // Record failed send to database
      try {
        await db.insert(emailLogs).values({
          recipient: recipientClean,
          template,
          subject: cleanSubject,
          status: 'FAILED',
          fromEmail: from,
          replyTo,
          metadataJson: metadata,
          errorMessage: error.message || 'Unknown Resend dispatch error',
        });
      } catch (dbErr) {
        console.error('[Email Logger] Could not record failed email log:', dbErr);
      }

      return { ok: false, error: error.message };
    }

    const resendId = data?.id;

    // Record successful send
    try {
      await db.insert(emailLogs).values({
        recipient: recipientClean,
        template,
        subject: cleanSubject,
        status: 'SENT',
        resendId,
        fromEmail: from,
        replyTo,
        metadataJson: metadata,
      });
    } catch (dbErr) {
      console.error('[Email Logger] Could not record success email log:', dbErr);
    }

    return { ok: true, resendId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown exception';
    console.error(`[Email Dispatch Exception] Error sending to ${recipientClean}:`, err);

    try {
      await db.insert(emailLogs).values({
        recipient: recipientClean,
        template,
        subject,
        status: 'FAILED',
        fromEmail: from,
        replyTo,
        metadataJson: metadata,
        errorMessage: msg,
      });
    } catch {
      // Ignore secondary db logging error
    }

    return { ok: false, error: msg };
  }
}
