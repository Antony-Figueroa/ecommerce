import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatUSD, formatBS } from './utils';

// No necesitamos extender el tipo manualmente si usamos el plugin correctamente
// Pero para TypeScript, podemos seguir usando la interfaz si lo preferimos o usar casting
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export const generateInventoryReport = (products: any[]) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");

  // Header
  doc.setFontSize(18);
  doc.setTextColor(0, 128, 0); // Verde para inventario
  doc.text("Reporte de Inventario - Ana's Supplements", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha de generación: ${dateStr}`, 14, 28);

  const tableData = products.map(p => [
    p.sku,
    p.name,
    p.stock,
    `$${formatUSD(p.purchasePrice)}`,
    `$${formatUSD(p.price)}`,
    `${p.profitMargin}x`
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['SKU', 'Producto', 'Stock', 'Costo', 'Precio', 'Margen']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 128, 0] },
  });

  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
};

export const generateSalesReport = (sales: any[], startDate?: string, endDate?: string) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");
  const rangeStr = startDate && endDate ? `Rango: ${startDate} al ${endDate}` : 'Todas las ventas';

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 255); // Azul para ventas
  doc.text("Reporte de Ventas - Ana's Supplements", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha de generación: ${dateStr}`, 14, 28);
  doc.text(rangeStr, 14, 34);

  let totalUSD = 0;
  let totalBS = 0;
  let totalProfit = 0;

  const tableData = sales.map(s => {
    totalUSD += Number(s.totalUSD || 0);
    totalBS += Number(s.totalBS || 0);
    totalProfit += Number(s.profitUSD || 0);

    return [
      s.saleNumber,
      format(new Date(s.createdAt), "dd/MM/yy HH:mm"),
      s.customerName || 'N/A',
      `$${formatUSD(s.totalUSD)}`,
      `Bs ${formatBS(s.totalBS)}`,
      `$${formatUSD(s.profitUSD)}`
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [['# Venta', 'Fecha', 'Cliente', 'Total USD', 'Total BS', 'Ganancia USD']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 255] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Resumen Totales:`, 14, finalY + 15);
  doc.text(`Ventas Totales: $${formatUSD(totalUSD)} / Bs ${formatBS(totalBS)}`, 14, finalY + 22);
  doc.text(`Ganancia Estimada: $${formatUSD(totalProfit)}`, 14, finalY + 29);

  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
};

export const generateFinancialReport = (sales: any[], products: any[]) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");

  doc.setFontSize(18);
  doc.setTextColor(128, 0, 128); // Purpura para financiero
  doc.text("Reporte Financiero Global - Ana's Supplements", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha de generación: ${dateStr}`, 14, 28);

  const totalInventoryValue = products.reduce((acc, p) => acc + (Number(p.purchasePrice) * p.stock), 0);
  const totalPotentialSale = products.reduce((acc, p) => acc + (Number(p.price) * p.stock), 0);
  const totalSalesUSD = sales.reduce((acc, s) => acc + Number(s.totalUSD), 0);
  const totalProfitUSD = sales.reduce((acc, s) => acc + Number(s.profitUSD), 0);

  autoTable(doc, {
    startY: 40,
    head: [['Métrica', 'Valor USD']],
    body: [
      ['Valor de Inventario (Costo)', `$${formatUSD(totalInventoryValue)}`],
      ['Valor de Inventario (Venta)', `$${formatUSD(totalPotentialSale)}`],
      ['Ganancia Potencial Inventario', `$${formatUSD(totalPotentialSale - totalInventoryValue)}`],
      ['Ventas Acumuladas', `$${formatUSD(totalSalesUSD)}`],
      ['Ganancias Reales Obtenidas', `$${formatUSD(totalProfitUSD)}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [128, 0, 128] },
  });

  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
};
