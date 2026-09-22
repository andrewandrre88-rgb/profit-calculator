import React from 'react';
import {
  Truck,
  Plane,
  Ship,
  Compass,
  ArrowRight,
  ShieldCheck,
  Check,
  DollarSign,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { ShippingDetails, CurrencyCode, ShippingMethod, ExchangeRates } from '../types';
import {
  CURRENCY_INFO,
  formatMoney,
  convertCurrency,
  ALL_CURRENCIES,
  KEY_SOURCING_CURRENCIES,
} from '../utils/currencies';

interface ShippingSectionProps {
  shipping: ShippingDetails;
  onChangeShipping: (shipping: ShippingDetails) => void;
  targetCurrency: CurrencyCode;
  totalUnits: number;
  totalCalculatedWeightKg: number;
  rates: ExchangeRates;
  fxBufferPercent: number;
  isClientView: boolean;
}

export const ShippingSection: React.FC<ShippingSectionProps> = ({
  shipping,
  onChangeShipping,
  targetCurrency,
  totalUnits,
  totalCalculatedWeightKg,
  rates,
  fxBufferPercent,
  isClientView,
}) => {
  const currencies: CurrencyCode[] = ALL_CURRENCIES;

  const methods: { id: ShippingMethod; name: string; icon: any; typicalDays: string }[] = [
    { id: 'sea_ddp', name: 'Sea Freight DDP (Door Delivery)', icon: Ship, typicalDays: '22-30 days' },
    { id: 'air_cargo_ddp', name: 'Air Cargo DDP (Door-to-Door)', icon: Plane, typicalDays: '8-12 days' },
    { id: 'air_express', name: 'Air Express (DHL / FedEx / UPS)', icon: Plane, typicalDays: '4-7 days' },
    { id: 'sea_fob', name: 'Sea FOB China Port', icon: Compass, typicalDays: 'Port Handoff' },
    { id: 'sea_cif', name: 'Sea CIF Destination Port', icon: Ship, typicalDays: '25-35 days' },
    { id: 'rail_ddp', name: 'Rail Freight DDP (Europe)', icon: Truck, typicalDays: '18-24 days' },
  ];

  const update = (updates: Partial<ShippingDetails>) => {
    onChangeShipping({ ...shipping, ...updates });
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    const oldCurrency = shipping.costCurrency;
    if (oldCurrency === newCurrency) return;

    const convBaseRate = convertCurrency(shipping.baseCostRate || 0, oldCurrency, newCurrency, rates, 0);
    const updates: Partial<ShippingDetails> = {
      costCurrency: newCurrency,
      baseCostRate: parseFloat((convBaseRate < 1 ? convBaseRate.toFixed(4) : convBaseRate.toFixed(2))),
    };

    if (shipping.agentProfitType !== 'percent' && shipping.agentProfitValue) {
      const convProfit = convertCurrency(shipping.agentProfitValue, oldCurrency, newCurrency, rates, 0);
      updates.agentProfitValue = parseFloat((convProfit < 1 ? convProfit.toFixed(4) : convProfit.toFixed(2)));
    }

    update(updates);
  };

  // Chargeable weight calculation
  const weightToUse =
    shipping.grossWeightKg > 0
      ? shipping.grossWeightKg
      : totalCalculatedWeightKg > 0
      ? totalCalculatedWeightKg
      : 1;

  const volumetricWeight = Number(shipping.volumetricWeightKg) || 0;
  const chargeableWeight = Math.max(weightToUse, volumetricWeight);

  // Calculate Base Cost in target currency
  let rawBaseCost = 0;
  if (shipping.calcBasis === 'per_kg') {
    rawBaseCost = (Number(shipping.baseCostRate) || 0) * chargeableWeight;
  } else if (shipping.calcBasis === 'per_cbm') {
    rawBaseCost = (Number(shipping.baseCostRate) || 0) * (Number(shipping.cbm) || 1);
  } else if (shipping.calcBasis === 'per_unit') {
    rawBaseCost = (Number(shipping.baseCostRate) || 0) * (totalUnits || 1);
  } else {
    rawBaseCost = Number(shipping.baseCostRate) || 0;
  }

  const baseCostInTarget = convertCurrency(
    rawBaseCost,
    shipping.costCurrency,
    targetCurrency,
    rates,
    fxBufferPercent
  );

  // Agent Freight Profit in target currency
  let agentFreightProfitInTarget = 0;
  if (shipping.agentProfitType === 'per_kg') {
    const profitPerKgInTarget = convertCurrency(
      Number(shipping.agentProfitValue) || 0,
      shipping.costCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );
    agentFreightProfitInTarget = profitPerKgInTarget * chargeableWeight;
  } else if (shipping.agentProfitType === 'percent') {
    agentFreightProfitInTarget =
      baseCostInTarget * ((Number(shipping.agentProfitValue) || 0) / 100);
  } else {
    agentFreightProfitInTarget = convertCurrency(
      Number(shipping.agentProfitValue) || 0,
      shipping.costCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );
  }

  const clientShippingTotal = baseCostInTarget + agentFreightProfitInTarget;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Shipping & Freight Calculator
              </h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                Standalone Line Item
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculate freight and your shipping profit alone — quoted as a separate line item, <strong className="text-slate-700 font-semibold">NOT</strong> blended into the product price.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={shipping.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-2 text-xs font-bold text-slate-700">
              {shipping.enabled ? 'Include Shipping in Quote' : 'Shipping Excluded / FOB'}
            </span>
          </label>
        </div>
      </div>

      {shipping.enabled ? (
        <div className="space-y-6">
          {/* Shipping Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Shipping Mode:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const isSelected = shipping.method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => update({ method: m.id })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold leading-tight">{m.name}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{m.typicalDays}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route & Ports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                China Departure Port / City
              </label>
              <input
                type="text"
                value={shipping.departurePort}
                onChange={(e) => update({ departurePort: e.target.value })}
                placeholder="e.g. Ningbo, Shenzhen, Shanghai, Yiwu"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Destination Country / Port
              </label>
              <input
                type="text"
                value={shipping.destinationCountry}
                onChange={(e) => update({ destinationCountry: e.target.value })}
                placeholder="e.g. USA (Los Angeles), Germany, UK"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Core Calculation Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cargo Weight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Gross Weight (kg)</label>
                {totalCalculatedWeightKg > 0 && (
                  <button
                    type="button"
                    onClick={() => update({ grossWeightKg: totalCalculatedWeightKg })}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Use Products Weight ({totalCalculatedWeightKg} kg)
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={shipping.grossWeightKg || ''}
                onChange={(e) => update({ grossWeightKg: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 1000"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-slate-400 font-mono">
                Basis: Per kg freight rate
              </p>
            </div>

            {/* Forwarder Base Freight Cost */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Forwarder Base Cost
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-blue-600 hidden sm:inline">Auto-converts ⇄</span>
                  <select
                    value={shipping.costCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                    className="text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_INFO[c].flag} {c} ({CURRENCY_INFO[c].symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-slate-400 font-bold">
                  {CURRENCY_INFO[shipping.costCurrency].symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping.baseCostRate || ''}
                  onChange={(e) => update({ baseCostRate: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 1.50 per kg or 1200 flat"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm font-bold font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-mono">
                Total forwarder cost: {formatMoney(baseCostInTarget, targetCurrency, 2)}
              </p>
            </div>

            {/* Agent Freight Profit Markup */}
            <div className="rounded-xl bg-blue-50/60 p-3 border border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-blue-900">
                  Your Freight Profit
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => update({ agentProfitType: 'per_kg' })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      shipping.agentProfitType === 'per_kg'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    +$/kg
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ agentProfitType: 'percent' })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      shipping.agentProfitType === 'percent'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    +%
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ agentProfitType: 'total_fixed' })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      shipping.agentProfitType === 'total_fixed'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    Flat
                  </button>
                </div>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs text-blue-700 font-bold">
                  {shipping.agentProfitType === 'percent'
                    ? '+%'
                    : `+${CURRENCY_INFO[shipping.costCurrency].symbol}`}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping.agentProfitValue || ''}
                  onChange={(e) =>
                    update({ agentProfitValue: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={shipping.agentProfitType === 'percent' ? '15' : '0.30'}
                  className="w-full rounded-lg border border-blue-300 bg-white pl-8 pr-3 py-1.5 text-sm font-black font-mono text-blue-900 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <p className="mt-1 text-[11px] text-blue-800 font-mono font-medium">
                Net gain: +{formatMoney(agentFreightProfitInTarget, targetCurrency, 2)}
              </p>
            </div>
          </div>

          {/* Standalone Shipping Live Result Card */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">
                  Quote to Client for Shipping (Separate Line Item):
                </span>
                <div className="text-xl font-black font-mono text-blue-900 mt-0.5">
                  {formatMoney(clientShippingTotal, targetCurrency, 2)}
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {chargeableWeight} kg @{' '}
                  <span className="font-bold text-slate-800">
                    {formatMoney(chargeableWeight > 0 ? clientShippingTotal / chargeableWeight : 0, targetCurrency, 2)}/kg
                  </span>
                </p>
              </div>

              {!isClientView && (
                <div>
                  <span className="text-slate-500 font-semibold block">
                    Forwarder Real Cost:
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-700 mt-0.5">
                    {formatMoney(baseCostInTarget, targetCurrency, 2)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Base freight payable to forwarder
                  </p>
                </div>
              )}

              {!isClientView && (
                <div>
                  <span className="text-emerald-700 font-bold block">
                    Your Shipping Profit:
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-600 mt-0.5">
                    +{formatMoney(agentFreightProfitInTarget, targetCurrency, 2)}
                  </div>
                  <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                    Earned on freight markup
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4-Currency Live Shipping Quote Matrix (RMB • USD • MAD • EGP) */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-slate-50 p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-blue-200/60">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-950 uppercase tracking-tight">
                  Shipping Quote in RMB (¥) • USD ($) • MAD (DH) • Egypt Pound (E£)
                </span>
              </div>
              <span className="text-[10px] text-blue-700 font-medium">
                Auto-converted standalone freight quote
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {KEY_SOURCING_CURRENCIES.map((c) => {
                const totalInC = convertCurrency(clientShippingTotal, targetCurrency, c, rates, 0);
                const ratePerKgInC = chargeableWeight > 0 ? totalInC / chargeableWeight : 0;
                const profitInC = convertCurrency(agentFreightProfitInTarget, targetCurrency, c, rates, 0);
                const isTarget = targetCurrency === c;

                return (
                  <div
                    key={c}
                    className={`rounded-lg p-2.5 border transition-all ${
                      isTarget
                        ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white/80 border-blue-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <span>{CURRENCY_INFO[c].flag}</span>
                        <span>{c === 'CNY' ? 'RMB' : c}</span>
                      </span>
                      {isTarget && (
                        <span className="text-[9px] font-bold bg-blue-600 text-white rounded px-1">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 font-mono text-[11px]">
                      <div className="text-xs font-black text-blue-950">
                        {formatMoney(totalInC, c, 2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {CURRENCY_INFO[c].symbol}
                        {ratePerKgInC.toFixed(2)}/kg
                      </div>
                      {!isClientView && (
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Profit: +{formatMoney(profitInC, c, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
          Shipping is currently disabled for this quotation (e.g. client handles their own shipping FOB China port).
          Toggle the switch above to enable freight calculation.
        </div>
      )}
    </div>
  );
};
