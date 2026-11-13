'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Users2,
  FileText,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Calendar,
  Send,
  Target,
  Scale,
  Award,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MarketingHeader, MarketingFooter } from './marketing-layout-nav';
import { submitCohortInquiryAction } from '@/app/actions/cohort-inquiries';

const GOAL_OPTIONS = [
  'Standardize business plans across all teams',
  'Pre-qualify founders for regional grants (LEO / Innovate UK)',
  'Prevent co-founder conflicts with blind alignment checks',
  'Help teams validate customer willingness-to-pay',
  'Free up mentor hours from repetitive document reviews',
  'Prepare founders for Demo Day & seed investor scrutiny',
];

const FAQS = [
  {
    q: 'How much does cohort licensing cost and how does procurement work?',
    a: 'Cohort licensing starts at €1,475 (£1,275 / $1,595) for a full 25-founder batch, which includes all 12 modules for every startup, the real-time Director Command Center, and batch grant audits. Because the investment is under €2,000, it readily qualifies for fast-track departmental credit card or single-signoff purchase order approval without lengthy public tender delays.',
  },
  {
    q: 'How do our founders access Startup Preflight?',
    a: 'We issue a single, branded institutional voucher code (e.g. UCD-SUMMER27 or LEO-DUBLIN-BATCH). Founders simply visit startuppreflight.com/redeem, enter the code, and immediately unlock all 12 modules without needing to enter credit card details.',
  },
  {
    q: 'Does this replace our program mentors?',
    a: 'Not at all — it multiplies their impact. Instead of mentors spending their limited sessions deciphering messy 40-page Word documents or debugging broken Excel spreadsheets, founders arrive with structured concept canvases, verified competitor wedges, customer survey evidence, and formatted 3-year cashflows.',
  },
  {
    q: 'Can our cohort startups export official government grant applications?',
    a: 'Yes. Startup Preflight compiles data directly into the official Ireland Local Enterprise Office (LEO) Feasibility & Priming Forms (and Appendices A–F), the UK Innovate UK 9-question IFS format, and the British Business Bank Start Up Loans 4-part workbook.',
  },
  {
    q: 'What happens to the founders after the cohort ends?',
    a: 'Founders retain permanent free read-only access to their validated business plan vault, survey responses, and financial models. They can reference or share their plan anytime as they scale, or choose to keep it live with our micro-subscription.',
  },
  {
    q: 'Can we test the platform before committing our cohort?',
    a: 'Yes. When you submit an inquiry, we will provision a full-access demo sandbox for your program directors and lead mentors to review all 12 modules, survey tools, and grant export features firsthand.',
  },
];

