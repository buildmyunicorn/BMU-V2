'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Building2,
  Landmark,
  Scale,
  Rocket,
  Layers,
  ArrowRight,
  Save,
  Loader2,
  SlidersHorizontal,
  BookmarkPlus,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { formatPlanCurrency } from '@/lib/localization';
import type {
  ActiveStartupPlan,
  BusinessPlanVersionItem,
  BusinessPlanArchetype,
  ModuleLCompiledSectionItem,
  ModuleLContradictionAuditItem,
  SavedModuleLData,
} from '@/lib/auth/session-store';
import {
  saveBusinessPlanStudioVersionsAction,
  compileBusinessPlanSectionAction,
  auditBusinessPlanVersionAction,
} from '@/app/actions/business-plan-studio';

export interface BusinessPlanStudioWorkspaceProps {
  plan: ActiveStartupPlan;
  founderName?: string;
  selectedCountry?: string;
  isVaultReadonly?: boolean;
  whiteLabelEnabled?: boolean;
  onUpdatePlanModuleLData?: (updatedModuleL: SavedModuleLData) => void;
  onJumpToModule?: (
    moduleCode:
      | 'MOD_A_IDEATION'
      | 'MOD_B_MARKET'
      | 'MOD_C_SURVEYS_FEEDBACK'
      | 'MOD_D_PRODUCT_BUILD'
      | 'MOD_E_OPERATIONS'
      | 'MOD_F_COFOUNDER_TEAM'
      | 'MOD_G_LAUNCHPAD'
      | 'MOD_H_REVENUE'
      | 'MOD_I_MARKETING'
      | 'MOD_J_FINANCE'
      | 'MOD_K_GRANTS_FUNDING'
      | 'MOD_L_BUSINESS_PLAN',
    targetStep?: number,
    highlightId?: string
  ) => void;
  onNavigateToModule?: (
    moduleCode:
      | 'MOD_A_IDEATION'
      | 'MOD_B_MARKET'
      | 'MOD_C_SURVEYS_FEEDBACK'
      | 'MOD_D_PRODUCT_BUILD'
      | 'MOD_E_OPERATIONS'
      | 'MOD_F_COFOUNDER_TEAM'
      | 'MOD_G_LAUNCHPAD'
      | 'MOD_H_REVENUE'
      | 'MOD_I_MARKETING'
      | 'MOD_J_FINANCE'
      | 'MOD_K_GRANTS_FUNDING'
      | 'MOD_L_BUSINESS_PLAN',
    targetStep?: number,
    highlightId?: string
  ) => void;
  onParkQuestionInSession?: (questionText: string) => void;
}

export interface ArchetypeCatalogItem {
  archetype: BusinessPlanArchetype;
  title: string;
  badge: string;
  targetAudience: 'GRANT_COMMITTEE' | 'COMMERCIAL_BANK' | 'ANGEL_INVESTOR' | 'ADVISOR_BOARD' | 'INTERNAL_TEAM';
  targetTone: 'EVIDENCE_LED_ASSESSOR' | 'UNDERWRITER_CONSERVATIVE' | 'VENTURE_HIGH_GROWTH' | 'EXECUTIVE_CRISP';
  summary: string;
  sectionsTemplate: {
    sectionNumber: number;
    title: string;
    assessorPrompt: string;
    wordLimit: number;
    scoringWeightPercent: number;
    sourceModules: string[];
  }[];
}

