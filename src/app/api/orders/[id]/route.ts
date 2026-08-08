import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { paymentStatus, orderStatus, paymentMethod, returnNote, updatedItems } = body;

    const existing = await db.order.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (returnNote !== undefined) {
      updateData.returnNote = returnNote;
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID') {
        updateData.paymentConfirmedAt = new Date();

        // Create financial income log
        await db.financialLog.create({
          data: {
            type: 'ORDER_INCOME',
            amountMnt: existing.totalMnt,
            description: `Захиалгын орлого (${paymentMethod || existing.paymentMethod || 'Төлбөр'}): ${existing.orderNumber} (${existing.customerName})`,
            referenceId: existing.id,
          },
        });
      }

      // If cancelled, restore stock with original purchase unit cost!
      if (paymentStatus === 'CANCELLED' && existing.paymentStatus !== 'CANCELLED') {
        for (const item of existing.items) {
          const updatedProd = await db.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          // Original unit cost at time of purchase
          const itemCostUnit = (item.costMnt !== null && item.costMnt !== undefined && item.costMnt > 0)
            ? item.costMnt
            : (item.product?.costYuan && item.product?.yuanRate ? item.product.costYuan * item.product.yuanRate : (item.product?.costMnt || 0));

          // Log Product History with original cost
          try {
            await db.productHistory.create({
              data: {
                productId: item.productId,
                changeType: 'ORDER_RETURN',
                description: `Захиалга цуцлагдсан буцаалт (${existing.orderNumber}): +${item.quantity} ш (Анх авсан нэгж өртөг: ${itemCostUnit.toLocaleString()}₮)`,
                newCostMnt: itemCostUnit,
                addedStock: item.quantity,
                newStock: updatedProd.stock,
                note: `Захиалга цуцлалт: ${existing.customerName} | Анх авсан өртгөөр (${itemCostUnit.toLocaleString()}₮) агуулахад буцааж оруулав`,
              },
            });
          } catch (e) {
            console.error('Failed to log product history for cancellation', e);
          }
        }
      }
    }

    if (orderStatus) {
      updateData.orderStatus = orderStatus;
    }

    // Handle order item edits / returns / swaps
    if (Array.isArray(updatedItems)) {
      let newTotalMnt = 0;
      const historyChanges: string[] = [];

      // 1. Process item quantity changes and returns
      for (const oldItem of existing.items) {
        const matchingNewItem = updatedItems.find((ni: any) => ni.productId === oldItem.productId);

        // Derive original unit cost at purchase time
        const originalUnitCost = (oldItem.costMnt !== null && oldItem.costMnt !== undefined && oldItem.costMnt > 0)
          ? oldItem.costMnt
          : (oldItem.product?.costYuan && oldItem.product?.yuanRate ? oldItem.product.costYuan * oldItem.product.yuanRate : (oldItem.product?.costMnt || 0));

        if (!matchingNewItem || matchingNewItem.quantity <= 0) {
          // Item completely removed / returned: restore full stock
          const updatedProd = await db.product.update({
            where: { id: oldItem.productId },
            data: { stock: { increment: oldItem.quantity } },
          });

          await db.orderItem.delete({
            where: { id: oldItem.id },
          });

          historyChanges.push(
            `❌ Буцаасан: "${oldItem.productName}" (${oldItem.quantity} ш) - Зарсан үнэ: ${Math.round(oldItem.quantity * oldItem.priceMnt).toLocaleString()}₮ | Авсан өртөг: ${Math.round(oldItem.quantity * originalUnitCost).toLocaleString()}₮`
          );

          // Record Product History with original purchase cost
          try {
            await db.productHistory.create({
              data: {
                productId: oldItem.productId,
                changeType: 'ORDER_RETURN',
                description: `Захиалга буцаалт (${existing.orderNumber}): +${oldItem.quantity} ш (Анх авсан нэгж өртөг: ${originalUnitCost.toLocaleString()}₮)`,
                newCostMnt: originalUnitCost,
                addedStock: oldItem.quantity,
                newStock: updatedProd.stock,
                note: `Захиалагч: ${existing.customerName} | Анх авсан өртгөөр (${originalUnitCost.toLocaleString()}₮) буцааж агуулахад оруулав`,
              },
            });
          } catch (e) {
            console.error('Failed to log product history for return', e);
          }
        } else {
          // Item quantity modified
          const qtyDiff = matchingNewItem.quantity - oldItem.quantity;
          if (qtyDiff !== 0) {
            const updatedProd = await db.product.update({
              where: { id: oldItem.productId },
              data: { stock: { decrement: qtyDiff } },
            });

            if (qtyDiff < 0) {
              const returnedQty = Math.abs(qtyDiff);
              historyChanges.push(
                `🔻 Тоо хассан (Буцаасан): "${oldItem.productName}" (${oldItem.quantity} ш ➔ ${matchingNewItem.quantity} ш, буцаасан ${returnedQty} ш - Авсан өртөг: ${Math.round(returnedQty * originalUnitCost).toLocaleString()}₮)`
              );

              // Log partial return with original purchase cost
              try {
                await db.productHistory.create({
                  data: {
                    productId: oldItem.productId,
                    changeType: 'ORDER_RETURN',
                    description: `Захиалга хэсэгчлэн буцаалт (${existing.orderNumber}): +${returnedQty} ш (Анх авсан нэгж өртөг: ${originalUnitCost.toLocaleString()}₮)`,
                    newCostMnt: originalUnitCost,
                    addedStock: returnedQty,
                    newStock: updatedProd.stock,
                    note: `Захиалагч: ${existing.customerName} | Анх авсан өртгөөр (${originalUnitCost.toLocaleString()}₮) буцааж агуулахад оруулав`,
                  },
                });
              } catch (e) {
                console.error('Failed to log product history for return edit', e);
              }
            } else {
              historyChanges.push(
                `🔺 Тоо нэмсэн: "${oldItem.productName}" (${oldItem.quantity} ш ➔ ${matchingNewItem.quantity} ш)`
              );

              try {
                await db.productHistory.create({
                  data: {
                    productId: oldItem.productId,
                    changeType: 'ORDER_EDIT',
                    description: `Захиалгын тоо өөрчлөгдсөн (${existing.orderNumber}): ${oldItem.quantity} ш -> ${matchingNewItem.quantity} ш`,
                    addedStock: -qtyDiff,
                    newStock: updatedProd.stock,
                    note: `Захиалагч: ${existing.customerName}`,
                  },
                });
              } catch (e) {
                console.error('Failed to log product history for edit', e);
              }
            }
          }

          const itemTotal = matchingNewItem.priceMnt * matchingNewItem.quantity;
          newTotalMnt += itemTotal;

          await db.orderItem.update({
            where: { id: oldItem.id },
            data: {
              quantity: matchingNewItem.quantity,
              priceMnt: matchingNewItem.priceMnt,
            },
          });
        }
      }

      // 2. Process newly added items (swaps/additions)
      for (const newItem of updatedItems) {
        const isExisting = existing.items.some((oi: any) => oi.productId === newItem.productId);
        if (!isExisting && newItem.quantity > 0) {
          // Decrement stock for new product
          const updatedProd = await db.product.update({
            where: { id: newItem.productId },
            data: { stock: { decrement: newItem.quantity } },
          });

          const itemTotal = newItem.priceMnt * newItem.quantity;
          newTotalMnt += itemTotal;

          await db.orderItem.create({
            data: {
              orderId: existing.id,
              productId: newItem.productId,
              productName: newItem.productName,
              barcode: newItem.barcode,
              priceMnt: newItem.priceMnt,
              quantity: newItem.quantity,
            },
          });

          historyChanges.push(
            `🟢 Солисон/Нэмсэн: "${newItem.productName}" (${newItem.quantity} ш) - ${Math.round(itemTotal).toLocaleString()}₮`
          );

          // Record Product History
          try {
            await db.productHistory.create({
              data: {
                productId: newItem.productId,
                changeType: 'ORDER_SWAP',
                description: `Захиалгаар солигдсон/нэмэгдсэн (${existing.orderNumber}): +${newItem.quantity} ш`,
                addedStock: -newItem.quantity,
                newStock: updatedProd.stock,
                note: `Захиалагч: ${existing.customerName}`,
              },
            });
          } catch (e) {
            console.error('Failed to log product history for swap', e);
          }
        }
      }

      updateData.totalMnt = newTotalMnt;

      // Log financial adjustment if total changed
      const totalDiff = newTotalMnt - existing.totalMnt;
      if (totalDiff !== 0) {
        await db.financialLog.create({
          data: {
            type: totalDiff < 0 ? 'ORDER_REFUND' : 'ORDER_ADJUSTMENT',
            amountMnt: Math.abs(totalDiff),
            description: totalDiff < 0
              ? `Захиалгын буцаалт/засвар: ${existing.orderNumber} (-${Math.abs(totalDiff).toLocaleString()}₮)`
              : `Захиалгын нэмэлт тооцоо: ${existing.orderNumber} (+${totalDiff.toLocaleString()}₮)`,
            referenceId: existing.id,
          },
        });
      }

      // Build structured History Log Entry if changes occurred
      if (historyChanges.length > 0) {
        const timestamp = new Date().toLocaleString('mn-MN');
        let logText = `📌 [${timestamp}] Захиалгын засвар / буцаалт:\n` + historyChanges.join('\n');

        if (totalDiff !== 0) {
          logText += `\n📊 Дүнгийн зөрүү: ${totalDiff < 0 ? '-' : '+'}${Math.abs(totalDiff).toLocaleString()}₮ (Шинэ нийт дүн: ${newTotalMnt.toLocaleString()}₮)`;
        }

        if (returnNote && returnNote.trim()) {
          logText += `\n📝 Тайлбар: ${returnNote.trim()}`;
        }

        const existingNote = existing.returnNote || '';
        updateData.returnNote = existingNote ? `${logText}\n\n${existingNote}` : logText;
      }
    }

    const updated = await db.order.update({
      where: { id: params.id },
      data: updateData,
      include: { items: true },
    });

    return NextResponse.json({
      order: updated,
      notification: {
        sent: true,
        type: 'EMAIL_SIMULATION',
        message: `Хэрэглэгч (${existing.customerName} - ${existing.customerEmail || existing.customerPhone}) руу захиалгын мэдээлэл шинэчлэгдсэн тухай мэдээлэл илгээгдлээ.`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await db.order.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only restore stock if order was PENDING/UNPAID (not yet paid/sold and not cancelled)
    if (existing.paymentStatus !== 'PAID' && existing.paymentStatus !== 'CANCELLED') {
      for (const item of existing.items) {
        const updatedProd = await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Original unit cost at time of purchase
        const itemCostUnit = (item.costMnt !== null && item.costMnt !== undefined && item.costMnt > 0)
          ? item.costMnt
          : (item.product?.costYuan && item.product?.yuanRate ? item.product.costYuan * item.product.yuanRate : (item.product?.costMnt || 0));

        try {
          await db.productHistory.create({
            data: {
              productId: item.productId,
              changeType: 'ORDER_RETURN',
              description: `Захиалга устгагдсан буцаалт (${existing.orderNumber}): +${item.quantity} ш (Анх авсан нэгж өртөг: ${itemCostUnit.toLocaleString()}₮)`,
              newCostMnt: itemCostUnit,
              addedStock: item.quantity,
              newStock: updatedProd.stock,
              note: `Захиалга устгалт: ${existing.customerName} | Анх авсан өртгөөр (${itemCostUnit.toLocaleString()}₮) агуулахад буцааж оруулав`,
            },
          });
        } catch (e) {
          console.error('Failed to log product history for order delete', e);
        }
      }
    }

    // Create permanent audit log entry for deleted order
    const isPaidOrder = existing.paymentStatus === 'PAID';
    const itemSummary = existing.items.map((i: any) => `${i.productName} (${i.quantity}ш)`).join(', ');
    await db.financialLog.create({
      data: {
        type: isPaidOrder ? 'PAID_ORDER_DELETED' : 'ORDER_DELETED',
        amountMnt: existing.totalMnt,
        description: `🗑️ Захиалга Устгагдсан: Код: ${existing.orderNumber} | Захиалагч: ${existing.customerName} (${existing.customerPhone}) | Дүн: ${existing.totalMnt.toLocaleString()}₮ [Төлөв: ${isPaidOrder ? 'Төлөгдсөн' : 'Төлөгдөөгүй'}] | Бараа: ${itemSummary}`,
        referenceId: `DELETED_${existing.id}`,
      },
    });

    await db.order.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Захиалга амжилттай устгагдлаа' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
