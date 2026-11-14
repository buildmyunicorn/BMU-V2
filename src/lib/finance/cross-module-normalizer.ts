import type {
  ActiveStartupPlan,
  FounderSurvivalBudgetItem,
  PlannedRoleItem,
  PricingTierItem,
  SavedModuleBData,
  SavedModuleDData,
  SavedModuleEData,
  SavedModuleFData,
  SavedModuleHData,
  TeamMemberProfileItem,
} from '@/lib/auth/session-store';
import { getCountryRulePack } from '@/lib/localization';

export type NormalizedBillingCadence =
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'ONE_OFF';

export function normalizeBillingCadence(
  raw?: string | null
): NormalizedBillingCadence {
  const upper = (raw || '').toUpperCase().trim();
  if (upper === 'ANNUAL' || upper === 'YEARLY' || upper === 'YEAR') {
    return 'ANNUAL';
  }
  if (upper === 'QUARTERLY' || upper === 'QUARTER') {
    return 'QUARTERLY';
  }
  if (
    upper === 'ONE_OFF' ||
    upper === 'ONE_TIME' ||
    upper === 'ONE_OFF_TRANSACTION' ||
    upper === 'PROJECT_MILESTONE'
  ) {
    return 'ONE_OFF';
  }
  return 'MONTHLY';
}

/**
 * Converts a billed tier/order net price into its monthly accrual equivalent:
 * - ANNUAL -> priceNet / 12
 * - QUARTERLY -> priceNet / 3
 * - MONTHLY / ONE_OFF -> priceNet
 */
export function normalizePriceToMonthlyAccrualNet(
  priceNet: number,
  billingCadence?: string | null
): number {
  const clean = Number(priceNet) || 0;
  if (clean <= 0) return 0;
  const cadence = normalizeBillingCadence(billingCadence);
  if (cadence === 'ANNUAL') return Math.round((clean / 12) * 100) / 100;
  if (cadence === 'QUARTERLY') return Math.round((clean / 3) * 100) / 100;
  return Math.round(clean * 100) / 100;
}

export function getCadenceMonthsMultiplier(
  billingCadence?: string | null
): number {
  const cadence = normalizeBillingCadence(billingCadence);
  if (cadence === 'ANNUAL') return 12;
  if (cadence === 'QUARTERLY') return 3;
  return 1;
}

export interface ModuleHBlendedPricingResult {
  hasPricingTiers: boolean;
  blendedOrderNetPrice: number;
  blendedOrderGrossPrice: number;
  blendedMonthlyAccrualNetPrice: number;
  blendedMonthlyAccrualGrossPrice: number;
  effectiveMonthlyAccrualNetPrice: number;
  effectiveMonthlyAccrualGrossPrice: number;
  effectiveTaxRatePercent: number;
  annualShareWeight: number;
  quarterlyShareWeight: number;
  monthlyOrOneOffShareWeight: number;
  dominantBillingCadence: NormalizedBillingCadence;
  isRecurringModel: boolean;
}