export const ARCHETYPE_CATALOG: ArchetypeCatalogItem[] = [
  {
    archetype: 'IE_LEO_OFFICIAL_GRANT',
    title: 'Irish LEO & Enterprise Ireland Official Grant Application',
    badge: '🇮🇪 Ireland LEO / EI Form',
    targetAudience: 'GRANT_COMMITTEE',
    targetTone: 'EVIDENCE_LED_ASSESSOR',
    summary:
      'Formatted strictly for Local Enterprise Office (Feasibility, Priming) & Enterprise Ireland evaluation committees. Prioritizes export potential, non-displacement, 3-quote supplier procurement, and 3-year job creation.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Promoter Track Record, Roles & Commitment',
        assessorPrompt: 'Outline promoter professional background, domain expertise, 7 startup hats, and personal full-time commitment.',
        wordLimit: 400,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_A_IDEATION', 'MOD_F_COFOUNDER_TEAM'],
      },
      {
        sectionNumber: 2,
        title: 'Product Innovation, Technical Merit & Work Packages',
        assessorPrompt: 'Explain the product innovation, technical build vehicle, own-vs-rent architecture, and work package breakdown (WP1..n).',
        wordLimit: 450,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 3,
        title: 'Market Opportunity, Export Additionality & Non-Displacement',
        assessorPrompt: 'Substantiate TAM/SAM/SOM, target international export markets, and prove zero domestic economic displacement.',
        wordLimit: 450,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_B_MARKET'],
      },
      {
        sectionNumber: 4,
        title: 'Customer Validation, Willingness-to-Pay & Mom-Test Evidence',
        assessorPrompt: 'Detail primary customer discovery proof, survey response statistics, and validated pricing appetite.',
        wordLimit: 350,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_C_SURVEYS_FEEDBACK', 'MOD_H_REVENUE'],
      },
      {
        sectionNumber: 5,
        title: '3-Year Headcount Schedule, Salary Plan & Local Employment Impact',
        assessorPrompt: 'Detail scheduled headcount growth, Irish PRSI payroll burdens, and local net economic additionality.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_J_FINANCE'],
      },
      {
        sectionNumber: 6,
        title: '36-Month Financial Projections, Breakeven & Vouched Grant Ask',
        assessorPrompt: 'Reconcile unit economics, Pocket Profit crossover month, 36-month cashflow trough, and the matching vouched grant ask.',
        wordLimit: 500,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_H_REVENUE', 'MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
      },
    ],
  },
  {
    archetype: 'UK_INNOVATE_UK_9Q',
    title: 'UK Innovate UK Smart Grants 9-Question Format',
    badge: '🇬🇧 UK Innovate UK IFS',
    targetAudience: 'GRANT_COMMITTEE',
    targetTone: 'EVIDENCE_LED_ASSESSOR',
    summary:
      'Engineered for Innovate UK (UKRI) independent peer reviewers. Strict 400-word discipline per question, focusing on R&D challenge, technical step-change, freedom-to-operate, work packages, and public funding additionality.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Q1. Need or Challenge & Market Failure',
        assessorPrompt: 'What is the specific business need or societal challenge addressed, and why has the market failed to solve it?',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_A_IDEATION', 'MOD_B_MARKET'],
      },
      {
        sectionNumber: 2,
        title: 'Q2. Approach & Technical Step-Change',
        assessorPrompt: 'Describe the technical innovation, methodology, freedom-to-operate, and beyond state-of-the-art capability.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_B_MARKET', 'MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 3,
        title: 'Q3. Team, Skills & Resource Capability',
        assessorPrompt: 'Demonstrate that the team has the technical, commercial, and operational capability to deliver the project.',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_F_COFOUNDER_TEAM'],
      },
      {
        sectionNumber: 4,
        title: 'Q4. Market Awareness & Route to Commercialization',
        assessorPrompt: 'What is the addressable market size (TAM/SAM/SOM), competitive wedge, and commercial exploitation plan?',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_B_MARKET', 'MOD_I_MARKETING'],
      },
      {
        sectionNumber: 5,
        title: 'Q5. Work Packages, Deliverables & Project Milestones',
        assessorPrompt: 'Detail work packages WP1..n, milestone deliverables, Gantt timings, and technical dependencies.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_D_PRODUCT_BUILD', 'MOD_E_OPERATIONS'],
      },
      {
        sectionNumber: 6,
        title: 'Q6. Risk Management & 4-Category Mitigation Register',
        assessorPrompt: 'Identify key technical, commercial, financial, and environmental risks with mitigation controls.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_E_OPERATIONS'],
      },
      {
        sectionNumber: 7,
        title: 'Q7. Project Costs, Value for Money & Additionality',
        assessorPrompt: 'Justify eligible project expenditures, prove why private funding cannot fund the full project, and demonstrate additionality.',
        wordLimit: 400,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
      },
    ],
  },
  {
    archetype: 'COMMERCIAL_BANK_LOAN',
    title: 'Commercial Bank Credit Pack (AIB / BOI / Barclays / BBB)',
    badge: '🏦 Commercial Bank Credit Pack',
    targetAudience: 'COMMERCIAL_BANK',
    targetTone: 'UNDERWRITER_CONSERVATIVE',
    summary:
      'Tuned for credit committee risk officers. Proves debt service coverage (DSCR ≥ 1.25x), downside stress testing, working capital buffer, founder survival budget discipline, and statutory clean setup.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Borrower Background, Corporate Legal Entity & Clean Setup',
        assessorPrompt: 'Details of LTD registration, directors, credit history, clean banking, and governance structure.',
        wordLimit: 350,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_A_IDEATION', 'MOD_F_COFOUNDER_TEAM', 'MOD_G_LAUNCHPAD'],
      },
      {
        sectionNumber: 2,
        title: 'Commercial Model, Pricing Stability & Proven Customer Demand',
        assessorPrompt: 'Outline predictable revenue streams, recurring contracts, gross margin profile, and customer survey proof.',
        wordLimit: 400,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_C_SURVEYS_FEEDBACK', 'MOD_H_REVENUE'],
      },
      {
        sectionNumber: 3,
        title: 'Director Personal Survival Budget & Household Drawings Affordability',
        assessorPrompt: 'Demonstrate that directors have minimal personal drain on business cashflow during early months.',
        wordLimit: 350,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_F_COFOUNDER_TEAM'],
      },
      {
        sectionNumber: 4,
        title: '36-Month Cashflow Forecast & Debt Service Coverage (DSCR)',
        assessorPrompt: 'Show conservative monthly cash trough, working capital reserve, and proof of loan repayment coverage.',
        wordLimit: 500,
        scoringWeightPercent: 35,
        sourceModules: ['MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
      },
    ],
  },
  {
    archetype: 'INVESTOR_ANGEL_MEMO',
    title: 'Pre-Seed / Angel Investor 8-Page Memo (with SEIS / EII Relief)',
    badge: '🚀 Angel & Seed Investment Memo',
    targetAudience: 'ANGEL_INVESTOR',
    targetTone: 'VENTURE_HIGH_GROWTH',
    summary:
      'High-conviction venture brief for angels, syndicates, and pre-seed funds. Emphasizes problem urgency, unfair wedge, unit economics, explosive SOM-to-TAM expansion, team track record, and use of funds.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'The Problem, Urgent Pain Point & Customer Pull',
        assessorPrompt: 'Articulate the urgent industry bottleneck, willingness-to-pay validation, and customer pain intensity.',
        wordLimit: 400,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_A_IDEATION', 'MOD_C_SURVEYS_FEEDBACK'],
      },
      {
        sectionNumber: 2,
        title: 'The Solution, Product Architecture & Defensible Moat',
        assessorPrompt: 'Explain how the product solves the problem uniquely, proprietary technical wedge, and defensibility.',
        wordLimit: 450,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_B_MARKET', 'MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 3,
        title: 'Market Size (TAM/SAM/SOM) & Go-to-Market Flywheel',
        assessorPrompt: 'Quantify the market upside, beachhead acquisition channel, and first 10-to-100 customer conversion strategy.',
        wordLimit: 450,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_B_MARKET', 'MOD_I_MARKETING'],
      },
      {
        sectionNumber: 4,
        title: 'Unit Economics, Gross Margins & Scalability',
        assessorPrompt: 'Break down pricing tiers, CAC payback, contribution margin, and capital efficiency.',
        wordLimit: 400,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_H_REVENUE', 'MOD_J_FINANCE'],
      },
      {
        sectionNumber: 5,
        title: 'Founding Team, Cap Table, Tax Relief (SEIS/EII) & Use of Funds',
        assessorPrompt: 'Founding pedigree, 7 startup hats, HMRC SEIS/EIS or Irish EII status, and 18-month milestone runway target.',
        wordLimit: 500,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_K_GRANTS_FUNDING'],
      },
    ],
  },
  {
    archetype: 'LEAN_ONE_PAGER',
    title: 'Lean 1-Page Executive Business Brief',
    badge: '⚡ 1-Page Lean Executive Brief',
    targetAudience: 'ADVISOR_BOARD',
    targetTone: 'EXECUTIVE_CRISP',
    summary:
      'High-signal 1-page overview for advisors, board directors, mentors, and quick strategic partner introductions. Distills the whole business into 5 punchy blocks.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Venture Snapshot & The Problem',
        assessorPrompt: '1-sentence core value proposition, targeted beachhead customer, and the painful problem being solved.',
        wordLimit: 150,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_A_IDEATION', 'MOD_B_MARKET'],
      },
      {
        sectionNumber: 2,
        title: 'The Solution & Unfair Wedge',
        assessorPrompt: 'Core product mechanism, unfair competitive advantage, and customer validation metrics.',
        wordLimit: 150,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_B_MARKET', 'MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 3,
        title: 'Commercial Model & Breakeven Crossover',
        assessorPrompt: 'Pricing tiers, gross margin, breakeven customer volume, and Pocket Profit month.',
        wordLimit: 150,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_H_REVENUE'],
      },
      {
        sectionNumber: 4,
        title: 'Team & Governance',
        assessorPrompt: 'Key promoters, complementary roles, statutory setup, and advisory board.',
        wordLimit: 150,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_G_LAUNCHPAD'],
      },
      {
        sectionNumber: 5,
        title: 'Capital Stack & 12-Month Milestones',
        assessorPrompt: 'Current funding status, grant awards, and the 3 primary milestones for the next 12 months.',
        wordLimit: 150,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
      },
    ],
  },
];

