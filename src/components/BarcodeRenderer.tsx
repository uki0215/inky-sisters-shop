'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';

interface BarcodeRendererProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  showPrintButton?: boolean;
  productName?: string;
  priceMnt?: number;
}

export default function BarcodeRenderer({
  value,
  width = 1.8,
  height = 45,
  fontSize = 13,
  showPrintButton = true,
  productName = '',
  priceMnt = 0,
}: BarcodeRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (value && svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: true,
          fontSize: fontSize,
          font: 'monospace',
          margin: 6,
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [value, width, height, fontSize]);

  if (!value) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgHtml = svgRef.current?.outerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Бар код хэвлэх - ${value}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              margin: 0;
            }
            .label-card {
              border: 1px dashed #999;
              padding: 12px;
              text-align: center;
              border-radius: 8px;
              width: 240px;
              background: #fff;
            }
            .shop-name {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              color: #444;
              letter-spacing: 0.5px;
            }
            .prod-name {
              font-size: 12px;
              font-weight: 700;
              margin: 4px 0;
              color: #111;
            }
            .price {
              font-size: 14px;
              font-weight: 800;
              color: #d97706;
              margin-top: 4px;
            }
            @media print {
              .no-print { display: none !important; }
              .label-card { border: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="shop-name">INKY SISTERS SHOP</div>
            ${productName ? `<div class="prod-name">${productName}</div>` : ''}
            <div>${svgHtml}</div>
            ${priceMnt ? `<div class="price">${priceMnt.toLocaleString()} ₮</div>` : ''}
          </div>
          <br/>
          <button class="no-print" onclick="window.print()" style="padding: 9px 18px; font-weight: bold; background: #0f172a; color: #fff; border: none; border-radius: 8px; cursor: pointer;">
            🖨️ Хэвлэх (Print Sticker)
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center bg-white p-3 border border-teal-200/80 rounded-xl shadow-xs space-y-2">
      <svg ref={svgRef} className="max-w-full h-auto"></svg>
      {showPrintButton && (
        <button
          type="button"
          onClick={handlePrint}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Зураасан код хэвлэх (Sticker Print)</span>
        </button>
      )}
    </div>
  );
}
