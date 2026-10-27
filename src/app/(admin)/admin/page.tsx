'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  Sparkles,
  Crown,
  Search,
  RefreshCw,
  Ban,
  CheckCircle2,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  SlidersHorizontal,
  FileText,
  Zap,
  X,
  Database,
  HardDrive,
  StickyNote,
  LogOut,
  Loader2,
  Mail,
  Download,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  listAdminUsersAction,
  logoutSuperAdminAction,
  updateUserEntitlementPresetAction,
  resetUserAiCreditsAction,
  suspendOrReactivateUserAction,
  softDeleteOrRestoreUserAction,
  permanentlyDeleteUserAction,
  updateAdminUserNotesAndRoleAction,
  listEarlyAccessWaitlistAction,
  updateEarlyAccessLeadStatusAction,
  deleteEarlyAccessLeadAction,
  type AdminUserRecord,
  type AccountPresetType,
  type UserRoleType,
  type EarlyAccessLeadRecord,
} from '@/app/actions/admin';
import {
  loadBmuSession,
  saveBmuSession,
} from '@/lib/auth/session-store';

type StatusFilterTab =
  | 'ALL_ACTIVE'
  | 'LIFETIME_FULL'
  | 'FREE_HOOK'
  | 'SUSPENDED'
  | 'TRASH';

const PRESET_OPTIONS: Array<{
  value: AccountPresetType;
  label: string;
  shortBadge: string;
  description: string;
}> = [
  {
    value: 'LIFETIME_FULL',
    label: '⚡ Lifetime Full Access (Everything Unlocked)',
    shortBadge: 'Lifetime Full Access',
    description:
      'All Modules A–G • 25 Startup Plans • 5 Co-Founder Seats/Plan • 1,500 AI Credits/mo • White-Label & BYOK • Never Expires',
  },
  {
    value: 'APPSUMO_T2',
    label: 'Lifetime Tier 2 — Co-Founder & Pivot',
    shortBadge: 'Lifetime Tier 2',
    description:
      'All Modules A–G • 3 Startup Plans • 3 Seats/Plan • 450 AI Credits/mo • Never Expires',
  },
  {
    value: 'APPSUMO_T1',
    label: 'Lifetime Tier 1 — Solo Founder',
    shortBadge: 'Lifetime Tier 1',
    description:
      'All Modules A–G • 1 Startup Plan • 1 Seat • 150 AI Credits/mo • Never Expires',
  },
  {
    value: 'SIX_MONTH_COFOUNDER',
    label: '6-Month Co-Founder Pass',
    shortBadge: '6-Mo Co-Founder',
    description:
      'All Modules A–G • 3 Startup Plans • 3 Seats/Plan • 500 AI Credits/mo • 6 Months Active',
  },
  {
    value: 'SIX_MONTH_SOLO',
    label: '6-Month Solo Pass',
    shortBadge: '6-Mo Solo',
    description:
      'All Modules A–G • 1 Startup Plan • 1 Seat • 250 AI Credits/mo • 6 Months Active',
  },
  {
    value: 'COHORT_PASS',
    label: 'University / Accelerator Cohort Pass',
    shortBadge: 'Cohort Pass',
    description:
      'All Modules A–G • 3 Startup Plans • 3 Seats/Plan • 500 AI Credits/mo • 6 Months Active',
  },
  {
    value: 'FREE_HOOK',
    label: 'Free Hook (Module A Only)',
    shortBadge: 'Free Hook',
    description:
      'Module A (Ideation) Only • 1 Startup Plan • 1 Seat • 50 AI Credits/mo',
  },
];

function inferPresetFromEntitlement(
  ent: AdminUserRecord['entitlement']
): AccountPresetType {
  if (ent.planType === 'APPSUMO_LTD') {
    if (ent.stackedCodesCount >= 3 || ent.whiteLabelExportEnabled) {
      return 'LIFETIME_FULL';
    }
    if (ent.stackedCodesCount === 2) {
      return 'APPSUMO_T2';
    }
    return 'APPSUMO_T1';
  }
  if (ent.planType === 'SIX_MONTH_COFOUNDER') return 'SIX_MONTH_COFOUNDER';
  if (ent.planType === 'SIX_MONTH_SOLO') return 'SIX_MONTH_SOLO';
  if (ent.planType === 'COHORT_PASS') return 'COHORT_PASS';
  return 'FREE_HOOK';
}

function isLifetimeFullAccess(ent: AdminUserRecord['entitlement']): boolean {
  return (
    ent.planType === 'APPSUMO_LTD' &&
    (ent.stackedCodesCount >= 3 || ent.whiteLabelExportEnabled)
  );
}

