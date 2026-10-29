import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  getGrantsForCountry,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import {
  escapeDocumentHtml as escapeHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
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
  OTHER: '✨ Other (Custom Goal)',
};

export const WEEKLY_HOURS_LABELS: Record<FounderWeeklyHours, string> = {
  '5_TO_10_HRS': '⏰ 5–10 hrs / week (Evenings & Weekends)',
  '15_TO_25_HRS': '⚡ 15–25 hrs / week (Part-Time Focus)',
  '40_PLUS_HRS': '🔥 40+ hrs / week (Full-Time All-In)',
  OTHER: '✨ Other (Custom Schedule)',
};

export const TEAM_STRUCTURE_LABELS: Record<PlanTeamStructureType, string> = {
  SOLO_FOUNDER: '👤 Flying Solo (100% Me)',
  SEEKING_COFOUNDER: '🤝 Solo, Looking for a Co-Founder',
  COFOUNDER_TEAM: '👥 Co-Founder Team (2+ Founders)',
  SOLO_PLUS_CONTRACTORS: '🛠️ Solo + Freelancers / Agency',
  OTHER: '✨ Other (Custom Team Setup)',
};

export const SKILL_COVERAGE_LABELS: Record<TeamSkillCoverageType, string> = {
  BUILD_IN_HOUSE: '✅ Yes — Can build & deliver Version 1 in-house',
  PARTIAL_SKILLS:
    '🧩 Mostly — Have domain/sales skills, need help with tech/build',
  NEED_EXTERNAL_BUILDER:
    '🚨 Need External Builder — Will need to hire or find a technical co-founder',
  OTHER: '✨ Other (Custom Skill Setup)',
};

export const INDUSTRY_CONNECTION_LABELS: Record<
  IndustryConnectionLevel,
  string
> = {
  LIVED_IT_INSIDER: '🔑 Industry Insider (Lived the problem firsthand)',
  WARM_CONNECTIONS:
    '🤝 Warm Network (Can message 3–5 target buyers on Monday morning)',
  STARTING_COLD: '🧭 Starting Cold (Spotted opportunity from the outside)',
  OTHER: '✨ Other (Custom Industry Access)',
};

export const INCOME_URGENCY_LABELS: Record<PersonalIncomeUrgency, string> = {
  NO_RUSH_12M_PLUS:
    '🛡️ No Rush (12+ Months — covered by day job, partner, or savings)',
  MEDIUM_6_TO_12M:
    '⏳ Within 6–12 Months (Steady progress toward replacing income)',
  URGENT_1_TO_3M:
    '⚡ Urgent (Within 1–3 Months — need fast customer cashflow now)',
  OTHER: '✨ Other (Custom Income Timeline)',
};

export const DEALBREAKER_LABELS: Record<FounderDealbreakerType, string> = {
  NO_BIG_TEAM: '🚫 No managing a big team of staff',
  NO_PHYSICAL_PREMISES: '🚫 No physical shop, lease, or warehouse',
  NO_COLD_SALES: '🚫 No cold calling & high-pressure B2B enterprise sales',
  NO_OUTSIDE_INVESTORS: '🚫 No VCs or outside investors telling me what to do',
  NO_WEEKEND_SUPPORT: '🚫 No 24/7 customer emergencies on weekends',
  OTHER: '✨ Other (Custom Dealbreaker)',
};

export const GROWTH_TRADEOFF_LABELS: Record<GrowthTradeoffPreference, string> =
  {
    BOOTSTRAP_100_CONTROL: '👑 100% My Own Boss (Bootstrap via customer revenue)',
    NON_DILUTIVE_GRANTS: '🏛️ Customer Sales + Non-Dilutive State Grants',
    SHARE_EQUITY_COFOUNDER: '🤝 Share Equity with the Right Co-Founder',
    RAISE_INVESTMENT: '📈 Open to Angel / VC Investment to Scale Faster',
    OTHER: '✨ Other (Custom Funding & Ownership Path)',
  };

export const BIGGEST_WORRY_LABELS: Record<BiggestWorryPreset, string> = {
  WILL_THEY_PAY: '💳 Will Anyone Actually Pay?',
  FINDING_FIRST_10: '📣 Finding My First 10 Customers',
  HOW_TO_BUILD: '🛠️ How to Actually Build Version 1',
  COMPETITION_OR_AI: '🦈 Big Competitors or AI Copying Us',
  TIME_AND_ENERGY: '🔋 Running Out of Time or Cash Before Traction',
  OTHER: '✨ Other (Custom Worry)',
};

