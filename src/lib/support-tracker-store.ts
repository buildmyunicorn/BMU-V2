export type SupportTicketSource = 'ADMIN_TRACKER' | 'FOUNDER_SUPPORT';

export type SupportTicketType =
  | 'BUG'
  | 'IMPROVEMENT'
  | 'AI_PROMPT_TUNING'
  | 'USER_SUPPORT'
  | 'OTHER';

export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SupportTicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ARCHIVED';

export type SupportModuleScope =
  | 'GLOBAL'
  | 'LANDING'
  | 'ADMIN'
  | 'MOD_A_IDEATION'
  | 'MOD_B_MARKET'
  | 'MOD_C_SURVEYS_FEEDBACK'
  | 'MOD_D_PRODUCT_BUILD'
  | 'MOD_E_OPERATIONS'
  | 'MOD_F_COFOUNDER_TEAM'
  | 'MOD_G_LAUNCHPAD'
  | 'MOD_H_REVENUE'
  | 'MOD_I_MARKETING'
  | 'MOD_J_FINANCE'
  | 'MOD_K_GRANTS_FUNDING'
  | 'MOD_L_BUSINESS_PLAN'
  | 'OTHER';

export interface SupportTicketRecord {
  id: string;
  source: SupportTicketSource;
  ticketType: SupportTicketType;
  customTypeText: string | null;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  moduleScope: SupportModuleScope;
  stepContext: string | null;
  pageUrl: string | null;
  planId: string | null;
  planTitle: string | null;
  reporterEmail: string | null;
  title: string;
  description: string;
  expectedBehavior: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SUPPORT_TICKET_TYPE_OPTIONS: Array<{
  value: SupportTicketType;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: 'BUG',
    label: '🐞 Bug / Broken Behavior',
    shortLabel: 'Bug',
    description: 'UI glitch, calculation error, broken button, or validation issue',
  },
  {
    value: 'IMPROVEMENT',
    label: '✨ UX / Feature Improvement',
    shortLabel: 'Improvement',
    description: 'Copy tweak, layout polish, workflow idea, or new capability',
  },
  {
    value: 'AI_PROMPT_TUNING',
    label: '🤖 AI Output / Prompt Tuning',
    shortLabel: 'AI Tuning',
    description: 'Blind-spot review, Concept Canvas, or Ask Preflight AI output adjustment',
  },
  {
    value: 'USER_SUPPORT',
    label: '💬 Founder Support Question',
    shortLabel: 'Founder Support',
    description: 'User support ticket or mentor escalation (Phase 2)',
  },
  {
    value: 'OTHER',
    label: '➕ Other (Custom Category)',
    shortLabel: 'Other',
    description: 'Specify a custom issue or note type',
  },
];

export const SUPPORT_PRIORITY_OPTIONS: Array<{
  value: SupportTicketPriority;
  label: string;
}> = [
  { value: 'LOW', label: 'Low (Nice to have)' },
  { value: 'MEDIUM', label: 'Medium (Standard)' },
  { value: 'HIGH', label: 'High (Important)' },
  { value: 'CRITICAL', label: 'Critical Blocker' },
];

export const SUPPORT_STATUS_OPTIONS: Array<{
  value: SupportTicketStatus;
  label: string;
}> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const SUPPORT_MODULE_SCOPE_OPTIONS: Array<{
  value: SupportModuleScope;
  label: string;
  shortBadge: string;
}> = [
  { value: 'GLOBAL', label: 'Global / Platform-Wide', shortBadge: 'Global' },
  { value: 'LANDING', label: 'Public Landing & Auth (/ , /login)', shortBadge: 'Landing' },
  { value: 'ADMIN', label: 'Super Admin Panel (/admin)', shortBadge: 'Admin' },
  { value: 'MOD_A_IDEATION', label: 'Module A: Ideation & Fit', shortBadge: 'Mod A (Ideation)' },
  { value: 'MOD_B_MARKET', label: 'Module B: Market & Competitors', shortBadge: 'Mod B (Market)' },
  { value: 'MOD_C_SURVEYS_FEEDBACK', label: 'Module C: Surveys & Validation', shortBadge: 'Mod C (Surveys)' },
  { value: 'MOD_D_PRODUCT_BUILD', label: 'Module D: Product & Build', shortBadge: 'Mod D (Product)' },
  { value: 'MOD_E_OPERATIONS', label: 'Module E: Operations & Risk', shortBadge: 'Mod E (Ops)' },
  { value: 'MOD_F_COFOUNDER_TEAM', label: 'Module F: Team & Alignment', shortBadge: 'Mod F (Team)' },
  { value: 'MOD_G_LAUNCHPAD', label: 'Module G: Getting Set Up (Launchpad & Operations)', shortBadge: 'Mod G (Launchpad)' },
  { value: 'MOD_H_REVENUE', label: 'Module H: Pricing & Unit Economics', shortBadge: 'Mod H (Revenue)' },
  { value: 'MOD_I_MARKETING', label: 'Module I: Marketing & First 10', shortBadge: 'Mod I (Marketing)' },
  { value: 'MOD_J_FINANCE', label: 'Module J: 3-Year Finance & Cashflow', shortBadge: 'Mod J (Finance)' },
  { value: 'MOD_K_GRANTS_FUNDING', label: 'Module K: Grants & Tax Relief Hub', shortBadge: 'Mod K (Grants)' },
  { value: 'MOD_L_BUSINESS_PLAN', label: 'Module L: Business Plan & Compiler', shortBadge: 'Mod L (Compiler)' },
  { value: 'OTHER', label: 'Other Area', shortBadge: 'Other' },
];

