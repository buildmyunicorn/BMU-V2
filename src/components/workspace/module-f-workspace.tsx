'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  parseCvAndDraftPromoterBioAction,
  type ParseCvAndDraftBioResult,
} from '@/app/actions/module-f';
import { Button } from '@/components/ui/button';
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
} from '@/lib/auth/session-store';

export interface ModuleFWorkspaceProps {
  plan: ActiveStartupPlan;
  selectedCountry: SupportedCountryCode;
  isVaultReadonly: boolean;
  onSaveStep1PromoterProfiles: (
    data: PromoterProfilesStep1Data,
    progress: number
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
  return {
    teamStructurePosture:
      plan.teamAndBudget?.teamStructureType === 'COFOUNDER_TEAM'
        ? 'CO_FOUNDING_DUO_OR_TRIO'
        : 'SOLO_FOUNDER_CURRENT',
    otherTeamStructurePostureText: '',
    teamMembers: [
      {
        id: `member-${Date.now()}-1`,
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

export function ModuleFWorkspace({
  plan,
  selectedCountry,
  isVaultReadonly,
  onSaveStep1PromoterProfiles,
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
      isComplete: false,
      summary: 'Map Primary & Backup owners for all 7 startup hats',
    },
    {
      stepNum: 3,
      title: 'Survival Budget',
      isComplete: false,
      summary: '6-line personal living budget & minimum monthly drawings',
    },
    {
      stepNum: 4,
      title: 'Co-Founder Alignment & Equity',
      isComplete: false,
      summary: '12 awkward questions & blind-reveal compatibility',
    },
    {
      stepNum: 5,
      title: '3-Year Hiring Plan',
      isComplete: false,
      summary: 'Headcount roadmap & Employer PRSI/NIC preview',
    },
    {
      stepNum: 6,
      title: 'Team & Governance Brief',
      isComplete: false,
      summary: 'Module F Executive Brief & Things to Consider Review',
    },
  ];

  const completedModuleFCoreStepsCount = moduleFReadinessSteps
    .slice(0, 5)
    .filter((s) => s.isComplete).length;
  const totalModuleFProgress = Math.round(
    (completedModuleFCoreStepsCount / 5) * 100
  );

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
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-slate-900">
                    Step 1: Promoter &amp; Key Team Member Profiles
                  </h3>
                  <Badge
                    variant={step1Complete ? 'default' : 'outline'}
                    className={
                      step1Complete
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                        : 'text-slate-600'
                    }
                  >
                    {step1Complete ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <p className="truncate text-xs text-slate-500">
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
                className="text-xs text-indigo-600 group-hover:bg-indigo-50"
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        Step 1: Promoter &amp; Key Team Member Profiles
                      </CardTitle>
                      <Badge
                        variant={step1Complete ? 'default' : 'outline'}
                        className={
                          step1Complete
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                            : 'text-slate-600'
                        }
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

      {/* Placeholders for Steps 2-6 (which will be built out step-by-step) */}
      {[
        {
          num: 2,
          id: 'module-f-step-2',
          title: 'Step 2: "7 Startup Hats" Role Matrix & External Advisors',
          desc: 'Assign Primary & Backup owners across Vision, Product, Sales, Marketing, Support, Ops, and Finance to prevent overload bottlenecks.',
        },
        {
          num: 3,
          id: 'module-f-step-3',
          title: 'Step 3: Personal Survival Budget & Minimum Founder Drawings',
          desc: 'Interactive 6-line household budget to calculate minimum monthly drawings needed from the business (UK Start Up Loans Tab #2 compliant).',
        },
        {
          num: 4,
          id: 'module-f-step-4',
          title: 'Step 4: 12 Awkward Co-Founder Questions & Blind-Reveal Fit',
          desc: 'Stress-test quit triggers, salary timelines, deadlock rules, and equity splits with side-by-side compatibility comparison.',
        },
        {
          num: 5,
          id: 'module-f-step-5',
          title: 'Step 5: 3-Year Job Creation & Hiring Roadmap',
          desc: 'Schedule Year 1–3 headcount milestones with live Employer PRSI (~11.15% IE) and Employer NIC (~13.8% UK) cost previews.',
        },
        {
          num: 6,
          id: 'module-f-step-6',
          title: 'Step 6: Team, Alignment & Hiring Brief (Overview & Blind Spots)',
          desc: 'Executive summary brief, AI Things to Consider team review, and transition into Module G Launchpad.',
        },
      ].map((placeholder) => (
        <div
          key={placeholder.num}
          id={placeholder.id}
          className="scroll-mt-24 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-slate-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-600">
                {placeholder.num}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  {placeholder.title}
                </h4>
                <p className="text-[11px] text-slate-500">{placeholder.desc}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-slate-400">
              Next Step
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
