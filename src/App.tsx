/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ProfitSummaryCard } from './components/ProfitSummaryCard';
import { ProductSection } from './components/ProductSection';
import { ShippingSection } from './components/ShippingSection';
import { CustomsAndServicesSection } from './components/CustomsAndServicesSection';
import { ClientQuotePreview } from './components/ClientQuotePreview';
import { ExchangeRateModal } from './components/ExchangeRateModal';
import { PresetsModal } from './components/PresetsModal';
import { SavedQuotesModal } from './components/SavedQuotesModal';
import { SourcingQuote, CalcMode, CurrencyCode, ExchangeRates } from './types';
import { calculateQuote } from './utils/calculator';
import { DEFAULT_EXCHANGE_RATES } from './utils/currencies';
import { PRESET_QUOTES } from './utils/presets';
import { generateQuotePDF } from './utils/pdfGenerator';
import {
  FileText,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Truck,
  Package,
  ShieldAlert,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export type SectionView = 'all' | 'product_alone' | 'shipping_alone' | 'customs_alone' | 'preview';

export default function App() {
  // Start with the user scenario preset (50k pcs @ 0.30 RMB + 0.05 RMB profit -> 0.35 RMB quote)
  const [quote, setQuote] = useState<SourcingQuote>(PRESET_QUOTES[0].quote);

  // Exchange rates & FX safety buffer
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_EXCHANGE_RATES);
  const [fxBufferPercent, setFxBufferPercent] = useState<number>(1.0); // 1% buffer

  // View state
  const [isClientView, setIsClientView] = useState<boolean>(false); // false = Agent Internal Audit, true = Client Clean
  const [decimals, setDecimals] = useState<number>(3); // 3 decimals default for micro-margins like 0.050 RMB

  // Active section view: calculate sections alone or all together
  const [activeSection, setActiveSection] = useState<SectionView>('product_alone');

  // Modals
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isSavedQuotesModalOpen, setIsSavedQuotesModalOpen] = useState(false);

  // Total physical weight calculated from all product items
  const totalCalculatedWeightKg = useMemo(() => {
    return quote.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitWeightKg) || 0),
      0
    );
  }, [quote.items]);

  // Real-time calculation summary (Guaranteed no blended overhead into product price)
  const summary = useMemo(() => {
    return calculateQuote(quote, rates, fxBufferPercent);
  }, [quote, rates, fxBufferPercent]);

  // Handle Mode Change
  const handleSelectMode = (newMode: CalcMode) => {
    setQuote((prev) => {
      if (newMode === 'shipping_only') {
        setActiveSection('shipping_alone');
        return {
          ...prev,
          mode: newMode,
          shipping: { ...prev.shipping, enabled: true },
          customs: { ...prev.customs, enabled: false },
        };
      }
      if (newMode === 'service_only') {
        setActiveSection('customs_alone');
        return {
          ...prev,
          mode: newMode,
          shipping: { ...prev.shipping, enabled: false },
          customs: { ...prev.customs, enabled: false },
        };
      }
      return {
        ...prev,
        mode: newMode,
        shipping: { ...prev.shipping, enabled: true },
        customs: { ...prev.customs, enabled: true },
      };
    });
  };

  const handleSelectCurrency = (curr: CurrencyCode) => {
    setQuote((prev) => ({
      ...prev,
      targetCurrency: curr,
    }));
  };

  const handleUpdateQuote = (updates: Partial<SourcingQuote>) => {
    setQuote((prev) => ({ ...prev, ...updates }));
  };

  const handleDownloadPDF = (type: 'client' | 'internal') => {
    generateQuotePDF(quote, summary, rates, type);
  };

  const handleLoadUser50kScenario = () => {
    setQuote(PRESET_QUOTES[0].quote);
    setActiveSection('product_alone');
  };

  const handleNewQuote = () => {
    const newQuote: SourcingQuote = {
      id: `quote_${Date.now()}`,
      quoteNumber: `CN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: 'New China Sourcing Order',
      clientName: 'New Client',
      clientCountry: 'United States',
      dateCreated: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      incoterm: 'FOB / DDP',
      mode: 'full_quote',
      targetCurrency: 'CNY',
      items: [
        {
          id: `item_1`,
          name: 'Custom Product Component',
          quantity: 50000,
          factoryCostCurrency: 'CNY',
          factoryCostPerUnit: 0.30,
          profitType: 'fixed',
          profitPerUnit: 0.05,
          unitWeightKg: 0.02,
        },
      ],
      shipping: {
        enabled: false,
        method: 'sea_ddp',
        departurePort: 'Ningbo Port',
        destinationCountry: 'United States',
        calcBasis: 'per_kg',
        grossWeightKg: 1000,
        costCurrency: 'USD',
        baseCostRate: 1.5,
        agentProfitType: 'per_kg',
        agentProfitValue: 0.3,
        transitTimeDays: '25-30 days',
        doorDeliveryIncluded: true,
      },
      customs: {
        enabled: false,
        tariffPercent: 3.5,
        customsClearanceFee: 120,
        customsFeeCurrency: 'USD',
        portHandlingFee: 80,
        portFeeCurrency: 'USD',
        agentMarkupType: 'fixed',
        agentMarkupValue: 50,
      },
      services: [],
      sourcingFeeType: 'none',
      sourcingFeeValue: 0,
      sourcingFeeCurrency: 'USD',
      paymentTerms: '30% deposit, 70% before container dispatch',
      agentCompanyName: 'China Sourcing & Logistics Partner',
      agentContact: 'sourcing@agent.cn',
      notes: 'Product quoted strictly per unit. Shipping and customs quoted separately.',
    };
    setQuote(newQuote);
    setActiveSection('product_alone');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 antialiased selection:bg-amber-200 selection:text-amber-900">
      {/* Navigation Header */}
      <Navbar
        mode={quote.mode}
        onSelectMode={handleSelectMode}
        targetCurrency={quote.targetCurrency}
        onSelectCurrency={handleSelectCurrency}
        rates={rates}
        fxBufferPercent={fxBufferPercent}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        isClientView={isClientView}
        onToggleClientView={() => setIsClientView(!isClientView)}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        onDownloadPDF={handleDownloadPDF}
        onOpenSavedQuotes={() => setIsSavedQuotesModalOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Section Alone Navigation Bar */}
        <div className="rounded-2xl bg-white p-3.5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Section Alone Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveSection('product_alone')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSection === 'product_alone'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span>1. Product Calculator (Alone)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSection('shipping_alone');
                  if (!quote.shipping.enabled) {
                    handleUpdateQuote({ shipping: { ...quote.shipping, enabled: true } });
                  }
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSection === 'shipping_alone'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                <span>2. Shipping Calculator (Alone)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSection('customs_alone');
                  if (!quote.customs.enabled) {
                    handleUpdateQuote({ customs: { ...quote.customs, enabled: true } });
                  }
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSection === 'customs_alone'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>3. Customs & Services (Alone)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('all')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSection === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>All Sections</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('preview')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSection === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Quotation & PDF</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadUser50kScenario}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-100 hover:bg-amber-200 px-3 py-1.5 text-xs font-black text-amber-900 border border-amber-300 transition-colors shadow-2xs"
                title="Loads 50,000 units @ 0.30 RMB + 0.05 RMB profit -> 0.35 RMB quote"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                <span>⚡ 50k pcs @ 0.30 RMB Example</span>
              </button>
            </div>
          </div>

          {/* Context Helper Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Notice:</span>
              <span>
                {activeSection === 'product_alone' && 'Currently calculating Product Unit Price & Profit alone. Shipping and customs are NOT added to product unit price.'}
                {activeSection === 'shipping_alone' && 'Currently calculating International Freight & Freight Profit alone as an independent line item.'}
                {activeSection === 'customs_alone' && 'Currently calculating Customs Clearance, Tariffs & QC Inspection services independently.'}
                {activeSection === 'all' && 'All sections displayed together on one page. Each section calculates its own costs and profits independently.'}
                {activeSection === 'preview' && 'Official client invoice format and downloadable PDF report.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Project:</span>
              <input
                type="text"
                value={quote.title}
                onChange={(e) => handleUpdateQuote({ title: e.target.value })}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-bold text-slate-800 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Real-time Hero Profit & Landed Calculation Summary */}
        <ProfitSummaryCard
          quote={quote}
          summary={summary}
          targetCurrency={quote.targetCurrency}
          rates={rates}
          isClientView={isClientView}
          onDownloadPDF={handleDownloadPDF}
          decimals={decimals}
          onSetDecimals={setDecimals}
          onUpdateQuoteInfo={handleUpdateQuote}
        />

        {/* Active Section Content */}
        {activeSection === 'product_alone' && (
          <ProductSection
            items={quote.items}
            onChangeItems={(items) => handleUpdateQuote({ items })}
            targetCurrency={quote.targetCurrency}
            rates={rates}
            fxBufferPercent={fxBufferPercent}
            isClientView={isClientView}
          />
        )}

        {activeSection === 'shipping_alone' && (
          <ShippingSection
            shipping={quote.shipping}
            onChangeShipping={(shipping) => handleUpdateQuote({ shipping })}
            targetCurrency={quote.targetCurrency}
            totalUnits={summary.totalQuantity}
            totalCalculatedWeightKg={totalCalculatedWeightKg}
            rates={rates}
            fxBufferPercent={fxBufferPercent}
            isClientView={isClientView}
          />
        )}

        {activeSection === 'customs_alone' && (
          <CustomsAndServicesSection
            customs={quote.customs}
            onChangeCustoms={(customs) => handleUpdateQuote({ customs })}
            services={quote.services}
            onChangeServices={(services) => handleUpdateQuote({ services })}
            sourcingFeeType={quote.sourcingFeeType}
            sourcingFeeValue={quote.sourcingFeeValue}
            sourcingFeeCurrency={quote.sourcingFeeCurrency}
            onChangeSourcingFee={(type, val, curr) =>
              handleUpdateQuote({
                sourcingFeeType: type,
                sourcingFeeValue: val,
                sourcingFeeCurrency: curr,
              })
            }
            targetCurrency={quote.targetCurrency}
            totalUnits={summary.totalQuantity}
            rates={rates}
            fxBufferPercent={fxBufferPercent}
            isClientView={isClientView}
          />
        )}

        {activeSection === 'all' && (
          <div className="space-y-6">
            <ProductSection
              items={quote.items}
              onChangeItems={(items) => handleUpdateQuote({ items })}
              targetCurrency={quote.targetCurrency}
              rates={rates}
              fxBufferPercent={fxBufferPercent}
              isClientView={isClientView}
            />

            <ShippingSection
              shipping={quote.shipping}
              onChangeShipping={(shipping) => handleUpdateQuote({ shipping })}
              targetCurrency={quote.targetCurrency}
              totalUnits={summary.totalQuantity}
              totalCalculatedWeightKg={totalCalculatedWeightKg}
              rates={rates}
              fxBufferPercent={fxBufferPercent}
              isClientView={isClientView}
            />

            <CustomsAndServicesSection
              customs={quote.customs}
              onChangeCustoms={(customs) => handleUpdateQuote({ customs })}
              services={quote.services}
              onChangeServices={(services) => handleUpdateQuote({ services })}
              sourcingFeeType={quote.sourcingFeeType}
              sourcingFeeValue={quote.sourcingFeeValue}
              sourcingFeeCurrency={quote.sourcingFeeCurrency}
              onChangeSourcingFee={(type, val, curr) =>
                handleUpdateQuote({
                  sourcingFeeType: type,
                  sourcingFeeValue: val,
                  sourcingFeeCurrency: curr,
                })
              }
              targetCurrency={quote.targetCurrency}
              totalUnits={summary.totalQuantity}
              rates={rates}
              fxBufferPercent={fxBufferPercent}
              isClientView={isClientView}
            />
          </div>
        )}

        {activeSection === 'preview' && (
          <ClientQuotePreview
            quote={quote}
            summary={summary}
            targetCurrency={quote.targetCurrency}
            rates={rates}
            onUpdateQuote={handleUpdateQuote}
            onDownloadPDF={handleDownloadPDF}
            decimals={decimals}
          />
        )}
      </main>

      {/* Modals */}
      <ExchangeRateModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={rates}
        onUpdateRates={setRates}
        fxBufferPercent={fxBufferPercent}
        onUpdateFxBuffer={setFxBufferPercent}
      />

      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onLoadPreset={(loadedQuote) => setQuote(loadedQuote)}
      />

      <SavedQuotesModal
        isOpen={isSavedQuotesModalOpen}
        onClose={() => setIsSavedQuotesModalOpen(false)}
        currentQuote={quote}
        onLoadQuote={(loaded) => setQuote(loaded)}
        onNewQuote={handleNewQuote}
      />
    </div>
  );
}
