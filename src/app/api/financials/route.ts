import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allOrders = await db.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const paidOrders = allOrders.filter((o: any) => o.paymentStatus === 'PAID' && o.totalMnt > 0);

    // Fetch products WITH their full history (for lifetime batch cost calculation)
    const products = await db.product.findMany({
      include: { history: { orderBy: { createdAt: 'asc' } } },
    });
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

    // Total Net Financial Income
    // (order.totalMnt is already dynamically updated when order items are returned or edited)
    const totalIncomeMnt = activePaidIncome + deletedPaidIncome;

    // Compute POS Sales vs Online Sales
    const posPaidIncome = paidOrders
      .filter((o: any) => o.orderNumber?.startsWith('POS-') || o.deliveryAddress?.includes('POS'))
      .reduce((sum: number, o: any) => sum + o.totalMnt, 0);

    const deletedPosIncome = deletedPaidLogs
      .filter((l: any) => l.description?.includes('POS-') || l.description?.includes('Касс'))
      .reduce((sum: number, l: any) => sum + (l.amountMnt || 0), 0);

    const posSalesMnt = posPaidIncome + deletedPosIncome;
    const onlineSalesMnt = Math.max(0, totalIncomeMnt - posSalesMnt);

    // Compute Cost of Goods Sold (COGS)
    // Uses item.costMnt (unit cost locked at purchase/checkout time) if available,
    // otherwise falls back to current product cost for historical compatibility.
    let totalCogsMnt = 0;
    paidOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const prod = item.product;
        const fallbackCost = (prod?.costYuan && prod.costYuan > 0 && prod?.yuanRate && prod.yuanRate > 0)
          ? prod.costYuan * prod.yuanRate
          : (prod?.costMnt || 0);
        const costPerUnit = (item.costMnt !== null && item.costMnt !== undefined) ? item.costMnt : fallbackCost;
        totalCogsMnt += costPerUnit * item.quantity;
      });
    });

    // Compute Gross Profit
    const grossProfitMnt = totalIncomeMnt - totalCogsMnt;

    // -------------------------------------------------------------------------
    // LIFETIME TOTAL ACQUIRED INVENTORY — computed from ProductHistory batches
    // -------------------------------------------------------------------------
    // For each product, sum ALL INITIAL and RESTOCK events:
    //   batch cost contribution  = addedStock × costMntAtThatTime
    //   batch sale contribution  = addedStock × salePriceAtThatTime
    //
    // Then the remaining (current) stock's sale value is updated to the LATEST
    // selling price (per user spec: "үлдсэн барааг сүүлийн үнийн өөрчлөлтөөр").
    // -------------------------------------------------------------------------

    let totalPurchasedCostMnt = 0;
    let totalPurchasedSaleValueMnt = 0;

    // Also compute current inventory metrics (for the second stats section)
    let currentInventoryCostMnt = 0;
    let currentInventorySaleValueMnt = 0;

    products.forEach((p: any) => {
      // ── Current unit cost & price ──
      const currentUnitCost = (p.costYuan && p.costYuan > 0 && p.yuanRate && p.yuanRate > 0)
        ? p.costYuan * p.yuanRate
        : (p.costMnt || 0);
      const currentSellingPrice = p.isDiscounted && p.discountPriceMnt ? p.discountPriceMnt : p.priceMnt;
      
      const restockEvents = (p.history || []).filter(
        (h: any) => h.changeType === 'INITIAL' || h.changeType === 'RESTOCK'
      );

      // ── 1. Calculate Current Inventory Cost using FIFO batch valuation ──
      let productRemainingCost = 0;
      let remainingQtyToAllocate = p.stock || 0;

      if (restockEvents.length > 0 && remainingQtyToAllocate > 0) {
        // Allocate remaining stock starting from newest batch to oldest batch (FIFO: oldest items sold first)
        const reverseBatches = [...restockEvents].reverse();
        for (const b of reverseBatches) {
          if (remainingQtyToAllocate <= 0) break;
          const qty = b.addedStock || 0;
          if (qty <= 0) continue;

          let batchUnitCost: number;
          if (b.newCostMnt !== null && b.newCostMnt !== undefined && b.newCostMnt > 0) {
            batchUnitCost = b.newCostMnt;
          } else if (b.newCostYuan && b.newCostYuan > 0 && b.newYuanRate && b.newYuanRate > 0) {
            batchUnitCost = b.newCostYuan * b.newYuanRate;
          } else {
            batchUnitCost = currentUnitCost;
          }

          const qtyFromThisBatch = Math.min(remainingQtyToAllocate, qty);
          productRemainingCost += qtyFromThisBatch * batchUnitCost;
          remainingQtyToAllocate -= qtyFromThisBatch;
        }

        // If remaining stock exceeds logged restock batches (e.g. manual stock edit), value remaining at currentUnitCost
        if (remainingQtyToAllocate > 0) {
          productRemainingCost += remainingQtyToAllocate * currentUnitCost;
        }
      } else {
        // Fallback for products without restock history
        productRemainingCost = currentUnitCost * (p.stock || 0);
      }

      currentInventoryCostMnt     += productRemainingCost;
      currentInventorySaleValueMnt += currentSellingPrice * (p.stock || 0);

      // ── Lifetime batches from ProductHistory ──
      let cumulativeHistoryCostMnt      = 0;
      let cumulativeHistorySaleValueMnt = 0;

      if (restockEvents.length > 0) {
        restockEvents.forEach((h: any) => {
          const qty = h.addedStock || 0;
          if (qty <= 0) return;

          // Unit cost at the time of this batch
          let batchUnitCost: number;
          if (h.newCostMnt !== null && h.newCostMnt !== undefined && h.newCostMnt > 0) {
            batchUnitCost = h.newCostMnt;
          } else if (h.newCostYuan && h.newCostYuan > 0 && h.newYuanRate && h.newYuanRate > 0) {
            batchUnitCost = h.newCostYuan * h.newYuanRate;
          } else {
            batchUnitCost = currentUnitCost;
          }

          // Sale price at the time of this batch
          const batchSalePrice = h.newPriceMnt || currentSellingPrice;

          cumulativeHistoryCostMnt      += qty * batchUnitCost;
          cumulativeHistorySaleValueMnt += qty * batchSalePrice;
        });

        // Adjust sale value: replace the REMAINING stock's historical sale price
        // with the LATEST sale price (per user requirement)
        const totalHistoryStock = restockEvents.reduce((s: number, h: any) => s + (h.addedStock || 0), 0);
        const currentStock = p.stock || 0;

        if (totalHistoryStock > 0 && currentStock > 0) {
          const avgHistoricalSalePrice = cumulativeHistorySaleValueMnt / totalHistoryStock;
          const remainingHistoricalSaleValue = avgHistoricalSalePrice * currentStock;
          const remainingCurrentSaleValue    = currentSellingPrice     * currentStock;
          cumulativeHistorySaleValueMnt = cumulativeHistorySaleValueMnt
            - remainingHistoricalSaleValue
            + remainingCurrentSaleValue;
        }

        totalPurchasedCostMnt      += cumulativeHistoryCostMnt;
        totalPurchasedSaleValueMnt += cumulativeHistorySaleValueMnt;
      } else {
        totalPurchasedCostMnt      += currentUnitCost     * (p.stock || 0);
        totalPurchasedSaleValueMnt += currentSellingPrice * (p.stock || 0);
      }
    });

    // Also add COGS from sold items to lifetime totals
    // (history covers total-ever-acquired qty; COGS is the cost of the sold portion)
    // Since restockEvents sums ALL batches (sold + remaining), totalPurchasedCostMnt
    // already represents the FULL lifetime acquired cost (no need to add COGS again).
    // However, for sale value: history covers the sale price of all acquired items,
    // and we've already adjusted remaining stock to use latest price.

    // Lifetime Potential Gross Profit = Lifetime Sale Value - Lifetime Cost
    const currentInventoryPotentialProfitMnt = currentInventorySaleValueMnt - currentInventoryCostMnt;
    const totalPurchasedPotentialProfitMnt   = totalPurchasedSaleValueMnt   - totalPurchasedCostMnt;

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
      totalPurchasedCostMnt,
      totalPurchasedSaleValueMnt,
      totalPurchasedPotentialProfitMnt,
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

