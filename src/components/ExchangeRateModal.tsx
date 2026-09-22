import React, { useState } from 'react';
import { X, RefreshCw, DollarSign, TrendingUp, ShieldCheck } from 'lucide-react';
import { ExchangeRates, CurrencyCode } from '../types';
import { DEFAULT_EXCHANGE_RATES, CURRENCY_INFO } from '../utils/currencies';

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: ExchangeRates;
  onUpdateRates: (newRates: ExchangeRates) => void;
  fxBufferPercent: number;
  onUpdateFxBuffer: (buffer: number) => void;
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
  isOpen,
  onClose,
  rates,
  onUpdateRates,
  fxBufferPercent,
  onUpdateFxBuffer,
}) => {
  const [editableRates, setEditableRates] = useState<ExchangeRates>({ ...rates });
  const [buffer, setBuffer] = useState<number>(fxBufferPercent);

  if (!isOpen) return null;

  const handleChange = (curr: CurrencyCode, val: string) => {
    const num = parseFloat(val);
    setEditableRates((prev) => ({
      ...prev,
      [curr]: isNaN(num) ? 0 : num,
    }));
  };

  const handleReset = () => {
    setEditableRates({ ...DEFAULT_EXCHANGE_RATES });
    setBuffer(0);
  };

  const handleSave = () => {
    onUpdateRates(editableRates);
    onUpdateFxBuffer(buffer);
    onClose();
  };

  const cnyRate = editableRates.CNY || 7.24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Exchange Rates & FX Safety Buffer</h2>
              <p className="text-xs text-slate-500">Live conversion rates (Base: 1.00 USD)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* FX Volatility Protection Buffer */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2.5">
                <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Forex Safety Buffer (Protect Tiny Margins)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    When dealing with micro-margins (e.g. $0.05 / 0.34 RMB), currency swings can erase your profit. Sourcing agents add a 1%–2% buffer on client quotes.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              {[0, 1.0, 1.5, 2.0, 3.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBuffer(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    buffer === val
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-slate-200'
                  }`}
                >
                  {val === 0 ? 'No Buffer (0%)' : `+${val}% Buffer`}
                </button>
              ))}
            </div>
          </div>

          {/* Rates Table */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Exchange Rate Pairs
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(CURRENCY_INFO) as CurrencyCode[]).map((curr) => {
                const info = CURRENCY_INFO[curr];
                const isUSD = curr === 'USD';
                return (
                  <div
                    key={curr}
                    className="flex flex-col rounded-xl border border-slate-200 p-3 bg-slate-50/50 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span>{info.flag}</span>
                        <span>{curr}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        1 USD =
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.0001"
                        disabled={isUSD}
                        value={isUSD ? '1.00' : editableRates[curr] || ''}
                        onChange={(e) => handleChange(curr, e.target.value)}
                        className={`w-full rounded-lg border px-3 py-1.5 text-sm font-mono font-semibold transition-all ${
                          isUSD
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                        }`}
                      />
                      <span className="absolute right-2.5 text-xs text-slate-400 font-bold">
                        {info.symbol}
                      </span>
                    </div>

                    {curr !== 'USD' && curr !== 'CNY' && (
                      <p className="mt-1 text-[10px] text-slate-500 font-mono">
                        1 {curr} ≈ {(cnyRate / (editableRates[curr] || 1)).toFixed(3)} RMB
                      </p>
                    )}
                    {curr === 'USD' && (
                      <p className="mt-1 text-[10px] text-slate-500 font-mono">
                        1 USD ≈ {cnyRate.toFixed(3)} RMB
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5 rounded-b-2xl">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset to Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
            >
              Apply Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
