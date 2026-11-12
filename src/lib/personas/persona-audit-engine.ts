import type {
  ActiveStartupPlan,
  IndustryCategory,
} from '@/lib/auth/session-store';
import type { ModuleCode } from '@/lib/entitlements';
import type { SupportedCountryCode } from '@/lib/localization';
import type { SupportModuleScope, SupportTicketPriority } from '@/lib/support-tracker-store';

export type PersonaArchetypeId =
  | 'AOIFE_IE_FOOD'
  | 'LIAM_UK_SAAS'
  | 'PRIYA_SAM_UK_DEEPTECH'
  | 'MARCO_IE_HYBRID'
  | 'SARAH_IE_STUCK';

export type ComprehensionLevelId =
  | 'L1_EVERYDAY'
  | 'L2_PRACTICAL_SMB'
  | 'L3_STARTUP_FLUENT'
  | 'L4_EXPERT_ASSESSOR';

export type AuditViewportId =
  | 'MOBILE_375'
  | 'TABLET_768'
  | 'LAPTOP_1366';

export type ModuleBuildLifecycleStatus =
  | 'LIVE_STANDALONE'
  | 'LIVE_INLINE'
  | 'SCAFFOLD_UNFINISHED';

export type AuditIssueCategory =
  | 'COMPREHENSION_JARGON'
  | 'PERSONA_MODEL_FIT'
  | 'VIEWPORT_RESPONSIVE'
  | 'FORMATTING_TYPOGRAPHY'
  | 'EDGE_CASE_OTHER_OPTION'
  | 'MICRO_COACHING_SUPPORT'
  | 'CROSS_MODULE_SYNC'
  | 'UNFINISHED_MODULE_SPEC';

export type AuditIssueSeverity = 'CRITICAL' | 'IMPORTANT' | 'SUGGESTION';

export type CognitiveLoadRating =
  | 'EFFORTLESS_TO_FOLLOW'
  | 'SLIGHT_FRICTION'
  | 'TOO_COMPLICATED_OVERWHELMING';

export interface PersonaArchetypeDefinition {
  id: PersonaArchetypeId;
  name: string;
  shortLabel: string;
  avatarInitials: string;
  roleTitle: string;
  hqCountryCode: SupportedCountryCode;
  baseCurrency: 'EUR' | 'GBP' | 'USD';
  regionOrCounty: string;
  industryCategory: IndustryCategory;
  teamStructure: 'SOLO' | 'CO_FOUNDERS' | 'LOOKING_FOR_COFOUNDER';
  businessTitle: string;
  oneLinerSummary: string;
  bioSummary: string;
  whatTheyStressTest: string[];
  typicalBlindSpots: string[];
}

export interface ComprehensionLevelDefinition {
  id: ComprehensionLevelId;
  levelNumber: 1 | 2 | 3 | 4;
  label: string;
  shortBadge: string;
  readingGradeTarget: string;
  personaMindset: string;
  jargonTolerance: 'ZERO' | 'LOW' | 'MODERATE' | 'HIGH';
  writingStyleDescription: string;
  auditFocus: string[];
}

export interface AuditViewportDefinition {
  id: AuditViewportId;
  label: string;
  shortLabel: string;
  widthPx: number;
  heightPx: number;
  deviceExamples: string;
  tailwindBreakpoint: string;
  primaryLayoutRisks: string[];
}

export interface ModuleAuditSummaryItem {
  moduleCode: ModuleCode;
  shortName: string;
  title: string;
  targetFilePath: string;
  buildStatus: ModuleBuildLifecycleStatus;
  detectedStepsCount: number;
  hasCollapsibleStepState: boolean;
  hasExpandAllToggle: boolean;
  hasOverviewBriefStep: boolean;
  hasOtherOptionCoverage: boolean;
  hasMicroCoachingWhyCards: boolean;
  hasShowMeExampleCards: boolean;
  hasParkOpenQuestionHook: boolean;
  clarityScore: number; // 0-100
  formattingScore: number; // 0-100
  viewportScore: number; // 0-100
  personaFitScore: number; // 0-100
  followabilityScore?: number; // 0-100
  cognitiveLoadRating?: CognitiveLoadRating;
  personaCheckInSummary?: string;
  issuesCount: number;
}

export interface PersonaAuditFinding {
  id: string;
  moduleCode: ModuleCode;
  moduleShortName: string;
  stepLabel: string;
  targetFilePath: string;
  category: AuditIssueCategory;
  severity: AuditIssueSeverity;
  viewport: AuditViewportId | 'ALL_VIEWPORTS';
  comprehensionLevel: ComprehensionLevelId;
  personaId: PersonaArchetypeId;
  title: string;
  personaFirstPersonQuote: string;
  technicalFinding: string;
  recommendedFix: string;
  suggestedPlainEnglishCopy?: string;
}

export interface PersonaAuditReport {
  generatedAt: string;
  persona: PersonaArchetypeDefinition;
  comprehension: ComprehensionLevelDefinition;
  selectedViewports: AuditViewportId[];
  overallHealthScore: number;
  readabilitySummary: {
    estimatedReadingGrade: string;
    jargonTermsFlaggedCount: number;
    flaggedTerms: string[];
    overallFollowabilityVerdict?: string;
    modulesFlaggedTooComplicatedCount?: number;
  };
  followabilityCheckIns?: unknown[];
  moduleSummaries: ModuleAuditSummaryItem[];
  findings: PersonaAuditFinding[];
}

// ============================================================================
// 1. THE 4-LEVEL COMPREHENSION / INTELLIGENCE LEVER
// ============================================================================

