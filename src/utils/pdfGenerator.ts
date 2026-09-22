import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SourcingQuote, QuoteCalculationSummary, ExchangeRates } from '../types';
import { formatMoney, CURRENCY_INFO, convertCurrency, KEY_SOURCING_CURRENCIES } from './currencies';

export function generateQuotePDF(
  quote: SourcingQuote,
  summary: QuoteCalculationSummary,
  rates: ExchangeRates,
  type: 'client' | 'internal' = 'client'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = quote.targetCurrency;
  const currSym = CURRENCY_INFO[currency].symbol;

  const isClient = type === 'client';
  const primaryColor: [number, number, number] = isClient ? [24, 43, 73] : [15, 76, 92]; // Deep navy for client, teal for internal
  const accentColor: [number, number, number] = [217, 119, 6]; // Warm amber accent

  // Document Title & Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const headerTitle = isClient
    ? 'OFFICIAL SOURCING & EXPORT QUOTATION'
    : 'INTERNAL SOURCING PROFIT & COST AUDIT';
  doc.text(headerTitle, 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${quote.agentCompanyName || 'China Sourcing & Supply Chain Partner'} | Quote #${quote.quoteNumber}`,
    14,
    21
  );

  doc.text(`Incoterms: ${quote.incoterm || 'DDP Door to Door'}`, 196, 14, { align: 'right' });
  doc.text(`Date: ${quote.dateCreated} | Valid Until: ${quote.validUntil}`, 196, 21, {
    align: 'right',
  });

  // Client & Order Info Box
  let currentY = 36;
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT INFORMATION', 14, currentY);
  doc.text('ORDER & LOGISTICS SPECIFICATION', 110, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Left Column
  doc.text(`Client Name: ${quote.clientName || 'Valued Client'}`, 14, currentY);
  if (quote.clientCompany) {
    currentY += 4.5;
    doc.text(`Company: ${quote.clientCompany}`, 14, currentY);
  }
  if (quote.clientEmail) {
    currentY += 4.5;
    doc.text(`Email: ${quote.clientEmail}`, 14, currentY);
  }
  currentY += 4.5;
  doc.text(`Destination: ${quote.clientCountry || 'International'}`, 14, currentY);

  // Right Column
  let rightY = 41;
  doc.text(`Origin / Port: ${quote.shipping.departurePort || 'China'}`, 110, rightY);
  rightY += 4.5;
  doc.text(
    `Shipping Method: ${quote.shipping.method ? quote.shipping.method.replace(/_/g, ' ').toUpperCase() : 'N/A'}`,
    110,
    rightY
  );
  rightY += 4.5;
  doc.text(
    `Total Units: ${summary.totalQuantity.toLocaleString()} pcs`,
    110,
    rightY
  );
  rightY += 4.5;
  doc.text(`Billing Currency: ${quote.targetCurrency} (${currSym})`, 110, rightY);

  currentY = Math.max(currentY, rightY) + 8;

  // Internal Audit Alert Box if internal
  if (!isClient) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, currentY, 182, 14, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CONFIDENTIAL AGENT COST & PROFIT MARGIN SHEET', 18, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Net Profit Per Unit: ${formatMoney(summary.averageNetProfitPerUnit, currency, 4)} | Total Net Profit: ${formatMoney(summary.grandTotalNetProfit, currency, 2)} (${summary.overallProfitMarginPercent.toFixed(1)}% margin)`,
      18,
      currentY + 11
    );
    currentY += 18;
  }

  // Table 1: Product Items
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. PRODUCT SPECIFICATIONS & PRICING', 14, currentY);
  currentY += 3;

  if (isClient) {
    // Client-facing product table - Pure Product Pricing
    const productRows = summary.itemCalculations.map((item, idx) => [
      idx + 1,
      item.productName,
      item.quantity.toLocaleString(),
      formatMoney(item.clientProductPricePerUnit, currency, 3),
      formatMoney(item.totalLineClientPrice, currency, 2),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          '#',
          'Item Description',
          'Qty (pcs)',
          `Quoted Unit Price (${currency})`,
          `Product Subtotal (${currency})`,
        ],
      ],
      body: productRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [40, 40, 40],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 26, halign: 'right' },
        3: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] },
        4: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    // Internal Agent Product Breakdown table (showing pure product factory cost vs profit)
    const internalRows = summary.itemCalculations.map((item, idx) => [
      idx + 1,
      item.productName,
      item.quantity.toLocaleString(),
      formatMoney(item.factoryCostPerUnit, currency, 3),
      `+${formatMoney(item.productProfitPerUnit, currency, 4)}`,
      formatMoney(item.clientProductPricePerUnit, currency, 3),
      formatMoney(item.totalLineCost, currency, 2),
      `+${formatMoney(item.totalLineProfit, currency, 2)}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          '#',
          'Product',
          'Qty',
          'Factory / Unit',
          'Profit / Unit',
          'Quoted / Unit',
          'Total Factory Cost',
          'Your Product Profit',
        ],
      ],
      body: internalRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 24, halign: 'right', textColor: [16, 120, 50], fontStyle: 'bold' },
        5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 26, halign: 'right' },
        7: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [16, 120, 50] },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Get Y after table
  const lastTableEnd = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 40;
  currentY = lastTableEnd + 8;

  // Logistics & Additional Services Overview
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. LOGISTICS, CUSTOMS & SERVICE SCOPE', 14, currentY);
  currentY += 4;

  const logisticsRows = [];

  if (quote.shipping.enabled) {
    const s = quote.shipping;
    const desc = `${s.departurePort || 'China'} to ${quote.clientCountry || 'Destination'} (${s.method.replace(/_/g, ' ').toUpperCase()}) - ${s.doorDeliveryIncluded ? 'Door delivery included' : 'Port to Port'}. Est. ${s.transitTimeDays || '10-25 days'}.`;
    if (isClient) {
      logisticsRows.push([
        'Freight & Logistics',
        desc,
        formatMoney(summary.shippingClientTotal, currency, 2),
      ]);
    } else {
      logisticsRows.push([
        'Freight & Logistics',
        `${desc} [Cost: ${formatMoney(summary.shippingTotalCost, currency, 2)} | Profit: +${formatMoney(summary.shippingTotalProfit, currency, 2)}]`,
        formatMoney(summary.shippingClientTotal, currency, 2),
      ]);
    }
  }

  if (quote.customs.enabled) {
    const c = quote.customs;
    const desc = `Tariff & Customs Clearance (${c.tariffPercent || 0}% duty estimated + import clearance & documentation).`;
    if (isClient) {
      logisticsRows.push([
        'Customs & Import Duties',
        desc,
        formatMoney(summary.customsClientTotal, currency, 2),
      ]);
    } else {
      logisticsRows.push([
        'Customs & Import Duties',
        `${desc} [Cost: ${formatMoney(summary.customsTotalCost, currency, 2)} | Profit: +${formatMoney(summary.customsTotalProfit, currency, 2)}]`,
        formatMoney(summary.customsClientTotal, currency, 2),
      ]);
    }
  }

  if (quote.services.length > 0) {
    quote.services.forEach((srv) => {
      const desc = srv.description || srv.name;
      if (isClient) {
        logisticsRows.push([
          srv.name,
          desc,
          formatMoney(srv.clientPrice, srv.clientPriceCurrency, 2),
        ]);
      } else {
        logisticsRows.push([
          srv.name,
          `${desc} [Cost: ${formatMoney(srv.agentBaseCost, srv.costCurrency, 2)}]`,
          formatMoney(srv.clientPrice, srv.clientPriceCurrency, 2),
        ]);
      }
    });
  }

  if (quote.sourcingFeeType !== 'none' && summary.sourcingFeeClientTotal > 0) {
    logisticsRows.push([
      'Sourcing & Supply Chain Management',
      'Supplier coordination, contract verification, sample verification & pre-shipment coordination.',
      formatMoney(summary.sourcingFeeClientTotal, currency, 2),
    ]);
  }

  if (logisticsRows.length === 0) {
    logisticsRows.push([
      'FOB Origin Factory',
      'Standard ex-factory handoff. Client arranges forwarder pickup.',
      formatMoney(0, currency, 2),
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Component', 'Service Scope & Terms', `Total (${currency})`]],
    body: logisticsRows,
    theme: 'striped',
    headStyles: {
      fillColor: [70, 80, 95],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 102 },
      2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 30;

  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // Summary Financial Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, isClient ? 38 : 46, 3, 3, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. FINANCIAL SUMMARY', 20, currentY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  let sumY = currentY + 16;
  doc.text(`Total Order Quantity:`, 20, sumY);
  doc.text(`${summary.totalQuantity.toLocaleString()} units`, 85, sumY, { align: 'right' });

  sumY += 5.5;
  doc.text(`Final All-Inclusive Price Per Unit:`, 20, sumY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatMoney(summary.averageClientPricePerUnit, currency, 3)} / unit`, 85, sumY, {
    align: 'right',
  });

  if (!isClient) {
    sumY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 120, 50);
    doc.text(`Agent Net Profit Per Unit:`, 20, sumY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatMoney(summary.averageNetProfitPerUnit, currency, 4)} / unit`, 85, sumY, {
      align: 'right',
    });

    sumY += 5.5;
    doc.text(`Total Order Net Profit:`, 20, sumY);
    doc.text(
      `${formatMoney(summary.grandTotalNetProfit, currency, 2)} (${summary.overallProfitMarginPercent.toFixed(1)}%)`,
      85,
      sumY,
      { align: 'right' }
    );
  }

  // Right column of summary: Grand Total Box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(100, currentY + 10, 90, isClient ? 22 : 28, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GRAND TOTAL AMOUNT (DDP / LANDED)', 145, currentY + 16, { align: 'center' });

  doc.setFontSize(14);
  doc.text(`${formatMoney(summary.grandTotalClientPrice, currency, 2)}`, 145, currentY + 24, {
    align: 'center',
  });

  if (!isClient) {
    doc.setFontSize(8);
    doc.setTextColor(187, 247, 208);
    doc.text(
      `Net Profit: ${formatMoney(summary.grandTotalNetProfit, currency, 2)}`,
      145,
      currentY + 32,
      { align: 'center' }
    );
  }

  currentY += isClient ? 46 : 54;

  // Multi-Currency Reference Table (RMB • USD • MAD • EGP)
  if (currentY > 215) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('4. MULTI-CURRENCY CONVERSION REFERENCE (RMB • USD • MAD • EGP)', 14, currentY);
  currentY += 3;

  const multiCurrencyRows = KEY_SOURCING_CURRENCIES.map((c) => {
    const totalInC = convertCurrency(summary.grandTotalClientPrice, currency, c, rates, 0);
    const unitInC = convertCurrency(summary.averageClientPricePerUnit, currency, c, rates, 0);
    const label =
      c === 'CNY'
        ? 'Chinese Yuan / RMB (CNY)'
        : c === 'MAD'
        ? 'Moroccan Dirham (MAD)'
        : c === 'EGP'
        ? 'Egyptian Pound (EGP)'
        : 'US Dollar (USD)';
    return [
      label,
      `1 USD = ${rates[c]} ${CURRENCY_INFO[c].symbol}`,
      `${formatMoney(unitInC, c, 3)} / pc`,
      formatMoney(totalInC, c, 2),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Currency', 'Exchange Rate (Base USD)', 'Price / Unit Equivalent', 'Total Order Equivalent']],
    body: multiCurrencyRows,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 45 },
      2: { cellWidth: 42, halign: 'right' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : currentY + 28;

  // Terms & Conditions Footer
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TERMS, CONDITIONS & PAYMENT', 14, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const termsText = [
    `• Payment Terms: ${quote.paymentTerms || '30% deposit with order, 70% balance before container dispatch/air handover'}.`,
    `• Lead Time: Production ${quote.leadTimeWeeks || '3-4 weeks'} after sample confirmation.`,
    `• FX Exchange Rates: Based on prevailing CNY/${quote.targetCurrency} parity. Quote valid until ${quote.validUntil}.`,
    `• Inspection: 100% cosmetic & functional check according to AQL standard level II before final release.`,
  ];

  termsText.forEach((t) => {
    doc.text(t, 14, currentY);
    currentY += 3.8;
  });

  if (quote.notes) {
    currentY += 1;
    doc.text(`• Special Notes: ${quote.notes}`, 14, currentY);
  }

  // Download PDF
  const filename = isClient
    ? `Quotation_${quote.quoteNumber || 'Sourcing'}_${quote.clientName ? quote.clientName.replace(/\s+/g, '_') : 'Client'}.pdf`
    : `Internal_Audit_Profit_${quote.quoteNumber || 'Sourcing'}.pdf`;

  doc.save(filename);
}
