/**
 * Formal Executive Letter of Intent (LOI) & Pilot Agreement Document Generator.
 * Formats a clean, executive, printable HTML document tailored for
 * prospective customer sign-off and Irish LEO / UK Innovate UK grant evaluators.
 */

import { escapeDocumentHtml as escapeHtml } from '@/lib/export/document-shell';

export interface LetterOfIntentDocumentData {
  startupName: string;
  targetCompanyName: string;
  targetContactName: string;
  pilotDurationWeeks: number;
  pilotPricePoint: string;
  primarySuccessKpi: string;
  customTermsText?: string;
  hqCountryCode?: string;
  baseCurrency?: string;
  dateStr?: string;
}

export function generateLetterOfIntentMarkdown(params: {
  startupName: string;
  targetCompanyName: string;
  targetContactName: string;
  pilotDurationWeeks: number;
  pilotPricePoint: string;
  primarySuccessKpi: string;
  customTermsText?: string;
  hqCountryCode?: string;
  baseCurrency?: string;
}): string {
  const startup = params.startupName?.trim() || 'Our Startup';
  const company = params.targetCompanyName?.trim() || '[Prospective Customer Company]';
  const contact = params.targetContactName?.trim() || '[Decision Maker Name / Title]';
  const duration = params.pilotDurationWeeks || 4;
  const price = params.pilotPricePoint?.trim() || 'Agreed Preferential Early Adopter Rate';
  const kpi =
    params.primarySuccessKpi?.trim() ||
    'Measurable reduction in operational turnaround time and overhead cost';
  const jurisdictionText =
    params.hqCountryCode === 'GB'
      ? 'recognized under UK commercial standards (aligned with Innovate UK / British Business Bank customer validation benchmarks)'
      : 'recognized under Irish commercial standards (aligned with Enterprise Ireland & LEO Feasibility/Priming validation benchmarks)';
  const extra = params.customTermsText?.trim()
    ? `\n\n### 5. Specific Pilot Governance & Addenda\n${params.customTermsText.trim()}`
    : '';

  return `# NON-BINDING EARLY ADOPTER LETTER OF INTENT (LOI)

**Date:** ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  
**Between:** **${startup}** ("Provider")  
**And:** **${company}** ("Prospective Early Adopter Partner")  
**Attention:** ${contact}

---

### 1. Statement of Commercial Intent
This Letter of Intent ("LOI") confirms that **${company}** intends to participate in a structured commercial pilot program evaluating the proprietary solution provided by **${startup}**, aimed directly at resolving acute workflow friction, operational overhead, and efficiency constraints.

### 2. Pilot Scope & Evaluation Period
- **Pilot Duration:** ${duration} Weeks from production deployment / onboarding.
- **Scope:** Evaluated across agreed representative end-users or active workflow instances within ${company}.
- **Primary Success KPI Benchmark:** ${kpi}.

### 3. Early Adopter Commercial Pricing Terms
- **Preferential Pilot / First-Year Fee:** **${price}** (guaranteed locked-in rate for Early Adopter Cohort).
- **No-Obligation Clause:** This LOI represents a statement of genuine commercial interest and mutual commitment to test, evaluate, and provide qualitative feedback. It is not an irrevocable commitment to purchase until the defined pilot success metrics are verified and formal service contracts are executed.

### 4. Mutual Commercial Benefit & Assessment
Both parties agree to conduct bi-weekly checkpoint reviews during the pilot. Upon successful demonstration that the primary KPI benchmark (${kpi}) has been achieved, **${company}** will explore transitioning into a recurring enterprise commercial agreement under the terms established above.

This document is ${jurisdictionText}.${extra}

---

**For Prospective Partner (${company}):**  
Signature: ___________________________  
Name / Title: ${contact}  
Date: _______________________________  

**For Provider (${startup}):**  
Signature: ___________________________  
Founder / Executive: _________________  
Date: _______________________________  
`;
}

