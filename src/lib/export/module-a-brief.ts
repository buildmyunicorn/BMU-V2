import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  getGrantsForCountry,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  SavedConceptCanvas,
  SavedFounderMotivation,
  SavedTeamAndBudget,
  SavedFounderRealityCheck,
  FounderMotivationType,
  FounderWeeklyHours,
  PlanTeamStructureType,
  TeamSkillCoverageType,
  StartingBudgetBracket,
  IndustryConnectionLevel,
  PersonalIncomeUrgency,
  FounderDealbreakerType,
  GrowthTradeoffPreference,
  BiggestWorryPreset,
} from '@/lib/auth/session-store';

export interface ModuleABriefData {
  planTitle: string;
  founderName: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  exportPotential: 'DOMESTIC_ONLY' | 'EXPORTING_INTERNATIONALLY';
  brainDumpText: string;
  conceptCanvas: SavedConceptCanvas;
  founderMotivation: SavedFounderMotivation;
  teamAndBudget: SavedTeamAndBudget;
  founderRealityCheck: SavedFounderRealityCheck;
  thingsToConsider: BlindSpotItem[];
  openQuestions: string[];
  whiteLabelEnabled?: boolean;
}

export const MOTIVATION_LABELS: Record<FounderMotivationType, string> = {
  LEAVE_JOB: '💼 Leave My 9-to-5 & Be My Own Boss',
  SIDE_HUSTLE: '🌙 Build a Profitable Side Hustle',
  SAVE_THE_WORLD: '🌍 Solve a Mission I Care About',
  SCALE_STARTUP: '🚀 Scale a High-Growth Startup',
  BUILD_TO_SELL: '🏆 Build a Company & Sell It',
};

export const WEEKLY_HOURS_LABELS: Record<FounderWeeklyHours, string> = {
  '5_TO_10_HRS': '⏰ 5–10 hrs / week (Evenings & Weekends)',
  '15_TO_25_HRS': '⚡ 15–25 hrs / week (Part-Time Focus)',
  '40_PLUS_HRS': '🔥 40+ hrs / week (Full-Time All-In)',
};

export const TEAM_STRUCTURE_LABELS: Record<PlanTeamStructureType, string> = {
  SOLO_FOUNDER: '👤 Flying Solo (100% Me)',
  SEEKING_COFOUNDER: '🤝 Solo, Looking for a Co-Founder',
  COFOUNDER_TEAM: '👥 Co-Founder Team (2+ Founders)',
  SOLO_PLUS_CONTRACTORS: '🛠️ Solo + Freelancers / Agency',
};

export const SKILL_COVERAGE_LABELS: Record<TeamSkillCoverageType, string> = {
  BUILD_IN_HOUSE: '✅ Yes — Can build & deliver Version 1 in-house',
  PARTIAL_SKILLS:
    '🧩 Mostly — Have domain/sales skills, need help with tech/build',
  NEED_EXTERNAL_BUILDER:
    '🚨 Need External Builder — Will need to hire or find a technical co-founder',
};

export const INDUSTRY_CONNECTION_LABELS: Record<
  IndustryConnectionLevel,
  string
> = {
  LIVED_IT_INSIDER: '🔑 Industry Insider (Lived the problem firsthand)',
  WARM_CONNECTIONS:
    '🤝 Warm Network (Can message 3–5 target buyers on Monday morning)',
  STARTING_COLD: '🧭 Starting Cold (Spotted opportunity from the outside)',
};

export const INCOME_URGENCY_LABELS: Record<PersonalIncomeUrgency, string> = {
  NO_RUSH_12M_PLUS:
    '🛡️ No Rush (12+ Months — covered by day job, partner, or savings)',
  MEDIUM_6_TO_12M:
    '⏳ Within 6–12 Months (Steady progress toward replacing income)',
  URGENT_1_TO_3M:
    '⚡ Urgent (Within 1–3 Months — need fast customer cashflow now)',
};