const STARTUPS_DATA = [
  {
    id: 'startup-1',
    name: 'BioPulse Diagnostics',
    category: 'MedTech / Diagnostics',
    founders: 'Dr. Liam Murphy & Elena Rostova',
    avatarBg: 'bg-emerald-600',
    grantFocus: 'Enterprise Ireland PSSF (€100k)',
    targetGrantAmount: '€100,000',
    overallProgress: 88,
    currentModuleNumber: 10,
    currentModuleName: 'Mod J: 3-Year Financial Model & PRSI',
    surveyResponsesCount: 142,
    willingnessToPay: '€450/month Validated',
    status: 'GRANT_READY',
    statusBadge: {
      label: 'Grant Ready (EI PSSF)',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
    },
    oneLiner:
      'Point-of-care saliva biomarker scanner detecting acute respiratory inflammation in 4 minutes.',
    keyMetric: '3 LEO-Compliant Lab Quotes Attached',
    coFounderScore: 96,
    coFounderStatus: 'Optimal Alignment (12/12 Questions)',
    mentorFlag: 'LEO Appendices A–F and EI PSSF business plan fully compiled & contradiction-audited.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 100,
      product: 95,
      team: 96,
      financials: 85,
      grantPack: 90,
    },
  },
  {
    id: 'startup-2',
    name: 'FleetFlow Logistics',
    category: 'Industrial AI & Robotics',
    founders: 'Conor Ryan & Aoife Kelly',
    avatarBg: 'bg-emerald-700',
    grantFocus: 'LEO Priming Grant (€80k / 50%)',
    targetGrantAmount: '€80,000',
    overallProgress: 100,
    currentModuleNumber: 12,
    currentModuleName: 'Mod L: Business Plan & LEO Appendices',
    surveyResponsesCount: 28,
    willingnessToPay: '€1,200/mo Pilot Agreed',
    status: 'GRANT_READY',
    statusBadge: {
      label: '100% Compliant (LEO Pack Ready)',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
    },
    oneLiner:
      'Autonomous micro-forklifts for cross-dock warehouse pallet consolidation.',
    keyMetric: '€184k Projected Y1 Revenue / €42k Funding Gap',
    coFounderScore: 100,
    coFounderStatus: 'Perfect Alignment',
    mentorFlag: 'Official LEO Feasibility/Priming pack compiled with non-displacement certification.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 100,
      product: 100,
      team: 100,
      financials: 100,
      grantPack: 100,
    },
  },
  {
    id: 'startup-3',
    name: 'Verdant Power Tiles',
    category: 'CleanTech / Manufacturing',
    founders: 'Marcus Vance & Tom Sterling',
    avatarBg: 'bg-emerald-700',
    grantFocus: 'Innovate UK Smart Grant (£150k)',
    targetGrantAmount: '£150,000',
    overallProgress: 65,
    currentModuleNumber: 8,
    currentModuleName: 'Mod H: Pocket Profit Breakeven Model',
    surveyResponsesCount: 84,
    willingnessToPay: '£85/sqm Contractor Target',
    status: 'ON_TRACK',
    statusBadge: {
      label: 'On Track (Financial Modeling)',
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      dot: 'bg-emerald-500',
    },
    oneLiner:
      'Building-integrated photovoltaic solar roof tiles engineered for UK building safety codes.',
    keyMetric: 'UK NIC, Pension & Corporation Tax Modeled',
    coFounderScore: 88,
    coFounderStatus: 'Strong Alignment (Minor runway variance)',
    mentorFlag: 'Currently stress-testing Worst-Case & Survival Ramen cashflow in Module H sandbox.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 90,
      product: 80,
      team: 88,
      financials: 65,
      grantPack: 30,
    },
  },
  {
    id: 'startup-4',
    name: 'CareLoop Health',
    category: 'Digital Health / Elder Care',
    founders: 'Sophie Ward & Tariq Al-Mansoor',
    avatarBg: 'bg-amber-600',
    grantFocus: 'British Business Bank Start Up Loans (£50k)',
    targetGrantAmount: '£50,000',
    overallProgress: 44,
    currentModuleNumber: 6,
    currentModuleName: 'Mod F: Blind Co-Founder Alignment',
    surveyResponsesCount: 310,
    willingnessToPay: '£19/mo Family B2C',
    status: 'NEEDS_ATTENTION',
    statusBadge: {
      label: 'Attention: Co-Founder Equity Gap',
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      dot: 'bg-amber-500',
    },
    oneLiner:
      'Family caregiver coordination platform for medication tracking and live vitals monitoring.',
    keyMetric: '310 Waitlist Signups (/v/careloop)',
    coFounderScore: 54,
    coFounderStatus: 'Equity & Time Commitment Discrepancy',
    mentorFlag: 'Sophie submitted 65/35 equity split; Tariq submitted 50/50. Mentor mediation scheduled.',
    modulesBreakdown: {
      ideation: 100,
      surveys: 85,
      product: 60,
      team: 54,
      financials: 15,
      grantPack: 10,
    },
  },
  {
    id: 'startup-5',
    name: 'KiteCommerce API',
    category: 'B2B SaaS / FinTech',
    founders: 'Niall Brogan (Solo Founder)',
    avatarBg: 'bg-blue-600',
    grantFocus: 'LEO Feasibility Study Grant (€15k)',
    targetGrantAmount: '€15,000',
    overallProgress: 32,
    currentModuleNumber: 3,
    currentModuleName: 'Mod C: Mom Test Survey Builder',
    surveyResponsesCount: 16,
    willingnessToPay: 'Exploring €49 vs €99/mo',
    status: 'VALIDATING',
    statusBadge: {
      label: 'In Validation (Drafting Survey)',
      bg: 'bg-blue-100 text-blue-800 border-blue-300',
      dot: 'bg-blue-500',
    },
    oneLiner:
      'Unified multi-currency checkout orchestrator with automatic VAT OSS compliance.',
    keyMetric: 'Survival Budget: €2,200/mo Baseline',
    coFounderScore: 100,
    coFounderStatus: 'Solo Founder Model Complete',
    mentorFlag: 'Needs 3 formal developer quotes to satisfy LEO feasibility criteria (Module D Concierge).',
    modulesBreakdown: {
      ideation: 95,
      surveys: 40,
      product: 30,
      team: 85,
      financials: 20,
      grantPack: 5,
    },
  },
];