function getDemoFallbackAdminUsers(): AdminUserRecord[] {
  const localSession = loadBmuSession();
  const activeLocalRecord: AdminUserRecord = {
    id: localSession.user.id,
    name: `${localSession.user.name} (Your Active Session)`,
    email: localSession.user.email,
    role: localSession.user.role,
    status: 'ACTIVE',
    suspensionReason: null,
    adminInternalNotes: 'Active browser workspace session.',
    lastActiveAt: new Date().toISOString(),
    deletedAt: null,
    createdAt: new Date().toISOString(),
    plansCount: localSession.plans.length || 1,
    planTitles: localSession.plans.map((p) => p.title),
    redeemedCodes: localSession.redeemedCodes,
    entitlement: {
      planType: localSession.entitlement.planType,
      stackedCodesCount: localSession.entitlement.stackedCodesCount,
      maxStartupPlans: localSession.entitlement.maxStartupPlans,
      maxSeatsPerPlan: localSession.entitlement.maxSeatsPerPlan,
      monthlyAiCreditsLimit: localSession.entitlement.monthlyAiCreditsLimit,
      aiCreditsUsedThisMonth: localSession.entitlement.aiCreditsUsedThisMonth,
      whiteLabelExportEnabled: localSession.entitlement.whiteLabelExportEnabled,
      accessExpiresAt: localSession.entitlement.accessExpiresAt
        ? new Date(localSession.entitlement.accessExpiresAt).toISOString()
        : null,
      isVaultReadonly: localSession.entitlement.isVaultReadonly,
    },
  };

  const sampleUsers: AdminUserRecord[] = [
    activeLocalRecord,
    {
      id: 'demo-user-ciaran-2',
      name: 'Ciarán O’Connor',
      email: 'ciaran@medtech-dublin.ie',
      role: 'FOUNDER',
      status: 'ACTIVE',
      suspensionReason: null,
      adminInternalNotes: 'UCD Nova founder — requested Lifetime upgrade.',
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      deletedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      plansCount: 1,
      planTitles: ['PulseGuard AI — Remote Cardiac Monitoring'],
      redeemedCodes: [],
      entitlement: {
        planType: 'FREE_HOOK',
        stackedCodesCount: 0,
        maxStartupPlans: 1,
        maxSeatsPerPlan: 1,
        monthlyAiCreditsLimit: 50,
        aiCreditsUsedThisMonth: 45,
        whiteLabelExportEnabled: false,
        accessExpiresAt: null,
        isVaultReadonly: false,
      },
    },
    {
      id: 'demo-user-sarah-3',
      name: 'Sarah Jenkins',
      email: 'sarah@finflow-london.co.uk',
      role: 'FOUNDER',
      status: 'ACTIVE',
      suspensionReason: null,
      adminInternalNotes: 'VIP Partner — Full Lifetime Access granted.',
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      deletedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      plansCount: 3,
      planTitles: [
        'FinFlow UK — Automated VAT Treasury',
        'FinFlow B2B Marketplace Pivot',
        'PayrollBridge EU',
      ],
      redeemedCodes: ['SUMO-BMU-9910-VIP'],
      entitlement: {
        planType: 'APPSUMO_LTD',
        stackedCodesCount: 5,
        maxStartupPlans: 25,
        maxSeatsPerPlan: 5,
        monthlyAiCreditsLimit: 1500,
        aiCreditsUsedThisMonth: 120,
        whiteLabelExportEnabled: true,
        accessExpiresAt: null,
        isVaultReadonly: false,
      },
    },
    {
      id: 'demo-user-suspended-4',
      name: 'Mark Vance',
      email: 'mark@spam-survey-test.io',
      role: 'FOUNDER',
      status: 'SUSPENDED',
      suspensionReason: 'AppSumo voucher refunded — public surveys paused.',
      adminInternalNotes: 'Refund processed on Oct 19.',
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      deletedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      plansCount: 1,
      planTitles: ['QuickLead Scraper'],
      redeemedCodes: ['SUMO-BMU-1102-REF'],
      entitlement: {
        planType: 'FREE_HOOK',
        stackedCodesCount: 0,
        maxStartupPlans: 1,
        maxSeatsPerPlan: 1,
        monthlyAiCreditsLimit: 50,
        aiCreditsUsedThisMonth: 50,
        whiteLabelExportEnabled: false,
        accessExpiresAt: null,
        isVaultReadonly: true,
      },
    },
  ];

  // Deduplicate by id in case local session matches
  const seen = new Set<string>();
  return sampleUsers.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [waitlistLeads, setWaitlistLeads] = useState<EarlyAccessLeadRecord[]>(
    []
  );
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<StatusFilterTab>('ALL_ACTIVE');
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'warning';
    text: string;
  } | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Modals state
  const [suspendModalUser, setSuspendModalUser] =
    useState<AdminUserRecord | null>(null);
  const [suspensionReasonInput, setSuspensionReasonInput] =
    useState<string>('');

  const [hardDeleteModalUser, setHardDeleteModalUser] =
    useState<AdminUserRecord | null>(null);
  const [hardDeleteConfirmEmail, setHardDeleteConfirmEmail] =
    useState<string>('');

  const [notesModalUser, setNotesModalUser] =
    useState<AdminUserRecord | null>(null);
  const [notesInput, setNotesInput] = useState<string>('');
  const [roleInput, setRoleInput] = useState<UserRoleType>('FOUNDER');

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const [res, waitlistRes] = await Promise.all([
        listAdminUsersAction(),
        listEarlyAccessWaitlistAction(),
      ]);
      if (!res.authenticated) {
        router.replace('/admin/login');
        return;
      }
      setAdminAuthenticated(true);
      setAdminEmail(res.adminEmail || 'admin@buildmyunicorn.com');
      setDbConnected(res.dbConnected);
      if (res.dbConnected && res.users.length > 0) {
        setUsersList(res.users);
      } else {
        setUsersList(getDemoFallbackAdminUsers());
      }

      // Merge server/PostgreSQL waitlist leads with any browser-cached local leads
      const mergedMap = new Map<string, EarlyAccessLeadRecord>();
      for (const lead of waitlistRes.leads || []) {
        mergedMap.set(lead.email.toLowerCase(), lead);
      }
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(
            'bmu_early_access_waitlist_v1'
          );
          const localLeads: EarlyAccessLeadRecord[] = raw
            ? JSON.parse(raw)
            : [];
          for (const localLead of localLeads) {
            if (!mergedMap.has(localLead.email.toLowerCase())) {
              mergedMap.set(localLead.email.toLowerCase(), localLead);
            }
          }
        } catch {
          // ignore localStorage errors
        }
      }
      setWaitlistLeads(Array.from(mergedMap.values()));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleWaitlistStatus(lead: EarlyAccessLeadRecord) {
    const nextStatus: 'PENDING' | 'INVITED' =
      lead.status === 'INVITED' ? 'PENDING' : 'INVITED';
    await updateEarlyAccessLeadStatusAction({
      id: lead.id,
      status: nextStatus,
    });
    setWaitlistLeads((prev) => {
      const updated = prev.map((item) =>
        item.email.toLowerCase() === lead.email.toLowerCase()
          ? { ...item, status: nextStatus }
          : item
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'bmu_early_access_waitlist_v1',
          JSON.stringify(updated)
        );
      }
      return updated;
    });
  }

  async function handleDeleteWaitlistLead(lead: EarlyAccessLeadRecord) {
    await deleteEarlyAccessLeadAction({ id: lead.id });
    setWaitlistLeads((prev) => {
      const updated = prev.filter(
        (item) => item.email.toLowerCase() !== lead.email.toLowerCase()
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'bmu_early_access_waitlist_v1',
          JSON.stringify(updated)
        );
      }
      return updated;
    });
    setBannerMessage({
      type: 'warning',
      text: `Removed ${lead.email} from the Early-Access Waitlist.`,
    });
  }

  function handleExportWaitlistCsv() {
    if (waitlistLeads.length === 0) return;
    const header = [
      'Email',
      'Jurisdiction',
      'Custom Region',
      'Status',
      'Signed Up At',
    ];
    const rows = waitlistLeads.map((l) => [
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.jurisdictionCode}"`,
      `"${(l.customJurisdictionText || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.createdAt}"`,
    ]);
    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `bmu-early-access-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleCopyWaitlistEmails() {
    if (waitlistLeads.length === 0) return;
    const emailsText = waitlistLeads.map((l) => l.email).join(', ');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(emailsText);
      setBannerMessage({
        type: 'success',
        text: `Copied ${waitlistLeads.length} early-access email address(es) to clipboard.`,
      });
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * If the updated user matches the active browser session user, sync the new entitlement to localStorage
   * so returning to /workspace immediately reflects Lifetime Full Access!
   */
  function syncLocalBrowserSessionIfMatching(
    userId: string,
    email: string,
    updatedEnt: AdminUserRecord['entitlement'],
    updatedRole?: UserRoleType
  ) {
    const currentLocal = loadBmuSession();
    if (
      currentLocal.user.id === userId ||
      currentLocal.user.email.toLowerCase() === email.toLowerCase()
    ) {
      saveBmuSession({
        ...currentLocal,
        user: {
          ...currentLocal.user,
          role: updatedRole || currentLocal.user.role,
        },
        entitlement: {
          userId: currentLocal.user.id,
          planType: updatedEnt.planType,
          stackedCodesCount: updatedEnt.stackedCodesCount,
          maxStartupPlans: updatedEnt.maxStartupPlans,
          maxSeatsPerPlan: updatedEnt.maxSeatsPerPlan,
          monthlyAiCreditsLimit: updatedEnt.monthlyAiCreditsLimit,
          aiCreditsUsedThisMonth: updatedEnt.aiCreditsUsedThisMonth,
          whiteLabelExportEnabled: updatedEnt.whiteLabelExportEnabled,
          accessExpiresAt: updatedEnt.accessExpiresAt
            ? new Date(updatedEnt.accessExpiresAt)
            : null,
          isVaultReadonly: updatedEnt.isVaultReadonly,
        },
      });
    }
  }

  async function handlePresetChange(
    user: AdminUserRecord,
    preset: AccountPresetType
  ) {
    setBusyUserId(user.id);
    setBannerMessage(null);
    try {
      const res = await updateUserEntitlementPresetAction({
        userId: user.id,
        preset,
      });
      if (res.updatedEntitlement) {
        const newEnt = res.updatedEntitlement;
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, entitlement: newEnt } : u
          )
        );
        syncLocalBrowserSessionIfMatching(user.id, user.email, newEnt);

        const presetMeta = PRESET_OPTIONS.find((p) => p.value === preset);
        setBannerMessage({
          type: 'success',
          text: `Updated ${user.name} (${user.email}) to ${
            presetMeta?.shortBadge || preset
          }. All permissions and limits are live immediately.`,
        });
      }
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleResetAiCredits(user: AdminUserRecord) {
    setBusyUserId(user.id);
    try {
      await resetUserAiCreditsAction({ userId: user.id });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                entitlement: { ...u.entitlement, aiCreditsUsedThisMonth: 0 },
              }
            : u
        )
      );
      setBannerMessage({
        type: 'success',
        text: `Reset monthly AI credits to 0 used for ${user.name}.`,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleConfirmSuspend() {
    if (!suspendModalUser) return;
    const target = suspendModalUser;
    const reason =
      suspensionReasonInput.trim() || 'Account suspended by administrator.';
    setBusyUserId(target.id);
    setSuspendModalUser(null);
    setSuspensionReasonInput('');

    try {
      await suspendOrReactivateUserAction({
        userId: target.id,
        action: 'SUSPEND',
        reason,
      });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === target.id
            ? { ...u, status: 'SUSPENDED', suspensionReason: reason }
            : u
        )
      );
      setBannerMessage({
        type: 'warning',
        text: `Suspended ${target.name} (${target.email}). Active sessions are blocked and public validation surveys have been paused.`,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleReactivateUser(user: AdminUserRecord) {
    setBusyUserId(user.id);
    try {
      await suspendOrReactivateUserAction({
        userId: user.id,
        action: 'REACTIVATE',
      });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                status: 'ACTIVE',
                suspensionReason: null,
                deletedAt: null,
              }
            : u
        )
      );
      setBannerMessage({
        type: 'success',
        text: `Reactivated ${user.name} (${user.email}). Account access restored.`,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleSoftDeleteUser(user: AdminUserRecord) {
    setBusyUserId(user.id);
    try {
      await softDeleteOrRestoreUserAction({
        userId: user.id,
        action: 'SOFT_DELETE',
      });
      const nowIso = new Date().toISOString();
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: 'SOFT_DELETED', deletedAt: nowIso }
            : u
        )
      );
      setBannerMessage({
        type: 'warning',
        text: `Moved ${user.name} (${user.email}) to Trash (30-day recovery window). Login is disabled.`,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRestoreSoftDeletedUser(user: AdminUserRecord) {
    setBusyUserId(user.id);
    try {
      await softDeleteOrRestoreUserAction({
        userId: user.id,
        action: 'RESTORE',
      });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                status: 'ACTIVE',
                deletedAt: null,
                suspensionReason: null,
              }
            : u
        )
      );
      setBannerMessage({
        type: 'success',
        text: `Restored ${user.name} (${user.email}) from Trash to Active status.`,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleConfirmPermanentDelete() {
    if (!hardDeleteModalUser) return;
    const target = hardDeleteModalUser;
    setBusyUserId(target.id);
    setHardDeleteModalUser(null);
    setHardDeleteConfirmEmail('');

    try {
      await permanentlyDeleteUserAction({ userId: target.id });
      setUsersList((prev) => prev.filter((u) => u.id !== target.id));
      setBannerMessage({
        type: 'warning',
        text: `Permanently purged ${target.name} (${target.email}) and all associated startup plans.`,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleSaveNotesAndRole() {
    if (!notesModalUser) return;
    const target = notesModalUser;
    setBusyUserId(target.id);
    setNotesModalUser(null);

    try {
      await updateAdminUserNotesAndRoleAction({
        userId: target.id,
        adminInternalNotes: notesInput,
        role: roleInput,
      });
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === target.id
            ? {
                ...u,
                adminInternalNotes: notesInput.trim() || null,
                role: roleInput,
              }
            : u
        )
      );
      syncLocalBrowserSessionIfMatching(
        target.id,
        target.email,
        target.entitlement,
        roleInput
      );
      setBannerMessage({
        type: 'success',
        text: `Saved role (${roleInput}) and admin notes for ${target.name}.`,
      });
    } finally {
      setBusyUserId(null);
    }
  }

  // Compute KPI metrics
  const stats = useMemo(() => {
    const nonDeleted = usersList.filter((u) => u.status !== 'SOFT_DELETED');
    const activeCount = usersList.filter((u) => u.status === 'ACTIVE').length;
    const suspendedCount = usersList.filter(
      (u) => u.status === 'SUSPENDED'
    ).length;
    const trashCount = usersList.filter(
      (u) => u.status === 'SOFT_DELETED'
    ).length;
    const lifetimeFullCount = nonDeleted.filter((u) =>
      isLifetimeFullAccess(u.entitlement)
    ).length;
    const freeHookCount = nonDeleted.filter(
      (u) => u.entitlement.planType === 'FREE_HOOK'
    ).length;
    const totalPlans = nonDeleted.reduce((acc, u) => acc + u.plansCount, 0);
    const totalAiCreditsUsed = nonDeleted.reduce(
      (acc, u) => acc + u.entitlement.aiCreditsUsedThisMonth,
      0
    );

    return {
      totalAccounts: usersList.length,
      activeCount,
      suspendedCount,
      trashCount,
      lifetimeFullCount,
      freeHookCount,
      totalPlans,
      totalAiCreditsUsed,
    };
  }, [usersList]);

  // Filter users by tab & search query
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Tab filter
      if (activeTab === 'ALL_ACTIVE' && u.status === 'SOFT_DELETED') {
        return false;
      }
      if (
        activeTab === 'LIFETIME_FULL' &&
        (u.status === 'SOFT_DELETED' || !isLifetimeFullAccess(u.entitlement))
      ) {
        return false;
      }
      if (
        activeTab === 'FREE_HOOK' &&
        (u.status === 'SOFT_DELETED' || u.entitlement.planType !== 'FREE_HOOK')
      ) {
        return false;
      }
      if (activeTab === 'SUSPENDED' && u.status !== 'SUSPENDED') {
        return false;
      }
      if (activeTab === 'TRASH' && u.status !== 'SOFT_DELETED') {
        return false;
      }

      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchNotes = (u.adminInternalNotes || '')
          .toLowerCase()
          .includes(q);
        const matchPlan = u.planTitles.some((t) =>
          t.toLowerCase().includes(q)
        );
        return matchName || matchEmail || matchNotes || matchPlan;
      }

      return true;
    });
  }, [usersList, activeTab, searchQuery]);

  if (!adminAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2.5 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          Verifying Super Admin session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-900 text-white shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">
                  Build My Unicorn 2.0
                </span>
                <Badge className="bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40">
                  Super Admin
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Signed in as <strong className="text-slate-200">{adminEmail}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {dbConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                <Database className="h-3.5 w-3.5" />
                Cloud SQL PostgreSQL Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                <HardDrive className="h-3.5 w-3.5" />
                Local Session Sync Mode
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              className="border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>

            <Link href="/workspace">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Founder Workspace
              </Button>
            </Link>

            <Button
              size="sm"
              onClick={async () => {
                await logoutSuperAdminAction();
                router.replace('/admin/login');
              }}
              className="bg-rose-600 text-xs text-white hover:bg-rose-500"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Status / Feedback Banner */}
        {bannerMessage && (
          <div
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xs ${
              bannerMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {bannerMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="rounded-lg p-1 text-slate-500 hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Founders
                </span>
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {stats.activeCount}
                </span>
                <span className="text-xs text-slate-500">
                  of {stats.totalAccounts} total
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {stats.suspendedCount} suspended • {stats.trashCount} in trash
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Lifetime Full Access
                </span>
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-950">
                  {stats.lifetimeFullCount}
                </span>
                <Badge variant="default" className="text-[10px]">
                  Everything Unlocked
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                All Modules A–G, 25 Plans, 5 Seats &amp; White-Label
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Free Hook Accounts
                </span>
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {stats.freeHookCount}
                </span>
                <span className="text-xs text-slate-500">Module A only</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Upgrade any user to Lifetime in 1 click below
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Plans &amp; AI Telemetry
                </span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {stats.totalPlans}
                </span>
                <span className="text-xs text-slate-500">Startup Plans</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {stats.totalAiCreditsUsed} AI credits used this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Landing Page Early-Access Waitlist Leads Card */}
        <Card className="border-indigo-200/80">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-white to-amber-50/40 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-lg">
                    Landing Page Early-Access Waitlist
                  </CardTitle>
                  <Badge variant="default">
                    {waitlistLeads.length} Signup
                    {waitlistLeads.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Every founder email submitted in the &ldquo;Coming Soon&rdquo;
                  Hero card on the public landing page (<code>/</code>), stored
                  in <code>early_access_waitlist</code>.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={waitlistLeads.length === 0}
                  onClick={handleCopyWaitlistEmails}
                  className="text-xs"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  Copy All Emails
                </Button>
                <Button
                  size="sm"
                  disabled={waitlistLeads.length === 0}
                  onClick={handleExportWaitlistCsv}
                  className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {waitlistLeads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No early-access waitlist signups yet. Submit an email on the{' '}
                <Link
                  href="/"
                  className="font-semibold text-indigo-600 underline"
                >
                  public landing page (/)
                </Link>{' '}
                to see it appear here immediately.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Founder Email</th>
                      <th className="px-4 py-2.5">Jurisdiction / Hub</th>
                      <th className="px-4 py-2.5">Signed Up</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {waitlistLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {lead.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {lead.jurisdictionCode === 'OTHER' &&
                            lead.customJurisdictionText
                              ? `OTHER: ${lead.customJurisdictionText}`
                              : lead.jurisdictionCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(lead.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {lead.status === 'INVITED' ? (
                            <Badge variant="success">INVITED</Badge>
                          ) : (
                            <Badge variant="warning">PENDING LAUNCH</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleWaitlistStatus(lead)}
                              className="h-7 px-2.5 text-[11px]"
                            >
                              {lead.status === 'INVITED'
                                ? 'Mark Pending'
                                : 'Mark Invited'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWaitlistLead(lead)}
                              className="h-7 border-rose-200 bg-rose-50/50 px-2 text-[11px] text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management Directory Card */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  Founder Accounts &amp; Entitlement Control
                </CardTitle>
                <CardDescription>
                  View user account tiers, upgrade anyone to{' '}
                  <strong>Lifetime Full Access</strong> (access to everything),
                  or suspend and delete accounts.
                </CardDescription>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search name, email, startup plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    id: 'ALL_ACTIVE',
                    label: `Active & Suspended (${
                      stats.activeCount + stats.suspendedCount
                    })`,
                  },
                  {
                    id: 'LIFETIME_FULL',
                    label: `⚡ Lifetime Full Access (${stats.lifetimeFullCount})`,
                  },
                  {
                    id: 'FREE_HOOK',
                    label: `Free Hook (${stats.freeHookCount})`,
                  },
                  {
                    id: 'SUSPENDED',
                    label: `Suspended (${stats.suspendedCount})`,
                  },
                  {
                    id: 'TRASH',
                    label: `Trash / Soft-Deleted (${stats.trashCount})`,
                  },
                ] as Array<{ id: StatusFilterTab; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No accounts match the current filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredUsers.map((user) => {
                  const currentPreset = inferPresetFromEntitlement(
                    user.entitlement
                  );
                  const hasLifetimeFull = isLifetimeFullAccess(
                    user.entitlement
                  );
                  const isBusy = busyUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className={`p-5 transition-colors ${
                        user.status === 'SUSPENDED'
                          ? 'bg-amber-50/40'
                          : user.status === 'SOFT_DELETED'
                            ? 'bg-rose-50/30 opacity-85'
                            : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        {/* Left Column: Identity, Status, Plans & Notes */}
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-slate-900">
                              {user.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {user.email}
                            </span>

                            {/* Status Badge */}
                            {user.status === 'ACTIVE' && (
                              <Badge variant="success">ACTIVE</Badge>
                            )}
                            {user.status === 'SUSPENDED' && (
                              <Badge variant="warning">SUSPENDED</Badge>
                            )}
                            {user.status === 'SOFT_DELETED' && (
                              <Badge variant="destructive">
                                TRASH (SOFT DELETED)
                              </Badge>
                            )}

                            {/* Role Badge */}
                            {user.role !== 'FOUNDER' && (
                              <Badge variant="default">{user.role}</Badge>
                            )}

                            {/* Current Account Tier Badge */}
                            {hasLifetimeFull ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                                <Crown className="h-3 w-3 text-amber-300" />
                                Lifetime Full Access
                              </span>
                            ) : (
                              <Badge variant="secondary">
                                {user.entitlement.planType}
                              </Badge>
                            )}
                          </div>

                          {/* Suspension Reason Alert if Suspended */}
                          {user.status === 'SUSPENDED' &&
                            user.suspensionReason && (
                              <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100/80 px-3 py-1 text-xs font-medium text-amber-950">
                                <Ban className="h-3.5 w-3.5 text-amber-700" />
                                <span>
                                  <strong>Suspension Reason:</strong>{' '}
                                  {user.suspensionReason}
                                </span>
                              </div>
                            )}

                          {/* Soft Delete Timestamp if in Trash */}
                          {user.status === 'SOFT_DELETED' && user.deletedAt && (
                            <div className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-100/70 px-3 py-1 text-xs font-medium text-rose-900">
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              <span>
                                Moved to Trash on{' '}
                                {new Date(user.deletedAt).toLocaleDateString()}{' '}
                                • Recoverable for 30 days or permanently
                                purgeable below.
                              </span>
                            </div>
                          )}

                          {/* Entitlement Limits & Startup Plans Summary */}
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                            <span>
                              <strong>Modules:</strong>{' '}
                              {user.entitlement.planType === 'FREE_HOOK'
                                ? 'Module A Only (Locked B–G)'
                                : 'All Modules A–G Unlocked'}
                            </span>
                            <span>
                              <strong>Startup Plans:</strong> {user.plansCount}{' '}
                              / {user.entitlement.maxStartupPlans}
                            </span>
                            <span>
                              <strong>Team Seats / Plan:</strong>{' '}
                              {user.entitlement.maxSeatsPerPlan}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <strong>AI Credits:</strong>{' '}
                              {user.entitlement.aiCreditsUsedThisMonth} /{' '}
                              {user.entitlement.monthlyAiCreditsLimit}
                              {user.entitlement.aiCreditsUsedThisMonth > 0 && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleResetAiCredits(user)}
                                  className="text-[11px] font-semibold text-indigo-600 underline hover:text-indigo-800"
                                >
                                  Reset to 0
                                </button>
                              )}
                            </span>
                            {user.entitlement.whiteLabelExportEnabled && (
                              <span className="font-semibold text-indigo-700">
                                ✓ White-Label &amp; BYOK
                              </span>
                            )}
                          </div>

                          {/* Startup Plan Titles */}
                          {user.planTitles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              {user.planTitles.map((title, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
                                >
                                  {title}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Internal Admin Notes */}
                          {user.adminInternalNotes && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                              <span>
                                <strong>Admin Note:</strong>{' '}
                                {user.adminInternalNotes}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right Column: One-Click Lifetime Upgrade, Tier Selector & Suspend/Delete Controls */}
                        <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                          {/* Primary Action: 1-Click Grant Lifetime Full Access + Tier Switcher */}
                          {user.status !== 'SOFT_DELETED' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {!hasLifetimeFull ? (
                                <Button
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handlePresetChange(user, 'LIFETIME_FULL')
                                  }
                                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-xs hover:from-indigo-700 hover:to-violet-700"
                                >
                                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                                  Grant Lifetime Full Access
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  Full Lifetime Access Active
                                </span>
                              )}

                              {/* Dropdown to switch to any specific account type */}
                              <div className="flex items-center gap-1.5">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                                <select
                                  aria-label={`Change account tier for ${user.name}`}
                                  value={currentPreset}
                                  disabled={isBusy}
                                  onChange={(e) =>
                                    handlePresetChange(
                                      user,
                                      e.target.value as AccountPresetType
                                    )
                                  }
                                  className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden"
                                >
                                  {PRESET_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Secondary Row: Notes/Role, Suspend/Reactivate, Soft Delete / Hard Delete */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => {
                                setNotesModalUser(user);
                                setNotesInput(user.adminInternalNotes || '');
                                setRoleInput(user.role);
                              }}
                              className="h-7 px-2.5 text-xs"
                            >
                              <StickyNote className="h-3.5 w-3.5 text-slate-500" />
                              Role &amp; Notes
                            </Button>

                            {user.status === 'ACTIVE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => {
                                  setSuspendModalUser(user);
                                  setSuspensionReasonInput(
                                    user.suspensionReason || ''
                                  );
                                }}
                                className="h-7 border-amber-300 bg-amber-50/60 px-2.5 text-xs text-amber-900 hover:bg-amber-100"
                              >
                                <Ban className="h-3.5 w-3.5 text-amber-700" />
                                Suspend
                              </Button>
                            )}

                            {user.status === 'SUSPENDED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleReactivateUser(user)}
                                className="h-7 border-emerald-300 bg-emerald-50 px-2.5 text-xs text-emerald-900 hover:bg-emerald-100"
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-emerald-700" />
                                Reactivate Account
                              </Button>
                            )}

                            {user.status !== 'SOFT_DELETED' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleSoftDeleteUser(user)}
                                className="h-7 border-rose-200 bg-rose-50/50 px-2.5 text-xs text-rose-700 hover:bg-rose-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleRestoreSoftDeletedUser(user)
                                  }
                                  className="h-7 border-emerald-300 bg-emerald-50 px-2.5 text-xs text-emerald-900 hover:bg-emerald-100"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-emerald-700" />
                                  Restore Account
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setHardDeleteModalUser(user);
                                    setHardDeleteConfirmEmail('');
                                  }}
                                  className="h-7 px-2.5 text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Permanently Purge
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: SUSPEND ACCOUNT WITH REASON                      */}
      {/* ========================================================= */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Suspend Founder Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    {suspendModalUser.name} ({suspendModalUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuspendModalUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-950">
                <strong>What happens when you suspend this account:</strong>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>
                    Immediately blocks login and invalidates active browser
                    sessions.
                  </li>
                  <li>
                    Automatically pauses all public Hosted Validation Surveys (
                    <code>/v/[slug]</code>).
                  </li>
                  <li>
                    Preserves all Startup Plans so you can reactivate anytime in
                    1 click.
                  </li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="suspension-reason">
                  Suspension Reason (shown if user tries to sign in)
                </Label>
                <Input
                  id="suspension-reason"
                  placeholder="e.g., AppSumo refund processed / Terms of Service violation"
                  value={suspensionReasonInput}
                  onChange={(e) => setSuspensionReasonInput(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspendModalUser(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSuspend}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                Suspend Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PERMANENT HARD DELETE (GDPR PURGE)               */}
      {/* ========================================================= */}
      {hardDeleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Permanently Purge Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    {hardDeleteModalUser.name} ({hardDeleteModalUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHardDeleteModalUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-950">
                <strong>Warning — Irreversible Action:</strong> This will
                permanently delete the user record, their entitlement row, and
                all <strong>{hardDeleteModalUser.plansCount}</strong> Startup
                Plan(s) from PostgreSQL.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-delete-email">
                  Type <strong>{hardDeleteModalUser.email}</strong> to confirm
                  permanent deletion:
                </Label>
                <Input
                  id="confirm-delete-email"
                  placeholder={hardDeleteModalUser.email}
                  value={hardDeleteConfirmEmail}
                  onChange={(e) => setHardDeleteConfirmEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHardDeleteModalUser(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={
                  hardDeleteConfirmEmail.trim().toLowerCase() !==
                  hardDeleteModalUser.email.toLowerCase()
                }
                onClick={handleConfirmPermanentDelete}
              >
                Permanently Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: EDIT USER ROLE & ADMIN INTERNAL NOTES            */}
      {/* ========================================================= */}
      {notesModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <StickyNote className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Role &amp; Admin Notes
                  </h3>
                  <p className="text-xs text-slate-500">
                    {notesModalUser.name} ({notesModalUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotesModalUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="user-role-select">Platform Role</Label>
                <select
                  id="user-role-select"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as UserRoleType)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                >
                  <option value="FOUNDER">FOUNDER (Standard User)</option>
                  <option value="MENTOR">MENTOR (Advisor / Reviewer)</option>
                  <option value="TENANT_ADMIN">
                    TENANT_ADMIN (University / Cohort Admin)
                  </option>
                  <option value="SUPER_ADMIN">
                    SUPER_ADMIN (Full Platform Admin)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-notes-input">
                  Internal Admin Notes (only visible to admins)
                </Label>
                <Input
                  id="admin-notes-input"
                  placeholder="e.g., VIP Partner from UCD Nova — given Lifetime Full Access"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotesModalUser(null)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveNotesAndRole}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
