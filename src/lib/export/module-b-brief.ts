import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import {
  escapeDocumentHtml as escapeHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
import type {
  BeachheadMarketData,
  CompetitorsAndStatusQuoData,
  MarketSizingData,
  CompetitiveWedgeData,
  BuyerModelType,
  EndUserVsDecisionMakerType,
  BuyingTriggerPreset,
  CustomerWorkaroundType,
  CompetitorCategoryType,
  WhySwitchEdgeType,
  CustomerBillingCadence,
  WiderMarketScalePreset,
  SwitchingFrictionReducerType,
  UnfairAdvantageMoatType,
  ComparisonScoreLevel,
} from '@/lib/auth/session-store';

export interface ModuleBBriefData {
  planTitle: string;
  founderName: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  beachhead: BeachheadMarketData;
  competitorsAndStatusQuo: CompetitorsAndStatusQuoData;
  marketSizing: MarketSizingData;
  competitiveWedge: CompetitiveWedgeData;
  thingsToConsider: BlindSpotItem[];
  grantReadySummaryParagraph: string;
  totalYear1To2RevenueSom: number;
  totalReachableMarketSam: number;
  totalWiderMarketTam: number;
  totalYear1To2Customers?: number;
  totalReachableCustomers?: number;
  whiteLabelEnabled?: boolean;
}

export const BUYER_MODEL_LABELS: Record<BuyerModelType, string> = {
  B2B_BUSINESSES: '🏢 B2B (Selling to Businesses)',
  B2C_CONSUMERS: '🛍️ B2C (Selling to Consumers)',
  TWO_SIDED_MARKETPLACE: '🔄 Two-Sided Marketplace (Connecting Buyers & Sellers)',
  B2G_PUBLIC_SECTOR: '🏛️ Public Sector / Schools / Healthcare',
  OTHER: '✨ Other (Custom Buyer Model)',
};

export const END_USER_DECISION_MAKER_LABELS: Record<
  EndUserVsDecisionMakerType,
  string
> = {
  SAME_PERSON: '👤 User = Paying Buyer (Same Person)',
  DIFFERENT_DECISION_MAKER: '👔 Separate Budget Holder / Boss Approves Spend',
  OTHER: '🔄 Custom / Shared Setup',
};

export const BUYING_TRIGGER_PRESET_LABELS: Record<BuyingTriggerPreset, string> = {
  LOSING_MONEY_WASTE: '💸 Losing Money / Margin Leak',
  MANUAL_TIME_BOTTLENECK: '⏳ Drowning in Manual Admin',
  COMPLIANCE_OR_PENALTY: '⚖️ Compliance, Audit or Safety Risk',
  LOST_CUSTOMERS_CHURN: '📉 Losing Customers to Rivals',
  LIFE_OR_BUSINESS_MILESTONE: '🚀 New Launch, Hire or Life Event',
  OTHER: '✨ Custom Trigger Moment',
};

export const TARGET_MARKET_DISPLAY_NAMES: Record<string, string> = {
  IE: 'Ireland 🇮🇪',
  GB: 'United Kingdom 🇬🇧',
  EU: 'European Union (27) 🇪🇺',
  US: 'United States 🇺🇸',
  CA: 'Canada 🇨🇦',
  AU: 'Australia & NZ 🇦🇺',
  ROW: 'Other / Global Markets 🌍',
};

export const CUSTOMER_WORKAROUND_LABELS: Record<
  CustomerWorkaroundType,
  string
> = {
  SPREADSHEETS_PAPER: '📊 Spreadsheets, Paper & Sticky Notes',
  WHATSAPP_EMAIL_PHONE: '💬 WhatsApp, Email & Phone Calls',
  FREE_GENERIC_TOOLS: '🛠️ Free or Generic Everyday Tools',
  EXPENSIVE_CONSULTANTS_AGENCIES: '🤝 Expensive Consultants, Agencies or Staff',
  DOING_NOTHING_LIVING_WITH_PAIN:
    '🙈 Doing Nothing (Living With the Pain/Delay)',
  OTHER: '✨ Custom Current Habit',
};

export const COMPETITOR_CATEGORY_LABELS: Record<
  CompetitorCategoryType,
  string
> = {
  DIRECT_COMPETITOR: 'Direct Competitor',
  INDIRECT_ALTERNATIVE: 'Indirect / Everyday Tool',
  MANUAL_SERVICE_AGENCY: 'Agency / Consultant / Service',
  OTHER: 'Other Alternative',
};

export const WHY_SWITCH_EDGE_LABELS: Record<WhySwitchEdgeType, string> = {
  SAVES_TIME_AUTOMATIC: '⚡ Saves Hours of Manual Admin',
  MORE_AFFORDABLE: '💷 More Affordable / Clear ROI',
  BUILT_FOR_LOCAL_MARKET: '🌍 Tailored to Local Rules & Grants',
  EASIER_NO_TRAINING: '🎯 Simpler — No Training Needed',
  ALL_IN_ONE_WORKFLOW: '🔗 Everything in One Place',
  PROVEN_RESULTS_OR_COMPLIANCE: '🛡️ Higher Trust, Vetting or Compliance',
  OTHER: '✨ Other Key Advantage',
};

export const BILLING_CADENCE_LABELS: Record<CustomerBillingCadence, string> = {
  MONTHLY_SUBSCRIPTION: 'Monthly (×12)',
  YEARLY_OR_ONE_OFF: 'Annual / One-Off',
  OTHER: 'Custom Cadence',
};

export const WIDER_MARKET_SCALE_LABELS: Record<
  WiderMarketScalePreset,
  string
> = {
  '3X': '3x (Adjacent Regions / Sectors)',
  '5X': '5x (Multi-Country Expansion)',
  '10X': '10x (International Category Scale)',
  '20X': '20x (Global Category Opportunity)',
  OTHER: 'Custom Expansion Horizon',
};

export const SWITCHING_FRICTION_LABELS: Record<
  SwitchingFrictionReducerType,
  string
> = {
  FREE_TRIAL_OR_FIRST_STEP: '🎁 Free Trial, Sample, or Low-Risk First Step',
  WORKS_WITH_EXISTING_TOOLS: '🔌 Works Alongside Their Existing Tools / Habits',
  FAST_SETUP_UNDER_15_MINS: '⚡ Fast Setup (Value in Under 15 Minutes)',
  DONE_FOR_YOU_MIGRATION: '🤝 Done-For-You Setup / White-Glove Onboarding',
  IMMEDIATE_COST_SAVING: '💶 Immediate Cost or Time Saving on Day 1',
  NO_LONG_CONTRACT: '🔓 No Long-Term Lock-In (Cancel Anytime)',
  OTHER: '✨ Other (Custom Friction Reducer)',
};

export const UNFAIR_ADVANTAGE_LABELS: Record<UnfairAdvantageMoatType, string> = {
  FOUNDER_INSIDER_EXPERIENCE: '🔑 Lived Insider Experience & Industry Credibility',
  PROPRIETARY_DATA_OR_TEMPLATES:
    '🧠 Proprietary Workflow, Templates, IP, or Dataset',
  LOCAL_COMPLIANCE_OR_GRANTS:
    '🏛️ Local Regulation, Compliance & Grant Alignment',
  COMMUNITY_OR_NETWORK_EFFECTS:
    '🤝 Community, Word-of-Mouth, or Network Effects',
  WORKFLOW_HABIT_LOCK_IN: '🔒 Deeply Embedded in Daily Customer Habits',
  EXCLUSIVE_PARTNERSHIPS_OR_ACCREDITATION:
    '🏅 Exclusive Partnerships, Suppliers, or Accreditation',
  OTHER: '✨ Other (Custom Unfair Advantage)',
};

export function formatTargetMarketsDisplay(
  targetMarkets: string[],
  otherGeographyText?: string
): string {
  if (!targetMarkets || targetMarkets.length === 0) return 'Domestic Focus';
  return targetMarkets
    .map((code) => {
      if (code === 'ROW' && otherGeographyText?.trim()) {
        return `Other: ${otherGeographyText.trim()} 🌍`;
      }
      return TARGET_MARKET_DISPLAY_NAMES[code] || code;
    })
    .join(', ');
}

function renderScoreBadge(score: ComparisonScoreLevel): string {
  switch (score) {
    case 'HIGH':
      return `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-weight:700;font-size:11px;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;">High</span>`;
    case 'MEDIUM':
      return `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-weight:700;font-size:11px;background:#fef3c7;color:#b45309;border:1px solid #fde68a;">Med</span>`;
    case 'LOW':
    default:
      return `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-weight:700;font-size:11px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;">Low</span>`;
  }
}

export function buildModuleBMarkdownBrief(data: ModuleBBriefData): string {
  const countryPack = getCountryRulePack(data.hqCountryCode);
  const currency = countryPack.defaultCurrency;
  const marketsDisplay = formatTargetMarketsDisplay(
    data.targetMarketsArray,
    data.beachhead.otherGeographyText
  );
  const isExporting = data.targetMarketsArray.some(
    (c) => c !== data.hqCountryCode
  );
  const dateStr = new Date().toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const buyerModelsText =
    data.beachhead.buyerTypes && data.beachhead.buyerTypes.length > 0
      ? data.beachhead.buyerTypes
          .map((t) =>
            t === 'OTHER' && data.beachhead.otherBuyerModelText?.trim()
              ? `✨ Other: ${data.beachhead.otherBuyerModelText.trim()}`
              : BUYER_MODEL_LABELS[t] || t
          )
          .join(' + ')
      : data.beachhead.buyerType === 'OTHER' &&
          data.beachhead.otherBuyerModelText?.trim()
        ? `✨ Other: ${data.beachhead.otherBuyerModelText.trim()}`
        : BUYER_MODEL_LABELS[data.beachhead.buyerType] ||
          data.beachhead.buyerType;

  const decisionMakerSetup =
    data.beachhead.endUserVsDecisionMaker === 'OTHER' &&
    data.beachhead.otherDecisionMakerSetupText?.trim()
      ? `Custom: ${data.beachhead.otherDecisionMakerSetupText.trim()}`
      : data.beachhead.endUserVsDecisionMaker
        ? END_USER_DECISION_MAKER_LABELS[
            data.beachhead.endUserVsDecisionMaker
          ] || data.beachhead.endUserVsDecisionMaker
        : 'Not specified';

  const triggerPreset = data.beachhead.buyingTriggerPreset
    ? BUYING_TRIGGER_PRESET_LABELS[data.beachhead.buyingTriggerPreset] ||
      data.beachhead.buyingTriggerPreset
    : 'Not specified';

  const workaroundsList =
    data.competitorsAndStatusQuo.currentWorkarounds &&
    data.competitorsAndStatusQuo.currentWorkarounds.length > 0
      ? data.competitorsAndStatusQuo.currentWorkarounds
          .map((w) =>
            w === 'OTHER' &&
            data.competitorsAndStatusQuo.otherWorkaroundText?.trim()
              ? `✨ Custom: ${data.competitorsAndStatusQuo.otherWorkaroundText.trim()}`
              : CUSTOMER_WORKAROUND_LABELS[w] || w
          )
          .join(', ')
      : 'None selected';

  const whySwitchEdgesList =
    data.competitorsAndStatusQuo.whySwitchEdges &&
    data.competitorsAndStatusQuo.whySwitchEdges.length > 0
      ? data.competitorsAndStatusQuo.whySwitchEdges
          .map((e) =>
            e === 'OTHER' &&
            data.competitorsAndStatusQuo.otherWhySwitchEdgeText?.trim()
              ? `✨ Custom: ${data.competitorsAndStatusQuo.otherWhySwitchEdgeText.trim()}`
              : WHY_SWITCH_EDGE_LABELS[e] || e
          )
          .join(', ')
      : 'None selected';

  const frictionReducersList =
    data.competitiveWedge.switchingFrictionReducers &&
    data.competitiveWedge.switchingFrictionReducers.length > 0
      ? data.competitiveWedge.switchingFrictionReducers
          .map((f) =>
            f === 'OTHER' &&
            data.competitiveWedge.otherSwitchingFrictionText?.trim()
              ? `✨ Custom: ${data.competitiveWedge.otherSwitchingFrictionText.trim()}`
              : SWITCHING_FRICTION_LABELS[f] || f
          )
          .join(', ')
      : 'None selected';

  const unfairAdvantagesList =
    data.competitiveWedge.unfairAdvantages &&
    data.competitiveWedge.unfairAdvantages.length > 0
      ? data.competitiveWedge.unfairAdvantages
          .map((u) =>
            u === 'OTHER' &&
            data.competitiveWedge.otherUnfairAdvantageText?.trim()
              ? `✨ Custom: ${data.competitiveWedge.otherUnfairAdvantageText.trim()}`
              : UNFAIR_ADVANTAGE_LABELS[u] || u
          )
          .join(', ')
      : 'None selected';

  const segmentsList = (data.marketSizing.segments || []).map((seg, idx) => {
    const name = seg.segmentName?.trim() || `Customer Group #${idx + 1}`;
    const cadence =
      seg.billingCadence === 'OTHER' && seg.otherBillingCadenceText?.trim()
        ? `Custom (${seg.otherBillingCadenceText.trim()})`
        : BILLING_CADENCE_LABELS[seg.billingCadence] || seg.billingCadence;
    const isMonthly = seg.billingCadence === 'MONTHLY_SUBSCRIPTION';
    const rawPrice =
      parseFloat(seg.pricePerCustomerInput.replace(/[^0-9.]/g, '')) || 0;
    const annualRev = isMonthly ? rawPrice * 12 : rawPrice;
    const y1y2Count =
      parseInt(seg.year1To2CustomerGoalInput.replace(/[^0-9]/g, ''), 10) || 0;
    const reachableCount =
      parseInt(
        seg.reachableCustomersInTargetMarketsInput.replace(/[^0-9]/g, ''),
        10
      ) || 0;
    return `   - **Group ${idx + 1}: ${name}**\n     • Billing Cadence: ${cadence}\n     • Typical Price: ${formatPlanCurrency(rawPrice, currency)}${isMonthly ? '/mo' : '/yr'} (${formatPlanCurrency(annualRev, currency)}/year per customer)\n     • Year 1–2 Customer Goal: ${y1y2Count.toLocaleString()} paying customers (${formatPlanCurrency(annualRev * y1y2Count, currency)}/yr)\n     • Reachable Customers in Target Markets: ${reachableCount.toLocaleString()} customers (${formatPlanCurrency(annualRev * reachableCount, currency)}/yr)`;
  });

  const lines: string[] = [
    `# ${data.planTitle} — Market & Customer Validation Brief (Module B)`,
    `Prepared for: ${data.founderName} | Date: ${dateStr}`,
    `HQ Country: ${countryPack.countryName} (${currency}) | Industry: ${data.industryCategory}`,
    `Target Markets: ${marketsDisplay} (${isExporting ? '🌍 International Exporter Profile' : '🏠 Domestic Focus'})`,
    '',
    '---',
    '',
    '## 1. Target Customers & Buying Triggers (Step 1)',
    `- **Customer Model:** ${buyerModelsText}`,
    `- **First Priority Customer Group (Beachhead):** ${data.beachhead.beachheadSegment || 'Not yet specified.'}`,
    `- **User vs. Paying Buyer Relationship:** ${decisionMakerSetup}`,
    `- **Decision-Maker / Budget Sign-Off:** ${data.beachhead.decisionMakerRole || 'Not yet specified.'}`,
    `- **"Why Now?" Buying Trigger Moment:** ${triggerPreset}`,
    `- **Urgent Buying Trigger Notes:** ${data.beachhead.buyingTriggerNotes || 'Not yet specified.'}`,
    `- **Target Selling Geographies:** ${marketsDisplay} (${isExporting ? 'Qualifies for Export & Internationalisation Grants' : 'Domestic Market Focus'})`,
    '',
    '---',
    '',
    '## 2. Current Customer Habits & Competitors (Step 2)',
    `- **Current Everyday Habits & Workarounds:** ${workaroundsList}`,
    `- **Why Current Habits Frustrate Buyers:** ${data.competitorsAndStatusQuo.workaroundFrustrationNotes || 'Not yet specified.'}`,
    `- **Key Switching Advantages:** ${whySwitchEdgesList}`,
    `- **Why Customers Switch to Us (1-Sentence Summary):** ${data.competitorsAndStatusQuo.whySwitchOneSentence || 'Not yet specified.'}`,
    '',
    '### Mapped Competitors & Alternatives',
    ...(data.competitorsAndStatusQuo.competitors.length > 0
      ? data.competitorsAndStatusQuo.competitors.map(
          (c, i) =>
            `${i + 1}. **${c.name || 'Competitor'}** [${COMPETITOR_CATEGORY_LABELS[c.category] || c.category || 'Direct Competitor'}] (${c.typicalPriceText || 'Price N/A'})\n   - *What they do well:* ${c.whatTheyDoWell || '—'}\n   - *Where they fall short:* ${c.whereTheyFallShort || '—'}`
        )
      : ['- No competitors listed yet.']),
    '',
    '---',
    '',
    `## 3. Plain-English Bottom-Up Market Sizing (${currency} — Step 3)`,
    `- **1. Year 1–2 Revenue Goal (SOM):** ${formatPlanCurrency(data.totalYear1To2RevenueSom, currency)}/year${data.totalYear1To2Customers ? ` (Target: ${data.totalYear1To2Customers.toLocaleString()} paying customers)` : ''}`,
    `- **2. Reachable Market in Selected Countries (SAM):** ${formatPlanCurrency(data.totalReachableMarketSam, currency)}/year${data.totalReachableCustomers ? ` (${data.totalReachableCustomers.toLocaleString()} reachable customers in ${marketsDisplay})` : ''}`,
    `- **3. Wider Long-Term Market Opportunity (TAM):** ${formatPlanCurrency(data.totalWiderMarketTam, currency)}/year [${WIDER_MARKET_SCALE_LABELS[data.marketSizing.widerMarketMultiplier] || data.marketSizing.widerMarketMultiplier || '5x'}${data.marketSizing.widerMarketMultiplier === 'OTHER' && data.marketSizing.otherWiderMarketScaleText?.trim() ? ` — ${data.marketSizing.otherWiderMarketScaleText.trim()}` : ''}]`,
    '',
    '### Customer Group Breakdown:',
    ...(segmentsList.length > 0
      ? segmentsList
      : ['   - No customer groups entered yet.']),
    ...(data.grantReadySummaryParagraph
      ? ['', `> **Grant & Investor Market Summary:** ${data.grantReadySummaryParagraph}`]
      : []),
    ...(data.marketSizing.sourceAndAssumptionNotes
      ? [
          '',
          `- **Assumptions & Sources:** ${data.marketSizing.sourceAndAssumptionNotes}`,
        ]
      : []),
    '',
    '---',
    '',
    '## 4. Competitive Edge & Defensibility (Step 4)',
    `- **Easy First Step (Lowering Switching Friction):** ${data.competitiveWedge.switchingFrictionPlanNotes || 'Not yet specified.'}`,
    `- **Friction Reducers:** ${frictionReducersList}`,
    `- **Defensibility Moats & Unfair Advantages:** ${unfairAdvantagesList}`,
    `- **2-Sentence Competitive Edge Summary:** ${data.competitiveWedge.competitiveEdgeSummary || 'Not yet specified.'}`,
    '',
    '---',
    '',
    '## 5. Constructive "Things to Consider" (Blind-Spot Review — Step 5)',
    ...data.thingsToConsider.map(
      (item) =>
        `### ${item.title}\n- **Why it matters:** ${item.explanation}\n- **Action Step:** ${item.suggestedAction}`
    ),
    '',
  ];

  if (!data.whiteLabelEnabled) {
    lines.push(
      '---',
      '*Generated with Startup Preflight — Supportive Co-Founder & Blind-Spot Engine*'
    );
  }

  return lines.join('\n');
}

/**
 * Generates a standalone, magazine-quality HTML document for Module B that
 * contains 100% of the answers gathered across Steps 1–5.
 */
export function buildModuleBStandaloneHtmlDocument(
  data: ModuleBBriefData
): string {
  const countryPack = getCountryRulePack(data.hqCountryCode);
  const currency = countryPack.defaultCurrency;
  const marketsDisplay = formatTargetMarketsDisplay(
    data.targetMarketsArray,
    data.beachhead.otherGeographyText
  );
  const isExporting = data.targetMarketsArray.some(
    (c) => c !== data.hqCountryCode
  );
  const dateStr = new Date().toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const brandHeader = data.whiteLabelEnabled
    ? 'CONFIDENTIAL MARKET & CUSTOMER VALIDATION BRIEF'
    : 'STARTUP PREFLIGHT • MODULE B MARKET & CUSTOMER BRIEF';

  const buyerModelsText =
    data.beachhead.buyerTypes && data.beachhead.buyerTypes.length > 0
      ? data.beachhead.buyerTypes
          .map((t) =>
            t === 'OTHER' && data.beachhead.otherBuyerModelText?.trim()
              ? `✨ Other: ${data.beachhead.otherBuyerModelText.trim()}`
              : BUYER_MODEL_LABELS[t] || t
          )
          .join(' + ')
      : data.beachhead.buyerType === 'OTHER' &&
          data.beachhead.otherBuyerModelText?.trim()
        ? `✨ Other: ${data.beachhead.otherBuyerModelText.trim()}`
        : BUYER_MODEL_LABELS[data.beachhead.buyerType] ||
          data.beachhead.buyerType;

  const decisionMakerSetupBadge =
    data.beachhead.endUserVsDecisionMaker === 'OTHER' &&
    data.beachhead.otherDecisionMakerSetupText?.trim()
      ? `Custom: ${data.beachhead.otherDecisionMakerSetupText.trim()}`
      : data.beachhead.endUserVsDecisionMaker
        ? END_USER_DECISION_MAKER_LABELS[
            data.beachhead.endUserVsDecisionMaker
          ] || data.beachhead.endUserVsDecisionMaker
        : 'User vs. Buyer relationship not specified';

  const triggerPresetLabel = data.beachhead.buyingTriggerPreset
    ? BUYING_TRIGGER_PRESET_LABELS[data.beachhead.buyingTriggerPreset] ||
      data.beachhead.buyingTriggerPreset
    : null;

  // Workarounds Pills
  const workaroundsPillsHtml =
    data.competitorsAndStatusQuo.currentWorkarounds &&
    data.competitorsAndStatusQuo.currentWorkarounds.length > 0
      ? `<div class="pill-list" style="margin-top: 6px;">
          ${data.competitorsAndStatusQuo.currentWorkarounds
            .map((w) => {
              const label =
                w === 'OTHER' &&
                data.competitorsAndStatusQuo.otherWorkaroundText?.trim()
                  ? `✨ ${data.competitorsAndStatusQuo.otherWorkaroundText.trim()}`
                  : CUSTOMER_WORKAROUND_LABELS[w] || w;
              return `<span class="pill">${escapeHtml(label)}</span>`;
            })
            .join('')}
        </div>`
      : '';

  // Why Switch Edges Pills
  const whySwitchEdgesPillsHtml =
    data.competitorsAndStatusQuo.whySwitchEdges &&
    data.competitorsAndStatusQuo.whySwitchEdges.length > 0
      ? `<div class="pill-list" style="margin-top: 6px;">
          ${data.competitorsAndStatusQuo.whySwitchEdges
            .map((e) => {
              const label =
                e === 'OTHER' &&
                data.competitorsAndStatusQuo.otherWhySwitchEdgeText?.trim()
                  ? `✨ ${data.competitorsAndStatusQuo.otherWhySwitchEdgeText.trim()}`
                  : WHY_SWITCH_EDGE_LABELS[e] || e;
              return `<span class="pill-emerald">${escapeHtml(label)}</span>`;
            })
            .join('')}
        </div>`
      : '';

  // Competitors Table Rows (with Category column)
  const compRowsHtml =
    data.competitorsAndStatusQuo.competitors.length > 0
      ? data.competitorsAndStatusQuo.competitors
          .map(
            (c) => `
          <tr>
            <td><strong>${escapeHtml(c.name || 'Alternative')}</strong></td>
            <td><span style="display: inline-block; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #334155;">${escapeHtml(COMPETITOR_CATEGORY_LABELS[c.category] || c.category || 'Competitor')}</span></td>
            <td>${escapeHtml(c.typicalPriceText || '—')}</td>
            <td>${escapeHtml(c.whatTheyDoWell || '—')}</td>
            <td>${escapeHtml(c.whereTheyFallShort || '—')}</td>
          </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="color: #64748b;">No specific competitors or alternatives added yet.</td></tr>`;

  // Market Sizing Customer Groups Breakdown Table
  const segments = data.marketSizing.segments || [];
  const segmentsRowsHtml =
    segments.length > 0
      ? segments
          .map((seg, idx) => {
            const name =
              seg.segmentName?.trim() || `Customer Group #${idx + 1}`;
            const cadence =
              seg.billingCadence === 'OTHER' &&
              seg.otherBillingCadenceText?.trim()
                ? `Custom (${seg.otherBillingCadenceText.trim()})`
                : BILLING_CADENCE_LABELS[seg.billingCadence] ||
                  seg.billingCadence;
            const isMonthly = seg.billingCadence === 'MONTHLY_SUBSCRIPTION';
            const rawPrice =
              parseFloat(seg.pricePerCustomerInput.replace(/[^0-9.]/g, '')) ||
              0;
            const annualRevPerCust = isMonthly ? rawPrice * 12 : rawPrice;
            const y1y2Count =
              parseInt(
                seg.year1To2CustomerGoalInput.replace(/[^0-9]/g, ''),
                10
              ) || 0;
            const reachableCount =
              parseInt(
                seg.reachableCustomersInTargetMarketsInput.replace(
                  /[^0-9]/g,
                  ''
                ),
                10
              ) || 0;
            const y1y2Rev = annualRevPerCust * y1y2Count;
            const reachRev = annualRevPerCust * reachableCount;

            return `
            <tr>
              <td>
                <strong>${escapeHtml(name)}</strong>
                <div style="font-size: 11px; color: #64748b;">${escapeHtml(cadence)}</div>
              </td>
              <td>${rawPrice > 0 ? `${escapeHtml(formatPlanCurrency(rawPrice, currency))}${isMonthly ? '/mo' : '/yr'}<div style="font-size: 11px; color: #4f46e5; font-weight: 600;">(${escapeHtml(formatPlanCurrency(annualRevPerCust, currency))}/yr)</div>` : '—'}</td>
              <td>${y1y2Count > 0 ? `<strong>${y1y2Count.toLocaleString()}</strong> cust.<div style="font-size: 11px; color: #059669; font-weight: 600;">${escapeHtml(formatPlanCurrency(y1y2Rev, currency))}/yr</div>` : '—'}</td>
              <td>${reachableCount > 0 ? `<strong>${reachableCount.toLocaleString()}</strong> cust.<div style="font-size: 11px; color: #4f46e5; font-weight: 600;">${escapeHtml(formatPlanCurrency(reachRev, currency))}/yr</div>` : '—'}</td>
            </tr>`;
          })
          .join('')
      : `<tr><td colspan="4" style="color: #64748b;">No customer groups entered yet.</td></tr>`;

  // Comparison Matrix Rows
  const matrixRowsHtml = data.competitiveWedge.comparisonRows
    .map(
      (r) => `
      <tr class="${r.isYourStartup ? 'row-highlight' : ''}">
        <td>${escapeHtml(r.label)}</td>
        <td style="text-align: center;">${renderScoreBadge(r.priceValueScore)}</td>
        <td style="text-align: center;">${renderScoreBadge(r.speedTimeSavedScore)}</td>
        <td style="text-align: center;">${renderScoreBadge(r.easeOfUseScore)}</td>
        <td style="text-align: center;">${renderScoreBadge(r.specialistQualityScore)}</td>
      </tr>`
    )
    .join('');

  // Switching Friction Reducers Pills
  const switchingFrictionPillsHtml =
    data.competitiveWedge.switchingFrictionReducers.length > 0
      ? `<div class="pill-list" style="margin-top: 8px;">
          ${data.competitiveWedge.switchingFrictionReducers
            .map((id) => {
              const label =
                id === 'OTHER' &&
                data.competitiveWedge.otherSwitchingFrictionText?.trim()
                  ? `✨ ${data.competitiveWedge.otherSwitchingFrictionText.trim()}`
                  : SWITCHING_FRICTION_LABELS[id] || id;
              return `<span class="pill-indigo">${escapeHtml(label)}</span>`;
            })
            .join('')}
        </div>`
      : '';

  // Unfair Advantages Pills
  const unfairAdvantagePillsHtml =
    data.competitiveWedge.unfairAdvantages.length > 0
      ? `<div class="pill-list" style="margin-top: 8px;">
          ${data.competitiveWedge.unfairAdvantages
            .map((id) => {
              const label =
                id === 'OTHER' &&
                data.competitiveWedge.otherUnfairAdvantageText?.trim()
                  ? `✨ ${data.competitiveWedge.otherUnfairAdvantageText.trim()}`
                  : UNFAIR_ADVANTAGE_LABELS[id] || id;
              return `<span class="pill-emerald">${escapeHtml(label)}</span>`;
            })
            .join('')}
        </div>`
      : '';

  const multiplierLabel =
    WIDER_MARKET_SCALE_LABELS[data.marketSizing.widerMarketMultiplier] ||
    data.marketSizing.widerMarketMultiplier ||
    '5x Expansion';
  const multiplierCustomNote =
    data.marketSizing.widerMarketMultiplier === 'OTHER' &&
    data.marketSizing.otherWiderMarketScaleText?.trim()
      ? ` — ${data.marketSizing.otherWiderMarketScaleText.trim()}`
      : '';

  const sectionsHtml = `
    <!-- 1. TARGET CUSTOMERS & BUYING TRIGGERS -->
    <div class="section">
      <div class="section-title">1. Target Customers &amp; Buying Triggers (Step 1)</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">1. First Priority Customer Group (Beachhead)</div>
          <div class="card-value" style="font-weight: 600; line-height: 1.5;">${escapeHtml(data.beachhead.beachheadSegment || 'Not yet specified.')}</div>
        </div>
        <div class="card">
          <div class="card-label">2. Customer Model &amp; Selling Geographies</div>
          <div class="card-value">
            <div style="font-weight: 600;">${escapeHtml(buyerModelsText)}</div>
            <div style="margin-top: 5px; color: #475569; font-size: 12px;">Selling in: <strong>${escapeHtml(marketsDisplay)}</strong></div>
            <div style="margin-top: 4px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: ${isExporting ? '#ecfdf5' : '#f1f5f9'}; color: ${isExporting ? '#047857' : '#475569'}; border: 1px solid ${isExporting ? '#a7f3d0' : '#e2e8f0'};">
                ${isExporting ? '🌍 International Exporter Profile' : '🏠 Domestic Market Focus'}
              </span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-label">3. User vs. Paying Buyer &amp; Sign-Off</div>
          <div class="card-value">
            <div style="margin-bottom: 5px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe;">
                ${escapeHtml(decisionMakerSetupBadge)}
              </span>
            </div>
            <div style="font-size: 12.5px; color: #1e293b;">
              <strong>Budget Authority / Decision-Maker:</strong> ${escapeHtml(data.beachhead.decisionMakerRole || 'Not yet specified.')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-label">4. "Why Now?" Urgent Buying Trigger Moment</div>
          <div class="card-value">
            ${
              triggerPresetLabel
                ? `<div style="margin-bottom: 5px;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3;">
                      ${escapeHtml(triggerPresetLabel)}
                    </span>
                  </div>`
                : ''
            }
            <div style="font-size: 12.5px; line-height: 1.5; color: #1e293b;">
              ${escapeHtml(data.beachhead.buyingTriggerNotes || 'Not yet specified.')}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. COMPETITORS & CURRENT CUSTOMER HABITS -->
    <div class="section">
      <div class="section-title">2. Competitors &amp; How Customers Deal With This Today (Step 2)</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">Frustration With Current Habits</div>
          <div class="card-value">${escapeHtml(data.competitorsAndStatusQuo.workaroundFrustrationNotes || 'Not yet specified.')}</div>
          ${
            workaroundsPillsHtml
              ? `<div style="margin-top: 8px; border-top: 1px dashed #e2e8f0; pt-2;">
                  <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 6px;">Current Everyday Habits:</div>
                  ${workaroundsPillsHtml}
                </div>`
              : ''
          }
        </div>
        <div class="card">
          <div class="card-label">Why Customers Switch to Us</div>
          <div class="card-value">${escapeHtml(data.competitorsAndStatusQuo.whySwitchOneSentence || 'Not yet specified.')}</div>
          ${
            whySwitchEdgesPillsHtml
              ? `<div style="margin-top: 8px; border-top: 1px dashed #e2e8f0; pt-2;">
                  <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 6px;">Key Switching Advantages:</div>
                  ${whySwitchEdgesPillsHtml}
                </div>`
              : ''
          }
        </div>
      </div>

      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; margin-bottom: 4px;">
          Mapped Competitors &amp; Alternatives in ${escapeHtml(marketsDisplay)}
        </div>
        <table class="doc-table">
          <thead>
            <tr>
              <th>Competitor / Alternative</th>
              <th>Category</th>
              <th>Typical Price</th>
              <th>What They Do Well</th>
              <th>Where They Fall Short</th>
            </tr>
          </thead>
          <tbody>${compRowsHtml}</tbody>
        </table>
      </div>
    </div>

    <!-- 3. PLAIN-ENGLISH MARKET SIZING -->
    <div class="section">
      <div class="section-title">3. Bottom-Up Market Sizing (${escapeHtml(currency)} — Step 3)</div>
      <div class="grid-3">
        <div class="card card-highlight">
          <div class="card-label">1. Year 1–2 Revenue Goal (SOM)</div>
          <div class="card-stat">${escapeHtml(formatPlanCurrency(data.totalYear1To2RevenueSom, currency))}<span style="font-size: 12px; font-weight: 600; color: #475569;"> / yr</span></div>
          <div class="card-value" style="font-size: 12px; color: #475569;">
            ${
              data.totalYear1To2Customers
                ? `Target: <strong>${data.totalYear1To2Customers.toLocaleString()}</strong> paying customers`
                : 'Near-term realistic target'
            }
          </div>
        </div>
        <div class="card">
          <div class="card-label">2. Reachable Market (SAM)</div>
          <div class="card-stat">${escapeHtml(formatPlanCurrency(data.totalReachableMarketSam, currency))}<span style="font-size: 12px; font-weight: 600; color: #475569;"> / yr</span></div>
          <div class="card-value" style="font-size: 12px; color: #475569;">
            ${
              data.totalReachableCustomers
                ? `<strong>${data.totalReachableCustomers.toLocaleString()}</strong> reachable in ${escapeHtml(marketsDisplay)}`
                : `In ${escapeHtml(marketsDisplay)}`
            }
          </div>
        </div>
        <div class="card">
          <div class="card-label">3. Wider Long-Term Market (TAM)</div>
          <div class="card-stat">${escapeHtml(formatPlanCurrency(data.totalWiderMarketTam, currency))}<span style="font-size: 12px; font-weight: 600; color: #475569;"> / yr</span></div>
          <div class="card-value" style="font-size: 12px; color: #475569;">
            ${escapeHtml(multiplierLabel)}${escapeHtml(multiplierCustomNote)}
          </div>
        </div>
      </div>

      <!-- Customer Group Breakdown Table -->
      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; margin-bottom: 4px;">
          Customer Groups &amp; Bottom-Up Pricing Calculator (${escapeHtml(currency)})
        </div>
        <table class="doc-table">
          <thead>
            <tr>
              <th>Customer Group</th>
              <th>Price per Customer</th>
              <th>Year 1–2 Goal (SOM)</th>
              <th>Reachable Market (SAM)</th>
            </tr>
          </thead>
          <tbody>
            ${segmentsRowsHtml}
            ${
              segments.length > 1
                ? `<tr class="row-highlight">
                    <td><strong>Combined Across ${segments.length} Customer Groups</strong></td>
                    <td>—</td>
                    <td><strong>${(data.totalYear1To2Customers || 0).toLocaleString()} cust.</strong><div style="font-size: 11px; color: #059669; font-weight: 700;">${escapeHtml(formatPlanCurrency(data.totalYear1To2RevenueSom, currency))}/yr</div></td>
                    <td><strong>${(data.totalReachableCustomers || 0).toLocaleString()} cust.</strong><div style="font-size: 11px; color: #4f46e5; font-weight: 700;">${escapeHtml(formatPlanCurrency(data.totalReachableMarketSam, currency))}/yr</div></td>
                  </tr>`
                : ''
            }
          </tbody>
        </table>
      </div>

      ${
        data.grantReadySummaryParagraph
          ? `<div class="quote-box" style="margin-top: 12px;">
              <div class="card-label">Grant &amp; Investor Market Sizing Summary</div>
              <div style="font-size: 13px; line-height: 1.5; color: #1e293b;">${escapeHtml(data.grantReadySummaryParagraph)}</div>
            </div>`
          : ''
      }
      ${
        data.marketSizing.sourceAndAssumptionNotes?.trim()
          ? `<div class="card" style="margin-top: 12px;">
              <div class="card-label">Market Sizing Sources, Assumptions &amp; Scale Horizon</div>
              <div class="card-value" style="font-size: 12.5px; line-height: 1.5;">${escapeHtml(data.marketSizing.sourceAndAssumptionNotes.trim())}</div>
              ${
                data.marketSizing.widerMarketMultiplier === 'OTHER' &&
                data.marketSizing.otherWiderMarketScaleText?.trim()
                  ? `<div style="margin-top: 6px; font-size: 12px; color: #4338ca;"><strong>Expansion Scale Note:</strong> ${escapeHtml(data.marketSizing.otherWiderMarketScaleText.trim())}</div>`
                  : ''
              }
            </div>`
          : ''
      }
    </div>

    <!-- 4. COMPETITIVE EDGE & DEFENSIBILITY -->
    <div class="section">
      <div class="section-title">4. Competitive Edge &amp; How You Stand Out (Step 4)</div>
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; margin-bottom: 4px;">
        Side-by-Side Comparison Matrix
      </div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Option / Competitor</th>
            <th style="text-align: center;">Value for Money</th>
            <th style="text-align: center;">Speed / Delivery (SLA)</th>
            <th style="text-align: center;">Ease of Use</th>
            <th style="text-align: center;">Specialist Trust &amp; Quality</th>
          </tr>
        </thead>
        <tbody>${matrixRowsHtml}</tbody>
      </table>

      <div class="grid-2" style="margin-top: 12px;">
        <div class="card">
          <div class="card-label">Making It Easy to Switch (First Step)</div>
          <div class="card-value" style="font-weight: 600; line-height: 1.5;">${escapeHtml(data.competitiveWedge.switchingFrictionPlanNotes || 'Not yet specified.')}</div>
          ${switchingFrictionPillsHtml}
        </div>
        <div class="card">
          <div class="card-label">2-Sentence Competitive Edge &amp; Defensibility</div>
          <div class="card-value" style="font-weight: 600; line-height: 1.5;">${escapeHtml(data.competitiveWedge.competitiveEdgeSummary || 'Not yet specified.')}</div>
          ${unfairAdvantagePillsHtml}
        </div>
      </div>
    </div>

    <!-- 5. CONSTRUCTIVE THINGS TO CONSIDER -->
    <div class="section">
      <div class="section-title">5. Co-Founder Blind-Spot Review ("Things to Consider" — Step 5)</div>
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

  const footerCtaHtml = `<strong>Ready for Module C (Customer Surveys, Feedback &amp; Early Waitlist)?</strong>
      Your Module B Market &amp; Customer Brief is complete. Continue to Module C inside Startup Preflight to launch your unbiased Customer Validation Survey (<code>/v/my-startup</code>), collect real buyer feedback, and build your early waitlist in ${escapeHtml(marketsDisplay)}.`;

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${data.planTitle} — Market & Customer Validation Brief`,
    eyebrow: brandHeader,
    planTitle: data.planTitle,
    founderName: data.founderName,
    countryName: countryPack.countryName,
    currency,
    industryCategory: data.industryCategory,
    dateStr,
    scopeLabel: 'Markets',
    scopeValue: marketsDisplay,
    sectionsHtml,
    footerCtaHtml,
  });
}

