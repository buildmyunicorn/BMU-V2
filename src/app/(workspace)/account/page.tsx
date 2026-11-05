'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Download,
  Trash2,
  ExternalLink,
  Shield,
  Sparkles,
  RefreshCw,
  Bell,
  Globe2,
  FileText,
  AlertCircle,
  HelpCircle,
  KeyRound,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GlobalFeedbackButton } from '@/components/feedback/global-feedback-dialog';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  getAccountDetailsAction,
  updateFounderProfileAction,
  updateFounderPasswordAction,
  createStripeCustomerPortalAction,
  cancelMicroSubscriptionAction,
  exportCompleteFounderDataArchive,
  softDeleteFounderAccountAction,
  type AccountProfileData,
} from '@/app/actions/account';
import { logoutFounderAction } from '@/app/actions/auth';
import {
  getPlanTypeDisplayName,
  getPlanTypeBadgeProps,
} from '@/lib/entitlements';
import type { SupportedCountryCode } from '@/lib/localization';
import type { StartupHat } from '@/db/schema';

type ActiveTab = 'profile' | 'billing' | 'danger';

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AccountProfileData | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [primaryHat, setPrimaryHat] = useState<StartupHat>('VISION_INVESTOR');
  const [defaultCountry, setDefaultCountry] = useState<SupportedCountryCode>('IE');
  const [regionOrCounty, setRegionOrCounty] = useState('');
  const [notifySurvey, setNotifySurvey] = useState(true);
  const [notifyGrants, setNotifyGrants] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Billing State
  const [launchingPortal, setLaunchingPortal] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [billingMessage, setBillingMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Export Data State
  const [exportingData, setExportingData] = useState(false);

  // Danger Zone Deletion State
  const [deleteConfirmationPhrase, setDeleteConfirmationPhrase] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    setLoading(true);
    const res = await getAccountDetailsAction();
    if (res.ok && res.profile) {
      setProfile(res.profile);
      setFullName(res.profile.name || '');
      setPrimaryHat(res.profile.founderProfile.primaryHat || 'VISION_INVESTOR');
      setDefaultCountry(res.profile.founderProfile.defaultCountryCode || 'IE');
      setRegionOrCounty(res.profile.founderProfile.regionOrCounty || '');
      setNotifySurvey(res.profile.founderProfile.notifyOnSurveyResponse ?? true);
      setNotifyGrants(res.profile.founderProfile.notifyOnGrantDeadlines ?? true);
    } else {
      router.push('/login');
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    const res = await updateFounderProfileAction({
      name: fullName,
      primaryHat,
      regionOrCounty,
      defaultCountryCode: defaultCountry,
      notifyOnSurveyResponse: notifySurvey,
      notifyOnGrantDeadlines: notifyGrants,
    });

    if (res.ok) {
      setProfileMessage({
        type: 'success',
        text: 'Profile preferences updated successfully.',
      });
      if (profile) {
        setProfile({
          ...profile,
          name: fullName,
          founderProfile: {
            ...profile.founderProfile,
            primaryHat,
            regionOrCounty,
            defaultCountryCode: defaultCountry,
            notifyOnSurveyResponse: notifySurvey,
            notifyOnGrantDeadlines: notifyGrants,
          },
        });
      }
    } else {
      setProfileMessage({
        type: 'error',
        text: res.error || 'Failed to update profile.',
      });
    }
    setSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPassword(true);
    setPasswordMessage(null);

    const res = await updateFounderPasswordAction({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (res.ok) {
      setPasswordMessage({
        type: 'success',
        text: 'Your password has been changed securely.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({
        type: 'error',
        text: res.error || 'Failed to update password.',
      });
    }
    setUpdatingPassword(false);
  };

  const handleLaunchStripePortal = async () => {
    setLaunchingPortal(true);
    setBillingMessage(null);
    const res = await createStripeCustomerPortalAction();
    if (res.ok && res.portalUrl) {
      window.location.href = res.portalUrl;
    } else {
      setBillingMessage({
        type: 'error',
        text: res.error || 'Could not open billing portal. Please try again.',
      });
      setLaunchingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel subscription auto-renewal?\n\nYour workspace will switch to Read-Only Vault mode at the end of the current period. Your startup plans and data will remain safe and exportable.'
    );
    if (!confirmed) return;

    setCancellingSub(true);
    setBillingMessage(null);

    const res = await cancelMicroSubscriptionAction();
    if (res.ok) {
      setBillingMessage({
        type: 'success',
        text: res.message || 'Subscription renewal cancelled.',
      });
      loadAccountData();
    } else {
      setBillingMessage({
        type: 'error',
        text: res.error || 'Failed to cancel subscription renewal.',
      });
    }
    setCancellingSub(false);
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const res = await exportCompleteFounderDataArchive();
      if (res.ok && res.exportData) {
        const dataStr =
          'data:text/json;charset=utf-8,' +
          encodeURIComponent(JSON.stringify(res.exportData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute(
          'download',
          `startup-preflight-archive-${new Date().toISOString().slice(0, 10)}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else {
        alert(res.error || 'Failed to export data archive.');
      }
    } catch {
      alert('Network error while exporting data archive.');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmationPhrase.trim().toUpperCase() !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    const confirmed = window.confirm(
      'FINAL CONFIRMATION: Are you sure you want to deactivate your account?\n\n• Your startup plans will be archived.\n• Your live public surveys will be taken offline.\n• You will have 30 days to restore your account before permanent deletion.'
    );
    if (!confirmed) return;

    setDeletingAccount(true);

    const res = await softDeleteFounderAccountAction({
      confirmationPhrase: deleteConfirmationPhrase,
      passwordConfirmation: deletePassword,
    });

    if (res.ok) {
      await logoutFounderAction().catch(() => {});
      router.push('/login?account_deactivated=true');
    } else {
      setDeleteError(res.error || 'Failed to deactivate account.');
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  const entitlement = profile?.entitlement;
  const planType = entitlement?.planType || 'FREE_HOOK';
  const isVaultReadonly = entitlement?.isVaultReadonly ?? false;
  const aiUsed = entitlement?.aiCreditsUsedThisMonth || 0;
  const aiLimit = entitlement?.monthlyAiCreditsLimit || 50;
  const aiPercent = Math.min(100, Math.round((aiUsed / aiLimit) * 100));

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-8">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Workspace</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account & Settings
            </span>
          </div>

          <div className="flex items-center gap-2">
            <GlobalFeedbackButton
              variant="header-pill"
              userEmail={profile?.email}
              userName={profile?.name}
            />
            <span className="text-xs font-medium text-slate-600 hidden sm:inline">
              {profile?.email}
            </span>
            {(() => {
              const badge = getPlanTypeBadgeProps(planType, isVaultReadonly);
              return (
                <Badge variant="outline" className={badge.className}>
                  {badge.label}
                </Badge>
              );
            })()}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto mt-6 max-w-5xl px-4 sm:px-8">
        {/* Page Hero Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                  <User className="h-5 w-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  My Account & Settings
                </h1>
              </div>
              <p className="mt-2 max-w-2xl text-xs text-slate-300 sm:text-sm">
                Manage your founder profile, jurisdiction, active passes, billing invoices,
                platform AI allowance, and data privacy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={exportingData}
                className="border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                {exportingData ? (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Export All Plans (JSON)
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            Profile & Preferences
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Plan, Usage & Billing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'danger'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Data & Danger Zone
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PROFILE & PREFERENCES */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="mt-6 space-y-6">
            {profileMessage && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium ${
                  profileMessage.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            {/* Profile Information Card */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold text-slate-900">
                  Founder Profile & Regional Defaults
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Personalize your workspace defaults. Your jurisdiction controls localized
                  grant schemes (IE LEO vs. UK Innovate UK) and default currency.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="full-name" className="text-xs font-semibold text-slate-700">
                        Full Name
                      </Label>
                      <Input
                        id="full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1.5 text-base sm:text-xs"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="mt-1.5 bg-slate-50 text-slate-500 text-base sm:text-xs"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Account email is locked. Contact support to transfer ownership.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="default-country" className="text-xs font-semibold text-slate-700">
                        Default Jurisdiction & Currency
                      </Label>
                      <select
                        id="default-country"
                        value={defaultCountry}
                        onChange={(e) =>
                          setDefaultCountry(e.target.value as SupportedCountryCode)
                        }
                        className="mt-1.5 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-base text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-xs"
                      >
                        <option value="IE">🇮🇪 Ireland (EUR € — LEO & Enterprise Ireland)</option>
                        <option value="GB">🇬🇧 United Kingdom (GBP £ — Innovate UK & BBB Loans)</option>
                        <option value="US">🇺🇸 United States (USD $)</option>
                        <option value="EU">🇪🇺 European Union (EUR €)</option>
                        <option value="AU">🇦🇺 Australia (AUD $)</option>
                        <option value="CA">🇨🇦 Canada (CAD $)</option>
                        <option value="ROW">🌐 Rest of World (USD $)</option>
                      </select>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Pre-configures grant checkers, PRSI/NIC payroll, and currency symbols.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="region-county" className="text-xs font-semibold text-slate-700">
                        Region, County or Local Authority
                      </Label>
                      <Input
                        id="region-county"
                        type="text"
                        value={regionOrCounty}
                        onChange={(e) => setRegionOrCounty(e.target.value)}
                        placeholder="e.g., Dublin City, Cork, Manchester, London"
                        className="mt-1.5 text-base sm:text-xs"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Used to match your Local Enterprise Office (LEO) or UK Growth Hub.
                      </p>
                    </div>
                  </div>

                  {/* Primary Founder Hat */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Primary Founder Hat (Your Core Role)
                    </Label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Feeds into your Module F Startup Hat Allocation and CV alignment.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { id: 'VISION_INVESTOR', label: 'Vision & CEO', icon: Globe2 },
                        { id: 'PRODUCT_TECH', label: 'Product & Tech', icon: Sparkles },
                        { id: 'SALES', label: 'Sales & Growth', icon: User },
                        { id: 'OPERATIONS_ADMIN', label: 'Operations & Legal', icon: Shield },
                      ].map((hat) => {
                        const Icon = hat.icon;
                        const isSelected = primaryHat === hat.id;
                        return (
                          <button
                            key={hat.id}
                            type="button"
                            onClick={() => setPrimaryHat(hat.id as StartupHat)}
                            className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="truncate">{hat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="border-t border-slate-100 pt-4">
                    <Label className="text-xs font-semibold text-slate-700">
                      Email Notification Preferences
                    </Label>
                    <div className="mt-3 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifySurvey}
                          onChange={(e) => setNotifySurvey(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="text-xs font-medium text-slate-800">
                            Public Survey & Waitlist Response Alerts
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Receive an email alert whenever someone completes your hosted Module C customer survey.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyGrants}
                          onChange={(e) => setNotifyGrants(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="text-xs font-medium text-slate-800">
                            Grant Deadline & Eligibility Cutoff Alerts
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Get alerted 14 days before relevant LEO, Enterprise Ireland, or Innovate UK submission cutoffs.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={savingProfile}
                      className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {savingProfile ? (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Profile Preferences'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  Update Password
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Ensure your account is protected with a secure password (minimum 8 characters).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {passwordMessage && (
                  <div
                    className={`mb-4 flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium ${
                      passwordMessage.type === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border border-red-200 bg-red-50 text-red-800'
                    }`}
                  >
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                  <div>
                    <Label htmlFor="current-pw" className="text-xs font-semibold text-slate-700">
                      Current Password
                    </Label>
                    <Input
                      id="current-pw"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1.5 text-base sm:text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="new-pw" className="text-xs font-semibold text-slate-700">
                        New Password
                      </Label>
                      <Input
                        id="new-pw"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1.5 text-base sm:text-xs"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-pw" className="text-xs font-semibold text-slate-700">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-pw"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1.5 text-base sm:text-xs"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="flex justify-start pt-2">
                    <Button
                      type="submit"
                      disabled={updatingPassword}
                      variant="outline"
                      className="border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {updatingPassword ? (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PLAN, USAGE & BILLING */}
        {/* ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="mt-6 space-y-6">
            {billingMessage && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium ${
                  billingMessage.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {billingMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{billingMessage.text}</span>
              </div>
            )}

            {/* Active Subscription & Entitlement Hero */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Active Plan & Entitlements
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Your current pass tier, plan allowances, and billing status.
                    </CardDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      isVaultReadonly
                        ? 'border-amber-300 bg-amber-50 text-amber-800 px-3 py-1 text-xs font-semibold'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-1 text-xs font-semibold'
                    }
                  >
                    {isVaultReadonly ? '🔒 Read-Only Vault Mode' : '✓ Full Editing Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Current Tier
                    </span>
                    <div className="mt-1 text-lg font-extrabold text-slate-900">
                      {getPlanTypeDisplayName(planType, {
                        isVaultReadonly,
                        stackedCodesCount: entitlement?.stackedCodesCount,
                      })}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {planType === 'APPSUMO_LTD' && entitlement?.stackedCodesCount
                        ? `${entitlement.stackedCodesCount} AppSumo code(s) stacked`
                        : 'Official founder pass'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Active Startup Plans
                    </span>
                    <div className="mt-1 text-lg font-extrabold text-slate-900">
                      {profile?.totalPlansCount} / {entitlement?.maxStartupPlans || 1}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Can clone or create up to {entitlement?.maxStartupPlans || 1} distinct plans.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Pass Expiry / Window
                    </span>
                    <div className="mt-1 text-sm font-bold text-slate-900 truncate">
                      {entitlement?.accessExpiresAt
                        ? new Date(entitlement.accessExpiresAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : planType === 'APPSUMO_LTD'
                          ? 'Lifetime Access (AppSumo)'
                          : 'Free Module A Access'}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {entitlement?.accessExpiresAt
                        ? 'Transitions to Read-Only Vault when expired.'
                        : planType === 'APPSUMO_LTD'
                          ? 'Active forever under lifetime voucher license.'
                          : 'Upgrade to a 6-Month Pass to unlock Modules B–L.'}
                    </p>
                  </div>
                </div>

                {/* AI Quota Meter */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-950">
                        Monthly AI Assistant Allowance
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-900">
                      {aiUsed} / {aiLimit} calls used ({aiPercent}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        aiPercent >= 90
                          ? 'bg-red-500'
                          : aiPercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${aiPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-indigo-900/80">
                    Platform AI credits refresh on the 1st of every month. Enforces our daily ceiling to protect your account.
                  </p>
                </div>

                {/* Stripe Billing Portal & Auto-Renew Controls */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Invoices, Receipts & Card Details
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Access official VAT invoices, update corporate payment cards, and review receipt history via Stripe.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleLaunchStripePortal}
                      disabled={launchingPortal}
                      className="bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {launchingPortal ? (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Launching...
                        </>
                      ) : (
                        <>
                          Manage Invoices via Stripe
                          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancelSubscription}
                      disabled={cancellingSub}
                      className="border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {cancellingSub ? (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Auto-Renewal'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Read-Only Vault Mode Reassurance Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900">
                    The Startup Preflight Vault Guarantee
                  </div>
                  <p>
                    Even if you cancel your subscription or your pass expires, your data is never lost or deleted.
                    Your workspace enters <strong>Read-Only Vault Mode</strong>, allowing you to access, read, review, and export
                    your compiled business plans, financial models, and survey responses whenever you need them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DATA PORTABILITY & DANGER ZONE */}
        {/* ========================================================================= */}
        {activeTab === 'danger' && (
          <div className="mt-6 space-y-6">
            {/* GDPR Data Portability Card */}
            <Card className="rounded-xl border border-slate-200 bg-white shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-600" />
                  Data Portability (GDPR Article 20)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Your business model, financial numbers, and grant dossiers are 100% your property.
                  You can download your complete startup archive at any time.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-600 max-w-xl">
                    <p className="font-medium text-slate-800">
                      The export archive contains:
                    </p>
                    <ul className="mt-1.5 list-disc pl-5 space-y-0.5 text-[11px] text-slate-500">
                      <li>All 12 module payloads (Ideation, Market, Build, Operations, Team, Launchpad, Revenue, Finance, Grants, Business Plan).</li>
                      <li>Validation survey questions, Mom Test feedback, and respondent responses.</li>
                      <li>Full timestamped audit metadata and financial breakeven numbers.</li>
                    </ul>
                  </div>

                  <Button
                    type="button"
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 shrink-0"
                  >
                    {exportingData ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Preparing Archive...
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download Startup Archive (.json)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone: Soft Delete Account Card */}
            <div className="rounded-xl border-2 border-red-200 bg-red-50/40 p-6 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-950">
                    Danger Zone: Deactivate & Delete Account
                  </h3>
                  <p className="mt-1 text-xs text-red-800/90 leading-relaxed">
                    Deactivating your account will schedule all your startup plans and workspaces for deletion.
                    Any live hosted validation surveys and waitlist capture pages will be immediately taken offline.
                  </p>

                  <div className="mt-3 rounded-lg border border-red-200 bg-white/90 p-3.5 text-xs text-red-900">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-red-600" />
                      30-Day Recovery Grace Period
                    </div>
                    <p className="mt-1 text-[11px] text-red-700 leading-normal">
                      Your account will enter a 30-day soft-delete grace period. If you change your mind,
                      you can simply log back in within 30 days to reactivate your workspace. After 30 days,
                      all data will be permanently wiped from the database.
                    </p>
                  </div>

                  {deleteError && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-300 bg-red-100 p-3 text-xs font-semibold text-red-900">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
                      <span>{deleteError}</span>
                    </div>
                  )}

                  <form onSubmit={handleDeleteAccount} className="mt-5 space-y-4 max-w-lg">
                    <div>
                      <Label htmlFor="delete-confirm" className="text-xs font-bold text-red-950">
                        To confirm, type <span className="underline decoration-red-500">DELETE MY ACCOUNT</span> below:
                      </Label>
                      <Input
                        id="delete-confirm"
                        type="text"
                        value={deleteConfirmationPhrase}
                        onChange={(e) => setDeleteConfirmationPhrase(e.target.value)}
                        placeholder="DELETE MY ACCOUNT"
                        className="mt-1.5 border-red-300 bg-white text-base sm:text-xs focus:border-red-500 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="delete-pw" className="text-xs font-bold text-red-950">
                        Enter your password to authorize:
                      </Label>
                      <Input
                        id="delete-pw"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="••••••••"
                        className="mt-1.5 border-red-300 bg-white text-base sm:text-xs focus:border-red-500 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={deletingAccount}
                        className="bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
                      >
                        {deletingAccount ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Deactivating Account...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Deactivate Account (30-Day Soft Delete)
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
