'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Wand2,
  BookmarkPlus,
  Check,
  Save,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  DollarSign,
  Scale,
  Briefcase,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  Linkedin,
  UserCheck,
  Info,
  FileUp,
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Eye,
  PiggyBank,
  HeartHandshake,
  Clock,
  Coins,
  Gavel,
  PieChart,
  Compass,
  Lock,
  Unlock,
  MessageCircle,
  Coffee,
  CheckCheck,
  X,
  Bookmark,
  Copy,
} from 'lucide-react';
import {
  parseCvAndDraftPromoterBioAction,
  generateRoleMatrixSummaryAction,
  generateHiringStrategySummaryAction,
  generateTeamAuditAndBriefAction,
  type ParseCvAndDraftBioResult,
  type GenerateRoleMatrixSummaryResult,
  type GenerateHiringStrategySummaryResult,
  type GenerateTeamAuditAndBriefResult,
} from '@/app/actions/module-f';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  ActiveStartupPlan,
  TeamMemberProfileItem,
  TeamMemberClassificationType,
  TeamWeeklyCommitmentType,
  TeamStructurePostureType,
  PromoterProfilesStep1Data,
  StartupHatKey,
  HatConfidenceLevel,
  StartupHatAssignment,
  ExternalAdvisorItem,
  RoleMatrixStep2Data,
  SurvivalBudgetStep3Data,
  FounderSurvivalBudgetItem,
  SurvivalBudgetPresetType,
  AwkwardQuestionKey,
  AwkwardQuestionCategory,
  AwkwardQuestionAnswerItem,
  FounderAlignmentResponseItem,
  CoFounderAlignmentStep4Data,
  HiringPostureType,
  RoleDepartmentType,
  EmploymentModeType,
  CompensationModelType,
  PlannedRoleItem,
  HiringPlanStep5Data,
  TeamBlindSpotCategoryType,
  TeamBlindSpotSeverityType,
  TeamReadinessConfidenceType,
  TeamBlindSpotItem,
  TeamBlindSpotAuditBriefData,
} from '@/lib/auth/session-store';

export interface ModuleFWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  onSaveStep1PromoterProfiles: (
    data: PromoterProfilesStep1Data,
    progress: number
  ) => Promise<void>;
  onSaveStep2RoleMatrix?: (
    data: RoleMatrixStep2Data,
    progress?: number
  ) => Promise<void>;
  onSaveStep3SurvivalBudget?: (
    data: SurvivalBudgetStep3Data,
    progress?: number
  ) => Promise<void>;
  onSaveStep4Alignment?: (
    data: CoFounderAlignmentStep4Data,
    progress?: number
  ) => Promise<void>;
  onSaveStep5HiringPlan?: (
    data: HiringPlanStep5Data,
    progress?: number
  ) => Promise<void>;
  onSaveBriefOverview?: (
    data: TeamBlindSpotAuditBriefData,
    progress?: number
  ) => Promise<void>;
  userId?: string;
  userName?: string;
  userEmail?: string;
  onParkOpenQuestion?: (questionText: string) => void;
  onBackToModuleE?: () => void;
  onContinueToModuleG?: () => void;
}

export const TEAM_STRUCTURE_POSTURE_OPTIONS: Array<{
  value: TeamStructurePostureType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'SOLO_FOUNDER_CURRENT',
    label: 'Solo Founder (Building Lean)',
    subtitle:
      'Driving the entire startup solo today, leveraging contractors and automated tools without co-founders.',
    badge: 'Solo Founder',
  },
  {
    value: 'CO_FOUNDING_DUO_OR_TRIO',
    label: 'Co-Founding Team (2–3 Founders)',
    subtitle:
      'Complementary co-founders with shared equity, split technical/commercial hats, and aligned commitment.',
    badge: 'Co-Founders',
  },
  {
    value: 'FOUNDER_PLUS_KEY_TEAM',
    label: 'Founder + Key Team Members / Employees',
    subtitle:
      'Lead founder working alongside committed key team members, lead engineers, designers, or studio staff.',
    badge: 'Founder + Core Team',
  },
  {
    value: 'SOLO_ACTIVELY_RECRUITING_COFOUNDER',
    label: 'Solo Founder (Actively Seeking Co-Founder)',
    subtitle:
      'Starting solo but currently scouting or interviewing a technical, sales, or operational co-founder.',
    badge: 'Recruiting Co-Founder',
  },
  {
    value: 'OTHER',
    label: 'Other (Custom Team Structure)',
    subtitle:
      'University research spin-out, family business, fractional collective, or hybrid team arrangement.',
    badge: 'Custom Team',
  },
];

export const TEAM_MEMBER_CLASSIFICATION_OPTIONS: Array<{
  value: TeamMemberClassificationType;
  label: string;
}> = [
  { value: 'FOUNDER_PROMOTER', label: '👑 Founder / Co-Founder (Promoter)' },
  { value: 'KEY_TEAM_MEMBER', label: '⭐ Key Core Team Member (Employee)' },
  { value: 'FRACTIONAL_EXECUTIVE', label: '💼 Fractional Executive / Contractor' },
  { value: 'ADVISOR_BOARD', label: '🧭 Strategic Advisor / Board Mentor' },
  { value: 'OTHER', label: '✨ Other Role' },
];

export const TEAM_WEEKLY_COMMITMENT_OPTIONS: Array<{
  value: TeamWeeklyCommitmentType;
  label: string;
}> = [
  { value: 'FULL_TIME_40H_PLUS', label: 'Full-Time (40+ hrs/wk)' },
  { value: 'PART_TIME_20_TO_30H', label: 'Part-Time (20–30 hrs/wk)' },
  { value: 'EVENING_WEEKEND_10_TO_15H', label: 'Evenings & Weekends (10–15 hrs/wk)' },
  { value: 'FRACTIONAL_ADVISORY_2_TO_5H', label: 'Advisory (2–5 hrs/month)' },
  { value: 'OTHER', label: 'Other Commitment' },
];

