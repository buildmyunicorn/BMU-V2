'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  ShieldCheck,
  Search,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  listAdminEmailLogsAction,
  previewAdminEmailAction,
  sendAdminTestEmailAction,
  EmailLogSummary,
} from '@/app/actions/admin-emails';
import { EmailTemplateType } from '@/lib/email/send';

interface SystemEmailsStudioTabProps {
  adminEmail: string;
  onNotify?: (type: 'success' | 'error', text: string) => void;
}

const TEMPLATE_OPTIONS: { id: EmailTemplateType; name: string; desc: string }[] = [
  {
    id: 'WELCOME_FOUNDER',
    name: 'Welcome & Onboarding',
    desc: 'Sent immediately on registration with first 30-min checklist.',
  },
  {
    id: 'PASSWORD_RESET',
    name: 'Password Reset',
    desc: 'Time-sensitive secure reset link with 60-min expiration alert.',
  },
  {
    id: 'VOUCHER_REDEEMED',
    name: 'Code / Pass Activated',
    desc: 'Confirms unlocked tiers, plan counts, seats, and monthly AI credits.',
  },
  {
    id: 'COFOUNDER_INVITE',
    name: 'Co-Founder Invitation',
    desc: 'Workspace invitation with Module F Blind-Reveal explanation.',
  },
];