const LOCAL_STORAGE_SUPPORT_TICKETS_KEY = 'spf_v2_support_tickets_v1';
const LEGACY_LOCAL_STORAGE_SUPPORT_TICKETS_KEY = 'bmu_v2_support_tickets_v1';

/**
 * Checks whether the current browser environment is running locally.
 * Used to strictly hide the in-workspace "Log Bug / Idea" quick-capture button on public production deployments.
 */
export function isLocalTestingEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV !== 'production';
  }
  const host = window.location.hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local')
  );
}

export function loadLocalSupportTickets(): SupportTicketRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw =
      window.localStorage.getItem(LOCAL_STORAGE_SUPPORT_TICKETS_KEY) ||
      window.localStorage.getItem(LEGACY_LOCAL_STORAGE_SUPPORT_TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalSupportTickets(tickets: SupportTicketRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      LOCAL_STORAGE_SUPPORT_TICKETS_KEY,
      JSON.stringify(tickets)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function upsertLocalSupportTicket(
  ticket: SupportTicketRecord
): SupportTicketRecord[] {
  const existing = loadLocalSupportTickets();
  const idx = existing.findIndex((t) => t.id === ticket.id);
  const updated =
    idx >= 0
      ? existing.map((t, i) => (i === idx ? ticket : t))
      : [ticket, ...existing];
  saveLocalSupportTickets(updated);
  return updated;
}

export function removeLocalSupportTicket(id: string): SupportTicketRecord[] {
  const existing = loadLocalSupportTickets();
  const updated = existing.filter((t) => t.id !== id);
  saveLocalSupportTickets(updated);
  return updated;
}

/**
 * Merges server-side tickets with any locally cached tickets (by id) sorted newest-first.
 */
export function mergeSupportTickets(
  serverTickets: SupportTicketRecord[],
  localTickets: SupportTicketRecord[]
): SupportTicketRecord[] {
  const byId = new Map<string, SupportTicketRecord>();
  for (const item of localTickets) {
    byId.set(item.id, item);
  }
  for (const item of serverTickets) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getModuleScopeLabel(scope: SupportModuleScope | string): string {
  const found = SUPPORT_MODULE_SCOPE_OPTIONS.find((o) => o.value === scope);
  return found ? found.shortBadge : scope;
}

export function getTicketTypeBadgeLabel(ticket: SupportTicketRecord): string {
  if (ticket.ticketType === 'OTHER' && ticket.customTypeText) {
    return `Other: ${ticket.customTypeText}`;
  }
  const found = SUPPORT_TICKET_TYPE_OPTIONS.find(
    (o) => o.value === ticket.ticketType
  );
  return found ? found.shortLabel : ticket.ticketType;
}

/**
 * Formats a single ticket into a structured prompt ready to paste into Antigravity.
 */
export function formatSupportTicketAsAiPrompt(
  ticket: SupportTicketRecord
): string {
  const typeLabel = getTicketTypeBadgeLabel(ticket);
  const moduleLabel =
    SUPPORT_MODULE_SCOPE_OPTIONS.find((m) => m.value === ticket.moduleScope)
      ?.label || ticket.moduleScope;

  const lines = [
    `Please resolve the following ${typeLabel.toUpperCase()} logged in Startup Preflight:`,
    ``,
    `- **Title:** ${ticket.title}`,
    `- **Type:** ${typeLabel} | **Priority:** ${ticket.priority}`,
    `- **Module / Area:** ${moduleLabel}${
      ticket.stepContext ? ` (${ticket.stepContext})` : ''
    }`,
  ];

  if (ticket.pageUrl) {
    lines.push(`- **Route / URL:** ${ticket.pageUrl}`);
  }
  if (ticket.planTitle) {
    lines.push(
      `- **Test Plan Context:** ${ticket.planTitle}${
        ticket.planId ? ` (${ticket.planId})` : ''
      }`
    );
  }

  lines.push(``, `### Issue / Improvement Details`, ticket.description);

  if (ticket.expectedBehavior) {
    lines.push(``, `### Expected / Desired Behavior`, ticket.expectedBehavior);
  }
  if (ticket.adminNotes) {
    lines.push(``, `### Additional Admin Notes`, ticket.adminNotes);
  }

  return lines.join('\n');
}

/**
 * Formats multiple tickets into a numbered batch prompt ready to paste into Antigravity.
 */
export function formatBatchSupportTicketsAsAiPrompt(
  tickets: SupportTicketRecord[]
): string {
  if (tickets.length === 0) return '';
  if (tickets.length === 1) return formatSupportTicketAsAiPrompt(tickets[0]);

  const header = `Please resolve the following ${tickets.length} logged bugs/improvements in Startup Preflight:\n`;
  const blocks = tickets.map((t, index) => {
    const typeLabel = getTicketTypeBadgeLabel(t);
    const moduleLabel = getModuleScopeLabel(t.moduleScope);
    return [
      `### ${index + 1}. [${typeLabel} • ${t.priority}] ${t.title}`,
      `- **Location:** ${moduleLabel}${
        t.stepContext ? ` — ${t.stepContext}` : ''
      }${t.pageUrl ? ` (${t.pageUrl})` : ''}`,
      `- **Details:** ${t.description}`,
      t.expectedBehavior ? `- **Expected:** ${t.expectedBehavior}` : null,
      t.adminNotes ? `- **Admin Notes:** ${t.adminNotes}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return `${header}\n${blocks.join('\n\n---\n\n')}`;
}
