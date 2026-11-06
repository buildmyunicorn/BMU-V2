import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';
import { checkRateLimit } from '@/lib/auth/server-auth';

export interface DomainCheckItem {
  domain: string;
  tld: string;
  status: 'AVAILABLE' | 'TAKEN';
  available: boolean;
  statusLabel: string;
  reason: string;
  recommended?: boolean;
  notes?: string;
}

/**
 * Checks domain availability using a 2-tier strategy:
 * Tier 1: Google DNS-over-HTTPS (DoH). High speed, zero UDP port blocking in Cloud Run / container networks.
 * Tier 2: Native Node.js dns.resolveNs / dns.resolve4 fallback.
 */
async function checkDomainAvailability(
  domain: string
): Promise<{ available: boolean; reason: string }> {
  // Tier 1: Google DoH (Reliable across serverless and cloud containers)
  try {
    const dohUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`;
    const res = await fetch(dohUrl, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      // Status 3 = NXDOMAIN (Non-Existent Domain -> unequivocally Available)
      if (data.Status === 3) {
        return {
          available: true,
          reason: 'No active DNS delegation or NS records found (Available to Claim)',
        };
      }
      // Status 0 with Answer = Active NS delegation -> Registered
      if (data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0) {
        return {
          available: false,
          reason: 'Active NS delegation / DNS records detected (Already Claimed)',
        };
      }
      // Status 0 with Authority indicating domain SOA
      if (data.Status === 0 && Array.isArray(data.Authority)) {
        const hasDirectAuthority = data.Authority.some(
          (a: { name?: string }) =>
            a.name && (a.name === domain || a.name === `${domain}.`)
        );
        if (hasDirectAuthority) {
          return {
            available: false,
            reason: 'Active SOA authority zone detected (Already Claimed)',
          };
        }
      }
    }
  } catch {
    // Fall through to native DNS
  }

  // Tier 2: Native Node.js DNS fallback
  try {
    const ns = await Promise.race([
      dns.resolveNs(domain),
      new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error('DNS_TIMEOUT')), 1500)
      ),
    ]);
    if (Array.isArray(ns) && ns.length > 0) {
      return {
        available: false,
        reason: 'Active NS delegation / DNS records detected (Already Claimed)',
      };
    }
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    if (code === 'ENOTFOUND' || code === 'NXDOMAIN') {
      return {
        available: true,
        reason: 'No active DNS delegation found (Available to Claim)',
      };
    }
  }

  try {
    const aRecords = await Promise.race([
      dns.resolve4(domain),
      new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error('DNS_TIMEOUT')), 1200)
      ),
    ]);
    if (Array.isArray(aRecords) && aRecords.length > 0) {
      return {
        available: false,
        reason: 'Active A records pointing to hosting server (Already Claimed)',
      };
    }
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    if (code === 'ENOTFOUND' || code === 'NXDOMAIN') {
      return {
        available: true,
        reason: 'No active DNS records found (Available to Claim)',
      };
    }
  }

  // If no NS or A records were found or resolved, assume available
  return {
    available: true,
    reason: 'No active DNS delegation or NS records found (Available to Claim)',
  };
}

function sanitizeBaseLabel(rawInput: string): string {
  const cleaned = rawInput
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('.')[0]
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
  return cleaned;
}

export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : 'anon');

  const rl = checkRateLimit(`domain_check:${clientIp}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many domain checks. Please wait ${rl.retryAfterSeconds} seconds.`,
        results: [],
      },
      { status: 429 }
    );
  }

  const rawQuery = request.nextUrl.searchParams.get('q') || '';
  const countryCode = (
    request.nextUrl.searchParams.get('country') || 'IE'
  ).toUpperCase();

  const baseName = sanitizeBaseLabel(rawQuery);
  if (!baseName || baseName.length < 2) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Please enter at least 2 characters for a domain name.',
        results: [],
      },
      { status: 400 }
    );
  }

  const primaryLocalTld = countryCode === 'GB' || countryCode === 'UK' ? '.co.uk' : '.ie';
  const secondaryLocalTld = primaryLocalTld === '.ie' ? '.co.uk' : '.ie';

  const candidates: Array<{
    domain: string;
    tld: string;
    recommended?: boolean;
    notes?: string;
  }> = [
    {
      domain: `${baseName}${primaryLocalTld}`,
      tld: primaryLocalTld,
      recommended: true,
      notes:
        primaryLocalTld === '.ie'
          ? 'Best for Irish trust & LEO/EI grants (requires CRO/RBN or Irish connection)'
          : 'Best for UK customer trust & Companies House alignment',
    },
    {
      domain: `${baseName}.com`,
      tld: '.com',
      recommended: true,
      notes: 'Global commercial standard for international expansion',
    },
    {
      domain: `${baseName}${secondaryLocalTld}`,
      tld: secondaryLocalTld,
      notes:
        secondaryLocalTld === '.co.uk'
          ? 'Recommended if exporting to the UK market'
          : 'Recommended if trading in Ireland',
    },
    {
      domain: `${baseName}.io`,
      tld: '.io',
      notes: 'Popular for SaaS, AI & developer platforms',
    },
    {
      domain: `get${baseName}.com`,
      tld: '.com',
      notes: 'Clean fallback if primary .com is already taken',
    },
  ];

  const results: DomainCheckItem[] = await Promise.all(
    candidates.map(async (item) => {
      const check = await checkDomainAvailability(item.domain);
      const isAvail = check.available;
      return {
        domain: item.domain,
        tld: item.tld,
        status: isAvail ? 'AVAILABLE' : 'TAKEN',
        available: isAvail,
        statusLabel: isAvail ? 'Available to Claim' : 'Already Registered',
        reason: check.reason,
        recommended: item.recommended,
        notes: item.notes,
      };
    })
  );

  return NextResponse.json({
    ok: true,
    baseName,
    countryCode,
    checkedAt: new Date().toISOString(),
    results,
  });
}