export const COMPREHENSION_LEVELS: ComprehensionLevelDefinition[] = [
  {
    id: 'L1_EVERYDAY',
    levelNumber: 1,
    label: 'Level 1: Everyday Plain-English (Zero Business Jargon)',
    shortBadge: 'L1 • Plain-English (~Age 12)',
    readingGradeTarget: 'Grade 6–7 (Plain Everyday Speech)',
    personaMindset:
      'Skilled maker, tradesperson, or first-time side-hustler who has never read a startup blog. Bounces immediately if they see unexplained acronyms like TAM/SAM/SOM, CAC, CapEx, COGS, B2B, or TRL.',
    jargonTolerance: 'ZERO',
    writingStyleDescription:
      'Writes short, literal, everyday sentences ("I make oat energy drinks in Cork and sell them to local gyms for €3 a bottle").',
    auditFocus: [
      'Flags ANY unexplained acronym or finance/startup buzzword in step titles, labels, or placeholders',
      'Checks whether "Why Are We Asking This?" and "Show Me an Example" are written in plain kitchen-table English',
      'Verifies that quantitative steps offer a 1-click "Use Industry Benchmark" or "Park It" button so they never freeze up',
    ],
  },
  {
    id: 'L2_PRACTICAL_SMB',
    levelNumber: 2,
    label: 'Level 2: Practical Small-Business Owner (Street-Smart)',
    shortBadge: 'L2 • Practical SMB (~Age 15)',
    readingGradeTarget: 'Grade 8–9 (Clear Commercial English)',
    personaMindset:
      'Understands cash in vs. cash out, profit per sale, paying suppliers, and hiring staff, but gets frustrated by Silicon Valley or civil-service grant terminology ("Non-displacement", "Work Packages", "Debtor Days").',
    jargonTolerance: 'LOW',
    writingStyleDescription:
      'Writes practical 2-3 sentence commercial explanations focused on customers, suppliers, and cash in the bank.',
    auditFocus: [
      'Audits whether grant & financial terms in Modules D, E, F, H, J, K, L translate cleanly into practical business numbers',
      'Checks if tax/VAT/PRSI/NIC labels clearly state whether numbers include or exclude tax',
      'Flags steps that feel repetitive or academic rather than practically useful',
    ],
  },
  {
    id: 'L3_STARTUP_FLUENT',
    levelNumber: 3,
    label: 'Level 3: Startup-Fluent Founder (Accelerator Ready)',
    shortBadge: 'L3 • Startup-Fluent',
    readingGradeTarget: 'Grade 10–11 (Modern Startup Standard)',
    personaMindset:
      'Listens to startup podcasts, knows MVP, SaaS, churn, and waitlists. Wants fast momentum, smart defaults, and high-leverage blind-spot challenges.',
    jargonTolerance: 'MODERATE',
    writingStyleDescription:
      'Writes structured, multi-sentence answers with clear customer personas, conversion assumptions, and channel strategies.',
    auditFocus: [
      'Audits step-to-step momentum, auto-fill quality, and cross-module data handoffs (Mod C/D/F -> Mod H)',
      'Checks whether AI micro-coaching examples feel tailored to their specific industry track',
      'Verifies Overview Briefs look polished enough to share with a mentor or co-founder',
    ],
  },
  {
    id: 'L4_EXPERT_ASSESSOR',
    levelNumber: 4,
    label: 'Level 4: Grant Assessor / CFO / Domain Expert (High Scrutiny)',
    shortBadge: 'L4 • Expert / Grant Auditor',
    readingGradeTarget: 'Grade 12+ (Institutional & Due-Diligence)',
    personaMindset:
      'Reads like a Local Enterprise Office (LEO) / Enterprise Ireland / Innovate UK assessor or chartered accountant. Stress-tests edge-case math, regulatory compliance, and long multi-paragraph inputs.',
    jargonTolerance: 'HIGH',
    writingStyleDescription:
      'Writes dense, multi-paragraph technical and financial justifications with exact percentages, regulatory citations, and long strings that stress-test UI containers.',
    auditFocus: [
      'Stress-tests UI formatting with long titles, multi-paragraph inputs, and edge-case numbers',
      'Audits IE LEO (laptop ban, 3-quote rules, export/non-displacement) and UK Innovate UK / Start Up Loans rule accuracy',
      'Checks that net-of-tax vs. gross pricing and payroll baselines reconcile cleanly across modules',
    ],
  },
];

// ============================================================================
// 2. THE 3-DEVICE VIEWPORT MATRIX (MOBILE / TABLET / LAPTOP)
// ============================================================================

export const AUDIT_VIEWPORTS: AuditViewportDefinition[] = [
  {
    id: 'MOBILE_375',
    label: 'Mobile Phone (375 × 812)',
    shortLabel: '📱 Mobile (375px)',
    widthPx: 375,
    heightPx: 812,
    deviceExamples: 'iPhone SE / iPhone 13 Mini / Narrow Android',
    tailwindBreakpoint: 'Base (< 640px, before sm:)',
    primaryLayoutRisks: [
      'iOS Safari auto-zoom if any <input>, <textarea>, or <select> uses text-xs/text-sm without text-base sm:text-xs',
      'Multi-column tables or comparison matrices overflowing horizontally without overflow-x-auto',
      'Collapsed step header badges and "Edit Step" buttons colliding or wrapping awkwardly without min-w-0 flex-1 and shrink-0',
      'Action bar CTAs overflowing narrow cards instead of stacking full-width (w-full sm:w-auto)',
    ],
  },
  {
    id: 'TABLET_768',
    label: 'Tablet Portrait (768 × 1024)',
    shortLabel: '📟 Tablet (768px)',
    widthPx: 768,
    heightPx: 1024,
    deviceExamples: 'iPad Mini / iPad Air Portrait',
    tailwindBreakpoint: 'sm: (640px+) & md: (768px+), below lg: (1024px)',
    primaryLayoutRisks: [
      'The "awkward middle" breakpoint: workspace sidebar is collapsed (lg:hidden), leaving main content 768px wide',
      '3-column grids (sm:grid-cols-3) becoming too narrow at 768px (~220px per card) causing button text and badges to wrap onto 2–3 lines',
      'Multi-button toolbars in Expanded Step headers wrapping unevenly when 4+ badges/buttons sit on one row',
    ],
  },
  {
    id: 'LAPTOP_1366',
    label: 'Standard Laptop (1366 × 768)',
    shortLabel: '💻 Laptop (1366px)',
    widthPx: 1366,
    heightPx: 768,
    deviceExamples: '13" Windows Laptop / MacBook Air',
    tailwindBreakpoint: 'lg: (1024px+) & xl: (1280px+)',
    primaryLayoutRisks: [
      '12-column workspace split (3 cols sidebar + 9 cols module) leaves ~940px for module content—wide tables or 4-col grids can feel tight',
      'Limited 768px vertical height means sticky headers + tall module hero banners can push the active step below the fold',
      'Long step titles in the top dark header navigation strip truncating or misaligning across 6-step rows',
    ],
  },
];

// ============================================================================
// 3. THE 5 SYNTHETIC FOUNDER PERSONA ARCHETYPES
// ============================================================================

