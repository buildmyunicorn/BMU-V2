'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  TrendingUp,
  DollarSign,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Edit2,
  Save,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Play,
  ArrowRight,
  Filter,
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
  getAdminSurveyBoostDataAction,
  updateAdminSurveyBoostTierAction,
  dispatchOrderToProlificAction,
  updateSurveyBoostOrderStatusAction,
  type AdminSurveyBoostData,
} from '@/app/actions/admin-survey-boost';

interface SurveyBoostStudioTabProps {
  onNotify?: (type: 'success' | 'error' | 'warning', text: string) => void;
}

export function SurveyBoostStudioTab({ onNotify }: SurveyBoostStudioTabProps) {
  const [data, setData] = useState<AdminSurveyBoostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ORDERS' | 'PRICING_TIERS'>('ORDERS');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'DISPATCHED' | 'COMPLETED'>('ALL');

  // Editing state for pricing tiers
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierEditForm, setTierEditForm] = useState<{
    tierName: string;
    description: string;
    badgeLabel: string;
    responseCount: number;
    priceEur: number;
    priceGbp: number;
    priceUsd: number;
    turnaroundHours: number;
    isActive: boolean;
  }>({
    tierName: '',
    description: '',
    badgeLabel: '',
    responseCount: 25,
    priceEur: 49,
    priceGbp: 42,
    priceUsd: 55,
    turnaroundHours: 24,
    isActive: true,
  });

  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getAdminSurveyBoostDataAction();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        onNotify?.('error', res.error || 'Failed to load survey boost telemetry');
      }
    } catch (err: any) {
      onNotify?.('error', err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleStartEditTier(tier: any) {
    setEditingTierId(tier.id);
    setTierEditForm({
      tierName: tier.tierName,
      description: tier.description || '',
      badgeLabel: tier.badgeLabel || '',
      responseCount: tier.responseCount,
      priceEur: tier.priceEurCents / 100,
      priceGbp: tier.priceGbpCents / 100,
      priceUsd: (tier.priceUsdCents || 0) / 100,
      turnaroundHours: tier.turnaroundHours,
      isActive: tier.isActive,
    });
  }

  async function handleSaveTier(tierId: string) {
    try {
      const res = await updateAdminSurveyBoostTierAction({
        id: tierId,
        tierName: tierEditForm.tierName,
        description: tierEditForm.description,
        badgeLabel: tierEditForm.badgeLabel || null,
        responseCount: Number(tierEditForm.responseCount),
        priceEurCents: Math.round(Number(tierEditForm.priceEur) * 100),
        priceGbpCents: Math.round(Number(tierEditForm.priceGbp) * 100),
        priceUsdCents: Math.round(Number(tierEditForm.priceUsd) * 100),
        turnaroundHours: Number(tierEditForm.turnaroundHours),
        isActive: tierEditForm.isActive,
      });

      if (res.success) {
        onNotify?.('success', 'Pricing tier updated successfully');
        setEditingTierId(null);
        loadData(true);
      } else {
        onNotify?.('error', res.error || 'Failed to update pricing tier');
      }
    } catch (err: any) {
      onNotify?.('error', err.message || 'Error updating tier');
    }
  }

  async function handleDispatchToProlific(orderId: string) {
    setDispatchingOrderId(orderId);
    try {
      const res = await dispatchOrderToProlificAction(orderId);
      if (res.success) {
        onNotify?.('success', `Successfully dispatched study to Prolific! Study ID: ${res.studyId}`);
        loadData(true);
      } else {
        onNotify?.('error', res.error || 'Failed to dispatch study to Prolific');
      }
    } catch (err: any) {
      onNotify?.('error', err.message || 'Error dispatching to Prolific');
    } finally {
      setDispatchingOrderId(null);
    }
  }

  async function handleMarkStatus(orderId: string, status: any, delivered?: number) {
    setUpdatingOrderId(orderId);
    try {
      const res = await updateSurveyBoostOrderStatusAction({
        orderId,
        status,
        deliveredResponses: delivered,
      });
      if (res.success) {
        onNotify?.('success', `Order status updated to ${status}`);
        loadData(true);
      } else {
        onNotify?.('error', res.error || 'Failed to update status');
      }
    } catch (err: any) {
      onNotify?.('error', err.message || 'Error updating status');
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          Loading Guaranteed Responses &amp; Prolific Panel Engine...
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalOrders: 0,
    totalRevenueEur: 0,
    totalDeliveredResponses: 0,
    activeOrdersCount: 0,
  };

  const prolificAcc = data?.prolificAccount;
  const filteredOrders = (data?.orders || []).filter((orderItem: any) => {
    if (orderFilter === 'ALL') return true;
    return orderItem.status === orderFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Prolific Telemetry Card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Metric 1 */}
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Boost Orders
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {stats.totalOrders}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500">
            {stats.activeOrdersCount} in progress or pending
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Boost Revenue
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700">
              €{(stats.totalRevenueEur / 100).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500">
            100% upfront Stripe one-off capture
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border-slate-200 bg-white shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Delivered Responses
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-800">
              {stats.totalDeliveredResponses}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500">
            Verified human panelists ingested
          </CardContent>
        </Card>

        {/* Metric 4: Prolific Live Balance */}
        <Card className="border-slate-200 bg-gradient-to-br from-emerald-50/60 to-white shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                Prolific API Status
              </CardDescription>
              <Badge variant="outline" className="border-slate-200 bg-white text-[10px] text-emerald-800">
                Live Connected
              </Badge>
            </div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Wallet className="h-5 w-5 text-emerald-700" />
              {prolificAcc ? (
                <>
                  {prolificAcc.currency === 'GBP' ? '£' : '€'}
                  {prolificAcc.available_balance || '0.00'}
                </>
              ) : (
                'Connected'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-slate-900/80">
            {prolificAcc?.email ? `Account: ${prolificAcc.email}` : 'Token active & ready for dispatch'}
          </CardContent>
        </Card>
      </div>

      {/* Sub navigation and refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeSubTab === 'ORDERS' ? 'default' : 'outline'}
            onClick={() => setActiveSubTab('ORDERS')}
            className={activeSubTab === 'ORDERS' ? 'bg-slate-900 text-white' : ''}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Customer Orders Queue ({data?.orders.length || 0})
          </Button>
          <Button
            size="sm"
            variant={activeSubTab === 'PRICING_TIERS' ? 'default' : 'outline'}
            onClick={() => setActiveSubTab('PRICING_TIERS')}
            className={activeSubTab === 'PRICING_TIERS' ? 'bg-slate-900 text-white' : ''}
          >
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Response Pack Pricing Tiers ({data?.tiers.length || 0})
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="text-xs text-slate-600 hover:text-slate-900"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* TAB 1: ORDERS QUEUE */}
      {activeSubTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Filter:</span>
              {(['ALL', 'PENDING', 'PAID', 'DISPATCHED', 'COMPLETED'] as const).map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={orderFilter === st ? 'secondary' : 'ghost'}
                  onClick={() => setOrderFilter(st)}
                  className="h-7 text-xs"
                >
                  {st}
                </Button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <Card className="border-dashed border-slate-200 p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">No boost orders found</p>
              <p className="text-xs text-slate-500">
                Orders placed by founders in Module C Step 3 will appear here with 1-click Prolific dispatch.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order: any) => {
                const isPaid = order.status === 'PAID';
                const isDispatched = order.status === 'DISPATCHED_TO_PANEL' || order.status === 'DISPATCHED';
                const isCompleted = order.status === 'COMPLETED';
                const progressPct = Math.min(
                  100,
                  Math.round(((order.deliveredResponses || 0) / (order.targetResponses || 1)) * 100)
                );
                const currency = order.currency || 'EUR';
                const formattedPrice =
                  currency === 'GBP'
                    ? `£${((order.amountPaidCents || 0) / 100).toFixed(2)}`
                    : `€${((order.amountPaidCents || 0) / 100).toFixed(2)}`;

                return (
                  <Card key={order.id} className="border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Left: Founder and Survey Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {order.planTitle || 'Untitled Plan'}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-600">
                            {order.userName || order.userEmail} ({order.userEmail})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-medium text-emerald-800">Survey:</span>
                          <span>{order.surveyTitle}</span>
                          {order.surveySlug && (
                            <a
                              href={`/v/${order.surveySlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 text-emerald-700 hover:underline"
                            >
                              (/v/{order.surveySlug}) <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                          <span>
                            Responses: <strong>{order.targetResponses} verified answers</strong> ({order.tierName})
                          </span>
                          <span>•</span>
                          <span>
                            Paid: <strong>{formattedPrice}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Ordered: {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Right: Status and Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDispatched
                                ? 'bg-blue-100 text-blue-800'
                                : isPaid
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }
                          >
                            {order.status}
                          </Badge>

                          {order.prolificStudyId && (
                            <Badge variant="outline" className="border-slate-200 text-[10px] text-emerald-800">
                              Prolific ID: {order.prolificStudyId.slice(0, 10)}...
                            </Badge>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-48 text-right">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Delivered</span>
                            <span className="font-semibold text-slate-800">
                              {order.deliveredResponses} / {order.targetResponses} ({progressPct}%)
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-emerald-700 transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {/* Dispatch to Prolific if Paid but not yet Dispatched */}
                          {isPaid && (
                            <Button
                              size="sm"
                              className="h-7 bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
                              disabled={dispatchingOrderId === order.id}
                              onClick={() => handleDispatchToProlific(order.id)}
                            >
                              {dispatchingOrderId === order.id ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  Creating on Prolific...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-1 h-3 w-3" />
                                  Dispatch to Prolific
                                </>
                              )}
                            </Button>
                          )}

                          {isDispatched && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleMarkStatus(order.id, 'COMPLETED')}
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Demographic targeting snapshot if selected */}
                    {order.targetDemographicsJson && Object.keys(order.targetDemographicsJson).length > 0 && (
                      <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Demographic Targeting: </span>
                        {JSON.stringify(order.targetDemographicsJson)}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRICING TIERS MANAGEMENT */}
      {activeSubTab === 'PRICING_TIERS' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-emerald-50/70 p-4 text-xs text-slate-900">
            <h3 className="font-bold">100% Dynamic Pricing &amp; Quantities Control</h3>
            <p className="mt-1 leading-relaxed text-emerald-900">
              Update pricing in EUR and GBP, change sample response counts (e.g. adjust 25 to 30), turnaround hours,
              or toggle tiers on and off. All changes take effect in the founder workspace instantly without code redeployments.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(data?.tiers || []).map((tier) => {
              const isEditing = editingTierId === tier.id;

              return (
                <Card
                  key={tier.id}
                  className={`border transition-all ${
                    isEditing ? 'border-emerald-500 shadow-md ring-2 ring-emerald-200' : 'border-slate-200 bg-white'
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={tier.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {tier.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-400">{tier.tierName}</span>
                    </div>

                    {!isEditing ? (
                      <>
                        <CardTitle className="mt-2 text-base font-bold text-slate-900">{tier.tierName}</CardTitle>
                        <CardDescription className="text-xs">{tier.description}</CardDescription>
                      </>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <div>
                          <Label className="text-[11px]">Tier Display Name</Label>
                          <Input
                            size={1}
                            value={tierEditForm.tierName}
                            onChange={(e) => setTierEditForm({ ...tierEditForm, tierName: e.target.value })}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">Description</Label>
                          <Input
                            size={1}
                            value={tierEditForm.description}
                            onChange={(e) => setTierEditForm({ ...tierEditForm, description: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px]">Badge Label (Optional)</Label>
                          <Input
                            size={1}
                            value={tierEditForm.badgeLabel}
                            placeholder="e.g. ⭐ Recommended for Grants"
                            onChange={(e) => setTierEditForm({ ...tierEditForm, badgeLabel: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-2">
                    {!isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs text-slate-500">Responses:</span>
                          <span className="text-lg font-bold text-slate-900">{tier.responseCount} Human Answers</span>
                        </div>
                        <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs text-slate-500">Price (EUR):</span>
                          <span className="text-base font-bold text-emerald-700">€{(tier.priceEurCents / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs text-slate-500">Price (GBP):</span>
                          <span className="text-base font-bold text-emerald-800">£{(tier.priceGbpCents / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-baseline justify-between pb-2">
                          <span className="text-xs text-slate-500">Turnaround:</span>
                          <span className="text-xs font-semibold text-slate-700">{tier.turnaroundHours} Hours</span>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEditTier(tier)}
                          className="w-full text-xs font-medium"
                        >
                          <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                          Edit Pricing &amp; Quantities
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px]">EUR (€)</Label>
                            <Input
                              type="number"
                              step="1"
                              value={tierEditForm.priceEur}
                              onChange={(e) =>
                                setTierEditForm({ ...tierEditForm, priceEur: parseFloat(e.target.value) || 0 })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">GBP (£)</Label>
                            <Input
                              type="number"
                              step="1"
                              value={tierEditForm.priceGbp}
                              onChange={(e) =>
                                setTierEditForm({ ...tierEditForm, priceGbp: parseFloat(e.target.value) || 0 })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px]">Responses</Label>
                            <Input
                              type="number"
                              value={tierEditForm.responseCount}
                              onChange={(e) =>
                                setTierEditForm({ ...tierEditForm, responseCount: parseInt(e.target.value) || 0 })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">Hours</Label>
                            <Input
                              type="number"
                              value={tierEditForm.turnaroundHours}
                              onChange={(e) =>
                                setTierEditForm({ ...tierEditForm, turnaroundHours: parseInt(e.target.value) || 0 })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`active-${tier.id}`}
                            checked={tierEditForm.isActive}
                            onChange={(e) => setTierEditForm({ ...tierEditForm, isActive: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                          />
                          <Label htmlFor={`active-${tier.id}`} className="cursor-pointer text-xs">
                            Active in Founder Workspace
                          </Label>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveTier(tier.id)}
                            className="h-8 flex-1 bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
                          >
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTierId(null)}
                            className="h-8 text-xs"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
