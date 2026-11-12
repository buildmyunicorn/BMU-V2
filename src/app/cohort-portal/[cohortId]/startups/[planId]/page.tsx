import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCohortStartupMasterDocumentAction } from '@/app/actions/cohort-portal';
import { CohortStartupMasterDocumentView } from '@/components/cohorts/cohort-startup-master-document-view';
import { AlertCircle, ArrowLeft, GraduationCap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CohortStartupMasterDocPageProps {
  params: Promise<{
    cohortId: string;
    planId: string;
  }>;
}

export async function generateMetadata({
  params,
}: CohortStartupMasterDocPageProps): Promise<Metadata> {
  const { cohortId, planId } = await params;
  const res = await getCohortStartupMasterDocumentAction({
    cohortIdOrCode: cohortId,
    planId,
  });

  if (!res.success || !res.data) {
    return {
      title: 'Startup Master Document | Cohort Command Center',
      description: 'Institutional Director & Mentor Startup Intelligence Brief',
    };
  }

  return {
    title: `${res.data.plan.title} — Whole-Picture Master Document (${res.data.cohort.name})`,
    description: `Comprehensive 12-chapter Master Document, customer validation proofs, and underwriter diagnostics for ${res.data.plan.title} in ${res.data.cohort.name}.`,
  };
}

export default async function CohortStartupMasterDocPage({
  params,
}: CohortStartupMasterDocPageProps) {
  const { cohortId, planId } = await params;
  const res = await getCohortStartupMasterDocumentAction({
    cohortIdOrCode: cohortId,
    planId,
  });

  if (!res.success || !res.data) {
    if (res.isAuthorized === false) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-600/30 text-emerald-600 shadow-inner">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Director &amp; Mentor Access Required
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Viewing a startup's complete Master Document is restricted to authorized cohort directors, lead mentors, and administrators.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href={`/login?returnUrl=/cohort-portal/${encodeURIComponent(cohortId)}/startups/${encodeURIComponent(planId)}`}
              >
                <Button className="w-full bg-emerald-700 hover:bg-emerald-500 text-xs font-semibold text-white h-9 shadow-sm">
                  Sign In with Director Account
                </Button>
              </Link>
              <Link href={`/cohort-portal/${encodeURIComponent(cohortId)}`}>
                <Button
                  variant="outline"
                  className="w-full border-slate-700 bg-slate-900/80 text-xs text-slate-300 hover:text-white h-9"
                >
                  Return to Cohort Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Not found or error
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-slate-900/90 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Startup Plan Not Found</h1>
            <p className="mt-1 text-xs text-slate-400">
              {res.error ||
                'This startup blueprint does not exist or is not enrolled in this cohort batch.'}
            </p>
          </div>
          <div className="pt-2">
            <Link href={`/cohort-portal/${encodeURIComponent(cohortId)}`}>
              <Button
                variant="outline"
                className="w-full border-slate-700 bg-slate-800 text-xs text-slate-200 hover:text-white h-9"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Return to Cohort Command Center
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CohortStartupMasterDocumentView data={res.data} />;
}