export const PERSONA_ARCHETYPES: PersonaArchetypeDefinition[] = [
  {
    id: 'AOIFE_IE_FOOD',
    name: 'Aoife Murphy',
    shortLabel: '🇮🇪 Aoife • Artisan Food & Drink (IE)',
    avatarInitials: 'AM',
    roleTitle: 'Solo Artisan Food & Functional Drinks Founder',
    hqCountryCode: 'IE',
    baseCurrency: 'EUR',
    regionOrCounty: 'Cork',
    industryCategory: 'E-Commerce / Physical Product / Food & Drink',
    teamStructure: 'SOLO',
    businessTitle: 'WildAtlantic Oat & Sea-Moss Tonics',
    oneLinerSummary:
      'Canned functional oat & Irish carrageen sea-moss wellness drinks brewed in West Cork for independent health stores, gyms, and D2C subscription boxes.',
    bioSummary:
      'Former food technologist launching a shelf-stable functional beverage brand in Cork. Needs commercial canning equipment, HSE food safety registration, and a Local Enterprise Office (LEO) Priming Grant.',
    whatTheyStressTest: [
      'Physical SKU / Unit COGS vs. software bias in Modules D, E, and H',
      'Ireland LEO 3-quote supplier rule & standard laptop ban in Module E Step 2',
      'Plain-English clarity for non-software founders when asked about "tech stack", "channels", or "work packages"',
    ],
    typicalBlindSpots: [
      'Underestimating distributor/retail wholesale margin cuts (35%–45%) vs direct online sales',
      'Waiting 45–60 days for supermarket/wholesaler debtor payments while paying canning suppliers upfront',
    ],
  },
  {
    id: 'LIAM_UK_SAAS',
    name: 'Liam Carter',
    shortLabel: '🇬🇧 Liam • Bootstrapped Solo SaaS (UK)',
    avatarInitials: 'LC',
    roleTitle: 'Bootstrapped Solo Technical Founder',
    hqCountryCode: 'GB',
    baseCurrency: 'GBP',
    regionOrCounty: 'Manchester',
    industryCategory: 'B2B SaaS / AI App',
    teamStructure: 'SOLO',
    businessTitle: 'SiteCertify UK — Automated Subcontractor CIS & Safety Chaser',
    oneLinerSummary:
      'WhatsApp and web compliance automation that chases UK construction subcontractors for expiring insurance, CSCS cards, and CIS tax verification.',
    bioSummary:
      'Solo full-stack developer in Manchester building a B2B micro-SaaS for regional UK building contractors. Bootstrapping on a tight personal survival budget and exploring a £15k British Business Bank Start Up Loan + SEIS.',
    whatTheyStressTest: [
      'Solo-founder handling in Module F (skipping co-founder friction while completing Personal Survival Budget & 7 Hats burnout check)',
      'UK localization (GBP £, 20% VAT, Companies House, Employer NIC, Start Up Loans) across Modules A–L',
      '100% remote / home-office flow in Module E (Premises & Equipment) without forcing warehouse fields',
    ],
    typicalBlindSpots: [
      'Over-building V1 features instead of charging £99/mo for automated WhatsApp expiry reminders on Day 1',
      'Solo founder wearing all 7 hats with zero outbound sales block scheduled in the week',
    ],
  },
  {
    id: 'PRIYA_SAM_UK_DEEPTECH',
    name: 'Dr. Priya Patel & Sam Hughes',
    shortLabel: '🇬🇧 Priya & Sam • DeepTech Spinout Duo (UK)',
    avatarInitials: 'PS',
    roleTitle: 'Co-Founder Spinout Team (R&D + Commercial)',
    hqCountryCode: 'GB',
    baseCurrency: 'GBP',
    regionOrCounty: 'Oxford',
    industryCategory: 'Hardware / MedTech / DeepTech',
    teamStructure: 'CO_FOUNDERS',
    businessTitle: 'NeuroPulse Diagnostics — Point-of-Care Concussion Biosensor',
    oneLinerSummary:
      'Handheld saliva biosensor and cloud triage dashboard for rapid pitch-side concussion screening in amateur and academy sport.',
    bioSummary:
      'Two co-founders (Priya: Biomedical PhD full-time; Sam: Commercial lead still working part-time in corporate medtech). Targeting Innovate UK Smart Grants and £500k SEIS/EIS angel funding.',
    whatTheyStressTest: [
      'Co-Founder Alignment Survey (12 Awkward Questions) & asymmetric commitment/equity split in Module F',
      'Hardware + Software hybrid product track, Work Packages (WP1..n), and regulatory compliance (UKCA / MHRA) in Modules D & E',
      'High R&D burn vs delayed revenue breakeven in Module H',
    ],
    typicalBlindSpots: [
      '50/50 equity split without vesting despite one co-founder working full-time and the other part-time',
      'Grant reimbursement cashflow trough (spending £100k upfront before claiming 70% Innovate UK quarterly arrears)',
    ],
  },
  {
    id: 'MARCO_IE_HYBRID',
    name: 'Marco Rossi',
    shortLabel: '🇮🇪 Marco • Hybrid B2B2C Marketplace (IE)',
    avatarInitials: 'MR',
    roleTitle: 'Non-Standard Hybrid Model Founder',
    hqCountryCode: 'IE',
    baseCurrency: 'EUR',
    regionOrCounty: 'Galway',
    industryCategory: 'Consumer App / Marketplace',
    teamStructure: 'LOOKING_FOR_COFOUNDER',
    businessTitle: 'ToolShare Pro — Local Trade Equipment Rental & Fleet Pass',
    oneLinerSummary:
      'Two-sided peer-to-peer and depot locker marketplace where independent tradespeople rent specialist power tools by the day with instant damage insurance.',
    bioSummary:
      'Operations manager in Galway combining a two-sided marketplace commission model with physical smart-lockers. Intentionally selects "OTHER" on standard B2B/B2C tiles because his model is a hybrid.',
    whatTheyStressTest: [
      'Every single "OTHER" tile/pill selector across Modules A–L and verifies custom text persists into Overview Briefs',
      'Marketplace commission + hardware locker capex combination in Modules D, E, and H',
      'Seeking Co-Founder state in Module A & Module F',
    ],
    typicalBlindSpots: [
      'Chicken-and-egg marketplace cold-start problem (needing tool supply before renters arrive)',
      'High insurance & damage dispute friction eating into a 15% marketplace take-rate',
    ],
  },
  {
    id: 'SARAH_IE_STUCK',
    name: 'Sarah Byrne',
    shortLabel: '🇮🇪 Sarah • First-Time / Unsure Explorer (IE)',
    avatarInitials: 'SB',
    roleTitle: 'Skeptical / Overwhelmed First-Time Founder',
    hqCountryCode: 'IE',
    baseCurrency: 'EUR',
    regionOrCounty: 'Dublin',
    industryCategory: 'Service / Agency / Consulting',
    teamStructure: 'SOLO',
    businessTitle: 'CalmHome Dublin — Post-Partum Home Organization & Meal Prep',
    oneLinerSummary:
      'Booked-by-the-week in-home nursery organization, batch cooking, and admin support packages for new parents in Dublin.',
    bioSummary:
      'First-time founder with strong empathy and customer hustle, but intimidated by spreadsheets, market sizing, and compliance forms. Relies heavily on "Why Are We Asking This?", "Show Me an Example", and "Park It in Open Questions".',
    whatTheyStressTest: [
      'Empty/minimal states, Momentum Protection ("Park It in Open Questions"), and "Use Industry Benchmark" fallbacks',
      'Domestic service business eligibility warnings in Module A Step 6 (LEO export/manufacturing rules vs Local Service eligibility)',
      'Comprehension Level L1/L2 friendliness across every step description and micro-coaching card',
    ],
    typicalBlindSpots: [
      'Trading time for money with a hard ceiling on weekly billable hours once travel time across Dublin is included',
      'Assuming LEO Priming Grants fund local domestic consumer services without an export/digital product angle',
    ],
  },
];

// ============================================================================
// 4. MODULE METADATA CATALOG (ALL 12 MODULES A–L)
// ============================================================================

export const PLATFORM_MODULES_CATALOG: Array<{
  code: ModuleCode;
  shortName: string;
  title: string;
  expectedStandaloneFile: string;
  fallbackWorkspaceFile: string;
  supportScope: SupportModuleScope;
}> = [
  {
    code: 'MOD_A_IDEATION',
    shortName: 'Module A',
    title: 'Ideation, Concept Canvas & Grant Pre-Check',
    expectedStandaloneFile: 'src/app/(workspace)/workspace/page.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_A_IDEATION',
  },
  {
    code: 'MOD_B_MARKET',
    shortName: 'Module B',
    title: 'Market & Competitive Intelligence',
    expectedStandaloneFile: 'src/components/workspace/module-b-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_B_MARKET',
  },
  {
    code: 'MOD_C_SURVEYS_FEEDBACK',
    shortName: 'Module C',
    title: 'Customer Surveys, Waitlist & Interview Engine',
    expectedStandaloneFile: 'src/components/workspace/module-c-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_C_SURVEYS_FEEDBACK',
  },
  {
    code: 'MOD_D_PRODUCT_BUILD',
    shortName: 'Module D',
    title: 'What Are We Building? (Product & Work Packages)',
    expectedStandaloneFile: 'src/components/workspace/module-d-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_D_PRODUCT_BUILD',
  },
  {
    code: 'MOD_E_OPERATIONS',
    shortName: 'Module E',
    title: 'Operations, Equipment & Risk Register',
    expectedStandaloneFile: 'src/components/workspace/module-e-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_E_OPERATIONS',
  },
  {
    code: 'MOD_F_COFOUNDER_TEAM',
    shortName: 'Module F',
    title: 'Team, Survival Budget & Co-Founder Alignment',
    expectedStandaloneFile: 'src/components/workspace/module-f-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_F_COFOUNDER_TEAM',
  },
  {
    code: 'MOD_G_LAUNCHPAD',
    shortName: 'Module G',
    title: 'Getting Set Up (Launchpad & Operations Hub)',
    expectedStandaloneFile: 'src/components/workspace/module-g-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_G_LAUNCHPAD',
  },
  {
    code: 'MOD_H_REVENUE',
    shortName: 'Module H',
    title: 'Selling, Sales Assumptions & Pocket Profit Breakeven',
    expectedStandaloneFile: 'src/components/workspace/module-h-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_H_REVENUE',
  },
  {
    code: 'MOD_I_MARKETING',
    shortName: 'Module I',
    title: 'Marketing, 4Ps & First 10 Customers Playbook',
    expectedStandaloneFile: 'src/components/workspace/module-i-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_I_MARKETING',
  },
  {
    code: 'MOD_J_FINANCE',
    shortName: 'Module J',
    title: 'Financials, 36-Month Cashflow Trough & Legal Shield',
    expectedStandaloneFile: 'src/components/workspace/module-j-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_J_FINANCE',
  },
  {
    code: 'MOD_K_GRANTS_FUNDING',
    shortName: 'Module K',
    title: 'Non-Dilutive Grants, Loans & Investor Tax Relief Hub',
    expectedStandaloneFile: 'src/components/workspace/module-k-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_K_GRANTS_FUNDING',
  },
  {
    code: 'MOD_L_BUSINESS_PLAN',
    shortName: 'Module L',
    title: 'Living Business Plan & 5-Mode Official Grant Compiler',
    expectedStandaloneFile: 'src/components/workspace/module-l-workspace.tsx',
    fallbackWorkspaceFile: 'src/app/(workspace)/workspace/page.tsx',
    supportScope: 'MOD_L_BUSINESS_PLAN',
  },
];