export const DEALBREAKER_LABELS: Record<FounderDealbreakerType, string> = {
  NO_BIG_TEAM: '🚫 No managing a big team of staff',
  NO_PHYSICAL_PREMISES: '🚫 No physical shop, lease, or warehouse',
  NO_COLD_SALES: '🚫 No cold calling & high-pressure B2B enterprise sales',
  NO_OUTSIDE_INVESTORS: '🚫 No VCs or outside investors telling me what to do',
  NO_WEEKEND_SUPPORT: '🚫 No 24/7 customer emergencies on weekends',
};

export const GROWTH_TRADEOFF_LABELS: Record<GrowthTradeoffPreference, string> =
  {
    BOOTSTRAP_100_CONTROL: '👑 100% My Own Boss (Bootstrap via customer revenue)',
    NON_DILUTIVE_GRANTS: '🏛️ Customer Sales + Non-Dilutive State Grants',
    SHARE_EQUITY_COFOUNDER: '🤝 Share Equity with the Right Co-Founder',
    RAISE_INVESTMENT: '📈 Open to Angel / VC Investment to Scale Faster',
  };

export const BIGGEST_WORRY_LABELS: Record<BiggestWorryPreset, string> = {
  WILL_THEY_PAY: '💳 Will Anyone Actually Pay?',
  FINDING_FIRST_10: '📣 Finding My First 10 Customers',
  HOW_TO_BUILD: '🛠️ How to Actually Build Version 1',
  COMPETITION_OR_AI: '🦈 Big Competitors or AI Copying Us',
  TIME_AND_ENERGY: '🔋 Running Out of Time or Cash Before Traction',
};

