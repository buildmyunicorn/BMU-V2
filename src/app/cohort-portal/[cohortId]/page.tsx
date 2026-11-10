import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCohortPortalDataAction } from '@/app/actions/cohort-portal';
import { CohortPortalDashboard } from '@/components/cohorts/cohort-portal-dashboard';
import { AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CohortPortalPageProps {
  params: Promise<{ cohortId: string }>;
}

export async function generateMetadata({
  params,
}: CohortPortalPageProps): Promise<Metadata> {
  const { cohortId } = await params;
  const res = await getCohortPortalDataAction(cohortId);

  if (!res.success || !res.data) {
    return {
      title: 'Institutional Cohort Portal | Startup Preflight',
      description: 'Institutional Director & Mentor Batch Command Center',
    };
  }

  return {
    title: `${res.data.cohort.name} — Institutional Director Command Center`,
    description: `Track real-time batch milestone progress, survey customer proof, and grant compliance for ${res.data.cohort.name}.`,
  };
}

export default async function CohortPortalPage({ params }: CohortPortalPageProps) {
  const { cohortId } = await params;
  const res = await getCohortPortalDataAction(cohortId);

  if (!res.success || !res.data) {
    if (res.isAuthorized === false) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-inner">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Director &amp; Mentor Login Required
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Access to this batch command center is restricted to authorized program directors, mentors, and administrators. Please log in with your institutional staff account.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Link href={`/login?returnUrl=/cohort-portal/${encodeURIComponent(cohortId)}`}>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white h-9 shadow-sm">
                  Sign In with Director Account
                </Button>
              </Link>
              <Link href="/cohort-portal/demo">
                <Button variant="outline" className="w-full border-slate-700 bg-slate-900/80 text-xs text-slate-300 hover:text-white h-9">
                  Preview Demo Command Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-6 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Cohort Not Found</h1>
            <p className="mt-1 text-xs text-slate-400">
              Could not find an institutional cohort matching &quot;{cohortId}&quot;. Please verify the cohort link or invite code.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/cohort-portal/demo">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs text-white">
                <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                Preview Demo Command Center
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" className="w-full text-xs text-slate-400 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Return to Admin Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CohortPortalDashboard initialData={res.data} />;
}
