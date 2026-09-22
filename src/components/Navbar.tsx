import React from 'react';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Eye,
  EyeOff,
  Package,
  Truck,
  ShieldAlert,
  Sparkles,
  Download,
  FolderOpen,
} from 'lucide-react';
import { CurrencyCode, CalcMode, ExchangeRates } from '../types';
import { CURRENCY_INFO, ALL_CURRENCIES, KEY_SOURCING_CURRENCIES } from '../utils/currencies';

interface NavbarProps {
  mode: CalcMode;
  onSelectMode: (mode: CalcMode) => void;
  targetCurrency: CurrencyCode;
  onSelectCurrency: (curr: CurrencyCode) => void;
  rates: ExchangeRates;
  fxBufferPercent: number;
  onOpenRatesModal: () => void;
  isClientView: boolean;
  onToggleClientView: () => void;
  onOpenPresetsModal: () => void;
  onDownloadPDF: (type: 'client' | 'internal') => void;
  onOpenSavedQuotes: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onSelectMode,
  targetCurrency,
  onSelectCurrency,
  rates,
  fxBufferPercent,
  onOpenRatesModal,
  isClientView,
  onToggleClientView,
  onOpenPresetsModal,
  onDownloadPDF,
  onOpenSavedQuotes,
}) => {
  const currencies: CurrencyCode[] = ALL_CURRENCIES;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-amber-400 shadow-md">
              <span className="font-mono text-sm sm:text-base font-black">¥/$</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate">
                  <span className="hidden sm:inline">China Sourcing Profit Calc</span>
                  <span className="sm:hidden">Sourcing Calc</span>
                </span>
                <span className="hidden md:inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 shrink-0">
                  Micro-Margin Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden lg:block truncate">
                Precision margin calculator & client quote generator
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="hidden md:flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => onSelectMode('full_quote')}
              className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                mode === 'full_quote'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">Full Sourcing Quote</span>
              <span className="lg:hidden">Sourcing</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('shipping_only')}
              className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                mode === 'shipping_only'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="h-3.5 w-3.5 text-sky-600 shrink-0" />
              <span className="hidden lg:inline">Shipping Only</span>
              <span className="lg:hidden">Shipping</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('service_only')}
              className={`flex items-center gap-1.5 rounded-lg px-2 lg:px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                mode === 'service_only'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="hidden lg:inline">Services / QC Only</span>
              <span className="lg:hidden">Services/QC</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-2.5 shrink-0 ml-auto">
            {/* FX Rates Pill */}
            <button
              type="button"
              onClick={onOpenRatesModal}
              title="Configure live exchange rates and volatility buffer"
              className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-1.5 sm:px-2.5 py-1.5 text-xs font-mono font-medium text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              <TrendingUp className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="hidden xl:inline">
                1$ = {rates.CNY?.toFixed(2)}¥ | {rates.MAD?.toFixed(1)}DH | {rates.EGP?.toFixed(1)}E£
              </span>
              <span className="hidden sm:inline xl:hidden">1$ = {rates.CNY?.toFixed(2)}¥</span>
              <span className="sm:hidden text-[11px] font-bold">{rates.CNY?.toFixed(1)}¥</span>
              {fxBufferPercent > 0 && (
                <span className="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800 hidden xs:inline">
                  +{fxBufferPercent}%
                </span>
              )}
            </button>

            {/* Quick Sourcing Currency Switchers (RMB, USD, MAD, EGP) */}
            <div className="hidden xl:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              {KEY_SOURCING_CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onSelectCurrency(c)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    targetCurrency === c
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`Switch active display currency to ${c}`}
                >
                  {c === 'CNY' ? 'RMB' : c}
                </button>
              ))}
            </div>

            {/* Target Currency Selector (All Currencies) */}
            <div className="relative shrink-0">
              <select
                value={targetCurrency}
                onChange={(e) => onSelectCurrency(e.target.value as CurrencyCode)}
                className="appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-2 sm:pl-2.5 pr-6 sm:pr-7 text-xs font-bold text-slate-900 shadow-xs hover:border-slate-400 focus:border-amber-500 focus:outline-hidden max-w-[80px] sm:max-w-[110px] md:max-w-none truncate cursor-pointer"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {CURRENCY_INFO[curr].flag} {curr === 'CNY' ? 'RMB (¥)' : curr} ({CURRENCY_INFO[curr].symbol})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 text-slate-400">
                <span className="text-[10px]">▼</span>
              </div>
            </div>

            {/* View Mode Toggle (Agent Confidential vs Client Clean) */}
            <button
              type="button"
              onClick={onToggleClientView}
              className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-semibold transition-all border shrink-0 ${
                isClientView
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}
              title={
                isClientView
                  ? 'Currently in Client Clean Presentation View (Margins hidden)'
                  : 'Currently in Agent Internal Audit View (Costs and margins visible)'
              }
            >
              {isClientView ? (
                <>
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden md:inline">Client View</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden md:inline">Agent Audit</span>
                </>
              )}
            </button>

            {/* Preset Templates */}
            <button
              type="button"
              onClick={onOpenPresetsModal}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
              title="Load realistic scenario presets"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="hidden lg:inline">Presets</span>
            </button>

            {/* Saved Quotes */}
            <button
              type="button"
              onClick={onOpenSavedQuotes}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
              title="Saved calculations"
            >
              <FolderOpen className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            </button>

            {/* PDF Export Dropdown/Button */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => onDownloadPDF('client')}
                className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors shrink-0"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">PDF Quote</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Mode Switcher Bar */}
        <div className="flex md:hidden items-center justify-between border-t border-slate-100 py-2">
          <button
            type="button"
            onClick={() => onSelectMode('full_quote')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-md ${
              mode === 'full_quote' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Full Sourcing
          </button>
          <button
            type="button"
            onClick={() => onSelectMode('shipping_only')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-md ${
              mode === 'shipping_only' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Shipping Only
          </button>
          <button
            type="button"
            onClick={() => onSelectMode('service_only')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-md ${
              mode === 'service_only' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            Services / QC
          </button>
        </div>
      </div>
    </header>
  );
};
