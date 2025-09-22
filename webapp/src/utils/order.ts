/**
 * 注文番号生成（ユニークな番号）
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EC${timestamp}${random}`;
}

/**
 * 消費税計算（10%）
 */
export function calculateTax(subtotal: number): number {
  return Math.floor(subtotal * 0.1);
}

/**
 * 送料計算
 */
export function calculateShippingFee(subtotal: number, items: Array<{weight?: number, quantity: number}>): number {
  // 無料配送の条件（10,000円以上）
  if (subtotal >= 10000) {
    return 0;
  }
  
  // 重量による送料計算
  const totalWeight = items.reduce((sum, item) => {
    return sum + (item.weight || 100) * item.quantity; // デフォルト100g
  }, 0);
  
  if (totalWeight <= 500) {
    return 500; // 500円
  } else if (totalWeight <= 1000) {
    return 700; // 700円
  } else if (totalWeight <= 2000) {
    return 900; // 900円
  } else {
    return 1200; // 1200円
  }
}

/**
 * 注文合計金額計算
 */
export function calculateOrderTotal(subtotal: number, shippingFee: number, taxAmount: number): number {
  return subtotal + shippingFee + taxAmount;
}

/**
 * 在庫確認と予約
 */
export async function reserveInventory(
  db: D1Database, 
  items: Array<{product_id: number, quantity: number}>
): Promise<{success: boolean, error?: string}> {
  
  try {
    // トランザクション開始
    await db.prepare('BEGIN TRANSACTION').run();
    
    for (const item of items) {
      // 現在の在庫確認
      const inventory = await db.prepare(`
        SELECT stock_quantity, reserved_quantity 
        FROM inventory 
        WHERE product_id = ?
      `).bind(item.product_id).first<{stock_quantity: number, reserved_quantity: number}>();
      
      if (!inventory) {
        await db.prepare('ROLLBACK').run();
        return { success: false, error: `商品ID ${item.product_id} の在庫情報が見つかりません` };
      }
      
      const availableStock = inventory.stock_quantity - inventory.reserved_quantity;
      
      if (availableStock < item.quantity) {
        await db.prepare('ROLLBACK').run();
        return { success: false, error: `商品ID ${item.product_id} の在庫が不足しています（在庫: ${availableStock}個）` };
      }
      
      // 在庫を予約
      await db.prepare(`
        UPDATE inventory 
        SET reserved_quantity = reserved_quantity + ? 
        WHERE product_id = ?
      `).bind(item.quantity, item.product_id).run();
    }
    
    // コミット
    await db.prepare('COMMIT').run();
    return { success: true };
    
  } catch (error) {
    await db.prepare('ROLLBACK').run();
    return { success: false, error: '在庫予約中にエラーが発生しました' };
  }
}

/**
 * 在庫予約解除
 */
export async function releaseInventory(
  db: D1Database, 
  items: Array<{product_id: number, quantity: number}>
): Promise<void> {
  for (const item of items) {
    await db.prepare(`
      UPDATE inventory 
      SET reserved_quantity = reserved_quantity - ? 
      WHERE product_id = ? AND reserved_quantity >= ?
    `).bind(item.quantity, item.product_id, item.quantity).run();
  }
}

/**
 * 在庫確定（商品発送時）
 */
export async function confirmInventory(
  db: D1Database, 
  items: Array<{product_id: number, quantity: number}>
): Promise<void> {
  for (const item of items) {
    await db.prepare(`
      UPDATE inventory 
      SET stock_quantity = stock_quantity - ?, 
          reserved_quantity = reserved_quantity - ?
      WHERE product_id = ?
    `).bind(item.quantity, item.quantity, item.product_id).run();
  }
}