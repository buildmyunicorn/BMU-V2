'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Printer,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Check,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  isCrucial?: boolean;
}

interface GrantChecklistClientProps {
  grant: {
    slug: string;
    countryCode: string;
    grantName: string;
    providerAgency: string;
    fundingType: string;
    maxAmountFormatted: string;
    leoThreeQuoteEnforced?: boolean | null;
    reimbursementWarning: string;
  };
  checklistItems: ChecklistItem[];
}

export function GrantChecklistClient({
  grant,
  checklistItems,
}: GrantChecklistClientProps) {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  // Group items by category
  const categories = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of checklistItems) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [checklistItems]);

  const totalCount = checklistItems.length;
  const completedCount = useMemo(() => {
    return checklistItems.filter((item) => checkedIds[item.id]).length;
  }, [checklistItems, checkedIds]);

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleReset = () => {
    setCheckedIds({});
  };

  const flagEmoji = grant.countryCode === 'IE' ? '🇮🇪' : grant.countryCode === 'GB' ? '🇬🇧' : '🌍';
  const countrySegment = grant.countryCode.toLowerCase();
  const grantDetailHref = `/grants/${countrySegment}/${grant.slug}`;

  return (
    <div className="space-y-8">
      {/* 1. PROGRESS TRACKER & QUICK ACTIONS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Application Readiness Score
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  percentage === 100
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : percentage >= 50
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {percentage === 100
                  ? 'Assessor Ready'
                  : `${completedCount} of ${totalCount} Checked`}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{percentage}%</span>
              <span className="text-xs text-slate-500">
                {percentage === 100
                  ? 'All crucial compliance documents and eligibility criteria verified.'
                  : 'Check each item as you gather documents to ensure a zero-defect submission.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Print / Save PDF
            </Button>
            {completedCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-9 text-xs text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full transition-all duration-300 ${
              percentage === 100
                ? 'bg-emerald-500'
                : percentage >= 50
                ? 'bg-indigo-600'
                : 'bg-indigo-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 2. PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          {grant.grantName} — Official Application Checklist
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Provider: {grant.providerAgency} • Region: {grant.countryCode} • Generated via Startup Preflight
        </p>
      </div>

      {/* 3. GROUPED CHECKLIST CATEGORIES */}
      <div className="space-y-6">
        {categories.map(([category, items]) => {
          const categoryCompleted = items.filter((it) => checkedIds[it.id]).length;

          return (
            <div
              key={category}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {category}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {categoryCompleted}/{items.length} verified
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isChecked = !!checkedIds[item.id];

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`group flex items-start gap-4 p-4.5 sm:px-6 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50/30'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Checkbox Trigger */}
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-md border border-slate-300 bg-white group-hover:border-indigo-400 transition" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm font-semibold transition ${
                              isChecked
                                ? 'text-slate-500 line-through'
                                : 'text-slate-900 group-hover:text-indigo-600'
                            }`}
                          >
                            {item.title}
                          </h3>
                          {item.isCrucial && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              Assessor Mandatory
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            isChecked ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. REIMBURSEMENT WARNING CALLOUT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Assessor Timing &amp; Retrospective Warning
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {grant.reimbursementWarning}
          </p>
        </div>
      </div>

      {/* 5. NEXT STEPS / FOOTER CONVERSION */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 print:hidden">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 text-indigo-700">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Ready to assemble your grant pack?
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Use Startup Preflight to draft, audit and compile your application.
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Module A and K auto-generate the written concept, hiring schedule, financial forecast, and 3-quote supplier schedule in the exact format assessors expect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <Link href={grantDetailHref}>
            <Button
              variant="outline"
              className="w-full sm:w-auto h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Full Grant Scheme Details
            </Button>
          </Link>
          <Link href="/register">
            <Button className="w-full sm:w-auto h-10 rounded-xl bg-slate-900 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition">
              Prepare with Preflight Free
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