export function computeModuleHBlendedPricing(
  modH?: SavedModuleHData | null,
  defaultVatRatePercent: number = 23
): ModuleHBlendedPricingResult {
  const revModel = modH?.step1RevenueModel;
  const tiers = modH?.step2PricingTiers?.tiers || [];
  const step3 = modH?.step3BreakevenCalculator;
  const defaultCadence = normalizeBillingCadence(
    revModel?.billingCadenceDefault ||
      (revModel?.revenueModelVehicle === 'ONE_OFF_TRANSACTION' ||
      revModel?.revenueModelVehicle === 'SERVICE_PROJECT_HOURLY'
        ? 'ONE_OFF'
        : 'MONTHLY')
  );

  const isRecurringModel =
    revModel?.revenueModelVehicle === 'SUBSCRIPTION_RECURRING' ||
    revModel?.revenueModelVehicle === 'HARDWARE_PLUS_PLAN' ||
    revModel?.revenueModelVehicle === 'USAGE_BASED_METERED' ||
    tiers.some(
      (t) =>
        normalizeBillingCadence(t.billingFrequency) === 'MONTHLY' ||
        normalizeBillingCadence(t.billingFrequency) === 'ANNUAL' ||
        normalizeBillingCadence(t.billingFrequency) === 'QUARTERLY'
    );

  const paidTiers = tiers.filter(
    (t) => (Number(t.priceNetOfTax) || 0) > 0 || (Number(t.priceGross) || 0) > 0
  );

  const getTierNet = (t: PricingTierItem): number => {
    const net = Number(t.priceNetOfTax) || 0;
    if (net > 0) return net;
    const gross = Number(t.priceGross) || 0;
    const vat = t.taxRatePercent ?? defaultVatRatePercent;
    return gross > 0 ? Math.round((gross / (1 + vat / 100)) * 100) / 100 : 0;
  };

  const getTierGross = (t: PricingTierItem): number => {
    const gross = Number(t.priceGross) || 0;
    if (gross > 0) return gross;
    const net = getTierNet(t);
    const vat = t.taxRatePercent ?? defaultVatRatePercent;
    return net > 0 ? Math.round(net * (1 + vat / 100) * 100) / 100 : 0;
  };

  if (paidTiers.length > 0) {
    const rawMixTotal = paidTiers.reduce(
      (s, t) => s + Math.max(0, Number(t.salesMixPercent) || 0),
      0
    );
    const getWeight = (t: PricingTierItem) =>
      rawMixTotal > 0
        ? Math.max(0, Number(t.salesMixPercent) || 0) / rawMixTotal
        : 1 / paidTiers.length;

    let orderNet = 0;
    let orderGross = 0;
    let monthlyNet = 0;
    let monthlyGross = 0;
    let annualShare = 0;
    let quarterlyShare = 0;
    let monthlyOrOneOffShare = 0;

    for (const t of paidTiers) {
      const w = getWeight(t);
      const tNet = getTierNet(t);
      const tGross = getTierGross(t);
      const cadence = normalizeBillingCadence(
        t.billingFrequency || defaultCadence
      );
      const mult = getCadenceMonthsMultiplier(cadence);

      orderNet += tNet * w;
      orderGross += tGross * w;
      monthlyNet += (tNet / mult) * w;
      monthlyGross += (tGross / mult) * w;

      if (cadence === 'ANNUAL') annualShare += w;
      else if (cadence === 'QUARTERLY') quarterlyShare += w;
      else monthlyOrOneOffShare += w;
    }

    const blendedOrderNetPrice = Math.round(orderNet * 100) / 100;
    const blendedOrderGrossPrice = Math.round(orderGross * 100) / 100;
    const blendedMonthlyAccrualNetPrice = Math.round(monthlyNet * 100) / 100;
    const blendedMonthlyAccrualGrossPrice = Math.round(monthlyGross * 100) / 100;
    const effectiveTaxRatePercent =
      blendedMonthlyAccrualNetPrice > 0
        ? Math.max(
            0,
            Math.round(
              ((blendedMonthlyAccrualGrossPrice - blendedMonthlyAccrualNetPrice) /
                blendedMonthlyAccrualNetPrice) *
                1000
            ) / 10
          )
        : defaultVatRatePercent;

    const dominantBillingCadence: NormalizedBillingCadence =
      annualShare >= 0.5
        ? 'ANNUAL'
        : quarterlyShare >= 0.5
          ? 'QUARTERLY'
          : isRecurringModel
            ? 'MONTHLY'
            : defaultCadence;

    // Prioritize official Step 2 tier pricing unless What-If Sandbox is explicitly active
    const sliderPriceRaw = Number(step3?.activePriceSlider) || 0;
    const useSandboxSlider =
      Boolean(step3?.isSandboxActive) && sliderPriceRaw > 0;
    const effectiveMonthlyAccrualNetPrice = useSandboxSlider
      ? sliderPriceRaw > blendedMonthlyAccrualNetPrice * 3 &&
        dominantBillingCadence === 'ANNUAL'
        ? normalizePriceToMonthlyAccrualNet(sliderPriceRaw, 'ANNUAL')
        : sliderPriceRaw
      : blendedMonthlyAccrualNetPrice;

    const effectiveMonthlyAccrualGrossPrice =
      Math.round(
        effectiveMonthlyAccrualNetPrice *
          (1 + effectiveTaxRatePercent / 100) *
          100
      ) / 100;

    return {
      hasPricingTiers: true,
      blendedOrderNetPrice,
      blendedOrderGrossPrice,
      blendedMonthlyAccrualNetPrice,
      blendedMonthlyAccrualGrossPrice,
      effectiveMonthlyAccrualNetPrice,
      effectiveMonthlyAccrualGrossPrice,
      effectiveTaxRatePercent,
      annualShareWeight: Math.round(annualShare * 10000) / 10000,
      quarterlyShareWeight: Math.round(quarterlyShare * 10000) / 10000,
      monthlyOrOneOffShareWeight: Math.max(
        0,
        Math.round((1 - annualShare - quarterlyShare) * 10000) / 10000
      ),
      dominantBillingCadence,
      isRecurringModel,
    };
  }

  // Fallback when Step 2 tiers are empty
  const rawFallbackNet =
    Number(modH?.step2PricingTiers?.blendedAveragePriceNet) ||
    Number(step3?.activePriceSlider) ||
    49;
  const normalizedMonthlyNet = normalizePriceToMonthlyAccrualNet(
    rawFallbackNet,
    defaultCadence
  );
  const normalizedMonthlyGross =
    Math.round(normalizedMonthlyNet * (1 + defaultVatRatePercent / 100) * 100) /
    100;
  const orderGross =
    Math.round(rawFallbackNet * (1 + defaultVatRatePercent / 100) * 100) / 100;

  return {
    hasPricingTiers: false,
    blendedOrderNetPrice: rawFallbackNet,
    blendedOrderGrossPrice: orderGross,
    blendedMonthlyAccrualNetPrice: normalizedMonthlyNet,
    blendedMonthlyAccrualGrossPrice: normalizedMonthlyGross,
    effectiveMonthlyAccrualNetPrice: normalizedMonthlyNet,
    effectiveMonthlyAccrualGrossPrice: normalizedMonthlyGross,
    effectiveTaxRatePercent: defaultVatRatePercent,
    annualShareWeight: defaultCadence === 'ANNUAL' ? 1 : 0,
    quarterlyShareWeight: defaultCadence === 'QUARTERLY' ? 1 : 0,
    monthlyOrOneOffShareWeight:
      defaultCadence === 'ANNUAL' || defaultCadence === 'QUARTERLY' ? 0 : 1,
    dominantBillingCadence: defaultCadence,
    isRecurringModel,
  };
}

/**
 * Splits Accrual P&L Revenue (recognized 1/12 per active customer-month) from
 * Cashflow Invoiced Billing (12x upfront on new/renewing annual cohorts, 3x on quarterly,
 * 1x on monthly/one-off) before debtor collection lag.
 */
export function computeAccrualVsInvoicedCashSchedule(
  activeCustomersByMonth: number[],
  monthlyAccrualNetPrice: number,
  pricingMeta: Pick<
    ModuleHBlendedPricingResult,
    'annualShareWeight' | 'quarterlyShareWeight' | 'monthlyOrOneOffShareWeight'
  >
): {
  accrualRevenueByMonth: number[];
  cashBilledBeforeDebtorLagByMonth: number[];
} {
  const n = activeCustomersByMonth.length;
  const accrualRevenueByMonth = new Array<number>(n).fill(0);
  const cashBilledBeforeDebtorLagByMonth = new Array<number>(n).fill(0);

  const annualContractsBilled = new Array<number>(n).fill(0);
  const quarterlyContractsBilled = new Array<number>(n).fill(0);

  const wAnnual = Math.max(0, Math.min(1, pricingMeta.annualShareWeight || 0));
  const wQuarterly = Math.max(
    0,
    Math.min(1 - wAnnual, pricingMeta.quarterlyShareWeight || 0)
  );
  const wMonthly = Math.max(0, 1 - wAnnual - wQuarterly);

  for (let i = 0; i < n; i++) {
    const activeCust = Math.max(0, activeCustomersByMonth[i] || 0);
    accrualRevenueByMonth[i] = Math.round(activeCust * monthlyAccrualNetPrice);

    // 1. Monthly / One-off portion billed 1x in current month
    const monthlyPortionCash = activeCust * wMonthly * monthlyAccrualNetPrice;

    // 2. Annual portion: sliding 12-month prepaid coverage window [i-11 .. i-1]
    let annualPortionCash = 0;
    if (wAnnual > 0) {
      const targetAnnualActive = activeCust * wAnnual;
      let coveredAnnual = 0;
      for (let k = Math.max(0, i - 11); k < i; k++) {
        coveredAnnual += annualContractsBilled[k];
      }
      const newlyBilledOrRenewedAnnual = Math.max(
        0,
        targetAnnualActive - coveredAnnual
      );
      annualContractsBilled[i] = newlyBilledOrRenewedAnnual;
      annualPortionCash =
        newlyBilledOrRenewedAnnual * (monthlyAccrualNetPrice * 12);
    }

    // 3. Quarterly portion: sliding 3-month prepaid coverage window [i-2 .. i-1]
    let quarterlyPortionCash = 0;
    if (wQuarterly > 0) {
      const targetQuarterlyActive = activeCust * wQuarterly;
      let coveredQuarterly = 0;
      for (let k = Math.max(0, i - 2); k < i; k++) {
        coveredQuarterly += quarterlyContractsBilled[k];
      }
      const newlyBilledOrRenewedQuarterly = Math.max(
        0,
        targetQuarterlyActive - coveredQuarterly
      );
      quarterlyContractsBilled[i] = newlyBilledOrRenewedQuarterly;
      quarterlyPortionCash =
        newlyBilledOrRenewedQuarterly * (monthlyAccrualNetPrice * 3);
    }

    cashBilledBeforeDebtorLagByMonth[i] = Math.round(
      monthlyPortionCash + annualPortionCash + quarterlyPortionCash
    );
  }

  return {
    accrualRevenueByMonth,
    cashBilledBeforeDebtorLagByMonth,
  };
}

