'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Copy,
  Check,
  BookmarkPlus,
  Scale,
  Award,
  Layers,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ActiveStartupPlan,
  ModuleLStep3NarrativeCompilerSavedData,
  ModuleLCompiledSectionItem,
  ModuleLCompilerModeType,
} from '@/lib/auth/session-store';
import { generateModuleLStep3SectionAction } from '@/app/actions/module-l';

interface ModuleLNarrativeCompilerStepProps {
  plan: ActiveStartupPlan;
  isVaultReadonly?: boolean;
  onSaveStep3Compiler: (
    data: ModuleLStep3NarrativeCompilerSavedData,
    progress?: number
  ) => Promise<void> | void;
  onBackToStep2: () => void;
  onContinueToStep4: () => void;
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

export function ModuleLNarrativeCompilerStep({
  plan,
  isVaultReadonly = false,
  onSaveStep3Compiler,
  onBackToStep2,
  onContinueToStep4,
  onNavigateToModule,
  onParkQuestionInSession,
}: ModuleLNarrativeCompilerStepProps) {
  const isUK = plan.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';

  const compilerMode: ModuleLCompilerModeType =
    plan.moduleLData?.step1Mode?.compilerMode ||
    (plan.hqCountryCode === 'IE'
      ? 'IE_LEO_OFFICIAL_FORM'
      : plan.hqCountryCode === 'GB'
        ? 'UK_INNOVATE_UK_9Q'
        : 'STANDARD_COMMERCIAL_PLAN');

  const savedCompiler = plan.moduleLData?.step3Compiler;

  // 4-Layer Support Strip States
  const [activeWhyCard, setActiveWhyCard] = useState<boolean>(false);
  const [activeExampleCard, setActiveExampleCard] = useState<boolean>(false);
  const [isCompilingAll, setIsCompilingAll] = useState<boolean>(false);
  const [compilingSectionId, setCompilingSectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>(['sec-1', 'sec-2']);

  // Built-in templates based on active compiler mode
  const defaultSectionsForMode = useMemo<ModuleLCompiledSectionItem[]>(() => {
    if (compilerMode === 'IE_LEO_OFFICIAL_FORM') {
      return [
        {
          id: 'sec-1',
          sectionNumber: 1,
          title: 'Promoter Background & Track Record',
          assessorQuestionPrompt:
            'Describe the relevant background, technical and commercial skills of the promoter(s) to execute this enterprise. Detail past management track record and domain expertise.',
          scoringWeightPercent: 25,
          wordLimit: 400,
          sourceModules: ['MOD_A_IDEATION', 'MOD_F_COFOUNDER_TEAM'],
          compiledResponseText: `${plan.title} is led by promoters with relevant domain background in the ${plan.industryCategory || 'commercial'} sector. Supported by the 7 Startup Hats division of responsibility and explicit skills matrix, the team brings direct domain competence across product engineering, sales execution, and statutory governance.`,
        },
        {
          id: 'sec-2',
          sectionNumber: 2,
          title: 'Product / Service Innovation & Technical Merit',
          assessorQuestionPrompt:
            'Detail the innovation, technical merit, and proprietary nature of the product/service. Explain why this solution is superior to incumbent alternatives.',
          scoringWeightPercent: 20,
          wordLimit: 450,
          sourceModules: ['MOD_D_PRODUCT_BUILD'],
          compiledResponseText: `The enterprise delivers an innovative solution built upon modern technical architecture. Unlike existing market alternatives that rely on fragmented manual workflows, ${plan.title} introduces structured automation and proprietary workflows that deliver measurable cost and time efficiencies.`,
        },
        {
          id: 'sec-3',
          sectionNumber: 3,
          title: 'Market Sizing, Export Potential & Non-Displacement Defense',
          assessorQuestionPrompt:
            'Quantify the target addressable market (TAM/SAM/SOM). Detail international export potential or import substitution, and substantiate zero displacement of domestic competitors.',
          scoringWeightPercent: 30,
          wordLimit: 450,
          sourceModules: ['MOD_A_IDEATION', 'MOD_B_MARKET'],
          compiledResponseText: `Targeting an international beachhead segment, the enterprise addresses a validated market opportunity. Because sales are driven through borderless digital channels and international export expansion, the project satisfies Enterprise Ireland / LEO criteria with confirmed commercial additionality and zero domestic displacement.`,
        },
        {
          id: 'sec-4',
          sectionNumber: 4,
          title: 'Primary Customer Validation & Mom-Test Evidence',
          assessorQuestionPrompt:
            'Provide verifiable evidence of customer willingness to pay. Summarize customer discovery interviews, survey responses, waitlist pull, and pilot commitments.',
          scoringWeightPercent: 25,
          wordLimit: 400,
          sourceModules: ['MOD_C_SURVEYS_FEEDBACK', 'MOD_H_REVENUE'],
          compiledResponseText: `Empirical customer validation was conducted across target buyers utilizing Mom-Test bias-free methodologies. Customer surveys and discovery logs substantiate strong demand, with willingness-to-pay tiers aligning directly with our commercial pricing structure.`,
        },
        {
          id: 'sec-5',
          sectionNumber: 5,
          title: 'Operations, 3-Quote Procurement & Risk Controls',
          assessorQuestionPrompt:
            'Outline day-to-day operational mechanics, facilities, equipment schedule, and risk mitigation register. Confirm compliance with statutory procurement and 3-quote rules.',
          scoringWeightPercent: 20,
          wordLimit: 400,
          sourceModules: ['MOD_E_OPERATIONS', 'MOD_G_LAUNCHPAD'],
          compiledResponseText: `Operations follow standard operating protocols with dedicated risk register controls across technical, commercial, statutory, and cashflow categories. Capital expenditures conform strictly to LEO procurement guidelines, backed by 3 independent competitive quotes for major items.`,
        },
        {
          id: 'sec-6',
          sectionNumber: 6,
          title: '3-Year Job Creation Schedule & Salary Plan',
          assessorQuestionPrompt:
            'Schedule net new sustainable full-time jobs created across Years 1, 2, and 3. Provide average salary benchmarks and statutory employer tax allowances.',
          scoringWeightPercent: 25,
          wordLimit: 350,
          sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_J_FINANCE'],
          compiledResponseText: `The venture projects net new full-time employment creation across Years 1 to 3, supporting regional and national high-value employment. Salaries are benchmarked against industry standards with full statutory Employer PRSI (11.05%) budgeted.`,
        },
        {
          id: 'sec-7',
          sectionNumber: 7,
          title: '36-Month Financial Projections & Vouched Grant Ask',
          assessorQuestionPrompt:
            'Summarize Year 1–3 Profit & Loss, monthly cashflow trough, and exact utilization of requested grant funding. Detail matching funding source.',
          scoringWeightPercent: 30,
          wordLimit: 400,
          sourceModules: ['MOD_H_REVENUE', 'MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
          compiledResponseText: `Financial forecasts demonstrate a clear path to profitability with working capital provisions designed to withstand public grant claims lag. The requested funding directly accelerates export-ready product delivery and job creation, matched 50% by confirmed founder equity.`,
        },
      ];
    }

    if (compilerMode === 'UK_INNOVATE_UK_9Q') {
      return [
        {
          id: 'sec-q1',
          sectionNumber: 1,
          title: 'Q1: Need or Challenge',
          assessorQuestionPrompt:
            'What is the business need, technological challenge or market failure directed by your project? Explain why existing commercial solutions fail.',
          scoringWeightPercent: 11,
          wordLimit: 400,
          sourceModules: ['MOD_A_IDEATION', 'MOD_C_SURVEYS_FEEDBACK'],
          compiledResponseText: `The project resolves a critical market challenge in the ${plan.industryCategory || 'technology'} domain where incumbent solutions create friction, excessive operational overhead, and unaddressed latency for customers.`,
        },
        {
          id: 'sec-q2',
          sectionNumber: 2,
          title: 'Q2: Approach & Innovation',
          assessorQuestionPrompt:
            'What approach will you take and where will the focus of the innovation be? Detail the technical step-change and freedom to operate (FTO).',
          scoringWeightPercent: 12,
          wordLimit: 400,
          sourceModules: ['MOD_B_MARKET', 'MOD_D_PRODUCT_BUILD'],
          compiledResponseText: `Our approach introduces a technical step-change over state-of-the-art incumbents, structuring core operational steps into an integrated, repeatable architecture with clear intellectual property defensibility.`,
        },
        {
          id: 'sec-q3',
          sectionNumber: 3,
          title: 'Q3: Team & Resources',
          assessorQuestionPrompt:
            'Who is in the project team and what are their roles? Detail track record, capacity, subcontractor partnerships, and external advisory boards.',
          scoringWeightPercent: 11,
          wordLimit: 400,
          sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_G_LAUNCHPAD'],
          compiledResponseText: `The team brings verified execution capability spanning technical development, commercial distribution, and governance. Core competencies are distributed across the 7 Startup Hats with advisory support in place.`,
        },
        {
          id: 'sec-q4',
          sectionNumber: 4,
          title: 'Q4: Market Awareness & Route to Market',
          assessorQuestionPrompt:
            'Describe the addressable market size (TAM/SAM/SOM), target beachhead customer segment, competitor dynamics, and your route to market.',
          scoringWeightPercent: 11,
          wordLimit: 400,
          sourceModules: ['MOD_B_MARKET', 'MOD_I_MARKETING'],
          compiledResponseText: `Market sizing confirms substantial TAM across domestic and export territories. Route-to-market is structured through targeted digital acquisition, channel partnerships, and direct customer outreach.`,
        },
        {
          id: 'sec-q5',
          sectionNumber: 5,
          title: 'Q5: Project Management & Work Packages',
          assessorQuestionPrompt:
            'How will the project be managed? Provide detailed Work Packages (WP1..n), milestones, deliverables, and resource allocation across the project timeline.',
          scoringWeightPercent: 12,
          wordLimit: 400,
          sourceModules: ['MOD_D_PRODUCT_BUILD', 'MOD_E_OPERATIONS'],
          compiledResponseText: `Project execution is organized into defined Work Packages (WP1: Specification & Architecture, WP2: Core Engineering, WP3: Integration & Testing, WP4: Commercial Pilot Deployment) with clear milestone gates.`,
        },
        {
          id: 'sec-q6',
          sectionNumber: 6,
          title: 'Q6: Risks & Mitigation Matrix',
          assessorQuestionPrompt:
            'Identify the key project risks (Technical, Commercial, Management, Regulatory) and describe your proactive mitigation strategy and contingency plans.',
          scoringWeightPercent: 11,
          wordLimit: 400,
          sourceModules: ['MOD_E_OPERATIONS'],
          compiledResponseText: `Risk management is governed by a 4-category register addressing Technical failure, Commercial adoption lag, Operational key-person dependency, and Statutory compliance, each linked to pre-planned mitigation triggers.`,
        },
        {
          id: 'sec-q7',
          sectionNumber: 7,
          title: 'Q7: Added Value of Public Funding',
          assessorQuestionPrompt:
            'How does this Innovate UK funding add value? Prove additionality: why would this project not proceed at the same speed, scope, or scale without grant support?',
          scoringWeightPercent: 11,
          wordLimit: 400,
          sourceModules: ['MOD_K_GRANTS_FUNDING', 'MOD_L_BUSINESS_PLAN'],
          compiledResponseText: `Innovate UK support delivers undeniable additionality. Without public funding, the project would face an extended R&D cycle with reduced commercial scope; grant approval compresses time-to-market by 12 months.`,
        },
        {
          id: 'sec-q8',
          sectionNumber: 8,
          title: 'Q8: Economic, Environmental & Societal Impact',
          assessorQuestionPrompt:
            'What wider economic, societal, and environmental impacts will your project deliver? Detail UK job creation, regional growth, and sustainability outcomes.',
          scoringWeightPercent: 11,
          wordLimit: 400,
          sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_K_GRANTS_FUNDING'],
          compiledResponseText: `Commercial deployment drives high-value UK employment, boosts domestic productivity, and generates taxable corporate and payroll revenues, creating a high return on public capital investment.`,
        },
        {
          id: 'sec-q9',
          sectionNumber: 9,
          title: 'Q9: Costs & Value for Money',
          assessorQuestionPrompt:
            'Explain how project costs represent value for money. Justify labour rates, materials, capital usage depreciation, and subcontractor fees.',
          scoringWeightPercent: 10,
          wordLimit: 400,
          sourceModules: ['MOD_E_OPERATIONS', 'MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
          compiledResponseText: `Project costs reflect prudent, market-benchmarked allocations. Subcontractor and staff days are directly tied to Work Package deliverables with verified capital depreciation applied.`,
        },
      ];
    }

    if (compilerMode === 'UK_START_UP_LOANS_WORKBOOK') {
      return [
        {
          id: 'sec-sul-1',
          sectionNumber: 1,
          title: 'Part 1: Business Overview & Statutory Setup',
          assessorQuestionPrompt:
            'Describe what the business does, customer proposition, corporate LTD registration, banking, and promoter qualifications to trade successfully.',
          scoringWeightPercent: 25,
          wordLimit: 500,
          sourceModules: ['MOD_A_IDEATION', 'MOD_F_COFOUNDER_TEAM', 'MOD_G_LAUNCHPAD'],
          compiledResponseText: `${plan.title} is an active commercial enterprise established with official Companies House registration and dedicated business banking. The founding team brings direct sector experience ensuring robust commercial execution.`,
        },
        {
          id: 'sec-sul-2',
          sectionNumber: 2,
          title: 'Part 2: Customer Validation, Pricing & First 10 Customers',
          assessorQuestionPrompt:
            'How have you validated customer demand? Detail pricing tiers, unit economics, and your structured playbook to acquire your first 10 paying customers.',
          scoringWeightPercent: 25,
          wordLimit: 500,
          sourceModules: ['MOD_C_SURVEYS_FEEDBACK', 'MOD_H_REVENUE', 'MOD_I_MARKETING'],
          compiledResponseText: `Customer demand has been validated through structured discovery. Commercial pricing ensures healthy gross margins, while our First 10 Customers Playbook targets qualified prospects through direct outreach and warm network conversions.`,
        },
        {
          id: 'sec-sul-3',
          sectionNumber: 3,
          title: 'Part 3: Personal Survival Budget & Household Drawings',
          assessorQuestionPrompt:
            'Demonstrate that your personal survival budget is sustainable. Prove that loan repayments can be serviced without placing distress on household finances.',
          scoringWeightPercent: 25,
          wordLimit: 450,
          sourceModules: ['MOD_F_COFOUNDER_TEAM'],
          compiledResponseText: `A comprehensive Personal Survival Budget confirms minimal essential drawings during early trading. Household overheads are fully covered, guaranteeing that debt service of the Start Up Loan is insulated.`,
        },
        {
          id: 'sec-sul-4',
          sectionNumber: 4,
          title: 'Part 4: 36-Month Cashflow Forecast & Loan Serviceability',
          assessorQuestionPrompt:
            'Detail 36-month cashflow projections, working capital trough, and Debt Service Coverage Ratio (DSCR ≥ 1.25x) demonstrating reliable monthly loan repayments.',
          scoringWeightPercent: 25,
          wordLimit: 500,
          sourceModules: ['MOD_J_FINANCE', 'MOD_K_GRANTS_FUNDING'],
          compiledResponseText: `Conservative cashflow projections show robust headroom with Debt Service Coverage Ratio comfortably exceeding underwriter benchmarks (DSCR ≥ 1.35x), providing substantial safety margins against trading variance.`,
        },
      ];
    }

    if (compilerMode === 'INVESTOR_SEIS_EIS_EII_PACK') {
      return [
        {
          id: 'sec-inv-1',
          sectionNumber: 1,
          title: 'Statutory Qualifying Trade & Permanent Establishment',
          assessorQuestionPrompt:
            'Confirm statutory qualifying trade status under HMRC SEIS/EIS / Irish EII guidelines, permanent establishment, and compliance with excluded activity exclusions.',
          scoringWeightPercent: 25,
          wordLimit: 450,
          sourceModules: ['MOD_A_IDEATION', 'MOD_G_LAUNCHPAD', 'MOD_K_GRANTS_FUNDING'],
          compiledResponseText: `${plan.title} operates a qualifying commercial trade with permanent corporate establishment. The venture engages in active, non-excluded commercial activities satisfying all statutory advance assurance requirements.`,
        },
        {
          id: 'sec-inv-2',
          sectionNumber: 2,
          title: 'Statutory Risk-to-Capital Condition Defense',
          assessorQuestionPrompt:
            'Substantiate that the company has objectives to grow and develop its trade in the long term, and that investment carries genuine risk of capital loss.',
          scoringWeightPercent: 25,
          wordLimit: 450,
          sourceModules: ['MOD_K_GRANTS_FUNDING', 'MOD_L_BUSINESS_PLAN'],
          compiledResponseText: `The enterprise satisfies the statutory Risk-to-Capital condition: raised capital is deployed directly into hiring, product development, and market penetration with long-term growth objectives rather than capital preservation.`,
        },
        {
          id: 'sec-inv-3',
          sectionNumber: 3,
          title: 'Commercial Wedge, Unit Economics & 3-Year Use of Funds',
          assessorQuestionPrompt:
            'Detail the proprietary competitive wedge, gross margins, CAC payback, pocket-profit crossover, and structured deployment of investor capital.',
          scoringWeightPercent: 25,
          wordLimit: 500,
          sourceModules: ['MOD_B_MARKET', 'MOD_H_REVENUE', 'MOD_J_FINANCE'],
          compiledResponseText: `Our competitive wedge unlocks rapid adoption with healthy unit economics. Seed capital will be allocated across engineering milestones, key talent recruitment, and customer acquisition to achieve cashflow breakeven.`,
        },
        {
          id: 'sec-inv-4',
          sectionNumber: 4,
          title: 'Team Pedigree, Cap Table Governance & Exit Potential',
          assessorQuestionPrompt:
            'Highlight promoter backgrounds, equity vesting structures, cap table discipline, and potential venture scale liquidity / trade sale opportunities.',
          scoringWeightPercent: 25,
          wordLimit: 450,
          sourceModules: ['MOD_F_COFOUNDER_TEAM', 'MOD_K_GRANTS_FUNDING'],
          compiledResponseText: `The founding cap table features standard 4-year vesting with 1-year cliffs. The team combines deep technical and domain execution capabilities targeting strategic acquisition or international scale.`,
        },
      ];
    }

    // Default / Standard Commercial Business Plan
    return [
      {
        id: 'sec-std-1',
        sectionNumber: 1,
        title: '1. Executive Summary',
        assessorQuestionPrompt:
          'Summarize the company, mission, customer problem, proposed solution, traction, founding team, and capital request in a concise overview.',
        scoringWeightPercent: 20,
        wordLimit: 400,
        sourceModules: ['MOD_A_IDEATION', 'MOD_K_GRANTS_FUNDING'],
        compiledResponseText: `${plan.title} addresses critical customer pain points within the ${plan.industryCategory || 'commercial'} sector through modern technical architecture, supported by empirical customer validation and seasoned leadership.`,
      },
      {
        id: 'sec-std-2',
        sectionNumber: 2,
        title: '2. Problem, Market Opportunity & Beachhead Customer',
        assessorQuestionPrompt:
          'Detail the primary market problem, quantify the addressable market (TAM/SAM/SOM), and define the ideal beachhead customer persona.',
        scoringWeightPercent: 20,
        wordLimit: 450,
        sourceModules: ['MOD_B_MARKET', 'MOD_C_SURVEYS_FEEDBACK'],
        compiledResponseText: `A clearly defined beachhead customer segment experiences significant operational inefficiency with existing options. Customer discovery telemetry confirms strong demand and rapid willingness to switch.`,
      },
      {
        id: 'sec-std-3',
        sectionNumber: 3,
        title: '3. Product Architecture & Competitive Advantage',
        assessorQuestionPrompt:
          'Explain the core product/service vehicle, build approach, proprietary features, and defensible competitive wedge against incumbents.',
        scoringWeightPercent: 20,
        wordLimit: 450,
        sourceModules: ['MOD_D_PRODUCT_BUILD', 'MOD_B_MARKET'],
        compiledResponseText: `The product architecture combines user-centric simplicity with robust back-end capabilities, establishing a sustainable competitive wedge that creates high switching barriers for competing solutions.`,
      },
      {
        id: 'sec-std-4',
        sectionNumber: 4,
        title: '4. Go-to-Market & Sales Strategy',
        assessorQuestionPrompt:
          'Outline pricing structure, sales channels, customer acquisition economics (CAC), and your playbook to acquire early customer cohorts.',
        scoringWeightPercent: 20,
        wordLimit: 400,
        sourceModules: ['MOD_H_REVENUE', 'MOD_I_MARKETING'],
        compiledResponseText: `Our commercial go-to-market strategy leverages digital acquisition, targeted industry partnerships, and high-conversion outbound engagement to achieve rapid customer adoption with scalable CAC payback.`,
      },
      {
        id: 'sec-std-5',
        sectionNumber: 5,
        title: '5. Operations, Management Team & 3-Year Financials',
        assessorQuestionPrompt:
          'Present operational setup, promoter CVs, key hires, 3-year revenue and expense model, breakeven milestone, and capital requirements.',
        scoringWeightPercent: 20,
        wordLimit: 500,
        sourceModules: ['MOD_E_OPERATIONS', 'MOD_F_COFOUNDER_TEAM', 'MOD_J_FINANCE'],
        compiledResponseText: `Operations are structured for lean execution with robust risk registers. Financial projections show a clear path to pocket-profit breakeven supported by balanced working capital buffers.`,
      },
    ];
  }, [compilerMode, plan]);

  const [sections, setSections] = useState<ModuleLCompiledSectionItem[]>(
    savedCompiler?.sections && savedCompiler.sections.length > 0
      ? savedCompiler.sections
      : defaultSectionsForMode
  );

  const [executiveHook, setExecutiveHook] = useState<string>(
    savedCompiler?.executiveHookStatement ||
      plan.moduleLData?.step2Audit?.preFlightDefenseSummary ||
      `"${plan.title}" is an evidence-backed ${plan.industryCategory || 'venture'} engineered to satisfy statutory underwriting requirements in ${plan.hqCountryCode || 'Ireland'}. Cross-module validation confirms empirical customer willingness-to-pay, defensible unit economics, and verified additionality with zero unmitigated displacement.`
  );

  const [aiTip, setAiTip] = useState<string>(
    savedCompiler?.aiAssessorTip ||
      (isUK
        ? 'Assessor tip: Innovate UK and Start Up Loan underwriters cross-reference each written claim against your financial model. Ensure your words and numbers tell the exact same story.'
        : 'Assessor tip: LEO and Enterprise Ireland evaluators place highest weighting on Export Potential, Promoter Track Record, and Additionality. Keep your evidence quantitative and concise.')
  );

  // Toggle section accordion
  const toggleSection = (id: string) => {
    setExpandedSectionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const updateSectionText = (id: string, text: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, compiledResponseText: text, isCustomEdited: true } : s
      )
    );
  };

  // Re-synthesize an individual section with AI
  const handleCompileSectionAi = async (section: ModuleLCompiledSectionItem) => {
    setCompilingSectionId(section.id);
    try {
      const planContextSummary = `Title: ${plan.title}. Industry: ${plan.industryCategory}. HQ: ${plan.hqCountryCode}. One-Liner: ${plan.oneLinerSummary}. Export: ${plan.exportPotential}. Audit Score: ${plan.moduleLData?.step2Audit?.overallAuditScore ?? 88}/100. Defense: ${executiveHook}`;

      const res = await generateModuleLStep3SectionAction({
        planId: plan.id,
        planTitle: plan.title,
        hqCountryCode: plan.hqCountryCode || 'IE',
        baseCurrency: plan.baseCurrency || 'EUR',
        compilerMode,
        industryCategory: plan.industryCategory,
        sectionNumber: section.sectionNumber,
        sectionTitle: section.title,
        assessorPrompt: section.assessorQuestionPrompt,
        scoringWeightPercent: section.scoringWeightPercent,
        wordLimit: section.wordLimit,
        sourceModules: section.sourceModules,
        currentResponseText: section.compiledResponseText,
        planContextSummary,
      });

      if (res.compiledResponseText) {
        updateSectionText(section.id, res.compiledResponseText);
        if (res.aiAssessorTip) setAiTip(res.aiAssessorTip);
      }
    } catch (err) {
      console.error('Error compiling section with AI:', err);
    } finally {
      setCompilingSectionId(null);
    }
  };

  // Global compile all sections with AI
  const handleCompileAllSectionsAi = async () => {
    setIsCompilingAll(true);
    try {
      const planContextSummary = `Title: ${plan.title}. Industry: ${plan.industryCategory}. HQ: ${plan.hqCountryCode}. One-Liner: ${plan.oneLinerSummary}. Export: ${plan.exportPotential}. Defense: ${executiveHook}`;

      const updatedSections: ModuleLCompiledSectionItem[] = [];
      for (const section of sections) {
        const res = await generateModuleLStep3SectionAction({
          planId: plan.id,
          planTitle: plan.title,
          hqCountryCode: plan.hqCountryCode || 'IE',
          baseCurrency: plan.baseCurrency || 'EUR',
          compilerMode,
          industryCategory: plan.industryCategory,
          sectionNumber: section.sectionNumber,
          sectionTitle: section.title,
          assessorPrompt: section.assessorQuestionPrompt,
          scoringWeightPercent: section.scoringWeightPercent,
          wordLimit: section.wordLimit,
          sourceModules: section.sourceModules,
          currentResponseText: section.compiledResponseText,
          planContextSummary,
        });

        updatedSections.push({
          ...section,
          compiledResponseText: res.compiledResponseText || section.compiledResponseText,
          isCustomEdited: true,
        });
      }
      setSections(updatedSections);
    } catch (err) {
      console.error('Error compiling all sections:', err);
    } finally {
      setIsCompilingAll(false);
    }
  };

  const handleCopySection = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionId(id);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const handleSaveCompilerOnly = async () => {
    if (isVaultReadonly) return;
    isDirtyRef.current = false;
    setIsSaving(true);
    const payload: ModuleLStep3NarrativeCompilerSavedData = {
      modeCompiledFor: compilerMode,
      sections,
      executiveHookStatement: executiveHook,
      aiAssessorTip: aiTip,
      aiEngineUsed: 'gemini-2.5-flash',
      lastSavedAt: new Date().toISOString(),
    };

    try {
      if (onSaveStep3Compiler) {
        await onSaveStep3Compiler(payload, 60);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    isDirtyRef.current = false;
    setIsSaving(true);
    const payload: ModuleLStep3NarrativeCompilerSavedData = {
      modeCompiledFor: compilerMode,
      sections,
      executiveHookStatement: executiveHook,
      aiAssessorTip: aiTip,
      aiEngineUsed: 'gemini-2.5-flash',
      lastSavedAt: new Date().toISOString(),
    };

    try {
      if (onSaveStep3Compiler) {
        await onSaveStep3Compiler(payload, 60);
      }
      onContinueToStep4();
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRenderRef = useRef(true);
  const isDirtyRef = useRef(false);
  const handleSaveCompilerOnlyRef = useRef(handleSaveCompilerOnly);
  handleSaveCompilerOnlyRef.current = handleSaveCompilerOnly;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isVaultReadonly) return;
    isDirtyRef.current = true;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        void handleSaveCompilerOnlyRef.current();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sections, executiveHook, aiTip, isVaultReadonly]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        void handleSaveCompilerOnlyRef.current();
      }
    };
  }, []);

