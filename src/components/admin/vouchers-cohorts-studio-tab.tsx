'use client';

import React, { useState } from 'react';
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
  Layers,
  Sparkles,
  Calendar,
  Building,
  KeyRound,
  FileText,
  Loader2,
  Copy,
  Clock,
  ShieldAlert,
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
  revokeVoucherAction,
  exportAppSumoPlainCsvAction,
  type AdminVoucherSummary,
  type AdminCohortSummary,
  type VoucherSourceType,
  type VoucherRewardType,
} from '@/app/actions/admin-vouchers';

interface VouchersCohortsStudioTabProps {
  vouchers: AdminVoucherSummary[];
  cohorts: AdminCohortSummary[];
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
  stats,
  onRefresh,
  onNotify,
}: VouchersCohortsStudioTabProps) {
  const [subTab, setSubTab] = useState<'VOUCHERS' | 'COHORTS'>('VOUCHERS');
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
  const [cohortCode, setCohortCode] = useState('');
  const [cohortMaxSeats, setCohortMaxSeats] = useState(30);
  const [cohortDuration, setCohortDuration] = useState(6);
  const [isCreatingCohort, setIsCreatingCohort] = useState(false);

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

  // Download CSV from generated batch
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

  // Handle Export Plain AppSumo CSV (1 column, randomized, no header, no duplicates)
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

    setIsCreatingCohort(true);
    try {
      const res = await createCohortAction({
        name: cohortName,
        inviteCode: cohortCode,
        maxSeats: cohortMaxSeats,
        accessDurationMonths: cohortDuration,
      });

      if (!res.ok) {
        onNotify('error', res.error || 'Failed to create cohort.');
        setIsCreatingCohort(false);
        return;
      }

      onNotify(
        'success',
        `Cohort "${cohortName}" created successfully! Code: ${cohortCode.toUpperCase()}`
      );
      setShowCohortModal(false);
      setCohortName('');
      setCohortCode('');
      await onRefresh();
    } catch {
      onNotify('error', 'Unexpected error creating cohort.');
    } finally {
      setIsCreatingCohort(false);
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

      let extraText = '';
      if (res.affectedUserEmail) {
        extraText = ` Account for ${res.affectedUserEmail} adjusted to ${res.newPlanType || 'FREE_HOOK'}${
          res.vaultReadonlyApplied ? ' (Vault Mode)' : ''
        }.`;
      }

      onNotify('success', `Voucher ${res.revokedCode} successfully marked as refunded/revoked.${extraText}`);
      setConfirmRevokeModal(null);
      setRevokeReason('');
      await onRefresh();
    } catch {
      onNotify('error', 'Failed to revoke voucher.');
    } finally {
      setRevokingId(null);
    }
  }

  // Filtered vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      v.code.toLowerCase().includes(term) ||
      v.batchName.toLowerCase().includes(term) ||
      (v.redeemedByUserEmail && v.redeemedByUserEmail.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || v.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Total Issued</span>
              <Ticket className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {stats.totalVouchers}
            </div>
            <div className="mt-1 text-xs text-slate-500">Across all batches</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold uppercase tracking-wider">
              <span>Unclaimed (Ready)</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-800">
              {stats.unclaimedVouchers}
            </div>
            <div className="mt-1 text-xs text-slate-500">Available for founders</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-indigo-700 font-semibold uppercase tracking-wider">
              <span>Redeemed</span>
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-900">
              {stats.redeemedVouchers}
            </div>
            <div className="mt-1 text-xs text-slate-500">Active founder accounts</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-red-700 font-semibold uppercase tracking-wider">
              <span>Refunded / Revoked</span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-red-700">
              {stats.refundedVouchers}
            </div>
            <div className="mt-1 text-xs text-slate-500">Safely downgraded</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-amber-700 font-semibold uppercase tracking-wider">
              <span>Cohorts</span>
              <Building className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-800">
              {stats.totalCohorts}
            </div>
            <div className="mt-1 text-xs text-slate-500">Universities &amp; LEOs</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Header & Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={subTab === 'VOUCHERS' ? 'default' : 'outline'}
            onClick={() => setSubTab('VOUCHERS')}
            className="text-xs"
          >
            <Ticket className="mr-1.5 h-3.5 w-3.5" />
            Single-Use Vouchers ({vouchers.length})
          </Button>
          <Button
            size="sm"
            variant={subTab === 'COHORTS' ? 'default' : 'outline'}
            onClick={() => setSubTab('COHORTS')}
            className="text-xs"
          >
            <Building className="mr-1.5 h-3.5 w-3.5" />
            Institutional Cohorts ({cohorts.length})
          </Button>
        </div>

        <div className="flex items-center gap-2">
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
            className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Bulk Generate Voucher Batch
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCohortModal(true)}
            className="border-indigo-200 text-xs text-indigo-700 hover:bg-indigo-50"
          >
            <Building className="mr-1.5 h-3.5 w-3.5" />
            New Cohort Code
          </Button>
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
      {/* SUB-TAB 1: VOUCHERS LIST & SEARCH */}
      {/* ========================================================================= */}
      {subTab === 'VOUCHERS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by code (e.g. SUMO-SPF), batch name, or user email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNCLAIMED">Unclaimed Only</option>
                <option value="REDEEMED">Redeemed Only</option>
                <option value="REFUNDED_REVOKED">Refunded / Revoked</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Sources</option>
                <option value="APPSUMO">AppSumo</option>
                <option value="PARTNER">Partner Deal</option>
                <option value="PROMO">Promo / VIP</option>
              </select>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Voucher Code</th>
                  <th className="px-4 py-3">Batch &amp; Source</th>
                  <th className="px-4 py-3">Reward Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Redeemed By</th>
                  <th className="px-4 py-3">Created / Claimed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No vouchers found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.slice(0, 100).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        {v.code}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(v.code);
                            onNotify('success', `Copied ${v.code} to clipboard.`);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                          title="Copy code"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{v.batchName}</div>
                        <div className="text-[10px] text-slate-500">{v.source}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {v.rewardType === 'APPSUMO_LTD'
                            ? 'AppSumo LTD (Stackable)'
                            : v.rewardType === 'PASS_COFOUNDER'
                              ? `${v.durationMonths || 6}-Mo Co-Founder`
                              : `${v.durationMonths || 6}-Mo Solo`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            v.status === 'UNCLAIMED'
                              ? 'secondary'
                              : v.status === 'REDEEMED'
                                ? 'default'
                                : 'destructive'
                          }
                          className="text-[10px]"
                        >
                          {v.status === 'UNCLAIMED'
                            ? 'Ready'
                            : v.status === 'REDEEMED'
                              ? 'Redeemed'
                              : 'Revoked / Refunded'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {v.redeemedByUserEmail ? (
                          <div>
                            <div className="font-medium text-slate-900">{v.redeemedByUserEmail}</div>
                            {v.redeemedByUserName && (
                              <div className="text-[10px] text-slate-500">{v.redeemedByUserName}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not claimed yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        <div>Issued: {new Date(v.createdAt).toLocaleDateString()}</div>
                        {v.redeemedAt && (
                          <div className="text-emerald-700">
                            Claimed: {new Date(v.redeemedAt).toLocaleDateString()}
                          </div>
                        )}
                        {v.revokedAt && (
                          <div className="text-red-700">
                            Revoked: {new Date(v.revokedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.status !== 'REFUNDED_REVOKED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setConfirmRevokeModal(v);
                              setRevokeReason('AppSumo refund request');
                            }}
                            className="border-red-200 text-red-700 hover:bg-red-50 text-[11px] h-7"
                          >
                            <ShieldAlert className="mr-1 h-3 w-3" />
                            Refund / Revoke
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
            <p className="text-center text-xs text-slate-500">
              Showing first 100 of {filteredVouchers.length} matches. Use search above to narrow results.
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: COHORTS LIST */}
      {/* ========================================================================= */}
      {subTab === 'COHORTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cohorts.length === 0 ? (
              <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                No institutional cohorts configured yet. Click &quot;New Cohort Code&quot; to create one.
              </div>
            ) : (
              cohorts.map((c) => {
                const percent = Math.min(100, Math.round((c.seatsUsed / c.maxSeats) * 100));
                const isFull = c.seatsUsed >= c.maxSeats;
                return (
                  <Card key={c.id} className="border-slate-200 shadow-2xs">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900">{c.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {c.accessDurationMonths}-Month Cohort Access
                          </CardDescription>
                        </div>
                        <Badge variant={isFull ? 'destructive' : 'default'} className="text-[10px]">
                          {isFull ? 'Full' : 'Active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg bg-slate-50 p-2.5 font-mono text-xs flex items-center justify-between border border-slate-200">
                        <span className="font-bold text-indigo-700">{c.inviteCode}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(c.inviteCode);
                            onNotify('success', `Copied cohort code ${c.inviteCode}`);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Seats Claimed</span>
                          <span className="font-bold text-slate-900">
                            {c.seatsUsed} / {c.maxSeats} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 90 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Expires: {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</span>
                        <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
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
      {/* MODAL 1: BULK GENERATE VOUCHERS */}
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
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="APPSUMO">AppSumo</option>
                      <option value="PARTNER">Partner Deal</option>
                      <option value="PROMO">Promo / VIP</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Reward Tier</Label>
                    <select
                      value={rewardType}
                      onChange={(e) => setRewardType(e.target.value as any)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="APPSUMO_LTD">AppSumo LTD (Stackable)</option>
                      <option value="PASS_SOLO">Time-Pass: Solo</option>
                      <option value="PASS_COFOUNDER">Time-Pass: Co-Founder</option>
                    </select>
                  </div>
                </div>

                {rewardType !== 'APPSUMO_LTD' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Access Duration (Months)</Label>
                    <select
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months (Standard)</option>
                      <option value={12}>12 Months (1 Year)</option>
                    </select>
                  </div>
                )}

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
                      placeholder={source === 'APPSUMO' ? 'SUMO-SPF-' : 'PRTN-'}
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                      className="text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold">
                    Admin Notes (Optional)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="Internal reference notes for this batch"
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
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Generating {quantity} Codes...
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Generate &amp; Download CSV
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE COHORT */}
      {/* ========================================================================= */}
      {showCohortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Create Institutional Cohort
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create a single shared code for a university or accelerator batch.
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
            <CardContent className="pt-4">
              <form onSubmit={handleCreateCohort} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cohort-name" className="text-xs font-semibold">
                    Institution / Cohort Name
                  </Label>
                  <Input
                    id="cohort-name"
                    placeholder="e.g. NovaUCD Student Accelerator 2027"
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cohort-code" className="text-xs font-semibold">
                    Shared Invite Code
                  </Label>
                  <Input
                    id="cohort-code"
                    placeholder="e.g. SPF-UCD-2027 or LEO-DUBLIN-Q2"
                    value={cohortCode}
                    onChange={(e) => setCohortCode(e.target.value)}
                    className="font-mono text-xs uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="max-seats" className="text-xs font-semibold">
                      Max Seat Cap
                    </Label>
                    <Input
                      id="max-seats"
                      type="number"
                      min={1}
                      max={500}
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
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                    </select>
                  </div>
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
                    className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                  >
                    {isCreatingCohort ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Cohort Code'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRM REFUND / REVOKE */}
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
              <CardDescription className="text-xs">
                Code: <span className="font-mono font-bold text-slate-900">{confirmRevokeModal.code}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-900 space-y-1">
                <div className="font-semibold">Safe Downgrade Policy:</div>
                <p>
                  • If the founder has multiple stacked codes, their tier drops by 1 code.<br />
                  • If this was their only voucher, their workspace enters <strong>Read-Only Vault Mode</strong> so their startup data is preserved, but editing Modules B–L is paused.
                </p>
              </div>

              {confirmRevokeModal.redeemedByUserEmail && (
                <div className="text-xs text-slate-600">
                  Redeemed by: <strong className="text-slate-900">{confirmRevokeModal.redeemedByUserEmail}</strong>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="revoke-reason" className="text-xs font-semibold">
                  Refund Reason / Notes
                </Label>
                <Input
                  id="revoke-reason"
                  placeholder="e.g. AppSumo 60-day refund ticket #1294"
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
      {/* MODAL 4: EXPORT APPSUMO PLAIN CSV                                        */}
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="APPSUMO">AppSumo Only (Recommended)</option>
                  <option value="PARTNER">Partner Deals Only</option>
                  <option value="PROMO">Promo / VIP Only</option>
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
