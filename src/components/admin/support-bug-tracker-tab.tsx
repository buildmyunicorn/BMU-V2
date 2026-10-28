'use client';

import React, { useState, useMemo } from 'react';
import {
  Bug,
  Sparkles,
  Bot,
  MessageSquare,
  Plus,
  Search,
  Copy,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  Pencil,
  X,
  LayoutList,
  Columns3,
  Wrench,
  Check,
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SUPPORT_TICKET_TYPE_OPTIONS,
  SUPPORT_PRIORITY_OPTIONS,
  SUPPORT_MODULE_SCOPE_OPTIONS,
  getModuleScopeLabel,
  getTicketTypeBadgeLabel,
  formatSupportTicketAsAiPrompt,
  formatBatchSupportTicketsAsAiPrompt,
  type SupportTicketRecord,
  type SupportTicketType,
  type SupportTicketPriority,
  type SupportTicketStatus,
  type SupportModuleScope,
} from '@/lib/support-tracker-store';

type StatusFilterSubTab =
  | 'ACTIVE_BACKLOG'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ARCHIVED';

type TrackerViewMode = 'LIST' | 'BOARD';

interface SupportBugTrackerTabProps {
  tickets: SupportTicketRecord[];
  adminEmail: string;
  onCreateTicket: (input: {
    ticketType: SupportTicketType;
    customTypeText?: string | null;
    priority: SupportTicketPriority;
    moduleScope: SupportModuleScope;
    stepContext?: string | null;
    pageUrl?: string | null;
    title: string;
    description: string;
    expectedBehavior?: string | null;
    adminNotes?: string | null;
  }) => Promise<void>;
  onUpdateTicket: (input: {
    id: string;
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    ticketType?: SupportTicketType;
    customTypeText?: string | null;
    moduleScope?: SupportModuleScope;
    stepContext?: string | null;
    title?: string;
    description?: string;
    expectedBehavior?: string | null;
    adminNotes?: string | null;
  }) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
  onNotify: (type: 'success' | 'warning', text: string) => void;
}

