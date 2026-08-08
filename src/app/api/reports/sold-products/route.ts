import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exportCsv = searchParams.get('export') === 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereOrder: any = {};
    if (startDate || endDate) {
      whereOrder.createdAt = {};
      if (startDate) whereOrder.createdAt.gte = new Date(startDate);
      if (endDate) whereOrder.createdAt.lte = new Date(endDate);
    }

    // Fetch order items with order and product details
    const orderItems: any[] = await db.orderItem.findMany({
      where: {
        order: whereOrder,
      },
      include: {
        order: true,
        product: true,
      },
    });

    // Aggregate sold products by product ID / Barcode
    const productStatsMap: { [key: string]: any } = {};

    orderItems.forEach((item) => {
      const key = item.productId || item.barcode;
      if (!productStatsMap[key]) {
        productStatsMap[key] = {
          productId: item.productId,
          barcode: item.barcode,
          productName: item.productName || item.product?.name || 'Бараа',
          totalQtySold: 0,
          unitPriceMnt: item.priceMnt,
          totalRevenueMnt: 0,
          unitCostMnt: item.product?.costMnt || 0,
          totalCostMnt: 0,
          totalProfitMnt: 0,
          ordersCount: 0,
        };
      }

      const cost = item.product?.costMnt || 0;
      const itemRevenue = item.priceMnt * item.quantity;
      const itemCost = cost * item.quantity;
      const itemProfit = itemRevenue - itemCost;

      productStatsMap[key].totalQtySold += item.quantity;
      productStatsMap[key].totalRevenueMnt += itemRevenue;
      productStatsMap[key].totalCostMnt += itemCost;
      productStatsMap[key].totalProfitMnt += itemProfit;
      productStatsMap[key].ordersCount += 1;
    });

    const reportList = Object.values(productStatsMap).sort((a: any, b: any) => b.totalRevenueMnt - a.totalRevenueMnt);

    // Total summary metrics
    const summary = {
      totalSoldQty: reportList.reduce((acc, curr) => acc + curr.totalQtySold, 0),
      totalRevenueMnt: reportList.reduce((acc, curr) => acc + curr.totalRevenueMnt, 0),
      totalCostMnt: reportList.reduce((acc, curr) => acc + curr.totalCostMnt, 0),
      totalProfitMnt: reportList.reduce((acc, curr) => acc + curr.totalProfitMnt, 0),
    };

    // Fetch deleted orders logs
    const deletedLogs = await db.financialLog.findMany({
      where: {
        OR: [
          { type: 'ORDER_DELETED' },
          { description: { contains: 'Устгагдсан' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (exportCsv) {
      // Build CSV with UTF-8 BOM byte for native Mongolian support in Excel
      const headers = ['Барааны Код (Barcode)', 'Барааны Нэр', 'Зарагдсан Тоо (Ширхэг)', 'Нэгж Үнэ (₮)', 'Нийт Борлуулалт (₮)', 'Нэгж Өртөг (₮)', 'Нийт Өртөг (₮)', 'Нийт Ашиг (₮)'];
      
      let csvContent = '\uFEFF' + headers.join(',') + '\n';

      reportList.forEach((row: any) => {
        const line = [
          `"${row.barcode}"`,
          `"${(row.productName || '').replace(/"/g, '""')}"`,
          row.totalQtySold,
          row.unitPriceMnt,
          row.totalRevenueMnt,
          row.unitCostMnt,
          row.totalCostMnt,
          row.totalProfitMnt,
        ].join(',');
        csvContent += line + '\n';
      });

      // Append summary line
      csvContent += `\n"НИЙТ ДҮН","","${summary.totalSoldQty} ш","","${summary.totalRevenueMnt}₮","","${summary.totalCostMnt}₮","${summary.totalProfitMnt}₮"\n`;

      // Append Deleted Orders Section in Excel
      if (deletedLogs.length > 0) {
        csvContent += `\n\n"=== УСТГАГДСАН ЗАХИАЛГУУДЫН ТҮҮХ ЖУРНАЛ (DELETED ORDERS LOG) ==="\n`;
        csvContent += `"Огноо Цаг","Устгагдсан Захиалгын Дэлгэрэнгүй Мэдээлэл","Хамаарах Дүн (₮)"\n`;
        deletedLogs.forEach((log: any) => {
          const dateStr = new Date(log.createdAt).toLocaleString('mn-MN');
          const cleanDesc = (log.description || '').replace(/"/g, '""');
          csvContent += `"${dateStr}",""${cleanDesc}"","${log.amountMnt || 0}₮"\n`;
        });
      }

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="inky_sold_products_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary,
      items: reportList,
      rawItems: orderItems,
      deletedLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
