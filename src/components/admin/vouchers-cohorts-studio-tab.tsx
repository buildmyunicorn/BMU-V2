'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  PlusCircle,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Sparkles,
  Building,
  Loader2,
  Copy,
  ShieldAlert,
  Inbox,
  UserCheck,
  UserPlus,
  ExternalLink,
  Target,
  Settings,
  Trash2,
  GraduationCap,
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
  generateVoucherBatchAction,
  createCohortAction,
  updateCohortAction,
  manageCohortStaffAction,
  revokeVoucherAction,
  exportAppSumoPlainCsvAction,
  type AdminVoucherSummary,
  type AdminCohortSummary,
  type CohortIntakeType,
  type CohortMilestoneConfig,
  type VoucherSourceType,
  type VoucherRewardType,
} from '@/app/actions/admin-vouchers';
import {
  updateCohortInquiryStatusAdminAction,
  type AdminCohortInquiryRecord,
} from '@/app/actions/cohort-inquiries';

const MODULE_CHOICES = [
  { key: 'MOD_A_IDEATION', label: 'Mod A: Ideation & Concept Canvas' },
  { key: 'MOD_B_MARKET', label: 'Mod B: Market, Personas & Sizing' },
  { key: 'MOD_C_SURVEYS_FEEDBACK', label: 'Mod C: Surveys, Feedback & Waitlist' },
  { key: 'MOD_D_PRODUCT_BUILD', label: 'Mod D: Product Build & MVP Spec' },
  { key: 'MOD_E_OPERATIONS', label: 'Mod E: Operations & Equipment Schedule' },
  { key: 'MOD_F_COFOUNDER_TEAM', label: 'Mod F: Co-Founder & Alignment' },
  { key: 'MOD_G_LAUNCHPAD', label: 'Mod G: Launchpad & Operations Setup' },
  { key: 'MOD_H_REVENUE', label: 'Mod H: Revenue & Pocket Profit' },
  { key: 'MOD_I_MARKETING', label: 'Mod I: Marketing & First 10 Customers' },
  { key: 'MOD_J_FINANCE', label: 'Mod J: Financials & Cashflow Trough' },
  { key: 'MOD_K_GRANTS_FUNDING', label: 'Mod K: Grants & Funding Matcher' },
  { key: 'MOD_L_BUSINESS_PLAN', label: 'Mod L: Business Plan & Grant Compiler' },
];