export function CohortsPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organizationName: '',
    organizationType: 'UNIVERSITY',
    customOrganizationType: '',
    cohortSize: 'STANDARD_25',
    regionalFocus: 'IE_UK',
    targetStartDate: 'NEXT_QUARTER',
    notes: '',
  });

  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Standardize business plans across all teams',
    'Pre-qualify founders for regional grants (LEO / Innovate UK)',
    'Free up mentor hours from repetitive document reviews',
  ]);

  const [selectedStartupId, setSelectedStartupId] = useState('startup-1');
  const [cohortFilter, setCohortFilter] = useState<'ALL' | 'GRANT_READY' | 'VALIDATING' | 'NEEDS_ATTENTION'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredStartups = STARTUPS_DATA.filter((s) => {
    if (cohortFilter === 'GRANT_READY' && s.status !== 'GRANT_READY') return false;
    if (cohortFilter === 'VALIDATING' && s.status !== 'VALIDATING' && s.status !== 'ON_TRACK') return false;
    if (cohortFilter === 'NEEDS_ATTENTION' && s.status !== 'NEEDS_ATTENTION') return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.founders.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.grantFocus.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeStartup =
    STARTUPS_DATA.find((s) => s.id === selectedStartupId) || STARTUPS_DATA[0];

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await submitCohortInquiryAction({
        name: formData.name,
        email: formData.email,
        organizationName: formData.organizationName,
        organizationType: formData.organizationType,
        customOrganizationType: formData.customOrganizationType,
        cohortSize: formData.cohortSize,
        regionalFocus: formData.regionalFocus,
        targetStartDate: formData.targetStartDate,
        goals: selectedGoals,
        notes: formData.notes,
      });

      if (res.ok) {
        setSubmissionSuccess(true);
      } else {
        setErrorMessage(res.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-700 selection:text-white">
      <MarketingHeader active="cohorts" />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION                                                       */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-b from-white via-slate-50/25 to-slate-50 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs backdrop-blur-sm">
            <GraduationCap className="h-4 w-4 text-emerald-700" />
            <span>Accelerator &amp; Cohort OS</span>
            <span className="text-emerald-300">•</span>
            <span className="font-semibold text-emerald-900">
              Starting at €1,475 for 25 Founder Seats
            </span>
            <span className="hidden text-slate-400 sm:inline">•</span>
            <span className="hidden font-normal text-slate-700 sm:inline">
              Low-Value Procurement Friendly
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            The Operating System for Managing Your{' '}
            <span className="text-slate-900">
              Entire Startup Batch.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Eliminate messy Word docs and broken spreadsheets. Benchmark 20+ startups on a standardized 12-module blueprint, monitor batch health in real time, catch co-founder fallout before Demo Day, and pre-screen grant compliance — all from one institutional director command center.
          </p>

          {/* CTA Cluster */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#cohort-panel-preview" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full h-12 rounded-full bg-emerald-700 px-7 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-emerald-800 sm:w-auto"
              >
                Explore Batch Command Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#pricing" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12 rounded-full border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 sm:w-auto"
              >
                View Batch Pricing &amp; Packages
              </Button>
            </a>
            <a href="#inquiry-form" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 rounded-full px-5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 sm:w-auto"
              >
                <Calendar className="mr-2 h-4 w-4 text-emerald-700" />
                Schedule Walkthrough
              </Button>
            </a>
          </div>

          {/* Trust Banner */}
          <div className="mt-12 rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-xs backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
              <span className="font-semibold tracking-wide text-slate-500 uppercase">
                Institutional Underwriting &amp; Procurement Standards
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Under €2,000 / £2,000 Micro-Procurement Limits
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-700 sm:gap-10">
              <span className="flex items-center gap-1.5">
                <span className="text-base">🇮🇪</span>
                <strong>Ireland LEO</strong> Feasibility &amp; Priming Grants
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base">🇮🇪</span>
                <strong>Enterprise Ireland</strong> New Frontiers &amp; PSSF
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base">🇬🇧</span>
                <strong>Innovate UK</strong> Smart Grants (IFS 9-Question)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base">🇬🇧</span>
                <strong>Start Up Loans</strong> 4-Part Financial Workbook
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. COHORT COMMAND CENTER (REAL-TIME BATCH HEATMAP & STARTUP PROGRESS) */}
      {/* ===================================================================== */}
      <section
        id="cohort-panel-preview"
        className="scroll-mt-16 border-b border-slate-200/80 bg-slate-900 py-16 text-white sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <Badge
              variant="outline"
              className="border-emerald-400/40 bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider"
            >
              Director Command Center
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Real-Time Batch Heatmap &amp; Startup Progress
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-300">
              Interactive preview of what program managers and mentors see inside Startup Preflight. Track completion milestones, detect blind spots before Demo Day, and pre-screen grant compliance.
            </p>
          </div>

          {/* Interactive SaaS Mockup Container */}
          <div className="mt-12 rounded-2xl border border-slate-700 bg-slate-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Window Chrome Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="hidden h-4 w-px bg-slate-700 sm:block" />
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span>NovaUCD &amp; Tangent Venture Batch 2027</span>
                  <Badge className="bg-emerald-700/30 text-emerald-500 border-emerald-600/40 text-[10px] font-mono">
                    24 Startups Active
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="hidden sm:inline">Last Synced: Just now</span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 gap-px border-b border-slate-800 bg-slate-800/60 lg:grid-cols-4">
              <div className="bg-slate-950 p-4 sm:p-5">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Average Batch Progress
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">78%</span>
                  <span className="text-[11px] font-semibold text-emerald-400">+14% this week</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>

              <div className="bg-slate-950 p-4 sm:p-5">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Grant Pre-Flight Ready
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">18 / 24</span>
                  <span className="text-[11px] text-slate-400">LEO &amp; Innovate UK</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Zero 3-quote non-compliances</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 sm:p-5">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Customer Signals Collected
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">1,840</span>
                  <span className="text-[11px] text-slate-400">responses</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-500">
                  Across 24 live <code className="text-slate-300">/v/[slug]</code> surveys
                </div>
              </div>

              <div className="bg-slate-950 p-4 sm:p-5">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Co-Founder Alignment
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">1 Alert</span>
                  <span className="text-[11px] text-slate-400">Equity discrepancy</span>
                </div>
                <div className="mt-2 text-[11px] text-amber-300/90">
                  Flagged before founder dispute
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 p-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCohortFilter('ALL')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    cohortFilter === 'ALL'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  All Startups ({STARTUPS_DATA.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCohortFilter('GRANT_READY')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    cohortFilter === 'GRANT_READY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  Grant-Ready (2)
                </button>
                <button
                  type="button"
                  onClick={() => setCohortFilter('VALIDATING')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    cohortFilter === 'VALIDATING'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  In Progress (2)
                </button>
                <button
                  type="button"
                  onClick={() => setCohortFilter('NEEDS_ATTENTION')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    cohortFilter === 'NEEDS_ATTENTION'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  Needs Attention (1)
                </button>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter startup or founder..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Main Interactive Grid: Startup Horizontal Bars (Left) + Selected Startup Dossier (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Startups List with Horizontal Progress Graphs (7 cols) */}
              <div className="lg:col-span-7 divide-y divide-slate-800/70 overflow-hidden">
                <div className="bg-slate-900/40 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:grid sm:grid-cols-12 gap-2">
                  <div className="col-span-5">Startup &amp; Founders</div>
                  <div className="col-span-4">12-Module Milestone Progress</div>
                  <div className="col-span-3 text-right">Underwriting Status</div>
                </div>

                {filteredStartups.map((startup) => {
                  const isSelected = startup.id === activeStartup.id;
                  return (
                    <div
                      key={startup.id}
                      onClick={() => setSelectedStartupId(startup.id)}
                      className={`cursor-pointer p-4 transition ${
                        isSelected
                          ? 'bg-slate-950/40 border-l-4 border-emerald-600'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2">
                        {/* Startup Name & Founders */}
                        <div className="sm:col-span-5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${startup.avatarBg}`}
                            >
                              {startup.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-xs font-bold text-white">
                                  {startup.name}
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-slate-400">
                                {startup.founders}
                              </p>
                              <p className="truncate text-[10px] text-emerald-500/80">
                                {startup.grantFocus}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Horizontal Progress Graph */}
                        <div className="sm:col-span-4">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-200">
                              {startup.overallProgress}% Complete
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                              {startup.currentModuleName.split(':')[0]}
                            </span>
                          </div>
                          {/* Segmented / Smooth Horizontal Progress Bar */}
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                startup.overallProgress === 100
                                  ? 'bg-emerald-500'
                                  : startup.status === 'NEEDS_ATTENTION'
                                    ? 'bg-amber-500'
                                    : startup.overallProgress > 70
                                      ? 'bg-emerald-500'
                                      : 'bg-blue-500'
                              }`}
                              style={{ width: `${startup.overallProgress}%` }}
                            />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Mod 1: Canvas</span>
                            <span>Mod 12: Grant</span>
                          </div>
                        </div>

                        {/* Status Badge & Action */}
                        <div className="sm:col-span-3 sm:text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              startup.status === 'GRANT_READY'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                : startup.status === 'NEEDS_ATTENTION'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                  : 'bg-slate-950/80 text-emerald-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                startup.status === 'GRANT_READY'
                                  ? 'bg-emerald-400'
                                  : startup.status === 'NEEDS_ATTENTION'
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-600'
                              }`}
                            />
                            {startup.status === 'GRANT_READY'
                              ? 'Grant-Ready'
                              : startup.status === 'NEEDS_ATTENTION'
                                ? 'Alert: Equity'
                                : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Startup Overview Card / Dossier (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${activeStartup.avatarBg}`}
                      >
                        {activeStartup.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {activeStartup.name}
                          </h4>
                          <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                            {activeStartup.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">{activeStartup.founders}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Target Grant</div>
                      <div className="text-xs font-bold text-emerald-400">
                        {activeStartup.targetGrantAmount}
                      </div>
                    </div>
                  </div>

                  {/* One Liner */}
                  <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
                    <span className="font-semibold text-slate-200">Executive Concept:</span>{' '}
                    {activeStartup.oneLiner}
                  </div>

                  {/* Module Breakdown Horizontal Progress Bars */}
                  <div className="mt-5 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Module Milestones
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>1. Concept Canvas &amp; Market (A–B)</span>
                          <span className="font-mono text-emerald-400">{activeStartup.modulesBreakdown.ideation}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activeStartup.modulesBreakdown.ideation}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>2. Customer Survey &amp; Mom-Test (C)</span>
                          <span className="font-mono text-emerald-600">{activeStartup.modulesBreakdown.surveys}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activeStartup.modulesBreakdown.surveys}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>3. Product Build &amp; 3-Quote Concierge (D–E)</span>
                          <span className="font-mono text-blue-400">{activeStartup.modulesBreakdown.product}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${activeStartup.modulesBreakdown.product}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>4. Co-Founder Alignment &amp; Survival Budget (F)</span>
                          <span className={`font-mono ${activeStartup.modulesBreakdown.team < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {activeStartup.modulesBreakdown.team}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${activeStartup.modulesBreakdown.team < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${activeStartup.modulesBreakdown.team}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>5. Pocket Profit 3-Yr Financials &amp; Cashflow (H–J)</span>
                          <span className="font-mono text-emerald-500">{activeStartup.modulesBreakdown.financials}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activeStartup.modulesBreakdown.financials}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>6. Official Grant Mode &amp; Audit (K–L)</span>
                          <span className="font-mono text-emerald-400">{activeStartup.modulesBreakdown.grantPack}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-50/700 rounded-full" style={{ width: `${activeStartup.modulesBreakdown.grantPack}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proof Points & Flags */}
                  <div className="mt-5 space-y-2.5">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Customer Validation Proof</div>
                      <div className="mt-0.5 text-slate-200">
                        <strong>{activeStartup.surveyResponsesCount} verified responses</strong> · {activeStartup.willingnessToPay}
                      </div>
                    </div>

                    <div
                      className={`rounded-lg border p-2.5 text-xs ${
                        activeStartup.status === 'NEEDS_ATTENTION'
                          ? 'border-amber-700/60 bg-amber-950/40 text-amber-200'
                          : 'border-slate-800 bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Mentor Intelligence Note
                      </div>
                      <div className="mt-0.5 leading-relaxed">{activeStartup.mentorFlag}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-4">
                  <a href="#inquiry-form" className="block">
                    <Button
                      size="sm"
                      className="w-full bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Request Live Cohort Demo of This Dashboard →
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2.5 TRANSPARENT BATCH PRICING & PROCUREMENT TIERS                     */}
      {/* ===================================================================== */}
      <section
        id="pricing"
        className="scroll-mt-16 border-b border-slate-200/80 bg-slate-100/70 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider"
            >
              Batch Licensing &amp; Institutional Tiers
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Transparent, Low-Procurement Batch Pricing
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-600">
              Priced under standard institutional and university micro-procurement thresholds (&lt;€2,000 / £2,000) for instant credit card checkout or single-signoff purchase orders.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Standard Batch (25 Seats) */}
            <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Standard Batch
                </span>
                <Badge variant="outline" className="border-slate-300 text-slate-700 text-[10px] font-semibold">
                  25 Founder Seats
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                    €1,475
                  </span>
                  <span className="text-xs font-medium text-slate-500">/ batch</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <span>€59 per founder seat</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">UK: £1,275 • US: $1,595</span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-600">
                Ideal for university venture labs, early-stage incubators, and regional enterprise boards running focused 8-to-12 week founder cohorts.
              </p>

              <div className="mt-6 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>25 full founder program seats</strong> across all 12 modules (A–L)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Director Command Center</strong> with real-time batch progress</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Dropout radar &amp; team alerts</strong> for early intervention</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Blind-Reveal Co-Founder Heatmaps</strong> (Module F)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>LEO, EI &amp; Innovate UK</strong> grant pre-screening</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Public Mom-Test surveys</strong> hosted at startuppreflight.com/v/[slug]</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Permanent Alumni Vault</strong> for read-only long-term tracking</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <a href="#inquiry-form" className="block w-full">
                  <Button
                    onClick={() => setFormData((prev) => ({ ...prev, cohortSize: 'STANDARD_25' }))}
                    className="w-full h-11 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Select Standard Batch (25 Seats)
                  </Button>
                </a>
              </div>
            </div>

            {/* Scale Batch (50 Seats) — Featured */}
            <div className="relative flex flex-col rounded-2xl border-2 border-emerald-600 bg-white p-6 shadow-md sm:p-7">
              <div className="absolute -top-3.5 inset-x-0 flex items-center justify-center text-center">
                <Badge className="bg-emerald-700 text-white border-0 text-[11px] font-bold px-3 py-0.5 shadow-sm text-center justify-center whitespace-nowrap">
                  Most Popular for Accelerators
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Scale Batch
                </span>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                  50 Founder Seats
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                    €2,650
                  </span>
                  <span className="text-xs font-medium text-slate-500">/ batch</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <span>€53 per founder seat (Save 10%)</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">UK: £2,295 • US: $2,875</span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-600">
                Tailored for competitive, multi-track accelerators and leading incubators managing multiple concurrent tracks.
              </p>

              <div className="mt-6 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>50 full founder program seats</strong> across all 12 modules</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Everything in Standard Batch</strong>, plus:</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Up to 3 sub-cohort tracks</strong> (e.g. Health, FinTech, Climate)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>60-minute live mentor onboarding</strong> &amp; calibration session</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Consolidated funder &amp; board impact pack</strong> (CSV + PDF export)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Custom invite slug &amp; branded cohort welcome</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Priority institutional Slack / WhatsApp support</strong></span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <a href="#inquiry-form" className="block w-full">
                  <Button
                    onClick={() => setFormData((prev) => ({ ...prev, cohortSize: 'SCALE_50' }))}
                    className="w-full h-11 rounded-xl bg-emerald-700 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
                  >
                    Select Scale Batch (50 Seats)
                  </Button>
                </a>
              </div>
            </div>

            {/* Annual Portfolio (100+ Seats) */}
            <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Annual Portfolio
                </span>
                <Badge variant="outline" className="border-slate-300 text-slate-700 text-[10px] font-semibold">
                  100+ Founder Seats
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                    From €4,500
                  </span>
                  <span className="text-xs font-medium text-slate-500">/ year</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <span>Volume tiered per intake</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">UK: £3,900 • US: $4,900</span>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-600">
                For university entrepreneurship centres, multi-campus innovation hubs, and national enterprise networks with ongoing annual intakes.
              </p>

              <div className="mt-6 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>100+ rolling founder seats</strong> across 12 months</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Everything in Scale Batch</strong>, plus:</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Unlimited cohorts &amp; recurring seasonal intakes</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Custom regional grant rubrics</strong> &amp; university criteria</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Dedicated Partner Success Manager</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>LMS &amp; university SSO integration</strong> readiness</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span><strong>Formal vendor setup</strong>, VAT invoicing &amp; PO payment</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                <a href="#inquiry-form" className="block w-full">
                  <Button
                    onClick={() => setFormData((prev) => ({ ...prev, cohortSize: 'CAMPUS_100' }))}
                    variant="outline"
                    className="w-full h-11 rounded-xl border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Contact for Institutional Plan
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Institutional Procurement Assurance Banner */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Institutional Micro-Procurement Friendly (&lt;€2,000 / £2,000)
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Our Standard Batch (€1,475 / £1,275) fits within low-value micro-procurement thresholds for Ireland (LEO, EI, Universities) and the UK (Universities, Growth Hubs), allowing departmental card payment or single PO sign-off with zero public tender delays.
                  </p>
                </div>
              </div>
              <a href="#inquiry-form" className="shrink-0">
                <Button size="sm" variant="outline" className="border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Request Instant Quote / PO
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. THE PROBLEM: "The Cohort Review Bottleneck"                         */}
      {/* ===================================================================== */}
      <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider">
              The Accelerator Bottleneck
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Why Managing Early-Stage Batches Breaks Down
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Program managers and lead mentors waste 60%+ of their advisory time deciphering broken templates instead of driving commercial strategy.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                The 40-Page Messy Doc Trap
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Every founder submits their plan in a different format—half-finished Notion docs, 60-page PDF brain dumps, or formula-broken Excel spreadsheets. Comparing progress across 25 startups becomes impossible.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Fatal Disputes &amp; Runway Shocks Discovered Too Late
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Unresolved equity splits, co-founder commitment fallout, and catastrophic runway miscalculations stay hidden until Week 10—right before Demo Day or statutory grant submission deadlines.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Users2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Mentors Trapped in "Document Janitor Work"
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Advisors spend critical 1-on-1 coaching sessions explaining basic TAM/SAM/SOM definitions or repairing broken unit economics rather than opening customer doors and sharpening market wedge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. THE SOLUTION: The 5 Core Pillars for Program Directors              */}
      {/* ===================================================================== */}
      <section className="border-b border-slate-200/80 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              The Preflight Architecture
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              5 Executive Pillars for Accelerator &amp; Program Directors
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              A single, rigorous standard that turns early-stage cohorts into high-performing, grant-ready ventures.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold">
                  01
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Standardized 12-Module Batch Architecture (Apples-to-Apples Portfolio Review)
                    </h3>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 text-[11px]">
                      Capture First, Expand Second
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Every startup in your cohort progresses through an identical, rigorous standard—from problem-founder fit and Mom-Test customer surveys to 3-year cashflow models and supplier quotes. Program directors can instantly benchmark 25+ teams on an objective, unified rubric.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  02
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Real-Time Cohort Health &amp; Early Dropout Radar (Intervene in Week 3, Not Week 10)
                    </h3>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[11px]">
                      Zero Blind Spots
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Monitor active completion velocity across every module. Our automated alert engine flags teams stalled in ideation, struggling with survey collection, or exhibiting early dropout signals—enabling program directors to intervene proactively before teams quit.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold">
                  03
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Mentor Capacity &amp; Advisor ROI Multiplier (Zero Document Janitor Work)
                    </h3>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 text-[11px]">
                      High-Leverage Coaching
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Eliminate hours of advisor onboarding and doc-sorting. Mentors arrive at 1-on-1 sessions with an auto-synthesized 1-page preflight brief, high-confidence unit economics, and verified survey proof—unlocking pure strategic leverage.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white font-bold">
                  04
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Statutory Grant Pre-Screening &amp; Funder Reporting (LEO, Enterprise Ireland &amp; Innovate UK)
                    </h3>
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[11px]">
                      Statutory Compliance
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Pre-checks every team's plan against statutory regional grant rules: LEO 3-quote supplier schedules, laptop expenditure caps, and export/non-displacement tests in Ireland; Innovate UK IFS 9-question rubrics and Start Up Loans in the UK. Turn batch outcomes into auditable funder reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  05
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Investor-Grade Demo Day Curation &amp; Alumni Living Vault (Permanent Ecosystem Value)
                    </h3>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[11px]">
                      Permanent Ecosystem Value
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Curate high-signal venture profiles for demo day investors. When the program concludes, founders retain permanent read-only access to their living preflight vault, ensuring long-term institutional alumni value and longitudinal tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. WHO WE PARTNER WITH                                                */}
      {/* ===================================================================== */}
      <section className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              Ecosystem Archetypes
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Tailored for Every Stage of Institutional Support
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-6 transition hover:border-emerald-300 hover:shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  University Incubators &amp; Venture Labs
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Ideal for student entrepreneurs, academic researchers, and university spin-outs. Provides the structured scaffolding needed to turn research into commercial viability without getting lost in jargon.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 transition hover:border-emerald-300 hover:shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Regional Enterprise Boards &amp; Growth Hubs
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Equips Local Enterprise Offices (LEOs) and UK Growth Hubs with an automated feasibility compiler that ensures founders meet strict public grant criteria before submitting funding applications.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 transition hover:border-emerald-300 hover:shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Seed Accelerators &amp; Syndicate Networks
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Accelerates portfolio companies from raw concept to investor-grade pitch within 8–12 weeks. Ensures founders understand their unit economics and customer acquisition channels before pitch day.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 transition hover:border-amber-300 hover:shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Corporate Venture Studios &amp; Innovation Labs
                </h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Enables corporate venture teams to run rapid 14-day concept validation sprints across dozens of internal ideas, filtering low-potential initiatives before committing build capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. QUALIFICATION & DEMO INQUIRY FORM                                  */}
      {/* ===================================================================== */}
      <section id="inquiry-form" className="scroll-mt-20 border-b border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Get Started
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Request Cohort Licensing &amp; Schedule a Demo
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-600">
              Tell us about your upcoming batch and we will prepare a tailored demonstration and platform walkthrough for your team within 24 hours.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-xs sm:p-8">
            {submissionSuccess ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-emerald-950">
                  Inquiry Received Successfully!
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-emerald-800">
                  Thank you for reaching out. Founder Thomas Walsh will review your program details and follow up directly at{' '}
                  <strong>{formData.email}</strong> within 24 hours.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="https://www.linkedin.com/in/twalsh-start-ups/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800">
                      Connect on LinkedIn
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSubmissionSuccess(false);
                      setFormData({
                        name: '',
                        email: '',
                        organizationName: '',
                        organizationType: 'UNIVERSITY',
                        customOrganizationType: '',
                        cohortSize: 'STANDARD_25',
                        regionalFocus: 'IE_UK',
                        targetStartDate: 'NEXT_QUARTER',
                        notes: '',
                      });
                    }}
                    className="border-emerald-300 text-xs text-emerald-800 hover:bg-emerald-100"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                    {errorMessage}
                  </div>
                )}

                {/* Name & Work Email */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-name" className="text-xs font-bold text-slate-700">
                      Your Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cohort-name"
                      type="text"
                      required
                      placeholder="e.g. Dr. Fiona O'Connor"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-10 bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-email" className="text-xs font-bold text-slate-700">
                      Work Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cohort-email"
                      type="email"
                      required
                      placeholder="e.g. f.oconnor@university.ie"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-10 bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Organization Name & Type */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-org" className="text-xs font-bold text-slate-700">
                      Organization / Program Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cohort-org"
                      type="text"
                      required
                      placeholder="e.g. NovaUCD Student Accelerator"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className="h-10 bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-type" className="text-xs font-bold text-slate-700">
                      Organization Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="cohort-type"
                      value={formData.organizationType}
                      onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="UNIVERSITY">University Incubator / Venture Lab</option>
                      <option value="LEO_GROWTH_HUB">Regional Enterprise Board (LEO / Growth Hub)</option>
                      <option value="ACCELERATOR">Seed Accelerator / VC Studio</option>
                      <option value="COWORKING">Co-Working Space / Community Hub</option>
                      <option value="OTHER">Other Institutional Body</option>
                    </select>
                  </div>
                </div>

                {formData.organizationType === 'OTHER' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-custom-type" className="text-xs font-bold text-slate-700">
                      Please specify your organization type
                    </Label>
                    <Input
                      id="cohort-custom-type"
                      type="text"
                      placeholder="e.g. National Non-Profit Entrepreneurship Foundation"
                      value={formData.customOrganizationType}
                      onChange={(e) => setFormData({ ...formData, customOrganizationType: e.target.value })}
                      className="h-10 bg-white text-xs"
                    />
                  </div>
                )}

                {/* Cohort Size & Regional Focus */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-size" className="text-xs font-bold text-slate-700">
                      Estimated Cohort / Batch Size <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="cohort-size"
                      value={formData.cohortSize}
                      onChange={(e) => setFormData({ ...formData, cohortSize: e.target.value })}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="STANDARD_25">Standard Batch — 25 Seats (€1,475 / £1,275)</option>
                      <option value="SCALE_50">Scale Batch — 50 Seats (€2,650 / £2,295)</option>
                      <option value="CAMPUS_100">Annual Portfolio — 100+ Seats (From €4,500 / £3,900)</option>
                      <option value="CUSTOM">Custom Multi-Campus / Rolling Intakes</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-region" className="text-xs font-bold text-slate-700">
                      Primary Regional Focus
                    </Label>
                    <select
                      id="cohort-region"
                      value={formData.regionalFocus}
                      onChange={(e) => setFormData({ ...formData, regionalFocus: e.target.value })}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="IE">Ireland (LEO, Enterprise Ireland, SURE)</option>
                      <option value="UK">United Kingdom (Innovate UK, Start Up Loans, SEIS)</option>
                      <option value="IE_UK">Both Ireland &amp; UK</option>
                      <option value="GLOBAL">Global / North America / Europe</option>
                    </select>
                  </div>
                </div>

                {/* Target Start Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="cohort-start" className="text-xs font-bold text-slate-700">
                    Target Batch Start Date / Intake
                  </Label>
                  <select
                    id="cohort-start"
                    value={formData.targetStartDate}
                    onChange={(e) => setFormData({ ...formData, targetStartDate: e.target.value })}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="IMMEDIATE">Immediate (Next 30 days)</option>
                    <option value="NEXT_2_MONTHS">Next 2–3 Months</option>
                    <option value="NEXT_QUARTER">Next Semester / Quarter</option>
                    <option value="BUDGET_PLANNING">Exploring for Future Budget Cycle</option>
                  </select>
                </div>

                {/* Program Goals */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    What are your primary goals for this batch? (Select all that apply)
                  </Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {GOAL_OPTIONS.map((goal) => {
                      const isChecked = selectedGoals.includes(goal);
                      return (
                        <button
                          type="button"
                          key={goal}
                          onClick={() => toggleGoal(goal)}
                          className={`flex items-start gap-2 rounded-lg border p-2.5 text-left text-xs transition ${
                            isChecked
                              ? 'border-emerald-400 bg-emerald-50/70 text-slate-950 font-medium'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                              isChecked
                                ? 'border-emerald-700 bg-emerald-700 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="h-2.5 w-2.5" />}
                          </div>
                          <span className="leading-tight">{goal}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="cohort-notes" className="text-xs font-bold text-slate-700">
                    Additional Program Notes or Specific Requirements (Optional)
                  </Label>
                  <textarea
                    id="cohort-notes"
                    rows={3}
                    placeholder="Tell us about your program structure, mentor count, or any specific rubrics needed..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-emerald-700 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Submitting Program Inquiry...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Submit Cohort Inquiry &amp; Get Program Overview →
                    </span>
                  )}
                </Button>

                {/* Alternative Calendar Hook */}
                <div className="pt-2 text-center text-xs text-slate-500">
                  Prefer a direct conversation?{' '}
                  <a
                    href="https://www.linkedin.com/in/twalsh-start-ups/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    Reach Founder Thomas Walsh directly on LinkedIn ↗
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. PROGRAM DIRECTOR FAQS                                              */}
      {/* ===================================================================== */}
      <section className="border-b border-slate-200/80 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              Common Questions
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Frequently Asked Questions for Program Directors
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4.5 text-left text-xs font-bold text-slate-900 sm:text-sm hover:text-emerald-700"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4.5 text-xs leading-relaxed text-slate-600">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