  // Aggregate word count
  const totalWords = useMemo(() => {
    return sections.reduce((acc, s) => {
      const words = (s.compiledResponseText || '').trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
  }, [sections]);

  const totalWordLimit = useMemo(() => {
    return sections.reduce((acc, s) => acc + (s.wordLimit || 400), 0);
  }, [sections]);

  return (
    <div className="space-y-6">
      {/* 4-Layer Support Strip (GEMINI.md Rule 1.1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveWhyCard((p) => !p)}
            className="h-7 border-slate-200 bg-white text-[11px] font-medium text-emerald-800 hover:bg-emerald-50"
          >
            <HelpCircle className="mr-1 h-3.5 w-3.5" />
            Why Are We Asking This?
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveExampleCard((p) => !p)}
            className="h-7 border-emerald-200 bg-white text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
          >
            <Lightbulb className="mr-1 h-3.5 w-3.5" />
            Show Me an Example
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCompileAllSectionsAi}
            disabled={isCompilingAll || isVaultReadonly}
            className="h-7 border-slate-200 bg-slate-50/80 text-[11px] font-medium text-emerald-800 hover:bg-slate-100"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-700" />
            {isCompilingAll ? 'Synthesizing All Sections...' : 'AI Re-Synthesize All Sections'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-300 bg-white text-[11px] text-slate-700">
            {sections.length} Questions / Sections
          </Badge>
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold ${
              totalWords > totalWordLimit
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : 'border-emerald-300 bg-emerald-50 text-emerald-700'
            }`}
          >
            {totalWords} / {totalWordLimit} total words
          </Badge>
        </div>
      </div>

      {/* Why Drawer */}
      {activeWhyCard && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-slate-950">
            <span>Why Section-by-Section Narrative Compilation Matters</span>
            <button
              onClick={() => setActiveWhyCard(false)}
              className="text-emerald-600 hover:text-emerald-700"
            >
              ✕
            </button>
          </div>
          <p>
            Grant committees and underwriter review panels do not read freeform essays. They score submissions against strict, numbered rubrics with explicit criteria and strict word limits. This step translates all your hard work from Modules A–K into the exact structure and tone expected by {isUK ? 'Innovate UK or Start Up Loan underwriters' : 'Local Enterprise Offices (LEO) and Enterprise Ireland'}.
          </p>
        </div>
      )}

      {/* Example Drawer */}
      {activeExampleCard && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1.5">
          <div className="flex items-center justify-between font-bold text-emerald-950">
            <span>Example of Evidence-Led Assessor Copy</span>
            <button
              onClick={() => setActiveExampleCard(false)}
              className="text-emerald-400 hover:text-emerald-600"
            >
              ✕
            </button>
          </div>
          <p className="font-mono text-[11px] bg-white/70 p-2.5 rounded border border-emerald-200">
            &quot;Rather than claiming &apos;we have huge market demand,&apos; write: &apos;Across 48 primary Mom-Test discovery interviews conducted in Module C, 73% of target operations managers reported €1,200/mo in recurring manual reporting waste, confirming willingness to pay for our €199/mo tier with zero local displacement.&apos;&quot;
          </p>
        </div>
      )}

      {/* Assessor Tip Callout */}
      {aiTip && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-900">
              <span className="font-bold">Assessor Scoring Guidance: </span>
              {aiTip}
            </div>
          </div>
        </div>
      )}