interface VouchersCohortsStudioTabProps {
  vouchers: AdminVoucherSummary[];
  cohorts: AdminCohortSummary[];
  inquiries?: AdminCohortInquiryRecord[];
  stats: {
    totalVouchers: number;
    unclaimedVouchers: number;
    redeemedVouchers: number;
    refundedVouchers: number;
    totalCohorts: number;
  };
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function VouchersCohortsStudioTab({
  vouchers,
  cohorts,
  inquiries = [],
  stats,
  onRefresh,
  onNotify,
}: VouchersCohortsStudioTabProps) {
  const [subTab, setSubTab] = useState<'COHORTS' | 'INQUIRIES' | 'VOUCHERS'>('COHORTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNCLAIMED' | 'REDEEMED' | 'REFUNDED_REVOKED'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | VoucherSourceType>('ALL');

  // Generator Modal state
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [source, setSource] = useState<VoucherSourceType>('APPSUMO');
  const [rewardType, setRewardType] = useState<VoucherRewardType>('APPSUMO_LTD');
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [quantity, setQuantity] = useState<number>(500);
  const [customPrefix, setCustomPrefix] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Cohort Creator state
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortOrgName, setCohortOrgName] = useState('');
  const [cohortLogoUrl, setCohortLogoUrl] = useState('');
  const [cohortCode, setCohortCode] = useState('');
  const [cohortIntakeType, setCohortIntakeType] = useState<CohortIntakeType>('ROLLING');
  const [cohortMaxSeats, setCohortMaxSeats] = useState(50);
  const [cohortDuration, setCohortDuration] = useState(6);
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [inquiryIdConverting, setInquiryIdConverting] = useState<string | null>(null);

  // Milestone Gate config state for Creator
  const [enableMilestoneGate, setEnableMilestoneGate] = useState(true);
  const [rewardLabel, setRewardLabel] = useState('Google Cloud Startup Credits ($2,000 USD)');
  const [requiredProgressPercent, setRequiredProgressPercent] = useState(50);
  const [requiredModules, setRequiredModules] = useState<string[]>([
    'MOD_A_IDEATION',
    'MOD_B_MARKET',
    'MOD_C_SURVEYS_FEEDBACK',
    'MOD_D_PRODUCT_BUILD',
  ]);
  const [partnerNotificationEmails, setPartnerNotificationEmails] = useState('startups-ireland@google.com');
  const [requireOfficialDomain, setRequireOfficialDomain] = useState(true);
  const [requireWorkEmail, setRequireWorkEmail] = useState(true);
  const [instructionNotes, setInstructionNotes] = useState('');
  const [isCreatingCohort, setIsCreatingCohort] = useState(false);

  // Edit Cohort Modal state
  const [editingCohort, setEditingCohort] = useState<AdminCohortSummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrgName, setEditOrgName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editIntakeType, setEditIntakeType] = useState<CohortIntakeType>('ROLLING');
  const [editMaxSeats, setEditMaxSeats] = useState(50);
  const [editDuration, setEditDuration] = useState(6);
  const [editEnableGate, setEditEnableGate] = useState(true);
  const [editRewardLabel, setEditRewardLabel] = useState('');
  const [editProgressPercent, setEditProgressPercent] = useState(50);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editPartnerEmails, setEditPartnerEmails] = useState('');
  const [editRequireDomain, setEditRequireDomain] = useState(true);
  const [editRequireWorkEmail, setEditRequireWorkEmail] = useState(true);
  const [editInstructionNotes, setEditInstructionNotes] = useState('');
  const [isUpdatingCohort, setIsUpdatingCohort] = useState(false);

  // Manage Staff Modal state
  const [managingStaffCohort, setManagingStaffCohort] = useState<AdminCohortSummary | null>(null);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'DIRECTOR' | 'MENTOR'>('MENTOR');
  const [isManagingStaff, setIsManagingStaff] = useState(false);

  // Inquiries Filter & Status state
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>('ALL');
  const [updatingInquiryId, setUpdatingInquiryId] = useState<string | null>(null);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [confirmRevokeModal, setConfirmRevokeModal] = useState<AdminVoucherSummary | null>(null);

  // AppSumo CSV Export state
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSource, setExportSource] = useState<'APPSUMO' | 'PARTNER' | 'PROMO' | 'ALL'>('APPSUMO');
  const [exportStatus, setExportStatus] = useState<'UNCLAIMED' | 'ALL'>('UNCLAIMED');
  const [exportBatch, setExportBatch] = useState<string>('ALL');

  const newInquiriesCount = inquiries.filter((i) => i.status === 'NEW').length;

  // Download CSV
  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle Generate Batch
  async function handleGenerateBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!batchName.trim()) {
      onNotify('error', 'Please provide a descriptive batch name.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateVoucherBatchAction({
        batchName,
        source,
        rewardType,
        durationMonths,
        quantity,
        prefix: customPrefix || undefined,
        notes: batchNotes || undefined,
      });

      if (!res.ok) {
        onNotify('error', res.error || 'Failed to generate batch.');
        setIsGenerating(false);
        return;
      }

      onNotify(
        'success',
        `Successfully generated batch "${res.batchName}" with ${res.generatedCount} codes!`
      );

      if (res.csvContent) {
        downloadCsv(res.csvContent, `${res.batchName}_Vouchers.csv`);
      }

      setShowBatchModal(false);
      setBatchName('');
      setCustomPrefix('');
      setBatchNotes('');
      await onRefresh();
    } catch {
      onNotify('error', 'Unexpected error generating vouchers.');
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle Export Plain AppSumo CSV
  async function handleExportAppSumoCsv() {
    setIsExportingCsv(true);
    try {
      const res = await exportAppSumoPlainCsvAction({
        source: exportSource,
        status: exportStatus,
        batchName: exportBatch === 'ALL' ? undefined : exportBatch,
      });

      if (!res.ok) {
        onNotify('error', res.error || 'Failed to export CSV.');
        setIsExportingCsv(false);
        return;
      }

      if (!res.csvContent || res.count === 0) {
        onNotify('error', 'No voucher codes found matching the selected export criteria.');
        setIsExportingCsv(false);
        return;
      }

      downloadCsv(res.csvContent, res.filename || 'appsumo_codes.csv');
      onNotify(
        'success',
        `Successfully exported ${res.count} randomized codes in AppSumo plain CSV format!`
      );
      setShowExportModal(false);
    } catch {
      onNotify('error', 'Failed to generate AppSumo CSV export.');
    } finally {
      setIsExportingCsv(false);
    }
  }

  // Handle Create Cohort
  async function handleCreateCohort(e: React.FormEvent) {
    e.preventDefault();
    if (!cohortName.trim() || !cohortCode.trim()) {
      onNotify('error', 'Please fill in both cohort name and invite code.');
      return;
    }

    let milestoneConfig: CohortMilestoneConfig | undefined = undefined;
    if (enableMilestoneGate) {
      const emails = partnerNotificationEmails
        .split(/[,\n]/)
        .map((em) => em.trim())
        .filter(Boolean);

      milestoneConfig = {
        enabled: true,
        rewardLabel: rewardLabel.trim() || 'Partner Cloud Credits',
        requiredProgressPercent,
        requiredModules,
        partnerNotificationEmails: emails,
        requireOfficialDomain,
        requireWorkEmail,
        instructionNotes: instructionNotes.trim() || undefined,
      };
    }

    setIsCreatingCohort(true);
    try {
      const res = await createCohortAction({
        name: cohortName,
        inviteCode: cohortCode,
        organizationName: cohortOrgName.trim() || undefined,
        partnerLogoUrl: cohortLogoUrl.trim() || undefined,
        intakeType: cohortIntakeType,
        maxSeats: cohortMaxSeats,
        accessDurationMonths: cohortDuration,
        directorEmail: directorEmail.trim() || undefined,
        directorName: directorName.trim() || undefined,
        milestoneConfig,
        inquiryId: inquiryIdConverting || undefined,
      });

      if (!res.ok) {
        onNotify('error', res.error || 'Failed to create cohort.');
        setIsCreatingCohort(false);
        return;
      }

      onNotify(
        'success',
        `Cohort "${cohortName}" provisioned successfully! Code: ${cohortCode.toUpperCase()}`
      );
      setShowCohortModal(false);
      setCohortName('');
      setCohortOrgName('');
      setCohortLogoUrl('');
      setCohortCode('');
      setDirectorEmail('');
      setDirectorName('');
      setInquiryIdConverting(null);
      await onRefresh();
    } catch {
      onNotify('error', 'Unexpected error creating cohort.');
    } finally {
      setIsCreatingCohort(false);
    }
  }

  // Open Edit Cohort Modal
  function handleOpenEditCohort(c: AdminCohortSummary) {
    setEditingCohort(c);
    setEditName(c.name);
    setEditOrgName(c.organizationName || '');
    setEditLogoUrl(c.partnerLogoUrl || '');
    setEditIntakeType(c.intakeType || 'ROLLING');
    setEditMaxSeats(c.maxSeats);
    setEditDuration(c.accessDurationMonths);

    if (c.milestoneConfig) {
      setEditEnableGate(true);
      setEditRewardLabel(c.milestoneConfig.rewardLabel || 'Google Cloud Startup Credits ($2,000 USD)');
      setEditProgressPercent(c.milestoneConfig.requiredProgressPercent ?? 50);
      setEditModules(c.milestoneConfig.requiredModules || []);
      setEditPartnerEmails((c.milestoneConfig.partnerNotificationEmails || []).join(', '));
      setEditRequireDomain(Boolean(c.milestoneConfig.requireOfficialDomain));
      setEditRequireWorkEmail(Boolean(c.milestoneConfig.requireWorkEmail));
      setEditInstructionNotes(c.milestoneConfig.instructionNotes || '');
    } else {
      setEditEnableGate(false);
      setEditRewardLabel('Google Cloud Startup Credits ($2,000 USD)');
      setEditProgressPercent(50);
      setEditModules(['MOD_A_IDEATION', 'MOD_B_MARKET', 'MOD_C_SURVEYS_FEEDBACK', 'MOD_D_PRODUCT_BUILD']);
      setEditPartnerEmails('startups-ireland@google.com');
      setEditRequireDomain(true);
      setEditRequireWorkEmail(true);
      setEditInstructionNotes('');
    }
  }

  // Handle Save Edited Cohort
  async function handleSaveEditedCohort(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCohort) return;

    let milestoneConfig: CohortMilestoneConfig | null = null;
    if (editEnableGate) {
      const emails = editPartnerEmails
        .split(/[,\n]/)
        .map((em) => em.trim())
        .filter(Boolean);

      milestoneConfig = {
        enabled: true,
        rewardLabel: editRewardLabel.trim() || 'Partner Cloud Credits',
        requiredProgressPercent: editProgressPercent,
        requiredModules: editModules,
        partnerNotificationEmails: emails,
        requireOfficialDomain: editRequireDomain,
        requireWorkEmail: editRequireWorkEmail,
        instructionNotes: editInstructionNotes.trim() || undefined,
      };
    }

    setIsUpdatingCohort(true);
    try {
      const res = await updateCohortAction({
        cohortId: editingCohort.id,
        name: editName.trim() || undefined,
        organizationName: editOrgName.trim() || undefined,
        partnerLogoUrl: editLogoUrl.trim() || undefined,
        intakeType: editIntakeType,
        maxSeats: editMaxSeats,
        accessDurationMonths: editDuration,
        milestoneConfig,
      });

      if (!res.ok) {
        onNotify('error', res.error || 'Failed to update cohort.');
        setIsUpdatingCohort(false);
        return;
      }

      onNotify('success', `Cohort "${editName}" updated successfully!`);
      setEditingCohort(null);
      await onRefresh();
    } catch {
      onNotify('error', 'Unexpected error updating cohort.');
    } finally {
      setIsUpdatingCohort(false);
    }
  }

  // Handle Staff Management
  async function handleStaffAction(action: 'ADD' | 'REMOVE', staffId?: string) {
    if (!managingStaffCohort) return;
    setIsManagingStaff(true);
    try {
      const res = await manageCohortStaffAction({
        cohortId: managingStaffCohort.id,
        action,
        staffId,
        email: newStaffEmail.trim() || undefined,
        name: newStaffName.trim() || undefined,
        role: newStaffRole,
      });

      if (!res.ok) {
        onNotify('error', res.error || 'Failed to update cohort staff.');
        setIsManagingStaff(false);
        return;
      }

      onNotify('success', action === 'ADD' ? 'Staff member added!' : 'Staff member removed.');
      setNewStaffEmail('');
      setNewStaffName('');
      await onRefresh();
      // Keep managing dialog updated by finding updated cohort
      const updated = cohorts.find((co) => co.id === managingStaffCohort.id);
      if (updated) setManagingStaffCohort(updated);
    } catch {
      onNotify('error', 'Error managing staff member.');
    } finally {
      setIsManagingStaff(false);
    }
  }

  // Handle Convert Inquiry to Cohort
  function handleConvertInquiryToCohort(inquiry: AdminCohortInquiryRecord) {
    setCohortOrgName(inquiry.organizationName);
    setCohortName(`${inquiry.organizationName} Cohort`);
    const cleanPrefix = inquiry.organizationName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8)
      .toUpperCase();
    setCohortCode(`${cleanPrefix || 'COHORT'}-${new Date().getFullYear()}`);
    const parsedSeats = parseInt(inquiry.cohortSize, 10);
    setCohortMaxSeats(isNaN(parsedSeats) ? 30 : parsedSeats);
    setCohortDuration(6);
    setDirectorName(inquiry.name);
    setDirectorEmail(inquiry.email);
    setCohortIntakeType('ROLLING');
    setInquiryIdConverting(inquiry.id);
    setShowCohortModal(true);
  }

  // Handle Update Inquiry Status
  async function handleUpdateInquiryStatus(inquiryId: string, status: any) {
    setUpdatingInquiryId(inquiryId);
    try {
      const res = await updateCohortInquiryStatusAdminAction({
        inquiryId,
        status,
      });
      if (res.ok) {
        onNotify('success', `Inquiry status updated to ${status}`);
        await onRefresh();
      } else {
        onNotify('error', res.error || 'Failed to update inquiry status');
      }
    } catch {
      onNotify('error', 'Failed to update inquiry status');
    } finally {
      setUpdatingInquiryId(null);
    }
  }

  // Handle Revoke / Refund
  async function handleConfirmRevoke() {
    if (!confirmRevokeModal) return;
    setRevokingId(confirmRevokeModal.id);

    try {
      const res = await revokeVoucherAction({
        voucherId: confirmRevokeModal.id,
        reason: revokeReason || 'AppSumo / Partner refund processed',
      });

      if (!res.ok) {
        onNotify('error', res.error || 'Failed to revoke voucher.');
        setRevokingId(null);
        return;
      }

      onNotify(
        'success',
        `Voucher ${confirmRevokeModal.code} has been revoked and associated plan downgraded.`
      );
      setConfirmRevokeModal(null);
      setRevokeReason('');
      await onRefresh();
    } catch {
      onNotify('error', 'Unexpected error revoking voucher.');
    } finally {
      setRevokingId(null);
    }
  }

  // Filtered vouchers list
  const filteredVouchers = vouchers.filter((v) => {
    if (sourceFilter !== 'ALL' && v.source !== sourceFilter) return false;
    if (statusFilter === 'UNCLAIMED' && v.status !== 'UNCLAIMED') return false;
    if (statusFilter === 'REDEEMED' && v.status !== 'REDEEMED') return false;
    if (statusFilter === 'REFUNDED_REVOKED' && v.status !== 'REFUNDED_REVOKED') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const codeMatch = v.code.toLowerCase().includes(term);
      const batchMatch = v.batchName.toLowerCase().includes(term);
      const userMatch = v.redeemedByUserEmail ? v.redeemedByUserEmail.toLowerCase().includes(term) : false;
      return codeMatch || batchMatch || userMatch;
    }
    return true;
  });

  // Filtered inquiries list
  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryStatusFilter !== 'ALL' && inq.status !== inquiryStatusFilter) return false;
    if (inquirySearch.trim()) {
      const term = inquirySearch.toLowerCase();
      const nameMatch = inq.name.toLowerCase().includes(term);
      const emailMatch = inq.email.toLowerCase().includes(term);
      const orgMatch = inq.organizationName.toLowerCase().includes(term);
      return nameMatch || emailMatch || orgMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>AppSumo LTD Codes</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {vouchers.filter((v) => v.source === 'APPSUMO').length}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {vouchers.filter((v) => v.source === 'APPSUMO' && v.status === 'REDEEMED').length} redeemed
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Cohorts</span>
              <Building className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.totalCohorts}</div>
            <div className="mt-1 text-[11px] text-slate-400">
              {cohorts.reduce((acc, c) => acc + c.seatsUsed, 0)} founders enrolled
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Inquiries & Leads</span>
              <Inbox className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{inquiries.length}</div>
            <div className="mt-1 text-[11px] text-emerald-600 font-semibold">
              {newInquiriesCount} new incoming
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Unclaimed Vouchers</span>
              <Ticket className="h-4 w-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.unclaimedVouchers}</div>
            <div className="mt-1 text-[11px] text-slate-400">Ready to distribute</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Refunded / Revoked</span>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.refundedVouchers}</div>
            <div className="mt-1 text-[11px] text-slate-400">Downgraded to Free</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Header & Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={subTab === 'COHORTS' ? 'default' : 'outline'}
            onClick={() => setSubTab('COHORTS')}
            className={`text-xs ${subTab === 'COHORTS' ? 'bg-emerald-700 text-white' : ''}`}
          >
            <Building className="mr-1.5 h-3.5 w-3.5" />
            Institutional Cohorts ({cohorts.length})
          </Button>
          <Button
            size="sm"
            variant={subTab === 'INQUIRIES' ? 'default' : 'outline'}
            onClick={() => setSubTab('INQUIRIES')}
            className={`text-xs relative ${subTab === 'INQUIRIES' ? 'bg-emerald-700 text-white' : ''}`}
          >
            <Inbox className="mr-1.5 h-3.5 w-3.5" />
            Cohort Inquiries ({inquiries.length})
            {newInquiriesCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {newInquiriesCount} new
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant={subTab === 'VOUCHERS' ? 'default' : 'outline'}
            onClick={() => setSubTab('VOUCHERS')}
            className={`text-xs ${subTab === 'VOUCHERS' ? 'bg-emerald-700 text-white' : ''}`}
          >
            <Ticket className="mr-1.5 h-3.5 w-3.5" />
            Single-Use Vouchers ({vouchers.length})
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subTab === 'VOUCHERS' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExportModal(true)}
                className="border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Export AppSumo CSV
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBatchModal(true)}
                className="bg-emerald-700 text-xs text-white hover:bg-emerald-800"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Bulk Generate Voucher Batch
              </Button>
            </>
          )}

          {subTab === 'COHORTS' && (
            <Button
              size="sm"
              onClick={() => {
                setInquiryIdConverting(null);
                setCohortOrgName('');
                setCohortName('');
                setCohortCode('');
                setShowCohortModal(true);
              }}
              className="bg-emerald-700 text-xs text-white hover:bg-emerald-800 font-semibold"
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Provision New Institutional Cohort
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => void onRefresh()}
            className="text-xs text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: INSTITUTIONAL COHORTS LIST                                      */}
      {/* ========================================================================= */}
      {subTab === 'COHORTS' && (
        <div className="space-y-4">
          {/* Informative Guidance Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-emerald-50/70 p-3.5 text-xs text-slate-900 shadow-2xs">
            <Building className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <div className="space-y-1">
              <div>
                <span className="font-semibold">Institutional Cohort Management:</span> Supports both{' '}
                <strong>Continuous Rolling Onboarding</strong> (for Google for Startups, AWS, or always-on accelerator pipelines) and{' '}
                <strong>Fixed-Batch Semesters</strong> (for university incubators & LEO cohorts).
              </div>
              <div className="text-[11px] text-emerald-900/90">
                Founders register using a single shared invite code. Upon reaching the configured Milestone Gate (e.g. 50% progress across Modules A–D + official domain verification), they can 1-click claim partner rewards, dispatching an executive dossier to the partner team.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {cohorts.length === 0 ? (
              <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                No institutional cohorts configured yet. Click &quot;Provision New Institutional Cohort&quot; to create one.
              </div>
            ) : (
              cohorts.map((c) => {
                const percent = Math.min(100, Math.round((c.seatsUsed / c.maxSeats) * 100));
                const isFull = c.seatsUsed >= c.maxSeats;
                const isRolling = c.intakeType === 'ROLLING';
                const magicUrl = `https://startuppreflight.com/register?cohort=${c.inviteCode}`;

                return (
                  <Card key={c.id} className="border-slate-200 shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          {c.organizationName && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 truncate">
                              {c.organizationName}
                            </div>
                          )}
                          <CardTitle className="text-sm font-bold text-slate-900 truncate">
                            {c.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500">
                            {c.accessDurationMonths}-Month Pass • Created {new Date(c.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              isRolling
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-sky-300 bg-sky-50 text-sky-800'
                            }`}
                          >
                            {isRolling ? '⚡ Rolling Intake' : '📅 Fixed Batch'}
                          </Badge>
                          <Badge variant={isFull ? 'destructive' : 'default'} className="text-[10px]">
                            {isFull ? 'Full' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3.5 text-xs">
                      {/* Code and Magic Link bar */}
                      <div className="rounded-lg bg-slate-50 p-2.5 font-mono text-xs flex items-center justify-between border border-slate-200">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[11px] text-slate-400 font-sans">Code:</span>
                          <span className="font-bold text-emerald-800">{c.inviteCode}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(c.inviteCode);
                              onNotify('success', `Copied cohort code ${c.inviteCode}`);
                            }}
                            title="Copy Invite Code"
                            className="h-6 px-1.5 text-slate-500 hover:text-slate-800"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(magicUrl);
                              onNotify('success', `Copied registration link: ${magicUrl}`);
                            }}
                            title="Copy Magic Onboarding URL"
                            className="h-6 px-1.5 text-emerald-700 hover:text-emerald-900 font-sans text-[10px]"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Magic Link
                          </Button>
                          <Link href={`/cohort-portal/${c.id}`} target="_blank">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              title="Open Live Institutional Portal"
                              className="h-6 px-1.5 text-emerald-700 hover:text-emerald-900 font-sans text-[10px]"
                            >
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Portal ↗
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Seats Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Seats Claimed</span>
                          <span className="font-bold text-slate-900">
                            {c.seatsUsed} / {c.maxSeats} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 90 ? 'bg-amber-500' : 'bg-emerald-700'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Milestone Gate Summary */}
                      {c.milestoneConfig ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] text-amber-950 space-y-1">
                          <div className="font-bold flex items-center gap-1 text-amber-900">
                            <Target className="h-3.5 w-3.5 text-amber-600" />
                            <span>Milestone Gate: {c.milestoneConfig.requiredProgressPercent}% Progress</span>
                          </div>
                          <div className="truncate text-amber-800">
                            🎁 Reward: <span className="font-semibold">{c.milestoneConfig.rewardLabel}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-amber-700">
                            <span>{(c.milestoneConfig.requiredModules || []).length} core modules required</span>
                            {c.milestoneConfig.requireOfficialDomain && (
                              <span className="rounded bg-amber-200/80 px-1 py-0.2 font-semibold">
                                Domain check
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-400">
                          No milestone reward gate configured (Standard cohort access).
                        </div>
                      )}

                      {/* Program Staff & Mentors */}
                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px]">
                        <div className="text-slate-500 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>Staff: {c.staff?.length || 0} assigned</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/cohort-portal/${c.id}`} target="_blank">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px] border-slate-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 font-medium"
                            >
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Portal ↗
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setManagingStaffCohort(c);
                              setNewStaffEmail('');
                              setNewStaffName('');
                            }}
                            className="h-6 px-2 text-[11px] border-slate-200 text-slate-700"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Staff
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditCohort(c)}
                            className="h-6 px-2 text-[11px] border-slate-200 text-emerald-800 hover:bg-emerald-50/70"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: COHORT INQUIRIES & LEADS                                        */}
      {/* ========================================================================= */}
      {subTab === 'INQUIRIES' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 shadow-2xs">
            <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <div>
                <span className="font-semibold">Institutional Inquiries Queue:</span> Leads submitted via the public{' '}
                <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-[11px]">/cohorts</code> institutional landing page.
              </div>
              <div className="text-[11px] text-emerald-800/90">
                Review accelerator, university incubator, or tech partner inquiries. Click <strong>&quot;⚡ Convert to Cohort&quot;</strong> to instantly pre-populate and launch a live institutional cohort with the lead assigned as Program Director.
              </div>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by contact name, email, or institution..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <select
                value={inquiryStatusFilter}
                onChange={(e) => setInquiryStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                <option value="CONVERTED">Converted</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Inquiries List */}
          <div className="space-y-3">
            {filteredInquiries.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                No cohort inquiries found matching the filter criteria.
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const isNew = inq.status === 'NEW';
                const isConverted = inq.status === 'CONVERTED';

                return (
                  <Card key={inq.id} className={`border-slate-200 shadow-2xs ${isNew ? 'ring-1 ring-amber-400' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{inq.organizationName}</span>
                            <Badge
                              className={`text-[10px] ${
                                isNew
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : isConverted
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {inq.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {inq.name} ({inq.organizationType || 'Partner'}) •{' '}
                            <a href={`mailto:${inq.email}`} className="text-emerald-700 hover:underline">
                              {inq.email}
                            </a>
                            {inq.regionalFocus ? ` • Focus: ${inq.regionalFocus}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={inq.status}
                            disabled={updatingInquiryId === inq.id}
                            onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="DEMO_SCHEDULED">DEMO SCHEDULED</option>
                            <option value="CONVERTED">CONVERTED</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>

                          {!isConverted && (
                            <Button
                              size="sm"
                              onClick={() => handleConvertInquiryToCohort(inq)}
                              className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold"
                            >
                              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                              Convert to Live Cohort
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Inquiry details */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                        <div>
                          <span className="text-slate-400">Org Type:</span>{' '}
                          <span className="font-semibold text-slate-800">{inq.organizationType || 'General'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Est. Size:</span>{' '}
                          <span className="font-semibold text-slate-800">{inq.cohortSize || 'N/A'} founders</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Target Start:</span>{' '}
                          <span className="font-semibold text-slate-800">{inq.targetStartDate || 'Flexible'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Submitted:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {inq.goals && inq.goals.length > 0 && (
                        <div className="text-xs text-slate-700">
                          <span className="font-semibold text-slate-800">Goals:</span>{' '}
                          <span className="text-slate-600">{inq.goals.join(', ')}</span>
                        </div>
                      )}

                      {inq.notes && (
                        <div className="text-xs text-slate-700 bg-white p-2.5 rounded-md border border-slate-200">
                          <span className="font-semibold text-slate-800">Notes / Requirements:</span>{' '}
                          {inq.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: VOUCHERS LIST & SEARCH                                          */}
      {/* ========================================================================= */}
      {subTab === 'VOUCHERS' && (
        <div className="space-y-4">
          {/* Informative Guidance Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900 shadow-2xs">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <div>
              <span className="font-semibold">Single-Use Vouchers:</span> Each code generated in a batch is strictly for{' '}
              <strong>one user only</strong> (e.g. 1 AppSumo customer, partner, or individual invitee). Once claimed, the code cannot be used by a second person.
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by code, batch name, or claimant email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="h-3 w-3" />
                <span>Source:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  <option value="ALL">All Sources</option>
                  <option value="APPSUMO">AppSumo</option>
                  <option value="PARTNER">Partner</option>
                  <option value="PROMO">Promo / VIP</option>
                  <option value="COHORT">Cohort</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNCLAIMED">Unclaimed</option>
                  <option value="REDEEMED">Redeemed</option>
                  <option value="REFUNDED_REVOKED">Refunded / Revoked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Codes Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Voucher Code</th>
                    <th className="py-2.5 px-3">Batch / Campaign</th>
                    <th className="py-2.5 px-3">Source & Tier</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Claimant</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No voucher codes found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.slice(0, 100).map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{v.code}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(v.code);
                                onNotify('success', `Copied code ${v.code}`);
                              }}
                              className="text-slate-400 hover:text-slate-600"
                              title="Copy Code"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{v.batchName}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-700">{v.source}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({v.rewardType})</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {v.status === 'UNCLAIMED' && (
                            <Badge variant="outline" className="border-sky-300 bg-sky-50 text-[10px] text-sky-700">
                              Unclaimed
                            </Badge>
                          )}
                          {v.status === 'REDEEMED' && (
                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700">
                              Redeemed
                            </Badge>
                          )}
                          {v.status === 'REFUNDED_REVOKED' && (
                            <Badge variant="outline" className="border-red-300 bg-red-50 text-[10px] text-red-700">
                              Revoked
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {v.redeemedByUserEmail ? (
                            <div>
                              <div className="font-medium text-slate-800">{v.redeemedByUserEmail}</div>
                              {v.redeemedAt && (
                                <div className="text-[10px] text-slate-400">
                                  {new Date(v.redeemedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {v.status === 'REDEEMED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmRevokeModal(v)}
                              className="h-7 text-[11px] text-red-600 hover:bg-red-50"
                            >
                              Revoke / Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredVouchers.length > 100 && (
              <div className="border-t border-slate-100 bg-slate-50 p-2 text-center text-xs text-slate-500">
                Showing first 100 of {filteredVouchers.length} codes. Use search to refine.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BULK GENERATE VOUCHERS                                           */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg border-slate-200 bg-white shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Bulk Generate Single-Use Vouchers
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Generate unique, cryptographically random codes and auto-download CSV for AppSumo / Partners.
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleGenerateBatch} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="batch-name" className="text-xs font-semibold">
                    Batch Name / Campaign
                  </Label>
                  <Input
                    id="batch-name"
                    placeholder="e.g. AppSumo_Launch_Batch_1 or TechStars_2027"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Source Channel</Label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as any)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="APPSUMO">AppSumo</option>
                      <option value="PARTNER">Partner Deal</option>
                      <option value="PROMO">Promotional / VIP</option>
                      <option value="COHORT">Cohort</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Reward Tier</Label>
                    <select
                      value={rewardType}
                      onChange={(e) => setRewardType(e.target.value as any)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="APPSUMO_LTD">AppSumo Lifetime (Stackable)</option>
                      <option value="PASS_SOLO">6-Month Solo Pass</option>
                      <option value="PASS_COFOUNDER">6-Month Co-Founder Pass</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="quantity" className="text-xs font-semibold">
                      Quantity of Codes
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={5000}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prefix" className="text-xs font-semibold">
                      Code Prefix (Optional)
                    </Label>
                    <Input
                      id="prefix"
                      placeholder="e.g. AS- or TIK-"
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="batch-notes" className="text-xs font-semibold">
                    Internal Notes / Audit
                  </Label>
                  <Input
                    id="batch-notes"
                    placeholder="e.g. Contract signed on March 2027 by Tom"
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowBatchModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-emerald-700 text-xs text-white hover:bg-emerald-800 font-semibold"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Generating Batch...
                      </>
                    ) : (
                      'Generate & Download CSV'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROVISION / CREATE INSTITUTIONAL COHORT                          */}
      {/* ========================================================================= */}
      {showCohortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <Card className="w-full max-w-xl border-slate-200 bg-white shadow-xl my-8">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-700" />
                    Provision Institutional Cohort
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure institutional parameters, intake type, director assignment, and Milestone Gate.
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCohortModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleCreateCohort} className="space-y-4">
                {/* Basic Institutional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-org" className="text-xs font-semibold">
                      Organization / Partner
                    </Label>
                    <Input
                      id="cohort-org"
                      placeholder="e.g. Google for Startups, NovaUCD"
                      value={cohortOrgName}
                      onChange={(e) => setCohortOrgName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-name" className="text-xs font-semibold">
                      Cohort Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cohort-name"
                      placeholder="e.g. Google Cloud Accelerator 2026"
                      value={cohortName}
                      onChange={(e) => setCohortName(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cohort-code" className="text-xs font-semibold">
                      Shared Invite Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cohort-code"
                      placeholder="e.g. GOOGLE-2026 or UCD-SPRING"
                      value={cohortCode}
                      onChange={(e) => setCohortCode(e.target.value.toUpperCase())}
                      className="font-mono text-xs uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Intake Architecture</Label>
                    <select
                      value={cohortIntakeType}
                      onChange={(e) => setCohortIntakeType(e.target.value as CohortIntakeType)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-600 font-medium"
                    >
                      <option value="ROLLING">⚡ Rolling Intake (Continuous Onboarding)</option>
                      <option value="FIXED_BATCH">📅 Fixed Batch (Semester / Single Class)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="max-seats" className="text-xs font-semibold">
                      Seat Cap
                    </Label>
                    <Input
                      id="max-seats"
                      type="number"
                      min={1}
                      max={1000}
                      value={cohortMaxSeats}
                      onChange={(e) => setCohortMaxSeats(Number(e.target.value))}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Access Duration</Label>
                    <select
                      value={cohortDuration}
                      onChange={(e) => setCohortDuration(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months (Standard)</option>
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                    </select>
                  </div>
                </div>

                {/* Initial Director / Lead Contact */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-700" />
                    Program Director / Primary Contact (Optional)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="dir-email" className="text-[11px] text-slate-600 font-medium">
                        Director Email
                      </Label>
                      <Input
                        id="dir-email"
                        type="email"
                        placeholder="director@partner.org"
                        value={directorEmail}
                        onChange={(e) => setDirectorEmail(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dir-name" className="text-[11px] text-slate-600 font-medium">
                        Director Name
                      </Label>
                      <Input
                        id="dir-name"
                        placeholder="e.g. Sarah Jenkins"
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Milestone Gate & Partner Reward Configuration */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600" />
                      Milestone Gate & Partner Rewards (Google Credits Hook)
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-amber-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableMilestoneGate}
                        onChange={(e) => setEnableMilestoneGate(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600"
                      />
                      <span className="font-semibold">Enable Gate</span>
                    </label>
                  </div>

                  {enableMilestoneGate && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="space-y-1">
                        <Label htmlFor="reward-label" className="text-[11px] font-semibold text-slate-700">
                          Reward / Benefit Label
                        </Label>
                        <Input
                          id="reward-label"
                          placeholder="e.g. Google Cloud Startup Credits ($2,000 USD)"
                          value={rewardLabel}
                          onChange={(e) => setRewardLabel(e.target.value)}
                          className="text-xs bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">
                            Required Overall Progress
                          </Label>
                          <select
                            value={requiredProgressPercent}
                            onChange={(e) => setRequiredProgressPercent(Number(e.target.value))}
                            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                          >
                            <option value={25}>25% Progress</option>
                            <option value={35}>35% Progress</option>
                            <option value={50}>50% Progress (Recommended: Mod A–D)</option>
                            <option value={75}>75% Progress</option>
                            <option value={100}>100% Full Preflight Plan</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="partner-emails" className="text-[11px] font-semibold text-slate-700">
                            Partner Team Email(s)
                          </Label>
                          <Input
                            id="partner-emails"
                            placeholder="startups-ireland@google.com"
                            value={partnerNotificationEmails}
                            onChange={(e) => setPartnerNotificationEmails(e.target.value)}
                            className="text-xs bg-white"
                          />
                        </div>
                      </div>

                      {/* Required Module Checkboxes */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">
                          Specific Core Modules Required Before Claiming
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                          {MODULE_CHOICES.map((m) => {
                            const isSelected = requiredModules.includes(m.key);
                            return (
                              <label
                                key={m.key}
                                className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setRequiredModules(requiredModules.filter((k) => k !== m.key));
                                    } else {
                                      setRequiredModules([...requiredModules, m.key]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-700"
                                />
                                <span className="truncate">{m.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Underwriting Toggles */}
                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={requireOfficialDomain}
                            onChange={(e) => setRequireOfficialDomain(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-700"
                          />
                          <span>
                            <strong>Enforce Official Domain:</strong> Founder must verify active company domain (triggers affiliate matcher if missing).
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={requireWorkEmail}
                            onChange={(e) => setRequireWorkEmail(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-700"
                          />
                          <span>
                            <strong>Enforce @company Work Email:</strong> Flags generic @gmail/@yahoo consumer accounts.
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCohortModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingCohort}
                    className="bg-emerald-700 text-xs text-white hover:bg-emerald-800 font-semibold"
                  >
                    {isCreatingCohort ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      'Provision Cohort Code'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT COHORT & MILESTONE GATE                                     */}
      {/* ========================================================================= */}
      {editingCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <Card className="w-full max-w-xl border-slate-200 bg-white shadow-xl my-8">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-emerald-700" />
                    Edit Cohort Settings & Milestone Gate
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update parameters for {editingCohort.name} ({editingCohort.inviteCode})
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCohort(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleSaveEditedCohort} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Organization Name</Label>
                    <Input
                      value={editOrgName}
                      onChange={(e) => setEditOrgName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Cohort Title</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Intake Architecture</Label>
                    <select
                      value={editIntakeType}
                      onChange={(e) => setEditIntakeType(e.target.value as CohortIntakeType)}
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="ROLLING">⚡ Rolling Intake</option>
                      <option value="FIXED_BATCH">📅 Fixed Batch</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max Seats</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={editMaxSeats}
                      onChange={(e) => setEditMaxSeats(Number(e.target.value))}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Duration (Months)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={36}
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Milestone Gate Configuration */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600" />
                      Milestone Gate & Partner Rewards
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-amber-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editEnableGate}
                        onChange={(e) => setEditEnableGate(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600"
                      />
                      <span className="font-semibold">Enable Gate</span>
                    </label>
                  </div>

                  {editEnableGate && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-700">Reward Label</Label>
                        <Input
                          value={editRewardLabel}
                          onChange={(e) => setEditRewardLabel(e.target.value)}
                          className="text-xs bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">Required Progress %</Label>
                          <select
                            value={editProgressPercent}
                            onChange={(e) => setEditProgressPercent(Number(e.target.value))}
                            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                          >
                            <option value={25}>25% Progress</option>
                            <option value={35}>35% Progress</option>
                            <option value={50}>50% Progress</option>
                            <option value={75}>75% Progress</option>
                            <option value={100}>100% Progress</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">Partner Email(s)</Label>
                          <Input
                            value={editPartnerEmails}
                            onChange={(e) => setEditPartnerEmails(e.target.value)}
                            className="text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-slate-700">
                          Specific Core Modules Required
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                          {MODULE_CHOICES.map((m) => {
                            const isSelected = editModules.includes(m.key);
                            return (
                              <label
                                key={m.key}
                                className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setEditModules(editModules.filter((k) => k !== m.key));
                                    } else {
                                      setEditModules([...editModules, m.key]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-700"
                                />
                                <span className="truncate">{m.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={editRequireDomain}
                            onChange={(e) => setEditRequireDomain(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-700"
                          />
                          <span>Require verified company domain</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={editRequireWorkEmail}
                            onChange={(e) => setEditRequireWorkEmail(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-700"
                          />
                          <span>Require @company work email</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingCohort(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingCohort}
                    className="bg-emerald-700 text-xs text-white hover:bg-emerald-800 font-semibold"
                  >
                    {isUpdatingCohort ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MANAGE COHORT STAFF & MENTORS                                     */}
      {/* ========================================================================= */}
      {managingStaffCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg border-slate-200 bg-white shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-700" />
                    Manage Program Staff & Mentors
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {managingStaffCohort.name} ({managingStaffCohort.inviteCode})
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingStaffCohort(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Current Staff List */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Assigned Team Members</Label>
                {(!managingStaffCohort.staff || managingStaffCohort.staff.length === 0) ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    No directors or mentors assigned to this cohort yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {managingStaffCohort.staff.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-800">{s.name || s.email}</span>
                          <span className="text-slate-400 text-[11px] ml-1.5">({s.email})</span>
                          <Badge
                            variant="outline"
                            className={`ml-2 text-[10px] ${
                              s.role === 'DIRECTOR'
                                ? 'border-slate-300 bg-emerald-50/70 text-emerald-900'
                                : 'border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            {s.role}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isManagingStaff}
                          onClick={() => handleStaffAction('REMOVE', s.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Staff Member */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-emerald-700" />
                  Add Team Member
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Staff Email"
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="text-xs bg-white"
                  />
                  <Input
                    placeholder="Staff Full Name"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                  >
                    <option value="DIRECTOR">Program Director</option>
                    <option value="MENTOR">Cohort Mentor</option>
                  </select>
                  <Button
                    size="sm"
                    disabled={isManagingStaff || !newStaffEmail.trim()}
                    onClick={() => handleStaffAction('ADD')}
                    className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold"
                  >
                    {isManagingStaff ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Assign Staff'}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setManagingStaffCohort(null)}
                  className="text-xs"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONFIRM REFUND / REVOKE VOUCHER                                  */}
      {/* ========================================================================= */}
      {confirmRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md border-red-200 bg-white shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-red-950">
                  Revoke Voucher / Process Refund
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600">
                This will immediately revoke voucher <strong>{confirmRevokeModal.code}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="rounded-lg border border-red-100 bg-red-50/70 p-3 text-xs text-red-900 space-y-1">
                <div className="font-semibold">Consequences of Revocation:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-800">
                  <li>Voucher marked as <strong>REFUNDED_REVOKED</strong>.</li>
                  <li>Claimant ({confirmRevokeModal.redeemedByUserEmail || 'user'}) will be downgraded to <strong>FREE_HOOK</strong>.</li>
                  <li>Excess plans beyond 1 will become read-only.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="revoke-reason" className="text-xs font-semibold">
                  Reason for Revoke / Refund
                </Label>
                <Input
                  id="revoke-reason"
                  placeholder="e.g. AppSumo refund #40291 processed"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmRevokeModal(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRevoke}
                  disabled={Boolean(revokingId)}
                  className="bg-red-600 text-xs text-white hover:bg-red-700"
                >
                  {revokingId ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    'Confirm Revoke & Downgrade'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EXPORT APPSUMO PLAIN CSV                                        */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg border-emerald-200 bg-white shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Download className="h-5 w-5" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Export AppSumo-Compliant Plain CSV
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Exports codes in strict plain text, randomized, 1 single column, NO headers, and zero duplicates.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  AppSumo Partner Formatting Rules Strictly Enforced:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-900/90">
                  <li><strong>Plain text (.csv):</strong> No extra quotes or trailing commas</li>
                  <li><strong>Single column:</strong> All codes in column A only</li>
                  <li><strong>No header row:</strong> Line 1 begins immediately with the first code</li>
                  <li><strong>Randomized:</strong> Cryptographic Fisher-Yates shuffle applied</li>
                  <li><strong>No duplicates:</strong> Strict Set deduplication</li>
                  <li><strong>Code length:</strong> Strictly verified between 3 and 200 characters</li>
                </ul>
              </div>

              {/* Source Filter Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="export-source" className="text-xs font-semibold text-slate-700">
                  Voucher Source
                </Label>
                <select
                  id="export-source"
                  value={exportSource}
                  onChange={(e) => setExportSource(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="APPSUMO">AppSumo Only (Recommended)</option>
                  <option value="PARTNER">Partner Deals Only</option>
                  <option value="PROMO">Promo / VIP Only</option>
                  <option value="COHORT">Cohort Only</option>
                  <option value="ALL">All Sources</option>
                </select>
              </div>

              {/* Status Filter Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="export-status" className="text-xs font-semibold text-slate-700">
                  Voucher Status
                </Label>
                <select
                  id="export-status"
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="UNCLAIMED">Unclaimed Codes Only (Ready for AppSumo Submission)</option>
                  <option value="ALL">All Statuses (Unclaimed + Redeemed)</option>
                </select>
              </div>

              {/* Batch Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="export-batch" className="text-xs font-semibold text-slate-700">
                  Filter by Specific Batch (Optional)
                </Label>
                <select
                  id="export-batch"
                  value={exportBatch}
                  onChange={(e) => setExportBatch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">All Batches</option>
                  {Array.from(new Set(vouchers.map((v) => v.batchName))).map((b) => (
                    <option key={b} value={b}>
                      Batch: {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowExportModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExportAppSumoCsv}
                  disabled={isExportingCsv}
                  className="bg-emerald-600 text-xs text-white hover:bg-emerald-700 font-semibold"
                >
                  {isExportingCsv ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Preparing Export...
                    </>
                  ) : (
                    <>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download AppSumo CSV
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
