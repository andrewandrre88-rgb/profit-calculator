import React from 'react';
import { ShieldAlert, FileCheck, Plus, Trash2, CheckCircle2, ShieldCheck, DollarSign, Sparkles } from 'lucide-react';
import {
  CustomsDetails,
  ServiceItem,
  CurrencyCode,
  ExchangeRates,
  SourcingQuote,
} from '../types';
import {
  CURRENCY_INFO,
  formatMoney,
  convertCurrency,
  ALL_CURRENCIES,
  KEY_SOURCING_CURRENCIES,
} from '../utils/currencies';

interface CustomsAndServicesSectionProps {
  customs: CustomsDetails;
  onChangeCustoms: (customs: CustomsDetails) => void;
  services: ServiceItem[];
  onChangeServices: (services: ServiceItem[]) => void;
  sourcingFeeType: SourcingQuote['sourcingFeeType'];
  sourcingFeeValue: number;
  sourcingFeeCurrency: CurrencyCode;
  onChangeSourcingFee: (
    type: SourcingQuote['sourcingFeeType'],
    val: number,
    curr: CurrencyCode
  ) => void;
  targetCurrency: CurrencyCode;
  totalUnits: number;
  rates: ExchangeRates;
  fxBufferPercent: number;
  isClientView: boolean;
}

