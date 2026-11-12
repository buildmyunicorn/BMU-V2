'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  PauseCircle,
  Archive,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertTriangle,
  FileCheck,
  Building2,
  Euro,
  Coins,
  ShieldAlert,
  Save,
  Check,
  X,
  Trash2,
  RefreshCw,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  aiExtractGrantFromPromptAction,
  stageExtractedGrantAction,
  updateGrantStatusAction,
  updateGrantFieldsAction,
  deleteGrantPermanentlyAction,
  type GrantDirectoryRecord,
  type ExtractedGrantResult,
} from '@/app/actions/admin-grants';

interface GrantsManagementStudioTabProps {
  initialGrants: GrantDirectoryRecord[];
  onNotify: (type: 'success' | 'error' | 'warning', text: string) => void;
  onRefresh: () => Promise<void>;
}

export function GrantsManagementStudioTab({
  initialGrants,
  onNotify,
  onRefresh,
}: GrantsManagementStudioTabProps) {
  const [grants, setGrants] = useState<GrantDirectoryRecord[]>(initialGrants);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'IE' | 'GB'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'>('ALL');

  // AI Prompt Extractor State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiUrl, setAiUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<ExtractedGrantResult | null>(null);
  const [isStaging, setIsStaging] = useState(false);

  // Inspection & Editing Drawer State
  const [selectedGrant, setSelectedGrant] = useState<GrantDirectoryRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<GrantDirectoryRecord>>({});

  // Synchronize when initialGrants change
  React.useEffect(() => {
    setGrants(initialGrants);
  }, [initialGrants]);

  // Filtered grants
  const filteredGrants = useMemo(() => {
    return grants.filter((g) => {
      const matchesCountry = countryFilter === 'ALL' || g.countryCode === countryFilter;
      const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        g.grantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.providerAgency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.slug.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCountry && matchesStatus && matchesSearch;
    });
  }, [grants, countryFilter, statusFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: grants.length,
      pending: grants.filter((g) => g.status === 'PENDING_REVIEW').length,
      active: grants.filter((g) => g.status === 'ACTIVE').length,
      paused: grants.filter((g) => g.status === 'PAUSED').length,
      archived: grants.filter((g) => g.status === 'ARCHIVED').length,
    };
  }, [grants]);

  // Trigger AI extraction
  const handleExtractWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      onNotify('warning', 'Please enter a grant name or description to research.');
      return;
    }

    setIsExtracting(true);
    setExtractedPreview(null);

    try {
      const res = await aiExtractGrantFromPromptAction({
        prompt: aiPrompt,
        officialUrl: aiUrl.trim() || undefined,
      });

      if (res.success && res.grant) {
        setExtractedPreview(res.grant);
        onNotify('success', `AI successfully extracted criteria for "${res.grant.grantName}"!`);
      } else {
        onNotify('error', res.error || 'Failed to extract grant criteria.');
      }
    } catch {
      onNotify('error', 'Network error during AI extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Push AI extracted preview to PENDING_REVIEW staging
  const handleStageExtractedGrant = async () => {
    if (!extractedPreview) return;
    setIsStaging(true);

    try {
      const res = await stageExtractedGrantAction(extractedPreview);
      if (res.success) {
        onNotify('success', 'Grant staged into Review Queue (status: PENDING_REVIEW)!');
        setExtractedPreview(null);
        setAiPrompt('');
        setAiUrl('');
        await onRefresh();
        setStatusFilter('PENDING_REVIEW');
      } else {
        onNotify('error', res.error || 'Failed to stage grant in database.');
      }
    } catch {
      onNotify('error', 'Network error staging grant.');
    } finally {
      setIsStaging(false);
    }
  };

  // Update status (e.g. Approve & Go Live, Pause, Archive)
  const handleUpdateStatus = async (
    grantId: string,
    newStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'PENDING_REVIEW'
  ) => {
    try {
      const res = await updateGrantStatusAction(grantId, newStatus);
      if (res.success) {
        onNotify(
          'success',
          newStatus === 'ACTIVE'
            ? 'Grant approved and now LIVE on platform & SEO directory! 🚀'
            : `Grant status updated to ${newStatus}.`
        );
        await onRefresh();
        if (selectedGrant?.id === grantId) {
          setSelectedGrant((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        onNotify('error', res.error || 'Failed to update grant status.');
      }
    } catch {
      onNotify('error', 'Error updating status.');
    }
  };

  // Open inspection drawer
  const handleOpenDrawer = (grant: GrantDirectoryRecord) => {
    setSelectedGrant(grant);
    setEditFormData({
      grantName: grant.grantName,
      maxAmountFormatted: grant.maxAmountFormatted,
      maxFundingAmount: grant.maxFundingAmount,
      matchRatePercentage: grant.matchRatePercentage,
      providerAgency: grant.providerAgency,
      summary: grant.summary,
      descriptionMarkdown: grant.descriptionMarkdown,
      officialUrl: grant.officialUrl,
      reimbursementWarning: grant.reimbursementWarning,
      minEmployees: grant.minEmployees,
      maxEmployees: grant.maxEmployees,
      maxTradingMonths: grant.maxTradingMonths,
      leoThreeQuoteEnforced: grant.leoThreeQuoteEnforced,
    });
  };

  // Save drawer edits
  const handleSaveDrawerEdits = async () => {
    if (!selectedGrant) return;
    setIsSaving(true);

    try {
      const res = await updateGrantFieldsAction(selectedGrant.id, editFormData);
      if (res.success) {
        onNotify('success', 'Grant updates saved successfully.');
        await onRefresh();
        setSelectedGrant((prev) => (prev ? { ...prev, ...editFormData } : null));
      } else {
        onNotify('error', res.error || 'Failed to save changes.');
      }
    } catch {
      onNotify('error', 'Error saving grant changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete permanently
  const handleDeletePermanently = async (grantId: string) => {
    if (!confirm('Are you sure you want to permanently delete this grant? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await deleteGrantPermanentlyAction(grantId);
      if (res.success) {
        onNotify('success', 'Grant deleted permanently.');
        setSelectedGrant(null);
        await onRefresh();
      } else {
        onNotify('error', res.error || 'Failed to delete grant.');
      }
    } catch {
      onNotify('error', 'Error deleting grant.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO: AI ASSISTED INGESTION */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Living Grants Engine & AI Ingestion Studio
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Prompt Gemini to research, extract, and stage new IE/UK startup grants with full schema validation.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-emerald-600/40 bg-emerald-500/20 text-slate-300">
                Stage & Approve Architecture
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                className="h-8 border-emerald-600/40 bg-white/5 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh Catalog
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <form onSubmit={handleExtractWithAi} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <Label className="text-xs font-semibold text-slate-300">
                  Prompt the AI to research a scheme:
                </Label>
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder='e.g. "Add the LEO Business Priming Grant for Ireland" or "Innovate UK Design Foundations"'
                  className="mt-1 border-emerald-500/30 bg-white/10 text-sm text-white placeholder:text-emerald-400/40 focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-4">
                <Label className="text-xs font-semibold text-slate-300">
                  Official Website / URL (Optional):
                </Label>
                <Input
                  value={aiUrl}
                  onChange={(e) => setAiUrl(e.target.value)}
                  placeholder="https://localenterprise.ie/..."
                  className="mt-1 border-emerald-500/30 bg-white/10 text-sm text-white placeholder:text-emerald-400/40 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                AI extracts max caps, match %, eligible costs, 3-quote rules, and generates public SEO markdown.
              </span>
              <Button
                type="submit"
                disabled={isExtracting || !aiPrompt.trim()}
                className="bg-emerald-600 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Researching Official Rules...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Research & Extract Grant
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* AI EXTRACTION PREVIEW CARD (BEFORE STAGING) */}
          {extractedPreview && (
            <div className="mt-4 rounded-xl border border-emerald-600/40 bg-white/10 p-4 text-slate-100 backdrop-blur-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    Extracted Preview ({extractedPreview.confidenceScore}% Confidence)
                  </Badge>
                  <span className="text-sm font-bold text-white">{extractedPreview.grantName}</span>
                  <Badge variant="outline" className="border-emerald-500/30 text-xs text-slate-300">
                    {extractedPreview.countryCode === 'GB' ? '🇬🇧 UK' : '🇮🇪 Ireland'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExtractedPreview(null)}
                    className="h-7 text-xs text-slate-300 hover:text-white"
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleStageExtractedGrant}
                    disabled={isStaging}
                    className="h-7 bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-400"
                  >
                    {isStaging ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    Stage into Review Queue
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-lg bg-black/20 p-2.5">
                  <span className="text-[10px] uppercase text-emerald-400">Max Funding:</span>
                  <div className="mt-0.5 font-bold text-white">{extractedPreview.maxAmountFormatted}</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2.5">
                  <span className="text-[10px] uppercase text-emerald-400">Match Rate:</span>
                  <div className="mt-0.5 font-bold text-white">{extractedPreview.matchRatePercentage}% Co-Funded</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2.5">
                  <span className="text-[10px] uppercase text-emerald-400">Funding Type:</span>
                  <div className="mt-0.5 font-bold text-white">{extractedPreview.fundingType}</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2.5">
                  <span className="text-[10px] uppercase text-emerald-400">LEO 3-Quotes:</span>
                  <div className="mt-0.5 font-bold text-white">
                    {extractedPreview.leoThreeQuoteEnforced ? 'Enforced (> €5k)' : 'No'}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-300 leading-relaxed">
                <p><strong>Summary:</strong> {extractedPreview.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[11px] font-semibold text-emerald-300">Eligible:</span>
                  {extractedPreview.eligibleCosts.slice(0, 3).map((cost, idx) => (
                    <span key={idx} className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200">
                      {cost}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. STATS & STATUS FILTER BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('ALL')}
            className="h-8 text-xs font-semibold"
          >
            All Grants ({counts.all})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'PENDING_REVIEW' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('PENDING_REVIEW')}
            className={`h-8 text-xs font-semibold ${
              counts.pending > 0 ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100' : ''
            }`}
          >
            <Clock className="mr-1 h-3.5 w-3.5 text-amber-600" />
            Review Queue ({counts.pending})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('ACTIVE')}
            className="h-8 text-xs font-semibold text-emerald-700"
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
            Live & Active ({counts.active})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'PAUSED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('PAUSED')}
            className="h-8 text-xs font-semibold text-slate-700"
          >
            <PauseCircle className="mr-1 h-3.5 w-3.5 text-slate-500" />
            Paused / Round Closed ({counts.paused})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'ARCHIVED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('ARCHIVED')}
            className="h-8 text-xs font-semibold text-slate-500"
          >
            <Archive className="mr-1 h-3.5 w-3.5" />
            Archived ({counts.archived})
          </Button>
        </div>

        {/* SEARCH & COUNTRY TOGGLE */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, slug or agency..."
              className="h-8 w-48 pl-8 text-xs sm:w-64"
            />
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setCountryFilter('ALL')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                countryFilter === 'ALL' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCountryFilter('IE')}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                countryFilter === 'IE' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇮🇪 IE
            </button>
            <button
              onClick={() => setCountryFilter('GB')}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                countryFilter === 'GB' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇬🇧 UK
            </button>
          </div>
        </div>
      </div>

      {/* 3. GRANTS CATALOG TABLE */}
      <Card className="shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Grant Scheme & Slug</th>
                <th className="px-3 py-3">Region</th>
                <th className="px-3 py-3">Funding Cap</th>
                <th className="px-3 py-3">Match %</th>
                <th className="px-3 py-3">Stage / Fit</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No grant schemes found matching your search.
                  </td>
                </tr>
              ) : (
                filteredGrants.map((grant) => {
                  const isPending = grant.status === 'PENDING_REVIEW';
                  const isActive = grant.status === 'ACTIVE';
                  const isPaused = grant.status === 'PAUSED';

                  return (
                    <tr
                      key={grant.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isPending ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{grant.grantName}</div>
                        <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
                          <code className="rounded bg-slate-100 px-1 py-0.2 text-[10px] text-slate-600">
                            /{grant.slug}
                          </code>
                          <span>•</span>
                          <span>{grant.providerAgency}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <Badge
                          variant="outline"
                          className={
                            grant.countryCode === 'IE'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : grant.countryCode === 'GB'
                              ? 'border-blue-200 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }
                        >
                          {grant.countryCode === 'IE'
                            ? '🇮🇪 IE'
                            : grant.countryCode === 'GB'
                            ? '🇬🇧 UK'
                            : grant.countryCode}
                        </Badge>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-slate-900">{grant.maxAmountFormatted}</div>
                        <div className="text-[10px] text-slate-500">{grant.fundingType}</div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="font-medium text-slate-700">
                          {grant.matchRatePercentage ? `${grant.matchRatePercentage}%` : 'N/A'}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-slate-600">
                        {grant.stageFit || 'Any Stage'}
                      </td>

                      <td className="px-3 py-3.5">
                        {isPending ? (
                          <Badge className="border-amber-300 bg-amber-100 text-amber-800">
                            <Clock className="mr-1 h-3 w-3" />
                            Needs Approval
                          </Badge>
                        ) : isActive ? (
                          <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Live on Site
                          </Badge>
                        ) : isPaused ? (
                          <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
                            <PauseCircle className="mr-1 h-3 w-3 text-slate-500" />
                            Paused (Closed)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            Archived
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(grant.id, 'ACTIVE')}
                              className="h-7 bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Approve & Go Live
                            </Button>
                          ) : isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(grant.id, 'PAUSED')}
                              className="h-7 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              <PauseCircle className="mr-1 h-3 w-3" />
                              Pause Round
                            </Button>
                          ) : isPaused ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(grant.id, 'ACTIVE')}
                              className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Re-Open
                            </Button>
                          ) : null}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDrawer(grant)}
                            className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50/70"
                          >
                            Inspect & Edit
                            <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. SIDE INSPECTION & EDIT DRAWER */}
      {selectedGrant && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
          <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-900 border-slate-200">
                    {selectedGrant.countryCode} Scheme
                  </Badge>
                  <span className="text-xs text-slate-500">ID: {selectedGrant.id.slice(0, 8)}...</span>
                </div>
                <h3 className="mt-1 text-base font-bold text-slate-900">{selectedGrant.grantName}</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedGrant(null)}
                className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Drawer Body Form */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Scheme Name:</Label>
                  <Input
                    value={editFormData.grantName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, grantName: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Provider Agency:</Label>
                  <Input
                    value={editFormData.providerAgency || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, providerAgency: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Max Funding Formatted:</Label>
                  <Input
                    value={editFormData.maxAmountFormatted || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, maxAmountFormatted: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Max Cap Numeric ({selectedGrant.currency}):</Label>
                  <Input
                    type="number"
                    value={editFormData.maxFundingAmount || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        maxFundingAmount: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Match Rate (%):</Label>
                  <Input
                    type="number"
                    value={editFormData.matchRatePercentage || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        matchRatePercentage: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Plain-English Summary:</Label>
                <Textarea
                  rows={2}
                  value={editFormData.summary || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Detailed Public Description (Markdown):</Label>
                <Textarea
                  rows={4}
                  value={editFormData.descriptionMarkdown || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, descriptionMarkdown: e.target.value })}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Reimbursement / Disqualification Warning:</Label>
                <Textarea
                  rows={2}
                  value={editFormData.reimbursementWarning || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, reimbursementWarning: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Official Government URL:</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    value={editFormData.officialUrl || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, officialUrl: e.target.value })}
                    className="text-xs"
                  />
                  {editFormData.officialUrl && (
                    <a
                      href={editFormData.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* LEO 3-Quote rule check */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="leo3quote"
                  checked={editFormData.leoThreeQuoteEnforced ?? false}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, leoThreeQuoteEnforced: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <label htmlFor="leo3quote" className="text-xs font-medium text-slate-700">
                  Enforce LEO 3-Quote Rule (&gt; €5,000 threshold requirement)
                </label>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeletePermanently(selectedGrant.id)}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Scheme
              </Button>

              <div className="flex items-center gap-2">
                {selectedGrant.status === 'PENDING_REVIEW' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedGrant.id, 'ACTIVE')}
                    className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Approve & Publish Live
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveDrawerEdits}
                  disabled={isSaving}
                  className="bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-600"
                >
                  {isSaving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
