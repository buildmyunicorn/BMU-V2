'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Globe2,
  UserCircle2,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Coins,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  loadBmuSession,
  completeFounderOnboarding,
  type FounderStage,
  type TeamStructure,
  type IndustryCategory,
} from '@/lib/auth/session-store';
import {
  getCountryRulePack,
  getGrantsForCountry,
  type SupportedCountryCode,
} from '@/lib/localization';
import type { StartupHat } from '@/db/schema';

const FOUNDER_STAGES: Array<{
  id: FounderStage;
  label: string;
  desc: string;
}> = [
  {
    id: 'IDEA_EXPLORER',
    label: '💡 Exploring a New Idea',
    desc: 'Getting the concept out of my head and checking if it has legs',
  },
  {
    id: 'BUILDING_MVP',
    label: '🛠️ Building MVP / Side-Hustle',
    desc: 'Validating with early users before quitting the day job',
  },
  {
    id: 'LAUNCHED_SEEKING_FUNDING',
    label: '🚀 Seeking Grants or Investors',
    desc: 'Need a bank-ready, LEO/EI grant-ready or angel-ready plan',
  },
  {
    id: 'ACCELERATOR_COHORT',
    label: '🎓 University / LEO / Accelerator Cohort',
    desc: 'Completing structured validation as part of a program',
  },
];

const STARTUP_HATS_OPTIONS: Array<{ id: StartupHat; label: string }> = [
  { id: 'PRODUCT_TECH', label: '💻 Product & Tech Build' },
  { id: 'SALES', label: '🤝 Sales & Commercial' },
  { id: 'MARKETING', label: '📣 Marketing & Growth' },
  { id: 'OPERATIONS_ADMIN', label: '⚙️ Operations & Domain Expert' },
  { id: 'VISION_INVESTOR', label: '🧭 Vision & Strategy' },
  { id: 'FINANCE_BOOKS', label: '📊 Finance & Numbers' },
];