export const CustomsAndServicesSection: React.FC<CustomsAndServicesSectionProps> = ({
  customs,
  onChangeCustoms,
  services,
  onChangeServices,
  sourcingFeeType,
  sourcingFeeValue,
  sourcingFeeCurrency,
  onChangeSourcingFee,
  targetCurrency,
  totalUnits,
  rates,
  fxBufferPercent,
  isClientView,
}) => {
  const currencies: CurrencyCode[] = ALL_CURRENCIES;

  const updateCustoms = (updates: Partial<CustomsDetails>) => {
    onChangeCustoms({ ...customs, ...updates });
  };

  const handleAddService = () => {
    const newService: ServiceItem = {
      id: `srv_${Date.now()}`,
      name: 'Pre-Shipment Quality Inspection (PSI)',
      costCurrency: 'CNY',
      agentBaseCost: 1000,
      clientPriceCurrency: targetCurrency,
      clientPrice: 220,
      unitType: 'fixed',
      description: 'AQL 2.5 on-site factory sampling, defect count & lab report',
    };
    onChangeServices([...services, newService]);
  };

  const handleUpdateService = (id: string, updates: Partial<ServiceItem>) => {
    onChangeServices(services.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleServiceCostCurrencyChange = (id: string, newCurrency: CurrencyCode) => {
    const srv = services.find((s) => s.id === id);
    if (!srv || srv.costCurrency === newCurrency) return;
    const oldCurr = srv.costCurrency;
    const convCost = convertCurrency(srv.agentBaseCost || 0, oldCurr, newCurrency, rates, 0);
    handleUpdateService(id, {
      costCurrency: newCurrency,
      agentBaseCost: parseFloat(convCost < 1 ? convCost.toFixed(4) : convCost.toFixed(2)),
    });
  };

  const handleServiceClientCurrencyChange = (id: string, newCurrency: CurrencyCode) => {
    const srv = services.find((s) => s.id === id);
    if (!srv || srv.clientPriceCurrency === newCurrency) return;
    const oldCurr = srv.clientPriceCurrency;
    const convPrice = convertCurrency(srv.clientPrice || 0, oldCurr, newCurrency, rates, 0);
    handleUpdateService(id, {
      clientPriceCurrency: newCurrency,
      clientPrice: parseFloat(convPrice < 1 ? convPrice.toFixed(4) : convPrice.toFixed(2)),
    });
  };

  const handleDeleteService = (id: string) => {
    onChangeServices(services.filter((s) => s.id !== id));
  };

  // Compute customs metrics
  const clearanceCostInTarget = convertCurrency(
    Number(customs.customsClearanceFee) || 0,
    customs.customsFeeCurrency,
    targetCurrency,
    rates,
    fxBufferPercent
  );
  const portCostInTarget = convertCurrency(
    Number(customs.portHandlingFee) || 0,
    customs.portFeeCurrency,
    targetCurrency,
    rates,
    fxBufferPercent
  );
  const totalCustomsBaseCostInTarget = clearanceCostInTarget + portCostInTarget;

  let agentCustomsMarkupInTarget = 0;
  if (customs.agentMarkupType === 'fixed') {
    agentCustomsMarkupInTarget = convertCurrency(
      Number(customs.agentMarkupValue) || 0,
      customs.customsFeeCurrency,
      targetCurrency,
      rates,
      fxBufferPercent
    );
  } else {
    agentCustomsMarkupInTarget =
      totalCustomsBaseCostInTarget * ((Number(customs.agentMarkupValue) || 0) / 100);
  }

  const clientCustomsTotal = totalCustomsBaseCostInTarget + agentCustomsMarkupInTarget;

  // Compute services metrics
  const totalServicesCostInTarget = services.reduce((sum, s) => {
    return (
      sum +
      convertCurrency(
        Number(s.agentBaseCost) || 0,
        s.costCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      )
    );
  }, 0);

  const totalServicesClientInTarget = services.reduce((sum, s) => {
    return (
      sum +
      convertCurrency(
        Number(s.clientPrice) || 0,
        s.clientPriceCurrency,
        targetCurrency,
        rates,
        fxBufferPercent
      )
    );
  }, 0);

  const totalServicesProfitInTarget = Math.max(0, totalServicesClientInTarget - totalServicesCostInTarget);

  return (
    <div className="space-y-6">
      {/* Customs & Clearance Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Customs Clearance & Duties
                </h2>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                  Standalone Line Item
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate broker clearance, tariffs & your customs handling fee as an independent item.
              </p>
            </div>
          </div>

          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={customs.enabled}
                onChange={(e) => updateCustoms({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {customs.enabled ? 'Customs Included' : 'Excluded (Client Clears)'}
              </span>
            </label>
          </div>
        </div>

        {customs.enabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Clearance Broker Fee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customs Clearance Fee
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-slate-400 font-bold">
                    {CURRENCY_INFO[customs.customsFeeCurrency].symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={customs.customsClearanceFee || ''}
                    onChange={(e) =>
                      updateCustoms({ customsClearanceFee: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="120"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm font-bold font-mono text-slate-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Broker filing cost</p>
              </div>

              {/* Port & Terminal Fee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Port & Terminal Handling
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-slate-400 font-bold">
                    {CURRENCY_INFO[customs.portFeeCurrency].symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={customs.portHandlingFee || ''}
                    onChange={(e) =>
                      updateCustoms({ portHandlingFee: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="80"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm font-bold font-mono text-slate-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Terminal charges / DTHC</p>
              </div>

              {/* Your Customs Markup / Profit */}
              <div className="rounded-xl bg-purple-50/60 p-3 border border-purple-200">
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Your Customs Handling Gain
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-purple-700 font-bold">
                    +{CURRENCY_INFO[customs.customsFeeCurrency].symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={customs.agentMarkupValue || ''}
                    onChange={(e) =>
                      updateCustoms({ agentMarkupValue: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="50"
                    className="w-full rounded-lg border border-purple-300 bg-white pl-8 pr-3 py-1.5 text-sm font-black font-mono text-purple-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
                <p className="mt-1 text-[11px] text-purple-800 font-mono font-medium">
                  Net gain: +{formatMoney(agentCustomsMarkupInTarget, targetCurrency, 2)}
                </p>
              </div>
            </div>

            {/* Live Standalone Customs Result */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">
                    Quoted Customs to Client (Separate Line):
                  </span>
                  <div className="text-xl font-black font-mono text-purple-900 mt-0.5">
                    {formatMoney(clientCustomsTotal, targetCurrency, 2)}
                  </div>
                </div>

                {!isClientView && (
                  <div>
                    <span className="text-slate-500 font-semibold block">
                      Actual Broker & Port Cost:
                    </span>
                    <div className="text-xl font-bold font-mono text-slate-700 mt-0.5">
                      {formatMoney(totalCustomsBaseCostInTarget, targetCurrency, 2)}
                    </div>
                  </div>
                )}

                {!isClientView && (
                  <div>
                    <span className="text-emerald-700 font-bold block">
                      Your Customs Net Profit:
                    </span>
                    <div className="text-xl font-black font-mono text-emerald-600 mt-0.5">
                      +{formatMoney(agentCustomsMarkupInTarget, targetCurrency, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4-Currency Live Customs Quote Matrix (RMB • USD • MAD • EGP) */}
            <div className="mt-3 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-slate-50 p-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1 border-b border-purple-200/60">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-tight">
                    Customs Quote in RMB (¥) • USD ($) • MAD (DH) • Egypt Pound (E£)
                  </span>
                </div>
                <span className="text-[10px] text-purple-700 font-medium">
                  Auto-converted customs quote
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {KEY_SOURCING_CURRENCIES.map((c) => {
                  const totalInC = convertCurrency(clientCustomsTotal, targetCurrency, c, rates, 0);
                  const profitInC = convertCurrency(agentCustomsMarkupInTarget, targetCurrency, c, rates, 0);
                  const isTarget = targetCurrency === c;

                  return (
                    <div
                      key={c}
                      className={`rounded-lg p-2 border transition-all ${
                        isTarget
                          ? 'bg-white border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                          : 'bg-white/80 border-purple-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                          <span>{CURRENCY_INFO[c].flag}</span>
                          <span>{c === 'CNY' ? 'RMB' : c}</span>
                        </span>
                        {isTarget && (
                          <span className="text-[9px] font-bold bg-purple-600 text-white rounded px-1">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 font-mono text-[11px]">
                        <div className="text-xs font-black text-purple-950">
                          {formatMoney(totalInC, c, 2)}
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
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            Customs fees are not included in this quote. Enable above if quoting customs clearance.
          </div>
        )}
      </div>

      {/* Services & QC Inspection Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Services, QC Inspection & Sourcing Commission
                </h2>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                  Optional Services
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Charge for Quality Inspection, Factory Audit, Sample Consolidation, or Sourcing Agent Commission.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddService}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Inspection / Service
          </button>
        </div>

        {services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service) => {
              const baseCostInTarget = convertCurrency(
                Number(service.agentBaseCost) || 0,
                service.costCurrency,
                targetCurrency,
                rates,
                fxBufferPercent
              );
              const clientPriceInTarget = convertCurrency(
                Number(service.clientPrice) || 0,
                service.clientPriceCurrency,
                targetCurrency,
                rates,
                fxBufferPercent
              );
              const serviceProfit = Math.max(0, clientPriceInTarget - baseCostInTarget);

              return (
                <div
                  key={service.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => handleUpdateService(service.id, { name: e.target.value })}
                      className="w-full max-w-md text-sm font-bold text-slate-900 rounded border border-slate-300 px-2.5 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteService(service.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {!isClientView && (
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Inspector / Base Cost
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={service.agentBaseCost}
                            onChange={(e) =>
                              handleUpdateService(service.id, {
                                agentBaseCost: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono font-bold"
                          />
                          <select
                            value={service.costCurrency}
                            onChange={(e) =>
                              handleServiceCostCurrencyChange(service.id, e.target.value as CurrencyCode)
                            }
                            className="rounded border border-slate-300 bg-slate-50 py-1.5 px-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                            title="Auto-converts base cost"
                          >
                            {currencies.map((c) => (
                              <option key={c} value={c}>
                                {CURRENCY_INFO[c].flag} {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Quoted Price to Client
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={service.clientPrice}
                          onChange={(e) =>
                            handleUpdateService(service.id, {
                              clientPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded border border-teal-500 bg-teal-50/20 px-2.5 py-1.5 font-mono font-black text-teal-900"
                        />
                        <select
                          value={service.clientPriceCurrency}
                          onChange={(e) =>
                            handleServiceClientCurrencyChange(service.id, e.target.value as CurrencyCode)
                          }
                          className="rounded border border-teal-300 bg-teal-50 py-1.5 px-1.5 text-xs font-bold text-teal-900 cursor-pointer"
                          title="Auto-converts client quote"
                        >
                          {currencies.map((c) => (
                            <option key={c} value={c}>
                              {CURRENCY_INFO[c].flag} {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!isClientView && (
                      <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200 flex flex-col justify-center">
                        <span className="text-[11px] font-bold text-emerald-800">
                          Your Profit on Service:
                        </span>
                        <span className="text-base font-black font-mono text-emerald-600">
                          +{formatMoney(serviceProfit, targetCurrency, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            No inspection or extra services added. Add services if client requires on-site QC, lab testing, or special handling.
          </div>
        )}
      </div>
    </div>
  );
};
