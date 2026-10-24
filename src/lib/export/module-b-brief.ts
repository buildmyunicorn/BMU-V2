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
  SwitchingFrictionReducerType,
  UnfairAdvantageMoatType,
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
  whiteLabelEnabled?: boolean;
}

export const BUYER_MODEL_LABELS: Record<BuyerModelType, string> = {
  B2B_BUSINESSES: '🏢 B2B (Selling to Businesses)',
  B2C_CONSUMERS: '🛍️ B2C (Selling to Consumers)',
  TWO_SIDED_MARKETPLACE: '🔄 Two-Sided Marketplace (Connecting Buyers & Sellers)',
  B2G_PUBLIC_SECTOR: '🏛️ Public Sector / Schools / Healthcare',
  OTHER: '✨ Other (Custom Buyer Model)',
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

export function buildModuleBMarkdownBrief(data: ModuleBBriefData): string {
  const countryPack = getCountryRulePack(data.hqCountryCode);
  const currency = countryPack.defaultCurrency;
  const markets =
    data.targetMarketsArray.length > 0
      ? data.targetMarketsArray.join(', ')
      : countryPack.countryName;
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

  const lines: string[] = [
    `# ${data.planTitle} — Market & Customer Validation Brief (Module B)`,
    `Prepared for: ${data.founderName} | Date: ${dateStr}`,
    `HQ Country: ${countryPack.countryName} (${currency}) | Industry: ${data.industryCategory}`,
    `Target Markets: ${markets}`,
    '',
    '---',
    '',
    '## 1. Target Customers & Buying Triggers (Step 1)',
    `- **Customer Model:** ${buyerModelsText}`,
    `- **First Priority Customer Group:** ${data.beachhead.beachheadSegment || 'Not yet specified.'}`,
    `- **Decision-Maker / Budget Sign-Off:** ${data.beachhead.decisionMakerRole || 'Not yet specified.'}`,
    `- **Urgent Buying Trigger:** ${data.beachhead.buyingTriggerNotes || 'Not yet specified.'}`,
    `- **Target Selling Geographies:** ${markets}`,
    '',
    '---',
    '',
    '## 2. Current Customer Habits & Competitors (Step 2)',
    `- **Why Current Habits Frustrate Buyers:** ${data.competitorsAndStatusQuo.workaroundFrustrationNotes || 'Not yet specified.'}`,
    `- **Why Customers Switch to Us:** ${data.competitorsAndStatusQuo.whySwitchOneSentence || 'Not yet specified.'}`,
    '',
    '### Mapped Competitors & Alternatives',
    ...(data.competitorsAndStatusQuo.competitors.length > 0
      ? data.competitorsAndStatusQuo.competitors.map(
          (c, i) =>
            `${i + 1}. **${c.name || 'Competitor'}** (${c.typicalPriceText || 'Price N/A'})\n   - *What they do well:* ${c.whatTheyDoWell || '—'}\n   - *Where they fall short:* ${c.whereTheyFallShort || '—'}`
        )
      : ['- No competitors listed yet.']),
    '',
    '---',
    '',
    `## 3. Plain-English Market Sizing (${currency} — Step 3)`,
    `- **1. Year 1–2 Revenue Goal (SOM):** ${formatPlanCurrency(data.totalYear1To2RevenueSom, currency)}/year`,
    `- **2. Reachable Market in Selected Countries (SAM):** ${formatPlanCurrency(data.totalReachableMarketSam, currency)}/year`,
    `- **3. Wider Long-Term Market Opportunity (TAM):** ${formatPlanCurrency(data.totalWiderMarketTam, currency)}/year`,
    ...(data.grantReadySummaryParagraph
      ? ['', `> ${data.grantReadySummaryParagraph}`]
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
    '## 4. Competitive Edge & How You Stand Out (Step 4)',
    `- **Easy First Step (Lowering Switching Friction):** ${data.competitiveWedge.switchingFrictionPlanNotes || 'Not yet specified.'}`,
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
      '*Generated with Build My Unicorn (BMU) 2.0 — Supportive Co-Founder & Blind-Spot Engine*'
    );
  }

  return lines.join('\n');
}

/**
 * Generates a standalone, magazine-quality HTML document for Module B that
 * matches Module A (Module 1)'s exact layout, typography, cards, and print styling.
 */
export function buildModuleBStandaloneHtmlDocument(
  data: ModuleBBriefData
): string {
  const countryPack = getCountryRulePack(data.hqCountryCode);
  const currency = countryPack.defaultCurrency;
  const markets =
    data.targetMarketsArray.length > 0
      ? data.targetMarketsArray.join(', ')
      : countryPack.countryName;
  const dateStr = new Date().toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const brandHeader = data.whiteLabelEnabled
    ? 'CONFIDENTIAL MARKET & CUSTOMER VALIDATION BRIEF'
    : 'BUILD MY UNICORN 2.0 • MODULE B MARKET & CUSTOMER BRIEF';

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

  const compRowsHtml =
    data.competitorsAndStatusQuo.competitors.length > 0
      ? data.competitorsAndStatusQuo.competitors
          .map(
            (c) => `
          <tr>
            <td><strong>${escapeHtml(c.name || 'Alternative')}</strong></td>
            <td>${escapeHtml(c.typicalPriceText || '—')}</td>
            <td>${escapeHtml(c.whatTheyDoWell || '—')}</td>
            <td>${escapeHtml(c.whereTheyFallShort || '—')}</td>
          </tr>`
          )
          .join('')
      : `<tr><td colspan="4" style="color: #64748b;">No specific competitors or alternatives added yet.</td></tr>`;

  const matrixRowsHtml = data.competitiveWedge.comparisonRows
    .map(
      (r) => `
      <tr class="${r.isYourStartup ? 'row-highlight' : ''}">
        <td>${escapeHtml(r.label)}</td>
        <td>${escapeHtml(r.priceValueScore)}</td>
        <td>${escapeHtml(r.speedTimeSavedScore)}</td>
        <td>${escapeHtml(r.easeOfUseScore)}</td>
        <td>${escapeHtml(r.specialistQualityScore)}</td>
      </tr>`
    )
    .join('');

  const sectionsHtml = `
    <!-- 1. TARGET CUSTOMERS & BUYING TRIGGERS -->
    <div class="section">
      <div class="section-title">1. Target Customers &amp; Buying Triggers (Step 1)</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">1. First Priority Customer Group</div>
          <div class="card-value">${escapeHtml(data.beachhead.beachheadSegment || 'Not yet specified.')}</div>
        </div>
        <div class="card">
          <div class="card-label">2. Customer Model &amp; Geographies</div>
          <div class="card-value">
            <div><strong>${escapeHtml(buyerModelsText)}</strong></div>
            <div style="margin-top: 4px; color: #475569;">Selling in: ${escapeHtml(markets)}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-label">3. Decision-Maker / Budget Sign-Off</div>
          <div class="card-value">${escapeHtml(data.beachhead.decisionMakerRole || 'Not yet specified.')}</div>
        </div>
        <div class="card">
          <div class="card-label">4. Urgent Buying Trigger</div>
          <div class="card-value">${escapeHtml(data.beachhead.buyingTriggerNotes || 'Not yet specified.')}</div>
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
        </div>
        <div class="card">
          <div class="card-label">Why Customers Switch to Us</div>
          <div class="card-value">${escapeHtml(data.competitorsAndStatusQuo.whySwitchOneSentence || 'Not yet specified.')}</div>
        </div>
      </div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Competitor / Alternative</th>
            <th>Typical Price</th>
            <th>What They Do Well</th>
            <th>Where They Fall Short</th>
          </tr>
        </thead>
        <tbody>${compRowsHtml}</tbody>
      </table>
    </div>

    <!-- 3. PLAIN-ENGLISH MARKET SIZING -->
    <div class="section">
      <div class="section-title">3. Bottom-Up Market Sizing (${escapeHtml(currency)} — Step 3)</div>
      <div class="grid-3">
        <div class="card card-highlight">
          <div class="card-label">1. Year 1–2 Revenue Goal (SOM)</div>
          <div class="card-stat">${escapeHtml(formatPlanCurrency(data.totalYear1To2RevenueSom, currency))}<span style="font-size: 12px; font-weight: 600; color: #475569;"> / yr</span></div>
          <div class="card-value" style="font-size: 12px; color: #475569;">Near-term realistic target</div>
        </div>
        <div class="card">
          <div class="card-label">2. Reachable Market (SAM)</div>
          <div class="card-stat">${escapeHtml(formatPlanCurrency(data.totalReachableMarketSam, currency))}<span style="font-size: 12px; font-weight: 600; color: #475569;"> / yr</span></div>
          <div class="card-value" style="font-size: 12px; color: #475569;">In ${escapeHtml(markets)}</div>
        </div>
        <div class="card">
          <div class="card-label">3. Wider Long-Term Market (TAM)</div>
          <div class="card-stat">${escapeHtml(formatPlanCurrency(data.totalWiderMarketTam, currency))}<span style="font-size: 12px; font-weight: 600; color: #475569;"> / yr</span></div>
          <div class="card-value" style="font-size: 12px; color: #475569;">Total industry opportunity</div>
        </div>
      </div>
      ${
        data.grantReadySummaryParagraph
          ? `<div class="quote-box" style="margin-top: 12px;">
              <div class="card-label">Grant &amp; Investor Market Sizing Summary</div>
              <div>${escapeHtml(data.grantReadySummaryParagraph)}</div>
            </div>`
          : ''
      }
      ${
        data.marketSizing.sourceAndAssumptionNotes?.trim()
          ? `<div class="card" style="margin-top: 12px;">
              <div class="card-label">Market Sizing Sources &amp; Assumptions</div>
              <div class="card-value">${escapeHtml(data.marketSizing.sourceAndAssumptionNotes.trim())}</div>
            </div>`
          : ''
      }
    </div>

    <!-- 4. COMPETITIVE EDGE & DEFENSIBILITY -->
    <div class="section">
      <div class="section-title">4. Competitive Edge &amp; How You Stand Out (Step 4)</div>
      <table class="doc-table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Value for Money</th>
            <th>Speed / Time Saved</th>
            <th>Ease of Use</th>
            <th>Specialist Quality &amp; Trust</th>
          </tr>
        </thead>
        <tbody>${matrixRowsHtml}</tbody>
      </table>
      <div class="grid-2" style="margin-top: 12px;">
        <div class="card">
          <div class="card-label">Making It Easy to Switch (First Step)</div>
          <div class="card-value">${escapeHtml(data.competitiveWedge.switchingFrictionPlanNotes || 'Not yet specified.')}</div>
          ${
            data.competitiveWedge.switchingFrictionReducers.length > 0
              ? `<div class="pill-list" style="margin-top: 8px;">
                  ${data.competitiveWedge.switchingFrictionReducers
                    .map(
                      (id) =>
                        `<span class="pill-indigo">${escapeHtml(SWITCHING_FRICTION_LABELS[id] || id)}</span>`
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>
        <div class="card">
          <div class="card-label">2-Sentence Competitive Edge &amp; Defensibility</div>
          <div class="card-value">${escapeHtml(data.competitiveWedge.competitiveEdgeSummary || 'Not yet specified.')}</div>
          ${
            data.competitiveWedge.unfairAdvantages.length > 0
              ? `<div class="pill-list" style="margin-top: 8px;">
                  ${data.competitiveWedge.unfairAdvantages
                    .map(
                      (id) =>
                        `<span class="pill-emerald">${escapeHtml(UNFAIR_ADVANTAGE_LABELS[id] || id)}</span>`
                    )
                    .join('')}
                </div>`
              : ''
          }
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
      Your Module B Market &amp; Customer Brief is complete. Continue to Module C inside Build My Unicorn to launch your unbiased Customer Validation Survey (<code>/v/my-startup</code>), collect real buyer feedback, and build your early waitlist in ${escapeHtml(markets)}.`;

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
    scopeValue: markets,
    sectionsHtml,
    footerCtaHtml,
  });
}