// ============================================================================
// 5. JARGON & COMPREHENSION LEXICON (CALIBRATED BY LEVEL L1-L4)
// ============================================================================

export interface JargonTermRule {
  termPattern: string;
  displayTerm: string;
  flaggedAtLevels: ComprehensionLevelId[];
  plainEnglishReplacement: string;
  inlineTooltipExplanation: string;
}

export const JARGON_LEXICON_RULES: JargonTermRule[] = [
  {
    termPattern: 'TAM/SAM/SOM',
    displayTerm: 'TAM / SAM / SOM',
    flaggedAtLevels: ['L1_EVERYDAY', 'L2_PRACTICAL_SMB'],
    plainEnglishReplacement: 'Total Market vs. Realistic Year 1–2 Customers',
    inlineTooltipExplanation:
      'TAM = everyone in the world who could buy; SAM = people in your target countries; SOM = the realistic number of customers you can win in Years 1–2.',
  },
  {
    termPattern: 'Beachhead',
    displayTerm: 'Beachhead Customer / Segment',
    flaggedAtLevels: ['L1_EVERYDAY'],
    plainEnglishReplacement: 'Your First Core Customer Group (Who buys first?)',
    inlineTooltipExplanation:
      'A "Beachhead" simply means the very first specific group of customers you focus on winning before expanding to everyone else.',
  },
  {
    termPattern: 'CapEx',
    displayTerm: 'CapEx / Capital Depreciation',
    flaggedAtLevels: ['L1_EVERYDAY', 'L2_PRACTICAL_SMB'],
    plainEnglishReplacement: 'Big Equipment & Upfront Purchases',
    inlineTooltipExplanation:
      'CapEx (Capital Expenditure) means physical equipment or machinery you buy that lasts several years (like commercial ovens, vans, or lab hardware).',
  },
  {
    termPattern: 'COGS',
    displayTerm: 'COGS / Direct Variable Cost',
    flaggedAtLevels: ['L1_EVERYDAY'],
    plainEnglishReplacement: 'Direct Cost to Make & Deliver 1 Sale',
    inlineTooltipExplanation:
      'COGS (Cost of Goods Sold) is what it directly costs you in raw materials, packaging, postage, or server usage every single time you sell one unit.',
  },
  {
    termPattern: 'Non-Displacement',
    displayTerm: 'Non-Displacement / Deadweight',
    flaggedAtLevels: ['L1_EVERYDAY', 'L2_PRACTICAL_SMB', 'L3_STARTUP_FLUENT'],
    plainEnglishReplacement:
      'Why Grant Money Won’t Just Take Sales From Another Local Shop',
    inlineTooltipExplanation:
      'Grant agencies must check "Non-Displacement": proving your business brings new value or exports rather than just taking local customers away from an existing cafe or agency down the road.',
  },
  {
    termPattern: 'Work Package',
    displayTerm: 'Work Packages (WP1..n)',
    flaggedAtLevels: ['L1_EVERYDAY', 'L2_PRACTICAL_SMB'],
    plainEnglishReplacement: 'Build Phases & Milestones (Step-by-Step Plan)',
    inlineTooltipExplanation:
      'Grants like Innovate UK and LEO ask you to group your build plan into numbered "Work Packages" (e.g. Phase 1: Recipe/Prototype, Phase 2: Safety Testing, Phase 3: Launch).',
  },
  {
    termPattern: 'Debtor',
    displayTerm: 'Debtor Payment Terms (Net 30 / Net 60)',
    flaggedAtLevels: ['L1_EVERYDAY'],
    plainEnglishReplacement: 'How Fast Customers Actually Pay You (Instant vs 30–60 Day Invoices)',
    inlineTooltipExplanation:
      'If you sell to businesses or supermarkets on "Net 30" or "Net 60" invoice terms, you deliver the product today but wait 30 to 60 days for the cash to hit your bank account.',
  },
  {
    termPattern: 'Value Metric',
    displayTerm: 'Value Metric',
    flaggedAtLevels: ['L1_EVERYDAY', 'L2_PRACTICAL_SMB'],
    plainEnglishReplacement: 'What Unit You Charge For (e.g., per bottle, per user, per month)',
    inlineTooltipExplanation:
      'Your "Value Metric" is simply the unit on your price tag—like charging per box shipped, per active team member, or per completed project.',
  },
  {
    termPattern: 'SLA',
    displayTerm: 'Turnaround SLA / Support SLA',
    flaggedAtLevels: ['L1_EVERYDAY'],
    plainEnglishReplacement: 'Promised Delivery & Reply Speed',
    inlineTooltipExplanation:
      'SLA (Service Level Agreement) means how quickly you promise to deliver an order or reply when a customer has a problem.',
  },
  {
    termPattern: 'Vesting',
    displayTerm: 'Reverse Vesting & Cliff',
    flaggedAtLevels: ['L1_EVERYDAY', 'L2_PRACTICAL_SMB'],
    plainEnglishReplacement: 'Earning Co-Founder Shares Over Time (Protects Everyone If Someone Leaves Early)',
    inlineTooltipExplanation:
      'Vesting means co-founders earn their shares month-by-month over 3–4 years (with a 12-month trial "cliff") so nobody walks away after 3 months owning 50% of the company.',
  },
];

// ============================================================================
// 6. REALISTIC SEEDED STARTUP PLAN BUILDER (VOICE CALIBRATED TO L1–L4)
// ============================================================================

function adaptTextToComprehensionVoice(
  level: ComprehensionLevelId,
  variants: {
    L1: string;
    L2: string;
    L3: string;
    L4: string;
  }
): string {
  switch (level) {
    case 'L1_EVERYDAY':
      return variants.L1;
    case 'L2_PRACTICAL_SMB':
      return variants.L2;
    case 'L3_STARTUP_FLUENT':
      return variants.L3;
    case 'L4_EXPERT_ASSESSOR':
      return variants.L4;
  }
}

