/**
 * Stripe Pricing Plans & Pass Configuration for Startup Preflight
 * Aligned with Master Architecture (GEMINI.md & src/lib/entitlements/index.ts)
 */

export interface StripePassProduct {
  planType: 'SIX_MONTH_SOLO' | 'SIX_MONTH_COFOUNDER' | 'LIVING_VAULT_MONTHLY';
  title: string;
  description: string;
  mode: 'payment' | 'subscription';
  prices: {
    EUR: number; // in cents (e.g. 12900 = €129)
    GBP: number; // in pence (e.g. 10900 = £109)
    USD: number; // in cents
  };
  features: string[];
}

export const STRIPE_PASS_PRODUCTS: Record<
  'SIX_MONTH_SOLO' | 'SIX_MONTH_COFOUNDER' | 'LIVING_VAULT_MONTHLY',
  StripePassProduct
> = {
  SIX_MONTH_SOLO: {
    planType: 'SIX_MONTH_SOLO',
    title: '6-Month Solo Founder Pass',
    description:
      'Full access to all 12 modules (A–L), 1 startup plan, 1 seat, and 250 AI credits/mo.',
    mode: 'payment',
    prices: {
      EUR: 12900, // €129.00
      GBP: 10900, // £109.00
      USD: 14900, // $149.00
    },
    features: [
      'Full Access to Modules A–L',
      '1 Active Startup Plan Workspace',
      '1 Founder Seat',
      'LEO & Innovate UK Grant Compilers',
      '250 Platform AI Credits / month',
      '6 Months Full Vault Editing Access',
    ],
  },
  SIX_MONTH_COFOUNDER: {
    planType: 'SIX_MONTH_COFOUNDER',
    title: '6-Month Co-Founder Pass',
    description:
      'Everything in Solo + 3 plans, 3 seats, and the Blind-Reveal Co-Founder Alignment Engine.',
    mode: 'payment',
    prices: {
      EUR: 19900, // €199.00
      GBP: 16900, // £169.00
      USD: 21900, // $219.00
    },
    features: [
      'Full Access to Modules A–L',
      '3 Active Startup Plans (Clone & Pivot)',
      '3 Co-Founder Seats with Real-Time Collaboration',
      'Module F: 12 Awkward Questions Alignment Survey',
      'Side-by-Side Co-Founder Alignment Heatmap',
      '500 Platform AI Credits / month',
      '6 Months Full Vault Editing Access',
    ],
  },
  LIVING_VAULT_MONTHLY: {
    planType: 'LIVING_VAULT_MONTHLY',
    title: 'Living Vault & Grant Radar',
    description:
      'Continuous editing for all 12 modules post-Month 6, plus automated Grant & Tax Relief Radar.',
    mode: 'subscription',
    prices: {
      EUR: 900, // €9.00 / mo
      GBP: 800, // £8.00 / mo
      USD: 1000, // $10.00 / mo
    },
    features: [
      'Ongoing Editing for All 12 Modules',
      'Active Grant Radar & Tax Relief Alerts',
      'Continuous AI Document Audit Updates',
      'Cancel Anytime',
    ],
  },
};
