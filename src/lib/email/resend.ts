import { Resend } from 'resend';

// Resend client singleton
// If RESEND_API_KEY is not defined (e.g. fresh dev environment),
// calls gracefully drop into dev mock mode rather than crashing.
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const EMAIL_DEFAULTS = {
  // Verified domain on Resend
  from:
    process.env.EMAIL_FROM_SYSTEM ||
    'Startup Preflight <system@startuppreflight.com>',
  notificationsFrom:
    process.env.EMAIL_FROM_NOTIFICATIONS ||
    'Startup Preflight <notifications@startuppreflight.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@startuppreflight.com',
  companyName: 'Startup Preflight',
  supportUrl: 'https://startuppreflight.com/admin',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://startuppreflight.com',
};