export function formatStartingBudgetBracket(
  bracket: StartingBudgetBracket,
  currency: 'EUR' | 'GBP' | 'USD' | 'AUD' | 'CAD',
  otherBudgetText?: string
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
    case 'OTHER':
      return otherBudgetText?.trim()
        ? `✨ Other: ${otherBudgetText.trim()}`
        : `✨ Other (${currency} Custom Budget)`;
  }
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
    currency,
    data.teamAndBudget.otherBudgetText
  );
  const motivationText =
    data.founderMotivation.primaryMotivation === 'OTHER' &&
    data.founderMotivation.otherMotivationText?.trim()
      ? `✨ Other: ${data.founderMotivation.otherMotivationText.trim()}`
      : MOTIVATION_LABELS[data.founderMotivation.primaryMotivation];
  const weeklyHoursText =
    data.founderMotivation.weeklyHoursAvailable === 'OTHER' &&
    data.founderMotivation.otherWeeklyHoursText?.trim()
      ? `✨ Other: ${data.founderMotivation.otherWeeklyHoursText.trim()}`
      : WEEKLY_HOURS_LABELS[data.founderMotivation.weeklyHoursAvailable];
  const teamSetupText =
    data.teamAndBudget.teamStructureType === 'OTHER' &&
    data.teamAndBudget.otherTeamStructureText?.trim()
      ? `✨ Other: ${data.teamAndBudget.otherTeamStructureText.trim()}`
      : TEAM_STRUCTURE_LABELS[data.teamAndBudget.teamStructureType];
  const skillCoverageText =
    data.teamAndBudget.skillCoverage === 'OTHER' &&
    data.teamAndBudget.otherSkillCoverageText?.trim()
      ? `✨ Other: ${data.teamAndBudget.otherSkillCoverageText.trim()}`
      : SKILL_COVERAGE_LABELS[data.teamAndBudget.skillCoverage];
  const industryConnectionText =
    data.founderRealityCheck.industryConnection === 'OTHER' &&
    data.founderRealityCheck.otherIndustryConnectionText?.trim()
      ? `✨ Other: ${data.founderRealityCheck.otherIndustryConnectionText.trim()}`
      : INDUSTRY_CONNECTION_LABELS[data.founderRealityCheck.industryConnection];
  const incomeUrgencyText =
    data.founderRealityCheck.personalIncomeUrgency === 'OTHER' &&
    data.founderRealityCheck.otherIncomeUrgencyText?.trim()
      ? `✨ Other: ${data.founderRealityCheck.otherIncomeUrgencyText.trim()}`
      : INCOME_URGENCY_LABELS[data.founderRealityCheck.personalIncomeUrgency];
  const growthTradeoffText =
    data.founderRealityCheck.growthTradeoff === 'OTHER' &&
    data.founderRealityCheck.otherGrowthTradeoffText?.trim()
      ? `✨ Other: ${data.founderRealityCheck.otherGrowthTradeoffText.trim()}`
      : GROWTH_TRADEOFF_LABELS[data.founderRealityCheck.growthTradeoff];
  const dealbreakersText =
    data.founderRealityCheck.dealbreakers.length > 0
      ? data.founderRealityCheck.dealbreakers
          .map((d) =>
            d === 'OTHER' && data.founderRealityCheck.otherDealbreakerText?.trim()
              ? `  - ✨ Other: ${data.founderRealityCheck.otherDealbreakerText.trim()}`
              : `  - ${DEALBREAKER_LABELS[d]}`
          )
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
- **Primary Motivation:** ${motivationText}
- **Weekly Time Commitment:** ${weeklyHoursText}
- **12-Month Success Vision:** ${data.founderMotivation.twelveMonthSuccessVision?.trim() || 'Build a validated, sustainable business with paying customers.'}

---

## 4. Day-1 Team & Starting Budget (Step 4)
- **Team Setup:** ${teamSetupText}
- **In-House V1 Build Skills:** ${skillCoverageText}
- **Starting Capital Bucket (${currency}):** ${budgetText}
- **Team & Funding Notes:** ${data.teamAndBudget.teamAndFundingNotes?.trim() || 'No extra notes added.'}

---

