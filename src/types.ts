export type CurrencyCode = 'USD' | 'CNY' | 'MAD' | 'EGP' | 'EUR' | 'GBP' | 'AUD' | 'CAD';

export interface ExchangeRates {
  USD: number; // base 1 USD = X in other currencies or 1 unit = X USD
  CNY: number; // Chinese Yuan (RMB)
  MAD: number; // Moroccan Dirham
  EGP: number; // Egyptian Pound
  EUR: number;
  GBP: number;
  AUD: number;
  CAD: number;
}

export type CalcMode = 'full_quote' | 'shipping_only' | 'service_only';

export type MarkupType = 'fixed' | 'percent';

export interface CurrencySnapshot {
  factoryCost: number;
  profit: number;
  packagingCost?: number;
}

export interface ProductItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  // Factory cost input
  factoryCostCurrency: CurrencyCode;
  factoryCostPerUnit: number; // e.g. 5.50 RMB or 0.80 USD
  // Agent micro profit on product
  profitType: MarkupType;
  profitPerUnit: number; // e.g. 0.34 RMB or 0.05 USD, or 8%
  // Physical specs
  unitWeightKg: number; // for auto-calculating total shipping weight
  cbmPerUnit?: number;
  packagingCostPerUnit?: number; // packaging in factory currency
  packagingCurrency?: CurrencyCode;
  notes?: string;

  // Zero-drift precision anchor and multi-currency snapshots
  anchorCurrency?: CurrencyCode;
  currencySnapshots?: Partial<Record<CurrencyCode, CurrencySnapshot>>;
}

export type ShippingMethod = 'air_express' | 'air_cargo_ddp' | 'sea_ddp' | 'sea_fob' | 'sea_cif' | 'rail_ddp' | 'truck_freight';

export interface ShippingDetails {
  enabled: boolean;
  method: ShippingMethod;
  departurePort: string; // e.g. Shenzhen, Ningbo, Yiwu, Guangzhou
  destinationCountry: string; // e.g. USA, Germany, UK, Australia
  destinationCity?: string;
  
  // Freight calculation basis
  calcBasis: 'per_kg' | 'total_fixed' | 'per_cbm' | 'per_unit';
  grossWeightKg: number;
  volumetricWeightKg?: number;
  cbm?: number;
  
  // Real Freight Cost (what forwarder charges agent)
  costCurrency: CurrencyCode;
  baseCostRate: number; // e.g. $4.50/kg or $1200 flat
  
  // Agent Profit on Shipping
  agentProfitType: 'per_kg' | 'total_fixed' | 'percent';
  agentProfitValue: number; // e.g. +$0.50/kg or +15% or +$200 flat
  
  transitTimeDays?: string; // e.g. "5-8 days" or "25-30 days"
  doorDeliveryIncluded: boolean;
  notes?: string;
}

export interface CustomsDetails {
  enabled: boolean;
  tariffPercent: number; // e.g. 7.5% import duty on CIF/FOB value
  customsClearanceFee: number; // fixed fee (e.g. $150)
  customsFeeCurrency: CurrencyCode;
  portHandlingFee: number; // e.g. $80
  portFeeCurrency: CurrencyCode;
  
  // Agent Markup on Customs & Clearance
  agentMarkupType: 'fixed' | 'percent';
  agentMarkupValue: number; // e.g. $50 flat or 10%
  
  vatPercent?: number; // EU/UK VAT if applicable
  notes?: string;
}

export interface ServiceItem {
  id: string;
  name: string; // e.g. "Factory Audit", "Pre-shipment Inspection", "Sample consolidation", "Barcode labeling"
  costCurrency: CurrencyCode;
  agentBaseCost: number; // What agent pays (inspector, transit, materials)
  clientPriceCurrency: CurrencyCode;
  clientPrice: number; // What client is charged
  unitType: 'fixed' | 'per_unit' | 'per_day';
  description?: string;
}

export interface SourcingQuote {
  id: string;
  quoteNumber: string;
  title: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientCountry: string;
  dateCreated: string;
  validUntil: string;
  incoterm: string; // DDP, FOB, EXW, CIF, etc.
  
  mode: CalcMode;
  targetCurrency: CurrencyCode; // Main client billing currency (e.g. USD or EUR)
  items: ProductItem[];
  shipping: ShippingDetails;
  customs: CustomsDetails;
  services: ServiceItem[];
  
  // Global Sourcing Service Fee (if any)
  sourcingFeeType: 'percent_product' | 'fixed' | 'per_unit' | 'none';
  sourcingFeeValue: number; // e.g. 5% of order value or $300 fixed
  sourcingFeeCurrency: CurrencyCode;
  
  // Payment terms & agent info
  paymentTerms: string;
  leadTimeWeeks?: string;
  agentCompanyName: string;
  agentContact: string;
  notes: string;
}

export interface UnitCalculation {
  productId: string;
  productName: string;
  quantity: number;
  
  // In Target Currency
  factoryCostPerUnit: number;
  productProfitPerUnit: number;
  clientProductPricePerUnit: number;
  
  // Allocated costs per unit in Target Currency
  shippingCostPerUnit: number;
  shippingProfitPerUnit: number;
  clientShippingPerUnit: number;
  
  customsCostPerUnit: number;
  customsProfitPerUnit: number;
  clientCustomsPerUnit: number;
  
  serviceCostPerUnit: number;
  serviceProfitPerUnit: number;
  clientServicePerUnit: number;
  
  // Per-unit Grand totals
  totalCostPerUnit: number;
  totalNetProfitPerUnit: number;
  finalClientPricePerUnit: number;
  profitMarginPercent: number; // Profit / Client Price * 100
  
  // Line totals
  totalLineCost: number;
  totalLineProfit: number;
  totalLineClientPrice: number;
}

export interface QuoteCalculationSummary {
  totalQuantity: number;
  targetCurrency: CurrencyCode;
  
  // Product Totals
  productTotalCost: number;
  productTotalProfit: number;
  productClientTotal: number;
  
  // Shipping Totals
  shippingTotalCost: number;
  shippingTotalProfit: number;
  shippingClientTotal: number;
  
  // Customs Totals
  customsTotalCost: number;
  customsTotalProfit: number;
  customsClientTotal: number;
  
  // Services Totals
  servicesTotalCost: number;
  servicesTotalProfit: number;
  servicesClientTotal: number;
  
  // Sourcing Fee
  sourcingFeeClientTotal: number;
  sourcingFeeNetProfit: number;
  
  // Grand Totals (in Target Currency)
  grandTotalCost: number;
  grandTotalNetProfit: number;
  grandTotalClientPrice: number;
  
  // Blended per-unit metrics
  averageCostPerUnit: number;
  averageNetProfitPerUnit: number;
  averageClientPricePerUnit: number;
  overallProfitMarginPercent: number; // Profit / Client Price * 100
  
  itemCalculations: UnitCalculation[];
}