      {/* Executive Hook / Opening Mandate */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Master Executive Hook &amp; Opening Defense Statement
            </h3>
            <Badge variant="outline" className="border-slate-200 bg-emerald-50 text-[10px] text-emerald-800">
              Header Statement
            </Badge>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setExecutiveHook(
                plan.moduleLData?.step2Audit?.preFlightDefenseSummary ||
                  `"${plan.title}" is an evidence-backed ${plan.industryCategory || 'venture'} engineered to satisfy statutory underwriting requirements in ${plan.hqCountryCode || 'Ireland'}. Cross-module validation confirms empirical customer willingness-to-pay, defensible unit economics, and verified additionality with zero unmitigated displacement.`
              )
            }
            className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset to Pre-Flight Defense
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          This overarching narrative anchors your formal submission, bridging the cross-module audit from Step 2 into your official application overview:
        </p>

        <textarea
          rows={3}
          value={executiveHook}
          onChange={(e) => setExecutiveHook(e.target.value)}
          disabled={isVaultReadonly}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          placeholder="Enter master executive statement..."
        />
      </div>

      {/* Section-by-Section Interactive Accordion Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">
            Official Questions &amp; Scored Submission Sections ({sections.length})
          </h3>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              if (expandedSectionIds.length === sections.length) {
                setExpandedSectionIds([]);
              } else {
                setExpandedSectionIds(sections.map((s) => s.id));
              }
            }}
            className="h-7 text-xs text-slate-500 hover:text-slate-900"
          >
            {expandedSectionIds.length === sections.length ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>

        {sections.map((section) => {
          const isExpanded = expandedSectionIds.includes(section.id);
          const isCompiling = compilingSectionId === section.id;
          const wordCount = (section.compiledResponseText || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
          const limit = section.wordLimit || 400;
          const isOverLimit = wordCount > limit;
          const isNearLimit = wordCount >= limit * 0.9 && !isOverLimit;

          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? 'border-slate-200 bg-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Header Row */}
              <div
                onClick={() => toggleSection(section.id)}
                className="flex cursor-pointer items-center justify-between gap-3 p-4 select-none"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-slate-200 text-xs font-bold text-emerald-800">
                    {section.sectionNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {section.title}
                      </h4>
                      {section.scoringWeightPercent > 0 && (
                        <Badge
                          variant="outline"
                          className="border-slate-100 bg-slate-50 text-emerald-800 text-[10px] font-medium"
                        >
                          Weight: {section.scoringWeightPercent}%
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {section.assessorQuestionPrompt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium ${
                      isOverLimit
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : isNearLimit
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {wordCount} / {limit}w
                  </Badge>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Content Area */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 pt-3 space-y-3 bg-slate-50/30">
                  {/* Assessor Rubric Callout */}
                  <div className="rounded-lg border border-slate-200/80 bg-white p-3 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between text-slate-700 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-emerald-700" />
                        Assessor Evaluation Focus
                      </span>
                      {section.sourceModules && section.sourceModules.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Pulls evidence from:</span>
                          {section.sourceModules.map((modCode) => (
                            <Badge
                              key={modCode}
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigateToModule) {
                                  onNavigateToModule(modCode as any);
                                }
                              }}
                              className="cursor-pointer border-slate-200 bg-slate-100 text-[9px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                            >
                              {modCode.replace('MOD_', '')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {section.assessorQuestionPrompt}
                    </p>
                  </div>

                  {/* Editable Compiled Response */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        Compiled Official Response
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleCopySection(section.id, section.compiledResponseText)
                          }
                          className="h-6 px-2 text-[11px] text-slate-600 hover:bg-slate-100"
                        >
                          {copiedSectionId === section.id ? (
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

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompileSectionAi(section)}
                          disabled={isCompiling || isVaultReadonly}
                          className="h-6 border-slate-200 bg-slate-50 text-[11px] font-semibold text-emerald-800 hover:bg-slate-100"
                        >
                          <Sparkles className="mr-1 h-3 w-3 text-emerald-700" />
                          {isCompiling ? 'Polishing...' : 'AI Polish for Assessor'}
                        </Button>
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      value={section.compiledResponseText}
                      onChange={(e) => updateSectionText(section.id, e.target.value)}
                      disabled={isVaultReadonly}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                      placeholder="Write or refine the compiled answer for this section..."
                    />

                    {isOverLimit && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Warning: This section is {wordCount - limit} words over the {limit}
                        -word official limit. Trim text or use &apos;AI Polish for Assessor&apos; to condense.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Step Action Toolbar (GEMINI.md Rule 1.1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onBackToStep2}
          className="text-xs text-slate-700"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Step 2 (Contradiction Audit)
        </Button>

        <div className="flex items-center gap-2">
          {onParkQuestionInSession && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const question = prompt(
                  'Park an open question or assumption for your grant narrative:'
                );
                if (question && question.trim()) {
                  onParkQuestionInSession(question.trim());
                }
              }}
              className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
              Park an Open Question
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSaveAndContinue}
            disabled={isSaving || isVaultReadonly}
            className="bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            {isSaving ? 'Saving Sections...' : 'Save & Continue to Step 4'}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
