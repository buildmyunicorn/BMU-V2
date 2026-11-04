'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Euro,
  ExternalLink,
  ShieldCheck,
  Check,
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
  getQuoteRfpByTokenAction,
  submitQuoteResponseAction,
} from '@/app/actions/quote-concierge';

export default function QuoteSubmitPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getQuoteRfpByTokenAction>> | null>(null);

  // Form State
  const [quoteAmountNet, setQuoteAmountNet] = useState('');
  const [estimatedWeeks, setEstimatedWeeks] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteFileUrl, setQuoteFileUrl] = useState('');
  const [quoteFileName, setQuoteFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
      getQuoteRfpByTokenAction(p.token).then((res) => {
        setIsLoading(false);
        if (!res.ok) {
          setError(res.error || 'Invalid quote link');
        } else {
          setData(res);
          if (res.response?.status === 'QUOTE_SUBMITTED') {
            setIsSuccess(true);
            setQuoteAmountNet(res.response.quoteAmountNet || '');
            setQuoteFileName(res.response.quoteFileName || '');
            setQuoteFileUrl(res.response.quoteFileUrl || '');
          }
        }
      });
    });
  }, [params]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('File size must be under 15MB.');
      return;
    }

    // Convert file to base64 data URL for standalone persistence
    const reader = new FileReader();
    reader.onload = () => {
      setQuoteFileUrl(reader.result as string);
      setQuoteFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!quoteAmountNet || Number(quoteAmountNet) <= 0) {
      alert('Please enter a valid net quotation amount.');
      return;
    }

    if (!quoteFileUrl) {
      alert('Please attach your official quotation PDF letter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitQuoteResponseAction({
        magicToken: token,
        quoteAmountNet: parseFloat(quoteAmountNet),
        estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks, 10) : undefined,
        quoteNotes,
        quoteFileUrl,
        quoteFileName: quoteFileName || 'Official_Supplier_Quotation.pdf',
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        alert(res.error || 'Failed to submit quote.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading project quotation brief...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.rfp || !data.partner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="max-w-md rounded-2xl border border-rose-900/50 bg-rose-950/20 p-6 text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="text-base font-bold text-white">Quotation Link Unavailable</h2>
          <p className="text-xs text-rose-200">{error || 'This quote token is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const { rfp, partner } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{partner.logoEmoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">{partner.name}</h1>
                <Badge className="border-amber-500/40 bg-amber-500/20 text-[10px] text-amber-300">
                  Verified Supplier Candidate
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Official Grant Quotation Submission Portal • Powered by Startup Preflight
              </p>
            </div>
          </div>

          <Badge variant="outline" className="border-slate-800 text-xs text-slate-400">
            {rfp.targetCountryCode === 'IE' ? '🇮🇪 Ireland Grant Track' : '🇬🇧 UK Grant Track'}
          </Badge>
        </div>

        {/* Project RFP Overview Card */}
        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 shadow-md">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Client Project Scope &amp; RFP Brief
                </span>
                <CardTitle className="text-xl font-extrabold text-white mt-1">
                  {rfp.projectTitle}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-1">
                  Prepared by <strong>{rfp.founderName}</strong> ({rfp.founderCompany})
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-indigo-500/40 bg-indigo-500/20 text-xs text-indigo-300">
                  {rfp.rfpCategory}
                </Badge>
                <Badge className="border-emerald-500/40 bg-emerald-500/20 text-xs text-emerald-300">
                  Est. Budget: {rfp.budgetRange}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-xs text-slate-300">
                  Timeline: {rfp.targetDeliveryTimeline}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Scope Summary */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">
                Core Project Requirements
              </Label>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {rfp.scopeSummary}
              </div>
            </div>

            {/* Work Packages Table */}
            {rfp.workPackages && rfp.workPackages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <Label className="text-xs font-semibold text-slate-300">
                    Defined Work Packages ({rfp.workPackages.length})
                  </Label>
                </div>
                <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
                  {rfp.workPackages.map((wp, idx) => (
                    <div key={idx} className="p-3 text-xs flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">{wp.name}</div>
                        <div className="text-slate-400">{wp.description}</div>
                      </div>
                      {wp.targetDays && (
                        <Badge variant="outline" className="border-slate-800 text-[10px] text-slate-400">
                          ~{wp.targetDays} days
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grant Compliance Advice Box */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              Government Grant Quote Compliance Rules (IE LEO &amp; UK Innovate UK)
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your quotation document must be an official company quotation on formal letterhead showing your legal trading entity name, CRO/Company Reg number, VAT number, milestone itemization, and net amount ex-VAT. Once submitted, this PDF is automatically formatted into the founder&apos;s grant appendix.
          </p>
        </div>

        {/* Submission Form or Success View */}
        {isSuccess ? (
          <Card className="border-emerald-500/40 bg-emerald-950/20 text-slate-100 p-8 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Quotation Successfully Submitted! 🎉</h2>
              <p className="text-xs text-emerald-200 max-w-md mx-auto">
                Thank you! Your quotation of <strong>{rfp.currency} {quoteAmountNet}</strong> and quotation document ({quoteFileName}) have been delivered to {rfp.founderName} and attached to their official grant pack.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="border-slate-800 bg-slate-900/90 text-slate-100">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-base font-bold text-white">
                Submit Your Official Quotation
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Enter your total net cost ex-VAT and attach your formal quotation PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSubmitQuote} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Total Net Quoted Price ({rfp.currency} Excl. VAT) *
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        value={quoteAmountNet}
                        onChange={(e) => setQuoteAmountNet(e.target.value)}
                        placeholder="e.g. 12500.00"
                        className="border-slate-700 bg-slate-950 text-sm font-semibold text-white pl-8"
                        required
                      />
                      <span className="absolute left-2.5 top-2.5 text-xs text-slate-500 font-bold">
                        {rfp.currency === 'GBP' ? '£' : '€'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">
                      Estimated Completion Timeline (Weeks)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="104"
                      value={estimatedWeeks}
                      onChange={(e) => setEstimatedWeeks(e.target.value)}
                      placeholder="e.g. 8"
                      className="border-slate-700 bg-slate-950 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    Supplier Scope Notes &amp; Assumptions
                  </Label>
                  <textarea
                    rows={3}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Briefly state key inclusions (e.g. Includes UX prototyping, API integration, 30 days post-launch warranty)..."
                    className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>

                {/* PDF File Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    Upload Official Quotation PDF Letter *
                  </Label>
                  <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 p-6 text-center hover:border-indigo-500 transition-colors">
                    {quoteFileName ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 font-semibold">
                        <FileText className="h-5 w-5 text-emerald-400" />
                        <span>Attached: {quoteFileName}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-slate-500" />
                        <div className="text-xs text-slate-300">
                          <label className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                            Click to upload PDF
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>{' '}
                          or drag and drop
                        </div>
                        <p className="text-[10px] text-slate-500">PDF up to 15MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 px-6 py-2.5"
                  >
                    {isSubmitting ? 'Uploading Quote...' : 'Submit Official Quotation →'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