// ============================================================================
// MODULE D & MODULE E UPSTREAM COST BRIDGES (#8)
// ============================================================================

export interface ExtractedModuleDCosts {
  hasExplicitTechStackCosts: boolean;
  monthlyTechStackCost: number;
  oneOffBuildCost: number;
  unitBuildCogs: number;
  channelBlendedFeePercent: number | null;
}

export function extractModuleDCosts(
  modD?: SavedModuleDData | null
): ExtractedModuleDCosts {
  const buildItems = Array.isArray(modD?.buildVsBuy?.items)
    ? modD!.buildVsBuy!.items
    : [];
  const workPackages = Array.isArray(modD?.workPackagesAndFlow?.workPackages)
    ? modD!.workPackagesAndFlow!.workPackages
    : [];

  let monthlyTechStackCost = 0;
  let oneOffBuildCost = 0;
  let unitBuildCogs = 0;
  let hasExplicit = false;

  for (const item of buildItems) {
    const amt = Math.max(0, Number(item.estimatedCostAmount) || 0);
    if (amt <= 0) continue;
    hasExplicit = true;
    if (item.costModel === 'MONTHLY_SUBSCRIPTION') {
      monthlyTechStackCost += amt;
    } else if (item.costModel === 'ONE_OFF_PURCHASE') {
      oneOffBuildCost += amt;
    } else if (item.costModel === 'PER_UNIT_COGS') {
      unitBuildCogs += amt;
    }
  }

  for (const wp of workPackages) {
    const amt = Math.max(0, Number(wp.estimatedCostAmount) || 0);
    if (amt <= 0) continue;
    hasExplicit = true;
    if (wp.costModel === 'MONTHLY_SUBSCRIPTION') {
      monthlyTechStackCost += amt;
    } else if (wp.costModel === 'ONE_OFF_PURCHASE') {
      oneOffBuildCost += amt;
    } else if (wp.costModel === 'PER_UNIT_COGS') {
      unitBuildCogs += amt;
    }
  }

  // Legacy property fallback if structured item arrays had no amounts
  if (!hasExplicit && modD?.buildVsBuy) {
    const legacyModD = modD.buildVsBuy as unknown as Record<string, unknown>;
    const legacyMonthly =
      Number(legacyModD.estimatedMonthlyRunCost) ||
      Number(legacyModD.monthlySaaSBudget) ||
      0;
    const legacyOneOff =
      Number(legacyModD.estimatedUpfrontBuildCost) ||
      Number(legacyModD.v1BuildBudget) ||
      0;
    if (legacyMonthly > 0 || legacyOneOff > 0) {
      monthlyTechStackCost = legacyMonthly;
      oneOffBuildCost = legacyOneOff;
      hasExplicit = true;
    }
  }

  const rawChannelFee = modD?.channelMatrix?.estimatedBlendedFeePercent;
  const channelBlendedFeePercent =
    rawChannelFee !== undefined && rawChannelFee !== null && !Number.isNaN(Number(rawChannelFee))
      ? Math.max(0, Number(rawChannelFee))
      : null;

  return {
    hasExplicitTechStackCosts: hasExplicit,
    monthlyTechStackCost: Math.round(monthlyTechStackCost * 100) / 100,
    oneOffBuildCost: Math.round(oneOffBuildCost * 100) / 100,
    unitBuildCogs: Math.round(unitBuildCogs * 100) / 100,
    channelBlendedFeePercent,
  };
}

export interface ExtractedModuleECosts {
  monthlyPremisesCost: number;
  monthlyLeasedEquipmentCost: number;
  monthlyInsuranceCost: number | null;
  unitOrderFulfillmentCost: number;
  totalPurchasedCapExExVat: number;
  totalAlreadyOwnedAssetValue: number;
}