export function formatStartingBudgetBracket(
  bracket: StartingBudgetBracket,
  currency: 'EUR' | 'GBP' | 'USD' | 'AUD' | 'CAD'
): string {
  switch (bracket) {
    case 'ZERO_SWEAT_EQUITY':
      return `🌱 ${formatPlanCurrency(0, currency)} (Sweat Equity Only)`;
    case 'UNDER_1K':
      return `☕ Under ${formatPlanCurrency(1000, currency)}`;
    case '1K_TO_5K':
      return `🧱 ${formatPlanCurrency(1000, currency)} – ${formatPlanCurrency(5000, currency)}`;
    case '5K_TO_25K':
      return `🚀 ${formatPlanCurrency(5000, currency)} – ${formatPlanCurrency(25000, currency)}`;
    case 'OVER_25K':
      return `🏦 ${formatPlanCurrency(25000, currency)}+`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a clean Markdown / Plain-Text summary for "Copy to Clipboard".
 */
export function buildModuleAMarkdownBrief(data: ModuleABriefData): string {
  const countryPack = getCountryRulePack(data.hqCountryCode);
  const grants = getGrantsForCountry(data.hqCountryCode);
  const topGrant = grants[0]?.grantName || 'Local Enterprise Support';
  const currency = countryPack.defaultCurrency;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const budgetText = formatStartingBudgetBracket(
    data.teamAndBudget.startingBudgetBracket,
    currency
  );
  const dealbreakersText =
    data.founderRealityCheck.dealbreakers.length > 0
      ? data.founderRealityCheck.dealbreakers
          .map((d) => `  - ${DEALBREAKER_LABELS[d]}`)
          .join('\n')
      : '  - None selected';

  return `# ${data.planTitle} — Founder Concept & Readiness Brief (Module A)
Prepared for: ${data.founderName} | Date: ${dateStr}
HQ Country: ${countryPack.countryName} (${currency}) | Industry: ${data.industryCategory}
Market Scope: ${data.exportPotential === 'EXPORTING_INTERNATIONALLY' ? 'International Export Potential' : `Domestic Focus (${countryPack.countryName})`}

---

## 1. Raw Startup Idea (Step 1)
${data.brainDumpText.trim() || 'Not yet entered.'}

---

## 2. 1-Page Mirror Concept Canvas (Step 2)
- **Core Problem:** ${data.conceptCanvas.coreProblem || 'Not yet specified.'}
- **Target Customer:** ${data.conceptCanvas.targetCustomer || 'Not yet specified.'}
- **Proposed Solution:** ${data.conceptCanvas.proposedSolution || 'Not yet specified.'}
- **Unfair Advantage:** ${data.conceptCanvas.unfairAdvantage || 'Not yet specified.'}
- **Revenue & Grant Fit (${currency}):** ${data.conceptCanvas.revenueAndGrantFit || `Pricing in ${currency}; exploring ${topGrant}.`}

---

## 3. Personal Ambition & Weekly Commitment (Step 3)
- **Primary Motivation:** ${MOTIVATION_LABELS[data.founderMotivation.primaryMotivation]}
- **Weekly Time Commitment:** ${WEEKLY_HOURS_LABELS[data.founderMotivation.weeklyHoursAvailable]}
- **12-Month Success Vision:** ${data.founderMotivation.twelveMonthSuccessVision?.trim() || 'Build a validated, sustainable business with paying customers.'}

---

## 4. Day-1 Team & Starting Budget (Step 4)
- **Team Setup:** ${TEAM_STRUCTURE_LABELS[data.teamAndBudget.teamStructureType]}
- **In-House V1 Build Skills:** ${SKILL_COVERAGE_LABELS[data.teamAndBudget.skillCoverage]}
- **Starting Capital Bucket (${currency}):** ${budgetText}
- **Team & Funding Notes:** ${data.teamAndBudget.teamAndFundingNotes?.trim() || 'No extra notes added.'}

---

## 5. Founder Reality Check & Dealbreakers (Step 5)
- **Industry Access (Monday Morning Test):** ${INDUSTRY_CONNECTION_LABELS[data.founderRealityCheck.industryConnection]}
- **Personal Income Pressure:** ${INCOME_URGENCY_LABELS[data.founderRealityCheck.personalIncomeUrgency]}
- **Ownership & Funding Philosophy:** ${GROWTH_TRADEOFF_LABELS[data.founderRealityCheck.growthTradeoff]}
- **#1 Secret Worry:** ${BIGGEST_WORRY_LABELS[data.founderRealityCheck.biggestWorryPreset]}${data.founderRealityCheck.biggestWorryNotes?.trim() ? ` — "${data.founderRealityCheck.biggestWorryNotes.trim()}"` : ''}
- **Lifestyle Dealbreakers (What I Refuse To Do):**
${dealbreakersText}

---

## 6. Constructive "Things to Consider" (Blind-Spot Review — Step 6)
${data.thingsToConsider
  .map(
    (item) =>
      `### ${item.title}\n- **Why it matters:** ${item.explanation}\n- **Action Step:** ${item.suggestedAction || 'Validate in Module B.'}`
  )
  .join('\n\n')}

---

## 7. Next Milestone (Module B)
- [ ] Launch Module B Customer Validation Survey (/v/my-startup) to test willingness-to-pay with 10 target buyers in ${countryPack.countryName}.
`;
}

/**
 * Generates a standalone, magazine-quality HTML document for "Download Brief (.html)" and "Print / Save as PDF".
 */
export function buildModuleAStandaloneHtmlDocument(
  data: ModuleABriefData
): string {
  const countryPack = getCountryRulePack(data.hqCountryCode);
  const grants = getGrantsForCountry(data.hqCountryCode);
  const topGrant = grants[0]?.grantName || 'Local Enterprise Support';
  const currency = countryPack.defaultCurrency;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const budgetText = formatStartingBudgetBracket(
    data.teamAndBudget.startingBudgetBracket,
    currency
  );

  const brandHeader = data.whiteLabelEnabled
    ? 'CONFIDENTIAL STARTUP CONCEPT & READINESS BRIEF'
    : 'BUILD MY UNICORN 2.0 • MODULE A CONCEPT & READINESS BRIEF';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(data.planTitle)} — Startup Concept & Readiness Brief</title>
  <style>
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
  </style>
</head>
<body>
  <div class="page">
    <div class="header-bar">
      <div>
        <div class="eyebrow">${escapeHtml(brandHeader)}</div>
        <h1>${escapeHtml(data.planTitle)}</h1>
        <div class="meta-line">
          Prepared for <strong>${escapeHtml(data.founderName)}</strong> • ${escapeHtml(countryPack.countryName)} (${escapeHtml(currency)}) • ${escapeHtml(data.industryCategory)}
        </div>
      </div>
      <div class="badge-box">
        <div><strong>Date:</strong> ${escapeHtml(dateStr)}</div>
        <div><strong>Scope:</strong> ${data.exportPotential === 'EXPORTING_INTERNATIONALLY' ? 'International Export' : `Domestic (${escapeHtml(countryPack.countryName)})`}</div>
      </div>
    </div>

    <!-- 1. RAW IDEA -->
    <div class="section">
      <div class="section-title">1. Raw Startup Idea (Step 1)</div>
      <div class="quote-box">${escapeHtml(data.brainDumpText.trim() || 'No raw brain dump entered yet.')}</div>
    </div>

    <!-- 2. 1-PAGE MIRROR CONCEPT CANVAS -->
    <div class="section">
      <div class="section-title">2. 1-Page Mirror Concept Canvas (Step 2)</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">1. Core Problem</div>
          <div class="card-value">${escapeHtml(data.conceptCanvas.coreProblem || 'Not yet specified.')}</div>
        </div>
        <div class="card">
          <div class="card-label">2. Target Customer</div>
          <div class="card-value">${escapeHtml(data.conceptCanvas.targetCustomer || 'Not yet specified.')}</div>
        </div>
        <div class="card">
          <div class="card-label">3. Proposed Solution</div>
          <div class="card-value">${escapeHtml(data.conceptCanvas.proposedSolution || 'Not yet specified.')}</div>
        </div>
        <div class="card">
          <div class="card-label">4. Unfair Advantage</div>
          <div class="card-value">${escapeHtml(data.conceptCanvas.unfairAdvantage || 'Not yet specified.')}</div>
        </div>
      </div>
      <div class="card" style="margin-top: 12px;">
        <div class="card-label">5. Revenue &amp; Grant Fit (${escapeHtml(currency)} • ${escapeHtml(topGrant)})</div>
        <div class="card-value">${escapeHtml(data.conceptCanvas.revenueAndGrantFit || `Charged in ${currency}, with potential to explore ${topGrant}.`)}</div>
      </div>
    </div>

    <!-- 3. FOUNDER AMBITION & TIME COMMITMENT -->
    <div class="section">
      <div class="section-title">3. Founder Ambition &amp; Weekly Time Commitment (Step 3)</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">Primary Motivation</div>
          <div class="card-value">${escapeHtml(MOTIVATION_LABELS[data.founderMotivation.primaryMotivation])}</div>
        </div>
        <div class="card">
          <div class="card-label">Realistic Weekly Hours</div>
          <div class="card-value">${escapeHtml(WEEKLY_HOURS_LABELS[data.founderMotivation.weeklyHoursAvailable])}</div>
        </div>
      </div>
      <div class="card" style="margin-top: 12px;">
        <div class="card-label">12-Month Personal Success Vision</div>
        <div class="card-value">${escapeHtml(data.founderMotivation.twelveMonthSuccessVision?.trim() || 'Build a validated, sustainable business with paying customers within 12 months.')}</div>
      </div>
    </div>

    <!-- 4. DAY-1 TEAM & STARTING BUDGET -->
    <div class="section">
      <div class="section-title">4. Day-1 Team &amp; Starting Capital (Step 4)</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">Team Setup</div>
          <div class="card-value">${escapeHtml(TEAM_STRUCTURE_LABELS[data.teamAndBudget.teamStructureType])}</div>
        </div>
        <div class="card">
          <div class="card-label">Starting Capital Bucket (${escapeHtml(currency)})</div>
          <div class="card-value">${escapeHtml(budgetText)}</div>
        </div>
      </div>
      <div class="card" style="margin-top: 12px;">
        <div class="card-label">In-House Version 1 Skill Coverage</div>
        <div class="card-value">${escapeHtml(SKILL_COVERAGE_LABELS[data.teamAndBudget.skillCoverage])}</div>
      </div>
      ${
        data.teamAndBudget.teamAndFundingNotes?.trim()
          ? `<div class="card" style="margin-top: 12px;">
              <div class="card-label">Deeper Team &amp; Funding Notes</div>
              <div class="card-value">${escapeHtml(data.teamAndBudget.teamAndFundingNotes.trim())}</div>
            </div>`
          : ''
      }
    </div>

    <!-- 5. FOUNDER REALITY CHECK & DEALBREAKERS -->
    <div class="section">
      <div class="section-title">5. Founder Fit, Dealbreakers &amp; Reality Check (Step 5)</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">Monday Morning Test (Industry Access)</div>
          <div class="card-value">${escapeHtml(INDUSTRY_CONNECTION_LABELS[data.founderRealityCheck.industryConnection])}</div>
        </div>
        <div class="card">
          <div class="card-label">Personal Income Urgency</div>
          <div class="card-value">${escapeHtml(INCOME_URGENCY_LABELS[data.founderRealityCheck.personalIncomeUrgency])}</div>
        </div>
        <div class="card">
          <div class="card-label">Ownership &amp; Funding Philosophy</div>
          <div class="card-value">${escapeHtml(GROWTH_TRADEOFF_LABELS[data.founderRealityCheck.growthTradeoff])}</div>
        </div>
        <div class="card">
          <div class="card-label">#1 Secret Worry (Honest Gut-Check)</div>
          <div class="card-value">
            ${escapeHtml(BIGGEST_WORRY_LABELS[data.founderRealityCheck.biggestWorryPreset])}
            ${
              data.founderRealityCheck.biggestWorryNotes?.trim()
                ? `<div style="margin-top: 4px; color: #475569; font-style: italic;">"${escapeHtml(data.founderRealityCheck.biggestWorryNotes.trim())}"</div>`
                : ''
            }
          </div>
        </div>
      </div>
      <div class="card" style="margin-top: 12px;">
        <div class="card-label">Lifestyle Dealbreakers (What I Refuse To Do)</div>
        <div class="pill-list">
          ${
            data.founderRealityCheck.dealbreakers.length > 0
              ? data.founderRealityCheck.dealbreakers
                  .map(
                    (d) =>
                      `<span class="pill">${escapeHtml(DEALBREAKER_LABELS[d])}</span>`
                  )
                  .join('')
              : '<span style="font-size: 13px; color: #64748b;">No specific lifestyle dealbreakers selected.</span>'
          }
        </div>
      </div>
    </div>

    <!-- 6. CONSTRUCTIVE THINGS TO CONSIDER -->
    <div class="section">
      <div class="section-title">6. Co-Founder Blind-Spot Review ("Things to Consider" — Step 6)</div>
      <div class="grid-2">
        ${data.thingsToConsider
          .map(
            (item) => `
          <div class="card ${item.severity === 'WARNING' ? 'card-warning' : ''}">
            <div class="card-label" style="color: ${item.severity === 'WARNING' ? '#b45309' : '#4f46e5'};">
              ${escapeHtml(item.title)}
            </div>
            <div class="card-value" style="margin-bottom: 6px;">${escapeHtml(item.explanation)}</div>
            ${
              item.suggestedAction
                ? `<div style="font-size: 12px; color: #312e81; background: #eef2ff; padding: 6px 8px; border-radius: 6px;"><strong>Action Step:</strong> ${escapeHtml(item.suggestedAction)}</div>`
                : ''
            }
          </div>`
          )
          .join('')}
      </div>
    </div>

    <div class="footer-cta">
      <strong>Ready for Module B (Market &amp; Validation Survey)?</strong>
      Your Module A Concept Brief is complete. Unlock Module B inside Build My Unicorn to auto-generate your public Customer Validation Survey, AI Market Scout, and ${escapeHtml(countryPack.countryName)} TAM/SAM/SOM sizing.
    </div>
  </div>
</body>
</html>`;
}
