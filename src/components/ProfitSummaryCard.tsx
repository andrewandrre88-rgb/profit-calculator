import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Download,
  FileSpreadsheet,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  Layers,
  FileText,
  Package,
  Truck,
  ShieldAlert,
} from 'lucide-react';
import { SourcingQuote, QuoteCalculationSummary, CurrencyCode, ExchangeRates } from '../types';
import {
  formatMoney,
  CURRENCY_INFO,
  convertCurrency,
  KEY_SOURCING_CURRENCIES,
} from '../utils/currencies';

interface ProfitSummaryCardProps {
  quote: SourcingQuote;
  summary: QuoteCalculationSummary;
  targetCurrency: CurrencyCode;
  rates: ExchangeRates;
  isClientView: boolean;
  onDownloadPDF: (type: 'client' | 'internal') => void;
  decimals: number;
  onSetDecimals: (d: number) => void;
  onUpdateQuoteInfo: (updates: Partial<SourcingQuote>) => void;
}

export const ProfitSummaryCard: React.FC<ProfitSummaryCardProps> = ({
  quote,
  summary,
  targetCurrency,
  rates,
  isClientView,
  onDownloadPDF,
  decimals,
  onSetDecimals,
}) => {
  const currencySymbol = CURRENCY_INFO[targetCurrency].symbol;

  return (
    <div className="rounded-2xl border border-slate-900/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 text-white shadow-xl">
      {/* Top Bar: Decimals Precision & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-Time Quote & Profit Overview
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-slate-700">
            Sections Calculated Separately
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Precision:</span>
            <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              {[2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSetDecimals(d)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                    decimals === d
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  .{'0'.repeat(d)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Product Unit Price Quoted (Pure Product) */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-amber-400">
              <Package className="h-3.5 w-3.5" />
              Product Quote / Unit
            </span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
              Product Only
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            {formatMoney(summary.averageClientPricePerUnit, targetCurrency, decimals)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {summary.totalQuantity.toLocaleString()} pcs • Not mixed with shipping
          </div>
        </div>

        {/* 2. Client Product Subtotal */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Product Subtotal</span>
            <span className="text-[10px] text-slate-400 font-mono">Total Order</span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            {formatMoney(summary.productClientTotal, targetCurrency, 2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Excludes freight & clearance
          </div>
        </div>

        {/* 3. Grand Total Quoted (All Sections Combined) */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span className="font-bold">Grand Total Quoted</span>
            <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-200">
              All Sections
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-amber-400">
            {formatMoney(summary.grandTotalClientPrice, targetCurrency, 2)}
          </div>
          <div className="mt-1 text-[11px] text-amber-200/70 font-mono">
            Products + Shipping + Customs
          </div>
        </div>

        {/* 4. Agent Total Net Profit (Internal) */}
        {!isClientView ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
              <span className="font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Your Total Net Profit
              </span>
              <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                {summary.overallProfitMarginPercent.toFixed(1)}% margin
              </span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-400">
              +{formatMoney(summary.grandTotalNetProfit, targetCurrency, 2)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-200/80 font-mono">
              +{(summary.totalQuantity > 0 ? summary.grandTotalNetProfit / summary.totalQuantity : 0).toFixed(decimals)} {targetCurrency} / unit net gain
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 flex flex-col justify-center">
            <span className="text-xs text-slate-400">Client Screen Mode</span>
            <span className="text-sm font-bold text-slate-200 mt-1">
              Internal Profit Hidden
            </span>
          </div>
        )}
      </div>

      {/* Itemized Section-by-Section Summary Bar */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Independent Section Breakdown:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">1. Products:</span>
            <span className="font-bold text-white">
              {formatMoney(summary.productClientTotal, targetCurrency, 2)}
            </span>
            {!isClientView && (
              <span className="text-emerald-400 text-[10px] block">
                Profit: +{formatMoney(summary.productTotalProfit, targetCurrency, 2)}
              </span>
            )}
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">2. Shipping (Separate):</span>
            <span className="font-bold text-blue-300">
              {quote.shipping.enabled ? formatMoney(summary.shippingClientTotal, targetCurrency, 2) : 'Excluded'}
            </span>
            {!isClientView && quote.shipping.enabled && (
              <span className="text-emerald-400 text-[10px] block">
                Profit: +{formatMoney(summary.shippingTotalProfit, targetCurrency, 2)}
              </span>
            )}
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">3. Customs Clearance:</span>
            <span className="font-bold text-purple-300">
              {quote.customs.enabled ? formatMoney(summary.customsClientTotal, targetCurrency, 2) : 'Excluded'}
            </span>
            {!isClientView && quote.customs.enabled && (
              <span className="text-emerald-400 text-[10px] block">
                Profit: +{formatMoney(summary.customsTotalProfit, targetCurrency, 2)}
              </span>
            )}
          </div>

          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">4. Services & QC:</span>
            <span className="font-bold text-teal-300">
              {summary.servicesClientTotal > 0 ? formatMoney(summary.servicesClientTotal, targetCurrency, 2) : 'None'}
            </span>
            {!isClientView && summary.servicesClientTotal > 0 && (
              <span className="text-emerald-400 text-[10px] block">
                Profit: +{formatMoney(summary.servicesTotalProfit, targetCurrency, 2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Currency Live Total Strip (RMB • USD • MAD • EGP) */}
      <div className="mt-4 pt-3.5 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              Global Multi-Currency Total Quote (RMB • USD • MAD • Egypt Pound)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Live auto-converted for foreign buyers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {KEY_SOURCING_CURRENCIES.map((c) => {
            const isTarget = targetCurrency === c;
            const convertedGrandTotal = convertCurrency(
              summary.grandTotalClientPrice,
              targetCurrency,
              c,
              rates,
              0
            );
            const convertedUnit = convertCurrency(
              summary.averageClientPricePerUnit,
              targetCurrency,
              c,
              rates,
              0
            );
            const convertedNetProfit = convertCurrency(
              summary.grandTotalNetProfit,
              targetCurrency,
              c,
              rates,
              0
            );

            return (
              <div
                key={c}
                className={`rounded-xl p-3 border transition-all ${
                  isTarget
                    ? 'bg-slate-800/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-white flex items-center gap-1.5">
                    <span>{CURRENCY_INFO[c].flag}</span>
                    <span>{c === 'CNY' ? 'RMB (¥)' : c === 'MAD' ? 'MAD (DH)' : c === 'EGP' ? 'EGP (E£)' : c}</span>
                  </span>
                  {isTarget && (
                    <span className="rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-mono font-bold text-amber-300">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="font-mono">
                  <div className="text-base sm:text-lg font-black text-amber-300 leading-snug">
                    {formatMoney(convertedGrandTotal, c, 2)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Unit: {CURRENCY_INFO[c].symbol}
                    {convertedUnit < 1 ? convertedUnit.toFixed(4) : convertedUnit.toFixed(3)}
                  </div>
                  {!isClientView && (
                    <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                      Profit: +{formatMoney(convertedNetProfit, c, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PDF Export Actions */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Generate professional documentation for foreign clients or internal accounting:
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDownloadPDF('client')}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-black transition-all shadow-md active:scale-95"
          >
            <Download className="h-4 w-4" />
            Download Client Quote PDF
          </button>

          {!isClientView && (
            <button
              type="button"
              onClick={() => onDownloadPDF('internal')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold border border-slate-700 transition-all shadow-sm active:scale-95"
            >
              <FileText className="h-4 w-4" />
              Internal Profit Audit PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
