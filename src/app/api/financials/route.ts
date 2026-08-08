import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allOrders = await db.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const paidOrders = allOrders.filter((o: any) => o.paymentStatus === 'PAID');

    const products = await db.product.findMany();
    const financialLogs = await db.financialLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Income from active paid orders
    const activePaidIncome = paidOrders.reduce((sum: number, order: any) => sum + order.totalMnt, 0);

    // Income from deleted paid orders (deleting a confirmed order does not erase earned revenue)
    const deletedPaidLogs = financialLogs.filter(
      (l: any) => l.type === 'PAID_ORDER_DELETED' || (l.type === 'ORDER_DELETED' && l.description?.includes('[Төлөв: Төлөгдсөн]'))
    );
    const deletedPaidIncome = deletedPaidLogs.reduce((sum: number, l: any) => sum + (l.amountMnt || 0), 0);

    // Total Financial Income
    const totalIncomeMnt = activePaidIncome + deletedPaidIncome;

    // Compute POS Sales vs Online Sales
    const posSalesMnt = paidOrders
      .filter((o: any) => o.orderNumber?.startsWith('POS-') || o.deliveryAddress?.includes('POS'))
      .reduce((sum: number, o: any) => sum + o.totalMnt, 0);

    const onlineSalesMnt = paidOrders
      .filter((o: any) => !o.orderNumber?.startsWith('POS-') && !o.deliveryAddress?.includes('POS'))
      .reduce((sum: number, o: any) => sum + o.totalMnt, 0);

    // Compute Cost of Goods Sold (COGS)
    let totalCogsMnt = 0;
    paidOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const prod = item.product;
        const costPerUnit = (prod?.costYuan && prod.costYuan > 0 && prod?.yuanRate && prod.yuanRate > 0)
          ? prod.costYuan * prod.yuanRate
          : (prod?.costMnt || 0);
        totalCogsMnt += costPerUnit * item.quantity;
      });
    });

    // Compute Gross Profit
    const grossProfitMnt = totalIncomeMnt - totalCogsMnt;

    // Compute Inventory Values (Total Stock Cost, Total Stock Retail Selling Value, and Potential Profit)
    let currentInventoryCostMnt = 0;
    let currentInventorySaleValueMnt = 0;
    products.forEach((p: any) => {
      const unitCost = (p.costYuan && p.costYuan > 0 && p.yuanRate && p.yuanRate > 0)
        ? p.costYuan * p.yuanRate
        : (p.costMnt || 0);

      currentInventoryCostMnt += unitCost * (p.stock || 0);
      const sellingPrice = p.isDiscounted && p.discountPriceMnt ? p.discountPriceMnt : p.priceMnt;
      currentInventorySaleValueMnt += sellingPrice * (p.stock || 0);
    });

    const currentInventoryPotentialProfitMnt = currentInventorySaleValueMnt - currentInventoryCostMnt;
    const pendingOrdersCount = allOrders.filter((o: any) => o.paymentStatus === 'PENDING_PAYMENT').length;
    const deletedLogs = financialLogs.filter((l: any) => l.type === 'PAID_ORDER_DELETED' || l.type === 'ORDER_DELETED' || l.description?.includes('Устгагдсан'));

    return NextResponse.json({
      paidSales: totalIncomeMnt,
      totalIncomeMnt,
      activePaidIncome,
      deletedPaidIncome,
      posSalesMnt,
      onlineSalesMnt,
      totalCogsMnt,
      totalProfit: grossProfitMnt,
      netProfitMnt: grossProfitMnt,
      currentInventoryCostMnt,
      currentInventorySaleValueMnt,
      currentInventoryPotentialProfitMnt,
      paidOrdersCount: paidOrders.length,
      pendingOrdersCount,
      totalProductsCount: products.length,
      outOfStockCount: products.filter((p: any) => p.stock === 0).length,
      orders: allOrders,
      financialLogs,
      deletedLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