export function extractModuleECosts(
  modE?: SavedModuleEData | null
): ExtractedModuleECosts {
  const premises = modE?.premisesAndEquipment;
  const monthlyPremisesCost =
    Number(premises?.monthlyPremisesAndUtilitiesCost) ||
    Number(
      (premises as unknown as Record<string, unknown> | undefined)
        ?.monthlyRentOrFee
    ) ||
    0;

  const stages = Array.isArray(modE?.operationsBlueprint?.orderLifecycleStages)
    ? modE!.operationsBlueprint!.orderLifecycleStages
    : [];
  const unitOrderFulfillmentCost = stages.reduce(
    (sum, st) => sum + Math.max(0, Number(st.directVariableCostPerOrder) || 0),
    0
  );

  const equipmentItems = Array.isArray(premises?.equipmentItems)
    ? premises!.equipmentItems
    : [];
  let totalPurchasedCapExExVat = 0;
  let totalAlreadyOwnedAssetValue = 0;
  let monthlyLeasedEquipmentCost = 0;

  for (const item of equipmentItems) {
    const rawTotal =
      Number(item.totalCostExVat) ||
      (Number(item.quantity) || 1) * (Number(item.unitCostExVat) || 0);
    if (rawTotal <= 0) continue;

    if (
      item.acquisitionMode === 'ALREADY_OWNED_BYOD' ||
      item.acquisitionMode === 'ALREADY_OWNED_SWEAT_ASSET' ||
      item.quoteComplianceStatus === 'ALREADY_OWNED_EXEMPT'
    ) {
      totalAlreadyOwnedAssetValue += rawTotal;
      continue;
    }

    if (
      item.acquisitionMode === 'LEASE_OR_RENT_MONTHLY' ||
      item.acquisitionMode === 'LEASE_HIRE_PURCHASE' ||
      item.fundingSource === 'MONTHLY_OPERATING_EXPENSE'
    ) {
      const lifeMonths = Math.max(12, Number(item.usefulLifeMonths) || 36);
      monthlyLeasedEquipmentCost += Math.round(rawTotal / lifeMonths);
      continue;
    }

    totalPurchasedCapExExVat += rawTotal;
  }

  const rawAnnualInsurance =
    modE?.permitsAndInsurance?.estimatedAnnualInsurancePremium;
  const monthlyInsuranceCost =
    rawAnnualInsurance !== undefined &&
    rawAnnualInsurance !== null &&
    Number(rawAnnualInsurance) > 0
      ? Math.round(Number(rawAnnualInsurance) / 12)
      : null;

  return {
    monthlyPremisesCost: Math.round(monthlyPremisesCost),
    monthlyLeasedEquipmentCost: Math.round(monthlyLeasedEquipmentCost),
    monthlyInsuranceCost,
    unitOrderFulfillmentCost: Math.round(unitOrderFulfillmentCost * 100) / 100,
    totalPurchasedCapExExVat: Math.round(totalPurchasedCapExExVat),
    totalAlreadyOwnedAssetValue: Math.round(totalAlreadyOwnedAssetValue),
  };
}

export function computeMonthlyUnitFrictionAndCogs(params: {
  monthlyAccrualNetPrice: number;
  monthlyAccrualGrossPrice: number;
  dominantBillingCadence?: NormalizedBillingCadence;
  paymentGatewayPercent?: number;
  paymentGatewayFixedCents?: number;
  directVariableCogsPerUnit?: number;
  disputeRefundBufferPercent?: number;
  affiliateCommissionPercent?: number;
}): {
  gatewayFeeMonthly: number;
  refundAndAffiliateMonthly: number;
  directVariableCogsMonthly: number;
  totalMonthlyUnitCogsAndFees: number;
  monthlyPocketProfitPerCustomer: number;
} {
  const net = Math.max(0, Number(params.monthlyAccrualNetPrice) || 0);
  const gross = Math.max(net, Number(params.monthlyAccrualGrossPrice) || net);
  const cadenceMult = getCadenceMonthsMultiplier(params.dominantBillingCadence);

  const gwPct = Math.max(0, Number(params.paymentGatewayPercent ?? 1.7));
  const gwFixedEurPerInvoice =
    Math.max(0, Number(params.paymentGatewayFixedCents ?? 25)) / 100;
  // Fixed gateway cents happen once per invoice (1x/yr for ANNUAL -> /12 per month)
  const gatewayFeeMonthly =
    Math.round(
      (gross * (gwPct / 100) + gwFixedEurPerInvoice / cadenceMult) * 100
    ) / 100;

  const refundPct = Math.max(0, Number(params.disputeRefundBufferPercent ?? 1));
  const affiliatePct = Math.max(
    0,
    Number(params.affiliateCommissionPercent ?? 0)
  );
  const refundAndAffiliateMonthly =
    Math.round(net * ((refundPct + affiliatePct) / 100) * 100) / 100;

  const directVariableCogsMonthly =
    Math.round(Math.max(0, Number(params.directVariableCogsPerUnit ?? 0)) * 100) /
    100;

  const totalMonthlyUnitCogsAndFees =
    Math.round(
      (gatewayFeeMonthly +
        refundAndAffiliateMonthly +
        directVariableCogsMonthly) *
        100
    ) / 100;

  const monthlyPocketProfitPerCustomer = Math.max(
    0,
    Math.round((net - totalMonthlyUnitCogsAndFees) * 100) / 100
  );

  return {
    gatewayFeeMonthly,
    refundAndAffiliateMonthly,
    directVariableCogsMonthly,
    totalMonthlyUnitCogsAndFees,
    monthlyPocketProfitPerCustomer,
  };
}

// ============================================================================
// MODULE F COMPENSATION, PRO-RATA QUARTERS & PER-FOUNDER SURVIVAL OFFSET (#9)
// ============================================================================

export function getQuarterStartMonthInYear(
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | string | null
): number {
  if (quarter === 'Q2') return 4;
  if (quarter === 'Q3') return 7;
  if (quarter === 'Q4') return 10;
  return 1;
}

export function getQuarterProRataYearFactor(
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | string | null
): number {
  if (quarter === 'Q2') return 0.75;
  if (quarter === 'Q3') return 0.5;
  if (quarter === 'Q4') return 0.25;
  return 1.0;
}

export function computeNetMonthlySurvivalForFounder(
  b: FounderSurvivalBudgetItem
): number {
  const core =
    (Number(b.housingAndUtilities) || 0) +
    (Number(b.groceriesAndEssentials) || 0) +
    (Number(b.transportAndCommute) || 0) +
    (Number(b.debtAndLoanCommitments) || 0) +
    (Number(b.dependentsAndFamily) || 0);
  return Math.max(0, Math.round(core - (Number(b.incomeOffsetCushion) || 0)));
}

/**
 * Conservative statutory PAYE net take-home estimator (IE PAYE/USC/PRSI vs UK PAYE/NIC vs ROW)
 * used strictly to warn founders when their scheduled Step 5 gross salary yields less net cash
 * than their Step 3 Personal Survival Budget.
 */
export function estimateMonthlyNetTakeHomeFromGrossAnnual(
  grossAnnualSalary: number,
  hqCountryCode: string = 'IE'
): number {
  const gross = Math.max(0, Number(grossAnnualSalary) || 0);
  if (gross <= 0) return 0;
  const country = (hqCountryCode || 'IE').toUpperCase();

  if (country === 'IE') {
    // Ireland: ~20% standard band up to €44,000 + ~40% above + ~4.1% PRSI + ~3% blended USC, minus €4,000 personal/PAYE tax credits
    const incomeTax =
      gross <= 44000
        ? Math.max(0, gross * 0.2 - 4000)
        : Math.max(0, 44000 * 0.2 + (gross - 44000) * 0.4 - 4000);
    const prsi = gross > 18304 ? gross * 0.041 : 0;
    const usc =
      gross <= 13000
        ? 0
        : Math.min(gross, 25760) * 0.015 + Math.max(0, gross - 25760) * 0.03;
    return Math.max(0, Math.round((gross - incomeTax - prsi - usc) / 12));
  }

  if (country === 'GB' || country === 'UK') {
    // UK: £12,570 personal allowance, 20% basic rate up to £50,270, 40% higher, 8% employee NIC above £12,570
    const taxable = Math.max(0, gross - 12570);
    const incomeTax =
      taxable <= 37700
        ? taxable * 0.2
        : 37700 * 0.2 + (taxable - 37700) * 0.4;
    const nic =
      taxable <= 37700
        ? taxable * 0.08
        : 37700 * 0.08 + (taxable - 37700) * 0.02;
    return Math.max(0, Math.round((gross - incomeTax - nic) / 12));
  }

  // Generic progressive approximation (~22% effective up to 60k, 30% above)
  const netAnnual =
    gross <= 60000 ? gross * 0.78 : 60000 * 0.78 + (gross - 60000) * 0.68;
  return Math.max(0, Math.round(netAnnual / 12));
}