export const SystemEmailsStudioTab: React.FC<SystemEmailsStudioTabProps> = ({
  adminEmail,
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LOGS' | 'PREVIEW' | 'TESTER'>(
    'LOGS'
  );

  // Email Logs State
  const [logs, setLogs] = useState<EmailLogSummary[]>([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    bouncedOrFailed: 0,
    mockDev: 0,
  });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Previewer State
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplateType>('WELCOME_FOUNDER');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Test Dispatcher State
  const [testRecipient, setTestRecipient] = useState(adminEmail || '');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load logs on mount
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await listAdminEmailLogsAction(searchQuery);
      if (res.ok) {
        setLogs(res.logs);
        setStats(res.stats);
      } else if (onNotify) {
        onNotify('error', res.error || 'Failed to fetch logs');
      }
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Update preview when template changes or tab switched
  useEffect(() => {
    if (activeSubTab === 'PREVIEW') {
      loadPreview(selectedTemplate);
    }
  }, [selectedTemplate, activeSubTab]);

  const loadPreview = async (tpl: EmailTemplateType) => {
    setIsLoadingPreview(true);
    try {
      const res = await previewAdminEmailAction(tpl);
      if (res.ok && res.html) {
        setPreviewHtml(res.html);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSendTest = async () => {
    if (!testRecipient) {
      if (onNotify) onNotify('error', 'Please enter a test recipient email.');
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendAdminTestEmailAction(testRecipient, selectedTemplate);
      if (res.ok) {
        const msg = res.isMockDev
          ? `✓ Mock test email logged! (RESEND_API_KEY unset — check dev log or Logs tab)`
          : `✓ Live test email dispatched via Resend! (Message ID: ${res.resendId})`;
        setTestResult(msg);
        if (onNotify) onNotify('success', msg);
        fetchLogs();
      } else {
        const err = res.error || 'Failed to dispatch email';
        setTestResult(`Error: ${err}`);
        if (onNotify) onNotify('error', err);
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            System Emails & Deliverability Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Powered by Resend.com & React Email · Verified Domain:{' '}
            <span className="font-mono font-semibold text-slate-700">
              startuppreflight.com
            </span>
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <Button
            size="sm"
            variant={activeSubTab === 'LOGS' ? 'default' : 'ghost'}
            className="h-8 text-xs font-semibold"
            onClick={() => {
              setActiveSubTab('LOGS');
              fetchLogs();
            }}
          >
            Audit Logs ({stats.totalSent})
          </Button>
          <Button
            size="sm"
            variant={activeSubTab === 'PREVIEW' ? 'default' : 'ghost'}
            className="h-8 text-xs font-semibold"
            onClick={() => setActiveSubTab('PREVIEW')}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Template Previewer
          </Button>
          <Button
            size="sm"
            variant={activeSubTab === 'TESTER' ? 'default' : 'ghost'}
            className="h-8 text-xs font-semibold"
            onClick={() => setActiveSubTab('TESTER')}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send Test
          </Button>
        </div>
      </div>

      {/* SUB-TAB 1: LOGS & AUDIT TRAIL */}
      {activeSubTab === 'LOGS' && (
        <div className="space-y-5">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Dispatches
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats.totalSent}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Delivered
              </span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {stats.delivered}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Dev Mock Mode
              </span>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                {stats.mockDev}
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Bounced / Failed
              </span>
              <p className="text-2xl font-extrabold text-rose-700 mt-1">
                {stats.bouncedOrFailed}
              </p>
            </div>
          </div>

          {/* Search & Refresh Bar + Quick Test Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search recipient, subject, template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="h-9 text-xs"
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${
                    isLoadingLogs ? 'animate-spin' : ''
                  }`}
                />
                Refresh Logs
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveSubTab('TESTER')}
                className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                ⚡ Send Quick Test Email
              </Button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Template</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Resend ID</th>
                    <th className="py-3 px-4">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400 italic"
                      >
                        {isLoadingLogs
                          ? 'Loading transactional email audit trail...'
                          : 'No transactional email logs found.'}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-900 font-semibold">
                          {log.recipient}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                            {log.template}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 truncate max-w-xs">
                          {log.subject}
                        </td>
                        <td className="py-3 px-4">
                          {log.status === 'SENT' || log.status === 'DELIVERED' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                              {log.status}
                            </Badge>
                          ) : log.status === 'MOCK_DEV' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                              MOCK DEV
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
                              {log.status}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {log.resendId || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TEMPLATE PREVIEWER */}
      {activeSubTab === 'PREVIEW' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Template:</span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_OPTIONS.map((tpl) => (
                  <Button
                    key={tpl.id}
                    size="sm"
                    variant={selectedTemplate === tpl.id ? 'default' : 'outline'}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className="h-8 text-xs"
                  >
                    {tpl.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Viewport switch */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <Button
                size="sm"
                variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                onClick={() => setPreviewDevice('desktop')}
                className="h-7 px-2 text-xs"
              >
                <Monitor className="h-3.5 w-3.5 mr-1" />
                Desktop
              </Button>
              <Button
                size="sm"
                variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                onClick={() => setPreviewDevice('mobile')}
                className="h-7 px-2 text-xs"
              >
                <Smartphone className="h-3.5 w-3.5 mr-1" />
                Mobile
              </Button>
            </div>
          </div>

          {/* Iframe Preview Container */}
          <div className="flex justify-center bg-slate-100 rounded-xl border border-slate-200 p-6 min-h-[550px]">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Rendering React Email...</span>
              </div>
            ) : (
              <div
                className={`transition-all duration-200 bg-white shadow-md rounded-xl overflow-hidden border border-slate-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[375px] h-[640px]'
                    : 'w-full max-w-[620px] h-[640px]'
                }`}
              >
                <iframe
                  title="Email Preview"
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TEST DISPATCHER */}
      {activeSubTab === 'TESTER' && (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-2xs max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-600" />
              Send Live Test Transactional Email
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Dispatches a fully rendered React Email template to verify
              deliverability and layout in your real email inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Choose Template
              </Label>
              <div className="grid grid-cols-1 gap-2 mt-1.5">
                {TEMPLATE_OPTIONS.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900">
                      {tpl.name}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      {tpl.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Recipient Email
              </Label>
              <Input
                type="email"
                placeholder="your.email@domain.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Emails are sent from{' '}
                <span className="font-mono text-slate-600">
                  Startup Preflight &lt;noreply@startuppreflight.com&gt;
                </span>
                .
              </p>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  testResult.startsWith('✓')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {testResult}
              </div>
            )}

            <Button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Dispatching Email...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-3.5 w-3.5" />
                  Dispatch Test via Resend
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