export function buildSeededPersonaStartupPlan(
  personaId: PersonaArchetypeId,
  comprehensionId: ComprehensionLevelId
): ActiveStartupPlan {
  const persona =
    PERSONA_ARCHETYPES.find((p) => p.id === personaId) || PERSONA_ARCHETYPES[0];
  const levelInfo =
    COMPREHENSION_LEVELS.find((l) => l.id === comprehensionId) ||
    COMPREHENSION_LEVELS[0];

  const nowIso = new Date().toISOString();
  const currency = persona.baseCurrency;
  const isFood = persona.id === 'AOIFE_IE_FOOD';
  const isUkSaas = persona.id === 'LIAM_UK_SAAS';
  const isDeepTech = persona.id === 'PRIYA_SAM_UK_DEEPTECH';
  const isHybrid = persona.id === 'MARCO_IE_HYBRID';

  const brainDumpText = adaptTextToComprehensionVoice(comprehensionId, {
    L1: `${persona.oneLinerSummary} I want to build this because I see people struggling with this every week and there isn't a simple, honest option that just works without costing a fortune.`,
    L2: `${persona.oneLinerSummary} My goal over the next 12 months is to get the product tested with real paying customers in ${persona.regionOrCounty}, cover my monthly bills, and make sure the unit profit works after paying suppliers and tax.`,
    L3: `${persona.oneLinerSummary} We are targeting an underserved beachhead in ${persona.hqCountryCode} with a lean V1, validating willingness-to-pay through direct customer interviews and pre-orders before scaling distribution.`,
    L4: `${persona.oneLinerSummary} Strategic commercial objective: establish defensible domestic traction in ${persona.regionOrCounty} (${persona.hqCountryCode}) within Q1–Q2 while structuring R&D and operational capacity for international export compliance and non-dilutive grant co-funding.`,
  });

  const coreProblem = adaptTextToComprehensionVoice(comprehensionId, {
    L1: isFood
      ? 'People want a healthy afternoon energy drink without 8 spoons of sugar or fake chemicals, but current healthy drinks taste terrible.'
      : isUkSaas
        ? 'Small builders waste Friday afternoons chasing plumbers and electricians on WhatsApp for expired insurance papers.'
        : 'Customers are stuck doing things the slow, expensive way because existing options are too complicated.',
    L2: `Customers in ${persona.regionOrCounty} currently waste hours and money on clunky workarounds because existing suppliers ignore smaller buyers or charge hidden fees.`,
    L3: `High-friction status quo workflow causing measurable weekly time loss and compliance/margin leakage for our target beachhead segment in ${persona.hqCountryCode}.`,
    L4: `Systemic operational inefficiency and regulatory/margin exposure across the target ${persona.industryCategory} value chain, where incumbent legacy solutions fail to serve SMEs cost-effectively.`,
  });

  const proposedSolution = adaptTextToComprehensionVoice(comprehensionId, {
    L1: `${persona.businessTitle}: ${persona.oneLinerSummary}`,
    L2: `A straightforward, reliable solution (${persona.businessTitle}) that customers can buy and start using immediately with clear upfront pricing in ${currency}.`,
    L3: `${persona.businessTitle} delivers a focused V1 product vehicle with automated onboarding, clear unit economics, and low switching friction.`,
    L4: `${persona.businessTitle}: A modular, export-ready ${persona.industryCategory} solution engineered for high gross margin retention, low customer acquisition payback, and full statutory compliance in ${persona.hqCountryCode}.`,
  });

  const baseUnitPriceNet = isFood
    ? 28
    : isUkSaas
      ? 99
      : isDeepTech
        ? 450
        : isHybrid
          ? 65
          : 180;

  const unitCogs = isFood
    ? 9.5
    : isUkSaas
      ? 6.0
      : isDeepTech
        ? 110.0
        : isHybrid
          ? 14.0
          : 45.0;

  const monthlyPayrollY1 = isFood
    ? 2400
    : isUkSaas
      ? 2200
      : isDeepTech
        ? 5500
        : isHybrid
          ? 2600
          : 2000;

  const vatRate = persona.hqCountryCode === 'GB' ? 20 : 23;

  return {
    id: `plan-persona-${persona.id.toLowerCase()}-${comprehensionId.toLowerCase()}`,
    title: `[${levelInfo.shortBadge}] ${persona.businessTitle}`,
    oneLinerSummary: persona.oneLinerSummary,
    industryCategory: persona.industryCategory,
    hqCountryCode: persona.hqCountryCode,
    baseCurrency: persona.baseCurrency,
    targetMarketsArray:
      persona.id === 'SARAH_IE_STUCK'
        ? [persona.hqCountryCode]
        : [persona.hqCountryCode, 'GB', 'EU'],
    exportPotential:
      persona.id === 'SARAH_IE_STUCK'
        ? 'DOMESTIC_ONLY'
        : 'EXPORTING_INTERNATIONALLY',
    currentModuleStep: 'MOD_A_STEP_8',
    brainDumpText,
    founderMotivation: {
      primaryMotivation: isHybrid ? 'OTHER' : 'LEAVE_JOB',
      otherMotivationText: isHybrid
        ? 'Build a profitable regional trade network that combines digital booking with physical locker depots'
        : undefined,
      weeklyHoursAvailable: isDeepTech ? '40_PLUS_HRS' : '15_TO_25_HRS',
      twelveMonthSuccessVision: adaptTextToComprehensionVoice(comprehensionId, {
        L1: `Have 50 regular paying customers, cover my own wages every month, and not be stressed about bills.`,
        L2: `Reach steady monthly profit in ${persona.regionOrCounty}, prove repeat orders, and secure matching startup support without taking bad debt.`,
        L3: `Reach €8k–€12k MRR / monthly turnover with validated unit economics, <5% churn, and grant-backed product milestones completed.`,
        L4: `Achieve cashflow-positive unit breakeven across Year 1 targets with audited gross margins >65% and export readiness for Enterprise Ireland / Innovate UK progression.`,
      }),
    },
    teamAndBudget: {
      teamStructureType:
        persona.teamStructure === 'CO_FOUNDERS'
          ? 'COFOUNDER_TEAM'
          : persona.teamStructure === 'LOOKING_FOR_COFOUNDER'
            ? 'SEEKING_COFOUNDER'
            : 'SOLO_FOUNDER',
      skillCoverage: isFood || isUkSaas ? 'BUILD_IN_HOUSE' : 'PARTIAL_SKILLS',
      startingBudgetBracket: isDeepTech ? 'OVER_25K' : '1K_TO_5K',
      teamAndFundingNotes: `Seeded via Admin Persona Lab (${persona.name} • ${levelInfo.label}).`,
    },
    founderRealityCheck: {
      industryConnection: 'LIVED_IT_INSIDER',
      personalIncomeUrgency: 'MEDIUM_6_TO_12M',
      dealbreakers: isUkSaas ? ['NO_PHYSICAL_PREMISES'] : ['NO_BIG_TEAM'],
      growthTradeoff: 'NON_DILUTIVE_GRANTS',
      biggestWorryPreset: isHybrid ? 'OTHER' : 'FINDING_FIRST_10',
      biggestWorryNotes: adaptTextToComprehensionVoice(comprehensionId, {
        L1: 'Making sure people actually pay real money and don’t just say "nice idea".',
        L2: 'Keeping upfront equipment and setup costs low until the first 20 customers pay on time.',
        L3: 'Validating repeatable customer acquisition before committing to fixed monthly overheads.',
        L4: 'Managing working capital cashflow troughs between supplier/R&D outlay, debtor collection days, and retrospective grant drawdowns.',
      }),
    },
    conceptCanvas: {
      coreProblem,
      targetCustomer: `${persona.regionOrCounty} & ${persona.hqCountryCode} early adopters for ${persona.businessTitle}`,
      proposedSolution,
      unfairAdvantage: `${persona.name} — direct insider experience + rapid local customer access in ${persona.regionOrCounty}.`,
      revenueAndGrantFit: `Priced at ${currency} ${baseUnitPriceNet} net per unit/month with ${persona.hqCountryCode} grant alignment.`,
      lastSynthesizedAt: nowIso,
      aiEngineUsed: 'smart-synthesizer',
    },
    moduleBData: {
      beachhead: {
        buyerType: isHybrid
          ? 'OTHER'
          : isFood
            ? 'B2C_CONSUMERS'
            : 'B2B_BUSINESSES',
        otherBuyerModelText: isHybrid
          ? 'Hybrid B2B Tradespeople + Local Hardware Locker Host Partners'
          : undefined,
        beachheadSegment: `Independent customers and businesses in ${persona.regionOrCounty} needing ${persona.businessTitle}`,
        endUserVsDecisionMaker: 'SAME_PERSON',
        decisionMakerRole: 'Owner / Founder / Direct Buyer',
        buyingTriggerPreset: 'LOSING_MONEY_WASTE',
        buyingTriggerNotes: coreProblem,
        targetMarketsArray: [persona.hqCountryCode, 'GB'],
        lastSavedAt: nowIso,
      },
      competitorsAndStatusQuo: {
        currentWorkarounds: ['SPREADSHEETS_PAPER', 'WHATSAPP_EMAIL_PHONE'],
        workaroundFrustrationNotes: coreProblem,
        competitors: [
          {
            id: 'comp-1',
            name: 'Legacy Big-Brand / Manual Status Quo',
            category: 'DIRECT_COMPETITOR',
            typicalPriceText: `${currency} ${Math.round(baseUnitPriceNet * 1.4)}`,
            whatTheyDoWell: 'Established brand recognition',
            whereTheyFallShort: 'Overpriced, slow setup, and poor fit for local SMEs',
          },
        ],
        whySwitchEdges: ['SAVES_TIME_AUTOMATIC', 'BUILT_FOR_LOCAL_MARKET'],
        whySwitchOneSentence: proposedSolution,
        lastSavedAt: nowIso,
      },
      marketSizing: {
        segments: [
          {
            id: 'seg-1',
            segmentName: `Core ${persona.regionOrCounty} & ${persona.hqCountryCode} Beachhead`,
            billingCadence: isFood ? 'YEARLY_OR_ONE_OFF' : 'MONTHLY_SUBSCRIPTION',
            pricePerCustomerInput: String(baseUnitPriceNet * 12),
            year1To2CustomerGoalInput: '65',
            reachableCustomersInTargetMarketsInput: '4500',
          },
        ],
        widerMarketMultiplier: '10X',
        sourceAndAssumptionNotes: `Bottom-up count of target buyers in ${persona.hqCountryCode} (${levelInfo.shortBadge}).`,
        lastSavedAt: nowIso,
      },
      competitiveWedge: {
        comparisonRows: [
          {
            rowId: 'row-us',
            label: persona.businessTitle,
            isYourStartup: true,
            priceValueScore: 'HIGH',
            speedTimeSavedScore: 'HIGH',
            easeOfUseScore: 'HIGH',
            specialistQualityScore: 'HIGH',
          },
          {
            rowId: 'row-status-quo',
            label: 'Manual Spreadsheets / Incumbents',
            priceValueScore: 'LOW',
            speedTimeSavedScore: 'LOW',
            easeOfUseScore: 'MEDIUM',
            specialistQualityScore: 'LOW',
          },
        ],
        switchingFrictionReducers: ['FREE_TRIAL_OR_FIRST_STEP', 'FAST_SETUP_UNDER_15_MINS'],
        switchingFrictionPlanNotes: `Built in ${persona.regionOrCounty} with low-friction onboarding across ${persona.hqCountryCode}.`,
        unfairAdvantages: ['FOUNDER_INSIDER_EXPERIENCE', 'LOCAL_COMPLIANCE_OR_GRANTS'],
        competitiveEdgeSummary: proposedSolution,
        lastSavedAt: nowIso,
      },
    },
    moduleDData: {
      productVehicle: {
        productTrack: isFood
          ? 'PHYSICAL_PRODUCT_ECOM'
          : isDeepTech || isHybrid
            ? 'HYBRID_HARDWARE_SOFTWARE'
            : 'SAAS_SOFTWARE_AI',
        formFactor: isHybrid
          ? 'OTHER'
          : isFood
            ? 'SINGLE_HERO_SKU'
            : 'WEB_PLATFORM',
        otherFormFactorText: isHybrid
          ? 'Web Booking App + Smart Bluetooth Locker Hardware'
          : undefined,
        v1PrototypeApproach: isFood
          ? 'IN_HOUSE_SMALL_BATCH_WORKSHOP'
          : 'FOCUSED_FULL_CODE_V1',
        launchTimeline: '1_TO_3_MONTHS',
        ahaMomentNarrative: proposedSolution,
        whyThisVehicleFitsCustomer: `Focused V1 release of ${persona.businessTitle} ready for first 25 paying customers.`,
        lastSavedAt: nowIso,
      },
    },
    moduleEData: {
      operationsBlueprint: {
        fulfillmentMode: isFood
          ? 'IN_HOUSE_WORKSHOP_BATCH'
          : 'AUTOMATED_CLOUD_SELF_SERVE',
        turnaroundSla: 'SAME_OR_NEXT_DAY_24_48H',
        capacityConstraint: 'FOUNDER_MANUAL_HOURS',
        weeklyOpsHoursAllocated: 20,
        orderLifecycleStages: [
          {
            id: 'stage-1',
            stageNumber: 1,
            stageTitle: 'Customer Order & Payment',
            ownerType: 'AUTOMATED_SYSTEM',
            whatHappensStepByStep: 'Customer orders online and payment clears via Stripe.',
            toolsEquipmentOrSupplier: 'Stripe / Online Checkout',
            activeMinutesPerOrder: 5,
            directVariableCostPerOrder: unitCogs,
          },
        ],
        endToEndFulfillmentNarrative: `Customer orders online, payment clears via Stripe, and fulfillment triggers automatically.`,
        scalingAndBottleneckDeRiskingNarrative: `Automated intake and batch fulfillment protect founder bandwidth in Year 1.`,
        lastSavedAt: nowIso,
      },
    },
    moduleFData: {
      promoterProfiles: {
        teamStructurePosture:
          persona.teamStructure === 'CO_FOUNDERS'
            ? 'CO_FOUNDING_DUO_OR_TRIO'
            : persona.teamStructure === 'LOOKING_FOR_COFOUNDER'
              ? 'SOLO_ACTIVELY_RECRUITING_COFOUNDER'
              : 'SOLO_FOUNDER_CURRENT',
        teamMembers: [
          {
            id: 'promoter-1',
            fullName: persona.name,
            roleClassification: 'FOUNDER_PROMOTER',
            jobTitle: persona.roleTitle,
            weeklyCommitment: 'FULL_TIME_40H_PLUS',
            equitySharePercent: persona.teamStructure === 'CO_FOUNDERS' ? 60 : 100,
            linkedInUrl: 'https://linkedin.com',
            compiled150WordNarrative: persona.bioSummary,
            cvReadyForAppendixD: true,
            isCurrentUserFounder: true,
          },
        ],
        executiveTeamCapabilityNarrative: `${persona.name} leading execution in ${persona.regionOrCounty}.`,
        lastSavedAt: nowIso,
      },
      step3SurvivalBudgetData: {
        currencyCode: persona.baseCurrency,
        founderBudgets: [
          {
            memberId: 'promoter-1',
            memberName: persona.name,
            presetUsed: 'LEAN_SOLO',
            housingAndUtilities: 1390,
            groceriesAndEssentials: 420,
            transportAndCommute: 190,
            debtAndLoanCommitments: 150,
            dependentsAndFamily: 150,
            incomeOffsetCushion: 300,
            personalSavingsBuffer: 8500,
            notes: `Calibrated for ${persona.name} (${levelInfo.shortBadge}).`,
          },
        ],
        lastSavedAt: nowIso,
      },
      completionPercentage: 100,
    },
    moduleHData: {
      step1RevenueModel: {
        revenueModelVehicle: isHybrid
          ? 'OTHER'
          : isFood
            ? 'ONE_OFF_TRANSACTION'
            : 'SUBSCRIPTION_RECURRING',
        otherRevenueModelText: isHybrid
          ? 'Daily Equipment Rental + 15% Marketplace Fee + Monthly Pro Pass'
          : undefined,
        offeringStructure: 'MULTI_OFFERING_TIERS',
        valueMetric: isFood ? 'per 12-can case shipped' : 'per active customer / month',
        billingCadenceDefault: isFood ? 'ONE_OFF' : 'MONTHLY',
        offeringRangeSummary: `Core offering at ${currency} ${baseUnitPriceNet} net (+ ${vatRate}% VAT).`,
        selectedCurrency: persona.baseCurrency,
        lastSavedAt: nowIso,
      },
      step2PricingTiers: {
        tiers: [
          {
            id: 'tier-core',
            name: 'Core Flagship Package',
            targetPersona: 'Primary Beachhead Customer',
            priceGross: Number((baseUnitPriceNet * (1 + vatRate / 100)).toFixed(2)),
            priceNetOfTax: baseUnitPriceNet,
            taxRatePercent: vatRate,
            billingFrequency: isFood ? 'ONE_OFF' : 'MONTHLY',
            salesMixPercent: 100,
            deliverablesSummary: persona.oneLinerSummary,
            isRecommendedDefault: true,
          },
        ],
        blendedAveragePriceNet: baseUnitPriceNet,
        pricingStrategyNotes: `Net price ${currency} ${baseUnitPriceNet} after ${vatRate}% VAT.`,
        lastSavedAt: nowIso,
      },
      step3BreakevenCalculator: {
        selectedSimulationYear: 1,
        activePriceSlider: baseUnitPriceNet,
        activeCustomerSlider: 160,
        frictionCosts: {
          paymentGatewayPercent: 1.7,
          paymentGatewayFixedCents: 25,
          directVariableCogsPerUnit: unitCogs,
          disputeRefundBufferPercent: 2.0,
          affiliateCommissionPercent: 0,
        },
        isSandboxActive: false,
        yearTargets: [
          {
            yearNumber: 1,
            monthlyPayrollBaseline: monthlyPayrollY1,
            otherFixedMonthlyOverheads: 450,
            customersNeededToBreakeven: Math.max(
              1,
              Math.ceil((monthlyPayrollY1 + 450) / Math.max(1, baseUnitPriceNet - unitCogs - 1))
            ),
            monthlyRevenueAtBreakeven:
              Math.ceil((monthlyPayrollY1 + 450) / Math.max(1, baseUnitPriceNet - unitCogs - 1)) *
              baseUnitPriceNet,
            monthlyPocketProfitAtTarget: 1250,
          },
          {
            yearNumber: 2,
            monthlyPayrollBaseline: Math.round(monthlyPayrollY1 * 1.6),
            otherFixedMonthlyOverheads: 850,
            customersNeededToBreakeven: Math.max(
              1,
              Math.ceil(
                (monthlyPayrollY1 * 1.6 + 850) / Math.max(1, baseUnitPriceNet - unitCogs - 1)
              )
            ),
            monthlyRevenueAtBreakeven:
              Math.ceil(
                (monthlyPayrollY1 * 1.6 + 850) / Math.max(1, baseUnitPriceNet - unitCogs - 1)
              ) * baseUnitPriceNet,
            monthlyPocketProfitAtTarget: 3400,
          },
          {
            yearNumber: 3,
            monthlyPayrollBaseline: Math.round(monthlyPayrollY1 * 2.4),
            otherFixedMonthlyOverheads: 1400,
            customersNeededToBreakeven: Math.max(
              1,
              Math.ceil(
                (monthlyPayrollY1 * 2.4 + 1400) / Math.max(1, baseUnitPriceNet - unitCogs - 1)
              )
            ),
            monthlyRevenueAtBreakeven:
              Math.ceil(
                (monthlyPayrollY1 * 2.4 + 1400) / Math.max(1, baseUnitPriceNet - unitCogs - 1)
              ) * baseUnitPriceNet,
            monthlyPocketProfitAtTarget: 6800,
          },
        ],
        paymentTerms: isFood ? 'NET_30_DAYS' : 'INSTANT_PAYMENT',
        exportSalesPercent: persona.id === 'SARAH_IE_STUCK' ? 0 : 35,
        exportFocusRegions: 'UK, EU',
        breakevenNarrative: adaptTextToComprehensionVoice(comprehensionId, {
          L1: `Once we sell enough units each month to cover ${currency} ${monthlyPayrollY1} in wages and ${currency} 450 in basic bills, everything after that is clean pocket profit.`,
          L2: `After deducting ${currency} ${unitCogs} in direct unit costs and card fees from our ${currency} ${baseUnitPriceNet} net price, we reach monthly breakeven realistically within Year 1.`,
          L3: `Unit contribution margin is healthy after Stripe and direct COGS, allowing Year 1 survival payroll (${currency} ${monthlyPayrollY1}/mo) to break even well within founder delivery capacity.`,
          L4: `Year 1–3 contribution margin model reconciles net-of-VAT turnover (${currency} ${baseUnitPriceNet}/unit) against variable COGS (${currency} ${unitCogs}/unit), Module F scheduled payroll baselines, and debtor working-capital timing.`,
        }),
        lastSavedAt: nowIso,
      },
      step4SalesAssumptions: {
        salesCycleDays: isDeepTech ? 60 : 14,
        primarySalesMotion: isHybrid ? 'OTHER' : isFood ? 'RETAIL_MARKETPLACE' : 'SELF_SERVE_WEB',
        otherSalesMotionText: isHybrid
          ? 'Direct Trade Partner Onboarding + Self-Serve Locker QR Unlock'
          : undefined,
        expectedConversionRatePercent: 4,
        expectedMonthlyChurnOrRepeatPercent: isFood ? 35 : 4,
        teamMonthlyCapacityCap: 250,
        writtenAssumptionsNarrative: adaptTextToComprehensionVoice(comprehensionId, {
          L1: 'We can realistically handle up to 250 orders a month ourselves before needing extra help.',
          L2: 'Based on a 14-day decision window and 4% conversion from warm leads, one founder can comfortably fulfill Year 1 volume.',
          L3: 'Bottom-up funnel math aligns customer acquisition velocity with operational capacity caps.',
          L4: 'Defensible conversion, retention, and operational throughput assumptions calibrated for grant assessor due diligence.',
        }),
        lastSavedAt: nowIso,
      },
      completionPercentage: 100,
    },
    openQuestions:
      persona.id === 'SARAH_IE_STUCK'
        ? [
            'How many hours of travel across Dublin should I build into each booking price?',
            'Do I need public liability insurance before taking my first 5 trial bookings?',
          ]
        : [],
  };
}

