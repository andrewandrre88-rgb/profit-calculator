import {
  SourcingQuote,
  QuoteCalculationSummary,
  UnitCalculation,
  ExchangeRates,
  ProductItem,
} from '../types';
import { convertCurrency } from './currencies';

export function calculateQuote(
  quote: SourcingQuote,
  rates: ExchangeRates,
  fxBufferPercent: number = 0
): QuoteCalculationSummary {
  const { targetCurrency } = quote;

  const totalQuantity = quote.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalPhysicalWeightKg = quote.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitWeightKg) || 0),
    0
  );

  // 1. Calculate Product Items
  const itemCalculations: UnitCalculation[] = [];
  let productTotalCost = 0;
  let productTotalProfit = 0;
  let productClientTotal = 0;

  quote.items.forEach((item: ProductItem) => {
    const qty = Number(item.quantity) || 1;
    const baseFactoryPrice = Number(item.factoryCostPerUnit) || 0;
    const packagingPrice = Number(item.packagingCostPerUnit) || 0;

    // Convert factory unit price + packaging into target currency
    const factoryInTarget = convertCurrency(
      baseFactoryPrice,
      item.factoryCostCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );

    const packagingInTarget = packagingPrice
      ? convertCurrency(
          packagingPrice,
          item.packagingCurrency || item.factoryCostCurrency,
          targetCurrency,
          rates,
          fxBufferPercent
        )
      : 0;

    const unitFactoryCost = factoryInTarget + packagingInTarget;

    // Calculate agent profit on product
    let unitProductProfit = 0;
    if (item.profitType === 'fixed') {
      // Fixed per unit margin (e.g. 0.34 RMB or $0.05 USD)
      unitProductProfit = convertCurrency(
        Number(item.profitPerUnit) || 0,
        item.factoryCostCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      );
    } else {
      // Percentage margin
      const pct = (Number(item.profitPerUnit) || 0) / 100;
      unitProductProfit = unitFactoryCost * pct;
    }

    const clientProductPrice = unitFactoryCost + unitProductProfit;

    const lineCost = unitFactoryCost * qty;
    const lineProfit = unitProductProfit * qty;
    const lineClientPrice = clientProductPrice * qty;

    productTotalCost += lineCost;
    productTotalProfit += lineProfit;
    productClientTotal += lineClientPrice;

    itemCalculations.push({
      productId: item.id,
      productName: item.name || 'Unnamed Product',
      quantity: qty,
      factoryCostPerUnit: unitFactoryCost,
      productProfitPerUnit: unitProductProfit,
      clientProductPricePerUnit: clientProductPrice,
      shippingCostPerUnit: 0,
      shippingProfitPerUnit: 0,
      clientShippingPerUnit: 0,
      customsCostPerUnit: 0,
      customsProfitPerUnit: 0,
      clientCustomsPerUnit: 0,
      serviceCostPerUnit: 0,
      serviceProfitPerUnit: 0,
      clientServicePerUnit: 0,
      totalCostPerUnit: unitFactoryCost,
      totalNetProfitPerUnit: unitProductProfit,
      finalClientPricePerUnit: clientProductPrice, // Strictly product unit price! Not combined with shipping
      profitMarginPercent: clientProductPrice > 0 ? (unitProductProfit / clientProductPrice) * 100 : 0,
      totalLineCost: lineCost,
      totalLineProfit: lineProfit,
      totalLineClientPrice: lineClientPrice,
    });
  });

  // 2. Calculate Shipping
  let shippingTotalCost = 0;
  let shippingTotalProfit = 0;
  let shippingClientTotal = 0;

  if (quote.shipping && quote.shipping.enabled) {
    const s = quote.shipping;
    const weightToUse =
      s.grossWeightKg > 0
        ? s.grossWeightKg
        : totalPhysicalWeightKg > 0
        ? totalPhysicalWeightKg
        : 1;

    const chargeableWeight = Math.max(
      weightToUse,
      Number(s.volumetricWeightKg) || 0
    );

    let baseCost = 0;
    if (s.calcBasis === 'per_kg') {
      baseCost = (Number(s.baseCostRate) || 0) * chargeableWeight;
    } else if (s.calcBasis === 'per_cbm') {
      baseCost = (Number(s.baseCostRate) || 0) * (Number(s.cbm) || 1);
    } else if (s.calcBasis === 'per_unit') {
      baseCost = (Number(s.baseCostRate) || 0) * (totalQuantity || 1);
    } else {
      // total_fixed
      baseCost = Number(s.baseCostRate) || 0;
    }

    const baseCostInTarget = convertCurrency(
      baseCost,
      s.costCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );

    let agentProfit = 0;
    if (s.agentProfitType === 'per_kg') {
      const profitPerKgInTarget = convertCurrency(
        Number(s.agentProfitValue) || 0,
        s.costCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      );
      agentProfit = profitPerKgInTarget * chargeableWeight;
    } else if (s.agentProfitType === 'percent') {
      const pct = (Number(s.agentProfitValue) || 0) / 100;
      agentProfit = baseCostInTarget * pct;
    } else {
      // total_fixed
      agentProfit = convertCurrency(
        Number(s.agentProfitValue) || 0,
        s.costCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      );
    }

    shippingTotalCost = baseCostInTarget;
    shippingTotalProfit = agentProfit;
    shippingClientTotal = baseCostInTarget + agentProfit;
  }

  // 3. Calculate Customs & Tariffs
  let customsTotalCost = 0;
  let customsTotalProfit = 0;
  let customsClientTotal = 0;

  if (quote.customs && quote.customs.enabled) {
    const c = quote.customs;
    // Tariff on product value
    const tariffPct = (Number(c.tariffPercent) || 0) / 100;
    const baseTariffCost = productTotalCost * tariffPct;

    const clearanceInTarget = convertCurrency(
      Number(c.customsClearanceFee) || 0,
      c.customsFeeCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );

    const portHandlingInTarget = convertCurrency(
      Number(c.portHandlingFee) || 0,
      c.portFeeCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );

    const rawCustomsCost = baseTariffCost + clearanceInTarget + portHandlingInTarget;

    let agentMarkup = 0;
    if (c.agentMarkupType === 'percent') {
      agentMarkup = rawCustomsCost * ((Number(c.agentMarkupValue) || 0) / 100);
    } else {
      agentMarkup = convertCurrency(
        Number(c.agentMarkupValue) || 0,
        c.customsFeeCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      );
    }

    customsTotalCost = rawCustomsCost;
    customsTotalProfit = agentMarkup;
    customsClientTotal = rawCustomsCost + agentMarkup;
  }

  // 4. Calculate Inspection & Specialized Services
  let servicesTotalCost = 0;
  let servicesTotalProfit = 0;
  let servicesClientTotal = 0;

  if (quote.services && quote.services.length > 0) {
    quote.services.forEach((srv) => {
      let costVal = Number(srv.agentBaseCost) || 0;
      let priceVal = Number(srv.clientPrice) || 0;

      if (srv.unitType === 'per_unit') {
        costVal = costVal * (totalQuantity || 1);
        priceVal = priceVal * (totalQuantity || 1);
      }

      const costInTarget = convertCurrency(
        costVal,
        srv.costCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      );

      const clientInTarget = convertCurrency(
        priceVal,
        srv.clientPriceCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      );

      const profit = Math.max(0, clientInTarget - costInTarget);

      servicesTotalCost += costInTarget;
      servicesTotalProfit += profit;
      servicesClientTotal += clientInTarget;
    });
  }

  // 5. Global Sourcing Fee
  let sourcingFeeNetProfit = 0;
  let sourcingFeeClientTotal = 0;

  if (quote.sourcingFeeType === 'percent_product') {
    const pct = (Number(quote.sourcingFeeValue) || 0) / 100;
    sourcingFeeNetProfit = productClientTotal * pct;
    sourcingFeeClientTotal = sourcingFeeNetProfit;
  } else if (quote.sourcingFeeType === 'per_unit') {
    const perUnit = convertCurrency(
      Number(quote.sourcingFeeValue) || 0,
      quote.sourcingFeeCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );
    sourcingFeeNetProfit = perUnit * totalQuantity;
    sourcingFeeClientTotal = sourcingFeeNetProfit;
  } else if (quote.sourcingFeeType === 'fixed') {
    const fixedFee = convertCurrency(
      Number(quote.sourcingFeeValue) || 0,
      quote.sourcingFeeCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );
    sourcingFeeNetProfit = fixedFee;
    sourcingFeeClientTotal = fixedFee;
  }

  // 6. Grand Totals
  const grandTotalCost =
    productTotalCost + shippingTotalCost + customsTotalCost + servicesTotalCost;

  const grandTotalNetProfit =
    productTotalProfit +
    shippingTotalProfit +
    customsTotalProfit +
    servicesTotalProfit +
    sourcingFeeNetProfit;

  const grandTotalClientPrice =
    productClientTotal +
    shippingClientTotal +
    customsClientTotal +
    servicesClientTotal +
    sourcingFeeClientTotal;

  // Allocate overhead per unit
  const effectiveUnits = totalQuantity > 0 ? totalQuantity : 1;

  const allocatedShippingCostPerUnit = shippingTotalCost / effectiveUnits;
  const allocatedShippingProfitPerUnit = shippingTotalProfit / effectiveUnits;
  const allocatedClientShippingPerUnit = shippingClientTotal / effectiveUnits;

  const allocatedCustomsCostPerUnit = customsTotalCost / effectiveUnits;
  const allocatedCustomsProfitPerUnit = customsTotalProfit / effectiveUnits;
  const allocatedClientCustomsPerUnit = customsClientTotal / effectiveUnits;

  const allocatedServicesCostPerUnit = servicesTotalCost / effectiveUnits;
  const allocatedServicesProfitPerUnit =
    (servicesTotalProfit + sourcingFeeNetProfit) / effectiveUnits;
  const allocatedClientServicesPerUnit =
    (servicesClientTotal + sourcingFeeClientTotal) / effectiveUnits;

  // Store allocated logistics references per unit for optional comparison, but DO NOT combine into product price
  itemCalculations.forEach((item) => {
    item.shippingCostPerUnit = allocatedShippingCostPerUnit;
    item.shippingProfitPerUnit = allocatedShippingProfitPerUnit;
    item.clientShippingPerUnit = allocatedClientShippingPerUnit;

    item.customsCostPerUnit = allocatedCustomsCostPerUnit;
    item.customsProfitPerUnit = allocatedCustomsProfitPerUnit;
    item.clientCustomsPerUnit = allocatedClientCustomsPerUnit;

    item.serviceCostPerUnit = allocatedServicesCostPerUnit;
    item.serviceProfitPerUnit = allocatedServicesProfitPerUnit;
    item.clientServicePerUnit = allocatedClientServicesPerUnit;

    // Pure product unit prices (NOT combined with shipping or customs)
    item.totalCostPerUnit = item.factoryCostPerUnit;
    item.totalNetProfitPerUnit = item.productProfitPerUnit;
    item.finalClientPricePerUnit = item.clientProductPricePerUnit;

    item.profitMarginPercent =
      item.finalClientPricePerUnit > 0
        ? (item.productProfitPerUnit / item.finalClientPricePerUnit) * 100
        : 0;

    item.totalLineCost = item.factoryCostPerUnit * item.quantity;
    item.totalLineProfit = item.productProfitPerUnit * item.quantity;
    item.totalLineClientPrice = item.clientProductPricePerUnit * item.quantity;
  });

  const averageCostPerUnit = totalQuantity > 0 ? productTotalCost / totalQuantity : 0;
  const averageNetProfitPerUnit =
    totalQuantity > 0 ? productTotalProfit / totalQuantity : 0;
  const averageClientPricePerUnit =
    totalQuantity > 0 ? productClientTotal / totalQuantity : 0;
  const overallProfitMarginPercent =
    productClientTotal > 0 ? (productTotalProfit / productClientTotal) * 100 : 0;

  return {
    totalQuantity,
    targetCurrency,
    productTotalCost,
    productTotalProfit,
    productClientTotal,
    shippingTotalCost,
    shippingTotalProfit,
    shippingClientTotal,
    customsTotalCost,
    customsTotalProfit,
    customsClientTotal,
    servicesTotalCost,
    servicesTotalProfit,
    servicesClientTotal,
    sourcingFeeClientTotal,
    sourcingFeeNetProfit,
    grandTotalCost,
    grandTotalNetProfit,
    grandTotalClientPrice,
    averageCostPerUnit,
    averageNetProfitPerUnit,
    averageClientPricePerUnit,
    overallProfitMarginPercent,
    itemCalculations,
  };
}