## 5. Founder Reality Check & Dealbreakers (Step 5)
- **Industry Access (Monday Morning Test):** ${industryConnectionText}
- **Personal Income Pressure:** ${incomeUrgencyText}
- **Ownership & Funding Philosophy:** ${growthTradeoffText}
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
    currency,
    data.teamAndBudget.otherBudgetText
  );
  const motivationText =
    data.founderMotivation.primaryMotivation === 'OTHER' &&
    data.founderMotivation.otherMotivationText?.trim()
      ? `✨ Other: ${data.founderMotivation.otherMotivationText.trim()}`
      : MOTIVATION_LABELS[data.founderMotivation.primaryMotivation];
  const weeklyHoursText =
    data.founderMotivation.weeklyHoursAvailable === 'OTHER' &&
    data.founderMotivation.otherWeeklyHoursText?.trim()
      ? `✨ Other: ${data.founderMotivation.otherWeeklyHoursText.trim()}`
      : WEEKLY_HOURS_LABELS[data.founderMotivation.weeklyHoursAvailable];
  const teamSetupText =
    data.teamAndBudget.teamStructureType === 'OTHER' &&
    data.teamAndBudget.otherTeamStructureText?.trim()
      ? `✨ Other: ${data.teamAndBudget.otherTeamStructureText.trim()}`
      : TEAM_STRUCTURE_LABELS[data.teamAndBudget.teamStructureType];
  const skillCoverageText =
    data.teamAndBudget.skillCoverage === 'OTHER' &&
    data.teamAndBudget.otherSkillCoverageText?.trim()
      ? `✨ Other: ${data.teamAndBudget.otherSkillCoverageText.trim()}`
      : SKILL_COVERAGE_LABELS[data.teamAndBudget.skillCoverage];
  const industryConnectionText =
    data.founderRealityCheck.industryConnection === 'OTHER' &&
    data.founderRealityCheck.otherIndustryConnectionText?.trim()
      ? `✨ Other: ${data.founderRealityCheck.otherIndustryConnectionText.trim()}`
      : INDUSTRY_CONNECTION_LABELS[data.founderRealityCheck.industryConnection];
  const incomeUrgencyText =
    data.founderRealityCheck.personalIncomeUrgency === 'OTHER' &&
    data.founderRealityCheck.otherIncomeUrgencyText?.trim()
      ? `✨ Other: ${data.founderRealityCheck.otherIncomeUrgencyText.trim()}`
      : INCOME_URGENCY_LABELS[data.founderRealityCheck.personalIncomeUrgency];
  const growthTradeoffText =
    data.founderRealityCheck.growthTradeoff === 'OTHER' &&
    data.founderRealityCheck.otherGrowthTradeoffText?.trim()
      ? `✨ Other: ${data.founderRealityCheck.otherGrowthTradeoffText.trim()}`
      : GROWTH_TRADEOFF_LABELS[data.founderRealityCheck.growthTradeoff];

  const brandHeader = data.whiteLabelEnabled
    ? 'CONFIDENTIAL STARTUP CONCEPT & READINESS BRIEF'
    : 'STARTUP PREFLIGHT • MODULE A CONCEPT & READINESS BRIEF';

  const sectionsHtml = `
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
          <div class="card-value">${escapeHtml(motivationText)}</div>
        </div>
        <div class="card">
          <div class="card-label">Realistic Weekly Hours</div>
          <div class="card-value">${escapeHtml(weeklyHoursText)}</div>
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
          <div class="card-value">${escapeHtml(teamSetupText)}</div>
        </div>
        <div class="card">
          <div class="card-label">Starting Capital Bucket (${escapeHtml(currency)})</div>
          <div class="card-value">${escapeHtml(budgetText)}</div>
        </div>
      </div>
      <div class="card" style="margin-top: 12px;">
        <div class="card-label">In-House Version 1 Skill Coverage</div>
        <div class="card-value">${escapeHtml(skillCoverageText)}</div>
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
          <div class="card-value">${escapeHtml(industryConnectionText)}</div>
        </div>
        <div class="card">
          <div class="card-label">Personal Income Urgency</div>
          <div class="card-value">${escapeHtml(incomeUrgencyText)}</div>
        </div>
        <div class="card">
          <div class="card-label">Ownership &amp; Funding Philosophy</div>
          <div class="card-value">${escapeHtml(growthTradeoffText)}</div>
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
                      `<span class="pill">${escapeHtml(
                        d === 'OTHER' &&
                          data.founderRealityCheck.otherDealbreakerText?.trim()
                          ? `✨ Other: ${data.founderRealityCheck.otherDealbreakerText.trim()}`
                          : DEALBREAKER_LABELS[d]
                      )}</span>`
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
    </div>`;

  const footerCtaHtml = `<strong>Ready for Module B (Market &amp; Competitor Intelligence)?</strong>
      Your Module A Concept &amp; Readiness Brief is complete. Continue to Module B inside Startup Preflight to map your Target Customers, Competitors, ${escapeHtml(countryPack.countryName)} Market Sizing, and Competitive Edge.`;

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${data.planTitle} — Startup Concept & Readiness Brief`,
    eyebrow: brandHeader,
    planTitle: data.planTitle,
    founderName: data.founderName,
    countryName: countryPack.countryName,
    currency,
    industryCategory: data.industryCategory,
    dateStr,
    scopeLabel: 'Scope',
    scopeValue:
      data.exportPotential === 'EXPORTING_INTERNATIONALLY'
        ? 'International Export'
        : `Domestic (${countryPack.countryName})`,
    sectionsHtml,
    footerCtaHtml,
  });
}
