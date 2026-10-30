import type { BlindSpotItem } from '@/db/schema';
import type {
  InterviewChannelType,
  InterviewCommitmentOutcomeType,
  InterviewSignalBadgeType,
  SavedConceptCanvas,
  SavedCustomerInterviewLog,
  SavedModuleBData,
  SavedValidationSurvey,
} from '@/lib/auth/session-store';
import {
  getCountryRulePack,
  type SupportedCountryCode,
} from '@/lib/localization';
import {
  escapeDocumentHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
import { hasModuleCValidationData } from '@/lib/ai/module-c-blindspots';

export interface ModuleCBriefData {
  planTitle: string;
  founderName: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarkets?: string[];
  conceptCanvas?: SavedConceptCanvas;
  moduleBData?: SavedModuleBData;
  surveys: SavedValidationSurvey[];
  activeSurvey?: SavedValidationSurvey;
  interviewLogs: SavedCustomerInterviewLog[];
  thingsToConsider: BlindSpotItem[];
  whiteLabelEnabled?: boolean;
}

export const INTERVIEW_CHANNEL_LABELS: Record<InterviewChannelType, string> = {
  ZOOM_VIDEO: 'Video Call (Zoom / Meet / Teams)',
  PHONE_CALL: 'Phone Call',
  IN_PERSON_COFFEE: 'In-Person / Coffee Chat',
  LINKEDIN_DM_CHAT: 'LinkedIn / Direct Message Chat',
  OTHER: 'Custom Channel (Other)',
};

export const INTERVIEW_COMMITMENT_LABELS: Record<
  InterviewCommitmentOutcomeType,
  string
> = {
  ASKED_TO_PILOT_OR_BUY: 'Asked to Pilot / Pre-Order / Buy Early',
  INTRODUCED_PEERS: 'Offered Warm Intro to Peers / Decision-Makers',
  SHARED_DEEP_WORKFLOW_PAIN: 'Shared Deep Workflow Pain & Follow-Up Access',
  POLITE_COMPLIMENTS_ONLY: 'Polite Compliments Only (No Concrete Commitment)',
  NOT_TARGET_PERSONA: 'Not Target Persona / Low Problem Fit',
  OTHER: 'Custom Outcome (Other)',
};

export const INTERVIEW_SIGNAL_LABELS: Record<InterviewSignalBadgeType, string> = {
  STRONG_SIGNAL: 'Strong Signal (Skin in the Game)',
  MIXED_SIGNAL: 'Mixed / Lukewarm Signal',
  POLITE_FLUFF: 'Polite Fluff (Compliments Without Action)',
};

export function formatInterviewChannel(log: SavedCustomerInterviewLog): string {
  if (log.channel === 'OTHER' && log.otherChannelText?.trim()) {
    return `Other: ${log.otherChannelText.trim()}`;
  }
  return INTERVIEW_CHANNEL_LABELS[log.channel] || log.channel;
}

export function formatInterviewCommitment(
  log: SavedCustomerInterviewLog
): string {
  if (
    log.commitmentOutcome === 'OTHER' &&
    log.otherCommitmentText?.trim()
  ) {
    return `Other: ${log.otherCommitmentText.trim()}`;
  }
  return (
    INTERVIEW_COMMITMENT_LABELS[log.commitmentOutcome] || log.commitmentOutcome
  );
}

/**
 * Generates a clean, structured Markdown version of the Module C
 * Customer Surveys, Waitlist & 1-on-1 Interview Validation Brief.
 * Returns `''` if there are no surveys and no 1-on-1 interviews.
 */
export function buildModuleCMarkdownBrief(data: ModuleCBriefData): string {
  const surveys = data.surveys || [];
  const interviewLogs = data.interviewLogs || [];

  if (!hasModuleCValidationData(surveys, interviewLogs)) {
    return '';
  }

  const countryPack = getCountryRulePack(data.hqCountryCode);
  const currency = countryPack.defaultCurrency;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const validSurveys = surveys.filter((s) => s.questions.length > 0);
  const allResponses = validSurveys.flatMap((s) => s.responses || []);
  const realResponses = allResponses.filter((r) => !r.isSimulated);
  const simulatedResponses = allResponses.filter((r) => r.isSimulated);
  const waitlistLeads = allResponses.filter(
    (r) => r.joinedWaitlist && Boolean(r.respondentEmail?.trim())
  );
  const avgPain =
    interviewLogs.length > 0
      ? (
          interviewLogs.reduce((acc, i) => acc + i.painScore1To5, 0) /
          interviewLogs.length
        ).toFixed(1)
      : 'N/A';

  const lines: string[] = [
    `# ${data.planTitle} — Customer Surveys & 1-on-1 Validation Brief (Module C)`,
    `**Prepared for:** ${data.founderName} | **HQ & Market:** ${countryPack.countryName} (${currency}) | **Industry:** ${data.industryCategory} | **Date:** ${dateStr}`,
    '',
    '---',
    '',
    '## 1. Validation Evidence Snapshot',
    `- **Customer Surveys Created:** ${validSurveys.length}`,
    `- **Total Survey Responses:** ${allResponses.length} (${realResponses.length} real, ${simulatedResponses.length} simulated sample)`,
    `- **Early-Bird Waitlist Leads Captured:** ${waitlistLeads.length}`,
    `- **1-on-1 Customer Interviews Logged:** ${interviewLogs.length} (Avg Pain Severity: ${avgPain}/5)`,
    '',
  ];

  lines.push('## 2. Customer Validation Surveys');
  if (validSurveys.length === 0) {
    lines.push('_No customer surveys created yet (1-on-1 interview track active)._');
    lines.push('');
  } else {
    validSurveys.forEach((survey, sIdx) => {
      const sReal = survey.responses.filter((r) => !r.isSimulated).length;
      const sWaitlist = survey.responses.filter(
        (r) => r.joinedWaitlist && Boolean(r.respondentEmail?.trim())
      ).length;
      lines.push(
        `### ${sIdx + 1}. ${survey.title}`
      );
      lines.push(
        `- **Status:** ${survey.isPublished ? 'Published & Tamper-Proof Locked' : 'Draft'} | **Responses:** ${survey.responses.length} (${sReal} real) | **Waitlist Signups:** ${sWaitlist}`
      );
      if (survey.introDescription?.trim()) {
        lines.push(`- **Respondent Intro:** ${survey.introDescription.trim()}`);
      }
      lines.push('- **Mom-Test Questions:**');
      survey.questions.forEach((q, qIdx) => {
        lines.push(
          `  ${qIdx + 1}. [${q.type}] ${q.questionText} ${q.momTestPassed ? '✓ (Mom-Test Verified)' : '⚠️ (Review for Bias)'}`
        );
      });

      if (survey.aiInsightsSummary) {
        const ins = survey.aiInsightsSummary;
        lines.push(`- **AI Signal Score:** ${ins.signalScoreOutOf100}/100`);
        lines.push(`- **Headline Takeaway:** ${ins.headlineTakeaway}`);
        if (ins.validatedPainPoints?.length) {
          lines.push(
            `- **Validated Pain Patterns:** ${ins.validatedPainPoints.join('; ')}`
          );
        }
        if (ins.politenessAlertOrRisks?.length) {
          lines.push(
            `- **Politeness Bias Audit:** ${ins.politenessAlertOrRisks.join('; ')}`
          );
        }
        lines.push(
          `- **Recommended V1 Action (Feeds Module D):** ${ins.recommendedNextAction}`
        );
      }
      lines.push('');
    });
  }

  lines.push('## 3. 1-on-1 Customer Discovery Interviews');
  if (interviewLogs.length === 0) {
    lines.push('_No 1-on-1 customer interviews logged yet._');
    lines.push('');
  } else {
    interviewLogs.forEach((log, idx) => {
      lines.push(
        `### ${idx + 1}. ${log.intervieweeNameOrRole}${log.intervieweeEmail ? ` (${log.intervieweeEmail})` : ''}`
      );
      lines.push(
        `- **Date:** ${log.date} | **Channel:** ${formatInterviewChannel(log)} | **Pain Score:** ${log.painScore1To5}/5`
      );
      lines.push(
        `- **Signal Badge:** ${INTERVIEW_SIGNAL_LABELS[log.signalBadge]} | **Commitment Outcome:** ${formatInterviewCommitment(log)}`
      );
      lines.push(`- **Key Takeaway:** ${log.keyTakeaway}`);
      if (log.verbatimQuote?.trim()) {
        lines.push(`- **Verbatim Customer Quote:** "${log.verbatimQuote.trim()}"`);
      }
      if (log.workaroundAndSpend?.trim()) {
        lines.push(
          `- **Current Workaround & Spend:** ${log.workaroundAndSpend.trim()}`
        );
      }
      if (log.momTestCoachingNote?.trim()) {
        lines.push(
          `- **Mom-Test Coaching Note:** ${log.momTestCoachingNote.trim()}`
        );
      }
      lines.push('');
    });
  }

  lines.push('## 4. Early-Bird Waitlist & High-Intent Leads');
  if (waitlistLeads.length === 0) {
    lines.push('_No survey waitlist emails captured yet._');
  } else {
    waitlistLeads.forEach((lead, idx) => {
      lines.push(
        `${idx + 1}. **${lead.respondentNameOrRole || 'Early-Bird Lead'}** — ${lead.respondentEmail || 'No email'} ${lead.isSimulated ? '(Simulated Sample)' : '(Verified Lead)'}`
      );
    });
  }
  lines.push('');

  lines.push('## 5. Co-Founder Blind-Spot Review ("Things to Consider")');
  data.thingsToConsider.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. **[${item.severity}] ${item.title}** (${item.category})`
    );
    lines.push(`   - *Why it matters:* ${item.explanation}`);
    if (item.suggestedAction) {
      lines.push(`   - *Suggested Action:* ${item.suggestedAction}`);
    }
  });

  if (!data.whiteLabelEnabled) {
    lines.push(
      '',
      '---',
      '*Generated by Startup Preflight — The Supportive Co-Founder & Blind-Spot Engine.*'
    );
  }

  return lines.join('\n');
}

/**
 * Generates a standalone, print-ready HTML document for Module C using the unified
 * Module 1 (`document-shell.ts`) design system.
 * Returns `''` if there are no surveys and no 1-on-1 interviews.
 */
export function buildModuleCStandaloneHtmlDocument(
  data: ModuleCBriefData
): string {
  const surveys = data.surveys || [];
  const interviewLogs = data.interviewLogs || [];

  if (!hasModuleCValidationData(surveys, interviewLogs)) {
    return '';
  }

  const countryPack = getCountryRulePack(data.hqCountryCode);
  const currency = countryPack.defaultCurrency;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const validSurveys = surveys.filter((s) => s.questions.length > 0);
  const allResponses = validSurveys.flatMap((s) => s.responses || []);
  const realResponses = allResponses.filter((r) => !r.isSimulated);
  const simulatedResponses = allResponses.filter((r) => r.isSimulated);
  const waitlistLeads = allResponses.filter(
    (r) => r.joinedWaitlist && Boolean(r.respondentEmail?.trim())
  );
  const avgPain =
    interviewLogs.length > 0
      ? (
          interviewLogs.reduce((acc, i) => acc + i.painScore1To5, 0) /
          interviewLogs.length
        ).toFixed(1)
      : 'N/A';

  const surveysHtml =
    validSurveys.length === 0
      ? `<div class="card"><div class="card-value" style="color: #64748b;">No customer surveys created yet (validating via 1-on-1 customer interviews).</div></div>`
      : validSurveys
          .map((survey, idx) => {
            const sReal = survey.responses.filter((r) => !r.isSimulated).length;
            const sWaitlist = survey.responses.filter(
              (r) => r.joinedWaitlist && Boolean(r.respondentEmail?.trim())
            ).length;
            const questionsRows = survey.questions
              .map(
                (q, qIdx) => `
              <tr>
                <td style="width: 36px; font-weight: 700; color: #4f46e5;">Q${qIdx + 1}</td>
                <td>
                  <div style="font-weight: 700; color: #0f172a;">${escapeDocumentHtml(q.questionText)}</div>
                  ${
                    q.options && q.options.length > 0
                      ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Options: ${escapeDocumentHtml(q.options.join(' • '))}</div>`
                      : ''
                  }
                </td>
                <td style="width: 120px; font-size: 11px; color: #475569;">${escapeDocumentHtml(q.type.replace(/_/g, ' '))}</td>
                <td style="width: 110px; font-size: 11px; font-weight: 700; color: ${q.momTestPassed ? '#047857' : '#b45309'};">
                  ${q.momTestPassed ? '✓ Mom-Test Pass' : '⚠️ Check Bias'}
                </td>
              </tr>`
              )
              .join('');

            const aiSummaryHtml = survey.aiInsightsSummary
              ? `<div class="worry-box" style="margin-top: 10px; background: #eef2ff; border-color: #c7d2fe; color: #1e1b4b;">
                  <strong>AI Signal Score (${survey.aiInsightsSummary.signalScoreOutOf100}/100):</strong> ${escapeDocumentHtml(survey.aiInsightsSummary.headlineTakeaway)}
                  ${
                    survey.aiInsightsSummary.validatedPainPoints?.length
                      ? `<div style="margin-top: 4px; font-size: 12px;"><strong>Validated Pain Patterns:</strong> ${escapeDocumentHtml(survey.aiInsightsSummary.validatedPainPoints.join(' • '))}</div>`
                      : ''
                  }
                  <div style="margin-top: 4px; font-size: 12px;"><strong>Recommended V1 Action (Feeds Module D):</strong> ${escapeDocumentHtml(survey.aiInsightsSummary.recommendedNextAction)}</div>
                </div>`
              : '';

            return `
            <div class="card" style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                <div>
                  <div class="card-label">SURVEY #${idx + 1}</div>
                  <div class="card-value" style="font-size: 15px; font-weight: 800;">${escapeDocumentHtml(survey.title)}</div>
                </div>
                <span class="pill" style="margin: 0; background: ${survey.isPublished ? '#ecfdf5' : '#fef3c7'}; border-color: ${survey.isPublished ? '#a7f3d0' : '#fde68a'}; color: ${survey.isPublished ? '#065f46' : '#92400e'};">
                  ${survey.isPublished ? '🔒 Published & Locked' : 'Draft Survey'} • ${survey.responses.length} Responses (${sReal} Real) • ${sWaitlist} Waitlist
                </span>
              </div>
              <table class="doc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mom-Test Question</th>
                    <th>Format</th>
                    <th>Audit</th>
                  </tr>
                </thead>
                <tbody>
                  ${questionsRows}
                </tbody>
              </table>
              ${aiSummaryHtml}
            </div>`;
          })
          .join('');

  const interviewsHtml =
    interviewLogs.length === 0
      ? `<div class="card"><div class="card-value" style="color: #64748b;">No 1-on-1 customer interviews logged yet.</div></div>`
      : `<table class="doc-table">
          <thead>
            <tr>
              <th>Interviewee &amp; Role</th>
              <th>Channel &amp; Pain</th>
              <th>Takeaway, Verbatim Quote &amp; Workaround Spend</th>
              <th>Commitment Signal</th>
            </tr>
          </thead>
          <tbody>
            ${interviewLogs
              .map(
                (log) => `
              <tr>
                <td style="width: 22%;">
                  <div style="font-weight: 700; color: #0f172a;">${escapeDocumentHtml(log.intervieweeNameOrRole)}</div>
                  ${log.intervieweeEmail ? `<div style="font-size: 11px; color: #475569;">${escapeDocumentHtml(log.intervieweeEmail)}</div>` : ''}
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${escapeDocumentHtml(log.date)}</div>
                </td>
                <td style="width: 18%;">
                  <div style="font-size: 11px; font-weight: 600; color: #334155;">${escapeDocumentHtml(formatInterviewChannel(log))}</div>
                  <div style="margin-top: 4px; font-size: 12px; font-weight: 800; color: ${log.painScore1To5 >= 4 ? '#047857' : log.painScore1To5 === 3 ? '#b45309' : '#dc2626'};">
                    Pain: ${log.painScore1To5}/5
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: #0f172a;">${escapeDocumentHtml(log.keyTakeaway)}</div>
                  ${
                    log.verbatimQuote?.trim()
                      ? `<div style="margin-top: 4px; font-style: italic; color: #334155; font-size: 11px;">&ldquo;${escapeDocumentHtml(log.verbatimQuote.trim())}&rdquo;</div>`
                      : ''
                  }
                  ${
                    log.workaroundAndSpend?.trim()
                      ? `<div style="margin-top: 4px; font-size: 11px; color: #475569;"><strong>Workaround &amp; Spend:</strong> ${escapeDocumentHtml(log.workaroundAndSpend.trim())}</div>`
                      : ''
                  }
                </td>
                <td style="width: 22%;">
                  <div style="font-size: 11px; font-weight: 700; color: ${log.signalBadge === 'STRONG_SIGNAL' ? '#047857' : log.signalBadge === 'MIXED_SIGNAL' ? '#b45309' : '#dc2626'};">
                    ${escapeDocumentHtml(INTERVIEW_SIGNAL_LABELS[log.signalBadge])}
                  </div>
                  <div style="font-size: 11px; color: #334155; margin-top: 3px;">
                    ${escapeDocumentHtml(formatInterviewCommitment(log))}
                  </div>
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>`;

  const waitlistHtml =
    waitlistLeads.length === 0
      ? `<div class="card"><div class="card-value" style="color: #64748b;">No early-bird waitlist emails captured yet. Enable waitlist collection on your survey to capture warm beta leads.</div></div>`
      : `<div style="margin-top: 4px;">
          ${waitlistLeads
            .map(
              (lead) =>
                `<span class="pill">${escapeDocumentHtml(lead.respondentNameOrRole || 'Early-Bird Lead')} • ${escapeDocumentHtml(lead.respondentEmail || '')}${lead.isSimulated ? ' (Sample)' : ''}</span>`
            )
            .join('')}
        </div>`;

  const blindSpotsHtml = data.thingsToConsider
    .map(
      (item) => `
      <div class="card">
        <div class="card-label" style="color: ${item.severity === 'WARNING' ? '#b45309' : '#4f46e5'};">
          ${escapeDocumentHtml(item.severity)} • ${escapeDocumentHtml(item.category)}
        </div>
        <div class="card-value" style="font-weight: 700; margin-bottom: 4px;">
          ${escapeDocumentHtml(item.title)}
        </div>
        <div class="card-value" style="font-size: 12px; color: #475569;">
          ${escapeDocumentHtml(item.explanation)}
        </div>
        ${
          item.suggestedAction
            ? `<div class="card-value" style="font-size: 12px; color: #1e1b4b; margin-top: 6px; font-weight: 600;">
                👉 Next Step: ${escapeDocumentHtml(item.suggestedAction)}
              </div>`
            : ''
        }
      </div>`
    )
    .join('');

  const sectionsHtml = `
    <div class="section">
      <div class="section-title">1. Primary Market Validation Snapshot</div>
      <div class="grid-4">
        <div class="card" style="background: #eef2ff; border-color: #c7d2fe;">
          <div class="card-label" style="color: #4338ca;">Customer Surveys</div>
          <div class="card-value" style="font-weight: 800; font-size: 16px; color: #312e81;">
            ${validSurveys.length} Survey${validSurveys.length === 1 ? '' : 's'}
          </div>
          <div class="card-value" style="font-size: 11px; color: #4338ca; margin-top: 4px;">
            ${validSurveys.filter((s) => s.isPublished).length} Published &amp; Locked
          </div>
        </div>
        <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
          <div class="card-label" style="color: #15803d;">Survey Responses</div>
          <div class="card-value" style="font-weight: 800; font-size: 16px; color: #14532d;">
            ${realResponses.length} Real (${allResponses.length} Total)
          </div>
          <div class="card-value" style="font-size: 11px; color: #166534; margin-top: 4px;">
            ${simulatedResponses.length} simulated sample(s)
          </div>
        </div>
        <div class="card" style="background: #faf5ff; border-color: #e9d5ff;">
          <div class="card-label" style="color: #6d28d9;">1-on-1 Discovery Calls</div>
          <div class="card-value" style="font-weight: 800; font-size: 16px; color: #4c1d95;">
            ${interviewLogs.length} Logged
          </div>
          <div class="card-value" style="font-size: 11px; color: #5b21b6; margin-top: 4px;">
            Avg Customer Pain: ${avgPain}/5
          </div>
        </div>
        <div class="card" style="background: #fffbeb; border-color: #fde68a;">
          <div class="card-label" style="color: #b45309;">Early-Bird Waitlist</div>
          <div class="card-value" style="font-weight: 800; font-size: 16px; color: #78350f;">
            ${waitlistLeads.length} Lead${waitlistLeads.length === 1 ? '' : 's'}
          </div>
          <div class="card-value" style="font-size: 11px; color: #92400e; margin-top: 4px;">
            Feeds Module D &amp; Module G
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">2. Customer Validation Surveys &amp; AI Signal Synthesis</div>
      ${surveysHtml}
    </div>

    <div class="section">
      <div class="section-title">3. 1-on-1 Customer Discovery Interview Log</div>
      ${interviewsHtml}
    </div>

    <div class="section">
      <div class="section-title">4. Early-Bird Waitlist &amp; Beta Lead Pipeline (${waitlistLeads.length})</div>
      ${waitlistHtml}
    </div>

    <div class="section">
      <div class="section-title">5. Co-Founder Blind-Spot Review ("Things to Consider")</div>
      <div class="grid-2">
        ${blindSpotsHtml}
      </div>
    </div>
  `;

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${data.planTitle} — Customer Surveys & Validation Brief (Module C)`,
    eyebrow: data.whiteLabelEnabled
      ? 'MODULE C CUSTOMER VALIDATION & INTERVIEW BRIEF'
      : 'STARTUP PREFLIGHT • MODULE C CUSTOMER VALIDATION & INTERVIEW BRIEF',
    planTitle: data.planTitle,
    founderName: data.founderName,
    countryName: countryPack.countryName,
    currency,
    industryCategory: data.industryCategory,
    dateStr,
    scopeLabel: 'Validation Track',
    scopeValue: `${validSurveys.length} Survey(s) • ${interviewLogs.length} 1-on-1 Call(s)`,
    sectionsHtml,
    footerCtaHtml: data.whiteLabelEnabled
      ? `<div><strong>Customer Validation &amp; Discovery Brief</strong> • Prepared for ${escapeDocumentHtml(data.founderName)}</div><div>${escapeDocumentHtml(dateStr)}</div>`
      : `<div><strong>Startup Preflight</strong> • Supportive Co-Founder &amp; Blind-Spot Engine</div><div>Next Step: Module D — Product Vehicle, V1 Scope &amp; Build-vs-Buy Matrix</div>`,
  });
}
