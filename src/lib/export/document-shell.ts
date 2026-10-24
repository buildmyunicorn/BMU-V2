/**
 * Unified Build My Unicorn (BMU) 2.0 Document Export Shell.
 * Standardizes the exact Module A ("Module 1") magazine-quality HTML & Print-to-PDF
 * design system across every module (Modules A through I) on the platform.
 */

export function escapeDocumentHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BmuDocumentShellProps {
  /** Browser tab & PDF title */
  documentTitle: string;
  /** Top indigo eyebrow text (e.g. "BUILD MY UNICORN 2.0 • MODULE A CONCEPT & READINESS BRIEF") */
  eyebrow: string;
  /** Startup Plan Title (H1) */
  planTitle: string;
  /** Prepared for Founder Name */
  founderName: string;
  /** Country Name, e.g. "Ireland" */
  countryName: string;
  /** Currency Code, e.g. "EUR" */
  currency: string;
  /** Industry Category */
  industryCategory: string;
  /** Formatted Date String */
  dateStr: string;
  /** Right badge second line label, e.g. "Scope" or "Target Markets" */
  scopeLabel?: string;
  /** Right badge second line value, e.g. "International Export" or "IE, GB, US" */
  scopeValue: string;
  /** Inner HTML of all `.section` blocks */
  sectionsHtml: string;
  /** Dark slate footer callout HTML */
  footerCtaHtml: string;
}

/**
 * Shared CSS stylesheet from Module 1 (Module A), extended with matching
 * `.grid-3`, `.grid-4`, and `.doc-table` primitives so every module brief
 * looks identical when downloaded as `.html` or printed/saved as PDF.
 */
export const BMU_DOCUMENT_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      line-height: 1.55;
      padding: 32px 16px;
    }
    .page {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 28px;
      gap: 16px;
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
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .meta-line {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
    }
    .badge-box {
      text-align: right;
      font-size: 12px;
      color: #475569;
      background: #f1f5f9;
      padding: 10px 14px;
      border-radius: 10px;
      white-space: nowrap;
    }
    .section {
      margin-bottom: 26px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1e293b;
      background: #f1f5f9;
      padding: 8px 12px;
      border-left: 4px solid #4f46e5;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .quote-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      font-size: 14px;
      color: #1e293b;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      background: #ffffff;
    }
    .card-warning {
      border-color: #fcd34d;
      background: #fffbeb;
    }
    .card-highlight {
      border-color: #c7d2fe;
      background: #eef2ff;
    }
    .card-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4f46e5;
      margin-bottom: 4px;
    }
    .card-value {
      font-size: 13px;
      color: #1e293b;
    }
    .card-stat {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0 4px 0;
    }
    .pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }
    .pill {
      display: inline-block;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #9f1239;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .pill-indigo {
      display: inline-block;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      color: #3730a3;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .pill-emerald {
      display: inline-block;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .doc-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      font-size: 12.5px;
      margin-top: 10px;
    }
    .doc-table th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 9px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .doc-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: top;
    }
    .doc-table tr:last-child td {
      border-bottom: none;
    }
    .doc-table tr.row-highlight td {
      background: #eef2ff;
      font-weight: 700;
      color: #1e1b4b;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 13px;
    }
    .checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid #6366f1;
      border-radius: 4px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .footer-cta {
      margin-top: 28px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 12px;
      padding: 18px 20px;
      font-size: 13px;
    }
    .footer-cta strong {
      color: #a5b4fc;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .page { border: none; box-shadow: none; padding: 16px; max-width: 100%; }
      .no-print { display: none !important; }
    }
`;

/**
 * Renders the standardized BMU 2.0 HTML document using Module 1's exact layout.
 */
export function renderBmuStandaloneHtmlDocument(
  props: BmuDocumentShellProps
): string {
  const scopeLabel = props.scopeLabel || 'Scope';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeDocumentHtml(props.documentTitle)}</title>
  <style>${BMU_DOCUMENT_STYLES}</style>
</head>
<body>
  <div class="page">
    <div class="header-bar">
      <div>
        <div class="eyebrow">${escapeDocumentHtml(props.eyebrow)}</div>
        <h1>${escapeDocumentHtml(props.planTitle)}</h1>
        <div class="meta-line">
          Prepared for <strong>${escapeDocumentHtml(props.founderName)}</strong> • ${escapeDocumentHtml(props.countryName)} (${escapeDocumentHtml(props.currency)}) • ${escapeDocumentHtml(props.industryCategory)}
        </div>
      </div>
      <div class="badge-box">
        <div><strong>Date:</strong> ${escapeDocumentHtml(props.dateStr)}</div>
        <div><strong>${escapeDocumentHtml(scopeLabel)}:</strong> ${escapeDocumentHtml(props.scopeValue)}</div>
      </div>
    </div>

${props.sectionsHtml}

    <div class="footer-cta">
      ${props.footerCtaHtml}
    </div>
  </div>
</body>
</html>`;
}
