import { Hono } from 'hono';
import { Env, CreateOrderRequest, ApiResponse, AuthUser, PaymentMethod } from '../types';
import { 
  generateOrderNumber, 
  calculateTax, 
  calculateShippingFee, 
  calculateOrderTotal,
  reserveInventory,
  releaseInventory
} from '../utils/order';

const orders = new Hono<{ Bindings: Env }>();

/**
 * 注文作成
 */
orders.post('/create', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const orderData: CreateOrderRequest = await c.req.json();
    
    // バリデーション
    if (!orderData.shipping_address || !orderData.payment_method) {
      return c.json<ApiResponse>({
        success: false,
        error: '配送先住所と決済方法は必須です'
      }, 400);
    }
    
    const { shipping_address, payment_method, notes } = orderData;
    
    // 住所バリデーション
    const requiredFields = ['name', 'postal_code', 'prefecture', 'city', 'address_line', 'phone'];
    for (const field of requiredFields) {
      if (!shipping_address[field as keyof typeof shipping_address]) {
        return c.json<ApiResponse>({
          success: false,
          error: `${field}は必須項目です`
        }, 400);
      }
    }
    
    // カート内容取得
    const cartItems = await c.env.DB.prepare(`
      SELECT 
        ci.product_id,
        ci.quantity,
        p.name as product_name,
        p.price as product_price,
        p.weight as product_weight
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.status = 'active'
    `).bind(user.id).all<{
      product_id: number,
      quantity: number,
      product_name: string,
      product_price: number,
      product_weight: number
    }>();
    
    if (!cartItems.results || cartItems.results.length === 0) {
      return c.json<ApiResponse>({
        success: false,
        error: 'カートが空です'
      }, 400);
    }
    
    const items = cartItems.results;
    
    // 在庫確認と予約
    const inventoryResult = await reserveInventory(
      c.env.DB,
      items.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
    );
    
    if (!inventoryResult.success) {
      return c.json<ApiResponse>({
        success: false,
        error: inventoryResult.error
      }, 400);
    }
    
    try {
      // 注文金額計算
      const subtotal = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
      const shippingFee = calculateShippingFee(subtotal, items);
      const taxAmount = calculateTax(subtotal);
      const totalAmount = calculateOrderTotal(subtotal, shippingFee, taxAmount);
      
      // 注文番号生成
      const orderNumber = generateOrderNumber();
      
      // 注文作成
      const orderResult = await c.env.DB.prepare(`
        INSERT INTO orders (
          user_id, order_number, status, payment_method, payment_status,
          subtotal, shipping_fee, tax_amount, total_amount,
          shipping_name, shipping_postal_code, shipping_prefecture,
          shipping_city, shipping_address_line, shipping_building, shipping_phone,
          notes
        ) VALUES (?, ?, 'pending', ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id, orderNumber, payment_method,
        subtotal, shippingFee, taxAmount, totalAmount,
        shipping_address.name, shipping_address.postal_code, shipping_address.prefecture,
        shipping_address.city, shipping_address.address_line, shipping_address.building || null,
        shipping_address.phone, notes || null
      ).run();
      
      if (!orderResult.success) {
        throw new Error('注文の作成に失敗しました');
      }
      
      const orderId = orderResult.meta.last_row_id;
      
      // 注文アイテム作成
      for (const item of items) {
        await c.env.DB.prepare(`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_price, quantity, total_price
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          orderId, item.product_id, item.product_name, item.product_price,
          item.quantity, item.product_price * item.quantity
        ).run();
      }
      
      // カートクリア
      await c.env.DB.prepare(`
        DELETE FROM cart_items WHERE user_id = ?
      `).bind(user.id).run();
      
      return c.json<ApiResponse<{order: any}>>({
        success: true,
        data: {
          order: {
            id: orderId,
            order_number: orderNumber,
            total_amount: totalAmount,
            payment_method: payment_method,
            status: 'pending'
          }
        },
        message: '注文を作成しました'
      });
      
    } catch (error) {
      // エラー時は在庫予約を解除
      await releaseInventory(
        c.env.DB,
        items.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
      );
      throw error;
    }
    
  } catch (error) {
    console.error('Order creation error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * 注文履歴取得
 */
orders.get('/history', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const orders = await c.env.DB.prepare(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all<{
      id: number,
      order_number: string,
      status: string,
      payment_method: string,
      payment_status: string,
      total_amount: number,
      created_at: string
    }>();
    
    return c.json<ApiResponse<{orders: any[]}>>({
      success: true,
      data: {
        orders: orders.results || []
      }
    });
    
  } catch (error) {
    console.error('Order history error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * 注文詳細取得
 */
orders.get('/:id', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const orderId = parseInt(c.req.param('id'));
    
    if (!orderId) {
      return c.json<ApiResponse>({
        success: false,
        error: '無効な注文IDです'
      }, 400);
    }
    
    // 注文基本情報取得
    const order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ? AND user_id = ?
    `).bind(orderId, user.id).first<{
      id: number,
      order_number: string,
      status: string,
      payment_method: string,
      payment_status: string,
      subtotal: number,
      shipping_fee: number,
      tax_amount: number,
      total_amount: number,
      shipping_name: string,
      shipping_postal_code: string,
      shipping_prefecture: string,
      shipping_city: string,
      shipping_address_line: string,
      shipping_building: string,
      shipping_phone: string,
      tracking_number: string,
      notes: string,
      created_at: string,
      updated_at: string
    }>();
    
    if (!order) {
      return c.json<ApiResponse>({
        success: false,
        error: '注文が見つかりません'
      }, 404);
    }
    
    // 注文アイテム取得
    const orderItems = await c.env.DB.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).bind(orderId).all<{
      id: number,
      product_id: number,
      product_name: string,
      product_price: number,
      quantity: number,
      total_price: number
    }>();
    
    return c.json<ApiResponse<{order: any}>>({
      success: true,
      data: {
        order: {
          ...order,
          items: orderItems.results || []
        }
      }
    });
    
  } catch (error) {
    console.error('Order detail error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * 注文キャンセル
 */
orders.post('/:id/cancel', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const orderId = parseInt(c.req.param('id'));
    
    if (!orderId) {
      return c.json<ApiResponse>({
        success: false,
        error: '無効な注文IDです'
      }, 400);
    }
    
    // 注文確認
    const order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ? AND user_id = ?
    `).bind(orderId, user.id).first<{
      id: number,
      status: string,
      payment_status: string
    }>();
    
    if (!order) {
      return c.json<ApiResponse>({
        success: false,
        error: '注文が見つかりません'
      }, 404);
    }
    
    // キャンセル可能か確認
    if (order.status !== 'pending' && order.status !== 'paid') {
      return c.json<ApiResponse>({
        success: false,
        error: 'この注文はキャンセルできません'
      }, 400);
    }
    
    // 注文アイテム取得（在庫予約解除用）
    const orderItems = await c.env.DB.prepare(`
      SELECT product_id, quantity FROM order_items WHERE order_id = ?
    `).bind(orderId).all<{product_id: number, quantity: number}>();
    
    // 注文ステータス更新
    await c.env.DB.prepare(`
      UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(orderId).run();
    
    // 在庫予約解除
    if (orderItems.results) {
      await releaseInventory(c.env.DB, orderItems.results);
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: '注文をキャンセルしました'
    });
    
  } catch (error) {
    console.error('Order cancel error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

export default orders;