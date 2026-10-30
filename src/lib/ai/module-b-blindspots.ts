import type { BlindSpotItem } from '@/db/schema';
import {
  getCountryRulePack,
  getGrantsForCountry,
  formatPlanCurrency,
  type SupportedCountryCode,
} from '@/lib/localization';
import type {
  BeachheadMarketData,
  CompetitorsAndStatusQuoData,
  MarketSizingData,
  CompetitiveWedgeData,
} from '@/lib/auth/session-store';

export interface DynamicModuleBBlindSpotsInput {
  planTitle: string;
  industryCategory: string;
  hqCountryCode: SupportedCountryCode;
  targetMarketsArray: string[];
  beachhead?: Partial<BeachheadMarketData>;
  competitorsAndStatusQuo?: Partial<CompetitorsAndStatusQuoData>;
  marketSizing?: Partial<MarketSizingData>;
  competitiveWedge?: Partial<CompetitiveWedgeData>;
}

/**
 * Generates 6 live, constructive "Things to Consider" blind-spot cards for Module B
 * that react immediately as the founder fills out Steps 1–4 (Target Customers,
 * Competitors & Habits, Market Sizing, and Competitive Edge).
 */
export function buildDynamicModuleBBlindSpots(
  input: DynamicModuleBBlindSpotsInput
): BlindSpotItem[] {
  const countryPack = getCountryRulePack(input.hqCountryCode);
  const grants = getGrantsForCountry(input.hqCountryCode);
  const topGrant =
    grants[0]?.grantName || 'Local Enterprise Feasibility Support';
  const currency = countryPack.defaultCurrency;

  const targetMarkets =
    input.targetMarketsArray.length > 0
      ? input.targetMarketsArray
      : [input.hqCountryCode];
  const marketsText = targetMarkets.join(' & ');

  const buyerTypes = input.beachhead?.buyerTypes?.length
    ? input.beachhead.buyerTypes
    : input.beachhead?.buyerType
      ? [input.beachhead.buyerType]
      : ['B2B_BUSINESSES'];

  const customerDesc = input.beachhead?.beachheadSegment?.trim()
    ? input.beachhead.beachheadSegment.trim().replace(/\.$/, '')
    : `target customers in ${marketsText}`;

  // ============================================================================
  // CARD 1: MULTI-GROUP SEQUENCE vs. SPLITTING FOCUS (STEP 1)
  // ============================================================================
  const hasMultipleBuyerModels =
    buyerTypes.length > 1 ||
    (input.marketSizing?.segments?.length ?? 0) > 1;

  const card1: BlindSpotItem = hasMultipleBuyerModels
    ? {
        id: 'mod-b-bs-1-sequence',
        category: 'MARKET_REALITY',
        severity: 'WARNING',
        title:
          '🎯 1. Sequencing Your Customer Groups (Don’t Sell to Both on Day 1)',
        explanation: `You serve multiple customer groups (${customerDesc}). Selling to individual self-serve users requires fast onboarding, while selling to universities, accelerators, or businesses requires relationship building and longer sign-off cycles.`,
        suggestedAction:
          'Pick ONE group to win your first 10 customers in Month 1 (usually individual users or warm pilot partners) and use their traction as proof to close larger institutional/business accounts in Month 3.',
      }
    : {
        id: 'mod-b-bs-1-focus',
        category: 'MARKET_REALITY',
        severity: 'INFO',
        title: '🎯 1. Sharpening Your First 10 Customer List (Step 1)',
        explanation: `You are focusing on "${customerDesc}". The fastest way to test if this group is specific enough is the Monday Morning Test: could you write down the names or LinkedIn profiles of 10 real buyers in ${marketsText} today?`,
        suggestedAction:
          'Before building features, list 10 real people or organisations matching this exact profile whom you will invite to your Module C validation survey.',
      };

  // ============================================================================
  // CARD 2: DECISION MAKER vs. END USER & BUYING TRIGGER (STEP 1)
  // ============================================================================
  const differentDecisionMaker =
    input.beachhead?.endUserVsDecisionMaker === 'DIFFERENT_DECISION_MAKER';
  const decisionMakerRole = input.beachhead?.decisionMakerRole?.trim();

  const card2: BlindSpotItem = differentDecisionMaker
    ? {
        id: 'mod-b-bs-2-decision-maker',
        category: 'OPERATIONAL_REALITY',
        severity: 'WARNING',
        title:
          '🔐 2. Winning Both the Daily User and the Budget Holder (Step 1)',
        explanation: `In your model, the daily user and the person signing off the payment (${decisionMakerRole || 'the budget holder'}) are often different people. Daily users care about ease of use, while budget holders care about cost savings, compliance, or measurable outcomes.`,
        suggestedAction:
          'Give your daily users a 1-page "ROI / Business Case Summary" they can forward to their director or procurement team to get budget approved quickly.',
      }
    : {
        id: 'mod-b-bs-2-trigger',
        category: 'MARKET_REALITY',
        severity: 'INFO',
        title: '⚡ 2. Catching Customers at the Exact Buying Trigger (Step 1)',
        explanation: `Your user and buyer are the same person (${decisionMakerRole || 'direct buyer'}). Individual buyers rarely shop for new tools on a random Tuesday — they act when an urgent trigger hits (${input.beachhead?.buyingTriggerNotes?.trim() || 'a deadline, cost spike, or milestone'}).`,
        suggestedAction:
          'Place your outreach and survey link right where customers go the moment that urgent trigger happens.',
      };

  // ============================================================================
  // CARD 3: BEATING "DOING NOTHING" & CURRENT HABITS (STEP 2)
  // ============================================================================
  const workarounds = input.competitorsAndStatusQuo?.currentWorkarounds ?? [];
  const compCount =
    input.competitorsAndStatusQuo?.competitors?.filter(
      (c) => c.name.trim().length > 0
    ).length ?? 0;

  const card3: BlindSpotItem = {
    id: 'mod-b-bs-3-habits',
    category: 'MARKET_REALITY',
    severity: compCount === 0 ? 'WARNING' : 'INFO',
    title:
      '📊 3. Your #1 Competitor Is Usually "Stick With Spreadsheets / Do Nothing" (Step 2)',
    explanation:
      compCount === 0
        ? `You haven't listed named competitors yet. Remember: investors and grant boards never believe "we have zero competition" because customers are already dealing with the problem via spreadsheets, WhatsApp, or consultants.`
        : `You mapped ${compCount} competitor(s) alongside everyday habits (${workarounds.length > 0 ? `${workarounds.length} workaround habits selected` : 'manual workarounds'}). Even when customers hate their current spreadsheet or agency, habit inertia is strong.`,
    suggestedAction:
      compCount === 0
        ? 'Use the "Find Competitors with AI" button in Step 2 to map at least 2–3 direct or indirect alternatives.'
        : 'Quantify the hidden cost of their current habit (e.g., "4 hours wasted every Friday" or "€2,500 consultant fee") so paying for your solution feels like an instant saving.',
  };

  // ============================================================================
  // CARD 4: MARKET SIZING & ANNUAL PRICING REALITY CHECK (STEP 3)
  // ============================================================================
  const segments = input.marketSizing?.segments ?? [];
  let totalYear1Revenue = 0;
  let totalYear1Customers = 0;
  segments.forEach((seg) => {
    const rawPrice =
      parseFloat((seg.pricePerCustomerInput || '').replace(/[^0-9.]/g, '')) ||
      0;
    const annualPrice =
      seg.billingCadence === 'MONTHLY_SUBSCRIPTION' ? rawPrice * 12 : rawPrice;
    const goalCust =
      parseInt((seg.year1To2CustomerGoalInput || '').replace(/[^0-9]/g, ''), 10) ||
      0;
    totalYear1Revenue += annualPrice * goalCust;
    totalYear1Customers += goalCust;
  });

  const avgAnnualPerCustomer =
    totalYear1Customers > 0 ? totalYear1Revenue / totalYear1Customers : 0;

  const card4: BlindSpotItem =
    totalYear1Revenue === 0
      ? {
          id: 'mod-b-bs-4-sizing-missing',
          category: 'FINANCIAL_REALITY',
          severity: 'WARNING',
          title: '🧮 4. Add Your Bottom-Up Customer Numbers in Step 3',
          explanation:
            'You have not entered your customer count and pricing numbers in Step 3 yet. Grant boards and investors reject vague billion-dollar claims — they want to see Price × Reachable Customers.',
          suggestedAction:
            'Click "Estimate Customer Counts with AI" or "Use Industry Benchmark" in Step 3 to generate a realistic bottom-up calculation.',
        }
      : avgAnnualPerCustomer > 0 && avgAnnualPerCustomer < 100
        ? {
            id: 'mod-b-bs-4-low-arpu',
            category: 'FINANCIAL_REALITY',
            severity: 'WARNING',
            title: `💷 4. Low-Ticket Pricing (${formatPlanCurrency(Math.round(avgAnnualPerCustomer), currency)}/yr Average) Needs High Volume or B2B Bundles (Step 3)`,
            explanation: `Your Year 1–2 goal is ${totalYear1Customers.toLocaleString()} customers generating ${formatPlanCurrency(totalYear1Revenue, currency)}/year. At an average of ${formatPlanCurrency(Math.round(avgAnnualPerCustomer), currency)}/year per customer, you cannot afford expensive 1-on-1 sales calls for individual buyers.`,
            suggestedAction:
              'Keep individual onboarding 100% self-serve, or add a higher-ticket B2B / University / Accelerator bundle (e.g., €1,500–€3,000/yr) to reach profitability faster.',
          }
        : {
            id: 'mod-b-bs-4-healthy-som',
            category: 'FINANCIAL_REALITY',
            severity: 'INFO',
            title: `📈 4. Realistic Year 1–2 Target: ${totalYear1Customers.toLocaleString()} Customers = ${formatPlanCurrency(totalYear1Revenue, currency)}/yr (Step 3)`,
            explanation: `Breaking your Year 1–2 revenue goal (${formatPlanCurrency(totalYear1Revenue, currency)}/yr) down to ${totalYear1Customers.toLocaleString()} real customers (approx. ${Math.max(1, Math.ceil(totalYear1Customers / 12))} new customers per month) makes your plan credible to both grant assessors and investors.`,
            suggestedAction:
              'Test your proposed price point in Module C (Customer Surveys) before locking in your final pricing tiers in Module F.',
          };

  // ============================================================================
  // CARD 5: OVERCOMING SWITCHING FRICTION & COPYCAT PROTECTION (STEP 4)
  // ============================================================================
  const switchReducers =
    input.competitiveWedge?.switchingFrictionReducers ?? [];
  const moats = input.competitiveWedge?.unfairAdvantages ?? [];

  const card5: BlindSpotItem = {
    id: 'mod-b-bs-5-wedge',
    category: 'OPERATIONAL_REALITY',
    severity:
      switchReducers.length === 0 || moats.length === 0 ? 'WARNING' : 'INFO',
    title:
      '🛡️ 5. Lowering Switching Friction & Protecting Your Lead (Step 4)',
    explanation:
      switchReducers.length === 0
        ? 'Even if your product is 5x better, customers hesitate if switching feels risky or time-consuming. Defining a zero-risk "First Step" removes that hesitation.'
        : `You selected ${switchReducers.length} switching-friction reducer(s) and ${moats.length} long-term unfair advantage(s). Remember: features can be copied in months, but local compliance, community cohorts, and trusted relationships compound over years.`,
    suggestedAction:
      input.competitiveWedge?.switchingFrictionPlanNotes?.trim()
        ? `Lead your pitch with your easy first step: "${input.competitiveWedge.switchingFrictionPlanNotes.trim().replace(/\.$/, '')}".`
        : 'Define a 10-minute free first step or pilot in Step 4 so customers can experience value before committing budget.',
  };

  // ============================================================================
  // CARD 6: EXPORT & GRANT READINESS + MODULE C VALIDATION HANDOFF
  // ============================================================================
  const isExporting =
    targetMarkets.some((m) => m !== input.hqCountryCode) ||
    targetMarkets.includes('EU') ||
    targetMarkets.includes('ROW');

  const card6: BlindSpotItem = {
    id: 'mod-b-bs-6-validation-handoff',
    category: 'LOCAL_GRANT_MATCH',
    severity: 'INFO',
    title: `🌍 6. Proving Demand in ${marketsText} for ${topGrant} (Next: Module C)`,
    explanation: isExporting
      ? `Because you selected international selling markets (${marketsText}), you align strongly with export-focused supports like ${topGrant}. However, grant assessors will ask: "How many real target customers have you actually surveyed or interviewed?"`
      : `You are launching in ${countryPack.countryName} first. Whether you apply for ${topGrant} or bootstrap from customer sales, real customer survey data is the strongest proof you can show.`,
    suggestedAction:
      'Proceed to Module C (Customer Surveys & Feedback) to publish your unbiased customer validation survey link and collect your first 15+ real buyer responses and waitlist signups.',
  };

  return [card1, card2, card3, card4, card5, card6];
}
