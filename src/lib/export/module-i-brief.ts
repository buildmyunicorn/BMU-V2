/**
 * Formal Executive Go-To-Market & Customer Acquisition Brief Generator (Module I).
 * Formats a clean, executive, printable HTML document & Markdown export tailored for
 * Irish LEO, Enterprise Ireland, UK Innovate UK / British Business Bank evaluators and angel investors.
 */

import type { BlindSpotItem } from '@/db/schema';
import {
  escapeDocumentHtml as escapeHtml,
  renderBmuStandaloneHtmlDocument,
} from '@/lib/export/document-shell';
import {
  getCountryRulePack,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  BrandPositioningStep1Data,
  Modern4PsStep2Data,
  First10PlaybookStep3Data,
  MarketingBudgetStep4Data,
  MarketingExecutiveBriefStep5Data,
} from '@/lib/auth/session-store';

export interface ModuleIBriefMetrics {
  cashCac: number;
  fullyLoadedCac: number;
  ltv: number;
  ltvToCacRatio: number;
  paybackMonths: number;
  activeLtvModel: string;
  effectiveLtvMultiplier: number;
  ltvMultiplierUnitLabel: string;
  pocketProfit: number;
  firstOrderNetProfitAfterCac: number;
  warmCustomerCredit: number;
  netColdCustomersNeeded: number;
  requiredQualifiedLeads: number;
  requiredTopOfFunnelTouches: number;
  paidTouches: number;
  organicTouches: number;
  paidLeads: number;
  organicLeads: number;
  paidMediaBucketSpend: number;
  toolsBucketSpend: number;
  contentEventsBucketSpend: number;
  lineItemsTotalSpend: number;
  effectiveModuleJMonthlySpend: number;
  weeklyFounderHours: number;
  monthlyFounderHours: number;
}

export interface ModuleIBriefData {
  planTitle: string;
  founderName: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  currencySymbol: string;
  baseCurrency: string;
  dateStr?: string;
  step1Data: BrandPositioningStep1Data;
  step2Data: Modern4PsStep2Data;
  step3Data: First10PlaybookStep3Data;
  step4Data: MarketingBudgetStep4Data;
  metrics: ModuleIBriefMetrics;
  step5Data: MarketingExecutiveBriefStep5Data;
  whiteLabelEnabled?: boolean;
}

/**
 * Generates a clean, structured Markdown version of the Module I Brief.
 */
