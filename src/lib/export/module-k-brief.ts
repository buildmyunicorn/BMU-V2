import {
  escapeDocumentHtml as escapeHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
import type {
  ActiveStartupPlan,
  ModuleKStep5FundingBriefSavedData,
  GrantRoadmapPhaseItem,
} from '@/lib/auth/session-store';

export interface ModuleKBriefExportData {
  planTitle: string;
  founderName: string;
  industryCategory: string;
  hqCountryCode: string;
  baseCurrency: string;
  brief: ModuleKStep5FundingBriefSavedData;
  step1SelectedGrantName?: string;
  step1ReadinessScore?: number;
  step2TotalGap?: number;
  step2SkinInTheGame?: number;
  step3ReimbursementBuffer?: number;
  step3BridgeStrategy?: string;
  step4TaxScheme?: string;
  step4AdvanceStatus?: string;
  whiteLabelEnabled?: boolean;
}

export function buildModuleKStandaloneHtmlDocument(data: ModuleKBriefExportData): string {
  const isUK = data.hqCountryCode === 'GB';
  const currencySymbol = isUK ? '£' : '€';
  const grantAgency = isUK
    ? 'Innovate UK, British Business Bank & HMRC'
    : 'Local Enterprise Office (LEO), Enterprise Ireland & Revenue';

  const roadmapRowsHtml = (data.brief.fundingRoadmap || [])
    .map(
      (phase: GrantRoadmapPhaseItem) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 14px; font-weight: 700; color: #4338ca; vertical-align: top;">
          Phase ${escapeHtml(String(phase.phaseNumber))}
        </td>
        <td style="padding: 12px 14px; vertical-align: top;">
          <strong style="color: #0f172a; font-size: 13px;">${escapeHtml(phase.grantOrFundingName)}</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(phase.agency)}</div>
        </td>
        <td style="padding: 12px 14px; font-weight: 700; color: #047857; vertical-align: top;">
          ${escapeHtml(phase.amountFormatted)}
        </td>
        <td style="padding: 12px 14px; font-size: 12px; color: #334155; vertical-align: top;">
          ${escapeHtml(phase.timingTrigger)}
        </td>
        <td style="padding: 12px 14px; font-size: 11px; color: #475569; vertical-align: top; line-height: 1.4;">
          ${escapeHtml(phase.prerequisites)}
        </td>
        <td style="padding: 12px 14px; font-size: 11px; color: #065f46; background: #f0fdf4; vertical-align: top; line-height: 1.4;">
          ${escapeHtml(phase.unlocksNext)}
        </td>
      </tr>
    `
    )
    .join('');

  const contradictionFlagsHtml = (data.brief.underwriterContradictionFlags || [])
    .map((flag: string) => {
      const isWarn = flag.startsWith('⚠️');
      const isInfo = flag.startsWith('💡');
      const bg = isWarn ? '#fffbeb' : isInfo ? '#eff6ff' : '#f0fdf4';
      const border = isWarn ? '#fde68a' : isInfo ? '#bfdbfe' : '#bbf7d0';
      const text = isWarn ? '#78350f' : isInfo ? '#1e3a8a' : '#14532d';
      return `<div style="margin-bottom: 8px; padding: 10px 14px; border-radius: 6px; background: ${bg}; border: 1px solid ${border}; color: ${text}; font-size: 12px; line-height: 1.4;">${escapeHtml(flag)}</div>`;
    })
    .join('');

  const checklistHtml = (data.brief.recommendedActionChecklist || [])
    .map(
      (item: string) => `
      <li style="margin-bottom: 8px; font-size: 12px; color: #334155; line-height: 1.4;">
        <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #cbd5e1; border-radius: 3px; margin-right: 8px; vertical-align: -2px;"></span>
        ${escapeHtml(item)}
      </li>
    `
    )
    .join('');

  const bodyContentHtml = `
    <!-- Top Summary Banner -->
    <div style="background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca); color: #ffffff; padding: 24px 28px; border-radius: 12px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #c7d2fe; font-weight: 700; margin-bottom: 4px;">
            Statutory Public Grants, Capital Stack &amp; Tax Relief Hub
          </div>
          <h2 style="font-size: 22px; font-weight: 800; margin: 0 0 6px; color: #ffffff;">
            ${escapeHtml(data.planTitle)} — Funding Strategy Dossier
          </h2>
          <div style="font-size: 12px; color: #e0e7ff;">
            Evaluator Jurisdiction: <strong>${isUK ? 'United Kingdom 🇬🇧' : 'Ireland 🇮🇪'}</strong> • Primary Agency: <strong>${escapeHtml(grantAgency)}</strong>
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; padding: 12px 18px; text-align: center;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #c7d2fe; font-weight: 700;">Assessor Readiness</div>
          <div style="font-size: 28px; font-weight: 900; color: #34d399; margin-top: 2px;">
            ${escapeHtml(String(data.brief.assessorReadinessScore || 85))}%
          </div>
          <div style="font-size: 10px; color: #e0e7ff;">Committee Stage Ready</div>
        </div>
      </div>
    </div>

    <!-- 4-Card Hero Metric Grid -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Target Early Capital</div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0;">
          ${escapeHtml(currencySymbol)}${escapeHtml(Number(data.step2TotalGap || 50000).toLocaleString())}
        </div>
        <div style="font-size: 10px; color: #64748b;">Module J Cashflow Gap</div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Founder Skin-In-The-Game</div>
        <div style="font-size: 20px; font-weight: 800; color: #047857; margin: 4px 0;">
          ${escapeHtml(currencySymbol)}${escapeHtml(Number(data.step2SkinInTheGame || 15000).toLocaleString())}
        </div>
        <div style="font-size: 10px; color: #047857;">Satisfies Grant Match Ratio</div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Arrears Lag Buffer</div>
        <div style="font-size: 20px; font-weight: 800; color: #4338ca; margin: 4px 0;">
          ${escapeHtml(currencySymbol)}${escapeHtml(Number(data.step3ReimbursementBuffer || 12000).toLocaleString())}
        </div>
        <div style="font-size: 10px; color: #4338ca;">${escapeHtml(data.step3BridgeStrategy || 'Staged Buffer')}</div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Angel Tax Relief</div>
        <div style="font-size: 20px; font-weight: 800; color: #b45309; margin: 4px 0;">
          ${escapeHtml(data.step4TaxScheme || (isUK ? 'HMRC SEIS' : 'Revenue SURE'))}
        </div>
        <div style="font-size: 10px; color: #b45309;">${escapeHtml(data.step4AdvanceStatus || 'Advance Assurance')}</div>
      </div>
    </div>

    <!-- Executive Summary Narrative -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
      <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        1. Executive Funding Strategy Dossier
      </h3>
      <p style="font-size: 13px; color: #334155; line-height: 1.65; margin: 0; white-space: pre-wrap;">${escapeHtml(data.brief.executiveSummary)}</p>
    </div>

    <!-- Phased Grant Application Roadmap Table -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
      <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        2. Phased Grant &amp; Funding Application Pipeline
      </h3>
      <p style="font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 14px;">
        Chronological capital sequencing engineered to de-risk milestones and minimize early founder equity dilution.
      </p>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 10px 14px;">Phase</th>
            <th style="padding: 10px 14px;">Program &amp; Agency</th>
            <th style="padding: 10px 14px;">Target Amount</th>
            <th style="padding: 10px 14px;">When to Apply</th>
            <th style="padding: 10px 14px;">Prerequisites</th>
            <th style="padding: 10px 14px;">What This Unlocks</th>
          </tr>
        </thead>
        <tbody>
          ${roadmapRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Pre-Flight Contradiction Audit & Pre-Submission Checklist (2 columns) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
          3. Assessor Pre-Flight Contradiction Check
        </h3>
        <div>
          ${contradictionFlagsHtml}
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
          4. Pre-Submission Action Checklist
        </h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${checklistHtml}
        </ul>
      </div>
    </div>

    <!-- Assessor Insider Tip Callout -->
    ${
      data.brief.aiAssessorTip
        ? `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
        <strong style="color: #78350f; font-size: 12px;">Underwriter Insider Tip:</strong>
        <p style="font-size: 12px; color: #92400e; margin: 4px 0 0; line-height: 1.5;">${escapeHtml(data.brief.aiAssessorTip)}</p>
      </div>
    `
        : ''
    }

    <!-- Target Module L Grant Compiler Notice -->
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; font-weight: 700;">
        Downstream Compiler Integration
      </div>
      <div style="font-size: 13px; color: #0f172a; margin-top: 4px; font-weight: 700;">
        Module L Business Plan &amp; Grant Compiler Mode: 
        <span style="color: #4338ca;">
          ${escapeHtml(
            data.brief.moduleLGrantMode === 'IE_LEO'
              ? '🇮🇪 LEO Official Form & Appendices A–F'
              : data.brief.moduleLGrantMode === 'UK_INNOVATE_UK'
                ? '🇬🇧 Innovate UK IFS 9-Question Grant Mode'
                : data.brief.moduleLGrantMode === 'UK_START_UP_LOANS'
                  ? '🇬🇧 British Business Bank Start Up Loans 4-Part Workbook'
                  : data.brief.moduleLGrantMode === 'HMRC_SEIS'
                    ? '🇬🇧 HMRC SEIS/EIS Advance Assurance Pack'
                    : '🌐 Standard Investor Business Plan'
          )}
        </span>
      </div>
      <p style="font-size: 11px; color: #64748b; margin: 4px 0 0;">
        All figures, supplier quote schedules, and match allocations automatically link to Module L appendices.
      </p>
    </div>
  `;

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${data.planTitle} — Grants & Funding Strategy Dossier`,
    eyebrow: data.whiteLabelEnabled
      ? `${data.planTitle.toUpperCase()} • GRANTS &amp; FUNDING STRATEGY DOSSIER`
      : 'STARTUP PREFLIGHT • MODULE K NON-DILUTIVE FUNDING DOSSIER',
    planTitle: data.planTitle,
    founderName: data.founderName,
    countryName: isUK ? 'United Kingdom' : 'Ireland',
    currency: isUK ? '£' : '€',
    industryCategory: data.industryCategory,
    dateStr: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    scopeValue: isUK ? 'Innovate UK & SEIS' : 'LEO & Enterprise Ireland',
    sectionsHtml: bodyContentHtml,
    footerCtaHtml: `<strong>Ready for Module L (Official Business Plan &amp; Grant Compiler)?</strong>
      Your Module K Non-Dilutive Grants &amp; Funding Strategy Dossier is complete. Proceed to Module L inside Startup Preflight to compile your official grant applications, append matching bank verification, and generate assessor-ready PDF packs.`,
  });
}
