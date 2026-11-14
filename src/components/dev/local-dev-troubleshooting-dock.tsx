'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  FileCode,
  Database,
  Cpu,
  User,
  Shield,
  CreditCard,
  Globe,
  RefreshCw,
  ExternalLink,
  Sliders,
  Terminal,
  Activity,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  getLocalDevDiagnosticsAction,
  type DevDiagnosticsData,
} from '@/app/actions/dev-diagnostics';
import {
  loadBmuSession,
  saveBmuSession,
  type BmuLocalSession,
  type ActiveStartupPlan,
} from '@/lib/auth/session-store';

interface RouteGuide {
  title: string;
  pageFile: string;
  primaryComponents: string[];
  serverActions: string[];
  schemaTables: string[];
  notes: string;
}

const MODULE_GUIDE: Record<
  string,
  {
    name: string;
    component: string;
    action: string;
    tables: string[];
    description: string;
  }
> = {
  MOD_A_IDEATION: {
    name: 'Module A: Ideation & Concept Canvas',
    component: 'src/components/workspace/module-a-grant-checker-step.tsx',
    action: 'src/app/actions/module-a.ts',
    tables: ['startup_plans', 'early_access_waitlist'],
    description: 'Founder motivations, 1-page canvas, domain availability & geo pre-selection.',
  },
  MOD_B_MARKET: {
    name: 'Module B: Market & Competitors',
    component: 'src/components/workspace/module-b-workspace.tsx',
    action: 'src/app/actions/module-b.ts',
    tables: ['plan_modules_data'],
    description: 'Beachhead persona, AI competitor scout, TAM/SAM/SOM, and competitive wedge.',
  },
  MOD_C_SURVEYS_FEEDBACK: {
    name: 'Module C: Surveys & Waitlist Engine',
    component: 'src/components/workspace/module-c-workspace.tsx',
    action: 'src/app/actions/module-c.ts',
    tables: ['validation_surveys', 'survey_responses'],
    description: 'Mom-Test bias-free survey builder, public /v/[slug] page & interview logger.',
  },
  MOD_D_PRODUCT_BUILD: {
    name: 'Module D: Product & Build Architecture',
    component: 'src/components/workspace/module-d-workspace.tsx',
    action: 'src/app/actions/module-d.ts',
    tables: ['plan_modules_data', 'partner_offers'],
    description: 'Product vehicle selector, own vs rent channel, 3-tier build vs buy & work packages.',
  },
  MOD_E_OPERATIONS: {
    name: 'Module E: Operations & Risk Register',
    component: 'src/components/workspace/module-e-workspace.tsx',
    action: 'src/app/actions/module-e.ts',
    tables: ['plan_modules_data', 'partner_offers'],
    description: 'Day in life of order, premises & equipment schedule, 4-category risk register.',
  },
  MOD_F_COFOUNDER_TEAM: {
    name: 'Module F: Team & Co-Founder Alignment',
    component: 'src/components/workspace/module-f-workspace.tsx',
    action: 'src/app/actions/module-f.ts',
    tables: ['plan_modules_data'],
    description: '150-word promoter CVs, personal survival budget, blind-reveal 12 awkward questions.',
  },
  MOD_G_LAUNCHPAD: {
    name: 'Module G: Launchpad & Operations Hub',
    component: 'src/components/workspace/module-g-workspace.tsx',
    action: 'src/app/actions/module-g.ts',
    tables: ['partner_offers', 'partner_referral_events'],
    description: 'Readiness score across 6 cards (incorporation, banking, accounting, insurance).',
  },
  MOD_H_REVENUE: {
    name: 'Module H: Pricing & Pocket Profit Crossover',
    component: 'src/components/workspace/module-h-workspace.tsx',
    action: 'src/app/actions/module-h.ts',
    tables: ['plan_modules_data'],
    description: 'Pricing architect, written assumptions, 3-year breakeven & what-if sandbox.',
  },
  MOD_I_MARKETING: {
    name: 'Module I: Marketing & First 10 Customers',
    component: 'src/components/workspace/module-i-workspace.tsx',
    action: 'src/app/actions/module-i.ts',
    tables: ['plan_modules_data'],
    description: 'Brand positioning, 4Ps strategy, digital presence & reverse marketing budget.',
  },
  MOD_J_FINANCE: {
    name: 'Module J: 3-Year Finance & Cashflow',
    component: 'src/components/workspace/module-j-workspace.tsx',
    action: 'src/app/actions/module-j.ts',
    tables: ['plan_modules_data'],
    description: 'No-spreadsheet financial builder, localized overheads, cashflow trough & funding gap.',
  },
  MOD_K_GRANTS_FUNDING: {
    name: 'Module K: Grants & Tax Relief Hub',
    component: 'src/components/workspace/module-k-workspace.tsx',
    action: 'src/app/actions/module-k.ts',
    tables: ['grant_applications', 'grants_radar', 'plan_modules_data'],
    description: 'Non-dilutive matcher (LEO, Innovate UK, Start Up Loans, R&D tax credit, SEIS/EIS).',
  },
  MOD_L_BUSINESS_PLAN: {
    name: 'Module L: Business Plan & Grant Compiler',
    component: 'src/components/workspace/module-l-workspace.tsx',
    action: 'src/app/actions/module-l.ts',
    tables: ['compiled_business_plans', 'plan_modules_data'],
    description: 'Interactive business plan compiler supporting 5 official IE/UK committee formats.',
  },
  MASTER_DOCUMENT: {
    name: 'Master Living Document Studio',
    component: 'src/components/workspace/master-document-workspace.tsx',
    action: 'src/app/actions/master-document.ts',
    tables: ['startup_plans', 'plan_modules_data'],
    description: 'Synchronized live view of all modules weaving real-time evidence into unified plan.',
  },
  ASK_MY_STARTUP: {
    name: 'Ask Preflight AI / Startup Sidekick',
    component: 'src/components/workspace/ask-my-startup-view.tsx',
    action: 'src/app/actions/ask-startup.ts',
    tables: ['ai_usage_logs', 'startup_plans'],
    description: 'Context-aware AI companion with deep plan memory and instant coaching.',
  },
  GRANT_APPLICATIONS: {
    name: 'Grant Application Center',
    component: 'src/components/workspace/grant-application-center-view.tsx',
    action: 'src/app/actions/grant-applications.ts',
    tables: ['grant_applications'],
    description: 'Pre-flight dossier tracking and agency submission portal.',
  },
};