export function buildModuleIMarkdownBrief(data: ModuleIBriefData): string {
  const {
    planTitle,
    founderName,
    industryCategory,
    currencySymbol,
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    metrics,
    step5Data,
  } = data;

  const isPaidOptedOut =
    step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
    Number(step4Data.paidTrafficSharePercent) === 0 ||
    step4Data.excludePaidAdsFromModuleJ === true ||
    metrics.paidMediaBucketSpend === 0;
  const postureLabel =
    step5Data.marketingReadinessConfidence === 'OTHER'
      ? step5Data.otherReadinessConfidenceText || 'Custom Commercial Posture'
      : step5Data.marketingReadinessConfidence || 'Standard Posture';

  return `# ${planTitle} — Go-To-Market & Customer Acquisition Brief (Module I)
**Founder / Prepared For:** ${founderName} | **Industry:** ${industryCategory} | **Readiness Posture:** ${postureLabel}

---

## 1. Executive Commercial Defense Narrative (3-Paragraph Defense)
${step5Data.executiveMarketingSummaryNarrative || '_No defense narrative compiled yet._'}

---

## 2. Pillar 1: Brand Positioning & Strategic Wedge
- **140-Character Elevator Hook:** "${step1Data.elevatorHook140}"
- **Tone of Voice:** ${step1Data.toneOfVoice}${step1Data.otherToneOfVoiceText ? ` (${step1Data.otherToneOfVoiceText})` : ''}
- **5-Part Positioning Formula:**
  - **Target Customer:** ${step1Data.positioningFormula.targetCustomer}
  - **Core Problem:** ${step1Data.positioningFormula.customerProblem}
  - **Solution Category:** ${step1Data.positioningFormula.solutionCategory}
  - **Primary Benefit:** ${step1Data.positioningFormula.primaryBenefit}
  - **Competitive Wedge / Moat:** ${step1Data.positioningFormula.competitiveWedge}

---

## 3. Pillar 2: Modern 4Ps Commercial Architecture
- **Product Packaging (P1):** ${step2Data.productP1.packagingType}
- **Pricing Stance & Headline (P2):** ${step2Data.priceP2.pricingStance} — ${step2Data.priceP2.headlinePricePoint || 'Market Benchmark'}
- **Primary Distribution Channel (P3 - Place):** ${step2Data.placeP3.primaryChannel}
- **Primary Acquisition Engine (P4 - Promotion):** ${step2Data.promotionP4.primaryAcquisitionEngine}

---

## 4. Pillar 3: First 10 Customers Playbook
- **Acquisition Archetype:** ${step3Data.acquisitionArchetype}
- **Pilot Offer Structure:** ${step3Data.pilotOffer.pilotStructure}
- **Founder Quid Pro Quo Ask:** ${step3Data.pilotOffer.quidProQuoFounderAsk}
- **Warm Pipeline Size:** ${step3Data.targetPipeline.length} identified accounts
- **Letter of Intent (LOI) Target:** ${step3Data.letterOfIntent.targetCompanyName || 'Pilot Partner'} (${step3Data.letterOfIntent.pilotPricePoint || 'Preferential Pilot Rate'})
- **Primary Pilot Success KPI:** ${step3Data.letterOfIntent.primarySuccessKpi || 'Turnaround & ROI validation'}

---

## 5. Pillar 4: Marketing Budget, CAC & Funnel Unit Economics
- **Target Monthly New Customers:** ${step4Data.targetMonthlyNewCustomers}
- **Warm Pipeline Credit:** -${metrics.warmCustomerCredit} customers (from ${step3Data.targetPipeline.length} warm leads)
- **Net Cold Customers Needed Monthly:** ${metrics.netColdCustomersNeeded}
- **Required Qualified Leads:** ${metrics.requiredQualifiedLeads} leads (${metrics.organicLeads} organic / ${metrics.paidLeads} paid)
- **Required Top-of-Funnel Touches:** ${metrics.requiredTopOfFunnelTouches.toLocaleString()} touches (${metrics.organicTouches.toLocaleString()} organic / ${metrics.paidTouches.toLocaleString()} paid)
- **Cash CAC:** ${currencySymbol}${metrics.cashCac}
- **Founder Weekly Marketing Time:** ${metrics.weeklyFounderHours} hrs/wk (${metrics.monthlyFounderHours} hrs/mo)
- **Lifetime Value (LTV):** ${currencySymbol}${metrics.ltv} (${metrics.effectiveLtvMultiplier}x ${metrics.ltvMultiplierUnitLabel})
- **LTV to CAC Ratio:** ${metrics.ltvToCacRatio}:1
- **Payback Velocity:** ${metrics.paybackMonths} months
- **Paid Advertising Strategy:** ${
    isPaidOptedOut
      ? 'FORMALLY OPTED OUT (Negative Unit Economics). Performance ads excluded to conserve capital; zero ad burn.'
      : `Active Performance Media (${step4Data.paidTrafficSharePercent}% paid share). Planned ad spend: ${currencySymbol}${metrics.paidMediaBucketSpend.toLocaleString()}/mo.`
  }
- **Effective Monthly Overhead Synced to Module J:** ${currencySymbol}${metrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo (${
    isPaidOptedOut ? 'Grant-eligible software tools & content only' : 'Full marketing line items'
  })

---

## 6. Constructive "Things to Consider" Blind-Spot Review
${
  step5Data.blindSpots.length === 0
    ? '_No commercial blind spots logged._'
    : step5Data.blindSpots
        .map(
          (b, i) =>
            `### ${i + 1}. [${b.severity}] ${b.title}\n- **Explanation:** ${b.explanation}\n- **Recommended Mitigation:** ${b.suggestedAction}`
        )
        .join('\n\n')
}
`;
}

/**
 * Generates the standardized executive standalone HTML document for Module I.
 */
export function buildModuleIStandaloneHtmlDocument(data: ModuleIBriefData): string {
  const countryPack = getCountryRulePack(data.hqCountryCode);
  const currency = data.baseCurrency || countryPack.defaultCurrency;
  const currencySymbol =
    data.currencySymbol ||
    (data.hqCountryCode === 'GB'
      ? '£'
      : data.hqCountryCode === 'US'
      ? '$'
      : '€');

  const dateStr =
    data.dateStr ||
    new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const { step1Data, step2Data, step3Data, step4Data, metrics, step5Data } = data;
  const isPaidOptedOut =
    step4Data.paidAdsViabilityDecision === 'OPTED_OUT_UNPROFITABLE' ||
    Number(step4Data.paidTrafficSharePercent) === 0 ||
    step4Data.excludePaidAdsFromModuleJ === true ||
    metrics.paidMediaBucketSpend === 0;

  const sectionsHtml = `
    <!-- SECTION 1: EXECUTIVE COMMERCIAL DEFENSE NARRATIVE -->
    <div class="section">
      <div class="section-title">1. Executive Commercial Defense Narrative</div>
      <div style="background: #f8fafc; border-left: 3px solid #4f46e5; padding: 14px 18px; border-radius: 8px; font-size: 13px; line-height: 1.65; color: #1e293b;">
        ${escapeHtml(
          step5Data.executiveMarketingSummaryNarrative ||
            'Commercial defense narrative pending completion by founders.'
        ).replace(/\n/g, '<br />')}
      </div>
      ${
        step5Data.aiAssessorTip
          ? `<div style="margin-top: 10px; font-size: 11.5px; color: #4338ca; background: #eef2ff; padding: 8px 12px; border-radius: 6px;">
              <strong>Assessor Tip:</strong> ${escapeHtml(step5Data.aiAssessorTip)}
            </div>`
          : ''
      }
    </div>

    <!-- SECTION 2: BRAND POSITIONING & STRATEGIC WEDGE -->
    <div class="section">
      <div class="section-title">2. Brand Positioning &amp; Strategic Wedge (Pillar 1)</div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
          140-Character Commercial Elevator Hook
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #0f172a;">
          &ldquo;${escapeHtml(step1Data.elevatorHook140)}&rdquo;
        </div>
        <div style="margin-top: 6px; font-size: 11.5px; color: #64748b;">
          Tone of Voice: <strong style="color: #1e293b;">${escapeHtml(step1Data.toneOfVoice)}</strong>
          ${step1Data.otherToneOfVoiceText ? ` (${escapeHtml(step1Data.otherToneOfVoiceText)})` : ''}
        </div>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 28%;">Positioning Dimension</th>
            <th>Venture Definition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Target Customer</strong></td>
            <td>${escapeHtml(step1Data.positioningFormula.targetCustomer)}</td>
          </tr>
          <tr>
            <td><strong>Core Customer Problem</strong></td>
            <td>${escapeHtml(step1Data.positioningFormula.customerProblem)}</td>
          </tr>
          <tr>
            <td><strong>Solution Category</strong></td>
            <td>${escapeHtml(step1Data.positioningFormula.solutionCategory)}</td>
          </tr>
          <tr>
            <td><strong>Primary Value Benefit</strong></td>
            <td>${escapeHtml(step1Data.positioningFormula.primaryBenefit)}</td>
          </tr>
          <tr>
            <td><strong>Competitive Wedge &amp; Moat</strong></td>
            <td>${escapeHtml(step1Data.positioningFormula.competitiveWedge)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SECTION 3: MODERN 4PS COMMERCIAL ARCHITECTURE -->
    <div class="section">
      <div class="section-title">3. Modern 4Ps Commercial Architecture (Pillar 2)</div>
      <div class="grid-4" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #ffffff;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">1. Product Packaging</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
            ${escapeHtml(step2Data.productP1.packagingType)}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">V1 product vehicle format</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #ffffff;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">2. Price &amp; Stance</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
            ${escapeHtml(step2Data.priceP2.headlinePricePoint || 'Market Benchmark')}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(step2Data.priceP2.pricingStance)}</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #ffffff;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">3. Distribution (Place)</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
            ${escapeHtml(step2Data.placeP3.primaryChannel)}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Primary delivery channel</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #ffffff;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">4. Promotion Engine</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
            ${escapeHtml(step2Data.promotionP4.primaryAcquisitionEngine)}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Primary growth lever</div>
        </div>
      </div>
    </div>

    <!-- SECTION 4: FIRST 10 CUSTOMERS PLAYBOOK -->
    <div class="section">
      <div class="section-title">4. First 10 Customers Playbook (Pillar 3)</div>
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: #ffffff; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Acquisition Archetype</div>
            <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">${escapeHtml(step3Data.acquisitionArchetype)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Warm Pipeline Size</div>
            <div style="font-size: 14px; font-weight: 700; color: #4f46e5;">${step3Data.targetPipeline.length} High-Probability Leads</div>
          </div>
        </div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #334155;">
          <strong>Founding Pilot Offer:</strong> ${escapeHtml(step3Data.pilotOffer.pilotStructure)}<br />
          <strong>Founder Quid Pro Quo Ask:</strong> ${escapeHtml(step3Data.pilotOffer.quidProQuoFounderAsk)}
        </div>
        <div style="margin-top: 8px; font-size: 11.5px; color: #64748b;">
          <strong>Letter of Intent (LOI) Focus:</strong> ${escapeHtml(step3Data.letterOfIntent.targetCompanyName || 'Pilot Partner')} • KPI: &ldquo;${escapeHtml(step3Data.letterOfIntent.primarySuccessKpi || 'ROI & workflow acceleration')}&rdquo;
        </div>
      </div>

      ${
        step3Data.targetPipeline.length > 0
          ? `<table class="doc-table">
              <thead>
                <tr>
                  <th>Target Prospect Account</th>
                  <th>Decision Maker / Angle</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                ${step3Data.targetPipeline
                  .slice(0, 6)
                  .map(
                    (p) => `<tr>
                      <td><strong>${escapeHtml(p.companyOrPersona)}</strong></td>
                      <td>${escapeHtml(p.decisionMakerTitle || p.triggerEventOrAngle || 'Key Contact')}</td>
                      <td><span style="font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #4f46e5;">${escapeHtml(p.status)}</span></td>
                      <td>${escapeHtml(p.source)}</td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
          : ''
      }
    </div>

    <!-- SECTION 5: MARKETING BUDGET & CAC FUNNEL WATERFALL -->
    <div class="section">
      <div class="section-title">5. Marketing Budget, CAC &amp; Acquisition Unit Economics (Pillar 4)</div>
      
      <div class="grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Cash CAC</div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;">${currencySymbol}${metrics.cashCac}</div>
          <div style="font-size: 9.5px; color: #64748b;">Founder time: ${metrics.weeklyFounderHours} hrs/wk</div>
        </div>
        <div style="border: 1px solid #a7f3d0; border-radius: 10px; padding: 10px; background: #ecfdf5;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #065f46;">LTV : CAC Ratio</div>
          <div style="font-size: 16px; font-weight: 800; color: #047857; margin-top: 2px;">${metrics.ltvToCacRatio}:1</div>
          <div style="font-size: 9.5px; color: #065f46;">LTV: ${currencySymbol}${metrics.ltv}</div>
        </div>
        <div style="border: 1px solid #c7d2fe; border-radius: 10px; padding: 10px; background: #eef2ff;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #3730a3;">Payback Velocity</div>
          <div style="font-size: 16px; font-weight: 800; color: #4338ca; margin-top: 2px;">${metrics.paybackMonths} mos</div>
          <div style="font-size: 9.5px; color: #3730a3;">${metrics.paybackMonths <= 6 ? 'Within 6m target' : 'Working buffer needed'}</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">Module J Sync</div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;">${currencySymbol}${metrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo</div>
          <div style="font-size: 9.5px; color: #047857; font-weight: 600;">${isPaidOptedOut ? 'Paid Ads Excluded' : 'Full Spend'}</div>
        </div>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th>Funnel Stage / Commercial Line Item</th>
            <th style="text-align: right;">Target / Volume</th>
            <th style="text-align: right;">Channel Split</th>
            <th>Evaluator Benchmark / Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Target Monthly New Customers</strong></td>
            <td style="text-align: right; font-weight: 700;">${step4Data.targetMonthlyNewCustomers} customers/mo</td>
            <td style="text-align: right;">--</td>
            <td>Calibrated from Module H commercial plan</td>
          </tr>
          <tr>
            <td style="padding-left: 20px; color: #475569;">Less: Warm Pipeline Conversion Credit</td>
            <td style="text-align: right; color: #047857;">-${metrics.warmCustomerCredit} customers</td>
            <td style="text-align: right; color: #047857;">30% conversion</td>
            <td>Deducted from ${step3Data.targetPipeline.length} warm accounts identified in Step 3</td>
          </tr>
          <tr class="row-highlight">
            <td><strong>Net Cold Customers Needed Monthly</strong></td>
            <td style="text-align: right;">${metrics.netColdCustomersNeeded} customers/mo</td>
            <td style="text-align: right;">Cold Outbound / Inbound</td>
            <td>Net acquisition requirement to meet growth milestones</td>
          </tr>
          <tr>
            <td style="padding-left: 20px; color: #475569;">Required Qualified Leads</td>
            <td style="text-align: right;">${metrics.requiredQualifiedLeads} leads/mo</td>
            <td style="text-align: right;">${metrics.organicLeads} org / ${metrics.paidLeads} paid</td>
            <td>Based on ${step4Data.leadToCustomerConversionPercent}% lead conversion</td>
          </tr>
          <tr>
            <td style="padding-left: 20px; color: #475569;">Required Top-of-Funnel Touches / Visitors</td>
            <td style="text-align: right;">${metrics.requiredTopOfFunnelTouches.toLocaleString()} touches/mo</td>
            <td style="text-align: right;">${metrics.organicTouches.toLocaleString()} org / ${metrics.paidTouches.toLocaleString()} paid</td>
            <td>Based on ${step4Data.visitorToLeadConversionPercent}% visitor-to-lead conversion</td>
          </tr>
          <tr>
            <td><strong>Paid Media / Performance Advertising Spend</strong></td>
            <td style="text-align: right;">
              ${
                isPaidOptedOut
                  ? '<strong style="color: #047857;">' + currencySymbol + '0 (Opted Out)</strong>'
                  : currencySymbol + metrics.paidMediaBucketSpend.toLocaleString() + '/mo'
              }
            </td>
            <td style="text-align: right;">
              ${isPaidOptedOut ? '<span style="color: #047857; font-weight: 600;">Excluded</span>' : step4Data.paidTrafficSharePercent + '% paid share'}
            </td>
            <td>
              ${
                isPaidOptedOut
                  ? 'Negative unit economics detected; paid ads formally eliminated to preserve cash'
                  : 'Ongoing paid ads are strictly ineligible for LEO/Innovate UK grant co-funding'
              }
            </td>
          </tr>
          <tr>
            <td>Software Tools &amp; Growth Infrastructure</td>
            <td style="text-align: right;">${currencySymbol}${metrics.toolsBucketSpend.toLocaleString()}/mo</td>
            <td style="text-align: right; color: #047857; font-weight: 600;">Grant Eligible</td>
            <td>CRM, email marketing, analytics, conversion optimization tooling</td>
          </tr>
          <tr>
            <td>Content, Design &amp; Public Relations</td>
            <td style="text-align: right;">${currencySymbol}${metrics.contentEventsBucketSpend.toLocaleString()}/mo</td>
            <td style="text-align: right; color: #047857; font-weight: 600;">Grant Eligible</td>
            <td>Creative production, whitepapers, case studies, event collateral</td>
          </tr>
          <tr style="border-top: 2px solid #cbd5e1; font-weight: 700;">
            <td>Total Planned Monthly Marketing Spend</td>
            <td style="text-align: right;">${currencySymbol}${metrics.lineItemsTotalSpend.toLocaleString()}/mo</td>
            <td style="text-align: right;">100.0%</td>
            <td>All marketing line items modeled in Step 4</td>
          </tr>
          <tr class="row-highlight" style="background: #ecfdf5; color: #065f46;">
            <td><strong>Effective Monthly Overheads Synced to Module J</strong></td>
            <td style="text-align: right; font-size: 14px;"><strong>${currencySymbol}${metrics.effectiveModuleJMonthlySpend.toLocaleString()}/mo</strong></td>
            <td style="text-align: right;"><strong>${isPaidOptedOut ? 'Non-Ad Spend Only' : 'Full Spend'}</strong></td>
            <td>
              ${
                isPaidOptedOut
                  ? 'Grant-compliant: only software tools and creative content are exported to Module J financials.'
                  : 'Full marketing budget exported directly to Module J operating expenses.'
              }
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SECTION 6: CONSTRUCTIVE BLIND-SPOT REVIEW -->
    <div class="section">
      <div class="section-title">6. Constructive &ldquo;Things to Consider&rdquo; Commercial Blind-Spot Review</div>
      ${
        step5Data.blindSpots.length === 0
          ? '<div style="font-size: 12px; color: #64748b;">No commercial blind spots logged.</div>'
          : step5Data.blindSpots
              .map(
                (b, i) => `
            <div style="border: 1px solid ${
              b.severity === 'CRITICAL' ? '#fecdd3' : b.severity === 'WARNING' ? '#fde68a' : '#e0e7ff'
            }; background: ${
                  b.severity === 'CRITICAL'
                    ? '#fff1f2'
                    : b.severity === 'WARNING'
                    ? '#fffbeb'
                    : '#f5f3ff'
                }; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div style="font-size: 12.5px; font-weight: 700; color: #0f172a;">
                  Consideration #${i + 1}: ${escapeHtml(b.title)}
                </div>
                <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1;">
                  ${escapeHtml(b.severity)}
                </span>
              </div>
              <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 6px;">
                ${escapeHtml(b.explanation)}
              </div>
              <div style="font-size: 11.5px; color: #1e1b4b; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong>Recommended Mitigation:</strong> ${escapeHtml(b.suggestedAction)}
              </div>
            </div>`
              )
              .join('')
      }
    </div>
  `;

  const footerCtaHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
      <div>
        <strong>Startup Preflight • Module I Go-To-Market &amp; Commercial Acquisition Brief</strong><br />
        <span style="color: #94a3b8; font-size: 11.5px;">
          Aligned with Irish LEO / Enterprise Ireland Feasibility &amp; Priming, UK Innovate UK Smart Grants, and British Business Bank validation frameworks.
        </span>
      </div>
      <div style="text-align: right; font-size: 11px; color: #cbd5e1;">
        Status: <strong>Verified Commercial Architecture</strong>
      </div>
    </div>
  `;

  return renderBmuStandaloneHtmlDocument({
    documentTitle: `${data.planTitle} - Marketing & Customer Acquisition Brief`,
    eyebrow: 'STARTUP PREFLIGHT • MODULE I GO-TO-MARKET & COMMERCIAL BRIEF',
    planTitle: data.planTitle,
    founderName: data.founderName || 'Founding Team',
    countryName: countryPack.countryName,
    currency: currency,
    industryCategory: data.industryCategory || 'Technology / Commercial Venture',
    dateStr: dateStr,
    scopeLabel: 'Readiness Posture',
    scopeValue:
      step5Data.marketingReadinessConfidence === 'OTHER'
        ? step5Data.otherReadinessConfidenceText || 'Custom Posture'
        : step5Data.marketingReadinessConfidence || 'Standard Posture',
    sectionsHtml,
    footerCtaHtml,
  });
}