export function matchRoleToExistingFounder(
  role: PlannedRoleItem,
  teamMembers: TeamMemberProfileItem[] = [],
  founderBudgets: FounderSurvivalBudgetItem[] = []
): {
  isExistingFounder: boolean;
  matchedMemberId?: string;
  matchedMemberName?: string;
} {
  const roleAny = role as unknown as Record<string, unknown>;
  if (roleAny.isExistingFounder === false) {
    return { isExistingFounder: false };
  }

  if (role.id.startsWith('role_team_')) {
    const rawSuffix = role.id.slice('role_team_'.length);
    const byId = teamMembers.find((m, idx) => (m.id || String(idx)) === rawSuffix);
    if (byId) {
      const isFounderClass =
        !byId.roleClassification ||
        byId.roleClassification === 'FOUNDER_PROMOTER' ||
        Boolean(byId.isCurrentUserFounder);
      return {
        isExistingFounder: isFounderClass,
        matchedMemberId: byId.id,
        matchedMemberName: byId.fullName,
      };
    }
    const budgetById = founderBudgets.find((b) => b.memberId === rawSuffix);
    if (budgetById) {
      return {
        isExistingFounder: true,
        matchedMemberId: budgetById.memberId,
        matchedMemberName: budgetById.memberName,
      };
    }
    return { isExistingFounder: true, matchedMemberId: rawSuffix };
  }

  if (roleAny.isExistingFounder === true) {
    return {
      isExistingFounder: true,
      matchedMemberName: role.title,
    };
  }

  const lowerTitle = (role.title || '').trim().toLowerCase();
  if (lowerTitle) {
    for (const member of teamMembers) {
      const mName = (member.fullName || '').trim().toLowerCase();
      if (
        mName &&
        (lowerTitle === mName || lowerTitle.startsWith(`${mName} —`) || lowerTitle.startsWith(`${mName} -`))
      ) {
        const isFounderClass =
          !member.roleClassification ||
          member.roleClassification === 'FOUNDER_PROMOTER' ||
          Boolean(member.isCurrentUserFounder);
        return {
          isExistingFounder: isFounderClass,
          matchedMemberId: member.id,
          matchedMemberName: member.fullName,
        };
      }
    }
  }

  return { isExistingFounder: false };
}

export interface FounderSalaryBelowSurvivalWarning {
  roleId: string;
  memberId?: string;
  memberName: string;
  yearScheduled: 1 | 2 | 3;
  grossAnnualSalary: number;
  estimatedMonthlyNetTakeHome: number;
  monthlySurvivalBudget: number;
  monthlyShortfall: number;
}

export interface CompensationMonthItem {
  month: number; // 1..36
  year: 1 | 2 | 3;
  founderDrawingsOutflow: number; // 0% employer tax
  taxablePayeGrossSalaries: number; // PAYE employees + PAYE founders
  nonTaxableContractorSpend: number; // CONTRACTOR_RETAINER roles + annual contractor budget / 12
  employerPayrollTaxAndPension: number; // Applied strictly to taxablePayeGrossSalaries
  totalCompensationCashOutflow: number;
}

export interface CompensationYearSummary {
  year: 1 | 2 | 3;
  annualFounderDrawings: number;
  annualTaxablePayeGross: number;
  annualNonTaxableContractors: number;
  annualEmployerTaxAndPension: number;
  annualTotalCashOutflow: number;
  monthlyFounderDrawingsAvg: number;
  monthlyTaxablePayeGrossAvg: number;
  monthlyNonTaxableContractorsAvg: number;
  monthlyTeamSalariesAndContractorsAvg: number;
  monthlyEmployerTaxAvg: number;
  monthlyTotalCompensationAvg: number;
}

export interface ModuleFCompensationScheduleResult {
  employerPayrollTaxPercent: number;
  employerWorkplacePensionPercent: number;
  totalEmployerBurdenPercent: number;
  canonicalMonthlySurvivalTotal: number;
  hasExplicitSurvivalBudgets: boolean;
  hasExplicitHiringRoles: boolean;
  months36: CompensationMonthItem[];
  years: Record<1 | 2 | 3, CompensationYearSummary>;
  founderSalaryWarnings: FounderSalaryBelowSurvivalWarning[];
}