export function LocalDevTroubleshootingDock() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();

  // Environment gate
  const [isLocal, setIsLocal] = useState<boolean>(false);
  const [dockState, setDockState] = useState<'minimized' | 'bar' | 'expanded'>('bar');
  const [activeTab, setActiveTab] = useState<'code' | 'auth' | 'services' | 'tools'>('code');

  // Diagnostics & Local data
  const [diagnostics, setDiagnostics] = useState<DevDiagnosticsData | null>(null);
  const [bmuSession, setBmuSession] = useState<BmuLocalSession | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>('IE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Module context in workspace
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>('MOD_A_IDEATION');

  // 1. Initial local check
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname.toLowerCase();
    const isLocalEnv =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      process.env.NODE_ENV !== 'production';

    setIsLocal(isLocalEnv);

    if (isLocalEnv) {
      // Load saved dock preference
      const savedState = window.localStorage.getItem('spf_dev_dock_state') as
        | 'minimized'
        | 'bar'
        | 'expanded'
        | null;
      if (savedState) setDockState(savedState);

      // Load session
      const sess = loadBmuSession();
      setBmuSession(sess);

      // Load region cookie
      const match = document.cookie.match(/(?:^|; )spf_region=([^;]*)/);
      if (match) {
        setActiveRegion(decodeURIComponent(match[1]));
      } else {
        const localReg = window.localStorage.getItem('spf_region');
        if (localReg) setActiveRegion(localReg);
      }

      // Fetch server diagnostics
      refreshDiagnostics();
    }
  }, []);

  // 2. Synchronize active workspace module from query params or localStorage
  useEffect(() => {
    if (pathname.includes('/workspace')) {
      const moduleParam = searchParams.get('module') || searchParams.get('m');
      if (moduleParam && MODULE_GUIDE[moduleParam]) {
        setSelectedModuleKey(moduleParam);
      } else {
        // Fallback: check localStorage for active module or keep MOD_A
        const savedMod = window.localStorage.getItem('bmu_active_module_key');
        if (savedMod && MODULE_GUIDE[savedMod]) {
          setSelectedModuleKey(savedMod);
        }
      }
    }
  }, [pathname, searchParams]);

  const refreshDiagnostics = () => {
    startTransition(async () => {
      try {
        const data = await getLocalDevDiagnosticsAction();
        setDiagnostics(data);
      } catch (err) {
        console.warn('[DevDock] Failed to refresh server diagnostics:', err);
      }
    });
  };

  const setDockMode = (mode: 'minimized' | 'bar' | 'expanded') => {
    setDockState(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('spf_dev_dock_state', mode);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleSwitchRegion = (regionCode: string) => {
    document.cookie = `spf_region=${regionCode}; path=/; max-age=7776000; SameSite=Lax`;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('spf_region', regionCode);
    }
    setActiveRegion(regionCode);
    window.location.reload();
  };

  const handleSwitchActivePlan = (planId: string) => {
    if (!bmuSession) return;
    const updated = { ...bmuSession, activePlanId: planId };
    saveBmuSession(updated);
    setBmuSession(updated);
    window.location.reload();
  };

  const handleCopyAiContextDump = () => {
    const activePlan = bmuSession?.plans?.find(
      (p) => p.id === bmuSession.activePlanId
    ) || bmuSession?.plans?.[0];

    const currentModule = pathname.includes('/workspace')
      ? MODULE_GUIDE[selectedModuleKey]
      : null;

    const dump = `### Startup Preflight Local Dev Context
- **Current URL:** \`${pathname}${window.location.search || ''}\`
- **Route Component:** \`${getRouteGuide(pathname).pageFile}\`
${
  currentModule
    ? `- **Active Module:** \`${selectedModuleKey}\` (${currentModule.name})
- **Active Workspace Component:** \`${currentModule.component}\`
- **Primary Server Action:** \`${currentModule.action}\`
- **DB Tables Involved:** \`${currentModule.tables.join(', ')}\``
    : `- **Primary Page Component:** \`${getRouteGuide(pathname).primaryComponents.join(', ')}\`
- **Primary Server Action:** \`${getRouteGuide(pathname).serverActions.join(', ')}\`
- **DB Tables:** \`${getRouteGuide(pathname).schemaTables.join(', ')}\``
}
- **Region / Currency:** \`${activeRegion}\` (${activeRegion === 'IE' ? 'EUR / LEO' : activeRegion === 'GB' ? 'GBP / Innovate UK' : 'USD / Global'})
- **Logged-in User:** \`${bmuSession?.user?.email || diagnostics?.userSession?.email || 'Anonymous/Guest'}\`
- **User Role / Pass:** \`${bmuSession?.entitlement?.planType || 'FREE_HOOK'}\`
- **Active Plan ID:** \`${activePlan?.id || 'None'}\` ("${activePlan?.title || 'Untitled Plan'}")
- **AI Router Status:** \`${diagnostics?.aiCallsToday ?? 0} / ${diagnostics?.aiDailyCeiling ?? 500}\` platform calls today
- **Database Status:** \`${diagnostics?.dbConnected ? 'Connected (Local Postgres)' : 'Offline/Error'}\`
- **Stripe Mode:** \`${diagnostics?.stripeMode || 'NOT_CONFIGURED'}\`
`;

    copyToClipboard(dump, 'ai_dump');
  };

  // If not local host, render absolutely nothing for production safety
  if (!isLocal) {
    return null;
  }

  const routeGuide = getRouteGuide(pathname);
  const activePlan = bmuSession?.plans?.find(
    (p) => p.id === bmuSession.activePlanId
  ) || bmuSession?.plans?.[0];

  // ==========================================
  // 1. MINIMIZED FLOATING PILL
  // ==========================================
  if (dockState === 'minimized') {
    return (
      <aside
        aria-label="Developer diagnostics quick toggle"
        className="fixed bottom-3 right-3 z-[9999] print:hidden"
      >
        <button
          type="button"
          onClick={() => setDockMode('bar')}
          className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/95 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md transition-all hover:border-emerald-500 hover:text-white"
          title="Open Local Dev Troubleshooting Dock"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wrench className="h-3.5 w-3.5 text-emerald-400" />
          <span>Dev HUD</span>
          <ChevronUp className="h-3 w-3 text-slate-400" />
        </button>
      </aside>
    );
  }

  // ==========================================
  // 2. BOTTOM DOCK (Collapsed Bar or Expanded Drawer)
  // ==========================================
  return (
    <aside
      aria-label="Developer diagnostics dock"
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-slate-800 bg-slate-950 text-slate-200 shadow-2xl print:hidden font-sans text-xs antialiased selection:bg-emerald-500 selection:text-white"
    >
      {/* EXPANDED DRAWER BODY */}
      {dockState === 'expanded' && (
        <div className="max-h-[65vh] overflow-y-auto border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl p-4 sm:p-5">
          <div className="mx-auto max-w-7xl space-y-4">
            {/* Drawer Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    Startup Preflight — Local Dev Troubleshooting Compass
                    <span className="rounded bg-emerald-950/80 border border-emerald-600/40 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                      NODE_ENV={diagnostics?.nodeEnv || 'development'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pinpointing active files, routes, schemas, and live diagnostic state.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAiContextDump}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition-colors"
                >
                  {copiedKey === 'ai_dump' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied Prompt Context!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copy AI Prompt Context</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={refreshDiagnostics}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  title="Refresh Diagnostics"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-slate-400 ${
                      isPending ? 'animate-spin text-emerald-400' : ''
                    }`}
                  />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDockMode('bar')}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                  title="Collapse Drawer"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </button>
              </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Code & File Compass</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'auth'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Auth, Plan & Entitlements</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'services'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>AI, DB & Stripe Health</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tools')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === 'tools'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Geo Switcher & Dev Tools</span>
              </button>
            </div>

            {/* TAB 1: CODE & FILE COMPASS */}
            {activeTab === 'code' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Current Active Route File */}
                  <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Active Route & Page Entrypoint
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                        {pathname}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-400">Next.js Page File:</div>
                      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300">
                        <span className="truncate">{routeGuide.pageFile}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(routeGuide.pageFile, 'page_file')}
                          className="ml-2 text-slate-400 hover:text-white"
                          title="Copy file path"
                        >
                          {copiedKey === 'page_file' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">{routeGuide.notes}</p>
                    </div>

                    {/* Primary UI components */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-400">Key Components Rendered:</div>
                      <div className="space-y-1">
                        {routeGuide.primaryComponents.map((comp) => (
                          <div
                            key={comp}
                            className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-950/80 px-2.5 py-1.5 font-mono text-[11px] text-slate-300"
                          >
                            <span className="truncate">{comp}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(comp, comp)}
                              className="ml-2 text-slate-400 hover:text-white"
                            >
                              {copiedKey === comp ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & DB Schemas */}
                  <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Server Actions & PostgreSQL Schema
                    </span>

                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-400">Server Actions:</div>
                      <div className="space-y-1">
                        {routeGuide.serverActions.map((action) => (
                          <div
                            key={action}
                            className="flex items-center justify-between rounded border border-slate-800/80 bg-slate-950/80 px-2.5 py-1.5 font-mono text-[11px] text-slate-300"
                          >
                            <span className="truncate">{action}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(action, action)}
                              className="ml-2 text-slate-400 hover:text-white"
                            >
                              {copiedKey === action ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-400">Drizzle DB Tables (Schema):</div>
                      <div className="flex flex-wrap gap-1.5">
                        {routeGuide.schemaTables.map((table) => (
                          <span
                            key={table}
                            className="rounded-md border border-slate-700 bg-slate-800/90 px-2 py-0.5 font-mono text-[11px] text-slate-200"
                          >
                            {table}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Defined in <code>src/db/schema/index.ts</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Module Quick Picker for Workspace */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      All 12 Founder Modules Reference Compass (Modules A–L)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click any module to inspect its source code files & schema:
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {Object.entries(MODULE_GUIDE).map(([key, item]) => {
                      const isSelected = selectedModuleKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedModuleKey(key)}
                          className={`rounded-lg border p-2 text-left transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-xs'
                              : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-bold text-[11px] truncate">
                            {key.replace('MOD_', '')}
                          </div>
                          <div className="text-[10px] truncate text-slate-400">
                            {item.name.split(':')[1]?.trim() || item.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {MODULE_GUIDE[selectedModuleKey] && (
                    <div className="mt-3 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
                      <div className="font-bold text-emerald-300 text-xs mb-1">
                        {MODULE_GUIDE[selectedModuleKey].name}
                      </div>
                      <p className="text-[11px] text-slate-300 mb-2">
                        {MODULE_GUIDE[selectedModuleKey].description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                        <div className="rounded bg-slate-950 px-2.5 py-1.5 border border-slate-800 flex justify-between items-center">
                          <span className="truncate">
                            {MODULE_GUIDE[selectedModuleKey].component}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                MODULE_GUIDE[selectedModuleKey].component,
                                'mod_comp'
                              )
                            }
                            className="ml-1 text-slate-400 hover:text-white"
                          >
                            {copiedKey === 'mod_comp' ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="rounded bg-slate-950 px-2.5 py-1.5 border border-slate-800 flex justify-between items-center">
                          <span className="truncate">
                            {MODULE_GUIDE[selectedModuleKey].action}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                MODULE_GUIDE[selectedModuleKey].action,
                                'mod_act'
                              )
                            }
                            className="ml-1 text-slate-400 hover:text-white"
                          >
                            {copiedKey === 'mod_act' ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="rounded bg-slate-950 px-2.5 py-1.5 border border-slate-800 text-slate-400 truncate">
                          Tables: {MODULE_GUIDE[selectedModuleKey].tables.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: AUTH, PLAN & ENTITLEMENTS */}
            {activeTab === 'auth' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Active Session & Entitlement */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Founder Identity & Entitlement Pass
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Client Session User:</span>
                      <span className="font-mono text-slate-200">
                        {bmuSession?.user?.email || 'No local session loaded'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Server Cookie User:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics?.userSession?.email || 'None (Unauthenticated server session)'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Entitlement Pass:</span>
                      <span className="rounded bg-emerald-950 border border-emerald-700/50 px-2 py-0.5 font-bold text-emerald-300">
                        {bmuSession?.entitlement?.planType || 'FREE_HOOK'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Max Startup Plans:</span>
                      <span className="font-mono text-slate-200">
                        {bmuSession?.entitlement?.maxStartupPlans ?? 1}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">Super Admin Cookie:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics?.adminSession?.email ? (
                          <span className="text-amber-400">
                            Logged in as {diagnostics.adminSession.email}
                          </span>
                        ) : (
                          'Not logged in as Super Admin'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link
                      href="/login"
                      className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      Go to /login
                    </Link>
                    <Link
                      href="/account"
                      className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      Go to /account
                    </Link>
                    <Link
                      href="/admin"
                      className="rounded border border-amber-600/50 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-900/60"
                    >
                      Go to /admin
                    </Link>
                  </div>
                </div>

                {/* Active Startup Plan */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Active Startup Plan Context
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                      {(bmuSession?.plans || []).length} Plans in Session
                    </span>
                  </div>

                  {activePlan ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Plan Title:</span>
                        <span className="font-semibold text-slate-100">{activePlan.title}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Plan ID:</span>
                        <span className="font-mono text-[11px] text-emerald-400">
                          {activePlan.id}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">HQ Country & Currency:</span>
                        <span className="font-mono text-slate-200">
                          {activePlan.hqCountryCode || 'IE'} ({activePlan.baseCurrency || 'EUR'})
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Target Industry:</span>
                        <span className="text-slate-200">{activePlan.industryCategory || 'Tech'}</span>
                      </div>

                      {/* Plan Switcher if multiple plans */}
                      {(bmuSession?.plans || []).length > 1 && (
                        <div className="pt-2">
                          <label className="text-[11px] text-slate-400 mb-1 block">
                            Switch Active Plan in Local Session:
                          </label>
                          <select
                            value={bmuSession?.activePlanId || ''}
                            onChange={(e) => handleSwitchActivePlan(e.target.value)}
                            aria-label="Switch Active Plan in Local Session"
                            className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                          >
                            {bmuSession?.plans?.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title} ({p.hqCountryCode || 'IE'}) - {p.id.slice(0, 8)}...
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-slate-800 p-4 text-center text-slate-500 text-xs">
                      No active plan found in browser session store.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SERVICES & HEALTH */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* AI Router Diagnostics */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Cpu className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      AI Router Guardrail
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Calls Today (UTC):</span>
                      <span className="font-mono font-bold text-white">
                        {diagnostics?.aiCallsToday ?? 0} / {diagnostics?.aiDailyCeiling ?? 500}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Platform Ceiling:</span>
                      <span className="font-mono text-emerald-400">500 calls/day max</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Default Model:</span>
                      <span className="font-mono text-slate-200">gemini-2.5-flash</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Audit Model:</span>
                      <span className="font-mono text-slate-200">gemini-2.5-pro</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Token Output Cap:</span>
                      <span className="font-mono text-slate-200">2048 tokens</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Governed by <code>src/lib/ai/router.ts</code>
                  </p>
                </div>

                {/* Database Connectivity */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Database className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      PostgreSQL Connection
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Status:</span>
                      {diagnostics?.dbConnected ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                          <Check className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                          <AlertCircle className="h-3 w-3" /> Disconnected
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">ORM:</span>
                      <span className="font-mono text-slate-200">Drizzle ORM (pg)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Server Uptime:</span>
                      <span className="font-mono text-slate-200">
                        {diagnostics?.uptimeSeconds
                          ? `${Math.floor(diagnostics.uptimeSeconds / 60)} mins`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {diagnostics?.dbError && (
                    <div className="rounded bg-rose-950/50 border border-rose-800 p-2 text-[10px] text-rose-300 font-mono">
                      {diagnostics.dbError}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">
                    Configured in <code>src/db/index.ts</code>
                  </p>
                </div>

                {/* Stripe Sandbox */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Stripe Sandbox
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Mode:</span>
                      {diagnostics?.stripeMode === 'TEST' ? (
                        <span className="font-bold text-amber-400">Test Sandbox</span>
                      ) : diagnostics?.stripeMode === 'LIVE' ? (
                        <span className="font-bold text-emerald-400">Live Production</span>
                      ) : (
                        <span className="text-slate-500">Not Configured</span>
                      )}
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Publishable Key:</span>
                      <span className="font-mono text-slate-300">
                        {diagnostics?.stripeKeyPrefix || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Test Card:</span>
                      <span className="font-mono text-emerald-400">4242 4242 4242...</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Handled in <code>src/app/actions/stripe.ts</code>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: GEO & TOOLS */}
            {activeTab === 'tools' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Quick Geo-Cookie Switcher */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Globe className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Regional Geo-Cookie Switcher (<code className="lowercase">spf_region</code>)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Switch localization rules, currencies, and grant matching without a VPN:
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchRegion('IE')}
                      className={`rounded-lg border p-2 text-center transition-all ${
                        activeRegion === 'IE'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base">🇮🇪</div>
                      <div className="text-xs font-semibold">Ireland</div>
                      <div className="text-[10px] text-slate-400">EUR • LEO/EI</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchRegion('GB')}
                      className={`rounded-lg border p-2 text-center transition-all ${
                        activeRegion === 'GB'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base">🇬🇧</div>
                      <div className="text-xs font-semibold">United Kingdom</div>
                      <div className="text-[10px] text-slate-400">GBP • Innovate UK</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchRegion('US')}
                      className={`rounded-lg border p-2 text-center transition-all ${
                        activeRegion === 'US' || activeRegion === 'ROW'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base">🌐</div>
                      <div className="text-xs font-semibold">Global / US</div>
                      <div className="text-[10px] text-slate-400">USD • Standard</div>
                    </button>
                  </div>
                </div>

                {/* Dev Actions & Shortcuts */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Quick Dev Actions & Resets
                  </span>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAiContextDump}
                      className="rounded-lg border border-emerald-600/40 bg-emerald-950/50 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60"
                    >
                      📋 Copy Full Markdown Context
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            'Are you sure you want to reset your local browser BMU session? This will reload the page with fresh demo data.'
                          )
                        ) {
                          window.localStorage.removeItem('bmu_session_v2');
                          window.localStorage.removeItem('spf_session_v2');
                          window.location.reload();
                        }
                      }}
                      className="rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/60"
                    >
                      🧹 Clear Browser Session & Reload
                    </button>

                    <Link
                      href="/admin"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                    >
                      ⚡ Super Admin Panel
                    </Link>

                    <Link
                      href="/workspace"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                    >
                      🚀 Jump to Workspace
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SLIM COLLAPSED BAR (Always visible fixed to bottom) */}
      <div className="mx-auto flex h-8 items-center justify-between px-3 text-[11px] sm:px-4">
        {/* Left Side: Route & Active File pointer */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <button
            type="button"
            onClick={() => setDockMode(dockState === 'expanded' ? 'bar' : 'expanded')}
            className="flex items-center gap-1 rounded bg-emerald-950 border border-emerald-600/50 px-1.5 py-0.5 font-bold text-emerald-300 hover:bg-emerald-900/80 transition-colors"
            title="Toggle Developer Diagnostics Inspector"
          >
            <Wrench className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline">DEV</span>
            {dockState === 'expanded' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Current Route Pathname */}
          <div className="flex items-center gap-1.5 font-mono text-slate-300 truncate">
            <span className="text-slate-500">📍</span>
            <span className="truncate max-w-[140px] sm:max-w-[220px]">{pathname}</span>
          </div>

          <span className="text-slate-600 hidden md:inline">|</span>

          {/* Key Component File */}
          <div className="hidden md:flex items-center gap-1 text-slate-400 truncate">
            <FileCode className="h-3 w-3 text-slate-500" />
            <span className="truncate font-mono text-slate-300 max-w-[240px]">
              {pathname.includes('/workspace')
                ? MODULE_GUIDE[selectedModuleKey]?.component?.split('/').pop() ||
                  routeGuide.primaryComponents[0]?.split('/').pop()
                : routeGuide.primaryComponents[0]?.split('/').pop() ||
                  routeGuide.pageFile.split('/').pop()}
            </span>
            <button
              type="button"
              onClick={() => {
                const targetPath = pathname.includes('/workspace')
                  ? MODULE_GUIDE[selectedModuleKey]?.component || routeGuide.pageFile
                  : routeGuide.pageFile;
                copyToClipboard(targetPath, 'bar_comp');
              }}
              className="text-slate-400 hover:text-white"
              title="Copy component path"
            >
              {copiedKey === 'bar_comp' ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Health Badges & Quick Tools */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Calls Meter */}
          <div
            className="hidden sm:flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-800"
            title="Platform Daily AI Router Calls"
          >
            <Cpu className="h-3 w-3 text-emerald-400" />
            <span>
              AI: {diagnostics?.aiCallsToday ?? 0}/{diagnostics?.aiDailyCeiling ?? 500}
            </span>
          </div>

          {/* Region Badge */}
          <button
            type="button"
            onClick={() => {
              setDockMode('expanded');
              setActiveTab('tools');
            }}
            className="flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-800 hover:border-slate-700"
            title="Click to switch regional cookie (spf_region)"
          >
            <span>{activeRegion === 'IE' ? '🇮🇪 IE' : activeRegion === 'GB' ? '🇬🇧 UK' : '🌐 US'}</span>
          </button>

          {/* Stripe Badge */}
          {diagnostics?.stripeMode === 'TEST' && (
            <span className="hidden lg:inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-600/40 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
              <CreditCard className="h-3 w-3 text-amber-400" />
              <span>Stripe Test</span>
            </span>
          )}

          {/* Copy Prompt Context Button */}
          <button
            type="button"
            onClick={handleCopyAiContextDump}
            className="flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-900 hover:text-white transition-colors"
            title="Copy all route, file, plan, and diagnostic details as a clean prompt for Antigravity or Claude"
          >
            {copiedKey === 'ai_dump' ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-emerald-400" />
                <span className="hidden sm:inline">Copy Context</span>
              </>
            )}
          </button>

          {/* Minimize to Pill */}
          <button
            type="button"
            onClick={() => setDockMode('minimized')}
            className="text-slate-500 hover:text-slate-200"
            title="Minimize to floating pill"
          >
            <Minimize2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/**
 * Route-to-File Guide dictionary
 */
function getRouteGuide(pathname: string): RouteGuide {
  if (pathname === '/' || pathname === '/ie' || pathname === '/uk') {
    return {
      title: 'Marketing Landing Page',
      pageFile: pathname === '/' ? 'src/app/page.tsx' : `src/app${pathname}/page.tsx`,
      primaryComponents: [
        'src/components/marketing/landing-page-experience.tsx',
        'src/components/marketing/marketing-layout-nav.tsx',
      ],
      serverActions: ['src/app/actions/survey-boost.ts', 'src/app/actions/vouchers.ts'],
      schemaTables: ['early_access_waitlist', 'partner_offers'],
      notes: 'Landing page with dynamic country toggle, hero survey hook, and pass checkout triggers.',
    };
  }

  if (pathname.includes('/workspace')) {
    return {
      title: 'Founder Workspace (12 Modules)',
      pageFile: 'src/app/(workspace)/workspace/page.tsx',
      primaryComponents: [
        'src/app/(workspace)/workspace/page.tsx',
        'src/components/workspace/module-a-grant-checker-step.tsx',
        'src/components/workspace/module-c-workspace.tsx',
        'src/components/workspace/master-document-workspace.tsx',
      ],
      serverActions: [
        'src/app/actions/module-a.ts',
        'src/app/actions/module-c.ts',
        'src/app/actions/module-l.ts',
      ],
      schemaTables: ['startup_plans', 'plan_modules_data', 'validation_surveys'],
      notes: 'Main 12-module founder workstation. Inspect module selector above for step-specific components.',
    };
  }

  if (pathname.includes('/admin')) {
    return {
      title: 'Super Admin Control Center',
      pageFile: 'src/app/(admin)/admin/page.tsx',
      primaryComponents: [
        'src/app/(admin)/admin/page.tsx',
        'src/components/admin/admin-panel-tabs.tsx',
      ],
      serverActions: ['src/app/actions/admin.ts', 'src/app/actions/admin-partners.ts'],
      schemaTables: ['users', 'user_entitlements', 'support_tickets', 'cohorts', 'partner_offers'],
      notes: 'Admin panel for tenant management, cohorts, partner slots, impersonation, and support tickets.',
    };
  }

  if (pathname.includes('/login') || pathname.includes('/register')) {
    return {
      title: 'Founder Authentication',
      pageFile: pathname.includes('/login')
        ? 'src/app/(auth)/login/page.tsx'
        : 'src/app/(auth)/register/page.tsx',
      primaryComponents: ['src/lib/auth/server-auth.ts', 'src/lib/auth/session-store.ts'],
      serverActions: ['src/app/actions/auth.ts'],
      schemaTables: ['users', 'user_entitlements', 'accounts'],
      notes: 'Better-Auth login & registration with session cookie minting.',
    };
  }

  if (pathname.includes('/onboarding')) {
    return {
      title: 'Founder Initial Onboarding',
      pageFile: 'src/app/(auth)/onboarding/page.tsx',
      primaryComponents: ['src/app/(auth)/onboarding/page.tsx'],
      serverActions: ['src/app/actions/auth.ts', 'src/app/actions/module-a.ts'],
      schemaTables: ['users', 'startup_plans', 'user_entitlements'],
      notes: 'First-time founder setup with geo pre-selection.',
    };
  }

  if (pathname.includes('/account')) {
    return {
      title: 'Founder Account & Billing Settings',
      pageFile: 'src/app/(workspace)/account/page.tsx',
      primaryComponents: ['src/app/(workspace)/account/page.tsx'],
      serverActions: ['src/app/actions/account.ts', 'src/app/actions/stripe.ts'],
      schemaTables: ['users', 'user_entitlements', 'voucher_redemptions'],
      notes: 'Self-serve billing, 6-Month Pass status, AppSumo code redemption, and BYOK settings.',
    };
  }

  if (pathname.includes('/v/')) {
    return {
      title: 'Public Hosted Validation Survey & Waitlist',
      pageFile: 'src/app/(public)/v/[slug]/page.tsx',
      primaryComponents: ['src/components/workspace/public-survey-experience.tsx'],
      serverActions: ['src/app/actions/module-c.ts'],
      schemaTables: ['validation_surveys', 'survey_responses'],
      notes: 'Public unauthenticated respondent view with anti-spam rate limiting and PII isolation.',
    };
  }

  if (pathname.includes('/cohort-portal') || pathname.includes('/cohorts')) {
    return {
      title: 'Cohort Accelerator Portal',
      pageFile: 'src/app/cohort-portal/[cohortId]/page.tsx',
      primaryComponents: ['src/components/cohorts/cohort-portal-view.tsx'],
      serverActions: ['src/app/actions/cohort-portal.ts', 'src/app/actions/cohort-milestone-claim.ts'],
      schemaTables: ['cohorts', 'cohort_staff', 'startup_plans'],
      notes: 'Institutional incubator milestone claims and director audit dashboard.',
    };
  }

  if (pathname.includes('/redeem') || pathname.includes('/appsumo')) {
    return {
      title: 'Voucher & AppSumo Redemption',
      pageFile: pathname.includes('/redeem')
        ? 'src/app/(public)/redeem/page.tsx'
        : 'src/app/appsumo/page.tsx',
      primaryComponents: ['src/app/appsumo/appsumo-client-page.tsx'],
      serverActions: ['src/app/actions/vouchers.ts'],
      schemaTables: ['appsumo_license_keys', 'voucher_redemptions', 'user_entitlements'],
      notes: 'AppSumo LTD code stacker (Tier 1/2/3) and promotional voucher validator.',
    };
  }

  return {
    title: 'Application Page',
    pageFile: `src/app${pathname}/page.tsx`,
    primaryComponents: [`src/app${pathname}/page.tsx`],
    serverActions: ['src/app/actions/auth.ts'],
    schemaTables: ['startup_plans', 'users'],
    notes: 'Generic application route.',
  };
}
