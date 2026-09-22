import React, { useState } from 'react';
import {
  Download,
  Building2,
  Calendar,
  CreditCard,
  Ship,
  ShieldAlert,
  FileCheck,
  Printer,
  Sparkles,
  ExternalLink,
  Package,
} from 'lucide-react';
import { SourcingQuote, QuoteCalculationSummary, CurrencyCode, ExchangeRates } from '../types';
import {
  formatMoney,
  CURRENCY_INFO,
  convertCurrency,
  KEY_SOURCING_CURRENCIES,
} from '../utils/currencies';

interface ClientQuotePreviewProps {
  quote: SourcingQuote;
  summary: QuoteCalculationSummary;
  targetCurrency: CurrencyCode;
  rates: ExchangeRates;
  onDownloadPDF: (type: 'client' | 'internal') => void;
  decimals: number;
  onUpdateQuote: (updates: Partial<SourcingQuote>) => void;
}

export const ClientQuotePreview: React.FC<ClientQuotePreviewProps> = ({
  quote,
  summary,
  targetCurrency,
  rates,
  onDownloadPDF,
  decimals,
  onUpdateQuote,
}) => {
  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Official Quotation Preview (Client Document)
          </h2>
          <p className="text-xs text-slate-500">
            Clean, professional invoice layout. Shipping & customs are itemized as separate line items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDownloadPDF('client')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-xs transition-all active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF Quotation
          </button>
        </div>
      </div>

      {/* Invoice Sheet */}
      <div
        id="client-quotation-sheet"
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-md space-y-8 max-w-4xl mx-auto"
      >
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400 font-black text-sm">
                CN
              </div>
              <input
                type="text"
                value={quote.agentCompanyName || 'China Sourcing & Logistics Partner'}
                onChange={(e) => onUpdateQuote({ agentCompanyName: e.target.value })}
                className="text-lg font-black text-slate-900 border-0 p-0 focus:ring-0 w-full sm:w-80"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct China Sourcing • Quality Assurance • Global Logistics
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Commercial Quotation
            </span>
            <div className="mt-2 text-xs font-mono text-slate-600 space-y-0.5">
              <div>
                Quote #: <span className="font-bold text-slate-900">{quote.quoteNumber}</span>
              </div>
              <div>Date: {quote.dateCreated}</div>
              <div>Valid Until: {quote.validUntil}</div>
            </div>
          </div>
        </div>

        {/* Client & Terms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-2">
              Quoted To (Client):
            </span>
            <div className="space-y-1 font-medium text-slate-800">
              <input
                type="text"
                value={quote.clientName}
                onChange={(e) => onUpdateQuote({ clientName: e.target.value })}
                placeholder="Client Name"
                className="font-bold text-sm text-slate-900 bg-transparent border-0 p-0 w-full focus:ring-0"
              />
              <input
                type="text"
                value={quote.clientCompany || ''}
                onChange={(e) => onUpdateQuote({ clientCompany: e.target.value })}
                placeholder="Client Company"
                className="text-slate-600 bg-transparent border-0 p-0 w-full focus:ring-0"
              />
              <input
                type="text"
                value={quote.clientCountry}
                onChange={(e) => onUpdateQuote({ clientCountry: e.target.value })}
                placeholder="Destination Country"
                className="text-slate-600 bg-transparent border-0 p-0 w-full focus:ring-0"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-2">
              Trade & Delivery Terms:
            </span>
            <div className="space-y-2 text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-24">Incoterm:</span>
                <input
                  type="text"
                  value={quote.incoterm}
                  onChange={(e) => onUpdateQuote({ incoterm: e.target.value })}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 w-24">Payment Terms:</span>
                <input
                  type="text"
                  value={quote.paymentTerms}
                  onChange={(e) => onUpdateQuote({ paymentTerms: e.target.value })}
                  placeholder="30% deposit, 70% before delivery"
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 1. Itemized Product Table (Pure Product Price) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-4 w-4 text-amber-600" />
              1. Product Items (Factory Sourcing)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Currencies: {targetCurrency}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Quoted Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal ({targetCurrency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {summary.itemCalculations.map((item, idx) => (
                  <tr key={item.productId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-sans font-bold text-slate-900">
                      {item.productName}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-bold">
                      {item.quantity.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3 text-right font-black text-amber-900 bg-amber-50/40">
                      {formatMoney(item.clientProductPricePerUnit, targetCurrency, decimals)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatMoney(item.totalLineClientPrice, targetCurrency, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Separate Logistics, Customs & Services Line Items */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            2. Freight, Clearance & Value-Added Services (Separate Lines)
          </span>

          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs overflow-hidden">
            {/* Shipping Line Item */}
            <div className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="font-bold text-slate-900">
                    International Shipping & Freight
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {quote.shipping.enabled
                      ? `${quote.shipping.departurePort || 'China Port'} to ${quote.shipping.destinationCountry || 'Destination'} via ${quote.shipping.method.replace(/_/g, ' ').toUpperCase()} (${quote.shipping.transitTimeDays || 'standard transit'})`
                      : 'Not included (FOB China Port handoff to client carrier)'}
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="font-black text-sm text-slate-900">
                  {quote.shipping.enabled
                    ? formatMoney(summary.shippingClientTotal, targetCurrency, 2)
                    : 'FOB (Excluded)'}
                </span>
              </div>
            </div>

            {/* Customs Clearance Line Item */}
            <div className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-purple-600" />
                <div>
                  <span className="font-bold text-slate-900">
                    Customs Brokerage & Import Clearance
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {quote.customs.enabled
                      ? `Import documentation, filing, and estimated tariffs (${quote.customs.tariffPercent || 0}%)`
                      : 'Excluded (Client handles import clearance)'}
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="font-black text-sm text-slate-900">
                  {quote.customs.enabled
                    ? formatMoney(summary.customsClientTotal, targetCurrency, 2)
                    : 'Excluded'}
                </span>
              </div>
            </div>

            {/* Value Added Services Line Item */}
            {summary.servicesClientTotal > 0 && (
              <div className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-teal-600" />
                  <div>
                    <span className="font-bold text-slate-900">
                      Quality Inspection & Value-Added Services
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {quote.services.map((s) => s.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="font-black text-sm text-slate-900">
                    {formatMoney(summary.servicesClientTotal, targetCurrency, 2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Grand Total Box */}
        <div className="flex justify-end pt-4">
          <div className="w-full sm:w-80 rounded-2xl bg-slate-900 text-white p-5 space-y-2.5 font-mono shadow-lg">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Products Subtotal:</span>
              <span className="font-bold">
                {formatMoney(summary.productClientTotal, targetCurrency, 2)}
              </span>
            </div>

            {quote.shipping.enabled && (
              <div className="flex justify-between text-xs text-slate-300">
                <span>Shipping Freight:</span>
                <span className="font-bold">
                  {formatMoney(summary.shippingClientTotal, targetCurrency, 2)}
                </span>
              </div>
            )}

            {quote.customs.enabled && (
              <div className="flex justify-between text-xs text-slate-300">
                <span>Customs & Clearance:</span>
                <span className="font-bold">
                  {formatMoney(summary.customsClientTotal, targetCurrency, 2)}
                </span>
              </div>
            )}

            {summary.servicesClientTotal > 0 && (
              <div className="flex justify-between text-xs text-slate-300">
                <span>Services & QC:</span>
                <span className="font-bold">
                  {formatMoney(summary.servicesClientTotal, targetCurrency, 2)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-2 flex justify-between items-baseline text-sm">
              <span className="font-bold text-amber-400">Grand Total Quoted:</span>
              <span className="text-xl font-black text-amber-400">
                {formatMoney(summary.grandTotalClientPrice, targetCurrency, 2)}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Currency Conversion Reference (RMB • USD • MAD • EGP) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Multi-Currency Conversion Reference (RMB • USD • MAD • Egypt Pound)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {KEY_SOURCING_CURRENCIES.map((c) => {
              const totalVal = convertCurrency(
                summary.grandTotalClientPrice,
                targetCurrency,
                c,
                rates,
                0
              );
              const unitVal = convertCurrency(
                summary.averageClientPricePerUnit,
                targetCurrency,
                c,
                rates,
                0
              );
              return (
                <div key={c} className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                    <span>{CURRENCY_INFO[c].flag}</span>
                    <span>{c === 'CNY' ? 'RMB (¥)' : c === 'MAD' ? 'MAD (DH)' : c === 'EGP' ? 'EGP (E£)' : c}</span>
                  </div>
                  <div className="font-mono">
                    <div className="text-sm font-black text-slate-900">
                      {formatMoney(totalVal, c, 2)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {CURRENCY_INFO[c].symbol}
                      {unitVal < 1 ? unitVal.toFixed(4) : unitVal.toFixed(3)} / pc
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