function buildDefaultStep1DataForPlan(
  plan: ActiveStartupPlan,
  currentUserName?: string,
  currentUserEmail?: string
): PromoterProfilesStep1Data {
  const saved = plan.moduleFData?.promoterProfiles;
  if (saved && saved.teamMembers && saved.teamMembers.length > 0) {
    return {
      teamStructurePosture: saved.teamStructurePosture || 'SOLO_FOUNDER_CURRENT',
      otherTeamStructurePostureText: saved.otherTeamStructurePostureText || '',
      teamMembers: saved.teamMembers,
      executiveTeamCapabilityNarrative:
        saved.executiveTeamCapabilityNarrative || '',
      aiCoachTip: saved.aiCoachTip,
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  // Pre-seed with current logged in founder as Founder #1 (clean blank inputs)
  const founderName = currentUserName?.trim() || '';
  const founderEmail = currentUserEmail?.trim() || '';
  const stableFounderId = `member-${plan.id ? plan.id.replace(/-/g, '').slice(0, 8) : 'primary'}-1`;
  return {
    teamStructurePosture:
      plan.teamAndBudget?.teamStructureType === 'COFOUNDER_TEAM'
        ? 'CO_FOUNDING_DUO_OR_TRIO'
        : 'SOLO_FOUNDER_CURRENT',
    otherTeamStructurePostureText: '',
    teamMembers: [
      {
        id: stableFounderId,
        fullName: founderName,
        roleClassification: 'FOUNDER_PROMOTER',
        jobTitle: 'Founder & CEO',
        photoUrl: '',
        linkedInUrl: '',
        email: founderEmail,
        weeklyCommitment: 'FULL_TIME_40H_PLUS',
        relevantEducationAndDegrees: '',
        relevantTrainingCourses: '',
        priorIndustryExperienceYears: 0,
        keyPastCompaniesOrTrackRecord: '',
        compiled150WordNarrative: '',
        cvReadyForAppendixD: false,
        equitySharePercent: 100,
        isCurrentUserFounder: true,
      },
    ],
    executiveTeamCapabilityNarrative: '',
  };
}

export const STARTUP_HATS_CONFIG: Array<{
  key: StartupHatKey;
  label: string;
  shortTitle: string;
  emoji: string;
  description: string;
  whyItMatters: string;
  defaultWeeklyHours: number;
}> = [
  {
    key: 'VISION_FUNDRAISING',
    label: '1. Vision, Strategy & Fundraising (CEO)',
    shortTitle: 'Vision & Fundraising',
    emoji: '🧭',
    description:
      'Setting company direction, investor relations, board governance, and grant pitches.',
    whyItMatters:
      'Essential for Enterprise Ireland / LEO / Innovate UK pitching & investor syndicates.',
    defaultWeeklyHours: 12,
  },
  {
    key: 'PRODUCT_TECH_BUILD',
    label: '2. Product Architecture & Technical Build (CTO / Product Lead)',
    shortTitle: 'Product & Tech Build',
    emoji: '💻',
    description:
      'Architecture, software development, physical prototyping, and QA/release engineering.',
    whyItMatters:
      'Directly maps to Module D Work Packages and R&D feasibility requirements.',
    defaultWeeklyHours: 20,
  },
  {
    key: 'SALES_COMMERCIAL_BD',
    label: '3. Sales & Commercial Business Development (CRO / Sales Lead)',
    shortTitle: 'Sales & BD',
    emoji: '🤝',
    description:
      'Outbound sales, pilot customer acquisition, enterprise proposals, and pricing negotiation.',
    whyItMatters:
      'LEO and grant assessors ruthlessly evaluate who is physically closing paying customers.',
    defaultWeeklyHours: 15,
  },
  {
    key: 'MARKETING_GROWTH',
    label: '4. Marketing, Brand & Growth (CMO / Growth Lead)',
    shortTitle: 'Marketing & Growth',
    emoji: '📣',
    description:
      'Demand generation, content marketing, waitlist conversions, SEO, and paid ad channels.',
    whyItMatters:
      'Connects to Module C early waitlist leads and Module I customer acquisition funnels.',
    defaultWeeklyHours: 10,
  },
  {
    key: 'CUSTOMER_SUCCESS_SUPPORT',
    label: '5. Customer Support & Success',
    shortTitle: 'Customer Support',
    emoji: '🎧',
    description:
      'User onboarding, feedback loops, day-to-day customer support, ticket resolution, and retention.',
    whyItMatters:
      'Early stage churn kills unit economics; high-touch customer intimacy drives referral loops.',
    defaultWeeklyHours: 8,
  },
  {
    key: 'OPS_LEGAL_COMPLIANCE',
    label: '6. Operations, Legal & Regulatory Compliance (COO)',
    shortTitle: 'Ops, Legal & Compliance',
    emoji: '⚖️',
    description:
      'Vendor management, supply chain, contracts, GDPR/data protection, and insurance.',
    whyItMatters:
      'Covers statutory startup compliance, Module E Day in the Life, and risk mitigation.',
    defaultWeeklyHours: 8,
  },
  {
    key: 'FINANCE_CASHFLOW_GRANTS',
    label: '7. Finance, Bookkeeping & Grant Drawdowns (CFO)',
    shortTitle: 'Finance & Grants',
    emoji: '💶',
    description:
      'Cashflow runway monitoring, payroll, PRSI/NIC compliance, and grant claim submissions.',
    whyItMatters:
      'Ensures milestone claim drawdowns (e.g. LEO 50% drawdown, Innovate UK quarterly claims) are delivered on time.',
    defaultWeeklyHours: 7,
  },
];

function buildDefaultStep2DataForPlan(
  plan: ActiveStartupPlan,
  teamMembers: TeamMemberProfileItem[]
): RoleMatrixStep2Data {
  const saved = plan.moduleFData?.step2RoleMatrixData;
  if (saved && saved.hatAssignments && saved.hatAssignments.length > 0) {
    return {
      hatAssignments: saved.hatAssignments,
      advisors: saved.advisors || [],
      executiveDivisionSummary: saved.executiveDivisionSummary || '',
      aiCoachTip: saved.aiCoachTip,
      lastSavedAt: saved.lastSavedAt,
    };
  }

  // Pre-seed 7 hats with sensible defaults from current team members
  const founder1 = teamMembers[0]?.id || 'UNASSIGNED';
  const founder2 = teamMembers.length > 1 ? teamMembers[1].id : 'UNASSIGNED';

  const defaultAssignments: StartupHatAssignment[] = STARTUP_HATS_CONFIG.map(
    (hat) => {
      let primary = founder1;
      let backup = 'UNASSIGNED';
      let confidence: HatConfidenceLevel = 'HIGH_MASTERY';

      if (hat.key === 'PRODUCT_TECH_BUILD' && teamMembers.length > 1) {
        primary = founder2;
        backup = founder1;
      } else if (
        hat.key === 'OPS_LEGAL_COMPLIANCE' ||
        hat.key === 'FINANCE_CASHFLOW_GRANTS'
      ) {
        confidence = 'LEARNING_ON_THE_JOB';
        if (teamMembers.length > 1) backup = founder2;
      } else if (teamMembers.length > 1 && hat.key !== 'PRODUCT_TECH_BUILD') {
        backup = founder2;
      }

      return {
        hatKey: hat.key,
        title: hat.label,
        scopeSummary: hat.description,
        primaryOwnerMemberId: primary,
        backupOwnerMemberId: backup,
        weeklyHours: hat.defaultWeeklyHours,
        confidence,
        notes: '',
      };
    }
  );

  return {
    hatAssignments: defaultAssignments,
    advisors: [],
    executiveDivisionSummary: '',
  };
}

// ============================================================================
// STEP 3: SURVIVAL BUDGET PRESETS & DEFAULTS
// ============================================================================

export const SURVIVAL_BUDGET_PRESETS: Array<{
  id: SurvivalBudgetPresetType;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  defaults: {
    housingAndUtilities: number;
    groceriesAndEssentials: number;
    transportAndCommute: number;
    debtAndLoanCommitments: number;
    dependentsAndFamily: number;
    incomeOffsetCushion: number;
    personalSavingsBuffer: number;
  };
}> = [
  {
    id: 'LEAN_SOLO',
    label: 'Lean Solo Founder',
    emoji: '☕',
    tagline: 'Renting / Flatshare • Low Fixed Overhead',
    description: 'Stripped-back survival baseline. Minimal debt, shared flat rent, tight food budget.',
    defaults: {
      housingAndUtilities: 850,
      groceriesAndEssentials: 300,
      transportAndCommute: 120,
      debtAndLoanCommitments: 50,
      dependentsAndFamily: 0,
      incomeOffsetCushion: 0,
      personalSavingsBuffer: 8000,
    },
  },
  {
    id: 'SHARED_HOUSEHOLD',
    label: 'Shared / Dual-Income',
    emoji: '🏡',
    tagline: 'Partner Split • Moderate Buffer',
    description: 'Shared mortgage or apartment rent with partner contribution buffering household outgoings.',
    defaults: {
      housingAndUtilities: 1250,
      groceriesAndEssentials: 450,
      transportAndCommute: 180,
      debtAndLoanCommitments: 120,
      dependentsAndFamily: 50,
      incomeOffsetCushion: 400,
      personalSavingsBuffer: 15000,
    },
  },
  {
    id: 'FAMILY_MORTGAGE',
    label: 'Family & Dependents',
    emoji: '👨‍👩‍👧',
    tagline: 'Homeowner • Childcare & Fixed Commitments',
    description: 'Home mortgage, school/childcare costs, vehicle finance, and family living baseline.',
    defaults: {
      housingAndUtilities: 1850,
      groceriesAndEssentials: 650,
      transportAndCommute: 280,
      debtAndLoanCommitments: 250,
      dependentsAndFamily: 450,
      incomeOffsetCushion: 600,
      personalSavingsBuffer: 25000,
    },
  },
  {
    id: 'CUSTOM',
    label: 'Custom Baseline',
    emoji: '✏️',
    tagline: 'Start from Zero',
    description: 'Start with a clean slate of 0 for every category and enter your exact figures.',
    defaults: {
      housingAndUtilities: 0,
      groceriesAndEssentials: 0,
      transportAndCommute: 0,
      debtAndLoanCommitments: 0,
      dependentsAndFamily: 0,
      incomeOffsetCushion: 0,
      personalSavingsBuffer: 0,
    },
  },
];

export function buildDefaultStep3DataForPlan(
  plan: ActiveStartupPlan,
  teamMembers: TeamMemberProfileItem[]
): SurvivalBudgetStep3Data {
  const saved = plan.moduleFData?.step3SurvivalBudgetData;
  const currencyCode = plan.baseCurrency || 'EUR';

  // Find all founders/promoters, fallback to first member or user
  const founders = teamMembers.filter(
    (m) => m.roleClassification === 'FOUNDER_PROMOTER'
  );
  const targetMembers = founders.length > 0 ? founders : teamMembers.slice(0, 1);

  if (saved && saved.founderBudgets && saved.founderBudgets.length > 0) {
    const reconciledBudgets: FounderSurvivalBudgetItem[] = targetMembers.map(
      (m, idx) => {
        const exactMatch = saved.founderBudgets.find((b) => b.memberId === m.id);
        if (exactMatch) return exactMatch;
        const indexMatch = saved.founderBudgets[idx];
        if (
          indexMatch &&
          (targetMembers.length === 1 ||
            !targetMembers.some((t) => t.id === indexMatch.memberId))
        ) {
          return {
            ...indexMatch,
            memberId: m.id,
            memberName: m.fullName?.trim() || indexMatch.memberName,
          };
        }
        const preset =
          SURVIVAL_BUDGET_PRESETS[idx === 0 ? 0 : 1] ||
          SURVIVAL_BUDGET_PRESETS[0];
        return {
          memberId: m.id,
          memberName: m.fullName?.trim() || `Founder #${idx + 1}`,
          presetUsed: preset.id,
          housingAndUtilities: preset.defaults.housingAndUtilities,
          groceriesAndEssentials: preset.defaults.groceriesAndEssentials,
          transportAndCommute: preset.defaults.transportAndCommute,
          debtAndLoanCommitments: preset.defaults.debtAndLoanCommitments,
          dependentsAndFamily: preset.defaults.dependentsAndFamily,
          incomeOffsetCushion: preset.defaults.incomeOffsetCushion,
          personalSavingsBuffer: preset.defaults.personalSavingsBuffer,
          notes: '',
        };
      }
    );

    return {
      founderBudgets: reconciledBudgets,
      currencyCode: saved.currencyCode || currencyCode,
      aiCoachTip: saved.aiCoachTip,
      lastSavedAt: saved.lastSavedAt,
    };
  }

  const defaultBudgets: FounderSurvivalBudgetItem[] = targetMembers.map(
    (m, idx) => {
      const preset = SURVIVAL_BUDGET_PRESETS[idx === 0 ? 0 : 1] || SURVIVAL_BUDGET_PRESETS[0];
      return {
        memberId: m.id,
        memberName: m.fullName?.trim() || `Founder #${idx + 1}`,
        presetUsed: preset.id,
        housingAndUtilities: preset.defaults.housingAndUtilities,
        groceriesAndEssentials: preset.defaults.groceriesAndEssentials,
        transportAndCommute: preset.defaults.transportAndCommute,
        debtAndLoanCommitments: preset.defaults.debtAndLoanCommitments,
        dependentsAndFamily: preset.defaults.dependentsAndFamily,
        incomeOffsetCushion: preset.defaults.incomeOffsetCushion,
        personalSavingsBuffer: preset.defaults.personalSavingsBuffer,
        notes: '',
      };
    }
  );

  return {
    founderBudgets: defaultBudgets,
    currencyCode,
  };
}

export const AWKWARD_QUESTION_CATEGORIES: Array<{
  id: AwkwardQuestionCategory;
  num: number;
  label: string;
  shortLabel: string;
  emoji: string;
  desc: string;
}> = [
  {
    id: 'TIME_COMMITMENT',
    num: 1,
    label: '1. Time, Hustle & Life Priority',
    shortLabel: 'Time & Hustle',
    emoji: '⏱️',
    desc: 'Full-time resignation triggers, working hour expectations, moonlighting, and vacation policies.',
  },
  {
    id: 'MONEY_SALARIES',
    num: 2,
    label: '2. Money, Salaries & Personal Runway',
    shortLabel: 'Money & Salaries',
    emoji: '💶',
    desc: 'When salaries start, equal vs market compensation, personal cash injections, and loan guarantees.',
  },
  {
    id: 'ROLES_AUTHORITY',
    num: 3,
    label: '3. Roles, Authority & Deadlocks',
    shortLabel: 'Roles & Authority',
    emoji: '⚖️',
    desc: 'Final casting votes, CEO title representation, hiring autonomy, and underdelivery management.',
  },
  {
    id: 'EQUITY_VESTING',
    num: 4,
    label: '4. Equity, Vesting & Leavers',
    shortLabel: 'Equity & Vesting',
    emoji: '🍰',
    desc: 'Equity division, 4-year vesting with 1-year cliff, good vs bad leavers, and pre-existing IP ownership.',
  },
  {
    id: 'VISION_EXIT',
    num: 5,
    label: '5. Vision, Growth & Exit Appetite',
    shortLabel: 'Vision & Exit',
    emoji: '🚀',
    desc: 'Lifestyle profit vs VC scale, funding strategy, acquisition cashout thresholds, and quit triggers.',
  },
];

export interface AwkwardQuestionDef {
  key: AwkwardQuestionKey;
  number: number;
  category: AwkwardQuestionCategory;
  title: string;
  subtitle: string;
  contextWhy: string;
  hbsStat?: string;
  options: Array<{
    value: string;
    label: string;
    description: string;
    alignmentTag: 'FULL_TIME_COMMITTED' | 'BOOTSTRAP_LEAN' | 'AGGRESSIVE_SCALE' | 'BALANCED_MODERATE' | 'OTHER';
  }>;
}

export const AWKWARD_QUESTIONS_CONFIG: AwkwardQuestionDef[] = [
  // --------------------------------------------------------------------------
  // Category 1: Time, Hustle & Life Priority (Q1 - Q4)
  // --------------------------------------------------------------------------
  {
    key: 'Q1',
    number: 1,
    category: 'TIME_COMMITMENT',
    title: 'The Resignation Trigger (Going Full-Time)',
    subtitle: 'Under what exact milestone will each founder quit their current job / contract and jump in 100% full-time?',
    contextWhy: 'Asymmetry in leap dates is the #1 silent killer of early co-founder trust. One founder sacrifices security while the other stays on a salary.',
    hbsStat: '65% of startups fail due to co-founder conflict; asymmetric leap timing is the most cited resentment trigger.',
    options: [
      {
        value: 'IMMEDIATELY_DAY_ONE',
        label: 'Day One / Immediately',
        description: 'Already full-time or will resign as soon as company is registered and bank account open.',
        alignmentTag: 'FULL_TIME_COMMITTED',
      },
      {
        value: 'ON_FIRST_GRANT_OR_ROUND',
        label: 'Upon Securing First Funding / Grant',
        description: 'Will jump when first €25k–€100k (e.g. LEO Priming, SUL, Angel) lands in company bank account.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'ON_REVENUE_VALIDATION',
        label: 'Upon Revenue Validation Metric',
        description: 'Will jump once monthly company revenues reliably hit minimum survival floor (e.g. €3k–€5k/mo MRR).',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'ONE_FULL_TIME_ONE_PART_TIME',
        label: 'Permanent Asymmetric Split',
        description: 'One founder stays full-time while the other remains fractional/part-time long term with adjusted equity.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Milestone Trigger',
        description: 'Specify your own custom trigger (e.g. spouse sabbatical, visa approval, notice period).',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q2',
    number: 2,
    category: 'TIME_COMMITMENT',
    title: 'Working Hours & Weekend Hustle Expectations',
    subtitle: 'What is the realistic baseline weekly commitment expected from each founder during the initial 12 months?',
    contextWhy: 'Unspoken assumptions about what "hustle" means create toxic friction. Clarify if nights/weekends are an unspoken expectation or strictly boundary-protected.',
    options: [
      {
        value: 'INTENSE_HUSTLE_55_PLUS',
        label: 'All-In Sprint (55+ hrs/week + weekends as needed)',
        description: 'Startup is top life priority right now; expect evening responses and urgent weekend push.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'SUSTAINABLE_FULL_TIME_40_45',
        label: 'Focused Professional Pace (40–45 hrs/week)',
        description: 'Deep intensity during normal business hours, protect evenings and weekends for recovery and family.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'PART_TIME_MOONLIGHT_15_25',
        label: 'Structured Moonlighting (15–25 hrs/week)',
        description: 'Evenings and weekends alongside daytime employer until commercial traction warrants quitting.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'OUTPUT_BASED_FLEXIBLE',
        label: 'Strictly Output & Milestone Based',
        description: 'Zero tracking of hours or schedule; judged purely on weekly shipping and sales deliverables.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Commitment Schedule',
        description: 'Specify your own custom schedule or seasonal availability arrangement.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q3',
    number: 3,
    category: 'TIME_COMMITMENT',
    title: 'Outside Projects, Consulting & Moonlighting',
    subtitle: 'Are founders permitted to take paid freelance gigs, consulting advisory roles, or pursue side projects?',
    contextWhy: 'When cash gets tight, one founder often starts consulting "just 5 hours a week"—which rapidly balloons to 20 hours and diverts focus from the startup.',
    options: [
      {
        value: 'STRICT_EXCLUSIVITY',
        label: '100% Exclusivity (Zero Outside Work)',
        description: 'All commercial energy, code, and relationships belong strictly to this startup. No side gigs allowed.',
        alignmentTag: 'FULL_TIME_COMMITTED',
      },
      {
        value: 'PERMITTED_IF_SURVIVAL_CRITICAL',
        label: 'Permitted If Living Runway Threatens Survival',
        description: 'Max 1–2 days/month of consulting allowed if personal savings drop below 3 months living floor.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'ALLOWED_NON_COMPETING',
        label: 'Allowed If Entirely Non-Competing',
        description: 'Permitted as long as company IP is protected and core startup milestones are met on schedule.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'MUST_INVOICE_THROUGH_COMPANY',
        label: 'Allowed But Revenue Enters Company Coffer',
        description: 'Founder consulting invoices are paid to the startup company to extend collective corporate runway.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Exclusivity Arrangement',
        description: 'Specify your own custom side-project policy or intellectual property boundary.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q4',
    number: 4,
    category: 'TIME_COMMITMENT',
    title: 'Holiday, Vacation & Emergency Burnout Policy',
    subtitle: 'How much planned leave can founders take in Year 1, and what happens if someone faces personal burnout or family crises?',
    contextWhy: 'Early founders rarely take standard corporate holidays, but taking zero breaks guarantees burnout. Define clear expectations before tension arises.',
    options: [
      {
        value: 'MINIMAL_LEAN_10_DAYS',
        label: 'Minimal Lean Leave (Max 10 days in Year 1)',
        description: 'Sprint year: only essential public holidays and emergency leave until product is launched and stabilized.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'STANDARD_BALANCED_20_DAYS',
        label: 'Healthy Sustainable Leave (20 days statutory)',
        description: 'Founders must take standard annual leave to avoid cognitive fatigue and maintain strategic clarity.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'UNLIMITED_COORDINATED',
        label: 'Unlimited Leave with 3-Week Advance Notice',
        description: 'Take what you need, provided other co-founder is cross-trained to cover critical client/support ops.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'MANDATORY_OFFLINE_QUARTERLY_BREAKS',
        label: 'Mandatory 4-Day Disconnect Every Quarter',
        description: 'Scheduled quiet weeks after each major product sprint or investor filing to reset energy.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'OTHER',
        label: 'Other Vacation / Leave Policy',
        description: 'Specify your own custom arrangement (e.g. school holidays, seasonal business downtime).',
        alignmentTag: 'OTHER',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Category 2: Money, Salaries & Personal Runway (Q5 - Q8)
  // --------------------------------------------------------------------------
  {
    key: 'Q5',
    number: 5,
    category: 'MONEY_SALARIES',
    title: 'The First Salary Drawdown Milestone',
    subtitle: 'When does the startup officially begin paying founders a baseline monthly salary or director drawings?',
    contextWhy: 'One founder might assume nobody gets paid until Series A, while the other with mortgage and kids needs €2,500/mo by month four.',
    hbsStat: 'Differences in personal financial reserves are the #1 reason co-founders secretly accept corporate recruitment offers.',
    options: [
      {
        value: 'SWEAT_EQUITY_UNTIL_FUNDED',
        label: 'Zero Pay Until Significant Equity Round (€250k+)',
        description: 'Living purely off personal savings or grants; all capital stays in bank to hire and scale.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'SURVIVAL_FLOOR_FROM_FIRST_GRANT',
        label: 'Survival Floor Immediately from Grant / Seed',
        description: 'Draw essential survival budget (from Step 3) as soon as €50k+ grant or seed loan arrives.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'TIED_TO_NET_PROFIT',
        label: 'Tied Directly to Operating Cashflow / Profit',
        description: 'Pay founders 50% of monthly net cashflow once customer receipts exceed operating overheads.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'FIXED_DATE_DEADLINE',
        label: 'Hard Cutoff Date (e.g. Month 6 or 9)',
        description: 'Company must pay baseline salaries by a fixed date; if not profitable or funded, company pivots or winds down.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Salary Milestone',
        description: 'Specify your own custom salary drawdown threshold or graduated compensation plan.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q6',
    number: 6,
    category: 'MONEY_SALARIES',
    title: 'Equal Pay vs. Market / Need-Based Compensation',
    subtitle: 'Should all active full-time co-founders receive identical salaries, or should pay reflect market rates and family needs?',
    contextWhy: 'A 24-year-old solo founder and a 40-year-old parent with 3 kids have completely different living floors. Equal pay can mean starvation for one and luxury for the other.',
    options: [
      {
        value: 'STRICTLY_EQUAL_SALARIES',
        label: 'Strictly Equal Pay (Comrades in the Trenches)',
        description: 'Every full-time founder earns the exact same monthly paycheck regardless of role or background.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'SURVIVAL_BUDGET_NEED_BASED',
        label: 'Need-Based Floor (Step 3 Survival Budgets)',
        description: 'Pay each founder their specific Step 3 minimum living need until the company reaches full profitability.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'MARKET_RATE_DISCOUNTED',
        label: 'Market-Rate Based (e.g. 50% of Previous Market Salary)',
        description: 'Pay discounted market rates based on seniority (e.g. Lead Engineer vs Commercial Lead).',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'EQUAL_BASE_PLUS_EQUITY_OFFSET',
        label: 'Equal Base Pay + Equity Adjustment',
        description: 'Lower paid founder receives an extra equity allocation or deferred loan note to compensate.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Compensation Model',
        description: 'Specify your own custom formula (e.g. performance commissions, family healthcare top-ups).',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q7',
    number: 7,
    category: 'MONEY_SALARIES',
    title: 'Emergency Personal Cash Injections',
    subtitle: 'If the company faces an unexpected cash trough before a grant arrives, will founders inject personal savings?',
    contextWhy: 'Grant reimbursements in Ireland (LEO) and UK (Innovate UK) are paid in arrears. Who foots the bill when VAT or supplier payments come due?',
    options: [
      {
        value: 'EQUAL_PRO_RATA_CAPITAL_CALL',
        label: 'Matched 50/50 Personal Cash Injections',
        description: 'Both founders inject matching sums as formal Directors Loans with agreed repayment priority.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'STRICTLY_ZERO_PERSONAL_CAPITAL',
        label: 'Strictly No Additional Personal Money',
        description: 'No founder puts in extra personal cash beyond initial incorporation share capital. Cut costs instead.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'DILUTIVE_CAPITAL_INJECTION',
        label: 'Cash Contributor Earns Additional Equity / Safe Note',
        description: 'The founder who provides emergency capital receives extra equity or convertible debt notes.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'BRIDGE_LOAN_FROM_OUTSIDE_ONLY',
        label: 'Third-Party Bridge Only (Start Up Loan or Bank)',
        description: 'Apply for institutional micro-debt or commercial invoice discounting rather than personal funds.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Cash Emergency Strategy',
        description: 'Specify your own custom cash contingency policy or overdraft boundary.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q8',
    number: 8,
    category: 'MONEY_SALARIES',
    title: 'Personal Guarantees & Debt Exposure Appetite',
    subtitle: 'Are founders willing to sign Personal Guarantees (PGs) for government-backed loans, commercial leases, or overdrafts?',
    contextWhy: 'UK Start Up Loans and Irish bank facilities often require individual personal liability. If one founder refuses to sign, the loan application instantly collapses.',
    options: [
      {
        value: 'WILLING_JOINT_PERSONAL_GUARANTEES',
        label: 'Willing to Sign Joint Personal Guarantees (Up to €25k–€50k)',
        description: 'Prepared to put personal credit on the line for official state-backed programs (e.g. SUL, LEO microfinance).',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'STRICTLY_NON_RECOURSE_ONLY',
        label: 'Strictly Non-Recourse / Zero Personal Liability',
        description: 'Will only accept non-dilutive grants or equity where personal assets and homes are never exposed.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'LEGAL_ENTITY_LIMITED_LIABILITY_ONLY',
        label: 'Limited Liability Company Only',
        description: 'Company debt must remain walled off within the corporate entity; no personal indemnity under any circumstance.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'CASE_BY_CASE_WITH_LEGAL_REVIEW',
        label: 'Case-by-Case Approval with Independent Legal Advice',
        description: 'Require written sign-off from company solicitor and mutual consent before any director signs.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Debt & Guarantee Policy',
        description: 'Specify your personal risk tolerance and specific corporate credit limitations.',
        alignmentTag: 'OTHER',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Category 3: Roles, Authority & Deadlocks (Q9 - Q12)
  // --------------------------------------------------------------------------
  {
    key: 'Q9',
    number: 9,
    category: 'ROLES_AUTHORITY',
    title: 'The Final Tie-Breaker & Deadlock Mechanism',
    subtitle: 'When co-founders are split 50/50 on a critical strategy or hiring decision, who holds the ultimate casting vote?',
    contextWhy: 'A 50/50 deadlock without a pre-agreed mechanism will paralyze a company for weeks. Investors will not wire funds without a clear decision-maker.',
    hbsStat: '50/50 deadlocked boards are the leading cause of company dissolution in statutory filings across IE CRO and UK Companies House.',
    options: [
      {
        value: 'CEO_HAS_CASTING_VOTE',
        label: 'CEO Has Ultimate Casting Vote',
        description: 'After good-faith debate, CEO has executive authority to make the final call on all company disputes.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'DOMAIN_AUTONOMY',
        label: 'Domain-Specific Autonomy (Product vs Commercial)',
        description: 'Tech founder owns code/stack/architecture decisions; commercial founder owns pricing/sales/marketing.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'EXTERNAL_ADVISOR_TIEBREAKER',
        label: 'External Independent Advisor / Board Member',
        description: 'Refer unresolved 50/50 deadlocks to our trusted non-executive advisor (from Step 2) within 48 hours.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'MANDATORY_COOLDOWN_PLUS_MEDIATION',
        label: '48-Hour Cooldown + External Professional Mediation',
        description: 'Formal cooling-off period followed by third-party founder coach or mediator before any formal vote.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'OTHER',
        label: 'Other Deadlock Mechanism',
        description: 'Specify your own custom tie-breaking protocol (e.g. coin flip, rotating vote, board majority).',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q10',
    number: 10,
    category: 'ROLES_AUTHORITY',
    title: 'CEO Title & External Company Representation',
    subtitle: 'Who is the formal Chief Executive Officer, and who is the primary spokesperson facing investors, media, and grant boards?',
    contextWhy: 'Founders who both secretly want to be "CEO" build parallel silos and confuse grant panels. The CEO role is an operating job, not an ego badge.',
    options: [
      {
        value: 'AGREED_SINGLE_CEO',
        label: 'Agreed Single CEO with Full Board Backing',
        description: 'One founder is clearly identified as CEO; other founder is CTO/COO/CPDO with distinct executive leadership.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'CO_CEOS_TEMPORARY',
        label: 'Co-CEOs (Temporary Until First External Round)',
        description: 'Joint external representation during early validation; commit to formalizing a single CEO upon seed funding.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'CHAIR_AND_MANAGING_DIRECTOR',
        label: 'Executive Chair & Managing Director Split',
        description: 'One founder leads commercial operations (MD) while the other leads vision and governance (Executive Chair).',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'TITLE_FREE_UNTIL_LAUNCH',
        label: 'Flat "Co-Founder" Titles Until V1 Launch',
        description: 'Everyone uses simple "Co-Founder" titles externally until team expansion and external financing require hierarchy.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'OTHER',
        label: 'Other Title & Leadership Structure',
        description: 'Specify your own custom leadership hierarchy or future title transition plan.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q11',
    number: 11,
    category: 'ROLES_AUTHORITY',
    title: 'Hiring, Firing & Contractor Spending Autonomy',
    subtitle: 'What expenditure or hiring threshold requires mutual consent versus independent executive sign-off?',
    contextWhy: 'Can one founder unilaterally hire a €3k/month freelancer or purchase a €1,500 software subscription on the company debit card without asking?',
    options: [
      {
        value: 'SMALL_CAPEX_AUTONOMY_500',
        label: 'Autonomous Under €500 / Mutual Consent Above €500',
        description: 'Routine software and supplies don’t require debate; any commitment over €500 requires partner sign-off.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'HIGHER_CAPEX_AUTONOMY_2000',
        label: 'Autonomous Under €2,000 / Mutual Consent Above €2,000',
        description: 'Higher operating flexibility for rapid experimentation; mutual sign-off only for heavy agency/hire contracts.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'MUTUAL_CONSENT_FOR_ALL_EXPENSES',
        label: '100% Mutual Consent on Every Outgoing',
        description: 'During early bootstrap phase, every single company expenditure requires joint awareness and sign-off.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'BUDGETED_DEPARTMENTAL_BUCKETS',
        label: 'Pre-Approved Monthly Departmental Budgets',
        description: 'Agree on monthly marketing/dev budgets in advance; each founder has total autonomy within their agreed envelope.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Financial Spending Limit',
        description: 'Specify your own custom spending approval threshold and credit card protocol.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q12',
    number: 12,
    category: 'ROLES_AUTHORITY',
    title: 'Underperformance & Mutual Accountability',
    subtitle: 'What is the formal process if one founder consistently misses sprint deliverables, stops communicating, or loses motivation?',
    contextWhy: 'Nobody likes having the "you are not pulling your weight" conversation. Agreeing on the accountability protocol when everyone is happy makes it safe and objective.',
    options: [
      {
        value: 'STRUCTURED_30_DAY_PIP',
        label: 'Written 30-Day Performance Improvement Plan (PIP)',
        description: 'Explicit conversation outlining deliverables, 30 days to resolve, followed by formal mediation if unmet.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'BI_WEEKLY_RADICAL_CANDOR_RETROS',
        label: 'Bi-Weekly "Radical Candor" Founder Retrospectives',
        description: 'Scheduled every 14 days over coffee specifically to air grievances, workload imbalances, and frustrations.',
        alignmentTag: 'FULL_TIME_COMMITTED',
      },
      {
        value: 'AUTOMATIC_VESTING_PAUSE',
        label: 'Equity Vesting Pause & Role Downshift',
        description: 'If a founder must step back due to performance, their vesting pauses and they transition to advisor/minority status.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'INDEPENDENT_ADVISOR_REVIEW',
        label: 'Referral to Advisory Board for Objective Evaluation',
        description: 'External mentor interviews both founders and recommends binding workload or equity adjustments.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Accountability Protocol',
        description: 'Specify your own custom review and dispute management procedure.',
        alignmentTag: 'OTHER',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Category 4: Equity, Vesting & Leavers (Q13 - Q16)
  // --------------------------------------------------------------------------
  {
    key: 'Q13',
    number: 13,
    category: 'EQUITY_VESTING',
    title: 'Initial Equity Split Philosophy',
    subtitle: 'How is the shareholding split between founders (e.g. 50/50, 60/40, dynamic slicing pie) and what justifies the difference?',
    contextWhy: 'Defaulting to 50/50 without discussing past capital, IP contribution, or future commitment breeds silent resentment down the line.',
    hbsStat: 'Over 70% of co-founders split equity in under 1 hour; founders who spend over a week discussing equity report 2.5x higher company survival.',
    options: [
      {
        value: 'EQUAL_50_50_OR_THIRDS',
        label: 'Equal Split (50/50 or Equal Thirds)',
        description: 'Equal commitment, equal future sacrifice, equal long-term partnership mindset.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'LEAD_FOUNDER_MAJORITY_51_49',
        label: 'Slight Lead Majority (51/49 or 55/45)',
        description: 'Ensures corporate agility and a clear single-majority shareholder to satisfy grant and legal registrars.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'CONTRIBUTION_WEIGHTED',
        label: 'Contribution-Weighted (Idea + Pre-Existing IP + Capital)',
        description: 'Reflects months of unpaid pre-incorporation groundwork, codebases, or personal startup capital injected.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'DYNAMIC_SLICING_PIE',
        label: 'Dynamic Equity (Slicing Pie Model)',
        description: 'Shares adjust quarterly based on real hours worked, cash invested, and tangible milestone delivery.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'OTHER',
        label: 'Other Equity Division',
        description: 'Specify your own custom percentage breakdown or employee option pool carve-out (e.g. 10% ESOP).',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q14',
    number: 14,
    category: 'EQUITY_VESTING',
    title: 'Reverse Vesting Schedule & The 1-Year Cliff',
    subtitle: 'Do all founders agree to a standard 4-year reverse vesting schedule with a mandatory 1-year cliff?',
    contextWhy: 'If a co-founder leaves after 4 months with 50% of the company on the cap table forever, your startup is completely un-fundable and dead in the water.',
    options: [
      {
        value: 'STANDARD_4YR_1YR_CLIFF',
        label: 'Standard 4-Year Vesting with 1-Year Cliff (VC Standard)',
        description: '0% vests before Month 12; 25% vests at Month 12; remaining vests monthly (1/48th) over next 36 months.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'ACCELERATED_3YR_6MO_CLIFF',
        label: 'Accelerated 3-Year Vesting with 6-Month Cliff',
        description: 'Faster vesting schedule suited for experienced founders who have already validated the problem space.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'MILESTONE_BASED_VESTING',
        label: 'Milestone-Based Vesting (KPI & Revenue Triggers)',
        description: 'Equity vests in 4 equal tranches upon hitting real commercial milestones (Beta launch, €10k MRR, etc.).',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'RETROACTIVE_CREDIT_FOR_PAST_WORK',
        label: '4-Year Vesting with 12-Month Retroactive Credit',
        description: 'Recognizes prior 6–12 months of unpaid bootstrap work so founders start with 15–25% already vested.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Vesting Schedule',
        description: 'Specify your own custom vesting timeline, cliff length, or single/double trigger acceleration terms.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q15',
    number: 15,
    category: 'EQUITY_VESTING',
    title: 'Good Leaver vs. Bad Leaver Share Repurchase Terms',
    subtitle: 'If a founder quits or is dismissed, what happens to their unvested and vested shares?',
    contextWhy: 'Without clear Good/Bad Leaver definitions in your Shareholders Agreement, a departing founder can demand market value for dead equity and bankrupt the company.',
    options: [
      {
        value: 'STANDARD_LEAVER_STATUTORY',
        label: 'Standard: Unvested Forfeited at Nominal Value (€0.001)',
        description: 'Unvested shares returned to company at par value; Good Leaver retains vested shares; Bad Leaver forfeits all.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'MANDATORY_COMPANY_BUYBACK_RIGHT',
        label: 'Company Right of First Refusal Buyback',
        description: 'Company has the right to buy back even vested shares of departing founders at fair market valuation.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'CONVERT_TO_NON_VOTING_SHARES',
        label: 'Convert Departing Equity to Non-Voting Class B Shares',
        description: 'Leaver keeps economic profit rights on sale, but forfeits all board voting and corporate governance rights.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'FRIENDLY_TRANSITION_WINDOW',
        label: '90-Day Transition Window with Pro-Rata Acceleration',
        description: 'Allows an orderly 3-month transition with prorated vesting up to final working handover day.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'OTHER',
        label: 'Other Leaver Terms',
        description: 'Specify your own custom buy-back formula or non-compete settlement agreement terms.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q16',
    number: 16,
    category: 'EQUITY_VESTING',
    title: 'Pre-Existing Intellectual Property (IP) Assignment',
    subtitle: 'Are all domain names, pre-written code, Figma files, trade secrets, and customer lists formally assigned 100% to the limited company?',
    contextWhy: 'If pre-existing code was written on an employer laptop or registered in an individual founder’s personal name, investors and grant bodies will fail your IP audit.',
    options: [
      {
        value: 'FULL_ASSIGNMENT_DAY_ONE',
        label: '100% Unconditional IP Assignment to Company Day One',
        description: 'All past, current, and future project IP, domains, and trademarks transferred to the limited company.',
        alignmentTag: 'FULL_TIME_COMMITTED',
      },
      {
        value: 'ASSIGNMENT_CONTINGENT_ON_VESTING',
        label: 'Assignment Contingent on Initial Vesting Cliff',
        description: 'IP formally assigned to company, but reverts back if company dissolves or other founder quits in Year 1.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'EXCLUSIVE_COMMERCIAL_LICENSE',
        label: 'Exclusive Commercial License (Founder Retains Base IP)',
        description: 'Company receives perpetual exclusive license, while founder retains underlying foundational patent/source.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'UNIVERSITY_OR_EMPLOYER_CLEARANCE_REQUIRED',
        label: 'Requires Prior University Spin-Out / Employer Clearance',
        description: 'IP originated during prior employment or academia; requires formal institutional waiver letter.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other IP Assignment Protocol',
        description: 'Specify your own custom IP ownership arrangement or open-source carve-out.',
        alignmentTag: 'OTHER',
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Category 5: Vision, Growth & Exit Appetite (Q17 - Q20)
  // --------------------------------------------------------------------------
  {
    key: 'Q17',
    number: 17,
    category: 'VISION_EXIT',
    title: 'The Ultimate Exit Ambition (Lifestyle vs. Venture Scale)',
    subtitle: 'What is the dream destination: a highly profitable €1M–€3M/year dividend business, or a €50M+ venture acquisition / IPO?',
    contextWhy: 'Building a dividend cash cow and building a VC-backed unicorn are completely opposite games. Pursuing both at once destroys companies.',
    options: [
      {
        value: 'VENTURE_BACKED_HYPERGROWTH',
        label: 'Venture-Backed Hypergrowth (€20M–€100M+ Exit / IPO)',
        description: 'Aggressive growth, raise external VC rounds, sacrifice short-term profitability for massive market share.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'PROFITABLE_DIVIDEND_CASH_COW',
        label: 'Profitable Cash-Flow Machine (€1M–€5M ARR Dividends)',
        description: 'Prioritize strong pocket profit margins, founder salaries, and healthy work-life autonomy over hypergrowth.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'LEAN_BOOTSTRAP_TO_EARLY_ACQUISITION',
        label: 'Capital-Efficient Bootstrap to Strategic Buyout (€3M–€10M)',
        description: 'Bootstrap or grant-fund to profitability, then sell to strategic industry player within 4–6 years.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'MISSION_FIRST_LONG_TERM_IMPACT',
        label: 'Mission-Driven / Generational Institution',
        description: 'Solving the problem long-term; zero intention to flip or sell for quick financial payout.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Growth & Ambition Model',
        description: 'Specify your own custom scale target, holding company structure, or social enterprise model.',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q18',
    number: 18,
    category: 'VISION_EXIT',
    title: 'Funding Strategy Preference (Bootstrapping vs. Grants vs. Dilution)',
    subtitle: 'How should the company be funded over the next 18 months: revenue-first, non-dilutive state grants, or angel equity?',
    contextWhy: 'One founder might despise pitching angels, while the other wants to immediately fly to London or Dublin to raise a €500k seed round.',
    options: [
      {
        value: 'NON_DILUTIVE_GRANTS_AND_REVENUE',
        label: 'Non-Dilutive Grants + Customer Cashflow (Zero Early Dilution)',
        description: 'Maximize IE LEO (€50k+) / UK Innovate UK grants and customer prepayments before touching outside equity.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'ANGEL_AND_MICRO_SEED_EARLY',
        label: 'Angel & Micro-Seed Early (€100k–€250k on SAFE / ASA)',
        description: 'Raise quickly from experienced angels to accelerate engineering speed and beat competitors to market.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'GOVERNMENT_BACKED_LOANS_FIRST',
        label: 'Government-Backed Founder Loans (UK SUL / Microfinance IE)',
        description: 'Use low-interest unsecured founder debt to fund initial inventory/dev without giving away company shares.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'STRICT_CUSTOMER_REVENUE_BOOTSTRAP',
        label: 'Pure Customer Revenue Bootstrap (No Debt, No Investors)',
        description: 'Finance growth strictly from invoice cash collections and customer deposits.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'OTHER',
        label: 'Other Funding Strategy',
        description: 'Specify your own custom funding sequence (e.g. university proof-of-concept, family office).',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q19',
    number: 19,
    category: 'VISION_EXIT',
    title: 'The Acquisition Offer Threshold (When to Sell)',
    subtitle: 'If a competitor or industry giant offers €3M cash in Year 3, do you accept life-changing money or reject it to keep building?',
    contextWhy: 'A €3M exit means retirement or a mortgage-free life for one founder, while the other would be insulted and want to hold out for €50M.',
    options: [
      {
        value: 'ACCEPT_LIFE_CHANGING_EARLY',
        label: 'Accept Life-Changing Cash (€2M–€5M Net)',
        description: 'Take the money off the table, eliminate personal financial risk, and celebrate a successful exit.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'HOLD_FOR_VENTURE_SCALE',
        label: 'Reject Early Offers — Hold Out for €20M+ Scale',
        description: 'We are in this for the home run; reject sub-scale buyouts and double down on market leadership.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'MAJORITY_SHAREHOLDER_DECISION',
        label: 'Follow Board & Majority Shareholder Consensus',
        description: 'Let formal corporate governance and professional investor directors decide based on market timing.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OFFER_MUTUAL_SHOTGUN_BUYOUT',
        label: 'Shotgun / Texas Shootout Buyout Clause',
        description: 'If one wants to sell and one wants to keep going, the continuation founder buys out the seller at offer valuation.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'OTHER',
        label: 'Other Exit Threshold',
        description: 'Specify your personal acquisition criteria (e.g. employee retention guarantees, earnout structure).',
        alignmentTag: 'OTHER',
      },
    ],
  },
  {
    key: 'Q20',
    number: 20,
    category: 'VISION_EXIT',
    title: 'The "Quit Clause" & Ultimate Dealbreakers',
    subtitle: 'Under what specific conditions (lack of traction, personal ethics, financial deadline) will you mutually agree to pull the plug?',
    contextWhy: 'Zombie startups drag on for years because neither founder wants to admit defeat. Setting a predetermined shutdown or pivot threshold protects everyone’s life and sanity.',
    options: [
      {
        value: 'DATE_BASED_CUTOFF_12M',
        label: '12-Month Hard Traction Deadline',
        description: 'If we do not reach €5k/mo revenue or secure outside grant/funding by Month 12, we gracefully wind down.',
        alignmentTag: 'BALANCED_MODERATE',
      },
      {
        value: 'SAVINGS_FLOOR_TRIGGER',
        label: 'Personal Runway Floor (e.g. €5,000 Personal Buffer Remaining)',
        description: 'If either founder hits their personal financial survival floor, company must pivot or permit clean exit.',
        alignmentTag: 'BOOTSTRAP_LEAN',
      },
      {
        value: 'ETHICAL_AND_CULTURE_VIOLATION',
        label: 'Loss of Mutual Trust or Ethical Breach',
        description: 'If mutual transparency or core values are compromised, founders trigger an immediate separation agreement.',
        alignmentTag: 'FULL_TIME_COMMITTED',
      },
      {
        value: 'NEVER_QUIT_PIVOT_UNTIL_SUCCESS',
        label: 'Resilient Multi-Pivot Commitment',
        description: 'We will pivot the product concept as many times as necessary until product-market fit is achieved.',
        alignmentTag: 'AGGRESSIVE_SCALE',
      },
      {
        value: 'OTHER',
        label: 'Other Dealbreaker or Wind-Down Criterion',
        description: 'Specify your own custom quit criteria or business wind-down conditions.',
        alignmentTag: 'OTHER',
      },
    ],
  },
];

export function buildDefaultStep4DataForPlan(
  plan: ActiveStartupPlan,
  teamMembers: TeamMemberProfileItem[],
  currentUserName?: string
): CoFounderAlignmentStep4Data {
  const saved = plan.moduleFData?.step4AlignmentData;
  const founders = teamMembers.filter(
    (m) => m.roleClassification === 'FOUNDER_PROMOTER'
  );
  const targetMembers = founders.length > 0 ? founders : teamMembers.slice(0, 1);

  if (saved && saved.responses && saved.responses.length > 0) {
    // Reconcile saved responses with target members so answers are never lost or orphaned by ID mismatch
    const reconciledResponses: FounderAlignmentResponseItem[] = targetMembers.map(
      (m, idx) => {
        // 1. Direct match by memberId
        const exactMatch = saved.responses.find((r) => r.memberId === m.id);
        if (exactMatch) return exactMatch;

        // 2. Index match fallback (e.g. if member ID changed across sessions or was re-seeded)
        const indexMatch = saved.responses[idx];
        if (
          indexMatch &&
          (targetMembers.length === 1 ||
            !targetMembers.some((t) => t.id === indexMatch.memberId))
        ) {
          return {
            ...indexMatch,
            memberId: m.id,
            memberName:
              m.fullName?.trim() ||
              indexMatch.memberName ||
              currentUserName ||
              `Founder #${idx + 1}`,
          };
        }

        return {
          memberId: m.id,
          memberName:
            m.fullName?.trim() || currentUserName || `Founder #${idx + 1}`,
          answers: {},
        };
      }
    );

    // Also preserve any extra saved responses (e.g. from additional co-founders)
    const extraResponses = saved.responses.filter(
      (r) => !reconciledResponses.some((rec) => rec.memberId === r.memberId)
    );

    return {
      responses: [...reconciledResponses, ...extraResponses],
      isRevealed: Boolean(saved.isRevealed),
      notes: saved.notes || '',
      lastSavedAt: saved.lastSavedAt,
      aiCoachTip: saved.aiCoachTip,
    };
  }

  const initialResponses: FounderAlignmentResponseItem[] = targetMembers.map(
    (m, idx) => ({
      memberId: m.id,
      memberName: m.fullName?.trim() || currentUserName || `Founder #${idx + 1}`,
      answers: {},
    })
  );

  return {
    responses: initialResponses,
    isRevealed: false,
    notes: '',
  };
}

// ----------------------------------------------------------------------------
// Step 5 Presets & Helpers (3-Year Hiring Plan & Sweat Equity Architecture)
// ----------------------------------------------------------------------------

export const HIRING_POSTURE_OPTIONS: Array<{
  value: HiringPostureType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'CONTRACTOR_LEAN_FIRST',
    label: 'Contractor & Freelancer First (Lean & Variable)',
    subtitle:
      'Zero or low initial payroll commitments; leverage specialist contractors and agencies as revenue ramps.',
    badge: 'Lean & Variable',
  },
  {
    value: 'CORE_TECH_SWEAT_EQUITY',
    label: 'Core Team + Sweat Equity (Cash-Conserving V1)',
    subtitle:
      'Early technical / commercial builders working for equity or discounted cash until initial funding or traction.',
    badge: 'Sweat Equity V1',
  },
  {
    value: 'BALANCED_PAYE_HIRING',
    label: 'Balanced Direct PAYE Hiring (Standard Growth)',
    subtitle:
      'Direct salaried employment with statutory PRSI/NIC, workplace pension, and structured onboarding across 3 years.',
    badge: 'Balanced Growth',
  },
  {
    value: 'SALES_OPS_LED',
    label: 'Commercial & Operations-Led Team',
    subtitle:
      'Technical build contracted or founder-built; prioritizing SDRs, account executives, or physical operations.',
    badge: 'Commercial-Led',
  },
  {
    value: 'OTHER',
    label: 'Other Custom Hiring Strategy',
    subtitle: 'Specify your own hybrid team architecture, university spinout structure, or agency model.',
    badge: 'Custom Model',
  },
];

export const ROLE_DEPARTMENT_OPTIONS: Array<{
  value: RoleDepartmentType;
  label: string;
}> = [
  { value: 'ENGINEERING_PRODUCT', label: 'Engineering & Product' },
  { value: 'SALES_MARKETING', label: 'Sales & Growth Marketing' },
  { value: 'OPERATIONS_SUPPORT', label: 'Operations & Customer Support' },
  { value: 'LEADERSHIP_GA', label: 'Leadership & General Admin' },
  { value: 'OTHER', label: 'Other Department' },
];

export const COMPENSATION_MODEL_OPTIONS: Array<{
  value: CompensationModelType;
  label: string;
  description: string;
  badge: string;
}> = [
  {
    value: 'FULL_CASH',
    label: 'Standard Cash Salary (PAYE)',
    description: '100% market rate or agreed cash salary + statutory taxes. Full grant reimbursement eligible.',
    badge: '100% Cash',
  },
  {
    value: 'PURE_SWEAT_EQUITY',
    label: 'Pure Sweat Equity (0% Cash / Equity Only)',
    description: '€0 / £0 payroll cash burn. Early team earns equity/options vesting over time with milestones.',
    badge: '0% Cash / Sweat Equity',
  },
  {
    value: 'HYBRID_CASH_EQUITY',
    label: 'Hybrid: Discounted Cash + Equity Top-Up',
    description: 'Reduced cash salary to protect runway + share options grant bridging the gap to market value.',
    badge: 'Reduced Cash + Equity',
  },
  {
    value: 'ADVISORY_EQUITY',
    label: 'Advisory / Milestone Equity',
    description: 'Fractional share grant (0.25%–1.5%) for strategic guidance, governance, or technical oversight.',
    badge: 'Advisory Equity',
  },
];

export const QUICK_ADD_ROLE_TEMPLATES: Array<{
  title: string;
  department: RoleDepartmentType;
  employmentMode: EmploymentModeType;
  yearScheduled: 1 | 2 | 3;
  targetQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  compensationModel: CompensationModelType;
  grossSalaryEur: number;
  grossSalaryGbp: number;
  equityPercent: number;
  isGrantEligible: boolean;
  isRdEligible: boolean;
}> = [
  {
    title: 'Lead Full-Stack Developer',
    department: 'ENGINEERING_PRODUCT',
    employmentMode: 'FULL_TIME',
    yearScheduled: 1,
    targetQuarter: 'Q2',
    compensationModel: 'HYBRID_CASH_EQUITY',
    grossSalaryEur: 38000,
    grossSalaryGbp: 32000,
    equityPercent: 3.5,
    isGrantEligible: true,
    isRdEligible: true,
  },
  {
    title: 'Growth Marketer & Demand Gen',
    department: 'SALES_MARKETING',
    employmentMode: 'FULL_TIME',
    yearScheduled: 1,
    targetQuarter: 'Q3',
    compensationModel: 'FULL_CASH',
    grossSalaryEur: 32000,
    grossSalaryGbp: 28000,
    equityPercent: 1.0,
    isGrantEligible: true,
    isRdEligible: false,
  },
  {
    title: 'Senior Backend / AI Engineer',
    department: 'ENGINEERING_PRODUCT',
    employmentMode: 'FULL_TIME',
    yearScheduled: 2,
    targetQuarter: 'Q1',
    compensationModel: 'FULL_CASH',
    grossSalaryEur: 65000,
    grossSalaryGbp: 55000,
    equityPercent: 1.5,
    isGrantEligible: true,
    isRdEligible: true,
  },
  {
    title: 'Operations & Customer Success Lead',
    department: 'OPERATIONS_SUPPORT',
    employmentMode: 'FULL_TIME',
    yearScheduled: 2,
    targetQuarter: 'Q3',
    compensationModel: 'FULL_CASH',
    grossSalaryEur: 35000,
    grossSalaryGbp: 30000,
    equityPercent: 0.5,
    isGrantEligible: true,
    isRdEligible: false,
  },
  {
    title: 'Enterprise Account Executive (Sales)',
    department: 'SALES_MARKETING',
    employmentMode: 'FULL_TIME',
    yearScheduled: 3,
    targetQuarter: 'Q1',
    compensationModel: 'FULL_CASH',
    grossSalaryEur: 45000,
    grossSalaryGbp: 40000,
    equityPercent: 0.5,
    isGrantEligible: true,
    isRdEligible: false,
  },
];

export function buildDefaultStep5DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode,
  teamMembers?: TeamMemberProfileItem[]
): HiringPlanStep5Data {
  const saved = plan.moduleFData?.step5HiringPlanData;
  if (saved && Array.isArray(saved.roles)) {
    return {
      hiringPosture: saved.hiringPosture || 'CORE_TECH_SWEAT_EQUITY',
      otherHiringPostureText: saved.otherHiringPostureText || '',
      roles: saved.roles,
      contractorBudgetYear1: saved.contractorBudgetYear1 ?? 0,
      contractorBudgetYear2: saved.contractorBudgetYear2 ?? 0,
      contractorBudgetYear3: saved.contractorBudgetYear3 ?? 0,
      executiveHiringStrategyNarrative: saved.executiveHiringStrategyNarrative || '',
      lastSavedAt: saved.lastSavedAt,
      aiCoachTip: saved.aiCoachTip,
    };
  }

  // Bring in the actual existing team members from Step 1 into Year 1 with ZERO compensation pre-filled
  const actualTeamMembers = teamMembers || plan.moduleFData?.promoterProfiles?.teamMembers || [];

  const defaultRoles: PlannedRoleItem[] = actualTeamMembers.map((member, idx) => {
    // Map role classification to appropriate department
    let department: RoleDepartmentType = 'ENGINEERING_PRODUCT';
    const lowerRole = (member.jobTitle || '').toLowerCase();
    if (lowerRole.includes('sales') || lowerRole.includes('market') || lowerRole.includes('growth')) {
      department = 'SALES_MARKETING';
    } else if (lowerRole.includes('op') || lowerRole.includes('support') || lowerRole.includes('success')) {
      department = 'OPERATIONS_SUPPORT';
    } else if (lowerRole.includes('ceo') || lowerRole.includes('co-founder') || lowerRole.includes('founder') || lowerRole.includes('director')) {
      department = 'LEADERSHIP_GA';
    }

    const isPartTime =
      member.weeklyCommitment === 'PART_TIME_20_TO_30H' ||
      member.weeklyCommitment === 'EVENING_WEEKEND_10_TO_15H';
    const isContractor =
      member.roleClassification === 'ADVISOR_BOARD' ||
      member.roleClassification === 'FRACTIONAL_EXECUTIVE';

    return {
      id: `role_team_${member.id || idx}`,
      title: member.jobTitle?.trim()
        ? `${member.fullName ? `${member.fullName} — ` : ''}${member.jobTitle}`
        : member.fullName?.trim() || `Team Member #${idx + 1}`,
      department,
      employmentMode: isContractor ? 'CONTRACTOR_RETAINER' : isPartTime ? 'PART_TIME' : 'FULL_TIME',
      yearScheduled: 1,
      targetQuarter: 'Q1',
      compensationModel: 'FULL_CASH',
      // No compensation populated (starts at 0)
      grossAnnualSalary: 0,
      isGrantReimbursableEligible: member.roleClassification === 'FOUNDER_PROMOTER' || member.roleClassification === 'KEY_TEAM_MEMBER',
      isRdTaxCreditEligible: department === 'ENGINEERING_PRODUCT',
      equityGrantPercent: member.equitySharePercent || 0,
      vestingYears: 4,
      cliffMonths: 12,
      notes: `Imported from Step 1 Team Profiles (${member.fullName || 'Member'}). Set target salary or sweat equity mode.`,
    };
  });

  return {
    hiringPosture: 'CORE_TECH_SWEAT_EQUITY',
    otherHiringPostureText: '',
    roles: defaultRoles,
    contractorBudgetYear1: 0,
    contractorBudgetYear2: 0,
    contractorBudgetYear3: 0,
    executiveHiringStrategyNarrative: '',
  };
}

export const TEAM_BLIND_SPOT_CATEGORY_OPTIONS: Array<{
  value: TeamBlindSpotCategoryType;
  label: string;
}> = [
  {
    value: 'SINGLE_POINT_OF_FAILURE_OR_BURNOUT',
    label: 'Single-Point-of-Failure & Founder Burnout',
  },
  {
    value: 'EQUITY_VESTING_OR_DEAD_EQUITY_RISK',
    label: 'Equity Vesting, Cliff & Dead Equity Trap',
  },
  {
    value: 'SURVIVAL_RUNWAY_VS_GRANT_DRAWDOWN_GAP',
    label: 'Personal Runway vs. Grant Reimbursement Lag',
  },
  {
    value: 'DECISION_DEADLOCK_OR_GOVERNANCE_SPLIT',
    label: '50/50 Deadlock, Voting Rights & Dispute Resolution',
  },
  {
    value: 'PAYROLL_TAX_AND_EMPLOYMENT_LAW_COMPLIANCE',
    label: 'Payroll Tax (IE PRSI / UK NIC) & Statutory Filings',
  },
  {
    value: 'SWEAT_EQUITY_TAX_AND_IP_ASSIGNMENT',
    label: 'Sweat Equity Tax Valuation & Bilateral IP Assignment',
  },
  {
    value: 'OTHER',
    label: 'Other Custom Team & Governance Risk',
  },
];

export const TEAM_READINESS_CONFIDENCE_OPTIONS: Array<{
  value: TeamReadinessConfidenceType;
  label: string;
  subtitle: string;
  badge: string;
}> = [
  {
    value: 'READY_FOR_GRANT_AUDIT_AND_LEO_APP_D',
    label: 'Fully Aligned & Grant Audit-Ready',
    subtitle:
      'Promoter profiles ready for LEO Appendix D / Innovate UK Q8, hats allocated, runway confirmed, and 4-year vesting agreed.',
    badge: 'Audit Ready',
  },
  {
    value: 'NEEDS_COFOUNDER_ALIGNMENT_OR_VESTING_SIGN_OFF',
    label: 'Pending Vesting / Shareholders Agreement Sign-Off',
    subtitle:
      'Equity split agreed in principle but formal reverse-vesting schedule and IP assignment documents still awaiting legal execution.',
    badge: 'Legal Review',
  },
  {
    value: 'NEEDS_RUNWAY_EXTENSION_OR_SALARY_BRIDGE',
    label: 'Personal Runway Under 6 Months (Bridge Needed)',
    subtitle:
      'Founders need short-term personal runway bridge or part-time buffer before first grant reimbursement or sales revenue drawdowns clear.',
    badge: 'Runway Priority',
  },
  {
    value: 'NEEDS_KEY_HIRE_OR_ADVISORY_BOARD_APPOINTMENT',
    label: 'Recruiting Complementary Tech/Commercial Co-Founder or Advisor',
    subtitle:
      'Active functional gap currently being mitigated via fractional contractors while recruiting long-term co-founder.',
    badge: 'Recruiting',
  },
  {
    value: 'OTHER',
    label: 'Other Custom Team Posture',
    subtitle: 'Specify your bespoke team, governance, or hiring readiness status.',
    badge: 'Custom',
  },
];

export function buildDefaultStep6DataForPlan(
  plan: ActiveStartupPlan,
  selectedCountry: SupportedCountryCode
): TeamBlindSpotAuditBriefData {
  const saved = plan.moduleFData?.step6BlindSpotAuditData;
  if (saved && Array.isArray(saved.blindSpots) && saved.blindSpots.length > 0) {
    return {
      blindSpots: saved.blindSpots,
      readinessConfidence: saved.readinessConfidence || 'READY_FOR_GRANT_AUDIT_AND_LEO_APP_D',
      otherReadinessConfidenceText: saved.otherReadinessConfidenceText || '',
      executiveTeamCapabilityNarrative: saved.executiveTeamCapabilityNarrative || '',
      governanceAndVestingNarrative: saved.governanceAndVestingNarrative || '',
      talentRetentionAndHiringNarrative: saved.talentRetentionAndHiringNarrative || '',
      aiCoachTip: saved.aiCoachTip,
      lastSavedAt: saved.lastSavedAt,
      aiEngineUsed: saved.aiEngineUsed,
    };
  }

  const isGb = selectedCountry === 'GB';
  const defaultBlindSpots: TeamBlindSpotItem[] = [
    {
      id: 'tb-1-dead-equity',
      title: 'Absence of 4-Year Equity Vesting with a 1-Year Cliff',
      category: 'EQUITY_VESTING_OR_DEAD_EQUITY_RISK',
      severity: 'CRITICAL',
      whyItMatters:
        'If any co-founder or early equity contributor walks away within the first 12 months without reverse-vesting, they keep their full shareholding, creating "dead equity" that blocks venture capital and grant co-funding.',
      recommendedActionOrFix:
        'Implement standard 4-year reverse-vesting with a 1-year cliff and strict bad-leaver share repurchase clauses before issuing company shares.',
      isResolved: false,
    },
    {
      id: 'tb-2-key-person',
      title: 'Key-Person Single Point of Failure on Technical / Domain Delivery',
      category: 'SINGLE_POINT_OF_FAILURE_OR_BURNOUT',
      severity: 'CRITICAL',
      whyItMatters:
        'Solo founders or teams where 1 person holds 4+ core operational hats face severe execution drag, burnout, and acute diligence friction during LEO / Innovate UK panel reviews.',
      recommendedActionOrFix:
        'Formalize a 2-person Advisory Board and cross-train fractional contractors on deployment keys and customer relationships to ensure operational redundancy.',
      isResolved: false,
    },
    {
      id: 'tb-3-runway-lag',
      title: 'Personal Cash Runway vs. Retrospective Grant Payment Lag',
      category: 'SURVIVAL_RUNWAY_VS_GRANT_DRAWDOWN_GAP',
      severity: 'IMPORTANT',
      whyItMatters:
        'Irish LEO (Feasibility/Priming) and UK Innovate UK grants pay in arrears upon submission of paid invoices. Personal survival runway under 6 months triggers personal financial strain before grant claims clear.',
      recommendedActionOrFix:
        'Ring-fence a minimum 3-to-6 month personal survival cash reserve or secure a personal Start Up Loan bridge before committing full-time.',
      isResolved: false,
    },
    {
      id: 'tb-4-ip-assignment',
      title: 'Sweat Equity Tax Valuation & Unconditional IP Assignment',
      category: 'SWEAT_EQUITY_TAX_AND_IP_ASSIGNMENT',
      severity: 'IMPORTANT',
      whyItMatters:
        'Code and brand assets created prior to formal incorporation remain the personal property of individual founders until legally assigned via a written IP Transfer Deed.',
      recommendedActionOrFix:
        'Execute a bilateral Intellectual Property Assignment Deed and confirm Section 431 elections (UK) or nominal share value declarations upon incorporation.',
      isResolved: false,
    },
  ];

  return {
    blindSpots: defaultBlindSpots,
    readinessConfidence: 'READY_FOR_GRANT_AUDIT_AND_LEO_APP_D',
    otherReadinessConfidenceText: '',
    executiveTeamCapabilityNarrative: '',
    governanceAndVestingNarrative: '',
    talentRetentionAndHiringNarrative: '',
  };
}

export function ModuleFWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly,
  onSaveStep1PromoterProfiles,
  onSaveStep2RoleMatrix,
  onSaveStep3SurvivalBudget,
  onSaveStep4Alignment,
  onSaveStep5HiringPlan,
  onSaveBriefOverview,
  userId,
  userName,
  userEmail,
  onParkOpenQuestion,
  onBackToModuleE,
  onContinueToModuleG,
}: ModuleFWorkspaceProps) {
  const [openStep, setOpenStep] = useState<number | 'ALL'>(1);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Micro-coaching popovers
  const [activeWhyCard, setActiveWhyCard] = useState<number | null>(null);
  const [activeExampleCard, setActiveExampleCard] = useState<number | null>(null);

  // Step 1 State
  const [step1Data, setStep1Data] = useState<PromoterProfilesStep1Data>(() =>
    buildDefaultStep1DataForPlan(plan, userName, userEmail)
  );
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isParsingCv, setIsParsingCv] = useState<Record<string, boolean>>({});
  // Track collapsed/expanded team members in Step 1 (default: all collapsed on initial load for a clean, tidy view)
  const [openMemberIds, setOpenMemberIds] = useState<Record<string, boolean>>({});

  // Step 2 State
  const [step2Data, setStep2Data] = useState<RoleMatrixStep2Data>(() =>
    buildDefaultStep2DataForPlan(plan, step1Data.teamMembers)
  );
  const [isSavingStep2, setIsSavingStep2] = useState(false);
  const [isDraftingStep2Ai, setIsDraftingStep2Ai] = useState(false);
  // Track collapsed/expanded advisors in Step 2 (default: all collapsed on initial load for a clean, tidy view)
  const [openAdvisorIds, setOpenAdvisorIds] = useState<Record<string, boolean>>({});

  // Step 3 State (Founder Personal Survival Budget & Runway)
  const [step3Data, setStep3Data] = useState<SurvivalBudgetStep3Data>(() =>
    buildDefaultStep3DataForPlan(plan, step1Data.teamMembers)
  );
  const [isSavingStep3, setIsSavingStep3] = useState(false);
  const [activeFounderBudgetId, setActiveFounderBudgetId] = useState<string>(
    () => {
      const initial = buildDefaultStep3DataForPlan(plan, step1Data.teamMembers);
      return initial.founderBudgets[0]?.memberId || '';
    }
  );

  // Step 4 State (20 Awkward Co-Founder Questions & The Founder Prenup Engine)
  const [step4Data, setStep4Data] = useState<CoFounderAlignmentStep4Data>(() =>
    buildDefaultStep4DataForPlan(plan, step1Data.teamMembers, userName)
  );
  const step4DataRef = useRef<CoFounderAlignmentStep4Data>(step4Data);
  useEffect(() => {
    step4DataRef.current = step4Data;
  }, [step4Data]);

  // Synchronize Step 4 data if incoming plan data updates (e.g. cloud hydration after mount)
  useEffect(() => {
    const cloudStep4 = plan.moduleFData?.step4AlignmentData;
    if (cloudStep4 && cloudStep4.responses && cloudStep4.responses.length > 0) {
      setStep4Data((prev) => {
        const prevAnsweredCount = prev.responses.reduce(
          (acc, r) => acc + Object.keys(r.answers || {}).length,
          0
        );
        const cloudAnsweredCount = cloudStep4.responses.reduce(
          (acc, r) => acc + Object.keys(r.answers || {}).length,
          0
        );
        if (
          cloudAnsweredCount >= prevAnsweredCount ||
          !prev.lastSavedAt ||
          (cloudStep4.lastSavedAt && cloudStep4.lastSavedAt > prev.lastSavedAt)
        ) {
          const reconciled = buildDefaultStep4DataForPlan(
            plan,
            step1Data.teamMembers,
            userName
          );
          step4DataRef.current = reconciled;
          return reconciled;
        }
        return prev;
      });
    }
  }, [plan.id, plan.moduleFData?.step4AlignmentData, userName, step1Data.teamMembers]);

  // Keep custom other text inputs in sync with step4Data
  useEffect(() => {
    setCustomOtherInputs((prev) => {
      let changed = false;
      const nextMap = { ...prev };
      step4Data.responses.forEach((resp) => {
        Object.entries(resp.answers || {}).forEach(([qKey, ans]) => {
          if (ans.otherText && nextMap[`${resp.memberId}_${qKey}`] !== ans.otherText) {
            nextMap[`${resp.memberId}_${qKey}`] = ans.otherText;
            changed = true;
          }
        });
      });
      return changed ? nextMap : prev;
    });
  }, [step4Data]);

  const [isSavingStep4, setIsSavingStep4] = useState(false);
  const [activeQuestionCategory, setActiveQuestionCategory] =
    useState<AwkwardQuestionCategory>('TIME_COMMITMENT');
  const [activeFounderAlignmentId, setActiveFounderAlignmentId] =
    useState<string>(() => {
      const initial = buildDefaultStep4DataForPlan(
        plan,
        step1Data.teamMembers,
        userName
      );
      return initial.responses[0]?.memberId || '';
    });
  const [customOtherInputs, setCustomOtherInputs] = useState<
    Record<string, string>
  >(() => {
    const map: Record<string, string> = {};
    const initial = buildDefaultStep4DataForPlan(
      plan,
      step1Data.teamMembers,
      userName
    );
    initial.responses.forEach((resp) => {
      Object.entries(resp.answers || {}).forEach(([qKey, ans]) => {
        if (ans.otherText) {
          map[`${resp.memberId}_${qKey}`] = ans.otherText;
        }
      });
    });
    return map;
  });

  // Step 5 State (3-Year Hiring Plan, Headcount Roadmap & Sweat Equity Architecture)
  const [step5Data, setStep5Data] = useState<HiringPlanStep5Data>(() =>
    buildDefaultStep5DataForPlan(plan, selectedCountry, step1Data.teamMembers)
  );
  const [isSavingStep5, setIsSavingStep5] = useState(false);
  const [activeYearTab, setActiveYearTab] = useState<1 | 2 | 3>(1);
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);
  const [customHiringPostureText, setCustomHiringPostureText] = useState<string>(
    () => {
      const initial = buildDefaultStep5DataForPlan(plan, selectedCountry, step1Data.teamMembers);
      return initial.otherHiringPostureText || '';
    }
  );
  const [isDraftingHiringAi, setIsDraftingHiringAi] = useState(false);

  // Overview / Brief State (Step 6 / Final Module Brief)
  const [step6Data, setStep6Data] = useState<TeamBlindSpotAuditBriefData>(() =>
    buildDefaultStep6DataForPlan(plan, selectedCountry)
  );
  const [isSavingStep6, setIsSavingStep6] = useState(false);
  const [isDraftingAuditAi, setIsDraftingAuditAi] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Synchronize Step 6 data if incoming plan data updates (e.g. cloud hydration)
  useEffect(() => {
    const cloudStep6 = plan.moduleFData?.step6BlindSpotAuditData;
    if (cloudStep6 && cloudStep6.blindSpots && cloudStep6.blindSpots.length > 0) {
      setStep6Data((prev) => {
        if (!prev.lastSavedAt || (cloudStep6.lastSavedAt && cloudStep6.lastSavedAt > prev.lastSavedAt)) {
          return buildDefaultStep6DataForPlan(plan, selectedCountry);
        }
        return prev;
      });
    }
  }, [plan.id, plan.moduleFData?.step6BlindSpotAuditData, selectedCountry]);

  function toggleAdvisorCollapse(advisorId: string) {
    setOpenAdvisorIds((prev) => ({
      ...prev,
      [advisorId]: !prev[advisorId],
    }));
  }

  function toggleAllAdvisors(expand: boolean) {
    const next: Record<string, boolean> = {};
    step2Data.advisors.forEach((a) => {
      next[a.id] = expand;
    });
    setOpenAdvisorIds(next);
  }

  function toggleMemberCollapse(memberId: string) {
    setOpenMemberIds((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  }

  function toggleAllMembers(expand: boolean) {
    const next: Record<string, boolean> = {};
    step1Data.teamMembers.forEach((m) => {
      next[m.id] = expand;
    });
    setOpenMemberIds(next);
  }

  // Calculate completeness
  const step1Complete =
    Boolean(step1Data.teamStructurePosture) &&
    step1Data.teamMembers.length >= 1 &&
    step1Data.teamMembers.every(
      (m) =>
        m.fullName.trim().length > 0 &&
        m.jobTitle.trim().length > 0 &&
        (m.roleClassification !== 'FOUNDER_PROMOTER' ||
          (m.compiled150WordNarrative.trim().split(/\s+/).length >= 80))
    );

  const step2AssignedHatsCount = step2Data.hatAssignments.filter(
    (h) => h.primaryOwnerMemberId && h.primaryOwnerMemberId !== 'UNASSIGNED'
  ).length;

  const step2SummaryWordCount = step2Data.executiveDivisionSummary
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const step2Complete =
    step2AssignedHatsCount === 7 && step2SummaryWordCount >= 30;

  const step3Complete =
    step3Data.founderBudgets.length > 0 &&
    step3Data.founderBudgets.every(
      (b) =>
        b.housingAndUtilities +
          b.groceriesAndEssentials +
          b.transportAndCommute >
        0
    );

  const totalTeamMonthlyDrawingsNeed = step3Data.founderBudgets.reduce(
    (acc, b) => {
      const grossOutgoings =
        (b.housingAndUtilities || 0) +
        (b.groceriesAndEssentials || 0) +
        (b.transportAndCommute || 0) +
        (b.debtAndLoanCommitments || 0) +
        (b.dependentsAndFamily || 0);
      const netSurvivalNeed = Math.max(
        0,
        grossOutgoings - (b.incomeOffsetCushion || 0)
      );
      return acc + netSurvivalNeed;
    },
    0
  );

  const isSoloFounderMode =
    step1Data.teamStructurePosture === 'SOLO_FOUNDER_CURRENT' ||
    step1Data.teamMembers.filter(
      (m) => m.roleClassification === 'FOUNDER_PROMOTER'
    ).length <= 1;

  // Step 4 Answer counts & completeness
  const activeFounderResponse =
    step4Data.responses.find((r) => r.memberId === activeFounderAlignmentId) ||
    step4Data.responses[0];

  const answeredQuestionsCountForActiveFounder = activeFounderResponse
    ? Object.keys(activeFounderResponse.answers || {}).length
    : 0;

  const totalQuestionsCount = AWKWARD_QUESTIONS_CONFIG.length; // 20

  const step4Complete =
    step4Data.responses.length > 0 &&
    (isSoloFounderMode
      ? answeredQuestionsCountForActiveFounder >= 12
      : step4Data.responses.some(
          (r) => Object.keys(r.answers || {}).length >= 12
        ));

  // Step 5 Calculations & Completeness
  const isGb = selectedCountry === 'GB';
  const employerTaxRate = isGb ? 0.138 : 0.1115; // 13.8% UK NIC vs 11.15% IE Class A PRSI
  const employerPensionRate = isGb ? 0.03 : 0.0; // 3% UK auto-enrolment workplace pension

  // Cumulative Flow-Through:
  // Year 1 includes roles added in Year 1.
  // Year 2 includes roles active in Year 1 + new roles added in Year 2.
  // Year 3 includes roles active in Years 1 & 2 + new roles added in Year 3.
  const step5RolesYear1 = step5Data.roles.filter((r) => r.yearScheduled <= 1);
  const step5RolesYear2 = step5Data.roles.filter((r) => r.yearScheduled <= 2);
  const step5RolesYear3 = step5Data.roles.filter((r) => r.yearScheduled <= 3);

  // Active roles displayed in the current tab
  const activeTabRoles =
    activeYearTab === 1
      ? step5RolesYear1
      : activeYearTab === 2
      ? step5RolesYear2
      : step5RolesYear3;

  function calculateFteForRoles(roles: PlannedRoleItem[]): number {
    return roles.reduce((sum, r) => {
      if (r.employmentMode === 'FULL_TIME') return sum + 1.0;
      if (r.employmentMode === 'PART_TIME') return sum + 0.5;
      return sum; // Contractor retainer = 0.0 FTE
    }, 0);
  }

  function calculateYearFinancials(roles: PlannedRoleItem[], contractorBudget: number) {
    const grossWages = roles.reduce((sum, r) => {
      if (r.compensationModel === 'PURE_SWEAT_EQUITY') return sum;
      return sum + (Number(r.grossAnnualSalary) || 0);
    }, 0);

    const employerTaxes = roles.reduce((sum, r) => {
      if (r.compensationModel === 'PURE_SWEAT_EQUITY') return sum;
      const salary = Number(r.grossAnnualSalary) || 0;
      const tax = salary * employerTaxRate;
      const pension = salary * employerPensionRate;
      return sum + tax + pension;
    }, 0);

    const fullyLoadedPayroll = grossWages + employerTaxes;
    const totalCashBurn = fullyLoadedPayroll + (Number(contractorBudget) || 0);

    const totalEquityPoolPledged = roles.reduce(
      (sum, r) => sum + (Number(r.equityGrantPercent) || 0),
      0
    );

    // Potential grant subsidy estimate:
    // IE LEO Priming: up to 50% of new direct employee salary capped at €10,000 per employee
    // UK Innovate UK: typically 70% direct labour on eligible R&D work packages
    const eligibleGrantRoles = roles.filter(
      (r) => r.isGrantReimbursableEligible && r.compensationModel !== 'PURE_SWEAT_EQUITY'
    );
    const estimatedGrantSubsidy = isGb
      ? eligibleGrantRoles.reduce(
          (sum, r) => sum + Math.round((Number(r.grossAnnualSalary) || 0) * 0.5),
          0
        )
      : eligibleGrantRoles.reduce(
          (sum, r) =>
            sum + Math.min(10000, Math.round((Number(r.grossAnnualSalary) || 0) * 0.5)),
          0
        );

    // R&D Tax Credit payroll offset estimate (IE 30%, UK 20% SME RDEC/ERIS)
    const eligibleRdRoles = roles.filter(
      (r) => r.isRdTaxCreditEligible && r.compensationModel !== 'PURE_SWEAT_EQUITY'
    );
    const estimatedRdOffset = eligibleRdRoles.reduce((sum, r) => {
      const salary = Number(r.grossAnnualSalary) || 0;
      return sum + Math.round(salary * (isGb ? 0.2 : 0.3));
    }, 0);

    return {
      grossWages,
      employerTaxes,
      fullyLoadedPayroll,
      totalCashBurn,
      totalEquityPoolPledged,
      estimatedGrantSubsidy,
      estimatedRdOffset,
    };
  }

  const y1Stats = calculateYearFinancials(step5RolesYear1, step5Data.contractorBudgetYear1);
  const y2Stats = calculateYearFinancials(step5RolesYear2, step5Data.contractorBudgetYear2);
  const y3Stats = calculateYearFinancials(step5RolesYear3, step5Data.contractorBudgetYear3);

  const step5Complete =
    Boolean(step5Data.hiringPosture) &&
    step5Data.roles.length >= 1 &&
    step5Data.roles.every((r) => r.title.trim().length > 0);

  const moduleFReadinessSteps = [
    {
      stepNum: 1,
      title: 'Promoter & Team Profiles',
      isComplete: step1Complete,
      summary: `${step1Data.teamMembers.length} team member${
        step1Data.teamMembers.length === 1 ? '' : 's'
      } logged (${step1Data.teamMembers.filter((m) => m.roleClassification === 'FOUNDER_PROMOTER').length} Founder, ${step1Data.teamMembers.filter((m) => m.roleClassification !== 'FOUNDER_PROMOTER').length} Key Team/Advisor)`,
    },
    {
      stepNum: 2,
      title: '7 Startup Hats Matrix',
      isComplete: step2Complete,
      summary: step2Complete
        ? `All 7 Hats assigned (${step2Data.advisors.length} Advisor${step2Data.advisors.length === 1 ? '' : 's'}) • Executive division ready`
        : `${step2AssignedHatsCount}/7 Hats assigned • Map single-point accountability`,
    },
    {
      stepNum: 3,
      title: 'Survival Budget & Runway',
      isComplete: step3Complete,
      summary: step3Complete
        ? `Survival floor: ${formatPlanCurrency(
            totalTeamMonthlyDrawingsNeed,
            step3Data.currencyCode
          )}/mo total drawings needed across ${
            step3Data.founderBudgets.length
          } founder${step3Data.founderBudgets.length === 1 ? '' : 's'}`
        : '6-line personal living budget & minimum monthly drawings',
    },
    {
      stepNum: 4,
      title: '20 Awkward Co-Founder Questions',
      isComplete: step4Complete,
      summary: isSoloFounderMode
        ? `${answeredQuestionsCountForActiveFounder}/20 Hard Questions Answered (Founder Charter Ready)`
        : `${step4Data.responses.length} Founders • ${
            step4Data.isRevealed ? 'Heatmap Revealed' : 'Blind-Reveal Mode'
          }`,
    },
    {
      stepNum: 5,
      title: '3-Year Hiring Plan',
      isComplete: step5Complete,
      summary: step5Complete
        ? `Y1–Y3: ${calculateFteForRoles(step5RolesYear1)} → ${calculateFteForRoles(
            step5RolesYear3
          )} FTEs • ${step5Data.roles.length} roles scheduled with sweat equity & taxes`
        : 'Headcount roadmap & Employer PRSI/NIC preview',
    },
    {
      stepNum: 6,
      title: 'Team, Governance & Hiring Brief',
      isComplete:
        step6Data.executiveTeamCapabilityNarrative.trim().length > 30 ||
        Boolean(step6Data.readinessConfidence),
      summary: 'Module F Executive Brief, Blind-Spot Audit & Grant Dossier',
    },
  ];

  const completedModuleFCoreStepsCount = moduleFReadinessSteps
    .slice(0, 5)
    .filter((s) => s.isComplete).length;
  const totalModuleFProgress = Math.round(
    (completedModuleFCoreStepsCount / 5) * 100
  );

  // Step 2 Handlers
  async function handleSaveStep2() {
    if (isVaultReadonly) return;
    try {
      setIsSavingStep2(true);
      if (onSaveStep2RoleMatrix) {
        await onSaveStep2RoleMatrix(step2Data, step2Complete ? 40 : 25);
      }
      setSaveBanner(
        '✅ Saved Module F Step 2 ("7 Startup Hats" Matrix & Strategic Advisory Schedule)!'
      );
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setIsSavingStep2(false);
    }
  }

  function handleUpdateHatAssignment(
    hatKey: StartupHatKey,
    updates: Partial<StartupHatAssignment>
  ) {
    if (isVaultReadonly) return;
    setStep2Data((prev) => ({
      ...prev,
      hatAssignments: prev.hatAssignments.map((h) =>
        h.hatKey === hatKey ? { ...h, ...updates } : h
      ),
    }));
  }

  function handleAddAdvisor() {
    if (isVaultReadonly) return;
    const newAdvisor: ExternalAdvisorItem = {
      id: `advisor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      roleOrSpecialty: '',
      organizationOrAffiliation: '',
      cadence: 'MONTHLY',
      notes: '',
    };
    setStep2Data((prev) => ({
      ...prev,
      advisors: [...prev.advisors, newAdvisor],
    }));
    // Auto-expand the newly added advisor
    setOpenAdvisorIds((prev) => ({
      ...prev,
      [newAdvisor.id]: true,
    }));
  }

  function handleRemoveAdvisor(id: string) {
    if (isVaultReadonly) return;
    setStep2Data((prev) => ({
      ...prev,
      advisors: prev.advisors.filter((a) => a.id !== id),
    }));
    setOpenAdvisorIds((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function handleUpdateAdvisor(
    id: string,
    updates: Partial<ExternalAdvisorItem>
  ) {
    if (isVaultReadonly) return;
    setStep2Data((prev) => ({
      ...prev,
      advisors: prev.advisors.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }

  async function handleAiDraftRoleMatrixSummary() {
    if (isVaultReadonly) return;
    try {
      setIsDraftingStep2Ai(true);
      const result = await generateRoleMatrixSummaryAction({
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        teamMembers: step1Data.teamMembers.map((m) => ({
          id: m.id,
          fullName: m.fullName?.trim() || 'Team Member',
          jobTitle: m.jobTitle?.trim() || 'Founder',
        })),
        hatAssignments: step2Data.hatAssignments.map((h) => ({
          hatKey: h.hatKey,
          title: h.title,
          primaryOwnerMemberId: h.primaryOwnerMemberId,
          backupOwnerMemberId: h.backupOwnerMemberId,
          weeklyHours: h.weeklyHours,
          confidence: h.confidence,
          notes: h.notes,
        })),
        advisors: step2Data.advisors.map((a) => ({
          name: a.name,
          roleOrSpecialty: a.roleOrSpecialty,
          organizationOrAffiliation: a.organizationOrAffiliation,
          cadence: a.cadence,
        })),
      });

      if (result && result.executiveDivisionSummary) {
        setStep2Data((prev) => ({
          ...prev,
          executiveDivisionSummary: result.executiveDivisionSummary,
          aiCoachTip:
            result.aiCoachTip ||
            (result.workloadAnalysis?.governanceStrengths &&
            result.workloadAnalysis.governanceStrengths.length > 0
              ? `Strengths: ${result.workloadAnalysis.governanceStrengths.join(', ')}`
              : undefined),
        }));
        setSaveBanner(
          '✨ Generated AI Executive Division of Responsibilities narrative!'
        );
        setTimeout(() => setSaveBanner(null), 5000);
      }
    } catch (err) {
      console.error('Failed to generate role matrix summary', err);
    } finally {
      setIsDraftingStep2Ai(false);
    }
  }

  // Step 3 Handlers (Founder Personal Survival Budget & Runway)
  async function handleSaveStep3() {
    if (isVaultReadonly) return;
    try {
      setIsSavingStep3(true);
      if (onSaveStep3SurvivalBudget) {
        await onSaveStep3SurvivalBudget(step3Data, step3Complete ? 60 : 45);
      }
      setSaveBanner(
        '✅ Saved Module F Step 3 (Personal Survival Budget & Living Runway Analysis)!'
      );
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setIsSavingStep3(false);
    }
  }

  function handleUpdateFounderBudget(
    memberId: string,
    updates: Partial<FounderSurvivalBudgetItem>
  ) {
    if (isVaultReadonly) return;
    setStep3Data((prev) => ({
      ...prev,
      founderBudgets: prev.founderBudgets.map((b) =>
        b.memberId === memberId ? { ...b, ...updates } : b
      ),
    }));
  }

  function handleApplyBudgetPreset(
    memberId: string,
    presetId: SurvivalBudgetPresetType
  ) {
    if (isVaultReadonly) return;
    const preset = SURVIVAL_BUDGET_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    handleUpdateFounderBudget(memberId, {
      presetUsed: presetId,
      housingAndUtilities: preset.defaults.housingAndUtilities,
      groceriesAndEssentials: preset.defaults.groceriesAndEssentials,
      transportAndCommute: preset.defaults.transportAndCommute,
      debtAndLoanCommitments: preset.defaults.debtAndLoanCommitments,
      dependentsAndFamily: preset.defaults.dependentsAndFamily,
      incomeOffsetCushion: preset.defaults.incomeOffsetCushion,
      personalSavingsBuffer: preset.defaults.personalSavingsBuffer,
    });
  }

  // Step 4 Handlers (20 Awkward Co-Founder Questions & The Founder Prenup Engine)
  async function handleSaveStep4() {
    if (isVaultReadonly) return;
    try {
      setIsSavingStep4(true);
      const dataToSave = step4DataRef.current || step4Data;
      if (onSaveStep4Alignment) {
        await onSaveStep4Alignment(dataToSave, step4Complete ? 80 : 65);
      }
      setSaveBanner(
        isSoloFounderMode
          ? '✅ Saved Module F Step 4 (The 20 Hard Questions Every Solo Founder Must Answer)!'
          : '✅ Saved Module F Step 4 (Co-Founder Alignment Survey & Alignment Matrix)!'
      );
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setIsSavingStep4(false);
    }
  }

  function handleSelectQuestionOption(
    memberId: string,
    questionKey: AwkwardQuestionKey,
    optionValue: string
  ) {
    if (isVaultReadonly) return;
    setStep4Data((prev) => {
      const existingMemberResp =
        prev.responses.find((r) => r.memberId === memberId) ||
        prev.responses[0];
      const actualMemberId = existingMemberResp?.memberId || memberId;
      const targetMember = step1Data.teamMembers.find(
        (m) => m.id === actualMemberId
      );
      const memberName =
        targetMember?.fullName?.trim() ||
        existingMemberResp?.memberName ||
        userName ||
        'Founder';

      const existingAnswers = existingMemberResp?.answers || {};
      const currentAns = existingAnswers[questionKey];

      const updatedAns: AwkwardQuestionAnswerItem = {
        questionKey,
        selectedOption: optionValue,
        otherText:
          optionValue === 'OTHER'
            ? currentAns?.otherText || customOtherInputs[`${actualMemberId}_${questionKey}`] || ''
            : undefined,
        privateNote: currentAns?.privateNote,
      };

      const updatedAnswers = {
        ...existingAnswers,
        [questionKey]: updatedAns,
      };

      const otherResponses = prev.responses.filter(
        (r) => r.memberId !== actualMemberId
      );

      const nextData: CoFounderAlignmentStep4Data = {
        ...prev,
        responses: [
          ...otherResponses,
          {
            memberId: actualMemberId,
            memberName,
            answers: updatedAnswers,
            completedAt: new Date().toISOString(),
          },
        ],
        lastSavedAt: new Date().toISOString(),
      };

      step4DataRef.current = nextData;

      // Auto-save immediately to session and Cloud SQL so answers are never lost on refresh
      if (onSaveStep4Alignment) {
        const answeredCount = Object.keys(updatedAnswers).length;
        const progress = answeredCount >= 12 ? 80 : 65;
        onSaveStep4Alignment(nextData, progress).catch((err) => {
          console.warn('[SPF Module F] Background alignment save warning:', err);
        });
      }

      return nextData;
    });
  }

  function handleUpdateOtherText(
    memberId: string,
    questionKey: AwkwardQuestionKey,
    text: string
  ) {
    if (isVaultReadonly) return;
    setCustomOtherInputs((prev) => ({
      ...prev,
      [`${memberId}_${questionKey}`]: text,
    }));
    setStep4Data((prev) => {
      const existingMemberResp =
        prev.responses.find((r) => r.memberId === memberId) ||
        prev.responses[0];
      if (!existingMemberResp) return prev;
      const actualMemberId = existingMemberResp.memberId;
      const currentAns = existingMemberResp.answers[questionKey];
      if (!currentAns || currentAns.selectedOption !== 'OTHER') return prev;

      const nextData: CoFounderAlignmentStep4Data = {
        ...prev,
        responses: prev.responses.map((r) =>
          r.memberId === actualMemberId
            ? {
                ...r,
                answers: {
                  ...r.answers,
                  [questionKey]: {
                    ...currentAns,
                    otherText: text,
                  },
                },
              }
            : r
        ),
        lastSavedAt: new Date().toISOString(),
      };

      step4DataRef.current = nextData;
      if (onSaveStep4Alignment) {
        onSaveStep4Alignment(nextData, 75).catch(() => {});
      }

      return nextData;
    });
  }

  function handleUpdatePrivateNote(
    memberId: string,
    questionKey: AwkwardQuestionKey,
    note: string
  ) {
    if (isVaultReadonly) return;
    setStep4Data((prev) => {
      const existingMemberResp = prev.responses.find(
        (r) => r.memberId === memberId
      );
      if (!existingMemberResp) return prev;
      const currentAns = existingMemberResp.answers[questionKey] || {
        questionKey,
        selectedOption: '',
      };

      return {
        ...prev,
        responses: prev.responses.map((r) =>
          r.memberId === memberId
            ? {
                ...r,
                answers: {
                  ...r.answers,
                  [questionKey]: {
                    ...currentAns,
                    privateNote: note,
                  },
                },
              }
            : r
        ),
      };
    });
  }

  function handleToggleRevealHeatmap() {
    if (isVaultReadonly) return;
    setStep4Data((prev) => ({
      ...prev,
      isRevealed: !prev.isRevealed,
    }));
  }

  // Step 5 Handlers (3-Year Hiring Plan, Headcount Roadmap & Sweat Equity Architecture)
  async function handleSaveStep5() {
    if (isVaultReadonly) return;
    try {
      setIsSavingStep5(true);
      if (onSaveStep5HiringPlan) {
        await onSaveStep5HiringPlan(step5Data, step5Complete ? 100 : 85);
      }
      setSaveBanner(
        '✅ Saved Module F Step 5 (3-Year Job Creation Plan, Headcount Roadmap & Sweat Equity Architecture)!'
      );
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setIsSavingStep5(false);
    }
  }

  function handleAddPlannedRole(template?: typeof QUICK_ADD_ROLE_TEMPLATES[0]) {
    if (isVaultReadonly) return;
    const isGb = selectedCountry === 'GB';
    const newId = `role_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newRole: PlannedRoleItem = template
      ? {
          id: newId,
          title: template.title,
          department: template.department,
          employmentMode: template.employmentMode,
          yearScheduled: activeYearTab,
          targetQuarter: template.targetQuarter,
          compensationModel: template.compensationModel,
          grossAnnualSalary: isGb ? template.grossSalaryGbp : template.grossSalaryEur,
          isGrantReimbursableEligible: template.isGrantEligible,
          isRdTaxCreditEligible: template.isRdEligible,
          equityGrantPercent: template.equityPercent,
          vestingYears: 4,
          cliffMonths: 12,
          sweatEquityMilestoneConditions:
            template.compensationModel === 'PURE_SWEAT_EQUITY' ||
            template.compensationModel === 'HYBRID_CASH_EQUITY'
              ? '4-year monthly vesting with 12-month cliff.'
              : undefined,
          notes: `Added from ${template.title} preset template.`,
        }
      : {
          id: newId,
          title: '',
          department: 'ENGINEERING_PRODUCT',
          employmentMode: 'FULL_TIME',
          yearScheduled: activeYearTab,
          targetQuarter: 'Q1',
          compensationModel: 'FULL_CASH',
          grossAnnualSalary: isGb ? 35000 : 40000,
          isGrantReimbursableEligible: true,
          isRdTaxCreditEligible: false,
          equityGrantPercent: 0,
          vestingYears: 4,
          cliffMonths: 12,
        };

    setStep5Data((prev) => ({
      ...prev,
      roles: [...prev.roles, newRole],
    }));
    setOpenRoleId(newId);
  }

  function handleUpdatePlannedRole(roleId: string, updates: Partial<PlannedRoleItem>) {
    if (isVaultReadonly) return;
    setStep5Data((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.id === roleId ? { ...r, ...updates } : r)),
    }));
  }

  function handleRemovePlannedRole(roleId: string) {
    if (isVaultReadonly) return;
    setStep5Data((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId),
    }));
    if (openRoleId === roleId) {
      setOpenRoleId(null);
    }
  }

  async function handleGenerateHiringStrategyAi() {
    if (isVaultReadonly || isDraftingHiringAi) return;
    try {
      setIsDraftingHiringAi(true);
      const res = await generateHiringStrategySummaryAction({
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        hiringPosture:
          step5Data.hiringPosture === 'OTHER'
            ? customHiringPostureText || 'Specialized / Hybrid'
            : step5Data.hiringPosture,
        roles: step5Data.roles.map((r) => ({
          title: r.title,
          department: r.department,
          employmentMode: r.employmentMode,
          yearScheduled: r.yearScheduled,
          compensationModel: r.compensationModel,
          grossAnnualSalary: Number(r.grossAnnualSalary) || 0,
          equityGrantPercent: r.equityGrantPercent,
          vestingYears: r.vestingYears,
          cliffMonths: r.cliffMonths,
          isGrantReimbursableEligible: r.isGrantReimbursableEligible,
          isRdTaxCreditEligible: r.isRdTaxCreditEligible,
          sweatEquityMilestoneConditions: r.sweatEquityMilestoneConditions,
        })),
        contractorBudgetYear1: step5Data.contractorBudgetYear1,
        contractorBudgetYear2: step5Data.contractorBudgetYear2,
        contractorBudgetYear3: step5Data.contractorBudgetYear3,
      });

      if (res && res.executiveHiringStrategyNarrative) {
        setStep5Data((prev) => ({
          ...prev,
          executiveHiringStrategyNarrative: res.executiveHiringStrategyNarrative,
          aiCoachTip: res.aiCoachTip || prev.aiCoachTip,
        }));
        setSaveBanner('✨ Generated grant-ready Executive Hiring Strategy with AI!');
        setTimeout(() => setSaveBanner(null), 5000);
      }
    } catch (err) {
      console.error('Failed to generate hiring strategy narrative:', err);
    } finally {
      setIsDraftingHiringAi(false);
    }
  }

  // Overview / Final Brief Handlers
  async function handleSaveStep6() {
    if (isVaultReadonly) return;
    try {
      setIsSavingStep6(true);
      const updatedData: TeamBlindSpotAuditBriefData = {
        ...step6Data,
        lastSavedAt: new Date().toISOString(),
      };
      setStep6Data(updatedData);

      if (onSaveBriefOverview) {
        await onSaveBriefOverview(updatedData, 100);
      }
      setSaveBanner(
        '✅ Saved Module F Overview (Team, Governance & Hiring Executive Brief)!'
      );
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setIsSavingStep6(false);
    }
  }

  function handleUpdateBlindSpotItem(
    blindSpotId: string,
    updates: Partial<TeamBlindSpotItem>
  ) {
    if (isVaultReadonly) return;
    setStep6Data((prev) => ({
      ...prev,
      blindSpots: prev.blindSpots.map((b) =>
        b.id === blindSpotId ? { ...b, ...updates } : b
      ),
    }));
  }

  function handleToggleBlindSpotResolved(blindSpotId: string) {
    if (isVaultReadonly) return;
    setStep6Data((prev) => ({
      ...prev,
      blindSpots: prev.blindSpots.map((b) =>
        b.id === blindSpotId ? { ...b, isResolved: !b.isResolved } : b
      ),
    }));
  }

  function handleRemoveBlindSpotItem(blindSpotId: string) {
    if (isVaultReadonly) return;
    setStep6Data((prev) => ({
      ...prev,
      blindSpots: prev.blindSpots.filter((b) => b.id !== blindSpotId),
    }));
  }

  function handleAddBlindSpotItem() {
    if (isVaultReadonly) return;
    const newId = `tb-custom-${Date.now()}`;
    const newItem: TeamBlindSpotItem = {
      id: newId,
      title: 'Custom Governance / Operational Risk',
      category: 'OTHER',
      severity: 'IMPORTANT',
      whyItMatters:
        'Document this team or hiring consideration to demonstrate management self-awareness to grant panels.',
      recommendedActionOrFix:
        'Define the immediate mitigation strategy or governance rule agreed by founders.',
      isResolved: false,
      isCustom: true,
    };
    setStep6Data((prev) => ({
      ...prev,
      blindSpots: [...prev.blindSpots, newItem],
    }));
  }

  async function handleRunAiStep6Audit() {
    if (isVaultReadonly || isDraftingAuditAi) return;
    try {
      setIsDraftingAuditAi(true);
      const res = await generateTeamAuditAndBriefAction({
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        teamMembersCount: step1Data.teamMembers.length,
        promoters: step1Data.teamMembers.map((m) => ({
          fullName: m.fullName,
          jobTitle: m.jobTitle,
          cvReady: m.cvReadyForAppendixD,
        })),
        survivalRunwayMonths: step3Data.founderBudgets[0]?.personalSavingsBuffer && totalTeamMonthlyDrawingsNeed > 0
          ? Math.round(step3Data.founderBudgets[0].personalSavingsBuffer / totalTeamMonthlyDrawingsNeed)
          : 6,
        monthlySurvivalBurn: totalTeamMonthlyDrawingsNeed,
        unassignedHatsCount: 7 - step2AssignedHatsCount,
        year1Fte: calculateFteForRoles(step5RolesYear1),
        year3Fte: calculateFteForRoles(step5RolesYear3),
      });

      if (res && res.executiveTeamCapabilityNarrative) {
        setStep6Data((prev) => ({
          ...prev,
          blindSpots: res.blindSpots.map((b) => ({
            ...b,
            isResolved: prev.blindSpots.find((p) => p.title === b.title)?.isResolved || false,
          })),
          executiveTeamCapabilityNarrative: res.executiveTeamCapabilityNarrative,
          governanceAndVestingNarrative: res.governanceAndVestingNarrative,
          talentRetentionAndHiringNarrative: res.talentRetentionAndHiringNarrative,
          aiCoachTip: res.aiCoachTip,
          aiEngineUsed: res.engineMode,
        }));
        setSaveBanner('✨ Conducted AI Team & Governance Audit & Dossier Synthesis!');
        setTimeout(() => setSaveBanner(null), 5000);
      }
    } catch (err) {
      console.error('Failed to run AI team audit:', err);
    } finally {
      setIsDraftingAuditAi(false);
    }
  }

  function handleCopyMarkdownBrief() {
    const isGb = selectedCountry === 'GB';
    const lines: string[] = [];
    lines.push(`# ${plan.title || 'Startup'} — Team, Governance & Hiring Dossier`);
    lines.push(`**Jurisdiction:** ${isGb ? 'United Kingdom (Innovate UK / Start Up Loans)' : 'Ireland (LEO Appendix D & Enterprise Ireland)'}`);
    lines.push(`**Date Generated:** ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('## 1. Executive Team Capability (LEO Appendix D / Innovate UK Q8)');
    lines.push(step6Data.executiveTeamCapabilityNarrative || step1Data.executiveTeamCapabilityNarrative || 'Promoter capability summary pending.');
    lines.push('');
    lines.push('### Promoter & Key Personnel Schedule:');
    step1Data.teamMembers.forEach((m, idx) => {
      lines.push(`${idx + 1}. **${m.fullName || 'Member'}** — ${m.jobTitle || 'Role'} (${m.weeklyCommitment.replace(/_/g, ' ')})`);
      lines.push(`   - ${m.compiled150WordNarrative || 'Bio to be completed.'}`);
      if (m.linkedInUrl) lines.push(`   - LinkedIn: ${m.linkedInUrl}`);
      lines.push(`   - CV Appendix D Ready: ${m.cvReadyForAppendixD ? 'Yes' : 'Pending'}`);
    });
    lines.push('');
    lines.push('## 2. Division of Functional Hats (The 7 Startup Hats)');
    lines.push(step2Data.executiveDivisionSummary || 'Division summary pending.');
    lines.push('');
    lines.push('## 3. Personal Financial Runway & Drawings Floor');
    lines.push(`- **Minimum Monthly Survival Need:** ${formatPlanCurrency(totalTeamMonthlyDrawingsNeed, step3Data.currencyCode)}/month across ${step3Data.founderBudgets.length} founder(s)`);
    lines.push('');
    lines.push('## 4. Corporate Governance & Founder Alignment');
    lines.push(step6Data.governanceAndVestingNarrative || '4-year reverse-vesting schedule with 12-month cliff and deadlock dispute resolution agreed.');
    lines.push('');
    lines.push('## 5. 3-Year Headcount Roadmap & Grant Salary Subsidy');
    lines.push(step6Data.talentRetentionAndHiringNarrative || '3-year headcount plan active.');
    lines.push(`- **Year 1:** ${calculateFteForRoles(step5RolesYear1)} FTEs | Cash Burn: ${formatPlanCurrency(y1Stats.totalCashBurn, isGb ? 'GBP' : 'EUR')}`);
    lines.push(`- **Year 2:** ${calculateFteForRoles(step5RolesYear2)} FTEs | Cash Burn: ${formatPlanCurrency(y2Stats.totalCashBurn, isGb ? 'GBP' : 'EUR')}`);
    lines.push(`- **Year 3:** ${calculateFteForRoles(step5RolesYear3)} FTEs | Cash Burn: ${formatPlanCurrency(y3Stats.totalCashBurn, isGb ? 'GBP' : 'EUR')}`);
    lines.push('');
    lines.push('## 6. Blind-Spot Audit & Risk Mitigations');
    step6Data.blindSpots.forEach((b, idx) => {
      lines.push(`### ${idx + 1}. [${b.severity}] ${b.title}`);
      lines.push(`- **Why It Matters:** ${b.whyItMatters}`);
      lines.push(`- **Mitigation Action:** ${b.recommendedActionOrFix}`);
      lines.push(`- **Status:** ${b.isResolved ? 'Resolved' : 'Active Consideration'}`);
      lines.push('');
    });

    const markdownText = lines.join('\n');
    navigator.clipboard.writeText(markdownText).then(() => {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 3000);
    });
  }

  // Step 1 Handlers
  async function handleSaveStep1() {
    if (isVaultReadonly) return;
    try {
      setIsSavingStep1(true);
      await onSaveStep1PromoterProfiles(step1Data, step1Complete ? 20 : 10);
      setSaveBanner(
        '✅ Saved Module F Step 1 (Promoter & Team Profiles with 150-Word Grant Bios & CV Readiness)!'
      );
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setIsSavingStep1(false);
    }
  }

  function handleAddTeamMember(classification: TeamMemberClassificationType = 'KEY_TEAM_MEMBER') {
    if (isVaultReadonly) return;
    const isFounder = classification === 'FOUNDER_PROMOTER';
    const newMember: TeamMemberProfileItem = {
      id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: '',
      roleClassification: classification,
      jobTitle: '', // Keep blank so user specifies their exact role
      photoUrl: '',
      linkedInUrl: '',
      email: '',
      weeklyCommitment: isFounder ? 'FULL_TIME_40H_PLUS' : 'PART_TIME_20_TO_30H',
      relevantEducationAndDegrees: '',
      relevantTrainingCourses: '',
      priorIndustryExperienceYears: 3,
      keyPastCompaniesOrTrackRecord: '',
      compiled150WordNarrative: '',
      cvReadyForAppendixD: false,
      equitySharePercent: 0,
      isCurrentUserFounder: false,
    };
    setStep1Data((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember],
    }));
    // Auto-expand the newly added team member
    setOpenMemberIds((prev) => ({
      ...prev,
      [newMember.id]: true,
    }));
  }

  function handleRemoveTeamMember(id: string) {
    if (isVaultReadonly) return;
    setStep1Data((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((m) => m.id !== id),
    }));
    setOpenMemberIds((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function handleUpdateTeamMember(
    id: string,
    updates: Partial<TeamMemberProfileItem>
  ) {
    if (isVaultReadonly) return;
    setStep1Data((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  }

  function handlePhotoUpload(
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (isVaultReadonly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      handleUpdateTeamMember(id, { photoUrl: result });
    };
    reader.readAsDataURL(file);
  }

  function applyParsedCvResult(
    memberId: string,
    result: ParseCvAndDraftBioResult,
    fileMeta?: {
      cvFileName?: string;
      cvFileSizeBytes?: number;
      cvUploadedAt?: string;
      cvBase64Data?: string;
    }
  ) {
    setStep1Data((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m) => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          fullName: m.fullName, // Preserve user's input, do not auto-populate name from CV
          jobTitle: m.jobTitle || '', // Preserve user's role choice, leave blank if not yet entered
          linkedInUrl: result.linkedInUrl?.trim() || m.linkedInUrl,
          email: result.email?.trim() || m.email,
          relevantEducationAndDegrees:
            result.relevantEducationAndDegrees?.trim() ||
            m.relevantEducationAndDegrees,
          relevantTrainingCourses:
            result.relevantTrainingCourses?.trim() ||
            m.relevantTrainingCourses,
          priorIndustryExperienceYears:
            result.priorIndustryExperienceYears ||
            m.priorIndustryExperienceYears,
          keyPastCompaniesOrTrackRecord:
            result.keyPastCompaniesOrTrackRecord?.trim() ||
            m.keyPastCompaniesOrTrackRecord,
          compiled150WordNarrative:
            result.compiled150WordNarrative?.trim() ||
            m.compiled150WordNarrative,
          cvReadyForAppendixD: true,
          cvFileName: fileMeta?.cvFileName ?? m.cvFileName,
          cvFileSizeBytes: fileMeta?.cvFileSizeBytes ?? m.cvFileSizeBytes,
          cvUploadedAt:
            fileMeta?.cvUploadedAt ?? m.cvUploadedAt ?? new Date().toISOString(),
          cvBase64Data: fileMeta?.cvBase64Data ?? m.cvBase64Data,
        };
      }),
    }));
    const fileNameNotice = fileMeta?.cvFileName
      ? `Stored "${fileMeta.cvFileName}" & auto-populated profile`
      : 'Auto-populated profile from CV';
    setSaveBanner(
      `✅ ${fileNameNotice} for ${
        result.fullName || 'team member'
      }! Generated ${result.wordCount}-word capability statement ready for LEO Appendix D & Innovate UK.`
    );
    setTimeout(() => setSaveBanner(null), 7000);
  }

  function handleRemoveCvFile(memberId: string) {
    if (isVaultReadonly) return;
    setStep1Data((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m) =>
        m.id === memberId
          ? {
              ...m,
              cvFileName: undefined,
              cvFileSizeBytes: undefined,
              cvUploadedAt: undefined,
              cvBase64Data: undefined,
              cvReadyForAppendixD: false,
            }
          : m
      ),
    }));
  }

  async function handleCvUpload(
    memberId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (isVaultReadonly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('CV file must be under 8MB.');
      return;
    }

    const member = step1Data.teamMembers.find((m) => m.id === memberId);
    const currentRole = member?.jobTitle || '';
    const currentName = member?.fullName || '';

    setIsParsingCv((prev) => ({ ...prev, [memberId]: true }));
    try {
      const isTextFile =
        file.type === 'text/plain' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md');

      if (isTextFile) {
        const text = await file.text();
        const res = await parseCvAndDraftPromoterBioAction({
          planTitle: plan.title,
          industryCategory: plan.industryCategory,
          hqCountryCode: selectedCountry,
          rawText: text,
          currentRoleTitle: currentRole,
          candidateName: currentName,
        });
        const textDataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(
          text
        )}`;
        applyParsedCvResult(memberId, res, {
          cvFileName: file.name,
          cvFileSizeBytes: file.size,
          cvUploadedAt: new Date().toISOString(),
          cvBase64Data: textDataUrl,
        });
        setIsParsingCv((prev) => ({ ...prev, [memberId]: false }));
      } else {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const dataUrl = event.target?.result as string;
            const commaIndex = dataUrl.indexOf(',');
            const base64Data =
              commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;
            const mimeType = file.type || 'application/pdf';

            const res = await parseCvAndDraftPromoterBioAction({
              planTitle: plan.title,
              industryCategory: plan.industryCategory,
              hqCountryCode: selectedCountry,
              fileBase64: base64Data,
              fileMimeType: mimeType,
              currentRoleTitle: currentRole,
              candidateName: currentName,
            });
            applyParsedCvResult(memberId, res, {
              cvFileName: file.name,
              cvFileSizeBytes: file.size,
              cvUploadedAt: new Date().toISOString(),
              cvBase64Data: dataUrl,
            });
          } catch (err) {
            console.error('Error parsing CV:', err);
            alert(
              'Could not parse CV with AI. Please ensure the file is an unencrypted PDF or plain text document.'
            );
          } finally {
            setIsParsingCv((prev) => ({ ...prev, [memberId]: false }));
          }
        };
        reader.onerror = () => {
          alert('Failed to read file from disk.');
          setIsParsingCv((prev) => ({ ...prev, [memberId]: false }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error uploading CV:', err);
      alert('Failed to process CV. Please try again.');
      setIsParsingCv((prev) => ({ ...prev, [memberId]: false }));
    }
  }

  async function handleAiDraftBioFromInputs(memberId: string) {
    if (isVaultReadonly) return;
    const member = step1Data.teamMembers.find((m) => m.id === memberId);
    if (!member) return;

    setIsParsingCv((prev) => ({ ...prev, [memberId]: true }));
    try {
      const combinedNotes = [
        `Candidate Name: ${member.fullName || 'Promoter'}`,
        `Role in Startup: ${member.jobTitle || 'Founder'}`,
        `Education & Degrees: ${member.relevantEducationAndDegrees || 'Tertiary Degree / Business Training'}`,
        `Enterprise Training Courses: ${member.relevantTrainingCourses || 'LEO / Enterprise Training'}`,
        `Years Experience: ${member.priorIndustryExperienceYears || 5} years`,
        `Past Companies & Accomplishments: ${member.keyPastCompaniesOrTrackRecord || 'Proven track record of technical and commercial delivery'}`,
        `Existing Bio Notes: ${member.compiled150WordNarrative || 'Leading commercial and operational milestones for the venture.'}`,
      ].join('\n');

      const res = await parseCvAndDraftPromoterBioAction({
        planTitle: plan.title,
        industryCategory: plan.industryCategory,
        hqCountryCode: selectedCountry,
        rawText: combinedNotes,
        currentRoleTitle: member.jobTitle,
        candidateName: member.fullName,
      });

      if (res.compiled150WordNarrative) {
        handleUpdateTeamMember(memberId, {
          compiled150WordNarrative: res.compiled150WordNarrative,
          cvReadyForAppendixD: true,
        });
        setSaveBanner(
          `✅ Auto-drafted ${res.wordCount}-word promoter capability statement for ${member.fullName || 'founder'}!`
        );
        setTimeout(() => setSaveBanner(null), 6000);
      }
    } catch (err) {
      console.error('Error drafting bio:', err);
      alert('Could not draft bio. Please try again.');
    } finally {
      setIsParsingCv((prev) => ({ ...prev, [memberId]: false }));
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Save / Feedback Banner */}
      {saveBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{saveBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveBanner(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP DARK-INDIGO MODULE HEADER CARD & 6-STEP ACCORDION NAVIGATION STRIP */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-bold tracking-wider text-indigo-300 uppercase">
                Module F • Team, Survival Budget & Co-Founder Fit
              </span>
              <Badge
                variant="outline"
                className="border-indigo-400/30 text-[10px] text-indigo-200"
              >
                Flagship Standalone #2
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Module F: Your Team, Co-Founder Fit & Personal Runway
            </h1>
            <p className="max-w-3xl text-xs text-indigo-100/90 sm:text-sm">
              Build your promoter and team member roster with 150-word LEO-ready bios and LinkedIn links, map the 7 Startup Hats, calculate your personal survival budget (UK Start Up Loans Tab #2 compliant), and stress-test the 12 awkward co-founder questions.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setOpenStep((prev) => (prev === 'ALL' ? 1 : 'ALL'))
                }
                className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                {openStep === 'ALL' ? 'Focus Step-by-Step' : 'Expand All Steps'}
              </Button>
              {onBackToModuleE && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onBackToModuleE}
                  className="border-indigo-400/40 bg-white/10 text-xs text-white hover:bg-white/20"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Back to Module E
                </Button>
              )}
            </div>
            <div className="text-right text-[11px] text-indigo-200">
              Module F Progress: <strong>{totalModuleFProgress}%</strong> (
              {completedModuleFCoreStepsCount} of 5 Core Steps Ready)
            </div>
          </div>
        </div>

        {/* 6-Step Accordion Navigation Strip */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-indigo-800/70 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              step: 'Step 1',
              title: 'Promoter & Team Bios',
              targetId: 'module-f-step-1',
              stepNum: 1,
              done: moduleFReadinessSteps[0]?.isComplete ?? false,
            },
            {
              step: 'Step 2',
              title: '7 Startup Hats',
              targetId: 'module-f-step-2',
              stepNum: 2,
              done: moduleFReadinessSteps[1]?.isComplete ?? false,
            },
            {
              step: 'Step 3',
              title: 'Survival Budget',
              targetId: 'module-f-step-3',
              stepNum: 3,
              done: moduleFReadinessSteps[2]?.isComplete ?? false,
            },
            {
              step: 'Step 4',
              title: 'Co-Founder Alignment',
              targetId: 'module-f-step-4',
              stepNum: 4,
              done: moduleFReadinessSteps[3]?.isComplete ?? false,
            },
            {
              step: 'Step 5',
              title: '3-Year Hiring Plan',
              targetId: 'module-f-step-5',
              stepNum: 5,
              done: moduleFReadinessSteps[4]?.isComplete ?? false,
            },
            {
              step: 'Overview',
              title: 'Team & Governance Brief',
              targetId: 'module-f-step-6',
              stepNum: 6,
              done:
                completedModuleFCoreStepsCount === 5 ||
                (moduleFReadinessSteps[5]?.isComplete ?? false),
            },
          ].map((item, idx, arr) => {
            const firstIncompleteIdx = arr.findIndex((s) => !s.done);
            const isStepOpen =
              openStep === 'ALL'
                ? firstIncompleteIdx === -1
                  ? idx === arr.length - 1
                  : idx === firstIncompleteIdx
                : openStep === item.stepNum;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setOpenStep(item.stepNum);
                  setTimeout(() => {
                    const el = document.getElementById(item.targetId);
                    if (el) {
                      el.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }
                  }, 40);
                }}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all hover:border-white/50 hover:bg-white/15 ${
                  isStepOpen
                    ? 'border-amber-300/80 bg-white/20 text-white shadow-xs ring-1 ring-amber-300/50'
                    : item.done
                      ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'
                      : 'border-indigo-800/60 bg-indigo-950/40 text-indigo-300/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-white/90">
                    {item.step}
                  </span>
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-indigo-300/70">
                      {item.stepNum === 6 ? 'Summary' : 'In Progress'}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-indigo-100/80">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: PROMOTER & TEAM MEMBER PROFILES, 150-WORD BIOS & CV READINESS     */}
      {/* ========================================================================= */}
      <div id="module-f-step-1" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 1 ? (
          // Collapsed State Card
          <div
            onClick={() => setOpenStep(1)}
            className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  step1Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {step1Complete ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Step 1: Promoter &amp; Key Team Member Profiles
                  </h3>
                  <Badge
                    variant={step1Complete ? 'default' : 'outline'}
                    className={`text-[10px] shrink-0 ${
                      step1Complete
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {step1Complete ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {step1Data.teamMembers.length} team member
                  {step1Data.teamMembers.length === 1 ? '' : 's'} logged •{' '}
                  {step1Data.teamStructurePosture
                    ? TEAM_STRUCTURE_POSTURE_OPTIONS.find(
                        (o) => o.value === step1Data.teamStructurePosture
                      )?.label || step1Data.teamStructurePosture
                    : 'Select Team Posture'}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          // Expanded State Card
          <Card className="rounded-xl border border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      step1Complete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {step1Complete ? <Check className="h-4 w-4" /> : '1'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 1: Promoter &amp; Key Team Member Profiles
                      </CardTitle>
                      <Badge
                        variant={step1Complete ? 'default' : 'outline'}
                        className={`text-[10px] shrink-0 ${
                          step1Complete
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {step1Complete ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Document your founders and key existing team members. Captures photos, LinkedIn profiles, domain track records, 150-word LEO-compliant promoter bios, and Appendix D CV readiness.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setActiveWhyCard(activeWhyCard === 1 ? null : 1)
                    }
                    className="text-xs text-indigo-700 hover:bg-indigo-50"
                  >
                    <HelpCircle className="mr-1 h-3.5 w-3.5" />
                    Why Are We Asking This?
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStep(0);
                    }}
                    className="text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Collapse Step
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* "Why Are We Asking This?" Explainer */}
              {activeWhyCard === 1 && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-950">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-indigo-900">
                        Why Grant Assessors &amp; Investors Scrutinize Your Team:
                      </p>
                      <p className="text-indigo-900/90 leading-relaxed">
                        Irish LEO application forms explicitly demand a <strong>minimum 150-word background narrative per promoter</strong> plus formal CVs attached to <strong>Appendix D</strong>. Similarly, UK Innovate UK Question 8 scores your <em>Team Capability to Deliver</em>. Capturing photos, verified LinkedIn links, and concrete past accomplishments proves credibility and de-risks execution before asking for public or private funding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Team Structure Posture Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  1. Current Team Structure Posture
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  How is your startup structured today?
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {TEAM_STRUCTURE_POSTURE_OPTIONS.map((opt) => {
                    const isSelected =
                      step1Data.teamStructurePosture === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (isVaultReadonly) return;
                          setStep1Data((prev) => ({
                            ...prev,
                            teamStructurePosture: opt.value,
                          }));
                        }}
                        className={`rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-indigo-950' : 'text-slate-800'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {step1Data.teamStructurePosture === 'OTHER' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={step1Data.otherTeamStructurePostureText || ''}
                      onChange={(e) =>
                        setStep1Data((prev) => ({
                          ...prev,
                          otherTeamStructurePostureText: e.target.value,
                        }))
                      }
                      placeholder="Describe your custom team structure..."
                      disabled={isVaultReadonly}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Team Members Roster */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      2. Founders &amp; Key Team Members Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add each promoter, co-founder, key existing employee, and advisor.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {step1Data.teamMembers.length > 1 && (
                      <div className="flex items-center gap-1 mr-1 border-r border-slate-200 pr-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllMembers(true)}
                          className="h-7 px-2 text-[11px] text-slate-600 hover:text-indigo-600"
                        >
                          Expand All
                        </Button>
                        <span className="text-slate-300">•</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllMembers(false)}
                          className="h-7 px-2 text-[11px] text-slate-600 hover:text-indigo-600"
                        >
                          Collapse All
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTeamMember('KEY_TEAM_MEMBER')}
                      disabled={isVaultReadonly}
                      className="text-xs"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5 text-indigo-600" />
                      Add Key Team Member
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTeamMember('FOUNDER_PROMOTER')}
                      disabled={isVaultReadonly}
                      className="text-xs border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Co-Founder
                    </Button>
                  </div>
                </div>

                {/* Team Cards List */}
                <div className="space-y-4">
                  {step1Data.teamMembers.map((member, index) => {
                    const isMemberOpen = Boolean(openMemberIds[member.id]);
                    const wordCount = member.compiled150WordNarrative
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length;
                    const isLeo150Compliant = wordCount >= 150;
                    const isFounder =
                      member.roleClassification === 'FOUNDER_PROMOTER';

                    // Avatar initials fallback
                    const initials = member.fullName
                      ? member.fullName
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)
                      : `M${index + 1}`;

                    // Check completeness for this individual team member
                    const isMemberComplete =
                      Boolean(member.fullName.trim()) &&
                      Boolean(member.jobTitle.trim()) &&
                      (!isFounder || wordCount >= 80);

                    // If collapsed, render concise step-like preview card
                    if (!isMemberOpen) {
                      return (
                        <div
                          key={member.id}
                          onClick={() => toggleMemberCollapse(member.id)}
                          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              {/* Photo / Avatar Pill */}
                              <div className="relative shrink-0">
                                {member.photoUrl ? (
                                  <img
                                    src={member.photoUrl}
                                    alt={member.fullName || 'Team member'}
                                    className="h-9 w-9 rounded-full object-cover border border-indigo-100 shadow-2xs"
                                  />
                                ) : (
                                  <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${
                                      isMemberComplete
                                        ? 'bg-emerald-600'
                                        : 'bg-indigo-600'
                                    }`}
                                  >
                                    {isMemberComplete ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      initials
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-400">
                                    #{index + 1}
                                  </span>
                                  <span className="truncate text-sm font-bold text-slate-900">
                                    {member.fullName || 'Unnamed Team Member'}
                                  </span>
                                  {member.isCurrentUserFounder && (
                                    <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">
                                      Lead Founder
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-slate-200 text-slate-600 bg-slate-50"
                                  >
                                    {TEAM_MEMBER_CLASSIFICATION_OPTIONS.find(
                                      (c) => c.value === member.roleClassification
                                    )?.label || 'Team Member'}
                                  </Badge>
                                  {isMemberComplete ? (
                                    <Badge
                                      variant="default"
                                      className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]"
                                    >
                                      Profile Ready
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="border-amber-300 bg-amber-50 text-amber-800 text-[10px]"
                                    >
                                      Needs Details
                                    </Badge>
                                  )}
                                  {member.cvFileName && (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                      CV Attached
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {member.jobTitle
                                    ? `${member.jobTitle} • `
                                    : ''}
                                  {member.relevantEducationAndDegrees ||
                                    member.keyPastCompaniesOrTrackRecord ||
                                    (wordCount > 0
                                      ? `${wordCount} words drafted`
                                      : 'Click to edit biography and credentials')}
                                </p>
                              </div>
                            </div>

                            <div className="ml-3 flex shrink-0 items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                              >
                                <span>Edit Profile</span>
                                <ChevronDown className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Expanded state (full editor form)
                    return (
                      <div
                        key={member.id}
                        className="rounded-xl border border-indigo-200 bg-white p-4 sm:p-5 shadow-xs space-y-4"
                      >
                        {/* Header Row: Photo + Name + Classification + Collapse + Delete */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3.5">
                            {/* Photo / Avatar Upload */}
                            <div className="relative group shrink-0">
                              {member.photoUrl ? (
                                <img
                                  src={member.photoUrl}
                                  alt={member.fullName || 'Team member'}
                                  className="h-14 w-14 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
                                />
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-xs">
                                  {initials}
                                </div>
                              )}
                              <label
                                className={`absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-md hover:bg-indigo-600 transition-colors ${
                                  isVaultReadonly ? 'pointer-events-none opacity-50' : ''
                                }`}
                                title="Upload Photo"
                              >
                                <Upload className="h-3 w-3" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handlePhotoUpload(member.id, e)
                                  }
                                  className="hidden"
                                  disabled={isVaultReadonly}
                                />
                              </label>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400">
                                  #{index + 1}
                                </span>
                                <input
                                  type="text"
                                  value={member.fullName}
                                  onChange={(e) =>
                                    handleUpdateTeamMember(member.id, {
                                      fullName: e.target.value,
                                    })
                                  }
                                  placeholder="Full Name (e.g. Lynn Walsh)"
                                  disabled={isVaultReadonly}
                                  className="text-sm font-bold text-slate-900 border-b border-dashed border-slate-300 hover:border-indigo-400 focus:border-indigo-600 focus:outline-hidden pb-0.5"
                                />
                                {member.isCurrentUserFounder && (
                                  <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">
                                    Lead Founder
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <select
                                  value={member.roleClassification}
                                  onChange={(e) =>
                                    handleUpdateTeamMember(member.id, {
                                      roleClassification: e.target
                                        .value as TeamMemberClassificationType,
                                    })
                                  }
                                  disabled={isVaultReadonly}
                                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
                                >
                                  {TEAM_MEMBER_CLASSIFICATION_OPTIONS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={member.weeklyCommitment}
                                  onChange={(e) =>
                                    handleUpdateTeamMember(member.id, {
                                      weeklyCommitment: e.target
                                        .value as TeamWeeklyCommitmentType,
                                    })
                                  }
                                  disabled={isVaultReadonly}
                                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 focus:border-indigo-500 focus:outline-hidden"
                                >
                                  {TEAM_WEEKLY_COMMITMENT_OPTIONS.map((w) => (
                                    <option key={w.value} value={w.value}>
                                      {w.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Collapse & Delete Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMemberCollapse(member.id)}
                              className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <span>Collapse Profile</span>
                              <ChevronUp className="ml-1 h-3.5 w-3.5" />
                            </Button>
                            {step1Data.teamMembers.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTeamMember(member.id)}
                                disabled={isVaultReadonly}
                                className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Remove team member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* CV Document Storage & Upload Strip */}
                        {member.cvBase64Data ? (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 sm:px-4 shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shadow-2xs">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-xs font-bold text-slate-900 max-w-[200px] sm:max-w-xs">
                                    {member.cvFileName || 'Founder_CV.pdf'}
                                  </span>
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-300 shrink-0">
                                    Appendix D Attached
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {member.cvFileSizeBytes
                                    ? `${(member.cvFileSizeBytes / 1024).toFixed(0)} KB`
                                    : 'Stored Document'}{' '}
                                  • Stored for IE LEO Appendix D &amp; UK Innovate UK Annex
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={member.cvBase64Data}
                                download={member.cvFileName || 'Founder_CV.pdf'}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5 text-slate-500" />
                                <span>Download / View</span>
                              </a>
                              <label
                                className={`inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 cursor-pointer transition-colors ${
                                  isVaultReadonly || isParsingCv[member.id]
                                    ? 'opacity-60 pointer-events-none'
                                    : ''
                                }`}
                              >
                                {isParsingCv[member.id] ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                                    <span>Replacing...</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3 w-3 text-indigo-600" />
                                    <span>Replace</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept=".pdf,application/pdf,.txt,text/plain"
                                  onChange={(e) => handleCvUpload(member.id, e)}
                                  disabled={
                                    isVaultReadonly || isParsingCv[member.id]
                                  }
                                  className="hidden"
                                />
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCvFile(member.id)}
                                disabled={isVaultReadonly}
                                className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3 sm:px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                                {isParsingCv[member.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                ) : (
                                  <FileUp className="h-4 w-4 text-indigo-600" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    Upload CV / Resume (Stored for Grant Submission)
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-indigo-300 text-indigo-700 bg-white"
                                  >
                                    PDF or Text
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Stores CV for LEO Appendix D &amp; UK Innovate UK, auto-extracts degrees &amp; drafts a 150-word bio.
                                </p>
                              </div>
                            </div>

                            <div>
                              <label
                                className={`inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 cursor-pointer transition-colors ${
                                  isVaultReadonly || isParsingCv[member.id]
                                    ? 'opacity-60 pointer-events-none'
                                    : ''
                                }`}
                              >
                                {isParsingCv[member.id] ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                                    <span>Reading &amp; Storing...</span>
                                  </>
                                ) : (
                                  <>
                                    <FileUp className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>Upload CV (.pdf, .txt)</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept=".pdf,application/pdf,.txt,text/plain"
                                  onChange={(e) => handleCvUpload(member.id, e)}
                                  disabled={
                                    isVaultReadonly || isParsingCv[member.id]
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Row 2: Job Title + LinkedIn Link + Email */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Job Title / Role in Startup
                            </label>
                            <input
                              type="text"
                              value={member.jobTitle}
                              onChange={(e) =>
                                handleUpdateTeamMember(member.id, {
                                  jobTitle: e.target.value,
                                })
                              }
                              placeholder="e.g. Founder & CTO / Lead Full-Stack Dev"
                              disabled={isVaultReadonly}
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                                LinkedIn Profile URL
                              </span>
                              {member.linkedInUrl && (
                                <a
                                  href={member.linkedInUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                                >
                                  View
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </label>
                            <input
                              type="url"
                              value={member.linkedInUrl || ''}
                              onChange={(e) =>
                                handleUpdateTeamMember(member.id, {
                                  linkedInUrl: e.target.value,
                                })
                              }
                              placeholder="https://linkedin.com/in/username"
                              disabled={isVaultReadonly}
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Contact Email / Phone
                            </label>
                            <input
                              type="email"
                              value={member.email || ''}
                              onChange={(e) =>
                                handleUpdateTeamMember(member.id, {
                                  email: e.target.value,
                                })
                              }
                              placeholder="name@startup.com"
                              disabled={isVaultReadonly}
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Row 3: Education/Degrees + Past Track Record / Companies */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Formal Education, Degrees &amp; LEO / Enterprise Courses
                            </label>
                            <input
                              type="text"
                              value={member.relevantEducationAndDegrees || ''}
                              onChange={(e) =>
                                handleUpdateTeamMember(member.id, {
                                  relevantEducationAndDegrees: e.target.value,
                                })
                              }
                              placeholder="e.g. BSc Computer Science, LEO Start Your Own Business course"
                              disabled={isVaultReadonly}
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Prior Industry Experience &amp; Key Track Record
                            </label>
                            <input
                              type="text"
                              value={member.keyPastCompaniesOrTrackRecord || ''}
                              onChange={(e) =>
                                handleUpdateTeamMember(member.id, {
                                  keyPastCompaniesOrTrackRecord: e.target.value,
                                })
                              }
                              placeholder="e.g. 8 years scaling fintech software, ex-Stripe tech lead"
                              disabled={isVaultReadonly}
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Row 4: 150-Word LEO Bio Narrative + Word Count Badge */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-900">
                              {isFounder
                                ? 'Detailed Promoter Bio Narrative (LEO Min. 150 Words & UK Q8 Capability)'
                                : 'Key Team Member Bio & Capability Statement'}
                            </label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAiDraftBioFromInputs(member.id)
                                }
                                disabled={
                                  isVaultReadonly || isParsingCv[member.id]
                                }
                                className="h-6 px-2 text-[11px] border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                              >
                                {isParsingCv[member.id] ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Wand2 className="mr-1 h-3 w-3 text-indigo-600" />
                                )}
                                Auto-Draft with AI
                              </Button>
                              <Badge
                                variant={isLeo150Compliant ? 'default' : 'outline'}
                                className={`text-[10px] ${
                                  isLeo150Compliant
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                                    : 'border-amber-300 bg-amber-50 text-amber-800'
                                }`}
                              >
                                {wordCount} Words{' '}
                                {isFounder &&
                                  (isLeo150Compliant
                                    ? '✓ (LEO 150-Word Met)'
                                    : `(Need ${Math.max(0, 150 - wordCount)} more for LEO)`)}
                              </Badge>
                            </div>
                          </div>

                          <textarea
                            rows={4}
                            value={member.compiled150WordNarrative}
                            onChange={(e) =>
                              handleUpdateTeamMember(member.id, {
                                compiled150WordNarrative: e.target.value,
                              })
                            }
                            placeholder="Draft a comprehensive 150-word narrative covering domain qualifications, commercial background, technical track record, and specific role responsibilities..."
                            disabled={isVaultReadonly}
                            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs focus:border-indigo-500 focus:outline-hidden leading-relaxed"
                          />

                          {/* Appendix D CV Readiness Checkbox */}
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={member.cvReadyForAppendixD}
                                onChange={(e) =>
                                  handleUpdateTeamMember(member.id, {
                                    cvReadyForAppendixD: e.target.checked,
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-medium">
                                Up-to-date CV ready to attach for Grant Appendix D / Innovate UK Annex
                              </span>
                              {member.cvFileName && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-300 font-medium shrink-0">
                                  Attached ({member.cvFileName})
                                </Badge>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step Toolbar: AI Assistant + Save + Next */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2">
                  {onParkOpenQuestion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onParkOpenQuestion(
                          'Confirm 150-word promoter bios and Appendix D CVs for all founders before submitting LEO or Innovate UK grant applications.'
                        )
                      }
                      className="text-xs text-slate-600"
                    >
                      <BookmarkPlus className="mr-1 h-3.5 w-3.5 text-amber-500" />
                      Park Open Question
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveStep1}
                    disabled={isSavingStep1 || isVaultReadonly}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                  >
                    {isSavingStep1 ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    Save Step 1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleSaveStep1();
                      setOpenStep(2);
                    }}
                    className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Next: 7 Startup Hats
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* STEP 2: "7 STARTUP HATS" ROLE MATRIX & EXTERNAL ADVISORS */}
      <div id="module-f-step-2" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 2 ? (
          /* Collapsed Step 2 Card */
          <div
            onClick={() => setOpenStep(2)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-2xs ${
                    step2Complete ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}
                >
                  {step2Complete ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                      Step 2: "7 Startup Hats" Role Matrix &amp; External Advisors
                    </h3>
                    <Badge
                      variant={step2Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 ${
                        step2Complete
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {step2Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {step2Complete
                      ? `All 7 Hats assigned across ${step1Data.teamMembers.length} member(s) • ${step2Data.advisors.length} Advisor(s) • Division Narrative Ready`
                      : `${step2AssignedHatsCount} of 7 Hats assigned • Assign primary owners to avoid grant bottlenecks`}
                  </p>
                </div>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  Edit Step
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Expanded Step 2 Card */
          <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-2xs ${
                      step2Complete ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}
                  >
                    {step2Complete ? <Check className="h-4 w-4" /> : '2'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 2: "7 Startup Hats" Role Matrix &amp; External Advisors
                      </CardTitle>
                      <Badge
                        variant={step2Complete ? 'default' : 'outline'}
                        className={`text-[10px] shrink-0 ${
                          step2Complete
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {step2Complete ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Assign single-point accountability across all 7 startup functions, balance team workloads, and schedule strategic advisors (LEO Section 1 &amp; UK Innovate UK IFS Q8 compliant).
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setActiveWhyCard(activeWhyCard === 2 ? null : 2)
                    }
                    className="h-7 text-xs text-slate-500 hover:text-indigo-600"
                  >
                    <HelpCircle className="mr-1 h-3.5 w-3.5" />
                    Why Are We Asking This?
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setActiveExampleCard(activeExampleCard === 2 ? null : 2)
                    }
                    className="h-7 text-xs text-slate-500 hover:text-indigo-600"
                  >
                    <Lightbulb className="mr-1 h-3.5 w-3.5 text-amber-500" />
                    Show Me an Example
                  </Button>
                  {openStep !== 'ALL' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenStep(0)}
                      className="h-7 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Collapse Step
                      <ChevronUp className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Micro-Coaching: Why Are We Asking This? */}
              {activeWhyCard === 2 && (
                <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-950">
                  <div className="flex items-start gap-2.5">
                    <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                    <div className="space-y-1.5 leading-relaxed">
                      <p className="font-bold text-indigo-900">
                        Why Grant Assessors &amp; Investors Scrutinize the "7 Startup Hats":
                      </p>
                      <p>
                        Early-stage startups do not fail from poor ideas; they fail from single points of failure and founder burnout. Assessors evaluating Irish LEO Feasibility/Priming Grants (Section 1) and UK Innovate UK Smart Grants (Question 8: Capabilities) look for clear functional ownership across 7 indispensable hats:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-indigo-900/90">
                        <li>
                          <strong>Clear Primary Accountability:</strong> One single throat to choke for every critical area so nothing falls through the cracks.
                        </li>
                        <li>
                          <strong>Business Continuity Redundancy:</strong> Having a designated backup owner protects the company if a founder falls ill or travels.
                        </li>
                        <li>
                          <strong>Workload Health:</strong> A founder holding 6 or 7 hats is a major execution risk flag. Assessors want to see realistic weekly commitments and plans to recruit or outsource.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Micro-Coaching: Show Me an Example */}
              {activeExampleCard === 2 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
                  <div className="flex items-start gap-2.5">
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div className="space-y-1.5 leading-relaxed">
                      <p className="font-bold text-amber-900">
                        High-Scoring Grant Example: 2-Founder Team + Advisory Board
                      </p>
                      <p>
                        <strong>Founder 1 (CEO):</strong> Primary for Vision &amp; Fundraising (12h), Sales &amp; Commercial BD (15h), Customer Support (8h). Total: 35h/wk. Backup for Tech Build.
                      </p>
                      <p>
                        <strong>Founder 2 (CTO):</strong> Primary for Product &amp; Tech Build (25h), Ops/Legal/Compliance (8h), Marketing/Growth (10h). Total: 43h/wk. Backup for Sales.
                      </p>
                      <p>
                        <strong>Finance Hat:</strong> Co-owned with an Outsourced Fractional Bookkeeper/Accountant for VAT returns and LEO claim submission drawdowns (7h/wk).
                      </p>
                      <p>
                        <strong>Advisory Board:</strong> Ex-VP Sales at SaaS scaleup (Monthly 60-min call) + Enterprise Ireland Commercial Mentor.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* 1. Live Team Workload & Burnout Meter */}
              {(() => {
                const unassignedCount = step2Data.hatAssignments.filter(
                  (h) =>
                    !h.primaryOwnerMemberId ||
                    h.primaryOwnerMemberId === 'UNASSIGNED'
                ).length;

                return (
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">
                          Team Workload &amp; Burnout Risk Meter
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white text-slate-600 border-slate-200"
                        >
                          Live Analysis
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Calculated from primary hat hours across active team members
                      </span>
                    </div>

                    {/* Unassigned Hats Alert Banner (Full-Width to prevent grid lopsidedness) */}
                    {unassignedCount > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-amber-300 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900 shadow-2xs">
                        <div className="flex items-start sm:items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
                          <span>
                            <strong>{unassignedCount} Core Hat(s) Currently Unassigned:</strong> Grant assessors require single-point primary accountability across all 7 functions.
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-amber-700 bg-amber-100/70 border border-amber-200 rounded px-2 py-0.5">
                          Assign below or mark as Outsourced
                        </span>
                      </div>
                    )}

                    {/* Team Member Cards Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {step1Data.teamMembers.map((member, idx) => {
                        const primaryHats = step2Data.hatAssignments.filter(
                          (h) => h.primaryOwnerMemberId === member.id
                        );
                        const totalHours = primaryHats.reduce(
                          (acc, h) => acc + (Number(h.weeklyHours) || 0),
                          0
                        );
                        const isOverloaded =
                          primaryHats.length >= 5 || totalHours >= 50;
                        const isBorderline =
                          primaryHats.length === 4 ||
                          (totalHours >= 40 && totalHours < 50);

                        const memberDisplayName = member.fullName?.trim()
                          ? member.fullName
                          : `Founder #${idx + 1}`;
                        const memberRoleTitle = member.jobTitle?.trim()
                          ? member.jobTitle
                          : 'Core Team Member';

                        return (
                          <div
                            key={member.id}
                            className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all shadow-2xs ${
                              isOverloaded
                                ? 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
                                : isBorderline
                                ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              {/* Header: Name, Title & Status Badge */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white uppercase">
                                      {memberDisplayName.slice(0, 2)}
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {memberDisplayName}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 pl-7.5 text-[11px] text-slate-500 truncate">
                                    {memberRoleTitle}
                                  </p>
                                </div>
                                <Badge
                                  className={`shrink-0 text-[10px] font-medium ${
                                    isOverloaded
                                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                                      : isBorderline
                                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {isOverloaded
                                    ? 'High Burnout'
                                    : isBorderline
                                    ? 'Heavy Workload'
                                    : 'Balanced'}
                                </Badge>
                              </div>

                              {/* Metrics summary row */}
                              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                                <div className="rounded-md bg-slate-50/80 px-2 py-1.5 border border-slate-100">
                                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                    Primary Hats
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    {primaryHats.length}{' '}
                                    <span className="text-[11px] font-normal text-slate-500">/ 7</span>
                                  </span>
                                </div>
                                <div className="rounded-md bg-slate-50/80 px-2 py-1.5 border border-slate-100">
                                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                    Weekly Time
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    {totalHours}{' '}
                                    <span className="text-[11px] font-normal text-slate-500">hrs/wk</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar at bottom */}
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                <span>Capacity Target (40h)</span>
                                <span>{Math.min(100, Math.round((totalHours / 45) * 100))}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 rounded-full ${
                                    isOverloaded
                                      ? 'bg-rose-500'
                                      : isBorderline
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round((totalHours / 55) * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 2. The 7 Startup Hats Assignment Grid */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    2. "7 Startup Hats" Single-Point Accountability Grid
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign Primary and Backup ownership across all 7 functions to eliminate role ambiguity and establish business continuity.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {STARTUP_HATS_CONFIG.map((hat) => {
                    const assignment =
                      step2Data.hatAssignments.find(
                        (h) => h.hatKey === hat.key
                      ) || {
                        hatKey: hat.key,
                        title: hat.label,
                        scopeSummary: hat.description,
                        primaryOwnerMemberId: 'UNASSIGNED',
                        backupOwnerMemberId: 'UNASSIGNED',
                        weeklyHours: hat.defaultWeeklyHours,
                        confidence: 'HIGH_MASTERY' as HatConfidenceLevel,
                        notes: '',
                      };

                    const isUnassigned =
                      !assignment.primaryOwnerMemberId ||
                      assignment.primaryOwnerMemberId === 'UNASSIGNED';

                    return (
                      <div
                        key={hat.key}
                        className={`rounded-xl border p-4 shadow-2xs transition-all space-y-3 ${
                          isUnassigned
                            ? 'border-amber-200 bg-amber-50/30'
                            : 'border-slate-200 bg-white hover:border-indigo-200'
                        }`}
                      >
                        {/* Hat Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg shrink-0">{hat.emoji}</span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {hat.label}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {hat.description}
                              </p>
                            </div>
                          </div>
                          {isUnassigned ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 shrink-0"
                            >
                              Unassigned
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0"
                            >
                              Assigned
                            </Badge>
                          )}
                        </div>

                        {/* Dropdowns Row: Primary Owner + Backup Owner */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                              <span>Primary Owner (Single Point)</span>
                              {isUnassigned && (
                                <span className="text-amber-600 font-bold">
                                  * Required
                                </span>
                              )}
                            </label>
                            <select
                              value={assignment.primaryOwnerMemberId || 'UNASSIGNED'}
                              onChange={(e) =>
                                handleUpdateHatAssignment(hat.key, {
                                  primaryOwnerMemberId: e.target.value,
                                })
                              }
                              disabled={isVaultReadonly}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                            >
                              <option value="UNASSIGNED">
                                ⚠️ Currently Unassigned (Open Gap)
                              </option>
                              <optgroup label="Core Team Members">
                                {step1Data.teamMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.fullName?.trim()
                                      ? m.fullName
                                      : 'Unnamed Member'}{' '}
                                    ({m.jobTitle?.trim() ? m.jobTitle : 'Team Member'}
                                    {m.roleClassification === 'FOUNDER_PROMOTER'
                                      ? ' • Founder'
                                      : ''}
                                    )
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="External / Outsourced">
                                <option value="FRACTIONAL_EXTERNAL">
                                  💼 Outsourced Contractor / Agency
                                </option>
                              </optgroup>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700">
                              Backup Owner (Continuity)
                            </label>
                            <select
                              value={assignment.backupOwnerMemberId || 'UNASSIGNED'}
                              onChange={(e) =>
                                handleUpdateHatAssignment(hat.key, {
                                  backupOwnerMemberId: e.target.value,
                                })
                              }
                              disabled={isVaultReadonly}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                            >
                              <option value="UNASSIGNED">
                                None / Single Owner Only
                              </option>
                              <optgroup label="Core Team Members">
                                {step1Data.teamMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.fullName?.trim()
                                      ? m.fullName
                                      : 'Unnamed Member'}{' '}
                                    ({m.jobTitle?.trim() ? m.jobTitle : 'Team Member'})
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="External / Outsourced">
                                <option value="FRACTIONAL_EXTERNAL">
                                  💼 Fractional / External Partner
                                </option>
                              </optgroup>
                            </select>
                          </div>
                        </div>

                        {/* Hours & Confidence Level Row */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                              <span>Hours / Week</span>
                              <span className="text-[10px] text-slate-400">
                                (typ. ~{hat.defaultWeeklyHours}h)
                              </span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={80}
                              value={assignment.weeklyHours}
                              onChange={(e) =>
                                handleUpdateHatAssignment(hat.key, {
                                  weeklyHours:
                                    Number(e.target.value) || 0,
                                })
                              }
                              disabled={isVaultReadonly}
                              className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-slate-600">
                              Domain Competence Level
                            </label>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {[
                                {
                                  value: 'HIGH_MASTERY' as const,
                                  label: 'High Mastery',
                                  activeClass:
                                    'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
                                },
                                {
                                  value: 'LEARNING_ON_THE_JOB' as const,
                                  label: 'Learning',
                                  activeClass:
                                    'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
                                },
                                {
                                  value: 'SKILL_GAP' as const,
                                  label: 'Skill Gap',
                                  activeClass:
                                    'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
                                },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateHatAssignment(hat.key, {
                                      confidence: opt.value,
                                    })
                                  }
                                  disabled={isVaultReadonly}
                                  className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
                                    assignment.confidence === opt.value
                                      ? opt.activeClass
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Specific Deliverables Notes */}
                        <div>
                          <input
                            type="text"
                            value={assignment.notes || ''}
                            onChange={(e) =>
                              handleUpdateHatAssignment(hat.key, {
                                notes: e.target.value,
                              })
                            }
                            placeholder="Key specific deliverable, e.g. closing first 10 pilot accounts, sprint velocity..."
                            disabled={isVaultReadonly}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-[11px] text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Strategic Advisory Board & Mentors */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      3. Strategic Advisory Board &amp; Industry Mentors (Non-Executive)
                    </h3>
                    <p className="text-xs text-slate-500">
                      LEO mentorship panels, Enterprise Ireland advisors, university spin-out mentors, or sector veterans.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {step2Data.advisors.length > 1 && (
                      <div className="flex items-center gap-1 mr-1 border-r border-slate-200 pr-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllAdvisors(true)}
                          className="h-7 px-2 text-[11px] text-slate-600 hover:text-indigo-600"
                        >
                          Expand All
                        </Button>
                        <span className="text-slate-300">•</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllAdvisors(false)}
                          className="h-7 px-2 text-[11px] text-slate-600 hover:text-indigo-600"
                        >
                          Collapse All
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAdvisor}
                      disabled={isVaultReadonly}
                      className="text-xs border-indigo-200 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-100"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Advisor / Mentor
                    </Button>
                  </div>
                </div>

                {step2Data.advisors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                    <Users className="mx-auto h-7 w-7 text-slate-400 mb-2" />
                    <p className="text-xs font-medium text-slate-700">
                      No external advisors added yet (Optional but Highly Recommended for Grants)
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 mb-3">
                      Listing 1–2 credible industry advisors or an assigned LEO mentor dramatically increases grant scoring without requiring equity dilution.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAdvisor}
                      disabled={isVaultReadonly}
                      className="text-xs border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add First Advisor or Mentor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {step2Data.advisors.map((advisor, index) => {
                      const isAdvisorOpen = openAdvisorIds[advisor.id] ?? false;
                      const isAdvisorComplete =
                        Boolean(advisor.name.trim()) &&
                        Boolean(advisor.roleOrSpecialty.trim());

                      const cadenceLabel =
                        advisor.cadence === 'MONTHLY'
                          ? 'Monthly Advisory'
                          : advisor.cadence === 'QUARTERLY'
                          ? 'Quarterly Board'
                          : advisor.cadence === 'BI_WEEKLY'
                          ? 'Bi-Weekly Tactical'
                          : 'Ad-Hoc Mentorship';

                      // Collapsed State: Concise preview card matching team section
                      if (!isAdvisorOpen) {
                        return (
                          <div
                            key={advisor.id}
                            onClick={() => toggleAdvisorCollapse(advisor.id)}
                            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                {/* Number Avatar Pill */}
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-2xs ${
                                    isAdvisorComplete
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-indigo-100 text-indigo-700'
                                  }`}
                                >
                                  {isAdvisorComplete ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    `#${index + 1}`
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="truncate text-xs sm:text-sm font-bold text-slate-900">
                                      {advisor.name.trim() || `Advisor #${index + 1} (Strategic Mentor)`}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0"
                                    >
                                      {cadenceLabel}
                                    </Badge>
                                    {isAdvisorComplete ? (
                                      <Badge
                                        variant="default"
                                        className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]"
                                      >
                                        Profile Ready
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="border-amber-300 bg-amber-50 text-amber-800 text-[10px]"
                                      >
                                        Needs Details
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-0.5 truncate text-xs text-slate-500">
                                    {advisor.roleOrSpecialty.trim() || 'Non-Executive Advisor / Industry Veteran'}
                                    {advisor.organizationOrAffiliation?.trim()
                                      ? ` • ${advisor.organizationOrAffiliation.trim()}`
                                      : ''}
                                    {advisor.notes?.trim()
                                      ? ` • ${advisor.notes.trim()}`
                                      : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="ml-3 flex shrink-0 items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                                >
                                  <span>Edit Advisor</span>
                                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Expanded State: Full Editor Form
                      return (
                        <div
                          key={advisor.id}
                          className="rounded-xl border border-indigo-200 bg-white p-4 sm:p-5 shadow-xs space-y-4"
                        >
                          {/* Advisor Tile Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 shadow-2xs">
                                #{index + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">
                                    {advisor.name.trim() || `Advisor #${index + 1} (Strategic Mentor)`}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0"
                                  >
                                    {cadenceLabel}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {advisor.roleOrSpecialty.trim() || 'Non-Executive Advisor / Industry Veteran'}
                                  {advisor.organizationOrAffiliation?.trim()
                                    ? ` • ${advisor.organizationOrAffiliation.trim()}`
                                    : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAdvisorCollapse(advisor.id)}
                                className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              >
                                <span>Collapse</span>
                                <ChevronUp className="ml-1 h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAdvisor(advisor.id)}
                                disabled={isVaultReadonly}
                                className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                                title="Remove advisor"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Advisor Form: Perfectly Aligned 2-Column Grid */}
                          <div className="space-y-3">
                            {/* Row 1: Name + Specialty */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Advisor Full Name
                                </label>
                                <input
                                  type="text"
                                  value={advisor.name}
                                  onChange={(e) =>
                                    handleUpdateAdvisor(advisor.id, {
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Dr. Aoife O'Brien"
                                  disabled={isVaultReadonly}
                                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Specialty / Advisory Domain
                                </label>
                                <input
                                  type="text"
                                  value={advisor.roleOrSpecialty}
                                  onChange={(e) =>
                                    handleUpdateAdvisor(advisor.id, {
                                      roleOrSpecialty: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. B2B Enterprise SaaS GTM &amp; Outbound Sales"
                                  disabled={isVaultReadonly}
                                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                                />
                              </div>
                            </div>

                            {/* Row 2: Organization/Background + Cadence */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Organization &amp; Prior Track Record
                                </label>
                                <input
                                  type="text"
                                  value={advisor.organizationOrAffiliation || ''}
                                  onChange={(e) =>
                                    handleUpdateAdvisor(advisor.id, {
                                      organizationOrAffiliation: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Ex-VP Sales at Stripe / LEO Mentorship Panel"
                                  disabled={isVaultReadonly}
                                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Engagement Cadence
                                </label>
                                <select
                                  value={advisor.cadence}
                                  onChange={(e) =>
                                    handleUpdateAdvisor(advisor.id, {
                                      cadence: e.target.value as
                                        | 'MONTHLY'
                                        | 'QUARTERLY'
                                        | 'BI_WEEKLY'
                                        | 'AD_HOC',
                                    })
                                  }
                                  disabled={isVaultReadonly}
                                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                                >
                                  <option value="MONTHLY">Monthly Formal Advisory Call (60 min)</option>
                                  <option value="QUARTERLY">Quarterly Strategy Board Review</option>
                                  <option value="BI_WEEKLY">Bi-Weekly Tactical Check-in (30 min)</option>
                                  <option value="AD_HOC">Ad-Hoc / On-Demand Mentorship</option>
                                </select>
                              </div>
                            </div>

                            {/* Row 3: Compensation, Terms & Value Add */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Terms, Compensation &amp; Value Add (LEO &amp; Innovate UK Annex Notes)
                              </label>
                              <input
                                type="text"
                                value={advisor.notes || ''}
                                onChange={(e) =>
                                  handleUpdateAdvisor(advisor.id, {
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="e.g. Pro-Bono via LEO Mentorship Voucher, non-voting board seat, or 0.25% advisory shares (2-yr vest)"
                                disabled={isVaultReadonly}
                                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Executive Division of Responsibilities Narrative */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      4. Executive Division of Responsibilities Narrative (LEO Section 1 &amp; UK Innovate UK IFS Q8)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Synthesized grant-ready summary articulating team balance, domain competence, and risk mitigation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAiDraftRoleMatrixSummary}
                      disabled={isVaultReadonly || isDraftingStep2Ai}
                      className="text-xs border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                    >
                      {isDraftingStep2Ai ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                      )}
                      Auto-Draft with AI
                    </Button>
                    <Badge
                      variant={
                        step2Data.executiveDivisionSummary
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length >= 50
                          ? 'default'
                          : 'outline'
                      }
                      className={`text-[10px] ${
                        step2Data.executiveDivisionSummary
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length >= 50
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {
                        step2Data.executiveDivisionSummary
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length
                      }{' '}
                      Words{' '}
                      {step2Data.executiveDivisionSummary
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length >= 50
                        ? '✓ Ready for Appendix'
                        : '(Target 100–220 words)'}
                    </Badge>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={step2Data.executiveDivisionSummary}
                  onChange={(e) =>
                    setStep2Data((prev) => ({
                      ...prev,
                      executiveDivisionSummary: e.target.value,
                    }))
                  }
                  placeholder="Click 'Auto-Draft with AI' to automatically synthesize the 7-hat distribution, primary owners, and advisory coverage into a formal narrative suitable for Irish LEO Form Section 1 and UK Innovate UK Question 8..."
                  disabled={isVaultReadonly}
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs focus:border-indigo-500 focus:outline-hidden leading-relaxed"
                />

                {step2Data.aiCoachTip && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs text-indigo-900 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">AI Pre-Flight Note: </span>
                      <span>{step2Data.aiCoachTip}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Toolbar: Park Open Question + Save Step 2 + Next Step */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2">
                  {onParkOpenQuestion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onParkOpenQuestion(
                          'Resolve unassigned functional hats or evaluate fractional contractors to relieve founder operational overload before grant submission.'
                        )
                      }
                      className="text-xs text-slate-600"
                    >
                      <BookmarkPlus className="mr-1 h-3.5 w-3.5 text-amber-500" />
                      Park Open Question
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveStep2}
                    disabled={isSavingStep2 || isVaultReadonly}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                  >
                    {isSavingStep2 ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    Save Step 2
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleSaveStep2();
                      setOpenStep(3);
                    }}
                    className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Next: Survival Budget
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ======================================================================== */}
      {/* STEP 3: PERSONAL SURVIVAL BUDGET & RUNWAY (Scrollers + SUL Tab 2)       */}
      {/* ======================================================================== */}
      <div id="module-f-step-3" className="scroll-mt-24 space-y-4">
        {openStep !== 'ALL' && openStep !== 3 ? (
          // Collapsed State Card
          <div
            onClick={() => setOpenStep(3)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    step3Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {step3Complete ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                      Step 3: Founder Personal Survival Budget &amp; Living Runway
                    </h3>
                    <Badge
                      variant={step3Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 ${
                        step3Complete
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {step3Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {step3Complete
                      ? `Survival floor: ${formatPlanCurrency(
                          totalTeamMonthlyDrawingsNeed,
                          step3Data.currencyCode
                        )}/mo total drawings across ${
                          step3Data.founderBudgets.length
                        } founder${
                          step3Data.founderBudgets.length === 1 ? '' : 's'
                        } • UK Start Up Loans Tab #2 compliant`
                      : '6-line interactive living budget scrollers & personal savings runway'}
                  </p>
                </div>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  Edit Step
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Expanded State Card
          <Card className="rounded-xl border border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      step3Complete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {step3Complete ? <Check className="h-4 w-4" /> : '3'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 3: Founder Personal Survival Budget &amp; Living Runway
                      </CardTitle>
                      <Badge
                        variant={step3Complete ? 'default' : 'outline'}
                        className={`text-[10px] shrink-0 ${
                          step3Complete
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {step3Complete ? 'Completed' : 'In Progress'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 bg-slate-50 text-slate-600 border-slate-200"
                      >
                        UK Start Up Loans Tab #2 &amp; IE LEO Section 1 Compliant
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Establish your essential monthly survival floor using interactive scrollers. Grant assessors and loan underwriters use this to verify promoter financial runway so you never burn out or face premature cash strain.
                    </CardDescription>
                  </div>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenStep(null as any)}
                    className="h-8 text-xs text-slate-500 hover:text-slate-900 shrink-0"
                  >
                    <span>Collapse Step</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* 4-Layer Built-in Support: Micro-Coaching */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActiveWhyCard((prev) => (prev === 3 ? null : 3))
                  }
                  className="h-7 text-xs border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100"
                >
                  <HelpCircle className="mr-1 h-3.5 w-3.5" />
                  Why Are We Asking This?
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActiveExampleCard((prev) => (prev === 3 ? null : 3))
                  }
                  className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="mr-1 h-3.5 w-3.5 text-slate-500" />
                  Show Underwriter Benchmarks
                </Button>
              </div>

              {/* Collapsible "Why Are We Asking This" Box */}
              {activeWhyCard === 3 && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950">
                  <div className="flex items-center justify-between gap-2 font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Grant Assessor &amp; Loan Underwriter Reality Check:
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveWhyCard(null)}
                      className="text-indigo-400 hover:text-indigo-700 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="leading-relaxed">
                    Underwriters at the <strong>British Business Bank (Start Up Loans)</strong> underwrite loans to you individually and require the <strong>Part 2 Personal Survival Budget</strong> to verify you can afford loan repayments. In Ireland, <strong>LEO Feasibility &amp; Priming Grants</strong> provide up to €15,000 per promoter in salary support — assessors review your personal drawings floor to verify you have sufficient runway to execute without abandoning the venture.
                  </p>
                </div>
              )}

              {/* Collapsible Example Box */}
              {activeExampleCard === 3 && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
                  <div className="flex items-center justify-between gap-2 font-bold mb-1">
                    <span>Typical Founder Survival Benchmarks (UK &amp; Ireland):</span>
                    <button
                      type="button"
                      onClick={() => setActiveExampleCard(null)}
                      className="text-slate-400 hover:text-slate-700 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>
                      <strong>Lean Solo Founder:</strong> €1,300–€1,600 / £1,100–£1,400 monthly baseline (shared flat, public transit, lean grocery spend).
                    </li>
                    <li>
                      <strong>Dual-Income Household:</strong> €1,900–€2,400 / £1,600–£2,000 monthly (partner covers half the rent/mortgage, modest buffer).
                    </li>
                    <li>
                      <strong>Family / Mortgage:</strong> €2,800–€3,800 / £2,400–£3,200 monthly (mortgage, dependents/childcare, vehicle commitments).
                    </li>
                  </ul>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Multi-Founder Tab Switcher (if > 1 founder) */}
              {step3Data.founderBudgets.length > 1 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 px-2">
                    Select Founder Profile to Review / Edit:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {step3Data.founderBudgets.map((b, idx) => {
                      const isActive =
                        (activeFounderBudgetId ||
                          step3Data.founderBudgets[0]?.memberId) === b.memberId;
                      const memberGross =
                        b.housingAndUtilities +
                        b.groceriesAndEssentials +
                        b.transportAndCommute +
                        b.debtAndLoanCommitments +
                        b.dependentsAndFamily;
                      const memberNet = Math.max(
                        0,
                        memberGross - b.incomeOffsetCushion
                      );

                      return (
                        <button
                          key={b.memberId}
                          type="button"
                          onClick={() => setActiveFounderBudgetId(b.memberId)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-200 ring-1 ring-indigo-500/20'
                              : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white uppercase">
                            {b.memberName.slice(0, 2)}
                          </div>
                          <span>{b.memberName}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-600">
                            {formatPlanCurrency(
                              memberNet,
                              step3Data.currencyCode
                            )}
                            /mo
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Founder Budget Form */}
              {(() => {
                const activeFounder =
                  step3Data.founderBudgets.find(
                    (b) =>
                      b.memberId ===
                      (activeFounderBudgetId ||
                        step3Data.founderBudgets[0]?.memberId)
                  ) || step3Data.founderBudgets[0];

                if (!activeFounder) {
                  return (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                      No founder profile found. Please add a founder in Step 1.
                    </div>
                  );
                }

                const grossOutgoings =
                  (activeFounder.housingAndUtilities || 0) +
                  (activeFounder.groceriesAndEssentials || 0) +
                  (activeFounder.transportAndCommute || 0) +
                  (activeFounder.debtAndLoanCommitments || 0) +
                  (activeFounder.dependentsAndFamily || 0);

                const netSurvivalNeed = Math.max(
                  0,
                  grossOutgoings - (activeFounder.incomeOffsetCushion || 0)
                );

                const monthlySavingsBurn = netSurvivalNeed;
                const personalRunwayMonths =
                  monthlySavingsBurn > 0
                    ? Number(
                        (
                          (activeFounder.personalSavingsBuffer || 0) /
                          monthlySavingsBurn
                        ).toFixed(1)
                      )
                    : 99;

                const isRunwayHealthy = personalRunwayMonths >= 6;
                const isRunwayModerate =
                  personalRunwayMonths >= 3 && personalRunwayMonths < 6;

                return (
                  <div className="space-y-6">
                    {/* 1. Quick Presets Bar */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-xs font-bold text-slate-900">
                          1. Quick Jump-Start Presets (Click to Auto-Fill Scrollers)
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Editing budget for: <strong>{activeFounder.memberName}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                        {SURVIVAL_BUDGET_PRESETS.map((p) => {
                          const isSelected = activeFounder.presetUsed === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() =>
                                handleApplyBudgetPreset(activeFounder.memberId, p.id)
                              }
                              disabled={isVaultReadonly}
                              className={`rounded-xl border p-3 text-left transition-all ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs ring-1 ring-indigo-600'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{p.emoji}</span>
                                  <span>{p.label}</span>
                                </span>
                                {isSelected && (
                                  <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-slate-600 mb-1">
                                {p.tagline}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {p.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. The 6 Essential Living Cost Scrollers */}
                    <div className="space-y-4 pt-3 border-t border-slate-100">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          2. Essential Living Outgoings &amp; Offset Cushion (Monthly)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Use the interactive scrollers or type exact figures. These match the required British Business Bank Tab #2 categories and Irish LEO personal living schedules.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Bucket 1: Housing & Utilities */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>🏠</span>
                                <span>Housing &amp; Home Utilities</span>
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Rent / Mortgage, Council/Property Tax, Energy &amp; Broadband
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-slate-500">
                                {step3Data.currencyCode === 'GBP' ? '£' : '€'}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={5000}
                                step={25}
                                value={activeFounder.housingAndUtilities}
                                onChange={(e) =>
                                  handleUpdateFounderBudget(activeFounder.memberId, {
                                    housingAndUtilities: Number(e.target.value) || 0,
                                    presetUsed: 'CUSTOM',
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={3500}
                              step={25}
                              value={activeFounder.housingAndUtilities}
                              onChange={(e) =>
                                handleUpdateFounderBudget(activeFounder.memberId, {
                                  housingAndUtilities: Number(e.target.value) || 0,
                                  presetUsed: 'CUSTOM',
                                })
                              }
                              disabled={isVaultReadonly}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0</span>
                              <span>1,000</span>
                              <span>2,000</span>
                              <span>3,500+</span>
                            </div>
                          </div>
                        </div>

                        {/* Bucket 2: Groceries & Essentials */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>🛒</span>
                                <span>Groceries &amp; Daily Essentials</span>
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Food, household consumables, personal care &amp; pharmacy
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-slate-500">
                                {step3Data.currencyCode === 'GBP' ? '£' : '€'}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={2500}
                                step={20}
                                value={activeFounder.groceriesAndEssentials}
                                onChange={(e) =>
                                  handleUpdateFounderBudget(activeFounder.memberId, {
                                    groceriesAndEssentials: Number(e.target.value) || 0,
                                    presetUsed: 'CUSTOM',
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={1500}
                              step={20}
                              value={activeFounder.groceriesAndEssentials}
                              onChange={(e) =>
                                handleUpdateFounderBudget(activeFounder.memberId, {
                                  groceriesAndEssentials: Number(e.target.value) || 0,
                                  presetUsed: 'CUSTOM',
                                })
                              }
                              disabled={isVaultReadonly}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0</span>
                              <span>500</span>
                              <span>1,000</span>
                              <span>1,500+</span>
                            </div>
                          </div>
                        </div>

                        {/* Bucket 3: Transport & Commute */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>🚗</span>
                                <span>Transport, Fuel &amp; Commute</span>
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Fuel, car insurance, road tax, public transit, train pass
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-slate-500">
                                {step3Data.currencyCode === 'GBP' ? '£' : '€'}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={1500}
                                step={15}
                                value={activeFounder.transportAndCommute}
                                onChange={(e) =>
                                  handleUpdateFounderBudget(activeFounder.memberId, {
                                    transportAndCommute: Number(e.target.value) || 0,
                                    presetUsed: 'CUSTOM',
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={1000}
                              step={15}
                              value={activeFounder.transportAndCommute}
                              onChange={(e) =>
                                handleUpdateFounderBudget(activeFounder.memberId, {
                                  transportAndCommute: Number(e.target.value) || 0,
                                  presetUsed: 'CUSTOM',
                                })
                              }
                              disabled={isVaultReadonly}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0</span>
                              <span>300</span>
                              <span>600</span>
                              <span>1,000+</span>
                            </div>
                          </div>
                        </div>

                        {/* Bucket 4: Debt & Loan Commitments */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>💳</span>
                                <span>Existing Debt &amp; Credit Lines</span>
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Credit cards, car finance / PCP, personal loans, overdraft
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-slate-500">
                                {step3Data.currencyCode === 'GBP' ? '£' : '€'}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={3000}
                                step={25}
                                value={activeFounder.debtAndLoanCommitments}
                                onChange={(e) =>
                                  handleUpdateFounderBudget(activeFounder.memberId, {
                                    debtAndLoanCommitments: Number(e.target.value) || 0,
                                    presetUsed: 'CUSTOM',
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={1500}
                              step={25}
                              value={activeFounder.debtAndLoanCommitments}
                              onChange={(e) =>
                                handleUpdateFounderBudget(activeFounder.memberId, {
                                  debtAndLoanCommitments: Number(e.target.value) || 0,
                                  presetUsed: 'CUSTOM',
                                })
                              }
                              disabled={isVaultReadonly}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0</span>
                              <span>350</span>
                              <span>700</span>
                              <span>1,500+</span>
                            </div>
                          </div>
                        </div>

                        {/* Bucket 5: Dependents & Family */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>👶</span>
                                <span>Dependents, Family &amp; Health</span>
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Childcare/creche, school costs, dependents, health cover
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-slate-500">
                                {step3Data.currencyCode === 'GBP' ? '£' : '€'}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={2500}
                                step={25}
                                value={activeFounder.dependentsAndFamily}
                                onChange={(e) =>
                                  handleUpdateFounderBudget(activeFounder.memberId, {
                                    dependentsAndFamily: Number(e.target.value) || 0,
                                    presetUsed: 'CUSTOM',
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={1500}
                              step={25}
                              value={activeFounder.dependentsAndFamily}
                              onChange={(e) =>
                                handleUpdateFounderBudget(activeFounder.memberId, {
                                  dependentsAndFamily: Number(e.target.value) || 0,
                                  presetUsed: 'CUSTOM',
                                })
                              }
                              disabled={isVaultReadonly}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0</span>
                              <span>400</span>
                              <span>800</span>
                              <span>1,500+</span>
                            </div>
                          </div>
                        </div>

                        {/* Bucket 6: Non-Startup Income Cushion (Offset) */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                <span>🛡️</span>
                                <span>Income Offset Cushion (Reduces Drawings)</span>
                              </span>
                              <p className="text-[11px] text-emerald-700">
                                Partner household contribution, part-time earnings, passive income
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-emerald-700">
                                {step3Data.currencyCode === 'GBP' ? '£' : '€'}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={4000}
                                step={50}
                                value={activeFounder.incomeOffsetCushion}
                                onChange={(e) =>
                                  handleUpdateFounderBudget(activeFounder.memberId, {
                                    incomeOffsetCushion: Number(e.target.value) || 0,
                                    presetUsed: 'CUSTOM',
                                  })
                                }
                                disabled={isVaultReadonly}
                                className="h-8 w-24 rounded-lg border border-emerald-300 px-2 text-right text-xs font-bold text-emerald-900 bg-white focus:border-emerald-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={2500}
                              step={50}
                              value={activeFounder.incomeOffsetCushion}
                              onChange={(e) =>
                                handleUpdateFounderBudget(activeFounder.memberId, {
                                  incomeOffsetCushion: Number(e.target.value) || 0,
                                  presetUsed: 'CUSTOM',
                                })
                              }
                              disabled={isVaultReadonly}
                              className="w-full accent-emerald-600 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-emerald-700/60">
                              <span>0</span>
                              <span>750</span>
                              <span>1,500</span>
                              <span>2,500+</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Personal Savings Cushion & Runway Scroller */}
                    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/50 p-4 sm:p-5 shadow-2xs space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <PiggyBank className="h-4 w-4 text-indigo-600" />
                            <span>3. Personal Savings Buffer (Liquid Living Reserves)</span>
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Cash savings allocated specifically to cover your personal living costs before the company or grants begin paying you a formal salary.
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-bold text-slate-500">
                            {step3Data.currencyCode === 'GBP' ? '£' : '€'}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100000}
                            step={500}
                            value={activeFounder.personalSavingsBuffer}
                            onChange={(e) =>
                              handleUpdateFounderBudget(activeFounder.memberId, {
                                personalSavingsBuffer: Number(e.target.value) || 0,
                              })
                            }
                            disabled={isVaultReadonly}
                            className="h-8 w-28 rounded-lg border border-slate-300 px-2 text-right text-xs font-bold text-slate-900 bg-white focus:border-indigo-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="range"
                          min={0}
                          max={50000}
                          step={500}
                          value={activeFounder.personalSavingsBuffer}
                          onChange={(e) =>
                            handleUpdateFounderBudget(activeFounder.memberId, {
                              personalSavingsBuffer: Number(e.target.value) || 0,
                            })
                          }
                          disabled={isVaultReadonly}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>0</span>
                          <span>10k</span>
                          <span>20k</span>
                          <span>30k</span>
                          <span>50k+</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Live Visual Scorecard: Survival Floor + Runway + Underwriter Verification */}
                    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-4 sm:p-5 text-white shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Live Financial Feasibility &amp; Grant Scorecard
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-200">
                          Founder: <strong>{activeFounder.memberName}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {/* Metric 1: Monthly Survival Need */}
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-xs border border-white/10">
                          <span className="text-[10px] uppercase font-semibold text-indigo-200 block">
                            Monthly Survival Floor
                          </span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-lg sm:text-xl font-extrabold text-white">
                              {formatPlanCurrency(
                                netSurvivalNeed,
                                step3Data.currencyCode
                              )}
                            </span>
                            <span className="text-[11px] text-indigo-200">/ mo</span>
                          </div>
                          <p className="mt-1 text-[10px] text-indigo-300">
                            {formatPlanCurrency(
                              grossOutgoings,
                              step3Data.currencyCode
                            )}{' '}
                            gross outgoings −{' '}
                            {formatPlanCurrency(
                              activeFounder.incomeOffsetCushion,
                              step3Data.currencyCode
                            )}{' '}
                            offset
                          </p>
                        </div>

                        {/* Metric 2: Personal Runway */}
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-xs border border-white/10">
                          <span className="text-[10px] uppercase font-semibold text-indigo-200 block">
                            Personal Living Runway
                          </span>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-lg sm:text-xl font-extrabold text-white">
                              {personalRunwayMonths >= 99
                                ? 'Fully Buffered'
                                : `${personalRunwayMonths} Mo.`}
                            </span>
                            <Badge
                              className={`text-[9px] px-1.5 py-0 ${
                                isRunwayHealthy
                                  ? 'bg-emerald-500 text-white'
                                  : isRunwayModerate
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-rose-500 text-white'
                              }`}
                            >
                              {isRunwayHealthy
                                ? 'Healthy Runway'
                                : isRunwayModerate
                                ? 'Moderate Buffer'
                                : 'Tight Runway'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[10px] text-indigo-300">
                            {formatPlanCurrency(
                              activeFounder.personalSavingsBuffer,
                              step3Data.currencyCode
                            )}{' '}
                            savings reserves
                          </p>
                        </div>

                        {/* Metric 3: Grant & Loan Match */}
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-xs border border-white/10">
                          <span className="text-[10px] uppercase font-semibold text-indigo-200 block">
                            Underwriter Compliance
                          </span>
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {selectedCountry === 'GB'
                                ? 'SUL Tab #2 Ready'
                                : 'LEO Section 1 Verified'}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-indigo-300 leading-snug">
                            {selectedCountry === 'GB'
                              ? 'Outputs Part 2 Personal Survival Budget for British Business Bank.'
                              : 'Eligible for 50% LEO Priming Salary Grant up to €15,000/promoter.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Step 3 Toolbar: Park Open Question + Save Step 3 + Next Step */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2">
                  {onParkOpenQuestion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onParkOpenQuestion(
                          'Confirm exact personal living buffer and minimum drawings timeline before committing to full-time resignation date.'
                        )
                      }
                      className="text-xs text-slate-600"
                    >
                      <BookmarkPlus className="mr-1 h-3.5 w-3.5 text-amber-500" />
                      Park Open Question
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveStep3}
                    disabled={isSavingStep3 || isVaultReadonly}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                  >
                    {isSavingStep3 ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    Save Step 3
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleSaveStep3();
                      setOpenStep(4);
                    }}
                    className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Next: Co-Founder Alignment
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ======================================================================== */}
      {/* STEP 4: 20 AWKWARD CO-FOUNDER QUESTIONS & FOUNDER PRENUP ENGINE         */}
      {/* ======================================================================== */}
      <div id="module-f-step-4" className="scroll-mt-24 space-y-4">
        {openStep !== 'ALL' && openStep !== 4 ? (
          // Collapsed State Card
          <div
            onClick={() => setOpenStep(4)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    step4Complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {step4Complete ? <Check className="h-4 w-4" /> : '4'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                      Step 4: {isSoloFounderMode
                        ? 'The 20 Hard Questions Every Solo Founder Must Answer'
                        : '20 Awkward Co-Founder Questions & The Founder Prenup'}
                    </h3>
                    <Badge
                      variant={step4Complete ? 'default' : 'outline'}
                      className={`text-[10px] shrink-0 ${
                        step4Complete
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {step4Complete ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {isSoloFounderMode
                      ? `${answeredQuestionsCountForActiveFounder}/20 Hard Questions Answered • Founder Charter & Candidate Screener`
                      : `${answeredQuestionsCountForActiveFounder}/20 Answered • ${
                          step4Data.isRevealed
                            ? 'Side-by-Side Heatmap Revealed'
                            : 'Blind-Reveal Survey Mode Active'
                        }`}
                  </p>
                </div>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  Edit Step
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Expanded State Card
          <Card className="rounded-xl border border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      step4Complete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {step4Complete ? <Check className="h-4 w-4" /> : '4'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 4: {isSoloFounderMode
                          ? 'The 20 Hard Questions Every Solo Founder Must Answer'
                          : '20 Awkward Co-Founder Questions & The Founder Prenup'}
                      </CardTitle>
                      <Badge
                        variant={step4Complete ? 'default' : 'outline'}
                        className={`text-[10px] shrink-0 ${
                          step4Complete
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {step4Complete ? 'Completed' : 'In Progress'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] shrink-0 bg-slate-50 text-slate-600 border-slate-200"
                      >
                        {isSoloFounderMode
                          ? 'Solo Founder Charter & Screener'
                          : 'Blind-Reveal Survey & Prenup Matrix'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      {isSoloFounderMode
                        ? '65% of startups fail due to co-founder fallout. Answer these 20 non-negotiables now so you know your exact boundaries, equity criteria, and expectations before bringing on a partner.'
                        : 'Stress-test quit triggers, salary timelines, deadlock tie-breakers, and reverse vesting before signing official Shareholders Agreements. Answer privately, then reveal your side-by-side compatibility heatmap.'}
                    </CardDescription>
                  </div>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenStep(null as any)}
                    className="shrink-0 text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Collapse Step
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Micro-Coaching Popovers */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100/80">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setActiveWhyCard(activeWhyCard === 4 ? null : 4)
                  }
                  className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
                >
                  <HelpCircle className="mr-1 h-3.5 w-3.5 text-indigo-500" />
                  Why Are We Asking These 20 Questions?
                  <ChevronDown
                    className={`ml-1 h-3 w-3 transition-transform ${
                      activeWhyCard === 4 ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setActiveExampleCard(activeExampleCard === 4 ? null : 4)
                  }
                  className="h-7 text-xs text-slate-600 hover:bg-slate-100"
                >
                  <Lightbulb className="mr-1 h-3.5 w-3.5 text-amber-500" />
                  Harvard Dilemmas &amp; Fall-Out Realities
                  <ChevronDown
                    className={`ml-1 h-3 w-3 transition-transform ${
                      activeExampleCard === 4 ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </div>

              {activeWhyCard === 4 && (
                <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-950">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                    <HeartHandshake className="h-4 w-4 text-indigo-600" />
                    <span>Why The Founder Prenup Prevents Early Startup Death</span>
                  </div>
                  <p className="leading-relaxed">
                    Most founder breakups do not happen because of malice; they happen because of <strong>unspoken assumptions</strong>. One founder assumes a 50/50 split means equal sacrifice today, while the other founder is moonlighting. One assumes nobody takes a salary for 2 years, while the other faces a mortgage crunch in month 4. By answering these 20 specific, battle-tested scenarios upfront, you create complete psychological safety and an objective operating charter.
                  </p>
                </div>
              )}

              {activeExampleCard === 4 && (
                <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                    <Info className="h-4 w-4 text-amber-600" />
                    <span>HBS Research &amp; The Top 4 Co-Founder Traps</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-900 leading-relaxed">
                    <li>
                      <strong>The Quick 50/50 Trap:</strong> 73% of teams split equity in under 1 day. Teams that spend over 1 week negotiating roles and vesting survive 2.5x longer.
                    </li>
                    <li>
                      <strong>The Salary Shock:</strong> Differences in personal savings runway are the leading reason co-founders secretly accept corporate recruiter outreach.
                    </li>
                    <li>
                      <strong>The Deadlock Void:</strong> Without a pre-agreed casting vote or domain tie-breaker, simple disputes freeze company bank accounts.
                    </li>
                    <li>
                      <strong>The Absent Vesting Schedule:</strong> A founder leaves after 3 months with 40% of the cap table, rendering the company permanently un-fundable.
                    </li>
                  </ul>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* Founder Switcher (if multiple founders logged) */}
              {step4Data.responses.length > 1 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Active Founder Answering Survey:
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Private response mode active • Answers are blinded until revealed
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step4Data.responses.map((resp) => {
                      const ansCount = Object.keys(resp.answers || {}).length;
                      const isActive =
                        (activeFounderAlignmentId ||
                          step4Data.responses[0]?.memberId) === resp.memberId;
                      return (
                        <button
                          key={resp.memberId}
                          type="button"
                          onClick={() =>
                            setActiveFounderAlignmentId(resp.memberId)
                          }
                          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs font-bold ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{resp.memberName}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${
                              ansCount === 20
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ansCount}/20
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5-Category Sub-Tab Navigation Bar */}
              <div className="border-b border-slate-200 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Survey Categories (20 Hard Scenarios)
                  </span>
                  <span className="text-xs font-medium text-indigo-600">
                    {answeredQuestionsCountForActiveFounder} of 20 answered for{' '}
                    <strong>{activeFounderResponse?.memberName || 'You'}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                  {AWKWARD_QUESTION_CATEGORIES.map((cat) => {
                    const catQuestions = AWKWARD_QUESTIONS_CONFIG.filter(
                      (q) => q.category === cat.id
                    );
                    const answeredInCat = catQuestions.filter(
                      (q) => activeFounderResponse?.answers?.[q.key]
                    ).length;
                    const isActive = activeQuestionCategory === cat.id;
                    const isAllDone = answeredInCat === catQuestions.length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveQuestionCategory(cat.id)}
                        className={`rounded-lg border p-2 text-left transition-all ${
                          isActive
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs ring-1 ring-indigo-500'
                            : isAllDone
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-50'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1 truncate">
                            <span>{cat.emoji}</span>
                            <span className="truncate">{cat.shortLabel}</span>
                          </span>
                          {isAllDone ? (
                            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {answeredInCat}/4
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isAllDone ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{
                              width: `${(answeredInCat / catQuestions.length) * 100}%`,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Category Questions List */}
              {(() => {
                const currentCat = AWKWARD_QUESTION_CATEGORIES.find(
                  (c) => c.id === activeQuestionCategory
                );
                const currentQuestions = AWKWARD_QUESTIONS_CONFIG.filter(
                  (q) => q.category === activeQuestionCategory
                );
                const memberIdToAnswer =
                  activeFounderResponse?.memberId ||
                  step4Data.responses[0]?.memberId ||
                  'founder-1';

                return (
                  <div className="space-y-6">
                    {/* Category Header Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{currentCat?.emoji}</span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {currentCat?.label}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {currentCat?.desc}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[11px] bg-white text-slate-600 border-slate-200"
                      >
                        4 Questions in this Category
                      </Badge>
                    </div>

                    {/* Question Cards */}
                    <div className="space-y-6">
                      {currentQuestions.map((q) => {
                        const currentAnswer =
                          activeFounderResponse?.answers?.[q.key];
                        const selectedVal = currentAnswer?.selectedOption || '';
                        const otherVal =
                          customOtherInputs[`${memberIdToAnswer}_${q.key}`] ??
                          currentAnswer?.otherText ??
                          '';

                        return (
                          <div
                            key={q.key}
                            className={`rounded-xl border p-4 sm:p-5 transition-all ${
                              selectedVal
                                ? 'border-slate-200 bg-white shadow-2xs'
                                : 'border-indigo-200/80 bg-indigo-50/20'
                            }`}
                          >
                            {/* Question Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-start gap-2.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-bold mt-0.5">
                                  {q.number}
                                </span>
                                <div>
                                  <h5 className="text-sm font-bold text-slate-900">
                                    {q.title}
                                  </h5>
                                  <p className="text-xs text-slate-600 mt-0.5">
                                    {q.subtitle}
                                  </p>
                                </div>
                              </div>
                              {selectedVal && (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] shrink-0">
                                  <Check className="h-3 w-3 mr-1" />
                                  Answered
                                </Badge>
                              )}
                            </div>

                            {/* Why it Matters Context Helper */}
                            <div className="mb-4 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                              <span className="font-semibold text-slate-800">
                                Real-World Tension:
                              </span>{' '}
                              {q.contextWhy}
                              {q.hbsStat && (
                                <span className="block mt-1 text-slate-500 font-medium">
                                  📊 <em>{q.hbsStat}</em>
                                </span>
                              )}
                            </div>

                            {/* Options Grid (Tiles) */}
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {q.options.map((opt) => {
                                const isSelected = selectedVal === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                      handleSelectQuestionOption(
                                        memberIdToAnswer,
                                        q.key,
                                        opt.value
                                      )
                                    }
                                    disabled={isVaultReadonly}
                                    className={`relative flex flex-col text-left rounded-xl border p-3.5 transition-all ${
                                      isSelected
                                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-2xs ring-2 ring-indigo-500/50'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-xs font-bold leading-tight">
                                        {opt.label}
                                      </span>
                                      <div
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                          isSelected
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-300 bg-white'
                                        }`}
                                      >
                                        {isSelected && (
                                          <Check className="h-2.5 w-2.5" />
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-slate-500">
                                      {opt.description}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Mandatory "OTHER" Inline Text Input (Rule 1.5 Edge-Case Invariant) */}
                            {selectedVal === 'OTHER' && (
                              <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                                <label className="text-xs font-bold text-indigo-950 block mb-1">
                                  Specify Your Custom Approach or Nuanced Scenario (Rule 1.5 Edge-Case):
                                </label>
                                <textarea
                                  rows={2}
                                  value={otherVal}
                                  onChange={(e) =>
                                    handleUpdateOtherText(
                                      memberIdToAnswer,
                                      q.key,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Describe your exact compromise, conditional trigger, or hybrid terms..."
                                  disabled={isVaultReadonly}
                                  className="w-full rounded-lg border border-indigo-300 bg-white p-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                                />
                              </div>
                            )}

                            {/* Private Founder Note (Optional) */}
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={currentAnswer?.privateNote || ''}
                                onChange={(e) =>
                                  handleUpdatePrivateNote(
                                    memberIdToAnswer,
                                    q.key,
                                    e.target.value
                                  )
                                }
                                placeholder="Private note (e.g. 'Must discuss over coffee before incorporating CRO entity')"
                                disabled={isVaultReadonly}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-[11px] text-slate-600 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================= */}
              {/* VISUAL SCORECARD: SOLO FOUNDER VS CO-FOUNDER TEAM DUALITY */}
              {/* ========================================================= */}
              {isSoloFounderMode ? (
                // -------------------------------------------------------------
                // MODE A: SOLO FOUNDER CHARTER & CREDIT-APPLIED UPGRADE CARD
                // -------------------------------------------------------------
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  {/* Visual Card 1: Solo Founder Charter & Candidate Screener */}
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCheck className="h-5 w-5 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Solo Founder Operating Charter &amp; Candidate Screener
                        </span>
                      </div>
                      <Badge className="bg-emerald-500 text-white text-[10px]">
                        {answeredQuestionsCountForActiveFounder}/20 Non-Negotiables Locked
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-white/10 p-3 backdrop-blur-xs border border-white/10">
                        <span className="text-[10px] uppercase font-semibold text-indigo-200 block">
                          Solo Boundary Posture
                        </span>
                        <div className="mt-1 text-base font-extrabold text-white">
                          {answeredQuestionsCountForActiveFounder >= 12
                            ? 'Charter Formed'
                            : 'In Progress'}
                        </div>
                        <p className="mt-1 text-[10px] text-indigo-300">
                          {answeredQuestionsCountForActiveFounder} of 20 hard boundaries defined before recruiting a partner.
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/10 p-3 backdrop-blur-xs border border-white/10">
                        <span className="text-[10px] uppercase font-semibold text-indigo-200 block">
                          Cap Table Protection
                        </span>
                        <div className="mt-1 text-base font-extrabold text-white">
                          4-Yr Vesting Enforced
                        </div>
                        <p className="mt-1 text-[10px] text-indigo-300">
                          Ensures zero dead equity on the cap table if a prospective co-founder leaves in Year 1.
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/10 p-3 backdrop-blur-xs border border-white/10">
                        <span className="text-[10px] uppercase font-semibold text-indigo-200 block">
                          Investor &amp; Grant Audit
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>LEO &amp; SUL Governance Pass</span>
                        </div>
                        <p className="mt-1 text-[10px] text-indigo-300">
                          Demonstrates clear founder voting authority, IP assignment, and operational leadership.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Card 2: Credit-Applied Upsell Card (Solo Pass -> Co-Founder Pass) */}
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/60 p-5 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">
                              Bringing on a Co-Founder?
                            </h4>
                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-semibold">
                              {selectedCountry === 'GB'
                                ? '£109 Solo Pass Credit Applied'
                                : '€129 Solo Pass Credit Applied'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            Since you already hold a Solo Founder Pass, 100% of your initial purchase is deducted from the Co-Founder Pack. Upgrade seamlessly to invite your business partner to take the blind-reveal survey and unlock full collaborative team capabilities.
                          </p>
                        </div>
                      </div>

                      {/* Upgrade Price Tag */}
                      <div className="rounded-xl bg-white p-3.5 border border-indigo-200 text-right shrink-0 shadow-xs">
                        <span className="text-[11px] text-slate-400 block line-through">
                          Normally {selectedCountry === 'GB' ? '£169' : '€199'}
                        </span>
                        <div className="text-xl font-black text-indigo-700">
                          {selectedCountry === 'GB' ? '£60' : '€70'}
                          <span className="text-xs font-normal text-slate-500"> one-time upgrade</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                          ✓ {selectedCountry === 'GB' ? '£109' : '€129'} Credit Deducted
                        </span>
                      </div>
                    </div>

                    {/* Key Benefits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                      <div className="rounded-lg border border-indigo-100 bg-white/80 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>3 Collaborative Seats</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Invite 2 co-founders with independent logins to complete all modules.
                        </p>
                      </div>

                      <div className="rounded-lg border border-indigo-100 bg-white/80 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Blind-Reveal Heatmap</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Responses stay locked until both founders submit, revealing hidden red flags.
                        </p>
                      </div>

                      <div className="rounded-lg border border-indigo-100 bg-white/80 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Cap Table &amp; Vesting Math</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Auto-calculates dynamic equity splits, reverse vesting, and cliff schedules.
                        </p>
                      </div>

                      <div className="rounded-lg border border-indigo-100 bg-white/80 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>3 Active Startup Plans</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Clone, test pivots, or run separate sister projects under one single account.
                        </p>
                      </div>
                    </div>

                    {/* Direct CTA Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100">
                      <p className="text-xs text-slate-600 font-medium">
                        Instant unlock • Zero subscription renewals • Works across all 12 modules
                      </p>

                      <Button
                        type="button"
                        onClick={() => {
                          alert(
                            `Upgrade to Co-Founder Pack! Special discounted upgrade cost: ${
                              selectedCountry === 'GB' ? '£60' : '€70'
                            } (Normally ${
                              selectedCountry === 'GB' ? '£169' : '€199'
                            } with your ${
                              selectedCountry === 'GB' ? '£109' : '€129'
                            } Solo Pass credit applied). Unlocks 3 collaborative seats, blind-reveal heatmap, and cap table tools.`
                          );
                        }}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs sm:text-sm font-bold shadow-sm px-5 py-2.5"
                      >
                        Upgrade to Co-Founder Pack Here
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>

                    {/* Offline Coaching Banner: Mandatory Offline Conversation */}
                    <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-3.5 mt-2">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-950 space-y-1">
                          <p className="font-bold">
                            Decided not to upgrade right now? You must still do this offline over coffee.
                          </p>
                          <p className="text-amber-900 leading-relaxed">
                            Research shows that <strong>65% of high-potential startups fail due to co-founder fallout</strong>, usually sparked by unsaid assumptions around time commitment, unpaid runway, or who breaks deadlocks. Even if you don&apos;t use our automated digital blind-reveal tool, <strong>print or jot down these 20 questions</strong> and go through every single one with any prospective partner before signing legal incorporation documents or splitting equity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // -------------------------------------------------------------
                // MODE B: CO-FOUNDER TEAM BLIND-REVEAL HEATMAP & DISPUTE REVIEW
                // -------------------------------------------------------------
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  {/* Blind-Reveal Banner & Trigger Button */}
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/70 p-5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {step4Data.isRevealed ? (
                            <Unlock className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Lock className="h-5 w-5 text-indigo-600" />
                          )}
                          <h4 className="text-sm font-bold text-slate-900">
                            {step4Data.isRevealed
                              ? 'Co-Founder Side-by-Side Alignment Heatmap (Revealed)'
                              : 'Blind-Reveal Survey Engine Active'}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                          {step4Data.isRevealed
                            ? 'Review areas of total harmony, moderate differences, and critical flashpoints below. Use the "Top 3 Things to Discuss Over Coffee" guide to finalize your Shareholders Agreement.'
                            : 'Both co-founders answer all 20 questions independently without seeing each other’s choices. Once both are ready, click "Reveal Heatmap" to uncover alignment.'}
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleToggleRevealHeatmap}
                        className={
                          step4Data.isRevealed
                            ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 text-xs'
                        }
                      >
                        {step4Data.isRevealed ? (
                          <>
                            <Lock className="mr-1 h-3.5 w-3.5" />
                            Hide Heatmap (Re-Lock)
                          </>
                        ) : (
                          <>
                            <Unlock className="mr-1 h-3.5 w-3.5" />
                            Reveal Side-by-Side Heatmap
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Side-by-Side Alignment Heatmap (Only when revealed) */}
                  {step4Data.isRevealed && (
                    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Side-by-Side Alignment Heatmap (20 Questions)
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Aligned (Green)
                          </span>
                          <span className="flex items-center gap-1 text-amber-700 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Discussion (Amber)
                          </span>
                          <span className="flex items-center gap-1 text-rose-700 font-semibold">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Flashpoint (Red)
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {AWKWARD_QUESTIONS_CONFIG.map((q) => {
                          const respFounder1 = step4Data.responses[0];
                          const respFounder2 = step4Data.responses[1];
                          const ans1 = respFounder1?.answers?.[q.key];
                          const ans2 = respFounder2?.answers?.[q.key];

                          const opt1 = q.options.find(
                            (o) => o.value === ans1?.selectedOption
                          );
                          const opt2 = q.options.find(
                            (o) => o.value === ans2?.selectedOption
                          );

                          const isExactMatch =
                            ans1 &&
                            ans2 &&
                            ans1.selectedOption === ans2.selectedOption;
                          const isCloseMatch =
                            ans1 &&
                            ans2 &&
                            !isExactMatch &&
                            opt1?.alignmentTag === opt2?.alignmentTag;
                          const isMissing = !ans1 || !ans2;

                          const statusBadge = isMissing ? (
                            <Badge variant="outline" className="text-[10px] text-slate-400">
                              Awaiting Both Answers
                            </Badge>
                          ) : isExactMatch ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                              100% Match
                            </Badge>
                          ) : isCloseMatch ? (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                              Minor Nuance
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 text-[10px]">
                              Flashpoint Risk
                            </Badge>
                          );

                          return (
                            <div
                              key={q.key}
                              className="p-3.5 sm:p-4 hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    {q.number}. {q.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({q.category.replace('_', ' ')})
                                  </span>
                                </div>
                                {statusBadge}
                              </div>

                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                    {respFounder1?.memberName || 'Founder 1'}
                                  </span>
                                  <div className="font-semibold text-slate-900 mt-0.5">
                                    {opt1?.label || (
                                      <span className="text-slate-400 italic">Not answered yet</span>
                                    )}
                                  </div>
                                  {ans1?.otherText && (
                                    <p className="text-[11px] text-indigo-700 mt-1">
                                      Custom: &ldquo;{ans1.otherText}&rdquo;
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                    {respFounder2?.memberName || 'Founder 2'}
                                  </span>
                                  <div className="font-semibold text-slate-900 mt-0.5">
                                    {opt2?.label || (
                                      <span className="text-slate-400 italic">Not answered yet</span>
                                    )}
                                  </div>
                                  {ans2?.otherText && (
                                    <p className="text-[11px] text-indigo-700 mt-1">
                                      Custom: &ldquo;{ans2.otherText}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Top 3 Things to Discuss Over Coffee Card */}
                      <div className="bg-amber-50/80 p-4 border-t border-amber-200 text-xs text-amber-950">
                        <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                          <Coffee className="h-4 w-4 text-amber-600" />
                          <span>Top 3 Things to Discuss Over Coffee Before Incorporating</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 leading-relaxed text-amber-900">
                          <li>
                            <strong>Salary Drawdown Trigger:</strong> Agree on the exact cash balance or grant milestone that allows personal survival drawings.
                          </li>
                          <li>
                            <strong>50/50 Deadlock Tie-Breaker:</strong> Decide if the CEO holds the casting vote or if unresolved disputes go to your Step 2 Advisor.
                          </li>
                          <li>
                            <strong>Reverse Vesting Agreement:</strong> Commit to 4-year vesting with a 1-year cliff to protect both of you against premature departure.
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 Toolbar: Park Open Question + Save Step 4 + Next Step */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2">
                  {onParkOpenQuestion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onParkOpenQuestion(
                          isSoloFounderMode
                            ? 'Review 20-question solo founder charter with commercial advisor before offering co-founder equity.'
                            : 'Schedule dedicated founder coffee session to resolve Amber/Red flashpoints in Step 4 alignment survey.'
                        )
                      }
                      className="text-xs text-slate-600"
                    >
                      <BookmarkPlus className="mr-1 h-3.5 w-3.5 text-amber-500" />
                      Park Open Question
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveStep4}
                    disabled={isSavingStep4 || isVaultReadonly}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                  >
                    {isSavingStep4 ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    Save Step 4
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleSaveStep4();
                      setOpenStep(5);
                    }}
                    className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Next: 3-Year Hiring Plan
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. STEP 5: 3-YEAR JOB CREATION PLAN, HEADCOUNT & SWEAT EQUITY ARCHITECTURE */}
      {/* ========================================================================= */}
      <div id="module-f-step-5" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 5 ? (
          // COLLAPSED STEP 5 CARD
          <div
            onClick={() => setOpenStep(5)}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  step5Complete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {step5Complete ? <Check className="h-4 w-4" /> : '5'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    Step 5: 3-Year Job Creation, Headcount &amp; Sweat Equity Architecture
                  </h3>
                  <Badge
                    variant={step5Complete ? 'default' : 'outline'}
                    className={`text-[10px] shrink-0 ${
                      step5Complete
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {step5Complete ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {step5Complete
                    ? `Y1: ${calculateFteForRoles(step5RolesYear1)} FTEs • Y2: ${calculateFteForRoles(
                        step5RolesYear2
                      )} FTEs • Y3: ${calculateFteForRoles(
                        step5RolesYear3
                      )} FTEs (${step5Data.roles.length} roles scheduled with sweat equity &amp; statutory taxes)`
                    : 'Map headcount milestones across Years 1–3, sweat equity pledges, and statutory employer payroll taxes.'}
                </p>
              </div>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
              >
                Edit Step
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          // EXPANDED STEP 5 CARD
          <Card className="rounded-xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      step5Complete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {step5Complete ? <Check className="h-4 w-4" /> : '5'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 5: 3-Year Job Creation Plan, Headcount &amp; Sweat Equity Architecture
                      </CardTitle>
                      <Badge
                        variant={step5Complete ? 'default' : 'outline'}
                        className={`text-[10px] shrink-0 ${
                          step5Complete
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {step5Complete ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Forecast your team expansion across Years 1, 2, and 3. Model cash salaries alongside sweat equity pools and live statutory employer costs ({isGb ? '13.8% UK Employer NIC + 3% Workplace Pension' : '11.15% IE Class A Employer PRSI'}).
                    </CardDescription>
                  </div>
                </div>

                {openStep !== 'ALL' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStep(0);
                    }}
                    className="text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Collapse Step
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Micro-Coaching Strip */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setActiveWhyCard(activeWhyCard === 5 ? null : 5)
                  }
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Why Are We Asking This?</span>
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveExampleCard(activeExampleCard === 5 ? null : 5)
                  }
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Show Me an Example</span>
                </button>
              </div>

              {/* Popover 1: Why Are We Asking This? */}
              {activeWhyCard === 5 && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Why Job Creation &amp; Sweat Equity Architecture Matters to Grant &amp; Loan Assessors:</span>
                    <button
                      type="button"
                      onClick={() => setActiveWhyCard(null)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-indigo-900/90 leading-relaxed">
                    <li>
                      <strong>LEO Priming Grants (Ireland):</strong> Fund up to 50% of direct PAYE salaries (max €10,000 per new job created in Year 1). Evaluators mandate an explicit Full-Time Equivalent (FTE) net job creation forecast.
                    </li>
                    <li>
                      <strong>Innovate UK &amp; British Business Bank:</strong> Require realistic direct labour cost allocations against milestone deliverables, factoring in statutory employer overheads.
                    </li>
                    <li>
                      <strong>Founder Protection via Sweat Equity:</strong> Early technical and commercial contributors who work without cash must be ring-fenced with <strong>4-year vesting schedules and a 1-year cliff</strong>. Without this, an early hire who leaves after 2 months keeps equity for zero long-term contribution.
                    </li>
                    <li>
                      <strong>Automatic Feed:</strong> These numbers flow straight into Module J (Financials) and Module L (Official Grant Tables), so you will never re-type headcount schedules.
                    </li>
                  </ul>
                </div>
              )}

              {/* Popover 2: Show Me an Example */}
              {activeExampleCard === 5 && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Example 3-Year Capital-Efficient Hiring Plan:</span>
                    <button
                      type="button"
                      onClick={() => setActiveExampleCard(null)}
                      className="text-emerald-500 hover:text-emerald-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-emerald-900">
                    <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                      <strong>Year 1: 2.0 FTEs</strong>
                      <p className="mt-1 text-slate-600">
                        Founders on minimal drawings + Lead Dev on Hybrid (€36k cash + 4% equity with 4-yr vest) + Part-time Growth Marketer (€16k).
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                      <strong>Year 2: 4.5 FTEs</strong>
                      <p className="mt-1 text-slate-600">
                        Senior Full-Stack Dev (€60k) + Sales SDR (€35k) + Operations Support (€30k). Subsidized by LEO Priming or Seed round.
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                      <strong>Year 3: 7.0 FTEs</strong>
                      <p className="mt-1 text-slate-600">
                        Enterprise AE (€50k) + DevOps / Platform Engineer (€65k) + Customer Success Lead (€38k). Sustainable unit economics.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* ------------------------------------------------------------- */}
              {/* SECTION 1: HIRING POSTURE & STRATEGY (Edge-Case Safe)         */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Core Hiring Strategy &amp; Team Posture
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Select the model that fits your cash and growth stage
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {HIRING_POSTURE_OPTIONS.map((opt) => {
                    const isSelected = step5Data.hiringPosture === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (isVaultReadonly) return;
                          setStep5Data((prev) => ({
                            ...prev,
                            hiringPosture: opt.value,
                          }));
                        }}
                        className={`rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {opt.label}
                          </span>
                          <Badge
                            variant={isSelected ? 'default' : 'outline'}
                            className={`text-[9px] shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-500'
                            }`}
                          >
                            {opt.badge}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                          {opt.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Edge-Case Protection: Custom OTHER hiring model input */}
                {step5Data.hiringPosture === 'OTHER' && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-1.5 animate-in fade-in-50">
                    <Label className="text-xs font-bold text-indigo-950">
                      Specify Your Custom Hiring Architecture (Edge-Case Protection):
                    </Label>
                    <Input
                      type="text"
                      value={customHiringPostureText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomHiringPostureText(val);
                        setStep5Data((prev) => ({
                          ...prev,
                          otherHiringPostureText: val,
                        }));
                      }}
                      placeholder="e.g. University spinout with fractional PhD researchers transitioning to full-time post-grant..."
                      className="text-xs bg-white border-indigo-200"
                    />
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 2: 3-YEAR HEADCOUNT TIMELINE & SWEAT EQUITY BUILDER   */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      2. Headcount Schedule &amp; Role Builder
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Schedule planned hires, set cash salaries, and model sweat equity incentives.
                    </p>
                  </div>

                  {/* Year Tabs: Year 1 | Year 2 | Year 3 */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                    {[1, 2, 3].map((yr) => {
                      const yrNum = yr as 1 | 2 | 3;
                      const isTabActive = activeYearTab === yrNum;
                      const rolesInYear = step5Data.roles.filter(
                        (r) => r.yearScheduled === yrNum
                      );
                      const fteInYear = calculateFteForRoles(rolesInYear);
                      return (
                        <button
                          key={yrNum}
                          type="button"
                          onClick={() => setActiveYearTab(yrNum)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            isTabActive
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>Year {yrNum}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                              isTabActive
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {fteInYear} FTE
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add Presets Bar */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Quick-Add Industry Roles to Year {activeYearTab}:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK_ADD_ROLE_TEMPLATES.map((tmpl) => (
                      <Button
                        key={tmpl.title}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddPlannedRole(tmpl)}
                        className="h-7 text-[11px] bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <Plus className="mr-1 h-3 w-3 text-indigo-600" />
                        {tmpl.title}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddPlannedRole()}
                      className="h-7 text-[11px] bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Custom Role
                    </Button>
                  </div>
                </div>

                {/* Roles List for the Active Year (Cumulative Flow-Through) */}
                <div className="space-y-3">
                  {activeTabRoles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center space-y-2">
                      <Users className="h-8 w-8 text-slate-300 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-700">
                        No team roles active in Year {activeYearTab} yet
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Click one of the Quick-Add presets above or add a custom hire to build your Year {activeYearTab} delivery capacity.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddPlannedRole()}
                        className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add First Role in Year {activeYearTab}
                      </Button>
                    </div>
                  ) : (
                    activeTabRoles.map((role) => {
                      const isRoleOpen = openRoleId === role.id;
                      const isFlowedFromPriorYear = role.yearScheduled < activeYearTab;
                      const gross = Number(role.grossAnnualSalary) || 0;
                      const isPureSweat =
                        role.compensationModel === 'PURE_SWEAT_EQUITY';
                      const taxCost = isPureSweat ? 0 : gross * employerTaxRate;
                      const pensionCost = isPureSweat
                        ? 0
                        : gross * employerPensionRate;
                      const loadedCost = isPureSweat
                        ? 0
                        : gross + taxCost + pensionCost;

                      return (
                        <div
                          key={role.id}
                          className={`rounded-xl border transition-all ${
                            isRoleOpen
                              ? 'border-indigo-300 bg-white shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {/* Role Row Header */}
                          <div
                            onClick={() =>
                              setOpenRoleId(isRoleOpen ? null : role.id)
                            }
                            className="flex cursor-pointer items-center justify-between p-4 gap-3"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                  isFlowedFromPriorYear
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {isFlowedFromPriorYear
                                  ? `Y${role.yearScheduled}`
                                  : role.targetQuarter}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">
                                    {role.title.trim() || 'Untitled Role'}
                                  </h4>
                                  {isFlowedFromPriorYear && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px] bg-slate-100 text-slate-700 border-slate-200"
                                    >
                                      Carried from Y{role.yearScheduled}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] text-slate-600"
                                  >
                                    {role.employmentMode === 'FULL_TIME'
                                      ? '1.0 FTE Full-Time'
                                      : role.employmentMode === 'PART_TIME'
                                      ? '0.5 FTE Part-Time'
                                      : 'Retained Contractor'}
                                  </Badge>
                                  <Badge
                                    className={`text-[9px] ${
                                      isPureSweat
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : role.compensationModel ===
                                          'HYBRID_CASH_EQUITY'
                                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    }`}
                                  >
                                    {
                                      COMPENSATION_MODEL_OPTIONS.find(
                                        (c) => c.value === role.compensationModel
                                      )?.badge
                                    }
                                  </Badge>
                                  {Number(role.equityGrantPercent) > 0 && (
                                    <span className="text-[10px] font-bold text-purple-700">
                                      ⚡ {role.equityGrantPercent}% Equity
                                    </span>
                                  )}
                                </div>
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                    <span>
                                      Gross:{' '}
                                      <strong>
                                        {isPureSweat
                                          ? `${selectedCountry === 'GB' ? '£0' : '€0'} (Sweat Equity)`
                                          : formatPlanCurrency(
                                              gross,
                                              selectedCountry === 'GB'
                                                ? 'GBP'
                                                : 'EUR'
                                            )}
                                      </strong>
                                    </span>
                                    {!isPureSweat && (
                                      <span>
                                        Fully-Loaded:{' '}
                                        <strong className="text-slate-800">
                                          {formatPlanCurrency(
                                            loadedCost,
                                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                                          )}
                                        </strong>
                                      </span>
                                    )}
                                    {role.isGrantReimbursableEligible && (
                                      <span className="text-emerald-600 font-semibold">
                                        ✓ LEO/Innovate UK Candidate
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePlannedRole(role.id);
                                  }}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 transition-transform ${
                                    isRoleOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Expanded Role Form */}
                            {isRoleOpen && (
                              <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/40">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                  {/* Title */}
                                  <div className="sm:col-span-5 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-700">
                                      Role Title
                                    </Label>
                                    <Input
                                      type="text"
                                      value={role.title}
                                      onChange={(e) =>
                                        handleUpdatePlannedRole(role.id, {
                                          title: e.target.value,
                                        })
                                      }
                                      placeholder="e.g. Lead Full-Stack Developer"
                                      className="text-xs bg-white"
                                    />
                                  </div>

                                  {/* Department */}
                                  <div className="sm:col-span-4 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-700">
                                      Department / Function
                                    </Label>
                                    <select
                                      value={role.department}
                                      onChange={(e) =>
                                        handleUpdatePlannedRole(role.id, {
                                          department: e.target
                                            .value as RoleDepartmentType,
                                        })
                                      }
                                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                                    >
                                      {ROLE_DEPARTMENT_OPTIONS.map((dept) => (
                                        <option key={dept.value} value={dept.value}>
                                          {dept.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Target Quarter */}
                                  <div className="sm:col-span-3 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-700">
                                      Start Timing
                                    </Label>
                                    <select
                                      value={role.targetQuarter}
                                      onChange={(e) =>
                                        handleUpdatePlannedRole(role.id, {
                                          targetQuarter: e.target.value as any,
                                        })
                                      }
                                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                                    >
                                      <option value="Q1">Q1 (Month 1–3)</option>
                                      <option value="Q2">Q2 (Month 4–6)</option>
                                      <option value="Q3">Q3 (Month 7–9)</option>
                                      <option value="Q4">Q4 (Month 10–12)</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Employment Mode & Compensation Model */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                                  {/* Employment Mode */}
                                  <div className="sm:col-span-4 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-700">
                                      Employment Mode
                                    </Label>
                                    <div className="grid grid-cols-3 gap-1">
                                      {[
                                        {
                                          value: 'FULL_TIME',
                                          label: '1.0 FTE',
                                        },
                                        {
                                          value: 'PART_TIME',
                                          label: '0.5 FTE',
                                        },
                                        {
                                          value: 'CONTRACTOR_RETAINER',
                                          label: 'Contract',
                                        },
                                      ].map((m) => (
                                        <button
                                          key={m.value}
                                          type="button"
                                          onClick={() =>
                                            handleUpdatePlannedRole(role.id, {
                                              employmentMode:
                                                m.value as EmploymentModeType,
                                            })
                                          }
                                          className={`rounded-md py-1.5 text-[11px] font-bold transition-all border ${
                                            role.employmentMode === m.value
                                              ? 'border-indigo-600 bg-indigo-600 text-white'
                                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                          }`}
                                        >
                                          {m.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Compensation Model Selector */}
                                  <div className="sm:col-span-8 space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-700">
                                      Compensation Architecture
                                    </Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                      {COMPENSATION_MODEL_OPTIONS.map((c) => (
                                        <button
                                          key={c.value}
                                          type="button"
                                          onClick={() =>
                                            handleUpdatePlannedRole(role.id, {
                                              compensationModel: c.value,
                                            })
                                          }
                                          className={`rounded-md p-1.5 text-center transition-all border ${
                                            role.compensationModel === c.value
                                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-600'
                                              : 'border-slate-200 bg-white text-slate-600 text-[10px] hover:bg-slate-50'
                                          }`}
                                        >
                                          <div className="text-[10px] truncate">
                                            {c.badge}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Salary & Sweat Equity Details */}
                                <div className="rounded-xl border border-indigo-100 bg-white p-3.5 space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    {/* Gross Cash Salary */}
                                    <div className="sm:col-span-4 space-y-1">
                                      <Label className="text-[11px] font-bold text-slate-700">
                                        Gross Annual Cash Salary ({selectedCountry === 'GB' ? '£' : '€'})
                                      </Label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                                          {selectedCountry === 'GB' ? '£' : '€'}
                                        </span>
                                        <Input
                                          type="number"
                                          min={0}
                                          step={1000}
                                          disabled={isPureSweat}
                                          value={
                                            isPureSweat
                                              ? 0
                                              : role.grossAnnualSalary || 0
                                          }
                                          onChange={(e) =>
                                            handleUpdatePlannedRole(role.id, {
                                              grossAnnualSalary:
                                                Number(e.target.value) || 0,
                                            })
                                          }
                                          className={`pl-7 text-xs font-bold ${
                                            isPureSweat
                                              ? 'bg-slate-100 text-slate-400'
                                              : 'text-slate-900'
                                          }`}
                                        />
                                      </div>
                                    </div>

                                    {/* Equity Grant % */}
                                    <div className="sm:col-span-3 space-y-1">
                                      <Label className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                                        <span>Sweat Equity Pool %</span>
                                      </Label>
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          min={0}
                                          max={100}
                                          step={0.25}
                                          value={role.equityGrantPercent ?? 0}
                                          onChange={(e) =>
                                            handleUpdatePlannedRole(role.id, {
                                              equityGrantPercent:
                                                Number(e.target.value) || 0,
                                            })
                                          }
                                          className="pr-6 text-xs font-bold text-purple-900 border-purple-200"
                                        />
                                        <span className="absolute right-3 top-2 text-xs font-bold text-purple-400">
                                          %
                                        </span>
                                      </div>
                                    </div>

                                    {/* Vesting Years & Cliff */}
                                    <div className="sm:col-span-5 space-y-1">
                                      <Label className="text-[11px] font-bold text-slate-700">
                                        Vesting Schedule &amp; Cliff
                                      </Label>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        <select
                                          value={role.vestingYears ?? 4}
                                          onChange={(e) =>
                                            handleUpdatePlannedRole(role.id, {
                                              vestingYears: Number(e.target.value),
                                            })
                                          }
                                          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
                                        >
                                          <option value={1}>1-Year Vesting</option>
                                          <option value={2}>2-Year Vesting</option>
                                          <option value={3}>3-Year Vesting</option>
                                          <option value={4}>4-Year Vesting (Standard)</option>
                                        </select>
                                        <select
                                          value={role.cliffMonths ?? 12}
                                          onChange={(e) =>
                                            handleUpdatePlannedRole(role.id, {
                                              cliffMonths: Number(e.target.value),
                                            })
                                          }
                                          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
                                        >
                                          <option value={0}>0-Mo Cliff</option>
                                          <option value={6}>6-Mo Cliff</option>
                                          <option value={12}>12-Mo Cliff (Standard)</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fully-Loaded Live Tax Breakdown */}
                                  <div className="rounded-lg bg-slate-50 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
                                      <span>
                                        Statutory Taxes:{' '}
                                        <strong>
                                          {formatPlanCurrency(
                                            taxCost,
                                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                                          )}
                                        </strong>{' '}
                                        ({isGb ? '13.8% NIC' : '11.15% PRSI'})
                                      </span>
                                      {isGb && (
                                        <span>
                                          Workplace Pension:{' '}
                                          <strong>
                                            {formatPlanCurrency(pensionCost, 'GBP')}
                                          </strong>{' '}
                                          (3%)
                                        </span>
                                      )}
                                      <span className="font-bold text-indigo-900">
                                        True Loaded Cost:{' '}
                                        {formatPlanCurrency(
                                          loadedCost,
                                          selectedCountry === 'GB' ? 'GBP' : 'EUR'
                                        )}
                                        /yr
                                      </span>
                                    </div>

                                    {/* Grant Eligibility Checkboxes */}
                                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                      <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(
                                            role.isGrantReimbursableEligible
                                          )}
                                          onChange={(e) =>
                                            handleUpdatePlannedRole(role.id, {
                                              isGrantReimbursableEligible:
                                                e.target.checked,
                                            })
                                          }
                                          className="rounded border-slate-300 text-indigo-600"
                                        />
                                        <span className="text-slate-700 font-medium">
                                          LEO / Innovate UK Grant Candidate
                                        </span>
                                      </label>
                                      <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(
                                            role.isRdTaxCreditEligible
                                          )}
                                          onChange={(e) =>
                                            handleUpdatePlannedRole(role.id, {
                                              isRdTaxCreditEligible:
                                                e.target.checked,
                                            })
                                          }
                                          className="rounded border-slate-300 text-purple-600"
                                        />
                                        <span className="text-slate-700 font-medium">
                                          R&amp;D Tax Credit Candidate
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* Sweat Equity Conditions & Notes */}
                                  {(isPureSweat ||
                                    role.compensationModel ===
                                      'HYBRID_CASH_EQUITY' ||
                                    Number(role.equityGrantPercent) > 0) && (
                                    <div className="space-y-1">
                                      <Label className="text-[11px] font-bold text-purple-900">
                                        Sweat Equity Milestone or Cash Conversion Trigger:
                                      </Label>
                                      <Input
                                        type="text"
                                        value={
                                          role.sweatEquityMilestoneConditions || ''
                                        }
                                        onChange={(e) =>
                                          handleUpdatePlannedRole(role.id, {
                                            sweatEquityMilestoneConditions:
                                              e.target.value,
                                          })
                                        }
                                        placeholder="e.g. Automatically converts to standard market cash salary once Seed round closes or MRR crosses €15k..."
                                        className="text-xs bg-purple-50/40 border-purple-200"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Freelance & Contractor Contingency Budget */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label className="text-xs font-bold text-slate-800">
                        Year {activeYearTab} Specialist Contractor &amp; Agency Budget
                      </Label>
                      <p className="text-[11px] text-slate-500">
                        For ad-hoc legal, accounting, branding, or specialized dev contractors outside direct payroll.
                      </p>
                    </div>
                    <div className="w-40 relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                        {selectedCountry === 'GB' ? '£' : '€'}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={
                          activeYearTab === 1
                            ? step5Data.contractorBudgetYear1
                            : activeYearTab === 2
                            ? step5Data.contractorBudgetYear2
                            : step5Data.contractorBudgetYear3
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setStep5Data((prev) => ({
                            ...prev,
                            [activeYearTab === 1
                              ? 'contractorBudgetYear1'
                              : activeYearTab === 2
                              ? 'contractorBudgetYear2'
                              : 'contractorBudgetYear3']: val,
                          }));
                        }}
                        className="pl-7 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 3: 3-YEAR HEADCOUNT SCORECARD & FINANCIAL PROJECTIONS */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Live 3-Year Headcount, Payroll &amp; Grant Scorecard
                  </Label>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    ✓ Feeds directly into Module J Financial Model
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Year 1 Card */}
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 uppercase">
                        Year 1 Projection
                      </span>
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        {calculateFteForRoles(step5RolesYear1)} FTEs
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Gross Wages:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            y1Stats.grossWages,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer Taxes &amp; Pension:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            y1Stats.employerTaxes,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contractor Budget:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            step5Data.contractorBudgetYear1,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-indigo-100 font-bold text-indigo-950">
                        <span>Total Wage Outflow:</span>
                        <span>
                          {formatPlanCurrency(
                            y1Stats.totalCashBurn,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </span>
                      </div>
                    </div>
                    {y1Stats.totalEquityPoolPledged > 0 && (
                      <div className="pt-1 text-[10px] text-purple-700 font-semibold">
                        ⚡ {y1Stats.totalEquityPoolPledged}% Sweat Equity Pledged
                      </div>
                    )}
                    {y1Stats.estimatedGrantSubsidy > 0 && (
                      <div className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                        LEO/Grant Subsidy Potential: ~
                        {formatPlanCurrency(
                          y1Stats.estimatedGrantSubsidy,
                          selectedCountry === 'GB' ? 'GBP' : 'EUR'
                        )}
                      </div>
                    )}
                  </div>

                  {/* Year 2 Card */}
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 uppercase">
                        Year 2 Projection
                      </span>
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        {calculateFteForRoles(step5RolesYear2)} FTEs
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Gross Wages:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            y2Stats.grossWages,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer Taxes &amp; Pension:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            y2Stats.employerTaxes,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contractor Budget:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            step5Data.contractorBudgetYear2,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-indigo-100 font-bold text-indigo-950">
                        <span>Total Wage Outflow:</span>
                        <span>
                          {formatPlanCurrency(
                            y2Stats.totalCashBurn,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </span>
                      </div>
                    </div>
                    {y2Stats.totalEquityPoolPledged > 0 && (
                      <div className="pt-1 text-[10px] text-purple-700 font-semibold">
                        ⚡ {y2Stats.totalEquityPoolPledged}% Sweat Equity Pledged
                      </div>
                    )}
                    {y2Stats.estimatedGrantSubsidy > 0 && (
                      <div className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                        LEO/Grant Subsidy Potential: ~
                        {formatPlanCurrency(
                          y2Stats.estimatedGrantSubsidy,
                          selectedCountry === 'GB' ? 'GBP' : 'EUR'
                        )}
                      </div>
                    )}
                  </div>

                  {/* Year 3 Card */}
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 uppercase">
                        Year 3 Projection
                      </span>
                      <Badge className="bg-indigo-600 text-white text-[10px]">
                        {calculateFteForRoles(step5RolesYear3)} FTEs
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Gross Wages:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            y3Stats.grossWages,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer Taxes &amp; Pension:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            y3Stats.employerTaxes,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contractor Budget:</span>
                        <strong className="text-slate-900">
                          {formatPlanCurrency(
                            step5Data.contractorBudgetYear3,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-indigo-100 font-bold text-indigo-950">
                        <span>Total Wage Outflow:</span>
                        <span>
                          {formatPlanCurrency(
                            y3Stats.totalCashBurn,
                            selectedCountry === 'GB' ? 'GBP' : 'EUR'
                          )}
                        </span>
                      </div>
                    </div>
                    {y3Stats.totalEquityPoolPledged > 0 && (
                      <div className="pt-1 text-[10px] text-purple-700 font-semibold">
                        ⚡ {y3Stats.totalEquityPoolPledged}% Sweat Equity Pledged
                      </div>
                    )}
                    {y3Stats.estimatedRdOffset > 0 && (
                      <div className="rounded-md bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-800">
                        Estimated R&amp;D Tax Offset: ~
                        {formatPlanCurrency(
                          y3Stats.estimatedRdOffset,
                          selectedCountry === 'GB' ? 'GBP' : 'EUR'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 4: EXECUTIVE HIRING & TALENT STRATEGY NARRATIVE       */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      4. Executive Hiring &amp; Retention Strategy (LEO &amp; Innovate UK Grant Narrative)
                    </Label>
                    <p className="text-[11px] text-slate-400">
                      Official form summary for grant assessors and loan underwriters
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isDraftingHiringAi || isVaultReadonly}
                    onClick={handleGenerateHiringStrategyAi}
                    className="h-7 text-xs border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 font-semibold"
                  >
                    {isDraftingHiringAi ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Generating AI Narrative...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                        Generate AI Summary
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  rows={4}
                  value={step5Data.executiveHiringStrategyNarrative || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setStep5Data((prev) => ({
                      ...prev,
                      executiveHiringStrategyNarrative: e.target.value,
                    }))
                  }
                  placeholder="Summarize your talent recruitment, onboarding cadence, and retention strategy (e.g. share options pool, remote-first flexibility, milestone bonuses)..."
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
                />
                {step5Data.aiCoachTip && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5 text-[11px] text-indigo-950 flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-indigo-900">Assessor Coaching: </strong>
                      <span>{step5Data.aiCoachTip}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 5 Bottom Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onParkOpenQuestion &&
                    onParkOpenQuestion(
                      'Hiring Roadmap: What is the optimal timing to transition early sweat equity team members into full cash PAYE salaries?'
                    )
                  }
                  className="text-xs text-amber-700 hover:bg-amber-50"
                >
                  <Bookmark className="mr-1 h-3.5 w-3.5" />
                  Park Question in Parking Lot
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveStep5}
                    disabled={isSavingStep5 || isVaultReadonly}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                  >
                    {isSavingStep5 ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    Save Step 5
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleSaveStep5();
                      setOpenStep(6);
                    }}
                    className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    Next: Module F Overview Brief
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* =================================================================== */}
      {/* OVERVIEW: TEAM, GOVERNANCE & HIRING BRIEF (MODULE F OVERVIEW)         */}
      {/* =================================================================== */}
      <div id="module-f-step-6" className="scroll-mt-24">
        {openStep !== 'ALL' && openStep !== 6 ? (
          <div
            onClick={() => setOpenStep(6)}
            className="group cursor-pointer rounded-xl border border-indigo-200 bg-gradient-to-r from-white via-indigo-50/40 to-violet-50/40 p-4 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    completedModuleFCoreStepsCount === 5
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                      Team, Governance &amp; Hiring Brief
                    </h2>
                    {completedModuleFCoreStepsCount === 5 ? (
                      <Badge variant="success" className="shrink-0 text-[10px]">
                        Ready to Export
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[10px] text-slate-600">
                        {completedModuleFCoreStepsCount}/5 Sections Ready
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700 shrink-0">
                      LEO Appendix D &amp; Innovate UK Q8 Compliant
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Executive team dossier, 7 hats workload balance, survival runway, founder charter, and constructive blind-spot audit.
                  </p>
                </div>
              </div>

              <div className="ml-3 flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2.5 text-xs font-medium text-indigo-600 group-hover:bg-indigo-50"
                >
                  <span>Open Overview</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card className="border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/40 shadow-sm">
            <CardHeader className="border-b border-indigo-100/80 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      completedModuleFCoreStepsCount === 5
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Team, Governance &amp; Hiring Brief (Overview)
                      </CardTitle>
                      <Badge className="bg-indigo-100 text-indigo-800 text-[10px] shrink-0">
                        Module F Overview
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] shrink-0"
                      >
                        {completedModuleFCoreStepsCount}/5 Core Sections Ready
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs text-slate-600">
                      Synthesize your promoter credentials, operational hat allocation, personal financial runway, founder alignment charter, and 3-year headcount roadmap into an investor- and grant-ready team dossier.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyMarkdownBrief}
                    className="h-8 text-xs border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold"
                  >
                    {copiedBrief ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy Markdown Dossier
                      </>
                    )}
                  </Button>
                  {openStep !== 'ALL' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setOpenStep(0)}
                      className="h-8 text-xs text-slate-500 hover:text-slate-900"
                    >
                      <span>Collapse Step</span>
                      <ChevronUp className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {/* ============================================================= */}
              {/* SECTION 1: 5-PILLAR TEAM READINESS CHECKLIST GRID             */}
              {/* ============================================================= */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Founding Team &amp; Governance Architecture Checklist
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {completedModuleFCoreStepsCount} of 5 Core Sections Complete
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Pillar 1: Promoter Profiles */}
                  <div
                    onClick={() => setOpenStep(1)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        1. Promoter Profiles &amp; CVs
                      </span>
                      {step1Complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {step1Data.teamMembers.length} team member(s) •{' '}
                      {step1Data.teamMembers.filter((m) => m.cvReadyForAppendixD).length}/{step1Data.teamMembers.length} CVs formatted for LEO Appendix D.
                    </p>
                    <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                      Edit Profiles →
                    </span>
                  </div>

                  {/* Pillar 2: 7 Startup Hats */}
                  <div
                    onClick={() => setOpenStep(2)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        2. 7 Startup Hats Matrix
                      </span>
                      {step2Complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {step2AssignedHatsCount}/7 functional hats mapped •{' '}
                      {step2Data.advisors.length} external advisor(s) in governance roster.
                    </p>
                    <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                      Edit Hat Allocation →
                    </span>
                  </div>

                  {/* Pillar 3: Survival Budget & Runway */}
                  <div
                    onClick={() => setOpenStep(3)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        3. Personal Survival Budget
                      </span>
                      {step3Complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {formatPlanCurrency(totalTeamMonthlyDrawingsNeed, step3Data.currencyCode)}/mo survival floor across {step3Data.founderBudgets.length} founder(s).
                    </p>
                    <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                      Edit Survival Runway →
                    </span>
                  </div>

                  {/* Pillar 4: Founder Alignment / 20 Hard Questions */}
                  <div
                    onClick={() => setOpenStep(4)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        4. Founder Alignment Charter
                      </span>
                      {step4Complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {isSoloFounderMode
                        ? `${answeredQuestionsCountForActiveFounder}/20 Hard Questions Answered (Solo Charter)`
                        : `${step4Data.responses.length} Founders • ${step4Data.isRevealed ? 'Heatmap Revealed' : 'Blind-Reveal'}`}
                    </p>
                    <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                      Review Questions →
                    </span>
                  </div>

                  {/* Pillar 5: 3-Year Headcount & Payroll */}
                  <div
                    onClick={() => setOpenStep(5)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs sm:col-span-2 lg:col-span-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        5. 3-Year Headcount &amp; Grant Salary Roadmap
                      </span>
                      {step5Complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Year 1: {calculateFteForRoles(step5RolesYear1)} FTEs ({formatPlanCurrency(y1Stats.totalCashBurn, isGb ? 'GBP' : 'EUR')}) → Year 3: {calculateFteForRoles(step5RolesYear3)} FTEs ({formatPlanCurrency(y3Stats.totalCashBurn, isGb ? 'GBP' : 'EUR')}) • {step5Data.roles.length} roles scheduled.
                    </p>
                    <span className="mt-2 inline-block text-[10px] font-bold text-indigo-600">
                      Edit Hiring Schedule →
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 2: AUDIT READINESS POSTURE SELECTOR                   */}
              {/* ============================================================= */}
              <div className="space-y-3 border-t border-indigo-100/80 pt-4">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    2. Team &amp; Governance Readiness Posture (Grant &amp; Investor Diligence)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Includes &ldquo;Other&rdquo; custom posture option
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {TEAM_READINESS_CONFIDENCE_OPTIONS.map((opt) => {
                    const isSelected = step6Data.readinessConfidence === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isVaultReadonly}
                        onClick={() =>
                          setStep6Data((prev) => ({
                            ...prev,
                            readinessConfidence: opt.value,
                          }))
                        }
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {opt.label}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                isSelected
                                  ? 'border-indigo-300 bg-indigo-100 text-[10px] text-indigo-900 font-bold'
                                  : 'border-slate-200 bg-slate-50 text-[10px] text-slate-600'
                              }
                            >
                              {opt.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            {opt.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {step6Data.readinessConfidence === 'OTHER' && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
                    <label className="block text-xs font-semibold text-indigo-950">
                      Describe Your Custom Team &amp; Governance Posture:
                    </label>
                    <input
                      type="text"
                      disabled={isVaultReadonly}
                      value={step6Data.otherReadinessConfidenceText || ''}
                      onChange={(e) =>
                        setStep6Data((prev) => ({
                          ...prev,
                          otherReadinessConfidenceText: e.target.value,
                        }))
                      }
                      placeholder="e.g. Solo founder backed by university incubation mentor while finalizing commercial co-founder..."
                      className="mt-1.5 w-full rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-base text-slate-900 sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* SECTION 3: CONSTRUCTIVE "THINGS TO CONSIDER" BLIND-SPOT ENGINE*/}
              {/* ============================================================= */}
              <div className="space-y-3 border-t border-indigo-100/80 pt-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 sm:text-sm">
                      3. Constructive Team &amp; Governance &ldquo;Things to Consider&rdquo; Blind-Spot Review
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Constructive blind-spot check tailored to LEO panels, Innovate UK assessors, and early investors.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly || isDraftingAuditAi}
                      onClick={handleRunAiStep6Audit}
                      className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                    >
                      {isDraftingAuditAi ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Auditing Team &amp; Risks...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                          AI Run Team Blind-Spot Audit &amp; Brief
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isVaultReadonly}
                      onClick={handleAddBlindSpotItem}
                      className="text-xs"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Consideration
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {step6Data.blindSpots.map((item, idx) => {
                    const isCritical = item.severity === 'CRITICAL';
                    const isWatch = item.severity === 'WATCH';
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3.5 transition ${
                          item.isResolved
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : isCritical
                            ? 'border-rose-200 bg-rose-50/30'
                            : isWatch
                            ? 'border-indigo-200 bg-indigo-50/30'
                            : 'border-amber-200 bg-amber-50/30'
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                              Consideration #{idx + 1}
                            </span>

                            <select
                              disabled={isVaultReadonly}
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  category: e.target.value as TeamBlindSpotCategoryType,
                                })
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-base font-semibold text-slate-800 sm:text-xs"
                            >
                              {TEAM_BLIND_SPOT_CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>

                            <select
                              disabled={isVaultReadonly}
                              value={item.severity}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  severity: e.target.value as TeamBlindSpotSeverityType,
                                })
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-base font-bold text-slate-800 sm:text-xs"
                            >
                              <option value="CRITICAL">🚨 Critical Team Risk</option>
                              <option value="IMPORTANT">⚠️ Governance Watch-Out</option>
                              <option value="WATCH">✨ Strategic &amp; Grant Advisory</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant={item.isResolved ? 'default' : 'outline'}
                              disabled={isVaultReadonly}
                              onClick={() => handleToggleBlindSpotResolved(item.id)}
                              className={
                                item.isResolved
                                  ? 'h-7 bg-emerald-600 px-2.5 text-[11px] text-white hover:bg-emerald-700'
                                  : 'h-7 border-emerald-300 bg-white px-2.5 text-[11px] text-emerald-800 hover:bg-emerald-50'
                              }
                            >
                              <Check className="mr-1 h-3 w-3" />
                              {item.isResolved ? 'Resolved / Addressed' : 'Mark Addressed'}
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (onParkOpenQuestion) {
                                  onParkOpenQuestion(
                                    `[Team Blind Spot] ${item.title}: ${item.recommendedActionOrFix}`
                                  );
                                  setSaveBanner(
                                    `📌 Parked "${item.title}" in Open Questions!`
                                  );
                                }
                              }}
                              className="h-7 border-slate-300 bg-white px-2 text-[11px] text-slate-700 hover:bg-slate-100"
                            >
                              <Bookmark className="mr-1 h-3 w-3" />
                              Park
                            </Button>

                            {step6Data.blindSpots.length > 1 && (
                              <button
                                type="button"
                                disabled={isVaultReadonly}
                                onClick={() => handleRemoveBlindSpotItem(item.id)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                title="Remove consideration"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {item.category === 'OTHER' && (
                          <div className="mt-2">
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={item.otherCategoryText || ''}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  otherCategoryText: e.target.value,
                                })
                              }
                              placeholder="Specify custom team blind-spot category..."
                              className="w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-base text-slate-900 sm:text-xs"
                            />
                          </div>
                        )}

                        <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-12">
                          <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold uppercase text-slate-500">
                              Consideration Headline
                            </label>
                            <input
                              type="text"
                              disabled={isVaultReadonly}
                              value={item.title}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  title: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base font-semibold text-slate-900 sm:text-xs"
                            />
                          </div>

                          <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold uppercase text-slate-500">
                              Why It Matters to Assessors / Investors
                            </label>
                            <textarea
                              rows={2}
                              disabled={isVaultReadonly}
                              value={item.whyItMatters}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  whyItMatters: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-base text-slate-700 sm:text-xs"
                            />
                          </div>

                          <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold uppercase text-slate-500">
                              Recommended Action or Mitigation
                            </label>
                            <textarea
                              rows={2}
                              disabled={isVaultReadonly}
                              value={item.recommendedActionOrFix}
                              onChange={(e) =>
                                handleUpdateBlindSpotItem(item.id, {
                                  recommendedActionOrFix: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-base text-slate-700 sm:text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================= */}
              {/* SECTION 4: 1-PAGE EXECUTIVE DOSSIER (OFFICIAL GRANT FORM BLOCKS) */}
              {/* ============================================================= */}
              <div className="space-y-4 border-t border-indigo-100/80 pt-5">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 sm:text-sm">
                      4. Official Grant Form Copy Blocks (LEO Appendix D &amp; Innovate UK Q8)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Copy and paste these verified narrative paragraphs directly into your official grant applications or investment proposals.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700">
                    Auto-Formatted Dossier
                  </Badge>
                </div>

                <div className="space-y-4">
                  {/* Block 1: Executive Team Capability */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        A. Executive Team Capability &amp; Execution Track Record (LEO Appendix D &amp; Innovate UK Q8)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {step6Data.executiveTeamCapabilityNarrative.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      disabled={isVaultReadonly}
                      value={step6Data.executiveTeamCapabilityNarrative}
                      onChange={(e) =>
                        setStep6Data((prev) => ({
                          ...prev,
                          executiveTeamCapabilityNarrative: e.target.value,
                        }))
                      }
                      placeholder="Click 'AI Run Team Blind-Spot Audit & Brief' above to synthesize your LEO Appendix D / Innovate UK capability narrative..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 sm:text-xs"
                    />
                  </div>

                  {/* Block 2: Corporate Governance & Vesting */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        B. Corporate Governance, 4-Year Vesting &amp; Deadlock Resolution
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {step6Data.governanceAndVestingNarrative.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      disabled={isVaultReadonly}
                      value={step6Data.governanceAndVestingNarrative}
                      onChange={(e) =>
                        setStep6Data((prev) => ({
                          ...prev,
                          governanceAndVestingNarrative: e.target.value,
                        }))
                      }
                      placeholder="Click 'AI Run Team Blind-Spot Audit & Brief' above to synthesize your Corporate Governance narrative..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 sm:text-xs"
                    />
                  </div>

                  {/* Block 3: Talent Retention & Hiring */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        C. Talent Retention &amp; Non-Dilutive Grant Salary Offsets (LEO Priming / Innovate UK)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {step6Data.talentRetentionAndHiringNarrative.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      disabled={isVaultReadonly}
                      value={step6Data.talentRetentionAndHiringNarrative}
                      onChange={(e) =>
                        setStep6Data((prev) => ({
                          ...prev,
                          talentRetentionAndHiringNarrative: e.target.value,
                        }))
                      }
                      placeholder="Click 'AI Run Team Blind-Spot Audit & Brief' above to synthesize your Talent Retention narrative..."
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-900 sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Assessor Coaching Tip */}
              {step6Data.aiCoachTip && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-indigo-900">Grant Assessor Insight: </strong>
                    <span className="leading-relaxed">{step6Data.aiCoachTip}</span>
                  </div>
                </div>
              )}

              {/* Save Overview Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100/80 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenStep(5)}
                  className="text-xs"
                >
                  &larr; Back to Step 5 (Hiring Plan)
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveStep6}
                    disabled={isSavingStep6 || isVaultReadonly}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                  >
                    {isSavingStep6 ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Save Team Brief (Complete Module F)
                  </Button>
                </div>
              </div>

              {/* Conversion / Handoff CTA Bar into Module G Launchpad */}
              {onContinueToModuleG && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white">
                  <div className="text-xs min-w-0 flex-1">
                    <span className="font-semibold text-indigo-300">
                      Module F Complete! Ready to set up legal, banking &amp; operational infrastructure for {plan.title}?
                    </span>{' '}
                    <span className="text-slate-300">
                      Continue to Module G: Getting Set Up (Launchpad &amp; Operations Hub) to register CRO / Companies House, live domain &amp; official email, business banking, and statutory insurance.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isVaultReadonly || isSavingStep6}
                    onClick={async () => {
                      await handleSaveStep6();
                      onContinueToModuleG();
                    }}
                    className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold"
                  >
                    Continue to Module G: Launchpad
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