export function buildLetterOfIntentStandaloneHtmlDocument(
  data: LetterOfIntentDocumentData
): string {
  const startup = data.startupName?.trim() || 'Our Startup';
  const company = data.targetCompanyName?.trim() || 'Prospective Customer Partner';
  const contact = data.targetContactName?.trim() || 'Head of Operations / Managing Director';
  const duration = data.pilotDurationWeeks || 8;
  const price = data.pilotPricePoint?.trim() || 'Agreed Preferential Early Adopter Rate';
  const kpi =
    data.primarySuccessKpi?.trim() ||
    'Measurable reduction in operational turnaround time and overhead cost';
  const dateStr =
    data.dateStr ||
    new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const isUK = data.hqCountryCode === 'GB';
  const governingJurisdiction = isUK
    ? 'commercial standards of England &amp; Wales (aligned with Innovate UK &amp; British Business Bank commercial validation benchmarks)'
    : 'commercial standards of the Republic of Ireland (aligned with Enterprise Ireland &amp; Local Enterprise Office validation benchmarks)';

  const customAddendaHtml = data.customTermsText?.trim()
    ? `
    <div class="doc-section">
      <div class="section-title">5. Specific Pilot Governance &amp; Founder Addenda</div>
      <p>${escapeHtml(data.customTermsText.trim()).replace(/\n/g, '<br />')}</p>
    </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Letter of Intent - ${escapeHtml(company)} - ${escapeHtml(startup)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      line-height: 1.6;
      padding: 32px 16px;
    }
    .print-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 12px 20px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
    }
    .print-btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover {
      background: #4338ca;
    }
    .page {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4f46e5;
      margin-bottom: 6px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-top: 16px;
      font-size: 13px;
    }
    .meta-item strong {
      color: #334155;
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }
    .meta-item span {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .doc-section {
      margin-top: 24px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    p {
      font-size: 13.5px;
      color: #334155;
      margin-bottom: 10px;
    }
    ul {
      margin: 8px 0 12px 20px;
      font-size: 13.5px;
      color: #334155;
    }
    li {
      margin-bottom: 6px;
    }
    .highlight-card {
      background: #eef2ff;
      border-left: 4px solid #4f46e5;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 12px 0;
      font-size: 13.5px;
      color: #1e1b4b;
      font-weight: 500;
    }
    .highlight-card strong {
      color: #3730a3;
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      margin-bottom: 2px;
      letter-spacing: 0.04em;
    }
    .commercial-card {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 12px 0;
      font-size: 13.5px;
      color: #064e3b;
      font-weight: 500;
    }
    .commercial-card strong {
      color: #047857;
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      margin-bottom: 2px;
      letter-spacing: 0.04em;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 36px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    .sig-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px;
    }
    .sig-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .sig-line {
      margin-top: 14px;
      font-size: 12px;
      color: #64748b;
    }
    .sig-underline {
      display: inline-block;
      width: 100%;
      border-bottom: 1px solid #94a3b8;
      height: 24px;
      margin-bottom: 4px;
    }
    .footer-note {
      margin-top: 32px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-bar {
        display: none !important;
      }
      .page {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      @page {
        margin: 18mm 16mm;
        size: A4 portrait;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div style="font-size: 13px; color: #475569;">
      <strong>Letter of Intent Preview:</strong> Click "Save / Print PDF" below and select <em>"Save as PDF"</em> in your destination.
    </div>
    <button class="print-btn" onclick="window.print()">
      🖨️ Save / Print PDF
    </button>
  </div>

  <div class="page">
    <div class="header">
      <div class="eyebrow">Startup Preflight • Commercial Validation Framework</div>
      <h1>Non-Binding Early Adopter Letter of Intent (LOI)</h1>
      <div class="meta-grid">
        <div class="meta-item">
          <strong>Solution Provider</strong>
          <span>${escapeHtml(startup)}</span>
        </div>
        <div class="meta-item">
          <strong>Prospective Customer</strong>
          <span>${escapeHtml(company)}</span>
        </div>
        <div class="meta-item">
          <strong>Key Executive Contact</strong>
          <span>${escapeHtml(contact)}</span>
        </div>
        <div class="meta-item">
          <strong>Effective Date</strong>
          <span>${escapeHtml(dateStr)}</span>
        </div>
      </div>
    </div>

    <div class="doc-section">
      <div class="section-title">1. Purpose &amp; Mutual Strategic Intent</div>
      <p>
        This non-binding Letter of Intent confirms that <strong>${escapeHtml(company)}</strong> intends to participate as an early design and pilot partner in the structured evaluation program of <strong>${escapeHtml(startup)}</strong>.
      </p>
      <p>
        The primary purpose of this evaluation is to test and validate whether the solution effectively delivers the following measurable operational outcome within the prospective customer's operating environment:
      </p>
      <div class="highlight-card">
        <strong>Agreed Milestone Success KPI</strong>
        &ldquo;${escapeHtml(kpi)}&rdquo;
      </div>
    </div>

    <div class="doc-section">
      <div class="section-title">2. Pilot Scope &amp; Operating Governance</div>
      <ul>
        <li><strong>Evaluation Duration:</strong> A dedicated period of <strong>${duration} weeks</strong> commencing upon mutual access provisioning and onboarding.</li>
        <li><strong>Founder Guidance &amp; Concierge Support:</strong> The Solution Provider will provide direct async and weekly review support to ensure rapid time-to-value, priority configuration, and smooth team workflow integration.</li>
        <li><strong>Active Feedback &amp; Evaluation:</strong> The Prospective Customer agrees to provide regular operational feedback during the pilot window and objectively evaluate system performance against the agreed success metric.</li>
      </ul>
    </div>

    <div class="doc-section">
      <div class="section-title">3. Commercial Terms Upon Milestone Success</div>
      <p>
        Should the solution successfully satisfy the primary success criteria outlined in Section 1 during the ${duration}-week evaluation window, <strong>${escapeHtml(company)}</strong> intends in good faith to transition into a standard commercial agreement at the following preferential founding rate:
      </p>
      <div class="commercial-card">
        <strong>Agreed Founding Customer Price Point</strong>
        ${escapeHtml(price)}
      </div>
      <p>
        This preferential pricing reflects the customer's strategic value as a reference partner and early product co-designer.
      </p>
    </div>

    <div class="doc-section">
      <div class="section-title">4. Non-Binding Nature &amp; Confidentiality</div>
      <p>
        This document represents an expression of mutual good faith and serious commercial interest, recognized under the ${governingJurisdiction}.
      </p>
      <p>
        It does not create legal or financial liability for either party prior to the formal execution of a definitive commercial contract. Both parties agree to treat all proprietary operational data and technical workflows exchanged during the evaluation as strictly confidential.
      </p>
    </div>

    ${customAddendaHtml}

    <div class="signature-grid">
      <div class="sig-box">
        <div class="sig-title">For ${escapeHtml(company)}</div>
        <div class="sig-line">
          Name / Title: <strong>${escapeHtml(contact)}</strong>
        </div>
        <div class="sig-line">
          Signature: <span class="sig-underline"></span>
        </div>
        <div class="sig-line">
          Date: <span class="sig-underline"></span>
        </div>
      </div>

      <div class="sig-box">
        <div class="sig-title">For ${escapeHtml(startup)}</div>
        <div class="sig-line">
          Founder / Executive: ___________________________
        </div>
        <div class="sig-line">
          Signature: <span class="sig-underline"></span>
        </div>
        <div class="sig-line">
          Date: <span class="sig-underline"></span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      Document compiled via Startup Preflight • Non-Binding Commercial Letter of Intent • Page 1 of 1
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto-trigger print dialog after brief rendering delay
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;
}
