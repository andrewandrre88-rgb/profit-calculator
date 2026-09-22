import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Check,
  Package,
} from 'lucide-react';
import { ProductItem, CurrencyCode, MarkupType, ExchangeRates, CurrencySnapshot } from '../types';
import {
  CURRENCY_INFO,
  formatMoney,
  convertCurrency,
  ALL_CURRENCIES,
  KEY_SOURCING_CURRENCIES,
  roundClean,
  formatCardUnit,
} from '../utils/currencies';

interface ProductSectionProps {
  items: ProductItem[];
  onChangeItems: (items: ProductItem[]) => void;
  targetCurrency: CurrencyCode;
  rates: ExchangeRates;
  fxBufferPercent: number;
  isClientView: boolean;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  items,
  onChangeItems,
  targetCurrency,
  rates,
  fxBufferPercent,
  isClientView,
}) => {
  const currencies: CurrencyCode[] = ALL_CURRENCIES;
  // Local string buffer for the Final Quote to Client input so users can type decimals cleanly
  const [editingQuoteValues, setEditingQuoteValues] = useState<Record<string, string>>({});

  const handleAddItem = () => {
    const newItem: ProductItem = {
      id: `item_${Date.now()}`,
      name: `Product Item #${items.length + 1}`,
      quantity: 50000,
      factoryCostCurrency: 'CNY',
      factoryCostPerUnit: 0.30,
      profitType: 'fixed',
      profitPerUnit: 0.05,
      unitWeightKg: 0.02,
      packagingCostPerUnit: 0.0,
      packagingCurrency: 'CNY',
      notes: '',
      anchorCurrency: 'CNY',
      currencySnapshots: {
        CNY: { factoryCost: 0.30, profit: 0.05, packagingCost: 0 },
      },
    };
    onChangeItems([...items, newItem]);
  };

  const handleDuplicateItem = (item: ProductItem) => {
    const clone: ProductItem = {
      ...item,
      id: `item_${Date.now()}`,
      name: `${item.name} (Copy)`,
    };
    onChangeItems([...items, clone]);
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    onChangeItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<ProductItem>) => {
    onChangeItems(
      items.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  // Handle automatic zero-drift currency conversion when changing item currency
  const handleItemCurrencyChange = (itemId: string, newCurrency: CurrencyCode) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.factoryCostCurrency === newCurrency) return;
    const oldCurrency = item.factoryCostCurrency;

    // Snapshot map holding exact values for each currency
    const existingSnapshots: Partial<Record<CurrencyCode, CurrencySnapshot>> = {
      ...(item.currencySnapshots || {}),
    };

    // Determine the anchor currency (the pristine source where values originated)
    const anchorCurrency: CurrencyCode = item.anchorCurrency || oldCurrency;

    // Ensure the current active currency has its current values saved
    if (!existingSnapshots[oldCurrency]) {
      existingSnapshots[oldCurrency] = {
        factoryCost: item.factoryCostPerUnit,
        profit: item.profitPerUnit,
        packagingCost: item.packagingCostPerUnit || 0,
      };
    }

    let newCostPerUnit: number;
    let newProfitPerUnit: number;
    let newPackagingCost: number;

    // If an exact snapshot already exists for newCurrency, restore it directly (0 drift!)
    if (existingSnapshots[newCurrency]) {
      newCostPerUnit = existingSnapshots[newCurrency]!.factoryCost;
      newProfitPerUnit = existingSnapshots[newCurrency]!.profit;
      newPackagingCost = existingSnapshots[newCurrency]!.packagingCost || 0;
    } else {
      // Otherwise convert directly from the anchor currency to prevent compounding hop drift
      const anchorData = existingSnapshots[anchorCurrency] || {
        factoryCost: item.factoryCostPerUnit,
        profit: item.profitPerUnit,
        packagingCost: item.packagingCostPerUnit || 0,
      };

      const rawConvertedCost = convertCurrency(
        anchorData.factoryCost,
        anchorCurrency,
        newCurrency,
        rates,
        0
      );
      newCostPerUnit = roundClean(rawConvertedCost, 6);

      if (item.profitType === 'fixed') {
        const rawConvertedProfit = convertCurrency(
          anchorData.profit,
          anchorCurrency,
          newCurrency,
          rates,
          0
        );
        newProfitPerUnit = roundClean(rawConvertedProfit, 6);
      } else {
        newProfitPerUnit = anchorData.profit;
      }

      if (anchorData.packagingCost) {
        const rawConvertedPkg = convertCurrency(
          anchorData.packagingCost,
          anchorCurrency,
          newCurrency,
          rates,
          0
        );
        newPackagingCost = roundClean(rawConvertedPkg, 6);
      } else {
        newPackagingCost = 0;
      }

      // Record snapshot for newCurrency
      existingSnapshots[newCurrency] = {
        factoryCost: newCostPerUnit,
        profit: newProfitPerUnit,
        packagingCost: newPackagingCost,
      };
    }

    const updates: Partial<ProductItem> = {
      factoryCostCurrency: newCurrency,
      factoryCostPerUnit: newCostPerUnit,
      profitPerUnit: newProfitPerUnit,
      packagingCostPerUnit: newPackagingCost,
      packagingCurrency: newCurrency,
      anchorCurrency: anchorCurrency,
      currencySnapshots: existingSnapshots,
    };

    handleUpdateItem(itemId, updates);
  };

  // Convert all items to a specified currency at once using zero-drift logic
  const handleConvertAllTo = (newCurrency: CurrencyCode) => {
    const updated = items.map((item) => {
      const oldCurrency = item.factoryCostCurrency;
      if (oldCurrency === newCurrency) return item;

      const existingSnapshots: Partial<Record<CurrencyCode, CurrencySnapshot>> = {
        ...(item.currencySnapshots || {}),
      };
      const anchorCurrency: CurrencyCode = item.anchorCurrency || oldCurrency;

      if (!existingSnapshots[oldCurrency]) {
        existingSnapshots[oldCurrency] = {
          factoryCost: item.factoryCostPerUnit,
          profit: item.profitPerUnit,
          packagingCost: item.packagingCostPerUnit || 0,
        };
      }

      let newCostPerUnit: number;
      let newProfitPerUnit: number;
      let newPackagingCost: number;

      if (existingSnapshots[newCurrency]) {
        newCostPerUnit = existingSnapshots[newCurrency]!.factoryCost;
        newProfitPerUnit = existingSnapshots[newCurrency]!.profit;
        newPackagingCost = existingSnapshots[newCurrency]!.packagingCost || 0;
      } else {
        const anchorData = existingSnapshots[anchorCurrency] || {
          factoryCost: item.factoryCostPerUnit,
          profit: item.profitPerUnit,
          packagingCost: item.packagingCostPerUnit || 0,
        };

        const rawConvertedCost = convertCurrency(
          anchorData.factoryCost,
          anchorCurrency,
          newCurrency,
          rates,
          0
        );
        newCostPerUnit = roundClean(rawConvertedCost, 6);

        if (item.profitType === 'fixed') {
          const rawConvertedProfit = convertCurrency(
            anchorData.profit,
            anchorCurrency,
            newCurrency,
            rates,
            0
          );
          newProfitPerUnit = roundClean(rawConvertedProfit, 6);
        } else {
          newProfitPerUnit = anchorData.profit;
        }

        if (anchorData.packagingCost) {
          const rawConvertedPkg = convertCurrency(
            anchorData.packagingCost,
            anchorCurrency,
            newCurrency,
            rates,
            0
          );
          newPackagingCost = roundClean(rawConvertedPkg, 6);
        } else {
          newPackagingCost = 0;
        }

        existingSnapshots[newCurrency] = {
          factoryCost: newCostPerUnit,
          profit: newProfitPerUnit,
          packagingCost: newPackagingCost,
        };
      }

      return {
        ...item,
        factoryCostCurrency: newCurrency,
        factoryCostPerUnit: newCostPerUnit,
        profitPerUnit: newProfitPerUnit,
        packagingCostPerUnit: newPackagingCost,
        packagingCurrency: newCurrency,
        anchorCurrency: anchorCurrency,
        currencySnapshots: existingSnapshots,
      };
    });
    onChangeItems(updated);
  };

  // Quick preset loader specifically for 50k @ 0.30 RMB -> 0.35 RMB
  const handleLoad50kExample = (itemId: string) => {
    handleUpdateItem(itemId, {
      name: 'Custom Product Component (50k Example)',
      quantity: 50000,
      factoryCostCurrency: 'CNY',
      factoryCostPerUnit: 0.30,
      profitType: 'fixed',
      profitPerUnit: 0.05,
      packagingCostPerUnit: 0,
      unitWeightKg: 0.02,
      anchorCurrency: 'CNY',
      currencySnapshots: {
        CNY: { factoryCost: 0.30, profit: 0.05, packagingCost: 0 },
      },
    });
  };

  // Compute total standalone product metrics
  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalFactoryCostInTarget = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const base = Number(item.factoryCostPerUnit) || 0;
    const pkg = Number(item.packagingCostPerUnit) || 0;
    const baseInTarget = convertCurrency(
      base,
      item.factoryCostCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );
    const pkgInTarget = pkg
      ? convertCurrency(
          pkg,
          item.packagingCurrency || item.factoryCostCurrency,
          targetCurrency,
          rates,
          fxBufferPercent
        )
      : 0;
    return sum + (baseInTarget + pkgInTarget) * qty;
  }, 0);

  const totalProductClientInTarget = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const base = Number(item.factoryCostPerUnit) || 0;
    const pkg = Number(item.packagingCostPerUnit) || 0;
    const baseInTarget = convertCurrency(
      base,
      item.factoryCostCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );
    const pkgInTarget = pkg
      ? convertCurrency(
          pkg,
          item.packagingCurrency || item.factoryCostCurrency,
          targetCurrency,
          rates,
          fxBufferPercent
        )
      : 0;
    const unitCost = baseInTarget + pkgInTarget;

    let unitProfit = 0;
    if (item.profitType === 'fixed') {
      unitProfit = convertCurrency(
        Number(item.profitPerUnit) || 0,
        item.factoryCostCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      );
    } else {
      unitProfit = unitCost * ((Number(item.profitPerUnit) || 0) / 100);
    }
    return sum + (unitCost + unitProfit) * qty;
  }, 0);

  const totalProductProfitInTarget = Math.max(0, totalProductClientInTarget - totalFactoryCostInTarget);

  return (
    <div className="space-y-6">
      {/* Standalone Product Banner & Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Product Price & Profit Calculator
                </h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Standalone Section
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate unit price & profit alone. Shipping and customs clearance are <strong className="text-slate-700 font-semibold">NOT</strong> combined into this price.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Convert All Currency Bar */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-black text-slate-700 px-1.5 flex items-center gap-1">
                <span>Auto-convert all to:</span>
              </span>
              {KEY_SOURCING_CURRENCIES.map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => handleConvertAllTo(curr)}
                  className="rounded-lg px-2.5 py-1 text-xs font-black bg-white text-slate-800 hover:bg-amber-100 hover:text-amber-950 border border-slate-300 hover:border-amber-400 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  title={`Automatically convert all item prices to ${curr}`}
                >
                  <span>{CURRENCY_INFO[curr].flag}</span>
                  <span>{curr === 'CNY' ? 'RMB (¥)' : curr}</span>
                </button>
              ))}
              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
              {currencies
                .filter((c) => !KEY_SOURCING_CURRENCIES.includes(c))
                .map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleConvertAllTo(curr)}
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold bg-white/70 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
                    title={`Convert all to ${curr}`}
                  >
                    {CURRENCY_INFO[curr].flag} {curr}
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-black text-amber-900 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4 text-amber-700" />
              Add Product
            </button>
          </div>
        </div>

        {/* Global Product Result Summary Bar (Standalone) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Quantity</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {totalQuantity.toLocaleString()} pcs
            </span>
          </div>

          {!isClientView && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <span className="text-[11px] font-semibold text-slate-500 block">Factory Cost Total</span>
              <span className="text-base font-bold font-mono text-slate-700">
                {formatMoney(totalFactoryCostInTarget, targetCurrency, 2)}
              </span>
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
            <span className="text-[11px] font-bold text-amber-800 block">Client Product Total</span>
            <span className="text-base font-black font-mono text-amber-900">
              {formatMoney(totalProductClientInTarget, targetCurrency, 2)}
            </span>
          </div>

          {!isClientView && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <span className="text-[11px] font-bold text-emerald-800 block">Your Product Profit</span>
              <span className="text-base font-black font-mono text-emerald-700">
                +{formatMoney(totalProductProfitInTarget, targetCurrency, 2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* List of Products */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const qty = Number(item.quantity) || 1;
          const factoryPrice = Number(item.factoryCostPerUnit) || 0;
          const pkgPrice = Number(item.packagingCostPerUnit) || 0;

          // Pure factory unit cost in item currency
          const rawUnitCost = factoryPrice + pkgPrice;

          // Calculate unit profit in item currency
          let unitProfit = 0;
          if (item.profitType === 'fixed') {
            unitProfit = Number(item.profitPerUnit) || 0;
          } else {
            unitProfit = rawUnitCost * ((Number(item.profitPerUnit) || 0) / 100);
          }

          // Final quoted price to client in item currency
          const finalClientPriceInItemCurrency = rawUnitCost + unitProfit;

          // Total line values in item currency
          const lineFactoryCostInItemCurrency = rawUnitCost * qty;
          const lineProfitInItemCurrency = unitProfit * qty;
          const lineClientTotalInItemCurrency = finalClientPriceInItemCurrency * qty;

          // Converted into Target Currency for multi-currency display
          const factoryInTarget = convertCurrency(
            rawUnitCost,
            item.factoryCostCurrency,
            targetCurrency,
            rates,
            fxBufferPercent
          );
          const profitInTarget = convertCurrency(
            unitProfit,
            item.factoryCostCurrency,
            targetCurrency,
            rates,
            fxBufferPercent
          );
          const clientPriceInTarget = factoryInTarget + profitInTarget;
          const lineProfitInTarget = profitInTarget * qty;
          const lineClientTotalInTarget = clientPriceInTarget * qty;

          const marginPercent =
            finalClientPriceInItemCurrency > 0
              ? (unitProfit / finalClientPriceInItemCurrency) * 100
              : 0;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-slate-300"
            >
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                    placeholder="Product Name / Description"
                    className="w-full max-w-sm rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={item.sku || ''}
                    onChange={(e) => handleUpdateItem(item.id, { sku: e.target.value })}
                    placeholder="SKU (Optional)"
                    className="hidden sm:block w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoad50kExample(item.id)}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    Load 50k @ 0.30 RMB Example
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateItem(item)}
                    title="Duplicate product"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove product"
                      className="rounded-md p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Inputs Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Order Quantity (pcs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold font-mono text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    placeholder="e.g. 50000"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 font-mono">
                    {(item.quantity || 0).toLocaleString()} units
                  </p>
                </div>

                {/* 2. Factory Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      2. Factory Cost
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-amber-700 hidden sm:inline">Zero-Drift ⇄</span>
                      <select
                        value={item.factoryCostCurrency}
                        onChange={(e) =>
                          handleItemCurrencyChange(item.id, e.target.value as CurrencyCode)
                        }
                        className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 hover:from-amber-200 hover:to-amber-100 border-2 border-amber-400 hover:border-amber-500 rounded-lg px-2.5 py-1 cursor-pointer shadow-xs transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 font-mono tracking-tight"
                        title="Change currency — precise zero-drift conversion"
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>
                            {CURRENCY_INFO[c].flag} {c === 'CNY' ? 'RMB (¥)' : `${c} (${CURRENCY_INFO[c].symbol})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-amber-700 font-bold">
                      {CURRENCY_INFO[item.factoryCostCurrency].symbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.factoryCostPerUnit}
                      onChange={(e) => {
                        const newCost = parseFloat(e.target.value) || 0;
                        const curr = item.factoryCostCurrency;
                        handleUpdateItem(item.id, {
                          factoryCostPerUnit: newCost,
                          anchorCurrency: curr,
                          currencySnapshots: {
                            [curr]: {
                              factoryCost: newCost,
                              profit: item.profitPerUnit,
                              packagingCost: item.packagingCostPerUnit || 0,
                            },
                          },
                        });
                      }}
                      className="w-full rounded-lg border-2 border-amber-300 bg-amber-50/20 hover:border-amber-400 pl-8 pr-3 py-2.5 text-sm font-black font-mono text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:bg-white focus:outline-hidden transition-all shadow-2xs"
                      placeholder="0.30"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 font-mono">
                    Total factory: {formatMoney(lineFactoryCostInItemCurrency, item.factoryCostCurrency, 2)}
                  </p>

                  {/* Auto-converts to other currencies preview (highlighting RMB, USD, MAD, EGP) */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] font-mono">
                    <span className="text-slate-400 font-medium">Converts to:</span>
                    {KEY_SOURCING_CURRENCIES
                      .filter((c) => c !== item.factoryCostCurrency)
                      .map((c) => {
                        const snap = item.currencySnapshots?.[c];
                        const convVal = snap
                          ? snap.factoryCost + (snap.packagingCost || 0)
                          : convertCurrency(rawUnitCost, item.anchorCurrency || item.factoryCostCurrency, c, rates, 0);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleItemCurrencyChange(item.id, c)}
                            className="inline-flex items-center gap-1 rounded bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 text-amber-900 border border-amber-200 hover:border-amber-400 transition-colors cursor-pointer"
                            title={`Click to switch base currency to ${c}`}
                          >
                            <span>{CURRENCY_INFO[c].flag}</span>
                            <span className="font-bold">{formatCardUnit(convVal, c)}</span>
                            <span className="text-[9px] text-amber-700 font-semibold">{c === 'CNY' ? 'RMB' : c}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* 3. Add Profit Per Unit */}
                <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-amber-900">
                      3. Add Your Profit
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, { profitType: 'fixed' })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          item.profitType === 'fixed'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Fixed {CURRENCY_INFO[item.factoryCostCurrency].symbol}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, { profitType: 'percent' })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                          item.profitType === 'percent'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        % Margin
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-amber-700 font-bold">
                      {item.profitType === 'fixed'
                        ? `+${CURRENCY_INFO[item.factoryCostCurrency].symbol}`
                        : '+%'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.profitPerUnit}
                      onChange={(e) => {
                        const newProfit = parseFloat(e.target.value) || 0;
                        const curr = item.factoryCostCurrency;
                        handleUpdateItem(item.id, {
                          profitPerUnit: newProfit,
                          anchorCurrency: curr,
                          currencySnapshots: {
                            [curr]: {
                              factoryCost: item.factoryCostPerUnit,
                              profit: newProfit,
                              packagingCost: item.packagingCostPerUnit || 0,
                            },
                          },
                        });
                      }}
                      placeholder={item.profitType === 'fixed' ? '0.05' : '15'}
                      className="w-full rounded-lg border border-amber-300 bg-white pl-8 pr-3 py-1.5 text-sm font-black font-mono text-amber-900 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800 font-mono font-medium">
                    Net: +{formatMoney(unitProfit, item.factoryCostCurrency, 3)} / unit
                  </p>

                  {/* Auto-converted Profit equivalent */}
                  {item.profitType === 'fixed' && (
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] font-mono text-amber-900/80">
                      <span className="text-amber-800/70">Equiv:</span>
                      {KEY_SOURCING_CURRENCIES
                        .filter((c) => c !== item.factoryCostCurrency)
                        .slice(0, 3)
                        .map((c) => {
                          const snap = item.currencySnapshots?.[c];
                          const convProfit = snap
                            ? snap.profit
                            : convertCurrency(unitProfit, item.anchorCurrency || item.factoryCostCurrency, c, rates, 0);
                          return (
                            <span key={c} className="font-semibold bg-amber-100/70 rounded px-1">
                              +{formatCardUnit(convProfit, c)} {c === 'CNY' ? 'RMB' : c}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* 4. Final Quote to Client (Direct Target or Result) */}
                <div className="rounded-xl bg-slate-900 p-3 text-white border border-slate-800 shadow-xs">
                  <label className="block text-xs font-bold text-amber-400 mb-1">
                    4. Final Quote to Client
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs text-slate-400 font-bold">
                      {CURRENCY_INFO[item.factoryCostCurrency].symbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={
                        editingQuoteValues[item.id] !== undefined
                          ? editingQuoteValues[item.id]
                          : Number(finalClientPriceInItemCurrency.toFixed(4))
                      }
                      onFocus={() => {
                        setEditingQuoteValues((prev) => ({
                          ...prev,
                          [item.id]: finalClientPriceInItemCurrency
                            ? String(Number(finalClientPriceInItemCurrency.toFixed(4)))
                            : '',
                        }));
                      }}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        setEditingQuoteValues((prev) => ({
                          ...prev,
                          [item.id]: rawVal,
                        }));

                        if (rawVal === '' || isNaN(Number(rawVal))) return;
                        const newTargetQuote = parseFloat(rawVal);
                        const calculatedProfit = Math.max(0, newTargetQuote - rawUnitCost);
                        const roundedProfit = roundClean(calculatedProfit, 6);
                        const curr = item.factoryCostCurrency;
                        handleUpdateItem(item.id, {
                          profitType: 'fixed',
                          profitPerUnit: roundedProfit,
                          anchorCurrency: curr,
                          currencySnapshots: {
                            [curr]: {
                              factoryCost: item.factoryCostPerUnit,
                              profit: roundedProfit,
                              packagingCost: item.packagingCostPerUnit || 0,
                            },
                          },
                        });
                      }}
                      onBlur={() => {
                        const rawVal = editingQuoteValues[item.id];
                        if (rawVal !== undefined && rawVal !== '') {
                          const newTargetQuote = parseFloat(rawVal) || 0;
                          const calculatedProfit = Math.max(0, newTargetQuote - rawUnitCost);
                          const roundedProfit = roundClean(calculatedProfit, 6);
                          const curr = item.factoryCostCurrency;
                          handleUpdateItem(item.id, {
                            profitType: 'fixed',
                            profitPerUnit: roundedProfit,
                            anchorCurrency: curr,
                            currencySnapshots: {
                              [curr]: {
                                factoryCost: item.factoryCostPerUnit,
                                profit: roundedProfit,
                                packagingCost: item.packagingCostPerUnit || 0,
                              },
                            },
                          });
                        }
                        setEditingQuoteValues((prev) => {
                          const next = { ...prev };
                          delete next[item.id];
                          return next;
                        });
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-sm font-black font-mono text-amber-400 focus:border-amber-400 focus:outline-hidden"
                      placeholder="0.35"
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>{marginPercent.toFixed(1)}% margin</span>
                    <span className="text-amber-300 font-bold">
                      {formatMoney(finalClientPriceInItemCurrency, item.factoryCostCurrency, 3)} / pc
                    </span>
                  </div>

                  {/* Multi-Currency Auto-Converted Quotation Bar */}
                  <div className="mt-2 pt-2 border-t border-slate-700/60">
                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold mb-1">
                      <span>Auto-Converted Quote:</span>
                      <span className="text-slate-400 text-[9px] font-normal">click to switch base</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                      {currencies
                        .filter((c) => c !== item.factoryCostCurrency)
                        .map((c) => {
                          const quotedInC = convertCurrency(
                            finalClientPriceInItemCurrency,
                            item.factoryCostCurrency,
                            c,
                            rates,
                            0
                          );
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleItemCurrencyChange(item.id, c)}
                              className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 text-amber-200 border border-slate-700 hover:border-amber-400/60 transition-colors cursor-pointer"
                              title={`Auto-convert this item's base currency to ${c}`}
                            >
                              <span>{CURRENCY_INFO[c].symbol}</span>
                              <span className="font-bold text-white">
                                {quotedInC < 1 ? quotedInC.toFixed(4) : quotedInC.toFixed(3)}
                              </span>
                              <span className="text-amber-400 text-[9px]">{c}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Outcome Box for This Product (Standalone) */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">
                      Client Quoted Total ({item.name}):
                    </span>
                    <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                      {formatMoney(lineClientTotalInItemCurrency, item.factoryCostCurrency, 2)}
                      {item.factoryCostCurrency !== targetCurrency && (
                        <span className="text-xs font-normal text-slate-500 ml-2">
                          ({formatMoney(lineClientTotalInTarget, targetCurrency, 2)})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {qty.toLocaleString()} units @{' '}
                      <span className="font-bold text-slate-800">
                        {formatMoney(finalClientPriceInItemCurrency, item.factoryCostCurrency, 3)} / pc
                      </span>
                    </p>
                  </div>

                  {!isClientView && (
                    <div>
                      <span className="text-slate-500 font-medium block">
                        Factory Cost Total:
                      </span>
                      <div className="text-lg font-bold font-mono text-slate-700 mt-0.5">
                        {formatMoney(lineFactoryCostInItemCurrency, item.factoryCostCurrency, 2)}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {formatMoney(rawUnitCost, item.factoryCostCurrency, 3)} / pc base wholesale
                      </p>
                    </div>
                  )}

                  {!isClientView && (
                    <div>
                      <span className="text-emerald-700 font-bold block">
                        Your Net Profit on Product:
                      </span>
                      <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                        +{formatMoney(lineProfitInItemCurrency, item.factoryCostCurrency, 2)}
                        {item.factoryCostCurrency !== targetCurrency && (
                          <span className="text-xs font-normal text-emerald-700 ml-2">
                            (+{formatMoney(lineProfitInTarget, targetCurrency, 2)})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                        +{formatMoney(unitProfit, item.factoryCostCurrency, 3)} per unit ({marginPercent.toFixed(1)}% profit margin)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4-Currency Live Pricing Matrix (RMB • USD • MAD • EGP) */}
              <div className="mt-3 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-amber-50/60 p-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-amber-200/60">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                    <span className="text-xs font-black text-amber-950 uppercase tracking-tight">
                      Price in RMB (¥) • USD ($) • MAD (DH) • Egypt Pound (E£)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/60 rounded px-1.5 py-0.5">
                    Click card to switch base currency
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {KEY_SOURCING_CURRENCIES.map((c) => {
                    const isBase = item.factoryCostCurrency === c;
                    const snap = item.currencySnapshots?.[c];

                    let cardFactory: number;
                    let cardProfit: number;
                    let cardQuote: number;

                    if (isBase) {
                      cardFactory = rawUnitCost;
                      cardProfit = unitProfit;
                      cardQuote = finalClientPriceInItemCurrency;
                    } else if (snap) {
                      cardFactory = snap.factoryCost + (snap.packagingCost || 0);
                      cardProfit =
                        item.profitType === 'fixed'
                          ? snap.profit
                          : cardFactory * ((Number(item.profitPerUnit) || 0) / 100);
                      cardQuote = cardFactory + cardProfit;
                    } else {
                      const anchorCurr = item.anchorCurrency || item.factoryCostCurrency;
                      const anchorSnap = item.currencySnapshots?.[anchorCurr];
                      const anchorCost = anchorSnap ? anchorSnap.factoryCost : rawUnitCost;
                      const anchorProfit = anchorSnap ? anchorSnap.profit : unitProfit;

                      cardFactory = roundClean(
                        convertCurrency(anchorCost, anchorCurr, c, rates, 0),
                        6
                      );
                      cardProfit =
                        item.profitType === 'fixed'
                          ? roundClean(
                              convertCurrency(anchorProfit, anchorCurr, c, rates, 0),
                              6
                            )
                          : cardFactory * ((Number(item.profitPerUnit) || 0) / 100);
                      cardQuote = cardFactory + cardProfit;
                    }

                    const cardLineTotal = cardQuote * qty;

                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleItemCurrencyChange(item.id, c)}
                        className={`relative overflow-hidden text-left rounded-xl p-3 transition-all duration-200 cursor-pointer border-2 group ${
                          isBase
                            ? 'bg-white border-amber-500 ring-3 ring-amber-500/25 shadow-md shadow-amber-500/10'
                            : 'bg-white/95 hover:bg-white border-amber-200/90 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                        title={`Click to set base pricing to ${c} (zero-drift exact)`}
                      >
                        {isBase && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
                        )}

                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span className="text-sm">{CURRENCY_INFO[c].flag}</span>
                            <span className="tracking-tight font-mono">
                              {c === 'CNY' ? 'RMB (¥)' : `${c} (${CURRENCY_INFO[c].symbol})`}
                            </span>
                          </span>
                          {isBase ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-600 text-white rounded-full px-2 py-0.5 shadow-2xs">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200/60 rounded px-1.5 py-0.5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                              Switch ⇄
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Quote / pc</span>
                            <span className="text-sm font-black text-slate-950">
                              {formatCardUnit(cardQuote, c)}
                            </span>
                          </div>

                          {!isClientView && (
                            <div className="flex items-center justify-between text-slate-500 text-[10px]">
                              <span>Cost / pc:</span>
                              <span className="font-semibold text-slate-700">
                                {formatCardUnit(cardFactory, c)}
                              </span>
                            </div>
                          )}

                          {!isClientView && (
                            <div className="flex items-center justify-between text-emerald-700 text-[10px] font-bold">
                              <span>Profit / pc:</span>
                              <span className="bg-emerald-50 text-emerald-700 rounded px-1">
                                +{formatCardUnit(cardProfit, c)}
                              </span>
                            </div>
                          )}

                          <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between text-amber-950 font-black text-[11px]">
                            <span className="text-[9px] uppercase tracking-wider text-amber-800">Total:</span>
                            <span className="font-mono text-xs font-black">{formatMoney(cardLineTotal, c, 2)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Packaging / Unit Weight accordion / fields */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>Unit Weight (kg):</span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.unitWeightKg || ''}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          unitWeightKg: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-800 focus:outline-hidden"
                      placeholder="0.02"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Packaging / Box:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.packagingCostPerUnit ?? ''}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          packagingCostPerUnit: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-800 focus:outline-hidden"
                      placeholder="0.00"
                    />
                    <span>{CURRENCY_INFO[item.factoryCostCurrency].symbol}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Total weight: {((item.quantity || 0) * (item.unitWeightKg || 0)).toFixed(1)} kg
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
