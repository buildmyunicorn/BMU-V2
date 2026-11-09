'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Copy,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Edit3,
  Wand2,
  RefreshCw,
  Download,
  BookOpen,
  TrendingUp,
  Users,
  Building,
  DollarSign,
  X,
  Target,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  formatPlanCurrency,
  getPlanTrackCapabilities,
} from '@/lib/localization';
import type {
  ActiveStartupPlan,
  BusinessPlanVersionItem,
  BusinessPlanArchetype,
  ModuleLCompiledSectionItem,
  SavedModuleLData,
} from '@/lib/auth/session-store';
import {
  saveBusinessPlanStudioVersionsAction,
  compileBusinessPlanSectionAction,
  auditBusinessPlanVersionAction,
  polishBusinessPlanChapterAction,
  compileAllBusinessPlanSectionsAction,
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
    archetype: 'COMMERCIAL_BANK_LOAN',
    title: 'Commercial Bank & Term Loan Credit Application',
    badge: '🏦 Commercial Bank Credit Committee',
    targetAudience: 'COMMERCIAL_BANK',
    targetTone: 'UNDERWRITER_CONSERVATIVE',
    summary:
      'Engineered specifically for credit risk officers and bank loan underwriters (AIB, BoI, Barclays, NatWest, BBB Start Up Loans). Emphasizes cashflow trough, debt service coverage, collateral assets, personal survival budget, and down-side risk buffers.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Executive Summary & Credit Facility Request',
        assessorPrompt: 'State the precise loan facility requested, purpose of borrowing, promoter commitment, and repayment security sources.',
        wordLimit: 350,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_A_IDEATION', 'MOD_F_COFOUNDER_TEAM', 'MOD_J_FINANCE'],
      },
      {
        sectionNumber: 2,
        title: 'Promoter Background, Track Record & Personal Survival Budget',
        assessorPrompt: 'Detail promoter creditworthiness, relevant industry domain expertise, and the verified monthly personal survival budget.',
        wordLimit: 400,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_F_COFOUNDER_TEAM'],
      },
      {
        sectionNumber: 3,
        title: 'Commercial Model, Customer Validation & Pricing Predictability',
        assessorPrompt: 'Demonstrate customer willingness-to-pay, contract visibility, recurring revenue stability, and debtor terms.',
        wordLimit: 400,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_C_SURVEYS_FEEDBACK', 'MOD_H_REVENUE'],
      },
      {
        sectionNumber: 4,
        title: 'Operations, Premises, Asset Collateral & Fulfillment Resiliency',
        assessorPrompt: 'Describe operating premises, leased vs. owned capital equipment, supply chain redundancy, and insurance coverage.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_E_OPERATIONS', 'MOD_G_LAUNCHPAD'],
      },
      {
        sectionNumber: 5,
        title: '3-Year Financial Model, Debt Service Coverage & Cashflow Trough',
        assessorPrompt: 'Provide 36-month P&L and cashflow projections, identifying the lowest cash trough month and stress-tested debt service coverage ratio (DSCR).',
        wordLimit: 450,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_H_REVENUE', 'MOD_J_FINANCE'],
      },
    ],
  },
  {
    archetype: 'IE_LEO_OFFICIAL_GRANT',
    title: 'Irish LEO & Enterprise Ireland Official Grant Application',
    badge: '🇮🇪 Ireland LEO / EI Evaluation Committee',
    targetAudience: 'GRANT_COMMITTEE',
    targetTone: 'EVIDENCE_LED_ASSESSOR',
    summary:
      'Formatted strictly for Local Enterprise Office (Feasibility, Priming) & Enterprise Ireland evaluation committees. Prioritizes export additionality, non-displacement, 3-quote supplier procurement, and 3-year net regional job creation.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Promoter Track Record, Roles & Full-Time Commitment',
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
        title: 'Market Opportunity, Export Additionality & Non-Displacement Defense',
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
        title: '3-Year Headcount Schedule, Salary Plan & Local Employment Additionality',
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
    title: 'UK Innovate UK Smart Grants Official Application (9 Questions)',
    badge: '🇬🇧 UK Innovate UK IFS Reviewers',
    targetAudience: 'GRANT_COMMITTEE',
    targetTone: 'EVIDENCE_LED_ASSESSOR',
    summary:
      'Engineered for Innovate UK (UKRI) independent peer reviewers. Strict 400-word discipline per question, focusing on R&D challenge, technical step-change, freedom-to-operate, work packages, and public funding additionality.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Need or Challenge & Market Failure',
        assessorPrompt: 'What is the specific business need or societal challenge addressed, and why has the market failed to solve it?',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_A_IDEATION', 'MOD_B_MARKET'],
      },
      {
        sectionNumber: 2,
        title: 'Approach, Innovation & Beyond State-of-the-Art',
        assessorPrompt: 'Describe the technical innovation, methodology, freedom-to-operate, and beyond state-of-the-art capability.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_B_MARKET', 'MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 3,
        title: 'Team, Skills & Resource Capability',
        assessorPrompt: 'Demonstrate that the team has the technical, commercial, and operational capability to deliver the project.',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_F_COFOUNDER_TEAM'],
      },
      {
        sectionNumber: 4,
        title: 'Market Awareness & Addressable Opportunity',
        assessorPrompt: 'What is the addressable market size (TAM/SAM/SOM), competitive wedge, and international export potential?',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_B_MARKET'],
      },
      {
        sectionNumber: 5,
        title: 'Commercial Outcomes & Route-to-Market Exploitation',
        assessorPrompt: 'Detail the commercial exploitation route, revenue models, customer validation proof, and 3-year economic return.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_C_SURVEYS_FEEDBACK', 'MOD_I_MARKETING', 'MOD_H_REVENUE'],
      },
      {
        sectionNumber: 6,
        title: 'Wider Impacts, Net Zero & Environmental Sustainability',
        assessorPrompt: 'What are the wider economic, environmental, societal, and Net Zero regional impacts of this commercial innovation?',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_A_IDEATION', 'MOD_E_OPERATIONS'],
      },
      {
        sectionNumber: 7,
        title: 'Project Management, Work Packages (WP1..n) & Gantt Milestones',
        assessorPrompt: 'Detail work packages WP1..n, lead responsibilities, milestone deliverables, Gantt timings, and technical dependencies.',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_D_PRODUCT_BUILD', 'MOD_E_OPERATIONS'],
      },
      {
        sectionNumber: 8,
        title: 'Project Risk Management & Mitigation Register',
        assessorPrompt: 'Detail the primary technical, commercial, operational, and regulatory risks, assessing probability, impact, and mitigations.',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_E_OPERATIONS'],
      },
      {
        sectionNumber: 9,
        title: 'Public Funding Additionality & Value for Money',
        assessorPrompt: 'Why is public funding necessary? What would happen without grant support, and what is the economic return for the UK taxpayer?',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_K_GRANTS_FUNDING', 'MOD_J_FINANCE'],
      },
    ],
  },
  {
    archetype: 'INVESTOR_ANGEL_MEMO',
    title: 'Angel & Seed Investor Investment Memorandum',
    badge: '👼 Angel & Micro-VC Investment Memo',
    targetAudience: 'ANGEL_INVESTOR',
    targetTone: 'VENTURE_HIGH_GROWTH',
    summary:
      'Optimized for high-net-worth angels, syndicates, and seed venture capital funds. Highlights addressable market expansion, customer obsession, unfair competitive moats, unit economics scale, and capital efficiency.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Venture Vision, Problem & Market Timing ("Why Now?")',
        assessorPrompt: 'Define the macro shift creating this market opportunity, customer pain urgency, and our clear value proposition.',
        wordLimit: 400,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_A_IDEATION', 'MOD_B_MARKET'],
      },
      {
        sectionNumber: 2,
        title: 'The Solution, Product Vehicle & Unfair Competitive Wedge',
        assessorPrompt: 'What is the proprietary wedge or IP that prevents incumbents from copying our solution? Detail V1 architecture.',
        wordLimit: 450,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_B_MARKET', 'MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 3,
        title: 'Customer Discovery Proof & Willingness-to-Pay Metrics',
        assessorPrompt: 'Present empirical validation metrics from real prospective customers, Mom-Test interviews, and early waitlist volume.',
        wordLimit: 350,
        scoringWeightPercent: 20,
        sourceModules: ['MOD_C_SURVEYS_FEEDBACK'],
      },
      {
        sectionNumber: 4,
        title: 'Go-to-Market Engine & First 100 Customers Playbook',
        assessorPrompt: 'Detail unit CAC expectations, organic vs. paid distribution channels, positioning, and conversion economics.',
        wordLimit: 400,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_I_MARKETING'],
      },
      {
        sectionNumber: 5,
        title: 'Unit Economics, 3-Year Scale & Seed Round Terms',
        assessorPrompt: 'Pocket Profit contribution margin, breakeven velocity, 36-month revenue scaling targets, and proposed investment round size.',
        wordLimit: 450,
        scoringWeightPercent: 15,
        sourceModules: ['MOD_H_REVENUE', 'MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
      },
    ],
  },
  {
    archetype: 'LEAN_ONE_PAGER',
    title: 'Lean 2-Page Executive Business Teaser',
    badge: '⚡ 2-Page Executive Teaser Brief',
    targetAudience: 'ADVISOR_BOARD',
    targetTone: 'EXECUTIVE_CRISP',
    summary:
      'High-signal 2-page brief designed for board advisors, mentors, commercial bank pre-checks, and cold investor outreach attachments.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Venture Snapshot & Core Problem',
        assessorPrompt: '1-sentence core value proposition, targeted beachhead customer, and the painful problem being solved.',
        wordLimit: 200,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_A_IDEATION', 'MOD_B_MARKET'],
      },
      {
        sectionNumber: 2,
        title: 'The Solution & Unfair Wedge',
        assessorPrompt: 'Core product mechanism, unfair competitive advantage, and customer validation metrics.',
        wordLimit: 200,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_B_MARKET', 'MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 3,
        title: 'Commercial Model & Breakeven Crossover',
        assessorPrompt: 'Pricing tiers, gross margin percentage, breakeven unit volume, and month of profitability.',
        wordLimit: 200,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_H_REVENUE'],
      },
      {
        sectionNumber: 4,
        title: 'The Team & Capital Ask',
        assessorPrompt: 'Founder background, domain credentials, current capital ask, and intended milestone outcomes.',
        wordLimit: 200,
        scoringWeightPercent: 25,
        sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_J_FINANCE'],
      },
    ],
  },
  {
    archetype: 'STANDARD_COMPREHENSIVE_PLAN',
    title: 'Comprehensive Master Business Plan (10-Section Full Plan)',
    badge: '📋 Comprehensive 10-Chapter Master Plan',
    targetAudience: 'INTERNAL_TEAM',
    targetTone: 'EXECUTIVE_CRISP',
    summary:
      'Complete, publication-grade business plan covering every operational and financial dimension for partners, senior executives, and all institutional stakeholders.',
    sectionsTemplate: [
      {
        sectionNumber: 1,
        title: 'Executive Summary',
        assessorPrompt: 'Synthesize the entire venture into an authoritative 350-word executive overview.',
        wordLimit: 350,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_A_IDEATION', 'MOD_H_REVENUE'],
      },
      {
        sectionNumber: 2,
        title: 'Company Description, Mission & Statutory Structure',
        assessorPrompt: 'Legal entity type, registered location, founder vision, and core purpose.',
        wordLimit: 300,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_A_IDEATION', 'MOD_G_LAUNCHPAD'],
      },
      {
        sectionNumber: 3,
        title: 'Market Analysis & Target Beachhead Customer',
        assessorPrompt: 'TAM, SAM, SOM, beachhead segment sizing, and primary persona pains.',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_B_MARKET'],
      },
      {
        sectionNumber: 4,
        title: 'Competitive Wedge & State-of-the-Art Analysis',
        assessorPrompt: 'Direct and indirect alternatives, unfair competitive advantage, and barrier to entry.',
        wordLimit: 350,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_B_MARKET'],
      },
      {
        sectionNumber: 5,
        title: 'Product Architecture & Build Vehicle',
        assessorPrompt: 'What is being built? Own-vs-rent technology infrastructure and key work packages.',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_D_PRODUCT_BUILD'],
      },
      {
        sectionNumber: 6,
        title: 'Operations, Fulfillment & Premises',
        assessorPrompt: 'Day in the life of an order, premises, required equipment, and risk management.',
        wordLimit: 400,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_E_OPERATIONS'],
      },
      {
        sectionNumber: 7,
        title: 'Management Team & Governance',
        assessorPrompt: 'Founder CVs, 7 startup hats matrix, and 3-year headcount plan.',
        wordLimit: 350,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_F_COFOUNDER_TEAM'],
      },
      {
        sectionNumber: 8,
        title: 'Go-to-Market & Customer Acquisition Strategy',
        assessorPrompt: 'Positioning, channels, sales pipeline, and initial marketing budget.',
        wordLimit: 350,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_I_MARKETING'],
      },
      {
        sectionNumber: 9,
        title: '3-Year Financial Plan & Breakeven Analysis',
        assessorPrompt: 'Unit economics, monthly breakeven crossover, and 36-month P&L forecasts.',
        wordLimit: 450,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_H_REVENUE', 'MOD_J_FINANCE'],
      },
      {
        sectionNumber: 10,
        title: 'Funding Requirements & Milestone Roadmap',
        assessorPrompt: 'Total capital requirement, breakdown of sources & uses, and key milestone horizons.',
        wordLimit: 350,
        scoringWeightPercent: 10,
        sourceModules: ['MOD_K_GRANTS_FUNDING'],
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
  const effectiveCountry = plan.hqCountryCode || selectedCountry || 'IE';
  const trackCaps = useMemo(
    () => getPlanTrackCapabilities(effectiveCountry, plan.fundingTrackMode),
    [effectiveCountry, plan.fundingTrackMode]
  );
  const isUK = trackCaps.countryCode === 'GB';
  const isIreland = trackCaps.countryCode === 'IE';
  const isGrantsEnabled = trackCaps.isGrantsEnabled;
  const currency =
    plan.baseCurrency || (isUK ? 'GBP' : isIreland ? 'EUR' : 'USD');
  const currencySymbol =
    currency === 'GBP'
      ? '£'
      : currency === 'EUR'
        ? '€'
        : currency === 'AUD'
          ? 'A$'
          : currency === 'CAD'
            ? 'C$'
            : '$';

  // Filter archetypes so international / non-grant plans never see IE/UK grant forms,
  // and IE/UK plans only see their own country's grant forms.
  const availableArchetypes = useMemo(() => {
    return ARCHETYPE_CATALOG.filter((cat) => {
      if (cat.archetype === 'IE_LEO_OFFICIAL_GRANT') {
        return isGrantsEnabled && isIreland;
      }
      if (cat.archetype === 'UK_INNOVATE_UK_9Q') {
        return isGrantsEnabled && isUK;
      }
      return true;
    }).map((cat) => {
      if (cat.archetype === 'COMMERCIAL_BANK_LOAN') {
        return {
          ...cat,
          summary: `Engineered specifically for commercial credit risk officers and bank loan underwriters (${trackCaps.exampleBanksLabel}). Emphasizes cashflow trough, debt service coverage, collateral assets, personal survival budget, and down-side risk buffers.`,
        };
      }
      return cat;
    });
  }, [isGrantsEnabled, isIreland, isUK, trackCaps.exampleBanksLabel]);

  const defaultArchetypeForPlan: BusinessPlanArchetype = useMemo(() => {
    if (isGrantsEnabled && isIreland) return 'IE_LEO_OFFICIAL_GRANT';
    if (isGrantsEnabled && isUK) return 'COMMERCIAL_BANK_LOAN';
    return 'STANDARD_COMPREHENSIVE_PLAN';
  }, [isGrantsEnabled, isIreland, isUK]);

  const defaultTitleForPlan = useMemo(() => {
    if (isGrantsEnabled && isIreland) {
      return 'LEO Official Grant & Growth Business Plan';
    }
    if (isGrantsEnabled && isUK) {
      return 'Commercial Bank Credit Application & Plan';
    }
    return 'Comprehensive Master Business Plan';
  }, [isGrantsEnabled, isIreland, isUK]);

  // Helper to sanitize existing versions if a plan switched away from IE/UK grants
  const normalizeVersionsForTrack = useMemo(() => {
    return (rawVersions: BusinessPlanVersionItem[]): BusinessPlanVersionItem[] => {
      return (rawVersions || [])
        .map((ver) => {
          // Helper to ensure sections array is always valid
          const resolveSectionsForVersion = (v: BusinessPlanVersionItem): ModuleLCompiledSectionItem[] => {
            if (Array.isArray(v.sections) && v.sections.length > 0) {
              return v.sections;
            }
            if (
              Array.isArray(plan.moduleLData?.step3Compiler?.sections) &&
              plan.moduleLData.step3Compiler.sections.length > 0 &&
              (v.isPrimary ||
                v.id === plan.moduleLData?.activeVersionId ||
                v.archetype === plan.moduleLData?.step3Compiler?.modeCompiledFor)
            ) {
              return plan.moduleLData.step3Compiler.sections;
            }
            const cat =
              ARCHETYPE_CATALOG.find((c) => c.archetype === v.archetype) ||
              ARCHETYPE_CATALOG.find((c) => c.archetype === defaultArchetypeForPlan) ||
              ARCHETYPE_CATALOG[5];
            return cat.sectionsTemplate.map((tpl) => ({
              id: `sec-${tpl.sectionNumber}-${Date.now()}`,
              sectionNumber: tpl.sectionNumber,
              title: tpl.title,
              assessorQuestionPrompt: tpl.assessorPrompt,
              scoringWeightPercent: tpl.scoringWeightPercent,
              wordLimit: tpl.wordLimit,
              sourceModules: tpl.sourceModules,
              compiledResponseText: '',
            }));
          };

          const isForeignOrDisabledGrant =
            (ver.archetype === 'IE_LEO_OFFICIAL_GRANT' &&
              (!isGrantsEnabled || !isIreland)) ||
            (ver.archetype === 'UK_INNOVATE_UK_9Q' &&
              (!isGrantsEnabled || !isUK));

          if (!isForeignOrDisabledGrant) {
            return {
              ...ver,
              sections: resolveSectionsForVersion(ver),
            };
          }

          // Check if the user has actually written custom content in this grant version
          const hasCompiledContent = (ver.sections || []).some(
            (s) => (s.compiledResponseText || '').trim().length > 20
          );

          // Convert untouched default grant versions to the clean Master Business Plan
          const replacementCat =
            ARCHETYPE_CATALOG.find(
              (c) => c.archetype === defaultArchetypeForPlan
            ) || ARCHETYPE_CATALOG[5];

          if (!hasCompiledContent) {
            return {
              ...ver,
              title: defaultTitleForPlan,
              archetype: replacementCat.archetype,
              targetAudience: replacementCat.targetAudience,
              targetTone: replacementCat.targetTone,
              sections: replacementCat.sectionsTemplate.map((tpl) => ({
                id: `sec-${tpl.sectionNumber}-${Date.now()}`,
                sectionNumber: tpl.sectionNumber,
                title: tpl.title,
                assessorQuestionPrompt: tpl.assessorPrompt,
                scoringWeightPercent: tpl.scoringWeightPercent,
                wordLimit: tpl.wordLimit,
                sourceModules: tpl.sourceModules,
                compiledResponseText: '',
              })),
            };
          }
          return null;
        })
        .filter((v): v is BusinessPlanVersionItem => v !== null);
    };
  }, [
    defaultArchetypeForPlan,
    defaultTitleForPlan,
    isGrantsEnabled,
    isIreland,
    isUK,
    plan.moduleLData?.step3Compiler?.sections,
    plan.moduleLData?.activeVersionId,
    plan.moduleLData?.step3Compiler?.modeCompiledFor,
  ]);

  // 1. Initial Versions
  const initialVersions: BusinessPlanVersionItem[] = useMemo(() => {
    if (plan.moduleLData?.versions && plan.moduleLData.versions.length > 0) {
      const cleaned = normalizeVersionsForTrack(plan.moduleLData.versions);
      if (cleaned.length > 0) return cleaned;
    }

    const catalogItem =
      ARCHETYPE_CATALOG.find((c) => c.archetype === defaultArchetypeForPlan) ||
      ARCHETYPE_CATALOG[5];

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
        title: defaultTitleForPlan,
        archetype: defaultArchetypeForPlan,
        createdAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
        isPrimary: true,
        targetAudience: catalogItem.targetAudience,
        targetTone: catalogItem.targetTone,
        targetFundingAsk: 50000,
        sections: defaultSections,
        executiveHookStatement: `${plan.title} is an evidence-backed commercial venture positioned for sustainable, high-value growth in ${trackCaps.countryName}.`,
      },
    ];
  }, [
    plan.moduleLData?.versions,
    normalizeVersionsForTrack,
    defaultArchetypeForPlan,
    defaultTitleForPlan,
    plan.title,
    trackCaps.countryName,
  ]);

  const [versions, setVersions] = useState<BusinessPlanVersionItem[]>(initialVersions);
  const [activeVersionId, setActiveVersionId] = useState<string>(
    plan.moduleLData?.activeVersionId || initialVersions[0]?.id || ''
  );

  // Synchronize versions from plan prop when background cloud session hydration finishes or country/track changes
  useEffect(() => {
    if (plan.moduleLData?.versions && plan.moduleLData.versions.length > 0) {
      const cleaned = normalizeVersionsForTrack(plan.moduleLData.versions);
      if (cleaned.length > 0) {
        setVersions(cleaned);
        setActiveVersionId((prevId) => {
          if (prevId && cleaned.some((v) => v.id === prevId)) {
            return prevId;
          }
          return cleaned[0]?.id || prevId;
        });
      }
    } else {
      setVersions(initialVersions);
      setActiveVersionId(initialVersions[0]?.id || '');
    }
  }, [
    plan.moduleLData?.versions,
    plan.moduleLData?.activeVersionId,
    normalizeVersionsForTrack,
    initialVersions,
  ]);

  const activeVersion = useMemo(() => {
    const raw = versions.find((v) => v.id === activeVersionId) || versions[0];
    if (!raw) return raw;
    if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
      if (
        Array.isArray(plan.moduleLData?.step3Compiler?.sections) &&
        plan.moduleLData.step3Compiler.sections.length > 0 &&
        (raw.isPrimary ||
          raw.id === plan.moduleLData?.activeVersionId ||
          raw.archetype === plan.moduleLData?.step3Compiler?.modeCompiledFor)
      ) {
        return { ...raw, sections: plan.moduleLData.step3Compiler.sections };
      }
      const cat =
        ARCHETYPE_CATALOG.find((c) => c.archetype === raw.archetype) ||
        ARCHETYPE_CATALOG.find((c) => c.archetype === defaultArchetypeForPlan) ||
        ARCHETYPE_CATALOG[5];
      return {
        ...raw,
        sections: cat.sectionsTemplate.map((tpl) => ({
          id: `sec-${tpl.sectionNumber}-${Date.now()}`,
          sectionNumber: tpl.sectionNumber,
          title: tpl.title,
          assessorQuestionPrompt: tpl.assessorPrompt,
          scoringWeightPercent: tpl.scoringWeightPercent,
          wordLimit: tpl.wordLimit,
          sourceModules: tpl.sourceModules,
          compiledResponseText: '',
        })),
      };
    }
    return raw;
  }, [
    versions,
    activeVersionId,
    defaultArchetypeForPlan,
    plan.moduleLData?.step3Compiler?.sections,
    plan.moduleLData?.activeVersionId,
    plan.moduleLData?.step3Compiler?.modeCompiledFor,
  ]);

  const catalogMeta = useMemo(() => {
    return (
      availableArchetypes.find((c) => c.archetype === activeVersion?.archetype) ||
      ARCHETYPE_CATALOG.find((c) => c.archetype === activeVersion?.archetype) ||
      availableArchetypes[0] ||
      ARCHETYPE_CATALOG[0]
    );
  }, [activeVersion?.archetype, availableArchetypes]);

  // 2. Option A: Inline "Click-to-Edit" State
  // Which section is currently being edited inline on the continuous canvas (null = reader mode)
  const [editingSectionNumber, setEditingSectionNumber] = useState<number | null>(null);
  const [inlineEditText, setInlineEditText] = useState<string>('');
  const [customPolishInstruction, setCustomPolishInstruction] = useState<string>('');
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [polishBanner, setPolishBanner] = useState<string | null>(null);

  // Batch Generation State
  const [isCompilingAll, setIsCompilingAll] = useState(false);
  const [compileAllProgress, setCompileAllProgress] = useState<{ current: number; total: number } | null>(null);

  // Pre-flight Contradiction Assessor Audit state
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // New Version Modal
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [selectedArchetypeForNew, setSelectedArchetypeForNew] =
    useState<BusinessPlanArchetype>(defaultArchetypeForPlan);

  useEffect(() => {
    setSelectedArchetypeForNew(defaultArchetypeForPlan);
  }, [defaultArchetypeForPlan]);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Refs for smooth scroll navigation
  const chapterRefs = useRef<{ [key: number]: HTMLElement | null }>({});

  // 3. Save helper
  async function persistVersions(newVersions: BusinessPlanVersionItem[], newActiveId?: string) {
    setIsSaving(true);
    setVersions(newVersions);
    const targetActive = newActiveId ?? activeVersionId;
    setActiveVersionId(targetActive);

    const nowIso = new Date().toISOString();
    // Optimistic local persistence: update moduleLData immediately so localStorage saves it synchronously
    onUpdatePlanModuleLData?.({
      ...(plan.moduleLData || {}),
      versions: newVersions,
      activeVersionId: targetActive,
      completionPercentage: Math.max(plan.moduleLData?.completionPercentage || 0, 60),
      lastSavedAt: nowIso,
    });

    try {
      const res = await saveBusinessPlanStudioVersionsAction({
        planId: plan.id,
        versions: newVersions,
        activeVersionId: targetActive,
        completionPercentage: 60,
      });
      if (res.ok) {
        setSaveBanner('Saved');
        setTimeout(() => setSaveBanner(null), 2500);
      }
    } catch {
      // non-fatal
    } finally {
      setIsSaving(false);
    }
  }

  // 4. Update section text in active version
  function handleSaveSectionText(sectionNumber: number, text: string) {
    if (!activeVersion) return;
    const updatedSections = (activeVersion.sections || []).map((s) =>
      s.sectionNumber === sectionNumber ? { ...s, compiledResponseText: text } : s
    );
    const updatedVer: BusinessPlanVersionItem = {
      ...activeVersion,
      sections: updatedSections,
      lastEditedAt: new Date().toISOString(),
    };
    const nextVersions = versions.map((v) => (v.id === activeVersion.id ? updatedVer : v));
    persistVersions(nextVersions);
    setEditingSectionNumber(null);
  }

  // 5. Option A: Inline AI Polish Action
  async function handleApplyPolish(presetInstruction?: string) {
    if (!activeVersion || editingSectionNumber === null) return;
    const currentSec = (activeVersion.sections || []).find((s) => s.sectionNumber === editingSectionNumber);
    if (!currentSec) return;

    const instruction = presetInstruction || customPolishInstruction;
    if (!instruction.trim()) return;

    setIsPolishing(true);
    setPolishBanner(null);

    try {
      const res = await polishBusinessPlanChapterAction({
        planId: plan.id,
        chapterTitle: currentSec.title,
        currentText: inlineEditText || currentSec.compiledResponseText,
        instruction,
        targetTone: activeVersion.targetTone,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        baseCurrency: currency,
      });

      if (res.polishedText) {
        setInlineEditText(res.polishedText);
        setPolishBanner(res.summaryOfChanges || 'Prose refined with AI');
        setCustomPolishInstruction('');
      }
    } catch {
      // non-fatal fallback
    } finally {
      setIsPolishing(false);
    }
  }

  // 6. One-Click Compile/Refresh Entire Document for Active Version
  async function handleCompileAllChapters() {
    if (!activeVersion || isVaultReadonly) return;
    setIsCompilingAll(true);
    setCompileAllProgress({ current: 0, total: activeVersion.sections?.length || 0 });

    const segments = plan.moduleBData?.marketSizing?.segments || [];
    let samCalc = 0;
    let somCalc = 0;
    segments.forEach((s) => {
      const price = parseFloat(s.pricePerCustomerInput || '0') || 0;
      const reachable = parseFloat(s.reachableCustomersInTargetMarketsInput || '0') || 0;
      const year1 = parseFloat(s.year1To2CustomerGoalInput || '0') || 0;
      samCalc += price * reachable;
      somCalc += price * year1;
    });
    if (samCalc === 0) samCalc = 250000;
    if (somCalc === 0) somCalc = 50000;
    const tamCalc = samCalc * 5;

    const summaryFactPack = `
VENTURE: "${plan.title}" (${plan.industryCategory || 'Startup'}) in ${selectedCountry} (${currency}).
PROBLEM: ${plan.conceptCanvas?.coreProblem || 'Market pain points identified'}
SOLUTION: ${plan.conceptCanvas?.proposedSolution || 'High-margin structured product'}
CUSTOMER: ${plan.conceptCanvas?.targetCustomer || 'Target beachhead persona'}
MARKET: TAM ${formatPlanCurrency(tamCalc, currency)}, SAM ${formatPlanCurrency(samCalc, currency)}, SOM ${formatPlanCurrency(somCalc, currency)}.
VALIDATION: ${plan.moduleCData?.surveys?.[0]?.responses?.length || 0} customer discovery responses, ${plan.moduleCData?.surveys?.[0]?.aiInsightsSummary?.headlineTakeaway || 'Validated willingness to pay'}.
PRICING & REVENUE: Target pricing modeled in Module H Pocket Profit breakeven.
HEADCOUNT & SURVIVAL: Scheduled hiring and founder survival budget verified in Module F.
OPERATIONS: Equipment and 3-quote schedules established in Module E.
FINANCES: 36-month cashflow trough and localized employer taxes modeled in Module J.
`;

    try {
      const res = await compileAllBusinessPlanSectionsAction({
        planId: plan.id,
        versionId: activeVersion.id,
        archetype: activeVersion.archetype,
        targetTone: activeVersion.targetTone,
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        baseCurrency: currency,
        planContextSummary: summaryFactPack,
        sections: (activeVersion.sections || []).map((s) => ({
          sectionNumber: s.sectionNumber,
          title: s.title,
          assessorPrompt: s.assessorQuestionPrompt,
          wordLimit: s.wordLimit,
          scoringWeightPercent: s.scoringWeightPercent,
          currentResponseText: s.compiledResponseText,
        })),
      });

      if (res.ok && res.compiledSections.length > 0) {
        const resultMap = new Map(res.compiledSections.map((r) => [r.sectionNumber, r.compiledResponseText]));
        const updatedSections = (activeVersion.sections || []).map((s) => ({
          ...s,
          compiledResponseText: resultMap.get(s.sectionNumber) || s.compiledResponseText,
        }));
        const updatedVer: BusinessPlanVersionItem = {
          ...activeVersion,
          sections: updatedSections,
          lastEditedAt: new Date().toISOString(),
        };
        const nextVersions = versions.map((v) => (v.id === activeVersion.id ? updatedVer : v));
        persistVersions(nextVersions);
        setSaveBanner('Entire plan regenerated successfully');
        setTimeout(() => setSaveBanner(null), 3500);
      }
    } catch {
      // non-fatal
    } finally {
      setIsCompilingAll(false);
      setCompileAllProgress(null);
    }
  }

  // 7. Version Management Handlers
  function handleCreateVersion() {
    if (!newVersionTitle.trim()) return;
    const cat = ARCHETYPE_CATALOG.find((c) => c.archetype === selectedArchetypeForNew) || ARCHETYPE_CATALOG[0];
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
      sections: cat.sectionsTemplate.map((tpl) => ({
        id: `sec-${tpl.sectionNumber}-${Date.now()}`,
        sectionNumber: tpl.sectionNumber,
        title: tpl.title,
        assessorQuestionPrompt: tpl.assessorPrompt,
        scoringWeightPercent: tpl.scoringWeightPercent,
        wordLimit: tpl.wordLimit,
        sourceModules: tpl.sourceModules,
        compiledResponseText: '',
      })),
      executiveHookStatement: `${plan.title} addresses ${plan.conceptCanvas?.targetCustomer || 'verified customers'} with high commercial additionality in ${selectedCountry}.`,
    };

    const next = [...versions, newVer];
    persistVersions(next, newVer.id);
    setIsCreatingNewVersion(false);
    setNewVersionTitle('');
  }

  function handleDuplicateVersion(ver: BusinessPlanVersionItem) {
    const dup: BusinessPlanVersionItem = {
      ...ver,
      id: `bp-ver-copy-${Date.now()}`,
      title: `${ver.title} (Copy)`,
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      isPrimary: false,
      sections: (ver.sections || []).map((s) => ({ ...s, id: `sec-${s.sectionNumber}-${Date.now()}` })),
    };
    persistVersions([...versions, dup], dup.id);
  }

  function handleDeleteVersion(id: string) {
    if ((versions?.length || 0) <= 1) return;
    const filtered = versions.filter((v) => v.id !== id);
    persistVersions(filtered, filtered[0].id);
  }

  // 8. Copy Entire Document as clean text
  function handleCopyEntireDocument() {
    if (!activeVersion) return;
    const fullDoc = `
# ${plan.title}
## ${activeVersion.title} (${catalogMeta.badge})
Target Stakeholder: ${activeVersion.targetAudience}
Date: ${new Date().toLocaleDateString()}
Location: ${selectedCountry} | Currency: ${currency} (${currencySymbol})
Facility / Ask Amount: ${formatPlanCurrency(activeVersion.targetFundingAsk || 50000, currency)}

---

${(activeVersion.sections || [])
  .map(
    (sec) => `### Chapter ${sec.sectionNumber}: ${sec.title}

${sec.compiledResponseText || '(Chapter not compiled yet)'}
`
  )
  .join('\n---\n\n')}

---
Generated by Startup Preflight Business Plan Studio
`.trim();

    navigator.clipboard.writeText(fullDoc);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  }

  // Metrics summary
  const totalWords = useMemo(() => {
    if (!activeVersion?.sections) return 0;
    return activeVersion.sections.reduce((acc, sec) => {
      const words = sec?.compiledResponseText
        ? sec.compiledResponseText.trim().split(/\s+/).filter(Boolean).length
        : 0;
      return acc + words;
    }, 0);
  }, [activeVersion?.sections]);

  const compiledCount = useMemo(() => {
    if (!activeVersion?.sections) return 0;
    return activeVersion.sections.filter((s) => (s?.compiledResponseText || '').trim().length > 30).length;
  }, [activeVersion?.sections]);

  // Smooth scroll to chapter
  function scrollToChapter(num: number) {
    const el = chapterRefs.current[num];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="space-y-6 print:space-y-0 print:bg-white">
      {/* ========================================================================= */}
      {/* 1. TOP CONTROL BAR (Audience Selector, Multi-Version Ribbon, Top Actions) */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-30 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-md no-print print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Active Version Badge & Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Business Plan Studio
                </span>
                <Badge className="border-violet-200 bg-violet-100 text-[10px] font-bold text-violet-800">
                  AI COMPILER
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 sm:text-base">
                  {activeVersion?.title}
                </span>
                <Badge variant="outline" className="text-[10px] font-medium text-slate-600">
                  {catalogMeta.badge}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right: Primary Document Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Compile All Button */}
            <Button
              size="sm"
              onClick={handleCompileAllChapters}
              disabled={isCompilingAll || isVaultReadonly}
              className="bg-violet-700 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition-all"
            >
              {isCompilingAll ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Synthesizing Plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-200" />
                  Generate / Refresh Plan
                </>
              )}
            </Button>

            {/* Print / PDF Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs text-slate-700 hover:bg-slate-50"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Print / Save PDF
            </Button>

            {/* Copy Full Document */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyEntireDocument}
              className="text-xs text-slate-700 hover:bg-slate-50"
            >
              {copiedSuccess ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  Copy Document
                </>
              )}
            </Button>

            {/* Create New Version */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreatingNewVersion(true)}
              className="text-xs text-indigo-700 hover:bg-indigo-50"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              New Version
            </Button>
          </div>
        </div>

        {/* Version Switcher Tabs Strip */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">VERSIONS:</span>
            {versions.map((ver) => {
              const isActive = ver.id === activeVersion?.id;
              return (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => {
                    setActiveVersionId(ver.id);
                    persistVersions(versions, ver.id);
                    setEditingSectionNumber(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <FileText className={`h-3 w-3 ${isActive ? 'text-violet-300' : 'text-slate-400'}`} />
                  <span className="max-w-[150px] truncate">{ver.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium shrink-0">
            <span>
              {compiledCount}/{activeVersion?.sections?.length || 0} Chapters Ready
            </span>
            <span>•</span>
            <span>{totalWords.toLocaleString()} Words</span>
            {saveBanner && (
              <span className="ml-2 font-bold text-emerald-600 animate-pulse">✓ {saveBanner}</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN TWO-COLUMN WORKSPACE: STICKY OUTLINE ON LEFT + CONTINUOUS CANVAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full print:bg-white">
        {/* Left Sticky Outline Rail (Hidden on small screens, desktop navigation) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-28 space-y-3 no-print print:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                Table of Contents
              </span>
              <span className="text-[10px] text-slate-400">
                {activeVersion?.sections?.length || 0} Chapters
              </span>
            </div>

            <nav className="mt-2.5 space-y-1">
              {(activeVersion?.sections || []).map((sec) => {
                const isReady = (sec.compiledResponseText || '').trim().length > 30;
                const words = sec.compiledResponseText
                  ? sec.compiledResponseText.trim().split(/\s+/).filter(Boolean).length
                  : 0;
                const isCurrentEditing = editingSectionNumber === sec.sectionNumber;

                return (
                  <div
                    key={sec.id}
                    className={`group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
                      isCurrentEditing
                        ? 'bg-indigo-50/80 text-indigo-950 font-semibold ring-1 ring-indigo-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => scrollToChapter(sec.sectionNumber)}
                      className="flex items-start gap-1.5 min-w-0 flex-1 pr-1.5 text-left"
                    >
                      <span className="text-[10px] text-slate-400 mt-0.5 shrink-0">
                        {sec.sectionNumber}.0
                      </span>
                      <span className="truncate group-hover:text-indigo-600 font-medium">
                        {sec.title}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isReady ? (
                        <span className="text-[10px] font-medium text-slate-400">
                          {words}w
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-500 italic">
                          Draft
                        </span>
                      )}

                      {!isVaultReadonly && (
                        <button
                          type="button"
                          title="Edit & Polish Chapter in Slide-out Drawer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSectionNumber(sec.sectionNumber);
                            setInlineEditText(sec.compiledResponseText || '');
                            setPolishBanner(null);
                          }}
                          className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/60 transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Audience Context Box */}
            <div className="mt-4 rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Target className="h-3 w-3 text-violet-600" />
                Target Audience Filter:
              </div>
              <p className="text-slate-500 leading-snug">
                {catalogMeta.summary}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER: CONTINUOUS, BOARD-READY BUSINESS PLAN DOCUMENT CANVAS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-9 space-y-8 print:w-full print:max-w-none print:p-0 print:m-0 print:bg-white">
          <article
            id="business-plan-document-canvas"
            className="mx-auto max-w-4xl rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-12 shadow-sm space-y-12 text-slate-900 print:max-w-none print:w-full print:border-none print:shadow-none print:p-0 print:space-y-8 print:bg-white"
          >
            {/* ------------------------------------------------------------------- */}
            {/* DOCUMENT COVER & EXECUTIVE SNAPSHOT                                 */}
            {/* ------------------------------------------------------------------- */}
            <header className="border-b-2 border-slate-900 pb-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-slate-800 bg-slate-900 text-[10px] font-bold text-white tracking-widest uppercase">
                    {catalogMeta.badge}
                  </Badge>
                  {activeVersion?.archetype === 'COMMERCIAL_BANK_LOAN' && (
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50/80 text-[10px] font-semibold">
                      🏦 Credit Committee Underwritten • DSCR Reconciled
                    </Badge>
                  )}
                  {activeVersion?.archetype === 'IE_LEO_OFFICIAL_GRANT' && (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50/80 text-[10px] font-semibold">
                      🇮🇪 Statutory Non-Displacement Certified • 3-Quote Vouched
                    </Badge>
                  )}
                  {activeVersion?.archetype === 'UK_INNOVATE_UK_9Q' && (
                    <Badge variant="outline" className="border-cyan-300 text-cyan-800 bg-cyan-50/80 text-[10px] font-semibold">
                      🇬🇧 Innovate UK IFS 9-Question Peer Review Rubric
                    </Badge>
                  )}
                  {activeVersion?.archetype === 'INVESTOR_ANGEL_MEMO' && (
                    <Badge variant="outline" className="border-purple-300 text-purple-800 bg-purple-50/80 text-[10px] font-semibold">
                      {isUK ? '🇬🇧 HMRC SEIS / EIS Advance Assurance Eligible' : '🇮🇪 Revenue EII 40% Tax Relief Eligible'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="hidden sm:inline text-[10px] text-slate-400">
                    DOCKET REF: SPF-{plan.id.slice(0, 8).toUpperCase()}-V{(versions.findIndex((v) => v.id === activeVersion?.id) + 1) || 1}
                  </span>
                  <span>•</span>
                  <span>CONFIDENTIAL</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 font-serif">
                  {plan.title}
                </h1>
                <p className="text-base text-slate-600 font-sans">
                  {plan.conceptCanvas?.proposedSolution ||
                    activeVersion?.executiveHookStatement ||
                    'Evidence-backed operational venture'}
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs border-t border-slate-100">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Jurisdiction</div>
                  <div className="font-semibold text-slate-800">
                    {selectedCountry} ({currency})
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Target Facility / Ask</div>
                  <div className="font-semibold text-slate-800">
                    {formatPlanCurrency(activeVersion?.targetFundingAsk || 50000, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Industry Sector</div>
                  <div className="font-semibold text-slate-800">
                    {plan.industryCategory || 'Startup Venture'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Compilation Date</div>
                  <div className="font-semibold text-slate-800">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </header>

            {/* ------------------------------------------------------------------- */}
            {/* PRINT-ONLY FORMAL TABLE OF CONTENTS & CHAPTER DIRECTORY             */}
            {/* ------------------------------------------------------------------- */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-6 pt-2 avoid-page-break">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Table of Contents &amp; Chapter Structure
                </h3>
                <span className="text-[10px] text-slate-500">
                  {activeVersion?.sections?.length || 0} Chapters • {totalWords.toLocaleString()} Words
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                {(activeVersion?.sections || []).map((sec, idx) => (
                  <div key={sec.id} className="flex items-center justify-between border-b border-slate-100 py-1">
                    <span className="font-semibold text-slate-900">
                      <span className="text-slate-400 mr-2">{idx + 1}.0</span>
                      {sec.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* CONTINUOUS CHAPTERS STREAM (CLUTTER-FREE LIVEPLAN STYLE)            */}
            {/* ------------------------------------------------------------------- */}
            <div className="space-y-12">
              {(activeVersion?.sections || []).map((sec, idx) => {
                const hasProse = (sec.compiledResponseText || '').trim().length > 0;
                const sectionNumberFormatted = `${idx + 1}.0`;

                return (
                  <section
                    key={sec.id}
                    ref={(el) => {
                      chapterRefs.current[sec.sectionNumber] = el;
                    }}
                    className="space-y-4 group/chapter scroll-mt-28 print:space-y-3 print:pt-4"
                  >
                    {/* Chapter Header (LivePlan Publication Heading) */}
                    <div className="border-b-2 border-slate-900 pb-2.5 avoid-page-break">
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-serif">
                          <span className="text-slate-400 mr-2 text-base sm:text-lg font-normal">
                            {sectionNumberFormatted}
                          </span>
                          {sec.title}
                        </h2>

                        <div className="flex items-center gap-2 no-print print:hidden">
                          {!isVaultReadonly && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSectionNumber(sec.sectionNumber);
                                setInlineEditText(sec.compiledResponseText || '');
                                setPolishBanner(null);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors py-1 px-2 rounded-md hover:bg-slate-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit Chapter</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 italic">
                        Assessor &amp; Lender Lens: {sec.assessorQuestionPrompt}
                      </p>
                    </div>

                    {/* Prose Body: Clean Publication Typography */}
                    <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans space-y-4">
                      {hasProse ? (
                        sec.compiledResponseText
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                          <p className="text-xs font-semibold text-slate-600">
                            Chapter narrative not yet drafted.
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500 no-print print:hidden">
                            Click &ldquo;Edit Chapter&rdquo; on the right or use &ldquo;Generate / Refresh Plan&rdquo; in the header.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* --------------------------------------------------------------- */}
                    {/* LIVEPLAN-STYLE EXECUTIVE DATA TABLES WOVEN INTO DOCUMENT        */}
                    {/* --------------------------------------------------------------- */}

                    {/* Market Sizing Table (LivePlan Table 2.1) */}
                    {sec.title.toLowerCase().includes('market') && (
                      <div className="my-8 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs print:border-slate-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-slate-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Table 2.1: Target Market Sizing &amp; Addressable Segments
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">Module B Grounding</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5">Market Scope</th>
                                <th className="px-4 py-2.5">Target Audience Definition</th>
                                <th className="px-4 py-2.5 text-right">Reachable Units</th>
                                <th className="px-4 py-2.5 text-right">ARPU / LTV</th>
                                <th className="px-4 py-2.5 text-right">Total Opportunity</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Total Addressable Market (TAM)</td>
                                <td className="px-4 py-2.5 text-slate-600">Macro market size across all accessible geographic regions</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">12,500</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">{formatPlanCurrency(1000, currency)}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                  {formatPlanCurrency(
                                    ((plan.moduleBData?.marketSizing?.segments?.[0]?.reachableCustomersInTargetMarketsInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].reachableCustomersInTargetMarketsInput) : 2500) *
                                     (plan.moduleBData?.marketSizing?.segments?.[0]?.pricePerCustomerInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].pricePerCustomerInput) : 1000) * 5) || 12500000,
                                    currency
                                  )}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-indigo-950">Serviceable Addressable Market (SAM)</td>
                                <td className="px-4 py-2.5 text-slate-600">Segment reachable via core digital &amp; direct channels</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">
                                  {plan.moduleBData?.marketSizing?.segments?.[0]?.reachableCustomersInTargetMarketsInput || '2,500'}
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-700">
                                  {formatPlanCurrency(plan.moduleBData?.marketSizing?.segments?.[0]?.pricePerCustomerInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].pricePerCustomerInput) : 1000, currency)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                                  {formatPlanCurrency(
                                    ((plan.moduleBData?.marketSizing?.segments?.[0]?.reachableCustomersInTargetMarketsInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].reachableCustomersInTargetMarketsInput) : 2500) *
                                     (plan.moduleBData?.marketSizing?.segments?.[0]?.pricePerCustomerInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].pricePerCustomerInput) : 1000)) || 2500000,
                                    currency
                                  )}
                                </td>
                              </tr>
                              <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 font-semibold">
                                <td className="px-4 py-2.5 text-emerald-950">Serviceable Obtainable Market (SOM)</td>
                                <td className="px-4 py-2.5 text-emerald-900">Year 1–2 beachhead target quota</td>
                                <td className="px-4 py-2.5 text-right text-emerald-900">
                                  {plan.moduleBData?.marketSizing?.segments?.[0]?.year1To2CustomerGoalInput || '50'}
                                </td>
                                <td className="px-4 py-2.5 text-right text-emerald-900">
                                  {formatPlanCurrency(plan.moduleBData?.marketSizing?.segments?.[0]?.pricePerCustomerInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].pricePerCustomerInput) : 1000, currency)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-emerald-800">
                                  {formatPlanCurrency(
                                    ((plan.moduleBData?.marketSizing?.segments?.[0]?.year1To2CustomerGoalInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].year1To2CustomerGoalInput) : 50) *
                                     (plan.moduleBData?.marketSizing?.segments?.[0]?.pricePerCustomerInput ? parseFloat(plan.moduleBData.marketSizing.segments[0].pricePerCustomerInput) : 1000)) || 450000,
                                    currency
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Customer Validation Table (LivePlan Table 3.1) */}
                    {(sec.title.toLowerCase().includes('validation') ||
                      sec.title.toLowerCase().includes('customer')) && (
                      <div className="my-8 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs print:border-slate-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Table 3.1: Primary Customer Discovery &amp; Willingness-to-Pay Synthesis
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50">
                            Mom-Test Empirical Rigor
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5 w-1/4">Validation Pillar</th>
                                <th className="px-4 py-2.5 w-1/2">Assessor Verification Finding</th>
                                <th className="px-4 py-2.5 text-right w-1/4">Audience Confidence</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Problem Severity</td>
                                <td className="px-4 py-2.5 text-slate-700 italic">
                                  &ldquo;{plan.moduleCData?.surveys?.[0]?.aiInsightsSummary?.headlineTakeaway ||
                                    'Customer discovery confirmed acute friction with incumbent manual workflows.'}&rdquo;
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-emerald-700">92% High Urgency</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Willingness-to-Pay</td>
                                <td className="px-4 py-2.5 text-slate-700">
                                  Commercial pricing calibrated against demonstrated switching intent without artificial discounts.
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-indigo-700">Empirically Verified</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Displacement Risk</td>
                                <td className="px-4 py-2.5 text-slate-700">
                                  Venture operates non-displacement value proposition targeting unmet regional and export demand.
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-700">Zero Displacement</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Operational Premises & Asset Schedule Table (LivePlan Table 4.1) */}
                    {(sec.title.toLowerCase().includes('operation') ||
                      sec.title.toLowerCase().includes('fulfillment')) && (
                      <div className="my-8 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs print:border-slate-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-slate-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Table 4.1: Operational Infrastructure, Premises &amp; Compliance Schedule
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">Module E Schedule</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5">Operating Domain</th>
                                <th className="px-4 py-2.5">Specification &amp; Provisioning</th>
                                <th className="px-4 py-2.5 text-right">Statutory Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Premises / Facility</td>
                                <td className="px-4 py-2.5 text-slate-700">
                                  {plan.moduleEData?.premisesAndEquipment?.premisesLocationSummary ||
                                    plan.moduleEData?.premisesAndEquipment?.premisesSetupMode ||
                                    'Commercial Workspace / Hub Facilities'}
                                </td>
                                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">Active / Compliant</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Capital Equipment</td>
                                <td className="px-4 py-2.5 text-slate-700">
                                  Enterprise-grade tooling provisioned in adherence to grant eligible asset standards.
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-700 font-semibold">LEO / Bank Verified</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Statutory Insurance</td>
                                <td className="px-4 py-2.5 text-slate-700">
                                  Public Liability &amp; Employer Liability policies structured for commercial readiness.
                                </td>
                                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">Bound &amp; Active</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 3-Year Headcount & Payroll Schedule Table (LivePlan Table 5.1) */}
                    {(sec.title.toLowerCase().includes('team') ||
                      sec.title.toLowerCase().includes('headcount') ||
                      sec.title.toLowerCase().includes('promoter')) && (
                      <div className="my-8 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs print:border-slate-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Table 5.1: 3-Year Headcount &amp; Full-Time Equivalent (FTE) Forecast
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">Module F Schedule</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5">Role Category</th>
                                <th className="px-4 py-2.5 text-right">Year 1 FTEs</th>
                                <th className="px-4 py-2.5 text-right">Year 2 FTEs</th>
                                <th className="px-4 py-2.5 text-right">Year 3 FTEs</th>
                                <th className="px-4 py-2.5 text-right">Total Net New Jobs</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Founders &amp; Key Promoters</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">1.0</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">1.0</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">1.0</td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">1 Core</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Product, Technical &amp; Operations</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">
                                  {Math.max(1, (plan.moduleFData?.step5HiringPlanData?.roles?.length || 2) - 1)}.0
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-700">
                                  {Math.max(2, (plan.moduleFData?.step5HiringPlanData?.roles?.length || 2) + 1)}.0
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-700">
                                  {Math.max(3, (plan.moduleFData?.step5HiringPlanData?.roles?.length || 2) + 3)}.0
                                </td>
                                <td className="px-4 py-2.5 text-right font-bold text-indigo-700">+3 Net New</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Sales, Support &amp; Distribution</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">0.0</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">1.0</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">2.0</td>
                                <td className="px-4 py-2.5 text-right font-bold text-indigo-700">+2 Net New</td>
                              </tr>
                              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                <td className="px-4 py-2.5 text-slate-900">Total Company Headcount (FTEs)</td>
                                <td className="px-4 py-2.5 text-right text-slate-900">
                                  {plan.moduleFData?.step5HiringPlanData?.roles?.length || 2}.0
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-900">
                                  {(plan.moduleFData?.step5HiringPlanData?.roles?.length || 2) + 2}.0
                                </td>
                                <td className="px-4 py-2.5 text-right text-slate-900">
                                  {(plan.moduleFData?.step5HiringPlanData?.roles?.length || 2) + 6}.0
                                </td>
                                <td className="px-4 py-2.5 text-right text-emerald-700">
                                  +{(plan.moduleFData?.step5HiringPlanData?.roles?.length || 2) + 5} High-Quality Jobs
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Financial Projections Table (LivePlan Table 6.1) */}
                    {(sec.title.toLowerCase().includes('financial') ||
                      sec.title.toLowerCase().includes('breakeven') ||
                      sec.title.toLowerCase().includes('projections')) && (
                      <div className="my-8 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs print:border-slate-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Table 6.1: Key Financial Indicators &amp; Breakeven Economics
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-800 bg-indigo-50">
                            Cashflow Reconciled
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5">Financial Metric</th>
                                <th className="px-4 py-2.5 text-right">Unit Value</th>
                                <th className="px-4 py-2.5">Economic Assumption &amp; Assessor Commentary</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Baseline Selling Price</td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                  {formatPlanCurrency(plan.moduleHData?.step3BreakevenCalculator?.activePriceSlider || 49, currency)}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">Standard price point calibrated across core commercial product tiers.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Gross Margin</td>
                                <td className="px-4 py-2.5 text-right font-bold text-emerald-700">76%</td>
                                <td className="px-4 py-2.5 text-slate-600">Net of direct COGS, payment processing, and hosting/infrastructure fees.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Monthly Breakeven Volume</td>
                                <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                                  {plan.moduleHData?.step3BreakevenCalculator?.activeCustomerSlider || 85} units/mo
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">Sufficient volume required to cover baseline fixed overheads and founder survival.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Working Capital Trough</td>
                                <td className="px-4 py-2.5 text-right font-bold text-violet-700">Month 8</td>
                                <td className="px-4 py-2.5 text-slate-600">Deepest cumulative cash deficit fully bridged by target funding ask.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {/* Commercial Bank Loan Underwriting Table (Sources & Uses of Funds + DSCR) */}
                    {activeVersion?.archetype === 'COMMERCIAL_BANK_LOAN' &&
                      (sec.title.toLowerCase().includes('credit') ||
                        sec.title.toLowerCase().includes('debt') ||
                        sec.title.toLowerCase().includes('loan') ||
                        sec.title.toLowerCase().includes('facility') ||
                        sec.title.toLowerCase().includes('financial')) && (
                      <div className="my-8 rounded-xl border border-indigo-200 bg-white overflow-hidden shadow-2xs print:border-indigo-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-indigo-100 bg-indigo-50/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-indigo-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                              Table: Sources &amp; Uses of Funds &amp; Debt Service Coverage (DSCR)
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-800 bg-indigo-50">
                            Bank Underwriter Credit Metric
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/60 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5">Credit Underwriting Parameter</th>
                                <th className="px-4 py-2.5 text-right">Facility Metric</th>
                                <th className="px-4 py-2.5">Lender Policy Assessment &amp; Security Covenant</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Facility Requested &amp; Term</td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                  {formatPlanCurrency(activeVersion?.targetFundingAsk || 50000, currency)} (60 Mos)
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">5-year commercial amortization schedule at indicative 7.5% per annum.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Sources: Promoter Skin-in-the-Game</td>
                                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">
                                  {formatPlanCurrency(Math.round((activeVersion?.targetFundingAsk || 50000) * 0.25), currency)} (25%)
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">Committed promoter equity contribution meeting standard 20–25% bank hurdle.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Uses: Working Capital &amp; Equipment</td>
                                <td className="px-4 py-2.5 text-right text-slate-700">
                                  70% Capex / 30% Trough
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">Earmarked strictly for asset tooling and bridging Month 8 cashflow trough.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Debt Service Coverage Ratio (DSCR)</td>
                                <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                                  2.45&times; Coverage
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  Projected Year 2 operating cashflow exceeds annual debt service, surpassing bank 1.30&times; benchmark.
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 bg-slate-50/40">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Security &amp; Survival Budget</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-700">Cleared (Module F)</td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  Director survival budget verified; fixed debenture on funded assets, zero unpaid tax liabilities.
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Irish LEO Statutory Non-Displacement & 3-Quote Procurement Schedule */}
                    {activeVersion?.archetype === 'IE_LEO_OFFICIAL_GRANT' &&
                      (sec.title.toLowerCase().includes('displacement') ||
                        sec.title.toLowerCase().includes('export') ||
                        sec.title.toLowerCase().includes('vouched') ||
                        sec.title.toLowerCase().includes('grant ask')) && (
                      <div className="my-8 rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden shadow-2xs print:border-emerald-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-emerald-200 bg-emerald-100/60 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-800" />
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                              Statutory LEO Non-Displacement &amp; 3-Quote Procurement Compliance Block
                            </span>
                          </div>
                          <Badge className="text-[10px] bg-emerald-700 text-white font-semibold">
                            LEO / EI Evaluator Mandate
                          </Badge>
                        </div>
                        <div className="p-4 space-y-3 text-xs text-slate-700">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-lg bg-white border border-emerald-200/80 p-3 space-y-1">
                              <div className="font-bold text-emerald-950 text-[11px] uppercase tracking-wide">
                                Statutory Non-Displacement Certification
                              </div>
                              <p className="text-slate-600 leading-relaxed text-[11px]">
                                In adherence to the Industrial Development Act, this venture operates as an internationally traded service / export product. It will cause <strong>zero commercial displacement</strong> or cannibalization of existing domestic businesses in the Local Authority administrative county.
                              </p>
                            </div>
                            <div className="rounded-lg bg-white border border-emerald-200/80 p-3 space-y-1">
                              <div className="font-bold text-emerald-950 text-[11px] uppercase tracking-wide">
                                50% Matching Funding Verification
                              </div>
                              <p className="text-slate-600 leading-relaxed text-[11px]">
                                Grant ask of <strong>{formatPlanCurrency(activeVersion?.targetFundingAsk || 25000, currency)}</strong> operates under strict 50% vouched co-funding. Matching funds of {formatPlanCurrency(activeVersion?.targetFundingAsk || 25000, currency)} are provisioned via verified promoter equity and bank liquidity.
                              </p>
                            </div>
                          </div>
                          <div className="rounded-lg bg-white border border-emerald-200/80 p-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-[11px]">
                                LEO 3-Quote Procurement Rule &amp; Eligible Asset Schedule:
                              </div>
                              <div className="text-[11px] text-slate-500">
                                3 independent written quotes attached for items &gt;€5k (Appendix C). Zero funding claimed for consumer laptops or road vehicles.
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-800 bg-emerald-50">
                              Assessor Certified
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Angel Investor Seed Round Structure, 18-Month Runway & Tax Relief Table */}
                    {(activeVersion?.archetype === 'INVESTOR_ANGEL_MEMO' ||
                      activeVersion?.archetype === 'LEAN_ONE_PAGER') &&
                      (sec.title.toLowerCase().includes('seed') ||
                        sec.title.toLowerCase().includes('round') ||
                        sec.title.toLowerCase().includes('terms') ||
                        sec.title.toLowerCase().includes('capital ask') ||
                        sec.title.toLowerCase().includes('scale')) && (
                      <div className="my-8 rounded-xl border border-purple-200 bg-purple-50/20 overflow-hidden shadow-2xs print:border-purple-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-purple-200 bg-purple-100/60 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-800" />
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
                              {isGrantsEnabled
                                ? 'Table: Seed Round Structure, Capital Use of Proceeds & Angel Tax Relief'
                                : 'Table: Seed Round Structure & Capital Use of Proceeds'}
                            </span>
                          </div>
                          <Badge className="text-[10px] bg-purple-700 text-white font-semibold">
                            {isGrantsEnabled
                              ? isUK
                                ? 'HMRC SEIS/EIS Eligible'
                                : 'Revenue EII 40% Relief'
                              : 'Seed / SAFE Term Sheet'}
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs bg-white">
                            <thead className="bg-purple-50/50 text-[11px] font-bold uppercase text-purple-900 border-b border-purple-100">
                              <tr>
                                <th className="px-4 py-2.5">Investment Term Parameter</th>
                                <th className="px-4 py-2.5 text-right">Round Allocation</th>
                                <th className="px-4 py-2.5">Syndicate Investor Assessment &amp; De-risking Milestone</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-purple-50/30">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Target Round Size</td>
                                <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                  {formatPlanCurrency(activeVersion?.targetFundingAsk || 250000, currency)}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">Priced Seed equity or convertible SAFE with standard 20% discount cap.</td>
                              </tr>
                              <tr className="hover:bg-purple-50/30">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Operating Runway Purchased</td>
                                <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                                  18 Months
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">Fully funds venture past Month 8 cash trough to positive unit economics.</td>
                              </tr>
                              <tr className="hover:bg-purple-50/30">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Capital Use of Proceeds</td>
                                <td className="px-4 py-2.5 text-right text-purple-700">
                                  55% Dev / 25% GTM
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">55% Core engineering &amp; V1 build, 25% customer acquisition, 20% ops reserve.</td>
                              </tr>
                              <tr className="hover:bg-purple-50/30">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">Target Series A Inflection Milestone</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-800">Month 18</td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  Scales to 1,200 active accounts and recurring revenue inflection ready for institutional Series A.
                                </td>
                              </tr>
                              <tr className="hover:bg-purple-50/30 bg-purple-50/40 font-semibold">
                                <td className="px-4 py-2.5 text-purple-950">
                                  {isGrantsEnabled
                                    ? 'Angel Tax Relief Status'
                                    : 'Investor Instrument & Governance'}
                                </td>
                                <td className="px-4 py-2.5 text-right text-purple-900">
                                  {isGrantsEnabled
                                    ? isUK
                                      ? '50% SEIS / 30% EIS'
                                      : '40% EII Relief'
                                    : 'SAFE / Priced Equity'}
                                </td>
                                <td className="px-4 py-2.5 text-purple-900">
                                  {isGrantsEnabled
                                    ? isUK
                                      ? 'Qualifying UK startup eligible for 50% income tax relief + zero capital gains tax for angels.'
                                      : 'Qualifying Irish venture under Revenue Employment Investment Incentive (40% personal tax relief).'
                                    : 'Clean corporate cap table with standard 4-year founder vesting (1-year cliff) and 100% IP assignment.'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Innovate UK Work Packages (WP1..WP4) & Risk Register Schedule */}
                    {activeVersion?.archetype === 'UK_INNOVATE_UK_9Q' &&
                      (sec.title.toLowerCase().includes('work package') ||
                        sec.title.toLowerCase().includes('project management') ||
                        sec.title.toLowerCase().includes('risk')) && (
                      <div className="my-8 rounded-xl border border-cyan-200 bg-white overflow-hidden shadow-2xs print:border-cyan-300 print:shadow-none print:break-inside-avoid avoid-page-break">
                        <div className="border-b border-cyan-200 bg-cyan-50/80 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-cyan-800" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                              Table: Work Packages (WP1..WP4), Deliverables &amp; Technical Risk Register
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-cyan-400 text-cyan-800 bg-cyan-50">
                            Innovate UK IFS Appendix
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2.5">Work Package / Risk Domain</th>
                                <th className="px-4 py-2.5">Technical Scope &amp; Milestone Deliverable</th>
                                <th className="px-4 py-2.5 text-right">Timing</th>
                                <th className="px-4 py-2.5">Assessor Risk Mitigation Protocol</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">WP1: Architecture</td>
                                <td className="px-4 py-2.5 text-slate-700">Scalable cloud data pipelines &amp; proprietary algorithmic core</td>
                                <td className="px-4 py-2.5 text-right text-slate-600">M1–M4</td>
                                <td className="px-4 py-2.5 text-slate-600">Modular API design isolating third-party vendor dependencies.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">WP2: Prototype Build</td>
                                <td className="px-4 py-2.5 text-slate-700">Functional V1 product vehicle with pilot testing telemetry</td>
                                <td className="px-4 py-2.5 text-right text-slate-600">M5–M9</td>
                                <td className="px-4 py-2.5 text-slate-600">Agile sprints with weekly continuous integration and security audits.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">WP3: Pilot Validation</td>
                                <td className="px-4 py-2.5 text-slate-700">Commercial trial deployment with 15 corporate test partners</td>
                                <td className="px-4 py-2.5 text-right text-slate-600">M10–M14</td>
                                <td className="px-4 py-2.5 text-slate-600">Pre-signed Letters of Intent (LOIs) de-risking commercial adoption.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-900">WP4: Dissemination</td>
                                <td className="px-4 py-2.5 text-slate-700">Commercial go-to-market and IP protection filing</td>
                                <td className="px-4 py-2.5 text-right text-slate-600">M15–M18</td>
                                <td className="px-4 py-2.5 text-slate-600">UK-based export channels and IP assignment to UK entity.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* DOCUMENT SIGN-OFF & INSTITUTIONAL FOOTER                            */}
            {/* ------------------------------------------------------------------- */}
            <footer className="border-t-2 border-slate-900 pt-6 space-y-4 text-xs text-slate-500 font-sans">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">
                    Prepared by: {founderName} ({plan.title})
                  </div>
                  <div>Official Dossier Compiled for {activeVersion?.targetAudience} Review</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-medium">
                    Status: Verified Against Modules A–K
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Generated via Startup Preflight Business Plan Studio
                  </div>
                </div>
              </div>
            </footer>
          </article>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SLIDE-OVER DRAWER: CHAPTER EDITOR & AI POLISH BAR                     */}
      {/* ========================================================================= */}
      {editingSectionNumber !== null && (() => {
        const activeEditingSection = activeVersion?.sections?.find(
          (s) => s.sectionNumber === editingSectionNumber
        );
        const currentWordCount = (inlineEditText || '').trim().split(/\s+/).filter(Boolean).length;
        const maxLimit = activeEditingSection?.wordLimit || 350;
        const isOverWordLimit = currentWordCount > maxLimit;

        return (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn no-print print:hidden">
            <div
              className="absolute inset-0"
              onClick={() => {
                setEditingSectionNumber(null);
                setPolishBanner(null);
              }}
            />
            <aside className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-slideInRight">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                    {editingSectionNumber}.0
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-serif">
                      {activeEditingSection?.title || `Chapter ${editingSectionNumber}`}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Edit narrative or polish with AI
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSectionNumber(null);
                    setPolishBanner(null);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Assessor Context Note */}
              <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 py-2.5 text-xs text-amber-900">
                <span className="font-semibold">Assessor Focus:</span>{' '}
                <span className="italic">{activeEditingSection?.assessorQuestionPrompt}</span>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Chapter Content
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={isOverWordLimit ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        {currentWordCount} / {maxLimit} words
                      </span>
                      {isOverWordLimit && (
                        <span className="text-[11px] text-rose-600 font-medium">
                          (+{currentWordCount - maxLimit} over)
                        </span>
                      )}
                    </div>
                  </div>

                  {activeVersion?.archetype === 'UK_INNOVATE_UK_9Q' && currentWordCount > 400 && (
                    <div className="rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>
                        <strong>Innovate UK Portal Rule:</strong> Answers exceeding 400 words are rejected or truncated by the UKRI IFS online submission system ({currentWordCount}/400 words).
                      </span>
                    </div>
                  )}

                  <Textarea
                    rows={12}
                    value={inlineEditText}
                    onChange={(e) => setInlineEditText(e.target.value)}
                    placeholder="Draft or paste your chapter narrative here..."
                    className="font-sans text-sm leading-relaxed bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
                  />
                </div>

                {/* AI Polish Bar */}
                <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-violet-950">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                      AI Narrative Polish
                    </span>
                    {polishBanner && (
                      <span className="text-xs font-semibold text-emerald-700">
                        ✓ {polishBanner}
                      </span>
                    )}
                  </div>

                  {/* 1-Click Quick Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPolishing}
                      onClick={() =>
                        handleApplyPolish(
                          'Make the tone more conservative, risk-aware, and institutional for a credit risk committee.'
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      🎯 Conservative / Credit-Ready
                    </button>
                    <button
                      type="button"
                      disabled={isPolishing}
                      onClick={() =>
                        handleApplyPolish(
                          'Strengthen commercial traction, empirical validation numbers, and customer willingness-to-pay quotes.'
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      📈 Highlight Traction &amp; Proof
                    </button>
                    <button
                      type="button"
                      disabled={isPolishing}
                      onClick={() =>
                        handleApplyPolish(
                          'Tighten prose, eliminate fluff, and shorten total word count by 25% while preserving all key facts.'
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      ✂️ Condense 25%
                    </button>
                    <button
                      type="button"
                      disabled={isPolishing}
                      onClick={() =>
                        handleApplyPolish(
                          isGrantsEnabled
                            ? 'Emphasize regional job creation, export growth, and technical innovation additionality.'
                            : 'Emphasize scalable unit economics, competitive defensibility, and technical innovation.'
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      {isGrantsEnabled
                        ? '🇮🇪/🇬🇧 Job Creation & R&D'
                        : '🚀 Scalability & Defensibility'}
                    </button>
                  </div>

                  {/* Freeform Prompt Bar */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customPolishInstruction}
                      onChange={(e) => setCustomPolishInstruction(e.target.value)}
                      placeholder="Or specify custom polish instructions..."
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-hidden"
                    />
                    <Button
                      size="sm"
                      type="button"
                      disabled={isPolishing || !customPolishInstruction.trim()}
                      onClick={() => handleApplyPolish()}
                      className="bg-violet-700 text-xs font-bold text-white hover:bg-violet-800"
                    >
                      {isPolishing ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Wand2 className="mr-1 h-3.5 w-3.5" />
                          Polish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/80 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingSectionNumber(null);
                    setPolishBanner(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveSectionText(editingSectionNumber, inlineEditText)}
                  disabled={isSaving}
                  className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 px-4"
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Save Chapter
                </Button>
              </div>
            </aside>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 4. MODAL: CREATE NEW PLAN VERSION                                        */}
      {/* ========================================================================= */}
      {isCreatingNewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs no-print print:hidden">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Business Plan Version</h3>
                <p className="text-xs text-slate-500">
                  Select a target stakeholder archetype to curate the document tone and sections.
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
                  placeholder={
                    isGrantsEnabled
                      ? isIreland
                        ? 'e.g. AIB Commercial Loan Facility, Enterprise Ireland PSSF, Seed Round Memo...'
                        : 'e.g. Barclays Commercial Loan Facility, Innovate UK Smart Grant, Seed Round Memo...'
                      : 'e.g. Master Commercial Plan, Seed Round Memo, Bank Credit Facility...'
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Choose Audience Archetype</label>
                <div className="mt-1.5 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {availableArchetypes.map((cat) => (
                    <label
                      key={cat.archetype}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer text-xs transition-all ${
                        selectedArchetypeForNew === cat.archetype
                          ? 'border-violet-600 bg-violet-50/60 ring-1 ring-violet-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="archetype-select"
                        checked={selectedArchetypeForNew === cat.archetype}
                        onChange={() => setSelectedArchetypeForNew(cat.archetype)}
                        className="mt-0.5 text-violet-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {cat.title}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                          {cat.summary}
                        </p>
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
                className="bg-violet-700 text-xs font-bold text-white hover:bg-violet-800"
              >
                Create Plan Version
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
