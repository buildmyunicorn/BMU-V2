import Stripe from 'stripe';

let _stripeInstance: Stripe | null = null;
let _cachedKey: string | null = null;

/**
 * Returns a configured Stripe instance.
 * If STRIPE_SECRET_KEY is omitted during Docker/Next.js static build evaluation,
 * a placeholder key is used to satisfy constructor validation without throwing.
 */
export function getStripe(): Stripe {
  const apiKey =
    process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_build';

  if (!_stripeInstance || _cachedKey !== apiKey) {
    _cachedKey = apiKey;
    _stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia' as any,
      appInfo: {
        name: 'Startup Preflight Platform',
        version: '2.0.0',
        url: 'https://startuppreflight.com',
      },
    });
  }
  return _stripeInstance;
}

/**
 * Singleton proxy wrapper that lazily forwards all property and method calls
 * to the active Stripe client, ensuring environment variables are read dynamically
 * at runtime while preventing build-time instantiation crashes.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