const INDUSTRY_OPTIONS: IndustryCategory[] = [
  'B2B SaaS / AI App',
  'Consumer App / Marketplace',
  'E-Commerce / Physical Product / Food & Drink',
  'Service / Agency / Consulting',
  'Hardware / MedTech / DeepTech',
  'Brick & Mortar / Hospitality / Local Business',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [founderName, setFounderName] = useState('Founder');

  // Card A State: About the Founder
  const [founderStage, setFounderStage] =
    useState<FounderStage>('IDEA_EXPLORER');
  const [teamStructure, setTeamStructure] = useState<TeamStructure>('SOLO');
  const [primaryHat, setPrimaryHat] = useState<StartupHat>('PRODUCT_TECH');
  const [regionOrCounty, setRegionOrCounty] = useState('Dublin');

  // Card B State: First Startup Plan Setup
  const [planTitle, setPlanTitle] = useState('');
  const [oneLinerSummary, setOneLinerSummary] = useState('');
  const [hqCountryCode, setHqCountryCode] =
    useState<SupportedCountryCode>('IE');
  const [industryCategory, setIndustryCategory] =
    useState<IndustryCategory>('B2B SaaS / AI App');
  const [exportPotential, setExportPotential] = useState<
    'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY'
  >('EXPORTING_INTERNATIONALLY');

  useEffect(() => {
    const session = loadBmuSession();
    if (session?.user?.name) {
      setFounderName(session.user.name);
    }
  }, []);

  const countryPack = getCountryRulePack(hqCountryCode);
  const countryGrants = getGrantsForCountry(hqCountryCode);

  function handleCompleteOnboarding(e: React.FormEvent) {
    e.preventDefault();
    completeFounderOnboarding({
      founderStage,
      teamStructure,
      primaryHat,
      regionOrCounty,
      planTitle: planTitle.trim() || 'GreenCart AI — Zero-Waste Grocery',
      oneLinerSummary:
        oneLinerSummary.trim() ||
        'Automated expiry prediction & dynamic markdowns for independent supermarkets.',
      hqCountryCode,
      industryCategory,
      exportPotential,
    });
    router.push('/workspace');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Welcome, {founderName}! Let&apos;s Set Up Your First Workspace
                </h1>
                <Badge variant="default">Step 2 of 2 (60 Seconds)</Badge>
              </div>
              <p className="text-xs text-slate-500">
                This configures your AI Co-Pilot examples, local tax &amp; payroll benchmarks, and government grant matcher.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCompleteOnboarding} className="space-y-6">
          {/* CARD A: ABOUT YOU AS A FOUNDER */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCircle2 className="h-5 w-5 text-indigo-600" />
                Part 1: About You as a Founder
              </CardTitle>
              <CardDescription>
                Helps Ask Unicorn tailor its guidance and pre-fills your Day-1 Startup Hats in Module C.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Stage Selector */}
              <div className="space-y-2">
                <Label>1. Where are you right now on your journey?</Label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {FOUNDER_STAGES.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setFounderStage(stage.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        founderStage === stage.id
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">
                        {stage.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {stage.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Solo vs Co-Founders + Primary Superpower Hat */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>2. Are you building Solo or with Co-Founders?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'SOLO', label: 'Solo Founder' },
                      { id: 'CO_FOUNDERS', label: 'With Co-Founders' },
                      { id: 'LOOKING_FOR_COFOUNDER', label: 'Seeking Co-Founder' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setTeamStructure(t.id as TeamStructure)
                        }
                        className={`rounded-lg border px-2.5 py-2 text-xs font-medium ${
                          teamStructure === t.id
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>3. Your #1 Superpower (Pre-fills Module C Hats)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTUP_HATS_OPTIONS.map((hat) => (
                      <button
                        key={hat.id}
                        type="button"
                        onClick={() => setPrimaryHat(hat.id)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                          primaryHat === hat.id
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {hat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD B: YOUR FIRST STARTUP WORKSPACE & LOCALIZATION */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="h-5 w-5 text-indigo-600" />
                Part 2: Your First Startup Plan &amp; Jurisdiction Rules
              </CardTitle>
              <CardDescription>
                You can create or clone additional plans anytime. Every plan has its own Home Country, Currency, and Grant Rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-title">
                    Working Title or Codename for Your Idea
                  </Label>
                  <Input
                    id="plan-title"
                    placeholder="e.g. GreenCart AI (or Project Apollo)"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="region-county">
                    City / County / State (For Local LEO / Hub Matching)
                  </Label>
                  <Input
                    id="region-county"
                    placeholder="e.g. Dublin, Galway, London, Austin"
                    value={regionOrCounty}
                    onChange={(e) => setRegionOrCounty(e.target.value)}
                  />
                </div>
              </div>

              {/* HQ Country & Base Currency Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Globe2 className="h-4 w-4 text-indigo-600" />
                  Home / Incorporation Country &amp; Base Currency
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {(
                    [
                      { code: 'IE', flag: '🇮🇪', label: 'Ireland (€)' },
                      { code: 'GB', flag: '🇬🇧', label: 'UK (£)' },
                      { code: 'US', flag: '🇺🇸', label: 'USA ($)' },
                      { code: 'AU', flag: '🇦🇺', label: 'Australia ($)' },
                      { code: 'CA', flag: '🇨🇦', label: 'Canada ($)' },
                      { code: 'EU', flag: '🇪🇺', label: 'EU (€)' },
                      { code: 'ROW', flag: '🌍', label: 'Global ($)' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setHqCountryCode(c.code)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                        hqCountryCode === c.code
                          ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-950 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="mt-1 text-[11px]">{c.label}</span>
                    </button>
                  ))}
                </div>

                {/* Live Country Rule Pack Confirmation Box */}
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Loaded {countryPack.countryName} ({countryPack.defaultCurrency}) Rule Pack:
                  </div>
                  <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3 text-[11px]">
                    <div className="rounded-lg bg-white/80 p-2">
                      <strong>Indirect Tax:</strong> {countryPack.taxName} (
                      {countryPack.standardTaxRatePercent}%)
                    </div>
                    <div className="rounded-lg bg-white/80 p-2">
                      <strong>Payroll Tax:</strong>{' '}
                      {countryPack.employerPayrollTaxName} (
                      {countryPack.employerPayrollTaxPercent}%)
                    </div>
                    <div className="rounded-lg bg-white/80 p-2">
                      <strong>Matched Grants:</strong> {countryGrants.length}{' '}
                      active ({countryGrants[0]?.grantName ?? 'National R&D'})
                    </div>
                  </div>
                </div>
              </div>

              {/* Industry Category Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Industry / Business Model (Tailors &ldquo;Show Me an Example&rdquo; Coaching)
                </Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustryCategory(ind)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                        industryCategory === ind
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Selling Geography (Crucial for Export Grants like LEO / EI / EMDG) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-indigo-600" />
                  Where Will Your Customers Live? (Informs Export Grant Eligibility)
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setExportPotential('DOMESTIC_ONLY')}
                    className={`rounded-xl border p-3 text-left text-xs ${
                      exportPotential === 'DOMESTIC_ONLY'
                        ? 'border-indigo-600 bg-indigo-50/70 font-semibold text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div>🏠 Domestic / Local Market Only ({countryPack.countryName})</div>
                    <div className="mt-0.5 text-[11px] font-normal text-slate-500">
                      Serving local consumers or businesses inside {countryPack.countryName}.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setExportPotential('EXPORTING_INTERNATIONALLY')
                    }
                    className={`rounded-xl border p-3 text-left text-xs ${
                      exportPotential === 'EXPORTING_INTERNATIONALLY'
                        ? 'border-indigo-600 bg-indigo-50/70 font-semibold text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div>🌍 International / Export Potential (UK, EU, US, Global)</div>
                    <div className="mt-0.5 text-[11px] font-normal text-slate-500">
                      Unlocks export-focused grants (e.g. LEO Feasibility/Priming, Enterprise Ireland PSSF, Austrade EMDG).
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Quick 1-Sentence Idea Teaser */}
              <div className="space-y-1.5">
                <Label htmlFor="one-liner">
                  Optional: In 1 messy sentence, what is the idea? (You can refine this in Module A next)
                </Label>
                <Input
                  id="one-liner"
                  placeholder="e.g. An app that helps independent supermarkets predict expiring produce and discount it automatically"
                  value={oneLinerSummary}
                  onChange={(e) => setOneLinerSummary(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 pt-4">
                <Button type="submit" size="lg">
                  Launch My Startup Workspace (Module A)
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