export function computeModuleFCompensationSchedule(
  modF?: SavedModuleFData | null,
  hqCountryCode: string = 'IE'
): ModuleFCompensationScheduleResult {
  const country = (hqCountryCode || 'IE').toUpperCase();
  const rulePack = getCountryRulePack(country);
  const employerPayrollTaxPercent = rulePack.employerPayrollTaxPercent; // e.g., 11.15 IE, 13.8 GB, 7.65 US
  const employerWorkplacePensionPercent =
    country === 'GB' || country === 'UK' ? 3.0 : 0.0;
  const totalEmployerBurdenPercent =
    Math.round(
      (employerPayrollTaxPercent + employerWorkplacePensionPercent) * 100
    ) / 100;

  const teamMembers = modF?.promoterProfiles?.teamMembers || [];
  const rawBudgets = modF?.step3SurvivalBudgetData?.founderBudgets || [];
  const step5 = modF?.step5HiringPlanData;
  const roles = Array.isArray(step5?.roles) ? step5!.roles : [];

  const hasExplicitSurvivalBudgets = rawBudgets.length > 0;
  const hasExplicitHiringRoles = roles.length > 0;

  // Build normalized founder survival entries
  interface NormalizedFounderUnit {
    key: string;
    memberId?: string;
    memberName: string;
    monthlySurvival: number;
    matchedRoles: PlannedRoleItem[];
  }

  const founderUnits: NormalizedFounderUnit[] = [];
  if (rawBudgets.length > 0) {
    for (let i = 0; i < rawBudgets.length; i++) {
      const b = rawBudgets[i];
      founderUnits.push({
        key: b.memberId || `founder_${i}`,
        memberId: b.memberId,
        memberName: b.memberName || `Founder #${i + 1}`,
        monthlySurvival: computeNetMonthlySurvivalForFounder(b),
        matchedRoles: [],
      });
    }
  } else {
    const defaultSurvival = country === 'GB' || country === 'UK' ? 2200 : 2500;
    const founderPromoters = teamMembers.filter(
      (m) =>
        !m.roleClassification ||
        m.roleClassification === 'FOUNDER_PROMOTER' ||
        Boolean(m.isCurrentUserFounder)
    );
    if (founderPromoters.length > 0) {
      founderUnits.push({
        key: founderPromoters[0].id || 'founder_0',
        memberId: founderPromoters[0].id,
        memberName: founderPromoters[0].fullName || 'Lead Founder',
        monthlySurvival: defaultSurvival,
        matchedRoles: [],
      });
    } else {
      founderUnits.push({
        key: 'founder_default',
        memberName: 'Lead Founder',
        monthlySurvival: defaultSurvival,
        matchedRoles: [],
      });
    }
  }

  const nonFounderRoles: PlannedRoleItem[] = [];
  for (const role of roles) {
    const match = matchRoleToExistingFounder(role, teamMembers, rawBudgets);
    if (match.isExistingFounder) {
      let targetUnit = founderUnits.find(
        (u) =>
          (match.matchedMemberId && u.memberId === match.matchedMemberId) ||
          (match.matchedMemberName &&
            u.memberName.trim().toLowerCase() ===
              match.matchedMemberName.trim().toLowerCase())
      );
      if (!targetUnit && founderUnits.length === 1) {
        targetUnit = founderUnits[0];
      }
      if (!targetUnit) {
        targetUnit = {
          key: match.matchedMemberId || role.id,
          memberId: match.matchedMemberId,
          memberName: match.matchedMemberName || role.title || 'Co-Founder',
          monthlySurvival: 0,
          matchedRoles: [],
        };
        founderUnits.push(targetUnit);
      }
      targetUnit.matchedRoles.push(role);
    } else {
      nonFounderRoles.push(role);
    }
  }

  const canonicalMonthlySurvivalTotal = founderUnits.reduce(
    (s, u) => s + u.monthlySurvival,
    0
  );

  // Check for founder Step 5 PAYE salary whose estimated net take-home is below Step 3 survival budget
  const founderSalaryWarnings: FounderSalaryBelowSurvivalWarning[] = [];
  for (const unit of founderUnits) {
    if (unit.monthlySurvival <= 0) continue;
    for (const r of unit.matchedRoles) {
      if (
        r.compensationModel === 'PURE_SWEAT_EQUITY' ||
        r.compensationModel === 'ADVISORY_EQUITY'
      ) {
        continue;
      }
      const gross = Number(r.grossAnnualSalary) || 0;
      if (gross <= 0) continue;
      const estimatedNet =
        r.employmentMode === 'CONTRACTOR_RETAINER'
          ? Math.round(gross / 12)
          : estimateMonthlyNetTakeHomeFromGrossAnnual(gross, country);
      if (estimatedNet < unit.monthlySurvival) {
        founderSalaryWarnings.push({
          roleId: r.id,
          memberId: unit.memberId,
          memberName: unit.memberName,
          yearScheduled: r.yearScheduled,
          grossAnnualSalary: gross,
          estimatedMonthlyNetTakeHome: estimatedNet,
          monthlySurvivalBudget: unit.monthlySurvival,
          monthlyShortfall: unit.monthlySurvival - estimatedNet,
        });
      }
    }
  }

  const isRoleActiveInMonth = (role: PlannedRoleItem, m: number): boolean => {
    const startM =
      (Math.max(1, Math.min(3, Number(role.yearScheduled) || 1)) - 1) * 12 +
      getQuarterStartMonthInYear(role.targetQuarter);
    return m >= startM;
  };

  const cBudgetY1 = Math.max(0, Number(step5?.contractorBudgetYear1) || 0);
  const cBudgetY2 = Math.max(0, Number(step5?.contractorBudgetYear2) || 0);
  const cBudgetY3 = Math.max(0, Number(step5?.contractorBudgetYear3) || 0);

  const months36: CompensationMonthItem[] = [];

  for (let m = 1; m <= 36; m++) {
    const year: 1 | 2 | 3 = m <= 12 ? 1 : m <= 24 ? 2 : 3;
    let founderDrawingsOutflow = 0;
    let taxablePayeGrossSalaries = 0;
    let nonTaxableContractorSpend =
      (year === 1 ? cBudgetY1 : year === 2 ? cBudgetY2 : cBudgetY3) / 12;

    // 1. Per-founder rule (Decision #3): active Step 5 salary > 0 replaces Step 3 survival drawings
    for (const unit of founderUnits) {
      const activePaidFounderRoles = unit.matchedRoles.filter(
        (r) =>
          isRoleActiveInMonth(r, m) &&
          r.compensationModel !== 'PURE_SWEAT_EQUITY' &&
          r.compensationModel !== 'ADVISORY_EQUITY' &&
          (Number(r.grossAnnualSalary) || 0) > 0
      );

      if (activePaidFounderRoles.length > 0) {
        for (const r of activePaidFounderRoles) {
          const monthlyGross = (Number(r.grossAnnualSalary) || 0) / 12;
          if (r.employmentMode === 'CONTRACTOR_RETAINER') {
            nonTaxableContractorSpend += monthlyGross;
          } else {
            taxablePayeGrossSalaries += monthlyGross;
          }
        }
      } else {
        founderDrawingsOutflow += unit.monthlySurvival;
      }
    }

    // 2. Non-founder roles (quarter pro-rated by exact start month; contractors never incur PAYE tax)
    for (const r of nonFounderRoles) {
      if (!isRoleActiveInMonth(r, m)) continue;
      if (
        r.compensationModel === 'PURE_SWEAT_EQUITY' ||
        r.compensationModel === 'ADVISORY_EQUITY'
      ) {
        continue;
      }
      const monthlyGross = (Number(r.grossAnnualSalary) || 0) / 12;
      if (monthlyGross <= 0) continue;
      if (r.employmentMode === 'CONTRACTOR_RETAINER') {
        nonTaxableContractorSpend += monthlyGross;
      } else {
        taxablePayeGrossSalaries += monthlyGross;
      }
    }

    const roundedDrawings = Math.round(founderDrawingsOutflow);
    const roundedTaxablePaye = Math.round(taxablePayeGrossSalaries);
    const roundedContractors = Math.round(nonTaxableContractorSpend);
    const employerPayrollTaxAndPension = Math.round(
      roundedTaxablePaye * (totalEmployerBurdenPercent / 100)
    );
    const totalCompensationCashOutflow =
      roundedDrawings +
      roundedTaxablePaye +
      roundedContractors +
      employerPayrollTaxAndPension;

    months36.push({
      month: m,
      year,
      founderDrawingsOutflow: roundedDrawings,
      taxablePayeGrossSalaries: roundedTaxablePaye,
      nonTaxableContractorSpend: roundedContractors,
      employerPayrollTaxAndPension,
      totalCompensationCashOutflow,
    });
  }

  const buildYearSummary = (yr: 1 | 2 | 3): CompensationYearSummary => {
    const slice = months36.filter((row) => row.year === yr);
    const annualFounderDrawings = slice.reduce(
      (s, r) => s + r.founderDrawingsOutflow,
      0
    );
    const annualTaxablePayeGross = slice.reduce(
      (s, r) => s + r.taxablePayeGrossSalaries,
      0
    );
    const annualNonTaxableContractors = slice.reduce(
      (s, r) => s + r.nonTaxableContractorSpend,
      0
    );
    const annualEmployerTaxAndPension = slice.reduce(
      (s, r) => s + r.employerPayrollTaxAndPension,
      0
    );
    const annualTotalCashOutflow = slice.reduce(
      (s, r) => s + r.totalCompensationCashOutflow,
      0
    );

    return {
      year: yr,
      annualFounderDrawings,
      annualTaxablePayeGross,
      annualNonTaxableContractors,
      annualEmployerTaxAndPension,
      annualTotalCashOutflow,
      monthlyFounderDrawingsAvg: Math.round(annualFounderDrawings / 12),
      monthlyTaxablePayeGrossAvg: Math.round(annualTaxablePayeGross / 12),
      monthlyNonTaxableContractorsAvg: Math.round(
        annualNonTaxableContractors / 12
      ),
      monthlyTeamSalariesAndContractorsAvg: Math.round(
        (annualTaxablePayeGross + annualNonTaxableContractors) / 12
      ),
      monthlyEmployerTaxAvg: Math.round(annualEmployerTaxAndPension / 12),
      monthlyTotalCompensationAvg: Math.round(annualTotalCashOutflow / 12),
    };
  };

  return {
    employerPayrollTaxPercent,
    employerWorkplacePensionPercent,
    totalEmployerBurdenPercent,
    canonicalMonthlySurvivalTotal,
    hasExplicitSurvivalBudgets,
    hasExplicitHiringRoles,
    months36,
    years: {
      1: buildYearSummary(1),
      2: buildYearSummary(2),
      3: buildYearSummary(3),
    },
    founderSalaryWarnings,
  };
}

