import React, { useState } from 'react';
import { X, FolderOpen, Save, Trash2, Plus, ArrowRight, Check } from 'lucide-react';
import { SourcingQuote } from '../types';

interface SavedQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuote: SourcingQuote;
  onLoadQuote: (quote: SourcingQuote) => void;
  onNewQuote: () => void;
}

export const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({
  isOpen,
  onClose,
  currentQuote,
  onLoadQuote,
  onNewQuote,
}) => {
  const [savedQuotes, setSavedQuotes] = useState<SourcingQuote[]>(() => {
    try {
      const stored = localStorage.getItem('china_sourcing_quotes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    const existingIndex = savedQuotes.findIndex((q) => q.id === currentQuote.id);
    let updated: SourcingQuote[];
    if (existingIndex >= 0) {
      updated = [...savedQuotes];
      updated[existingIndex] = { ...currentQuote };
    } else {
      updated = [currentQuote, ...savedQuotes];
    }
    setSavedQuotes(updated);
    localStorage.setItem('china_sourcing_quotes', JSON.stringify(updated));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDelete = (id: string) => {
    const updated = savedQuotes.filter((q) => q.id !== id);
    setSavedQuotes(updated);
    localStorage.setItem('china_sourcing_quotes', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Saved Quotations & Drafts</h2>
              <p className="text-xs text-slate-500">Manage saved client cost sheets in your browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSaveCurrent}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Current Quotation
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onNewQuote();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Blank Quote
            </button>
          </div>

          {/* List of Quotes */}
          <div className="space-y-2.5">
            {savedQuotes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                No saved quotes yet. Click "Save Current Quotation" to store your current project.
              </div>
            ) : (
              savedQuotes.map((q) => {
                const isCurrent = q.id === currentQuote.id;
                return (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {q.title || 'Untitled Quotation'}
                        </span>
                        {isCurrent && (
                          <span className="rounded bg-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Client: {q.clientName || 'N/A'} • #{q.quoteNumber} • {q.dateCreated}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadQuote(q);
                          onClose();
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
