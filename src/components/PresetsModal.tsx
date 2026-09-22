import React from 'react';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { PRESET_QUOTES } from '../utils/presets';
import { SourcingQuote } from '../types';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (quote: SourcingQuote) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                China Sourcing Scenario Templates
              </h2>
              <p className="text-xs text-slate-500">
                Load pre-configured real-world sourcing situations with micro-margins
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {PRESET_QUOTES.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-amber-400 hover:bg-amber-50/20 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{preset.name}</h4>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 uppercase">
                    {preset.quote.mode.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {preset.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                  <span>Currency: {preset.quote.targetCurrency}</span>
                  <span>•</span>
                  <span>Items: {preset.quote.items.length}</span>
                  <span>•</span>
                  <span>Destination: {preset.quote.clientCountry}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLoadPreset(preset.quote);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors shrink-0"
              >
                <span>Load Template</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 rounded-b-2xl text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