// ============================================================================
// 7. ANTIGRAVITY FIX-PROMPT GENERATORS
// ============================================================================

export function generateAntigravityFixPromptForFinding(
  finding: PersonaAuditFinding,
  persona: PersonaArchetypeDefinition,
  comprehension: ComprehensionLevelDefinition
): string {
  const viewportMeta =
    finding.viewport === 'ALL_VIEWPORTS'
      ? 'All Viewports (Mobile 375px, Tablet 768px, Laptop 1366px)'
      : AUDIT_VIEWPORTS.find((v) => v.id === finding.viewport)?.label ||
        finding.viewport;

  const lines: string[] = [
    `### Antigravity UX & Formatting Fix Request — ${finding.moduleShortName} (${finding.moduleCode})`,
    `- **Target File:** \`${finding.targetFilePath}\``,
    `- **Step / Section:** ${finding.stepLabel}`,
    `- **Issue Category:** \`${finding.category}\` (\`${finding.severity}\`)`,
    `- **Discovered By Persona:** ${persona.name} (${persona.shortLabel})`,
    `- **Comprehension / Intelligence Lever:** ${comprehension.label}`,
    `- **Target Viewport:** ${viewportMeta}`,
    ``,
    `#### 1. Founder Persona Experience (Why This Needs Fixing)`,
    `> "${finding.personaFirstPersonQuote}"`,
    ``,
    `#### 2. Technical & UX Audit Finding`,
    `${finding.technicalFinding}`,
    ``,
    `#### 3. Required Code & Copy Changes`,
    `${finding.recommendedFix}`,
  ];

  if (finding.suggestedPlainEnglishCopy) {
    lines.push(
      ``,
      `#### 4. Suggested Plain-English Copy / Micro-Coaching Upgrade (${comprehension.shortBadge})`,
      `\`\`\`text`,
      finding.suggestedPlainEnglishCopy,
      `\`\`\``
    );
  }

  lines.push(
    ``,
    `#### 5. GEMINI.md Verification Invariants`,
    `- Preserve Desktop-first layout (\`sm:\` / \`lg:\` breakpoints) while fixing \`Mobile (375px)\`, \`Tablet (768px)\`, and \`Laptop (1366px)\` responsiveness.`,
    `- Keep Collapsible Step header typography strict (\`text-sm font-bold text-slate-900\` when collapsed; \`text-base font-bold text-slate-900\` when expanded; \`min-w-0 flex-1\` on title wrapper; \`shrink-0\` on badges/buttons).`,
    `- Ensure every tile/pill selector group includes an \`"OTHER"\` option with inline custom text persistence.`,
    `- Run \`npx tsc --noEmit\` after editing to confirm zero TypeScript errors.`
  );

  return lines.join('\n');
}

