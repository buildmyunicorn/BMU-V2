import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    'Warning: STRIPE_SECRET_KEY is not defined in environment variables.'
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'Startup Preflight Platform',
    version: '2.0.0',
    url: 'https://startuppreflight.com',
  },
});
