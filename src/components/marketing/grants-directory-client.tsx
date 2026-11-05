'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Building2,
  Euro,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Award,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShareGrantButton } from '@/components/marketing/share-grant-button';
import type { GrantDirectoryRecord } from '@/app/actions/admin-grants';

interface GrantsDirectoryClientProps {
  initialGrants: GrantDirectoryRecord[];
}

export function GrantsDirectoryClient({ initialGrants }: GrantsDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'IE' | 'GB'>('ALL');
  const [fundingTypeFilter, setFundingTypeFilter] = useState<string>('ALL');

  const filteredGrants = useMemo(() => {
    return initialGrants.filter((grant) => {
      const matchesCountry = countryFilter === 'ALL' || grant.countryCode === countryFilter;
      const matchesType = fundingTypeFilter === 'ALL' || grant.fundingType === fundingTypeFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        grant.grantName.toLowerCase().includes(query) ||
        grant.providerAgency.toLowerCase().includes(query) ||
        (grant.summary && grant.summary.toLowerCase().includes(query)) ||
        grant.slug.toLowerCase().includes(query);
      return matchesCountry && matchesType && matchesSearch;
    });
  }, [initialGrants, countryFilter, fundingTypeFilter, searchQuery]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    initialGrants.forEach((g) => {
      if (g.fundingType) types.add(g.fundingType);
    });
    return Array.from(types);
  }, [initialGrants]);

  return (
    <div className="space-y-8">
      {/* 1. FILTER CONTROLS BAR */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        {/* Country Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={countryFilter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setCountryFilter('ALL')}
            className="h-8 rounded-lg text-xs font-semibold"
          >
            All Regions ({initialGrants.length})
          </Button>
          <Button
            size="sm"
            variant={countryFilter === 'IE' ? 'default' : 'outline'}
            onClick={() => setCountryFilter('IE')}
            className={`h-8 rounded-lg text-xs font-semibold ${
              countryFilter === 'IE' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-emerald-50'
            }`}
          >
            🇮🇪 Ireland ({initialGrants.filter((g) => g.countryCode === 'IE').length})
          </Button>
          <Button
            size="sm"
            variant={countryFilter === 'GB' ? 'default' : 'outline'}
            onClick={() => setCountryFilter('GB')}
            className={`h-8 rounded-lg text-xs font-semibold ${
              countryFilter === 'GB' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-blue-50'
            }`}
          >
            🇬🇧 UK ({initialGrants.filter((g) => g.countryCode === 'GB').length})
          </Button>
        </div>

        {/* Search Input & Funding Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grants, vouchers, LEO..."
              className="h-9 w-full rounded-lg pl-8 text-xs focus:ring-indigo-600"
            />
          </div>

          <select
            value={fundingTypeFilter}
            onChange={(e) => setFundingTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Funding Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. GRANTS CARDS GRID */}
      {filteredGrants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">No grant schemes found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search keywords, region, or funding type filters.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setCountryFilter('ALL');
              setFundingTypeFilter('ALL');
            }}
            className="mt-4 text-xs"
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredGrants.map((grant) => {
            const countrySegment = grant.countryCode.toLowerCase();
            const detailHref = `/grants/${countrySegment}/${grant.slug}`;

            return (
              <Card
                key={grant.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
              >
                <CardContent className="p-5">
                  {/* Badge cluster */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-semibold ${
                        grant.countryCode === 'IE'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : grant.countryCode === 'GB'
                          ? 'border-blue-200 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {grant.countryCode === 'IE'
                        ? '🇮🇪 Ireland'
                        : grant.countryCode === 'GB'
                        ? '🇬🇧 United Kingdom'
                        : grant.countryCode}
                    </Badge>

                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {grant.fundingType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Title & Agency */}
                  <div className="mt-3">
                    <Link href={detailHref} className="focus:outline-hidden">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {grant.grantName}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {grant.providerAgency}
                    </p>
                  </div>

                  {/* Metric Highlight Box */}
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Maximum Funding
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {grant.matchRatePercentage ? `${grant.matchRatePercentage}% Match` : 'Non-Dilutive'}
                      </span>
                    </div>
                    <div className="mt-1 text-lg font-black text-slate-900">
                      {grant.maxAmountFormatted}
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {grant.summary || 'Comprehensive grant funding support for qualified startup ventures.'}
                  </p>

                  {/* Tags */}
                  {grant.stageFit && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{grant.stageFit}</span>
                    </div>
                  )}
                </CardContent>

                {/* Card Footer Actions */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-3.5 px-5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={detailHref}
                      className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      View Scheme Criteria
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                    <ShareGrantButton
                      title={`${grant.grantName} (${grant.countryCode})`}
                      description={grant.summary || `Non-dilutive startup funding from ${grant.providerAgency}`}
                      slug={grant.slug}
                      countryCode={grant.countryCode}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                      buttonText=""
                      showLabel={false}
                    />
                  </div>

                  <Link href="/register">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      Prepare with Preflight
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
