import Stripe from 'stripe';

let _stripeInstance: Stripe | null = null;
let _cachedKey: string | null = null;

export const PLACEHOLDER_BUILD_KEY = 'sk_test_placeholder_key_for_build';

/**
 * Returns true if a genuine Stripe secret key is configured in the environment.
 */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(
    key &&
    key !== PLACEHOLDER_BUILD_KEY &&
    !key.includes('placeholder') &&
    (key.startsWith('sk_test_') || key.startsWith('sk_live_'))
  );
}

/**
 * Returns a configured Stripe instance.
 * If STRIPE_SECRET_KEY is omitted during Docker/Next.js static build evaluation,
 * a placeholder key is used to satisfy constructor validation without throwing.
 */
export function getStripe(strict = false): Stripe {
  const rawKey = process.env.STRIPE_SECRET_KEY?.trim();
  const apiKey = rawKey || PLACEHOLDER_BUILD_KEY;

  if (strict && (!rawKey || rawKey === PLACEHOLDER_BUILD_KEY || rawKey.includes('placeholder'))) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured in this environment. Please ensure STRIPE_SECRET_KEY is added to your environment variables or Google Cloud Run configuration.'
    );
  }

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
    const isConfigured = isStripeConfigured();
    // Allow inspection/typeof checks without throwing
    if (prop === 'then' || prop === 'constructor' || typeof prop === 'symbol') {
      return undefined;
    }
    if (!isConfigured) {
      // In production/dev runtime, fail early with a clear descriptive message instead of sending dummy key to Stripe
      return new Proxy(() => {}, {
        get(_subTarget, _subProp) {
          return () => {
            throw new Error(
              'STRIPE_SECRET_KEY is not configured. Please add STRIPE_SECRET_KEY to your environment variables or Cloud Run service configuration.'
            );
          };
        },
        apply() {
          throw new Error(
            'STRIPE_SECRET_KEY is not configured. Please add STRIPE_SECRET_KEY to your environment variables or Cloud Run service configuration.'
          );
        },
      });
    }

    const instance = getStripe();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
