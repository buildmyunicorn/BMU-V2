import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';

export interface DomainCheckItem {
  domain: string;
  tld: string;
  available: boolean;
  statusLabel: string;
  recommended?: boolean;
  notes?: string;
}

async function isDomainRegisteredViaDns(domain: string): Promise<boolean> {
  try {
    // Check NS records first (virtually all registered domains have NS records delegated)
    const ns = await Promise.race([
      dns.resolveNs(domain),
      new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error('DNS_TIMEOUT')), 1500)
      ),
    ]);
    if (Array.isArray(ns) && ns.length > 0) {
      return true;
    }
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    // ENOTFOUND or ENODATA on NS usually means the domain is not delegated / available
    if (code === 'ENOTFOUND') {
      return false;
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
      return true;
    }
  } catch {
    // No A record
  }

  return false;
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
      const isTaken = await isDomainRegisteredViaDns(item.domain);
      return {
        domain: item.domain,
        tld: item.tld,
        available: !isTaken,
        statusLabel: !isTaken ? 'Available to Claim' : 'Already Registered',
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