export function SupportBugTrackerTab({
  tickets,
  onCreateTicket,
  onUpdateTicket,
  onDeleteTicket,
  onNotify,
}: SupportBugTrackerTabProps) {
  // Quick-Create Form State
  const [showCreateForm, setShowCreateForm] = useState<boolean>(true);
  const [newType, setNewType] = useState<SupportTicketType>('BUG');
  const [newCustomTypeText, setNewCustomTypeText] = useState<string>('');
  const [newPriority, setNewPriority] =
    useState<SupportTicketPriority>('MEDIUM');
  const [newModuleScope, setNewModuleScope] =
    useState<SupportModuleScope>('GLOBAL');
  const [newStepContext, setNewStepContext] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newExpectedBehavior, setNewExpectedBehavior] = useState<string>('');
  const [newAdminNotes, setNewAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter & View State
  const [statusTab, setStatusTab] =
    useState<StatusFilterSubTab>('ACTIVE_BACKLOG');
  const [typeFilter, setTypeFilter] = useState<SupportTicketType | 'ALL'>(
    'ALL'
  );
  const [moduleFilter, setModuleFilter] = useState<SupportModuleScope | 'ALL'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<TrackerViewMode>('LIST');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit / Resolution Drawer Modal State
  const [editingTicket, setEditingTicket] =
    useState<SupportTicketRecord | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editExpectedBehavior, setEditExpectedBehavior] = useState<string>('');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [editPriority, setEditPriority] =
    useState<SupportTicketPriority>('MEDIUM');
  const [editStatus, setEditStatus] = useState<SupportTicketStatus>('OPEN');
  const [editType, setEditType] = useState<SupportTicketType>('BUG');
  const [editCustomTypeText, setEditCustomTypeText] = useState<string>('');
  const [editModuleScope, setEditModuleScope] =
    useState<SupportModuleScope>('GLOBAL');
  const [editStepContext, setEditStepContext] = useState<string>('');

  // Compute Summary KPIs
  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    const archived = tickets.filter((t) => t.status === 'ARCHIVED').length;
    const activeBacklog = open + inProgress;

    const activeItems = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
    );
    const activeBugs = activeItems.filter((t) => t.ticketType === 'BUG').length;
    const activeImprovements = activeItems.filter(
      (t) =>
        t.ticketType === 'IMPROVEMENT' || t.ticketType === 'AI_PROMPT_TUNING'
    ).length;
    const activeHighCritical = activeItems.filter(
      (t) => t.priority === 'CRITICAL' || t.priority === 'HIGH'
    ).length;
    const founderSupportCount = activeItems.filter(
      (t) =>
        t.ticketType === 'USER_SUPPORT' || t.source === 'FOUNDER_SUPPORT'
    ).length;

    return {
      open,
      inProgress,
      resolved,
      archived,
      activeBacklog,
      activeBugs,
      activeImprovements,
      activeHighCritical,
      founderSupportCount,
    };
  }, [tickets]);

  // Filter Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter (only applied in LIST view; BOARD view shows Open, In Progress, Resolved columns)
      if (viewMode === 'LIST') {
        if (
          statusTab === 'ACTIVE_BACKLOG' &&
          t.status !== 'OPEN' &&
          t.status !== 'IN_PROGRESS'
        ) {
          return false;
        }
        if (statusTab === 'OPEN' && t.status !== 'OPEN') return false;
        if (statusTab === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS')
          return false;
        if (statusTab === 'RESOLVED' && t.status !== 'RESOLVED') return false;
        if (statusTab === 'ARCHIVED' && t.status !== 'ARCHIVED') return false;
      } else {
        // In Kanban Board mode, exclude ARCHIVED unless explicitly viewing Archive
        if (t.status === 'ARCHIVED') return false;
      }

      if (typeFilter !== 'ALL' && t.ticketType !== typeFilter) {
        return false;
      }
      if (moduleFilter !== 'ALL' && t.moduleScope !== moduleFilter) {
        return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const hay = [
          t.title,
          t.description,
          t.expectedBehavior || '',
          t.adminNotes || '',
          t.stepContext || '',
          t.planTitle || '',
          t.moduleScope,
          t.customTypeText || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [tickets, statusTab, typeFilter, moduleFilter, searchQuery, viewMode]);

  async function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      onNotify(
        'warning',
        'Please enter both a short title and description to log an item.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTicket({
        ticketType: newType,
        customTypeText:
          newType === 'OTHER' ? newCustomTypeText.trim() || null : null,
        priority: newPriority,
        moduleScope: newModuleScope,
        stepContext: newStepContext.trim() || null,
        title: newTitle.trim(),
        description: newDescription.trim(),
        expectedBehavior: newExpectedBehavior.trim() || null,
        adminNotes: newAdminNotes.trim() || null,
      });

      setNewTitle('');
      setNewDescription('');
      setNewExpectedBehavior('');
      setNewAdminNotes('');
      setNewStepContext('');
      if (newType === 'OTHER') {
        setNewCustomTypeText('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(ticket: SupportTicketRecord) {
    setEditingTicket(ticket);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditExpectedBehavior(ticket.expectedBehavior || '');
    setEditAdminNotes(ticket.adminNotes || '');
    setEditPriority(ticket.priority);
    setEditStatus(ticket.status);
    setEditType(ticket.ticketType);
    setEditCustomTypeText(ticket.customTypeText || '');
    setEditModuleScope(ticket.moduleScope);
    setEditStepContext(ticket.stepContext || '');
  }

  async function handleSaveEdit() {
    if (!editingTicket) return;
    const id = editingTicket.id;
    setEditingTicket(null);

    await onUpdateTicket({
      id,
      title: editTitle.trim() || editingTicket.title,
      description: editDescription.trim() || editingTicket.description,
      expectedBehavior: editExpectedBehavior.trim() || null,
      adminNotes: editAdminNotes.trim() || null,
      priority: editPriority,
      status: editStatus,
      ticketType: editType,
      customTypeText:
        editType === 'OTHER' ? editCustomTypeText.trim() || null : null,
      moduleScope: editModuleScope,
      stepContext: editStepContext.trim() || null,
    });
  }

  async function handleCopySinglePrompt(ticket: SupportTicketRecord) {
    const promptText = formatSupportTicketAsAiPrompt(ticket);
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedId(ticket.id);
      setTimeout(() => setCopiedId(null), 2000);
      onNotify(
        'success',
        `Copied AI Fix Prompt for "${ticket.title}" to clipboard. Paste it into Antigravity anytime!`
      );
    } catch {
      onNotify('warning', 'Unable to copy to clipboard automatically.');
    }
  }

  async function handleCopyBatchOpenPrompt() {
    const targetList = filteredTickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
    );
    const listToCopy = targetList.length > 0 ? targetList : filteredTickets;
    if (listToCopy.length === 0) {
      onNotify('warning', 'No tickets match the current filter to copy.');
      return;
    }

    const promptText = formatBatchSupportTicketsAsAiPrompt(listToCopy);
    try {
      await navigator.clipboard.writeText(promptText);
      onNotify(
        'success',
        `Copied batch AI Fix Prompt (${listToCopy.length} issue${
          listToCopy.length === 1 ? '' : 's'
        }) to clipboard!`
      );
    } catch {
      onNotify('warning', 'Unable to copy batch prompt to clipboard.');
    }
  }

  function handleExportCsv() {
    if (tickets.length === 0) return;
    const header =
      'id,status,priority,type,module_scope,step_context,title,description,expected_behavior,admin_notes,plan_title,created_at\n';
    const rows = tickets
      .map((t) => {
        const esc = (v: string | null | undefined) =>
          `"${(v || '').replace(/"/g, '""')}"`;
        return [
          esc(t.id),
          esc(t.status),
          esc(t.priority),
          esc(getTicketTypeBadgeLabel(t)),
          esc(t.moduleScope),
          esc(t.stepContext),
          esc(t.title),
          esc(t.description),
          esc(t.expectedBehavior),
          esc(t.adminNotes),
          esc(t.planTitle),
          esc(t.createdAt),
        ].join(',');
      })
      .join('\n');

    const blob = new Blob([header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bmu-bug-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderPriorityBadge(priority: SupportTicketPriority) {
    if (priority === 'CRITICAL') {
      return (
        <Badge variant="destructive" className="text-[10px]">
          🔥 CRITICAL
        </Badge>
      );
    }
    if (priority === 'HIGH') {
      return (
        <Badge variant="warning" className="text-[10px]">
          HIGH
        </Badge>
      );
    }
    if (priority === 'MEDIUM') {
      return (
        <Badge variant="default" className="text-[10px]">
          MEDIUM
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[10px]">
        LOW
      </Badge>
    );
  }

  function renderTypeBadge(ticket: SupportTicketRecord) {
    const label = getTicketTypeBadgeLabel(ticket);
    if (ticket.ticketType === 'BUG') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          <Bug className="h-3 w-3" />
          {label}
        </span>
      );
    }
    if (ticket.ticketType === 'IMPROVEMENT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
          <Sparkles className="h-3 w-3" />
          {label}
        </span>
      );
    }
    if (ticket.ticketType === 'AI_PROMPT_TUNING') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
          <Bot className="h-3 w-3" />
          {label}
        </span>
      );
    }
    if (ticket.ticketType === 'USER_SUPPORT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          <MessageSquare className="h-3 w-3" />
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
        <Wrench className="h-3 w-3" />
        {label}
      </span>
    );
  }

  function renderStatusBadge(status: SupportTicketStatus) {
    if (status === 'OPEN') {
      return (
        <Badge variant="warning" className="text-[10px]">
          OPEN
        </Badge>
      );
    }
    if (status === 'IN_PROGRESS') {
      return (
        <Badge variant="default" className="text-[10px]">
          IN PROGRESS
        </Badge>
      );
    }
    if (status === 'RESOLVED') {
      return (
        <Badge variant="success" className="text-[10px]">
          RESOLVED
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[10px]">
        ARCHIVED
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                Active Backlog
              </span>
              <Bug className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {counts.activeBacklog}
              </span>
              <span className="text-xs text-slate-500">
                ({counts.open} Open • {counts.inProgress} In Progress)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {counts.activeBugs} Bugs • {counts.activeImprovements}{' '}
              Improvements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                High &amp; Critical Priority
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {counts.activeHighCritical}
              </span>
              <span className="text-xs text-slate-500">need attention</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Use &ldquo;Copy Batch AI Prompt&rdquo; to fix in 1 go
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Resolved &amp; Shipped
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {counts.resolved}
              </span>
              <span className="text-xs text-slate-500">completed</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {counts.archived} archived in history
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Founder Support Queue
              </span>
              <MessageSquare className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {counts.founderSupportCount}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Phase 2 Ready
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ready for founder support &amp; mentor escalations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick-Capture Form Card Inside Admin */}
      <Card className="border-indigo-200/80 shadow-xs">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-600" />
                <CardTitle className="text-base sm:text-lg">
                  Log a Bug, UX Improvement, or AI Prompt Note
                </CardTitle>
              </div>
              <CardDescription className="mt-0.5">
                Log issues directly here, or use the local{' '}
                <strong>&ldquo;Log Bug / Idea&rdquo;</strong> button inside the{' '}
                <code>/workspace</code> header while testing Modules A–K.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-xs"
            >
              {showCreateForm ? 'Collapse Form' : '+ Expand Logger Form'}
            </Button>
          </div>
        </CardHeader>

        {showCreateForm && (
          <CardContent className="p-5">
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              {/* Row 1: Type Pills (including OTHER) */}
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  1. What are you logging?
                </Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {SUPPORT_TICKET_TYPE_OPTIONS.map((opt) => {
                    const active = newType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewType(opt.value)}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                          active
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {newType === 'OTHER' && (
                  <div className="mt-2.5">
                    <Label className="mb-1 block text-xs text-slate-600">
                      Custom Issue / Note Category
                    </Label>
                    <Input
                      type="text"
                      value={newCustomTypeText}
                      onChange={(e) => setNewCustomTypeText(e.target.value)}
                      placeholder="e.g., Copywriting, Grant Rule Update, Mobile Layout..."
                      className="text-base sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Module Scope, Step Context, Priority */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    2. Module / Platform Area
                  </Label>
                  <select
                    value={newModuleScope}
                    onChange={(e) =>
                      setNewModuleScope(e.target.value as SupportModuleScope)
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  >
                    {SUPPORT_MODULE_SCOPE_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    3. Specific Step / Tab (Optional)
                  </Label>
                  <Input
                    type="text"
                    value={newStepContext}
                    onChange={(e) => setNewStepContext(e.target.value)}
                    placeholder="e.g., Step 3: Pricing Architect or Appendix C"
                    className="text-base sm:text-xs"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    4. Priority Level
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SUPPORT_PRIORITY_OPTIONS.map((p) => {
                      const active = newPriority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setNewPriority(p.value)}
                          className={`rounded-lg border px-2 py-2 text-center text-[11px] font-semibold transition-colors ${
                            active
                              ? p.value === 'CRITICAL'
                                ? 'border-rose-600 bg-rose-600 text-white'
                                : p.value === 'HIGH'
                                  ? 'border-amber-500 bg-amber-500 text-white'
                                  : 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Title & Description */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <Label className="mb-1 block text-xs font-semibold text-slate-700">
                      Short Issue / Idea Title *
                    </Label>
                    <Input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Module G unit economics margin doesn't include packaging cost"
                      className="text-base sm:text-xs"
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block text-xs font-semibold text-slate-700">
                      Expected / Ideal Behavior (Optional)
                    </Label>
                    <Input
                      type="text"
                      value={newExpectedBehavior}
                      onChange={(e) => setNewExpectedBehavior(e.target.value)}
                      placeholder="e.g., Should subtract packaging cost from gross pocket profit"
                      className="text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold text-slate-700">
                    Details / Steps to Reproduce / Improvement Notes *
                  </Label>
                  <textarea
                    required
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Write what happened, what felt clunky during testing, or what you want changed when we come back to this..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-base text-slate-900 focus:border-indigo-500 focus:outline-hidden sm:text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  Tip: Once logged, you can click{' '}
                  <strong>&ldquo;Copy AI Prompt&rdquo;</strong> on any item to
                  paste it straight into Antigravity for an instant fix.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save to Tracker Backlog'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Main Backlog Directory & Kanban Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                Support &amp; Bug Tracker Backlog ({filteredTickets.length})
              </CardTitle>
              <CardDescription>
                Filter by module, type, or status, switch between List and
                Kanban views, or copy ready-to-paste AI fix prompts.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyBatchOpenPrompt}
                disabled={filteredTickets.length === 0}
                className="border-indigo-200 bg-indigo-50/70 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Batch AI Fix Prompt
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={tickets.length === 0}
                className="text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>

              {/* View Mode Toggle: List vs Kanban Board */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    viewMode === 'LIST'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('BOARD')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    viewMode === 'BOARD'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                  Kanban
                </button>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {/* Status Sub-Tabs (visible in List mode) */}
            {viewMode === 'LIST' ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    {
                      id: 'ACTIVE_BACKLOG',
                      label: `Active Backlog (${counts.activeBacklog})`,
                    },
                    { id: 'OPEN', label: `Open (${counts.open})` },
                    {
                      id: 'IN_PROGRESS',
                      label: `In Progress (${counts.inProgress})`,
                    },
                    {
                      id: 'RESOLVED',
                      label: `Resolved (${counts.resolved})`,
                    },
                    {
                      id: 'ARCHIVED',
                      label: `Archived (${counts.archived})`,
                    },
                  ] as Array<{ id: StatusFilterSubTab; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusTab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      statusTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Filter className="h-3.5 w-3.5 text-indigo-600" />
                Kanban Board View: Drag-free 1-click status transitions across
                Open, In Progress, and Resolved
              </div>
            )}

            {/* Module, Type & Text Search Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as SupportTicketType | 'ALL')
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-base text-slate-700 sm:text-xs"
              >
                <option value="ALL">All Types</option>
                {SUPPORT_TICKET_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.shortLabel}
                  </option>
                ))}
              </select>

              <select
                value={moduleFilter}
                onChange={(e) =>
                  setModuleFilter(e.target.value as SupportModuleScope | 'ALL')
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-base text-slate-700 sm:text-xs"
              >
                <option value="ALL">All Modules (A–K &amp; Global)</option>
                {SUPPORT_MODULE_SCOPE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.shortBadge}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search bugs, modules, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-base sm:text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-slate-800">
                No issues or improvements in this view
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Log a bug or feature idea above, or use the local{' '}
                <strong>&ldquo;Log Bug / Idea&rdquo;</strong> button inside{' '}
                <code>/workspace</code> while testing.
              </p>
            </div>
          ) : viewMode === 'LIST' ? (
            <div className="divide-y divide-slate-200">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-slate-50/70 lg:flex-row lg:items-start"
                >
                  {/* Left Details Column */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(ticket.status)}
                      {renderPriorityBadge(ticket.priority)}
                      {renderTypeBadge(ticket)}

                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {getModuleScopeLabel(ticket.moduleScope)}
                        {ticket.stepContext ? ` • ${ticket.stepContext}` : ''}
                      </span>

                      {ticket.planTitle && (
                        <span className="text-[11px] text-slate-400">
                          Plan: <strong>{ticket.planTitle}</strong>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        • Logged {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {ticket.title}
                    </h3>

                    <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
                      {ticket.description}
                    </p>

                    {ticket.expectedBehavior && (
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-xs text-indigo-950">
                        <strong className="font-semibold text-indigo-700">
                          Expected / Ideal:
                        </strong>{' '}
                        {ticket.expectedBehavior}
                      </div>
                    )}

                    {ticket.adminNotes && (
                      <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
                        <strong className="font-semibold text-amber-800">
                          Admin Notes:
                        </strong>{' '}
                        {ticket.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Right Action Controls */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                    {/* Quick Status Transition Pills */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                      {(
                        [
                          { id: 'OPEN', label: 'Open' },
                          { id: 'IN_PROGRESS', label: 'In Progress' },
                          { id: 'RESOLVED', label: 'Resolved' },
                        ] as Array<{
                          id: SupportTicketStatus;
                          label: string;
                        }>
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            onUpdateTicket({ id: ticket.id, status: st.id })
                          }
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            ticket.status === st.id
                              ? st.id === 'RESOLVED'
                                ? 'bg-emerald-600 text-white'
                                : st.id === 'IN_PROGRESS'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-amber-500 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopySinglePrompt(ticket)}
                        className="h-7 border-indigo-200 bg-indigo-50/60 px-2.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        {copiedId === ticket.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy AI Prompt
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(ticket)}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit / Notes
                      </Button>

                      {ticket.status !== 'ARCHIVED' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUpdateTicket({
                              id: ticket.id,
                              status: 'ARCHIVED',
                            })
                          }
                          title="Archive Ticket"
                          className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteTicket(ticket.id)}
                        title="Delete Ticket"
                        className="h-7 border-rose-200 bg-rose-50/50 px-2 text-[11px] text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 gap-4 bg-slate-50/60 p-5 lg:grid-cols-3">
              {(
                [
                  {
                    status: 'OPEN',
                    title: 'Open Backlog',
                    icon: <Bug className="h-4 w-4 text-amber-600" />,
                    headerClass: 'border-amber-200 bg-amber-50/80 text-amber-950',
                  },
                  {
                    status: 'IN_PROGRESS',
                    title: 'In Progress',
                    icon: <Clock className="h-4 w-4 text-indigo-600" />,
                    headerClass:
                      'border-indigo-200 bg-indigo-50/80 text-indigo-950',
                  },
                  {
                    status: 'RESOLVED',
                    title: 'Resolved / Shipped',
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
                    headerClass:
                      'border-emerald-200 bg-emerald-50/80 text-emerald-950',
                  },
                ] as Array<{
                  status: SupportTicketStatus;
                  title: string;
                  icon: React.ReactNode;
                  headerClass: string;
                }>
              ).map((col) => {
                const colTickets = filteredTickets.filter(
                  (t) => t.status === col.status
                );
                return (
                  <div
                    key={col.status}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xs"
                  >
                    <div
                      className={`flex items-center justify-between rounded-t-xl border-b px-4 py-3 ${col.headerClass}`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        {col.icon}
                        <span>{col.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-[11px]">
                        {colTickets.length}
                      </Badge>
                    </div>

                    <div className="flex-1 space-y-3 p-3">
                      {colTickets.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                          No items in {col.title}
                        </div>
                      ) : (
                        colTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition-shadow hover:shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              {renderPriorityBadge(ticket.priority)}
                              {renderTypeBadge(ticket)}
                            </div>

                            <div className="text-[11px] font-semibold text-indigo-700">
                              {getModuleScopeLabel(ticket.moduleScope)}
                              {ticket.stepContext
                                ? ` • ${ticket.stepContext}`
                                : ''}
                            </div>

                            <h4 className="text-xs font-bold text-slate-900">
                              {ticket.title}
                            </h4>

                            <p className="line-clamp-3 whitespace-pre-line text-xs text-slate-600">
                              {ticket.description}
                            </p>

                            {ticket.adminNotes && (
                              <div className="rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
                                <strong>Note:</strong> {ticket.adminNotes}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-2">
                              <div className="flex items-center gap-1">
                                {col.status !== 'OPEN' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateTicket({
                                        id: ticket.id,
                                        status: 'OPEN',
                                      })
                                    }
                                    className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
                                  >
                                    To Open
                                  </button>
                                )}
                                {col.status !== 'IN_PROGRESS' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateTicket({
                                        id: ticket.id,
                                        status: 'IN_PROGRESS',
                                      })
                                    }
                                    className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
                                  >
                                    In Progress
                                  </button>
                                )}
                                {col.status !== 'RESOLVED' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateTicket({
                                        id: ticket.id,
                                        status: 'RESOLVED',
                                      })
                                    }
                                    className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopySinglePrompt(ticket)}
                                  title="Copy AI Fix Prompt"
                                  className="rounded-md border border-indigo-200 bg-indigo-50/70 p-1 text-indigo-700 hover:bg-indigo-100"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(ticket)}
                                  title="Edit / Notes"
                                  className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-100"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / Resolution Notes Modal */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Ticket &amp; Admin Resolution Notes
                </h3>
                <p className="text-xs text-slate-500">
                  Update priority, status, module context, or resolution notes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTicket(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Status
                  </Label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as SupportTicketStatus)
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-base sm:text-xs"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Priority
                  </Label>
                  <select
                    value={editPriority}
                    onChange={(e) =>
                      setEditPriority(e.target.value as SupportTicketPriority)
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-base sm:text-xs"
                  >
                    {SUPPORT_PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Type
                  </Label>
                  <select
                    value={editType}
                    onChange={(e) =>
                      setEditType(e.target.value as SupportTicketType)
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-base sm:text-xs"
                  >
                    {SUPPORT_TICKET_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editType === 'OTHER' && (
                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Custom Category Label
                  </Label>
                  <Input
                    type="text"
                    value={editCustomTypeText}
                    onChange={(e) => setEditCustomTypeText(e.target.value)}
                    className="text-base sm:text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Module / Area
                  </Label>
                  <select
                    value={editModuleScope}
                    onChange={(e) =>
                      setEditModuleScope(e.target.value as SupportModuleScope)
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-base sm:text-xs"
                  >
                    {SUPPORT_MODULE_SCOPE_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Step / Context
                  </Label>
                  <Input
                    type="text"
                    value={editStepContext}
                    onChange={(e) => setEditStepContext(e.target.value)}
                    className="text-base sm:text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Title
                </Label>
                <Input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-base sm:text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Description / Reproduction Details
                </Label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-base sm:text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Expected / Ideal Behavior
                </Label>
                <Input
                  type="text"
                  value={editExpectedBehavior}
                  onChange={(e) => setEditExpectedBehavior(e.target.value)}
                  className="text-base sm:text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold text-amber-800">
                  Admin Scratchpad / Resolution Notes
                </Label>
                <textarea
                  rows={2}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Jot down investigation notes, commit references, or follow-ups..."
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 p-2.5 text-base sm:text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTicket(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveEdit}
                className="bg-indigo-600 text-xs text-white hover:bg-indigo-700"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
