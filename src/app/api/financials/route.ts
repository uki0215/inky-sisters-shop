import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const allOrders = await db.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const paidOrders = allOrders.filter((o: any) => o.paymentStatus === 'PAID');
    // If paid orders exist, use paid orders; otherwise include all non-cancelled orders for initial calculation visibility
    const activeOrders = paidOrders.length > 0 ? paidOrders : allOrders;

    const products = await db.product.findMany();
    const financialLogs = await db.financialLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Compute Income
    const totalIncomeMnt = activeOrders.reduce((sum: number, order: any) => sum + order.totalMnt, 0);

    // Compute Cost of Goods Sold (COGS)
    let totalCogsMnt = 0;
    activeOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const costPerUnit = item.product?.costMnt || 0;
        totalCogsMnt += costPerUnit * item.quantity;
      });
    });

    // Compute Gross Profit
    const grossProfitMnt = totalIncomeMnt - totalCogsMnt;

    // Compute Inventory Values (Total Stock Cost, Total Stock Retail Selling Value, and Potential Profit)
    let currentInventoryCostMnt = 0;
    let currentInventorySaleValueMnt = 0;
    products.forEach((p: any) => {
      currentInventoryCostMnt += (p.costMnt || 0) * p.stock;
      const sellingPrice = p.isDiscounted && p.discountPriceMnt ? p.discountPriceMnt : p.priceMnt;
      currentInventorySaleValueMnt += sellingPrice * p.stock;
    });

    const currentInventoryPotentialProfitMnt = currentInventorySaleValueMnt - currentInventoryCostMnt;
    const pendingOrdersCount = allOrders.filter((o: any) => o.paymentStatus === 'PENDING_PAYMENT').length;

    return NextResponse.json({
      paidSales: totalIncomeMnt,
      totalIncomeMnt,
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
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