export function BusinessPlanStudioWorkspace({
  plan,
  founderName = 'Founder',
  selectedCountry = 'IE',
  isVaultReadonly = false,
  whiteLabelEnabled = false,
  onUpdatePlanModuleLData,
  onJumpToModule,
  onNavigateToModule,
  onParkQuestionInSession,
}: BusinessPlanStudioWorkspaceProps) {
  const jumpHandler = onJumpToModule || onNavigateToModule;
  const isUK = selectedCountry === 'GB' || plan.hqCountryCode === 'GB';
  const currency = plan.baseCurrency || (isUK ? 'GBP' : 'EUR');
  const currencySymbol = isUK ? '£' : plan.hqCountryCode === 'IE' ? '€' : '$';

  // Initialize versions list from plan.moduleLData?.versions or default to initial version
  const initialVersions: BusinessPlanVersionItem[] = useMemo(() => {
    if (plan.moduleLData?.versions && plan.moduleLData.versions.length > 0) {
      return plan.moduleLData.versions;
    }

    // Default primary version based on country
    const defaultArchetypeKey: BusinessPlanArchetype = isUK
      ? 'UK_INNOVATE_UK_9Q'
      : 'IE_LEO_OFFICIAL_GRANT';
    const catalogItem =
      ARCHETYPE_CATALOG.find((c) => c.archetype === defaultArchetypeKey) ||
      ARCHETYPE_CATALOG[0];

    const defaultSections: ModuleLCompiledSectionItem[] =
      catalogItem.sectionsTemplate.map((tpl) => ({
        id: `sec-${tpl.sectionNumber}-${Date.now()}`,
        sectionNumber: tpl.sectionNumber,
        title: tpl.title,
        assessorQuestionPrompt: tpl.assessorPrompt,
        scoringWeightPercent: tpl.scoringWeightPercent,
        wordLimit: tpl.wordLimit,
        sourceModules: tpl.sourceModules,
        compiledResponseText: '',
      }));

    return [
      {
        id: `bp-ver-${Date.now()}`,
        title: isUK
          ? 'Innovate UK Smart Grant Application (Official)'
          : 'LEO Official Grant & Expansion Business Plan',
        archetype: defaultArchetypeKey,
        createdAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
        isPrimary: true,
        targetAudience: catalogItem.targetAudience,
        targetTone: catalogItem.targetTone,
        targetFundingAsk: 50000,
        sections: defaultSections,
        executiveHookStatement: `${plan.title} is an evidence-backed venture positioned for high-value growth in ${selectedCountry}.`,
      },
    ];
  }, [plan.moduleLData?.versions, isUK, plan.title, selectedCountry]);

  const [versions, setVersions] = useState<BusinessPlanVersionItem[]>(initialVersions);
  const [activeVersionId, setActiveVersionId] = useState<string>(
    plan.moduleLData?.activeVersionId || initialVersions[0]?.id || ''
  );

  const activeVersion = useMemo(() => {
    return versions.find((v) => v.id === activeVersionId) || versions[0];
  }, [versions, activeVersionId]);

  // Active Studio Sub-Tab: 'OVERVIEW' | 'SECTIONS' | 'AUDIT' | 'EXPORT'
  const [activeStudioTab, setActiveStudioTab] = useState<'OVERVIEW' | 'SECTIONS' | 'AUDIT' | 'EXPORT'>('SECTIONS');

  // New Version Modal
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [selectedArchetypeForNew, setSelectedArchetypeForNew] =
    useState<BusinessPlanArchetype>(isUK ? 'UK_INNOVATE_UK_9Q' : 'IE_LEO_OFFICIAL_GRANT');

  // Section Editing & AI Generation
  const [openSectionNumber, setOpenSectionNumber] = useState<number | 'ALL'>(1);
  const [compilingSectionNumber, setCompilingSectionNumber] = useState<number | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [activeWhyCard, setActiveWhyCard] = useState<number | null>(null);
  const [activeExampleCard, setActiveExampleCard] = useState<number | null>(null);

  // Save helper
  async function persistVersions(newVersions: BusinessPlanVersionItem[], newActiveId?: string) {
    setIsSaving(true);
    setVersions(newVersions);
    const targetActive = newActiveId ?? activeVersionId;
    setActiveVersionId(targetActive);

    try {
      const res = await saveBusinessPlanStudioVersionsAction({
        planId: plan.id,
        versions: newVersions,
        activeVersionId: targetActive,
        completionPercentage: 50,
      });
      if (res.ok) {
        onUpdatePlanModuleLData?.({
          ...(plan.moduleLData || {}),
          versions: newVersions,
          activeVersionId: targetActive,
          completionPercentage: Math.max(plan.moduleLData?.completionPercentage || 0, 50),
          lastSavedAt: new Date().toISOString(),
        });
        setSaveBanner('Saved to Business Plan Studio');
        setTimeout(() => setSaveBanner(null), 3500);
      }
    } catch {
      // non-fatal
    } finally {
      setIsSaving(false);
    }
  }

  // Create Version
  function handleCreateVersion() {
    if (!newVersionTitle.trim()) return;
    const cat =
      ARCHETYPE_CATALOG.find((c) => c.archetype === selectedArchetypeForNew) ||
      ARCHETYPE_CATALOG[0];

    const newSections: ModuleLCompiledSectionItem[] = cat.sectionsTemplate.map((tpl) => ({
      id: `sec-${tpl.sectionNumber}-${Date.now()}`,
      sectionNumber: tpl.sectionNumber,
      title: tpl.title,
      assessorQuestionPrompt: tpl.assessorPrompt,
      scoringWeightPercent: tpl.scoringWeightPercent,
      wordLimit: tpl.wordLimit,
      sourceModules: tpl.sourceModules,
      compiledResponseText: '',
    }));

    const newVer: BusinessPlanVersionItem = {
      id: `bp-ver-${Date.now()}`,
      title: newVersionTitle.trim(),
      archetype: selectedArchetypeForNew,
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      isPrimary: false,
      targetAudience: cat.targetAudience,
      targetTone: cat.targetTone,
      targetFundingAsk: 50000,
      sections: newSections,
      executiveHookStatement: `${plan.title} addresses critical market demand with defensible operational excellence.`,
    };

    const nextList = [...versions, newVer];
    persistVersions(nextList, newVer.id);
    setIsCreatingNewVersion(false);
    setNewVersionTitle('');
    setActiveStudioTab('SECTIONS');
  }

  // Duplicate Version
  function handleDuplicateVersion(versionToClone: BusinessPlanVersionItem) {
    const cloned: BusinessPlanVersionItem = {
      ...versionToClone,
      id: `bp-ver-${Date.now()}`,
      title: `${versionToClone.title} (Copy)`,
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      isPrimary: false,
      sections: versionToClone.sections.map((s) => ({ ...s, id: `sec-${s.sectionNumber}-${Date.now()}` })),
    };
    persistVersions([...versions, cloned], cloned.id);
  }

  // Delete Version
  function handleDeleteVersion(versionId: string) {
    if (versions.length <= 1) return;
    const nextList = versions.filter((v) => v.id !== versionId);
    persistVersions(nextList, nextList[0].id);
  }

  // Section text update
  function handleUpdateSectionText(secNum: number, newText: string) {
    if (!activeVersion) return;
    const updatedSections = activeVersion.sections.map((sec) =>
      sec.sectionNumber === secNum ? { ...sec, compiledResponseText: newText, isCustomEdited: true } : sec
    );
    const updatedVer: BusinessPlanVersionItem = {
      ...activeVersion,
      sections: updatedSections,
      lastEditedAt: new Date().toISOString(),
    };
    const nextList = versions.map((v) => (v.id === activeVersion.id ? updatedVer : v));
    persistVersions(nextList);
  }

  // AI Compile Section (Powered strictly by Gemini 2.5 Pro)
  async function handleCompileSection(sec: ModuleLCompiledSectionItem) {
    if (!activeVersion || isVaultReadonly) return;
    setCompilingSectionNumber(sec.sectionNumber);

    try {
      const surveySummary =
        plan.moduleCData?.surveys?.[0]?.aiInsightsSummary?.headlineTakeaway ||
        'Strong willingness to pay and customer demand validated';

      const summaryFactPack = `
      STARTUP: "${plan.title}"
      INDUSTRY: ${plan.industryCategory || 'Startup'}
      CORE PROBLEM: ${plan.conceptCanvas?.coreProblem || 'Validated industry pain point'}
      SOLUTION: ${plan.conceptCanvas?.proposedSolution || 'Proprietary product solution'}
      UNFAIR ADVANTAGE: ${plan.conceptCanvas?.unfairAdvantage || 'Defensible wedge'}
      SURVEY VALIDATION: ${surveySummary}
      PRICING & REVENUE: Target pricing modeled in Module H Pocket Profit breakeven.
      HEADCOUNT & SURVIVAL: Scheduled hiring and founder survival budget verified in Module F.
      OPERATIONS: Equipment and 3-quote schedules established in Module E.
      FINANCES: 36-month cashflow trough and localized employer taxes modeled in Module J.
      `;

      const result = await compileBusinessPlanSectionAction({
        planId: plan.id,
        versionId: activeVersion.id,
        sectionNumber: sec.sectionNumber,
        sectionTitle: sec.title,
        assessorPrompt: sec.assessorQuestionPrompt,
        wordLimit: sec.wordLimit,
        scoringWeightPercent: sec.scoringWeightPercent,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        baseCurrency: currency,
        targetTone: activeVersion.targetTone,
        currentResponseText: sec.compiledResponseText,
        planContextSummary: summaryFactPack,
      });

      if (result.compiledResponseText) {
        handleUpdateSectionText(sec.sectionNumber, result.compiledResponseText);
      }
    } catch {
      // non-fatal fallback
    } finally {
      setCompilingSectionNumber(null);
    }
  }

  // Pre-flight Contradiction & Assessor Audit (Powered by Gemini 2.5 Pro)
  async function handleRunAudit() {
    if (!activeVersion || isVaultReadonly) return;
    setIsAuditing(true);

    try {
      const auditResult = await auditBusinessPlanVersionAction({
        planId: plan.id,
        planTitle: plan.title,
        hqCountryCode: selectedCountry,
        baseCurrency: currency,
        industryCategory: plan.industryCategory,
        targetFundingAskAmount: activeVersion.targetFundingAsk,
        archetype: activeVersion.archetype,
        moduleAExportPotential: plan.exportPotential,
        moduleBSegments: plan.moduleBData?.beachhead?.beachheadSegment || 'Target business segment',
        moduleCSurveySummary: plan.moduleCData?.surveys?.[0]?.aiInsightsSummary?.headlineTakeaway,
        moduleDPricingAndQuotes: 'Defined product architecture and 3 quotes',
        moduleEOperationsEquipment: 'Equipment schedule and risk register complete',
        moduleFTeamAndHeadcount: 'Founder survival budget and hiring plan',
        moduleGLaunchpadSetup: 'LTD incorporated and business banking verified',
        moduleHRevenueAndPricing: 'Pocket profit crossover analyzed',
        moduleJFinanceAndCashflow: '36-month cashflow with local employer taxes',
        moduleKFundingStackAndBuffer: 'Grant capital stack and reimbursement buffer',
      });

      const updatedVer: BusinessPlanVersionItem = {
        ...activeVersion,
        auditScore: auditResult.overallAuditScore,
        auditItems: auditResult.auditItems,
        lastAuditedAt: new Date().toISOString(),
      };
      const nextList = versions.map((v) => (v.id === activeVersion.id ? updatedVer : v));
      persistVersions(nextList);
    } catch {
      // non-fatal
    } finally {
      setIsAuditing(false);
    }
  }

  // Copy helper
  function copyTextToClipboard(text: string, id: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSectionId(id);
      setTimeout(() => setCopiedSectionId(null), 2000);
    }
  }

  // Overall word count & completeness
  const totalWords = useMemo(() => {
    if (!activeVersion?.sections) return 0;
    return activeVersion.sections.reduce((acc, sec) => {
      const words = sec.compiledResponseText
        ? sec.compiledResponseText.trim().split(/\s+/).filter(Boolean).length
        : 0;
      return acc + words;
    }, 0);
  }, [activeVersion?.sections]);

  const completedSectionsCount = useMemo(() => {
    if (!activeVersion?.sections) return 0;
    return activeVersion.sections.filter((s) => (s.compiledResponseText || '').trim().length > 40).length;
  }, [activeVersion?.sections]);

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card: Business Plan Studio */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/30 text-indigo-300 ring-1 ring-white/20">
                <FileText className="h-5 w-5 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Business Plan Studio
                  </h1>
                  <Badge className="border-indigo-400/40 bg-indigo-500/25 text-[10px] font-bold text-indigo-200">
                    2.5 PRO REASONING
                  </Badge>
                </div>
                <p className="mt-0.5 max-w-2xl text-xs text-indigo-100/90 sm:text-sm">
                  Create, adapt, and export tailored business plans and grant dossiers for any stakeholder (LEO Grants, Bank Loans, Angel Memos, or 1-Page Lean Plans).
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreatingNewVersion(true)}
                className="border-white/20 bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Plan Version
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveStudioTab('EXPORT')}
                className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export Station
              </Button>
            </div>
          </div>

          {/* Active Version Ribbon Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-indigo-200">Active Plan Version:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {versions.map((ver) => {
                  const isActive = ver.id === activeVersion?.id;
                  return (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => {
                        setActiveVersionId(ver.id);
                        persistVersions(versions, ver.id);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-white/30'
                          : 'bg-white/10 text-indigo-100 hover:bg-white/20'
                      }`}
                    >
                      <span>{ver.title}</span>
                      {isActive && <Check className="h-3 w-3 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meta badges */}
            <div className="flex items-center gap-3 text-xs text-indigo-200">
              <span>
                <strong>{completedSectionsCount}</strong> / {activeVersion?.sections?.length || 0} Sections Ready
              </span>
              <span>•</span>
              <span>
                <strong>{totalWords}</strong> Total Words
              </span>
              {activeVersion?.auditScore !== undefined && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {activeVersion.auditScore}% Audit Score
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save banner feedback */}
      {saveBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            {saveBanner}
          </span>
          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="text-[11px] underline text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Studio Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          size="sm"
          variant={activeStudioTab === 'SECTIONS' ? 'default' : 'ghost'}
          onClick={() => setActiveStudioTab('SECTIONS')}
          className="text-xs font-semibold"
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          Section Builder & Compiler ({completedSectionsCount}/{activeVersion?.sections?.length || 0})
        </Button>
        <Button
          size="sm"
          variant={activeStudioTab === 'AUDIT' ? 'default' : 'ghost'}
          onClick={() => setActiveStudioTab('AUDIT')}
          className="text-xs font-semibold"
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
          Pre-Flight Assessor Audit
          {activeVersion?.auditScore !== undefined && (
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {activeVersion.auditScore}%
            </Badge>
          )}
        </Button>
        <Button
          size="sm"
          variant={activeStudioTab === 'OVERVIEW' ? 'default' : 'ghost'}
          onClick={() => setActiveStudioTab('OVERVIEW')}
          className="text-xs font-semibold"
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Manage Versions ({versions.length})
        </Button>
        <Button
          size="sm"
          variant={activeStudioTab === 'EXPORT' ? 'default' : 'ghost'}
          onClick={() => setActiveStudioTab('EXPORT')}
          className="text-xs font-semibold"
        >
          <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
          Preview & Export Dossier
        </Button>
      </div>

      {/* 3. SUB-TAB CONTENT: SECTION BUILDER & COMPILER */}
      {activeStudioTab === 'SECTIONS' && activeVersion && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{activeVersion.title}</h2>
                <Badge variant="outline" className="border-indigo-300 text-indigo-700 text-[10px]">
                  {activeVersion.targetTone.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Pulls empirical evidence from Modules A–K. Use the AI compiler to generate authoritative, assessor-ready text formatted to strict word limits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenSectionNumber(openSectionNumber === 'ALL' ? 1 : 'ALL')}
                className="text-xs"
              >
                {openSectionNumber === 'ALL' ? 'Collapse All' : 'Expand All Sections'}
              </Button>
            </div>
          </div>

          {/* Section Accordion Items */}
          <div className="space-y-3">
            {activeVersion.sections.map((sec) => {
              const isOpen = openSectionNumber === 'ALL' || openSectionNumber === sec.sectionNumber;
              const isCompiled = (sec.compiledResponseText || '').trim().length > 30;
              const currentWords = (sec.compiledResponseText || '')
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;
              const isOverLimit = currentWords > sec.wordLimit;
              const isCompilingThis = compilingSectionNumber === sec.sectionNumber;

              return (
                <div
                  key={sec.id}
                  className={`rounded-xl border transition-all ${
                    isOpen
                      ? 'border-indigo-200 bg-white p-5 shadow-xs'
                      : 'border-slate-200 bg-white p-4 hover:border-indigo-200 shadow-2xs'
                  }`}
                >
                  {/* Collapsed Bar / Header */}
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenSectionNumber(isOpen ? 0 : sec.sectionNumber)}
                      className="flex items-start gap-3 text-left min-w-0 flex-1"
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          isCompiled
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {isCompiled ? <Check className="h-4 w-4" /> : sec.sectionNumber}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-slate-900">
                            {sec.sectionNumber}. {sec.title}
                          </h3>
                          <Badge
                            variant={isCompiled ? 'default' : 'outline'}
                            className={`text-[10px] ${
                              isCompiled
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'text-slate-500'
                            }`}
                          >
                            {isCompiled ? 'Ready' : 'Draft / Empty'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {sec.assessorQuestionPrompt}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-semibold ${
                          isOverLimit
                            ? 'text-rose-600 font-bold'
                            : currentWords > 0
                              ? 'text-slate-700'
                              : 'text-slate-400'
                        }`}
                      >
                        {currentWords} / {sec.wordLimit}w
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenSectionNumber(isOpen ? 0 : sec.sectionNumber)}
                        className="h-8 w-8 p-0"
                      >
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isOpen && (
                    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                      {/* Assessor Rubric Prompt Card */}
                      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">Assessor Question / Rubric:</span>
                          <span className="text-[11px] font-semibold text-indigo-700">
                            Scoring Weight: {sec.scoringWeightPercent}%
                          </span>
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          {sec.assessorQuestionPrompt}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            Sources Grounded:
                          </span>
                          {sec.sourceModules.map((sm) => (
                            <Badge
                              key={sm}
                              variant="secondary"
                              className="text-[10px] bg-white border border-slate-200"
                            >
                              {sm.replace('MOD_', 'Module ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* 4-Layer Support Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActiveWhyCard((prev) =>
                                prev === sec.sectionNumber ? null : sec.sectionNumber
                              )
                            }
                            className="h-7 border-indigo-200 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                          >
                            <HelpCircle className="mr-1 h-3.5 w-3.5" />
                            Why Are We Asking This?
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActiveExampleCard((prev) =>
                                prev === sec.sectionNumber ? null : sec.sectionNumber
                              )
                            }
                            className="h-7 border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            <Lightbulb className="mr-1 h-3.5 w-3.5" />
                            Show Me an Example
                          </Button>
                        </div>

                        {/* AI Generate Button (2.5 Pro) */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCompileSection(sec)}
                          disabled={isCompilingThis || isVaultReadonly}
                          className="h-8 bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 shadow-xs"
                        >
                          {isCompilingThis ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Compiling with 2.5 Pro...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-200" />
                              Compile Section with AI (2.5 Pro)
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Why Drawer */}
                      {activeWhyCard === sec.sectionNumber && (
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong>Why Assessors & Underwriters Require This:</strong>
                            <button
                              type="button"
                              onClick={() => setActiveWhyCard(null)}
                              className="text-indigo-400 hover:text-indigo-700"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p>
                            Institutional committees (LEO EVAC, Innovate UK, Commercial Banks) score submissions using strict rubrics. They must confirm additionality, realistic operational timelines, and evidence-backed demand rather than unsubstantiated founder hype.
                          </p>
                        </div>
                      )}

                      {/* Example Drawer */}
                      {activeExampleCard === sec.sectionNumber && (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong>High-Scoring Example Excerpt:</strong>
                            <button
                              type="button"
                              onClick={() => setActiveExampleCard(null)}
                              className="text-emerald-500 hover:text-emerald-800"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="italic font-mono text-[11px] bg-white/70 p-2.5 rounded border border-emerald-200/60">
                            &ldquo;Our customer discovery surveyed 84 verified operators, of which 68% confirmed existing solutions cause over 4 hours of weekly administration waste. Willingness-to-pay was anchored at €49/mo, generating a 74% gross margin and an estimated Pocket Profit breakeven crossover by Month 8.&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Text Editor */}
                      <div className="space-y-1.5">
                        <Textarea
                          rows={7}
                          value={sec.compiledResponseText}
                          onChange={(e) =>
                            handleUpdateSectionText(sec.sectionNumber, e.target.value)
                          }
                          placeholder="Section text will be compiled here using your verified data from Modules A–K, or type your custom response..."
                          className="font-sans text-sm leading-relaxed bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:bg-white focus:text-slate-900"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${
                                isOverLimit ? 'text-rose-600 font-bold' : ''
                              }`}
                            >
                              Word Count: {currentWords} / {sec.wordLimit} max words
                            </span>
                            {isOverLimit && (
                              <span className="text-rose-600">
                                ⚠ Exceeds limit by {currentWords - sec.wordLimit} words
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyTextToClipboard(sec.compiledResponseText, sec.id)
                              }
                              disabled={!sec.compiledResponseText}
                              className="h-7 text-xs text-slate-600 hover:text-indigo-600"
                            >
                              {copiedSectionId === sec.id ? (
                                <>
                                  <Check className="mr-1 h-3 w-3 text-emerald-600" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-1 h-3 w-3" />
                                  Copy Text
                                </>
                              )}
                            </Button>
                            {onParkQuestionInSession && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  onParkQuestionInSession(
                                    `Section ${sec.sectionNumber} (${sec.title}): Review and polish final response text`
                                  )
                                }
                                className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                              >
                                <BookmarkPlus className="mr-1 h-3 w-3" />
                                Park in Open Questions
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SUB-TAB CONTENT: PRE-FLIGHT ASSESSOR AUDIT */}
      {activeStudioTab === 'AUDIT' && activeVersion && (
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Pre-Flight Assessor & Contradiction Audit
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Gemini 2.5 Pro performs an adversarial check across all 11 modules to spot contradictions, ungrounded numbers, or missing statutory proofs before submission.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={handleRunAudit}
                  disabled={isAuditing || isVaultReadonly}
                  className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 shadow-xs"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Running 2.5 Pro Audit...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Run Full Plan Audit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Audit Scorecard Hero */}
              <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Committee Approval Readiness Score
                    </span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {activeVersion.auditScore !== undefined
                          ? `${activeVersion.auditScore}%`
                          : 'Not Audited Yet'}
                      </span>
                      <span className="text-xs text-slate-500">
                        (Threshold for approval: ≥ 70%)
                      </span>
                    </div>
                  </div>
                  {activeVersion.lastAuditedAt && (
                    <span className="text-xs text-slate-400">
                      Last Audited: {new Date(activeVersion.lastAuditedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Audit Findings Items */}
              {activeVersion.auditItems && activeVersion.auditItems.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Statutory & Cross-Module Findings:
                  </h3>
                  {activeVersion.auditItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 transition-all ${
                        item.status === 'PASSED'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : item.status === 'WARNING'
                            ? 'border-amber-200 bg-amber-50/40'
                            : 'border-rose-200 bg-rose-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {item.status === 'PASSED' ? (
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                              <Badge
                                variant={item.status === 'PASSED' ? 'default' : 'secondary'}
                                className={`text-[10px] ${
                                  item.status === 'PASSED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {item.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
                            <p className="mt-1 text-[11px] font-medium text-slate-500 italic">
                              Assessor Impact: {item.assessorImpact}
                            </p>
                          </div>
                        </div>

                        {jumpHandler && item.targetModuleCode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              jumpHandler(item.targetModuleCode, item.targetStep)
                            }
                            className="h-7 text-xs text-indigo-700 hover:bg-indigo-50 shrink-0"
                          >
                            Fix in {item.targetModuleCode.replace('MOD_', '')}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  Click &ldquo;Run Full Plan Audit&rdquo; to analyze this business plan version for contradictions and assessor scoring weaknesses.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. SUB-TAB CONTENT: MANAGE PLAN VERSIONS */}
      {activeStudioTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Plan Versions</h2>
              <p className="text-xs text-slate-600">
                Maintain distinct tailored versions of your plan for banks, grant bodies, and angel investors.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreatingNewVersion(true)}
              className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Another Version
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {versions.map((ver) => {
              const isActive = ver.id === activeVersion?.id;
              const cat = ARCHETYPE_CATALOG.find((c) => c.archetype === ver.archetype);

              return (
                <div
                  key={ver.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-white shadow-md ring-2 ring-indigo-400/30'
                      : 'border-slate-200 bg-white hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="border-indigo-200 bg-indigo-50 text-[10px] font-bold text-indigo-700">
                        {cat?.badge || ver.archetype}
                      </Badge>
                      {isActive && (
                        <Badge className="bg-emerald-600 text-[10px] text-white font-bold">
                          ACTIVE
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{ver.title}</h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {cat?.summary || 'Tailored business plan version'}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 space-y-1">
                      <div>
                        Target Audience: <strong>{ver.targetAudience}</strong>
                      </div>
                      <div>
                        Tone: <strong>{ver.targetTone}</strong>
                      </div>
                      <div>
                        Sections: <strong>{ver.sections?.length || 0}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <Button
                      size="sm"
                      variant={isActive ? 'outline' : 'default'}
                      onClick={() => {
                        setActiveVersionId(ver.id);
                        persistVersions(versions, ver.id);
                        setActiveStudioTab('SECTIONS');
                      }}
                      className="text-xs"
                    >
                      {isActive ? 'Edit Sections' : 'Switch to This'}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicateVersion(ver)}
                        title="Duplicate this version"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {versions.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteVersion(ver.id)}
                          title="Delete version"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. SUB-TAB CONTENT: PREVIEW & EXPORT STATION */}
      {activeStudioTab === 'EXPORT' && activeVersion && (
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Document Dossier Preview: {activeVersion.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600">
                    Review the complete synthesized document before export.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="text-xs"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" />
                    Print / Save PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const allText = activeVersion.sections
                        .map(
                          (s) =>
                            `## ${s.sectionNumber}. ${s.title}\n\n${s.compiledResponseText || '(Not compiled)'}\n`
                        )
                        .join('\n\n---\n\n');
                      copyTextToClipboard(allText, 'all-dossier');
                    }}
                    className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    {copiedSectionId === 'all-dossier' ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Copied Entire Dossier!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy Entire Dossier
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Dossier Document Paper View */}
              <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-8 font-serif leading-relaxed text-slate-900">
                {/* Title Sheet */}
                <div className="border-b border-slate-200 pb-6 text-center space-y-2">
                  <Badge variant="outline" className="font-sans text-[10px] tracking-wider uppercase">
                    {activeVersion.targetAudience} DOSSIER
                  </Badge>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                    {plan.title}
                  </h1>
                  <p className="text-sm font-sans text-slate-600">
                    {activeVersion.title} • {selectedCountry}
                  </p>
                  <p className="text-xs font-sans text-slate-400">
                    Compiled: {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Sections Stream */}
                <div className="space-y-8 font-sans">
                  {activeVersion.sections.map((sec) => (
                    <div key={sec.id} className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <h2 className="text-base font-bold text-slate-900">
                          {sec.sectionNumber}. {sec.title}
                        </h2>
                        <span className="text-[11px] text-slate-400">
                          {(sec.compiledResponseText || '').split(/\s+/).filter(Boolean).length}w / {sec.wordLimit}w
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {sec.compiledResponseText || (
                          <span className="text-slate-400 italic">
                            Section not compiled yet. Return to the Section Builder to generate or draft this section.
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: CREATE NEW VERSION */}
      {isCreatingNewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Plan Version</h3>
                <p className="text-xs text-slate-500">
                  Pick an archetype tailored to your target stakeholder.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNewVersion(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Version Title</label>
                <input
                  type="text"
                  value={newVersionTitle}
                  onChange={(e) => setNewVersionTitle(e.target.value)}
                  placeholder="e.g. AIB Term Loan Facility, Enterprise Ireland PSSF..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Choose Plan Archetype</label>
                <div className="mt-1.5 space-y-2 max-h-60 overflow-y-auto">
                  {ARCHETYPE_CATALOG.map((cat) => (
                    <label
                      key={cat.archetype}
                      className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs transition-all ${
                        selectedArchetypeForNew === cat.archetype
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="archetype-select"
                        checked={selectedArchetypeForNew === cat.archetype}
                        onChange={() => setSelectedArchetypeForNew(cat.archetype)}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{cat.title}</div>
                        <p className="mt-0.5 text-[11px] text-slate-500">{cat.summary}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreatingNewVersion(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateVersion}
                disabled={!newVersionTitle.trim()}
                className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Create Version
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