export function generateAntigravityBatchFixPrompt(params: {
  report: PersonaAuditReport;
  moduleFilter?: ModuleCode | 'ALL';
  categoryFilter?: AuditIssueCategory | 'ALL';
}): string {
  const { report, moduleFilter = 'ALL', categoryFilter = 'ALL' } = params;
  const filteredFindings = report.findings.filter((f) => {
    if (moduleFilter !== 'ALL' && f.moduleCode !== moduleFilter) return false;
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    return true;
  });

  const scopeTitle =
    moduleFilter === 'ALL'
      ? 'All Audited Modules (A–L)'
      : `${moduleFilter}`;

  const lines: string[] = [
    `# Antigravity Batch UX, Comprehension & Viewport Fix Prompt — ${scopeTitle}`,
    `- **Persona Lens:** ${report.persona.name} (${report.persona.shortLabel} — ${report.persona.industryCategory})`,
    `- **Comprehension / Intelligence Level:** ${report.comprehension.label}`,
    `- **Viewports Checked:** Mobile (375×812), Tablet (768×1024), Laptop (1366×768)`,
    `- **Total Issues to Resolve:** ${filteredFindings.length}`,
    ``,
    `Please apply the following targeted UX, plain-English copy, and responsive formatting fixes across the workspace components:`,
    ``,
  ];

  filteredFindings.forEach((f, idx) => {
    lines.push(
      `## ${idx + 1}. [${f.severity}] ${f.moduleShortName} (${f.stepLabel}) — ${f.title}`,
      `- **File:** \`${f.targetFilePath}\``,
      `- **Category:** \`${f.category}\` | **Viewport:** \`${f.viewport}\` | **Comprehension:** \`${f.comprehensionLevel}\``,
      `- **Founder Feedback:** *"${f.personaFirstPersonQuote}"*`,
      `- **Technical Issue:** ${f.technicalFinding}`,
      `- **Actionable Fix:** ${f.recommendedFix}`
    );
    if (f.suggestedPlainEnglishCopy) {
      lines.push(`- **Suggested Plain-English Copy:** \`${f.suggestedPlainEnglishCopy}\``);
    }
    lines.push(``);
  });

  lines.push(
    `---`,
    `### Final Verification Checklist`,
    `1. Follow all \`GEMINI.md\` Section 5 (Mobile/Tablet/Laptop Responsive UX) and Section 6 (Collapsible Step + Final Overview Brief) invariants.`,
    `2. Do not break any unfinished/scaffold modules—keep module handoffs defensive with optional chaining.`,
    `3. Run \`npx tsc --noEmit\` to verify zero TypeScript errors across the monorepo.`
  );

  return lines.join('\n');
}

