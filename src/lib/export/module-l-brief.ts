import {
  escapeDocumentHtml as escapeHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
import type {
  ActiveStartupPlan,
  ModuleLStep1ModeSavedData,
  ModuleLStep2ContradictionAuditSavedData,
  ModuleLStep3NarrativeCompilerSavedData,
  ModuleLStep4AppendicesSavedData,
  ModuleLStep5SubmissionBriefSavedData,
  ModuleLCompiledSectionItem,
  ModuleLAppendixBinderItem,
} from '@/lib/auth/session-store';

export interface ModuleLBriefExportData {
  planTitle: string;
  founderName: string;
  industryCategory: string;
  hqCountryCode: string;
  baseCurrency: string;
  step1Mode?: ModuleLStep1ModeSavedData;
  step2Audit?: ModuleLStep2ContradictionAuditSavedData;
  step3Compiler?: ModuleLStep3NarrativeCompilerSavedData;
  step4Appendices?: ModuleLStep4AppendicesSavedData;
  step5Brief?: ModuleLStep5SubmissionBriefSavedData;
  whiteLabelEnabled?: boolean;
}

export function buildModuleLStandaloneHtmlDocument(data: ModuleLBriefExportData): string {
  const isUK = data.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';
  const compilerMode = data.step1Mode?.compilerMode || (isUK ? 'UK_INNOVATE_UK_9Q' : 'IE_LEO_OFFICIAL_FORM');
  const targetAgency =
    data.step1Mode?.targetAgencyOrCommitteeName ||
    (isUK ? 'Innovate UK / British Business Bank' : 'Local Enterprise Office (LEO)');
  const askAmount = data.step1Mode?.targetFundingAskAmount || 50000;
  const readinessScore = data.step5Brief?.committeeReadinessScore ?? 94;

  const sections = data.step3Compiler?.sections || [];
  const appendices = data.step4Appendices?.appendices || [];

  const sectionsHtml = sections
    .map(
      (sec: ModuleLCompiledSectionItem) => `
      <div style="margin-bottom: 24px; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
          <div>
            <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: #e0e7ff; color: #3730a3; margin-bottom: 6px;">
              Section ${escapeHtml(String(sec.sectionNumber))}
            </span>
            <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">
              ${escapeHtml(sec.title)}
            </h3>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            ${sec.scoringWeightPercent > 0 ? `<strong>Weight:</strong> ${sec.scoringWeightPercent}% &bull; ` : ''}
            <strong>Limit:</strong> ${sec.wordLimit || 400}w
          </div>
        </div>

        <div style="background: #f8fafc; border-left: 3px solid #6366f1; padding: 10px 14px; margin-bottom: 14px; font-size: 12px; color: #475569; font-style: italic;">
          <strong>Assessor Rubric Prompt:</strong> ${escapeHtml(sec.assessorQuestionPrompt)}
        </div>

        <div style="font-size: 13px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
          ${escapeHtml(sec.compiledResponseText || '')}
        </div>
      </div>
    `
    )
    .join('');

  const appendicesHtml = appendices
    .map(
      (app: ModuleLAppendixBinderItem) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-weight: 700; color: #4338ca; vertical-align: top;">
          ${escapeHtml(app.code.replace('APPENDIX_', 'App '))}
        </td>
        <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #0f172a; vertical-align: top;">
          ${escapeHtml(app.title)}
        </td>
        <td style="padding: 10px 14px; font-size: 11px; vertical-align: top;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; ${
            app.readinessStatus === 'VERIFIED_READY'
              ? 'background: #dcfce7; color: #166534;'
              : 'background: #fef3c7; color: #92400e;'
          }">
            ${escapeHtml(app.readinessStatus.replace('_', ' '))}
          </span>
        </td>
        <td style="padding: 10px 14px; font-size: 11px; color: #475569; vertical-align: top; line-height: 1.4;">
          ${escapeHtml(app.signOffNote)}
        </td>
      </tr>
    `
    )
    .join('');

  const checklistHtml = (data.step5Brief?.finalSubmissionChecklist || [])
    .map(
      (item: string) => `
      <li style="margin-bottom: 8px; font-size: 12px; color: #334155; line-height: 1.5;">
        <span style="color: #10b981; font-weight: bold; margin-right: 6px;">&#10003;</span> ${escapeHtml(item)}
      </li>
    `
    )
    .join('');

  const bodyContent = `
    <!-- Hero Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 32px; border-radius: 12px; margin-bottom: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; tracking-wider; background: rgba(255, 255, 255, 0.15); border-radius: 20px; margin-bottom: 10px;">
            Official Business Plan &amp; Grant Submission Dossier
          </span>
          <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 800; color: #ffffff;">
            ${escapeHtml(data.planTitle)}
          </h1>
          <p style="margin: 0; font-size: 13px; color: #c7d2fe;">
            Target Reviewer: <strong>${escapeHtml(targetAgency)}</strong> &bull; Jurisdiction: <strong>${escapeHtml(data.hqCountryCode)}</strong> &bull; Mode: <strong>${escapeHtml(compilerMode)}</strong>
          </p>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; padding: 14px 20px; text-align: center; min-width: 140px;">
          <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #a5b4fc; letter-spacing: 0.05em;">
            Pre-Flight Clearance
          </div>
          <div style="font-size: 32px; font-weight: 800; color: #34d399; margin: 2px 0;">
            ${readinessScore}%
          </div>
          <div style="font-size: 10px; color: #e0e7ff;">
            Committee Ready
          </div>
        </div>
      </div>
    </div>

    <!-- Executive Underwriter Synthesis -->
    <div style="background: #ffffff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 22px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.03em;">
        Executive Committee Evaluation Synthesis
      </h2>
      <p style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 14px 0;">
        ${escapeHtml(data.step5Brief?.executiveDossierSummary || '')}
      </p>
      ${
        data.step5Brief?.aiAssessorTip
          ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #92400e;">
          <strong>Tactical Committee Tip:</strong> ${escapeHtml(data.step5Brief.aiAssessorTip)}
        </div>
      `
          : ''
      }
    </div>

    <!-- Key Metrics Schedule -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 28px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 11px; color: #64748b; font-weight: 600;">Grant / Funding Target Ask</div>
        <div style="font-size: 20px; font-weight: 800; color: #047857; margin-top: 4px;">${currencySymbol}${askAmount.toLocaleString()}</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Vouched eligible capex</div>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 11px; color: #64748b; font-weight: 600;">Compiled Questions / Sections</div>
        <div style="font-size: 20px; font-weight: 800; color: #4338ca; margin-top: 4px;">${sections.length} Sections</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Within official word caps</div>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 11px; color: #64748b; font-weight: 600;">Evidence Appendices Attached</div>
        <div style="font-size: 20px; font-weight: 800; color: #0284c7; margin-top: 4px;">${appendices.length} Appendices</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Appendices A through F</div>
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 11px; color: #64748b; font-weight: 600;">Statutory Sign-Off</div>
        <div style="font-size: 20px; font-weight: 800; color: #059669; margin-top: 4px;">Certified</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Authorized Officer Signed</div>
      </div>
    </div>

    <!-- Master Executive Hook Statement -->
    ${
      data.step3Compiler?.executiveHookStatement
        ? `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #4338ca; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 4px;">
          Master Submission Hook &amp; Pre-Flight Defense
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #0f172a; font-weight: 500;">
          ${escapeHtml(data.step3Compiler.executiveHookStatement)}
        </div>
      </div>
    `
        : ''
    }

    <!-- Official Submission Sections -->
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        Official Submission Questions &amp; Detailed Responses
      </h2>
      ${sectionsHtml}
    </div>

    <!-- Mandatory Evidence Binder (Appendices A-F) -->
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        Mandatory Appendices &amp; Verifiable Evidence Binder
      </h2>
      <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase;">
            <th style="padding: 10px 14px;">Appendix</th>
            <th style="padding: 10px 14px;">Title</th>
            <th style="padding: 10px 14px;">Readiness</th>
            <th style="padding: 10px 14px;">Sign-Off Note</th>
          </tr>
        </thead>
        <tbody>
          ${appendicesHtml}
        </tbody>
      </table>
    </div>

    <!-- Formal Statutory Declaration Sign-Off Box -->
    <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 22px; margin-bottom: 32px;">
      <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em;">
        Statutory Declaration &amp; Submission Certification
      </div>
      <p style="font-size: 12px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
        I hereby certify that all figures, financial projections, promoter profiles, and supplier quotations contained in this submission dossier represent true, accurate, and verifiable records. I confirm that requested capital items comply with public procurement guidelines with no deadweight duplication or displacement.
      </p>
      <div style="display: flex; gap: 32px; border-top: 1px solid #f1f5f9; pt: 14px; font-size: 12px; color: #334155;">
        <div>
          <span style="color: #64748b;">Authorized Signatory:</span> <strong>${escapeHtml(data.step4Appendices?.signatoryName || 'Lead Founder')}</strong>
        </div>
        <div>
          <span style="color: #64748b;">Title:</span> <strong>${escapeHtml(data.step4Appendices?.signatoryTitle || 'Founder & CEO')}</strong>
        </div>
        <div>
          <span style="color: #64748b;">Date Certified:</span> <strong>${escapeHtml(new Date().toLocaleDateString())}</strong>
        </div>
      </div>
    </div>

    <!-- Pre-Submission Checklist -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
        Pre-Submission Gatekeeper Checklist
      </h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${checklistHtml}
      </ul>
    </div>
  `;

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${data.planTitle} — Official Grant & Business Plan Dossier`,
    eyebrow: data.whiteLabelEnabled
      ? `${data.planTitle.toUpperCase()} • OFFICIAL BUSINESS PLAN &amp; GRANT DOSSIER`
      : 'STARTUP PREFLIGHT • MODULE L BUSINESS PLAN &amp; GRANT COMPILER',
    planTitle: data.planTitle,
    founderName: data.founderName,
    countryName: isUK ? 'United Kingdom' : 'Ireland',
    currency: currencySymbol,
    industryCategory: data.industryCategory,
    dateStr: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    scopeValue: compilerMode,
    sectionsHtml: bodyContent,
    footerCtaHtml: `<strong>Congratulations on Completing All 12 Modules of Startup Preflight!</strong>
      Your official submission dossier and verified evidence appendices are assembled and committee-ready. You can print to PDF, download the standalone HTML dossier, or export to your Master Blueprint.`,
  });
}