// ============================================================================
// MODULE B MARKET SIZING PARSER (Shared by Business Plan Studio & Grant Copilot)
// ============================================================================

export function computeModuleBMarketSizingTotals(
  modB?: SavedModuleBData | null
): {
  hasMarketSizingData: boolean;
  tamAnnual: number;
  samAnnual: number;
  somAnnual: number;
} {
  const segments = modB?.marketSizing?.segments || [];
  let samAnnual = 0;
  let somAnnual = 0;

  for (const seg of segments) {
    const rawPrice =
      parseFloat(String(seg.pricePerCustomerInput || '').replace(/[^0-9.]/g, '')) ||
      0;
    const cadenceUpper = String(seg.billingCadence || '').toUpperCase();
    const annualPricePerCustomer =
      cadenceUpper === 'MONTHLY_SUBSCRIPTION'
        ? rawPrice * 12
        : cadenceUpper === 'QUARTERLY_SUBSCRIPTION' || cadenceUpper === 'QUARTERLY'
          ? rawPrice * 4
          : rawPrice;
    const reachable =
      parseInt(
        String(seg.reachableCustomersInTargetMarketsInput || '').replace(
          /[^0-9]/g,
          ''
        ),
        10
      ) || 0;
    const year1Goal =
      parseInt(
        String(seg.year1To2CustomerGoalInput || '').replace(/[^0-9]/g, ''),
        10
      ) || 0;

    samAnnual += annualPricePerCustomer * reachable;
    somAnnual += annualPricePerCustomer * year1Goal;
  }

  const multPreset = modB?.marketSizing?.widerMarketMultiplier || '5X';
  const multMap: Record<string, number> = {
    '2X': 2,
    '5X': 5,
    '10X': 10,
    '20X': 20,
    OTHER: 5,
  };
  const multiplier = multMap[multPreset] ?? 5;
  const tamAnnual = samAnnual * multiplier;

  return {
    hasMarketSizingData: samAnnual > 0 || somAnnual > 0,
    tamAnnual: Math.round(tamAnnual),
    samAnnual: Math.round(samAnnual),
    somAnnual: Math.round(somAnnual),
  };
}

/**
 * Lightweight 3-Year P&L & Cashflow Trough estimator for server-side actions (e.g. Grant Q&A Copilot)
 * reading directly from SavedModuleFData, SavedModuleHData, SavedModuleJData, SavedModuleDData, SavedModuleEData.
 */