export function generateUnfinishedModuleBuildPrompt(
  mod: ModuleAuditSummaryItem,
  persona: PersonaArchetypeDefinition,
  comprehension: ComprehensionLevelDefinition
): string {
  return [
    `# Antigravity Build-to-Standard Prompt — ${mod.shortName} (${mod.moduleCode}): ${mod.title}`,
    `- **Current Status:** \`${mod.buildStatus}\` (Ready to build/upgrade into dedicated workspace component \`${mod.targetFilePath}\`)`,
    `- **Calibration Persona:** ${persona.name} (${persona.shortLabel}) at **${comprehension.shortBadge}**`,
    ``,
    `Please build or upgrade **${mod.shortName} (${mod.title})** in \`${mod.targetFilePath}\` and wire it into \`src/app/(workspace)/workspace/page.tsx\` following all \`GEMINI.md\` standards:`,
    ``,
    `1. **Collapsible Step + Final Overview Brief Architecture (GEMINI.md Section 6):**`,
    `   - Manage \`const [openStep, setOpenStep] = useState<number | 'ALL'>(...)\` with an \`Expand All Steps\` / \`Focus Step-by-Step\` button in the top dark-slate header card.`,
    `   - Collapsed steps must use \`text-sm font-bold text-slate-900\` titles and \`text-xs text-slate-500\` summaries with \`min-w-0 flex-1\` and \`shrink-0\` badges/buttons.`,
    `   - Expanded steps must use \`text-base font-bold text-slate-900\` titles, \`Collapse Step\` button, and a bottom action bar with AI helper, Save, and Next Step.`,
    `   - Final step must be the **${mod.shortName} Overview & Executive Summary Brief** step with a Readiness Checklist Grid, Constructive "Things to Consider" Blind-Spot Review, 1-click Copy Markdown / Download HTML / Print PDF exports, and a dark footer CTA bar to advance to the next module.`,
    `2. **Comprehension Level ${comprehension.shortBadge} Friendly Copy (4-Layer Support):**`,
    `   - Every step must include **"Why Are We Asking This?"** micro-coaching, **"Show Me an Example"** (tailored for physical food/products, B2B SaaS, DeepTech, and local services), and **Inline Jargon Tooltips** explaining any financial/grant acronym in plain kitchen-table English.`,
    `   - Include **"Park It in Open Questions"** and **"Use Industry Benchmark"** fallbacks on quantitative inputs.`,
    `3. **Edge-Case Protection ("OTHER" Option):**`,
    `   - Every single-select or multi-select tile, card, or pill group must include an \`"OTHER"\` option that reveals an inline custom text input persisted in plan data and reflected in the Overview Brief.`,
    `4. **3-Viewport Responsive Invariants (Mobile 375px / Tablet 768px / Laptop 1366px):**`,
    `   - Use \`text-base sm:text-xs\` or \`text-base sm:text-sm\` on all \`<input>\`, \`<textarea>\`, and \`<select>\` elements to prevent iOS Safari 16px auto-zoom.`,
    `   - Wrap any multi-column table in \`overflow-x-auto\` with \`min-w-[600px]\` and ensure tablet (\`768px\`) grids don't orphan or squish action buttons.`,
    `5. **Verification:** Run \`npx tsc --noEmit\` when finished.`,
  ].join('\n');
}