export function computeDeterministicPlanFinancialSummary(
  plan: Partial<ActiveStartupPlan>,
  overrides?: {
    modD?: SavedModuleDData | null;
    modE?: SavedModuleEData | null;
    modF?: SavedModuleFData | null;
    modH?: SavedModuleHData | null;
    modJ?: Partial<ActiveStartupPlan['moduleJData']> | null;
  }
): {
  hasFinancialInputs: boolean;
  year1Revenue: number;
  year2Revenue: number;
  year3Revenue: number;
  year1OperatingProfit: number;
  year2OperatingProfit: number;
  year3OperatingProfit: number;
  peakCashflowTrough: number;
  breakevenMonthlyCustomers: number;
  grossMarginPercent: number;
} {
  const country = (plan.hqCountryCode || 'IE').toUpperCase();
  const isUK = country === 'GB' || country === 'UK';
  const defaultVat = isUK ? 20 : 23;

  const modD = overrides?.modD ?? plan.moduleDData;
  const modE = overrides?.modE ?? plan.moduleEData;
  const modF = overrides?.modF ?? plan.moduleFData;
  const modH = overrides?.modH ?? plan.moduleHData;
  const modJ = overrides?.modJ ?? plan.moduleJData;

  const hasFinancialInputs = Boolean(
    modH?.step2PricingTiers ||
      modH?.step3BreakevenCalculator ||
      modJ?.step1OverheadsTax ||
      modJ?.step3CashflowGap
  );

  const pricing = computeModuleHBlendedPricing(modH, defaultVat);
  const modDCosts = extractModuleDCosts(modD);
  const modECosts = extractModuleECosts(modE);
  const comp = computeModuleFCompensationSchedule(modF, country);

  const friction = modH?.step3BreakevenCalculator?.frictionCosts;
  const unitCogsAndFees = computeMonthlyUnitFrictionAndCogs({
    monthlyAccrualNetPrice: pricing.effectiveMonthlyAccrualNetPrice,
    monthlyAccrualGrossPrice: pricing.effectiveMonthlyAccrualGrossPrice,
    dominantBillingCadence: pricing.dominantBillingCadence,
    paymentGatewayPercent:
      friction?.paymentGatewayPercent ?? modDCosts.channelBlendedFeePercent ?? 1.7,
    paymentGatewayFixedCents: friction?.paymentGatewayFixedCents ?? 25,
    directVariableCogsPerUnit:
      friction?.directVariableCogsPerUnit ??
      (modDCosts.unitBuildCogs + modECosts.unitOrderFulfillmentCost),
    disputeRefundBufferPercent: friction?.disputeRefundBufferPercent ?? 1,
    affiliateCommissionPercent: friction?.affiliateCommissionPercent ?? 0,
  });

  const step1J = modJ?.step1OverheadsTax;
  const fixedOpExY1 = step1J?.overheadLineItems?.length
    ? step1J.overheadLineItems.reduce(
        (s, i) => s + (Number(i.monthlyCostYear1) || 0),
        0
      )
    : modECosts.monthlyPremisesCost +
      modECosts.monthlyLeasedEquipmentCost +
      (modDCosts.hasExplicitTechStackCosts ? modDCosts.monthlyTechStackCost : 120) +
      (modECosts.monthlyInsuranceCost ?? 60) +
      230;

  const fixedOpExY2 = Math.round(fixedOpExY1 * 1.2);
  const fixedOpExY3 = Math.round(fixedOpExY2 * 1.25);

  const totalMonthlyFixedY1 =
    fixedOpExY1 + comp.years[1].monthlyTotalCompensationAvg;

  const breakevenMonthlyCustomers =
    unitCogsAndFees.monthlyPocketProfitPerCustomer > 0
      ? Math.ceil(
          totalMonthlyFixedY1 / unitCogsAndFees.monthlyPocketProfitPerCustomer
        )
      : 0;

  const avgY1Customers =
    Number(modH?.step3BreakevenCalculator?.activeCustomerSlider) ||
    Math.max(1, breakevenMonthlyCustomers || 25);
  const avgY2Customers = Math.max(
    avgY1Customers + 5,
    Math.round(avgY1Customers * 1.65)
  );
  const avgY3Customers = Math.max(
    avgY2Customers + 10,
    Math.round(avgY1Customers * 2.45)
  );

  const startMonth = Math.max(
    1,
    Math.min(12, Number(modJ?.step2WorkingCapital?.monthToStartRevenue) || 1)
  );
  const activeY1Months = Math.max(1, 12 - startMonth + 1);

  const year1Revenue = Math.round(
    avgY1Customers * pricing.effectiveMonthlyAccrualNetPrice * activeY1Months
  );
  const year2Revenue = Math.round(
    avgY2Customers * pricing.effectiveMonthlyAccrualNetPrice * 12
  );
  const year3Revenue = Math.round(
    avgY3Customers * pricing.effectiveMonthlyAccrualNetPrice * 12
  );

  const y1DirectCogs = Math.round(
    avgY1Customers * unitCogsAndFees.totalMonthlyUnitCogsAndFees * activeY1Months
  );
  const y2DirectCogs = Math.round(
    avgY2Customers * unitCogsAndFees.totalMonthlyUnitCogsAndFees * 12
  );
  const y3DirectCogs = Math.round(
    avgY3Customers * unitCogsAndFees.totalMonthlyUnitCogsAndFees * 12
  );

  const year1OperatingProfit =
    year1Revenue -
    y1DirectCogs -
    fixedOpExY1 * 12 -
    comp.years[1].annualTotalCashOutflow;
  const year2OperatingProfit =
    year2Revenue -
    y2DirectCogs -
    fixedOpExY2 * 12 -
    comp.years[2].annualTotalCashOutflow;
  const year3OperatingProfit =
    year3Revenue -
    y3DirectCogs -
    fixedOpExY3 * 12 -
    comp.years[3].annualTotalCashOutflow;

  const grossMarginPercent =
    pricing.effectiveMonthlyAccrualNetPrice > 0
      ? Math.max(
          0,
          Math.min(
            99,
            Math.round(
              (unitCogsAndFees.monthlyPocketProfitPerCustomer /
                pricing.effectiveMonthlyAccrualNetPrice) *
                100
            )
          )
        )
      : 0;

  // Approximate operating cash trough across Year 1
  const upfrontOutflow =
    (Number(step1J?.totalCapExEquipmentValue) || modECosts.totalPurchasedCapExExVat) +
    modDCosts.oneOffBuildCost;
  let runningCash = -upfrontOutflow;
  let minCash = runningCash;
  for (let m = 1; m <= 12; m++) {
    const rev =
      m < startMonth
        ? 0
        : avgY1Customers * pricing.effectiveMonthlyAccrualNetPrice;
    const cogs =
      m < startMonth
        ? 0
        : avgY1Customers * unitCogsAndFees.totalMonthlyUnitCogsAndFees;
    const opBurn = fixedOpExY1 + comp.months36[m - 1].totalCompensationCashOutflow;
    runningCash += rev - cogs - opBurn;
    if (runningCash < minCash) minCash = runningCash;
  }

  return {
    hasFinancialInputs,
    year1Revenue,
    year2Revenue,
    year3Revenue,
    year1OperatingProfit,
    year2OperatingProfit,
    year3OperatingProfit,
    peakCashflowTrough: Math.abs(Math.min(0, Math.round(minCash))),
    breakevenMonthlyCustomers,
    grossMarginPercent,
  };
}
