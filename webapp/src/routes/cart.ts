import { Hono } from 'hono';
import { Env, CartItemWithProduct, ApiResponse, AuthUser } from '../types';

const cart = new Hono<{ Bindings: Env }>();

/**
 * カート内容取得
 */
cart.get('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    
    const cartItems = await c.env.DB.prepare(`
      SELECT 
        ci.*,
        p.name as product_name,
        p.price as product_price,
        p.weight as product_weight,
        pi.image_url as product_image_url,
        i.stock_quantity,
        i.reserved_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      LEFT JOIN inventory inv ON p.id = inv.product_id
      WHERE ci.user_id = ? AND p.status = 'active'
      ORDER BY ci.created_at DESC
    `).bind(user.id).all<{
      id: number,
      user_id: number,
      product_id: number,
      quantity: number,
      product_name: string,
      product_price: number,
      product_weight: number,
      product_image_url: string,
      stock_quantity: number,
      reserved_quantity: number,
      created_at: string,
      updated_at: string
    }>();
    
    const items = cartItems.results?.map(item => ({
      ...item,
      available_stock: (item.stock_quantity || 0) - (item.reserved_quantity || 0),
      total_price: item.product_price * item.quantity
    })) || [];
    
    // カート合計計算
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return c.json<ApiResponse<{cart: any}>>({
      success: true,
      data: {
        cart: {
          items,
          subtotal,
          total_items: totalItems,
          item_count: items.length
        }
      }
    });
    
  } catch (error) {
    console.error('Cart fetch error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * カートに商品追加
 */
cart.post('/add', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { product_id, quantity }: { product_id: number, quantity: number } = await c.req.json();
    
    // バリデーション
    if (!product_id || !quantity || quantity <= 0) {
      return c.json<ApiResponse>({
        success: false,
        error: '商品IDと数量を正しく入力してください'
      }, 400);
    }
    
    // 商品存在確認
    const product = await c.env.DB.prepare(`
      SELECT p.*, i.stock_quantity, i.reserved_quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ? AND p.status = 'active'
    `).bind(product_id).first<{
      id: number,
      name: string,
      price: number,
      stock_quantity: number,
      reserved_quantity: number
    }>();
    
    if (!product) {
      return c.json<ApiResponse>({
        success: false,
        error: '商品が見つかりません'
      }, 404);
    }
    
    // 在庫確認
    const availableStock = (product.stock_quantity || 0) - (product.reserved_quantity || 0);
    if (availableStock < quantity) {
      return c.json<ApiResponse>({
        success: false,
        error: `在庫が不足しています（在庫: ${availableStock}個）`
      }, 400);
    }
    
    // 既存のカートアイテム確認
    const existingItem = await c.env.DB.prepare(`
      SELECT * FROM cart_items 
      WHERE user_id = ? AND product_id = ?
    `).bind(user.id, product_id).first<{id: number, quantity: number}>();
    
    if (existingItem) {
      // 既存アイテムの数量更新
      const newQuantity = existingItem.quantity + quantity;
      
      if (availableStock < newQuantity) {
        return c.json<ApiResponse>({
          success: false,
          error: `追加できません。合計在庫が不足しています（在庫: ${availableStock}個、カート内: ${existingItem.quantity}個）`
        }, 400);
      }
      
      await c.env.DB.prepare(`
        UPDATE cart_items 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newQuantity, existingItem.id).run();
      
    } else {
      // 新しいカートアイテム追加
      await c.env.DB.prepare(`
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES (?, ?, ?)
      `).bind(user.id, product_id, quantity).run();
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: 'カートに追加しました'
    });
    
  } catch (error) {
    console.error('Cart add error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * カートアイテム数量更新
 */
cart.put('/update/:id', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const cartItemId = parseInt(c.req.param('id'));
    const { quantity }: { quantity: number } = await c.req.json();
    
    // バリデーション
    if (!cartItemId || quantity < 0) {
      return c.json<ApiResponse>({
        success: false,
        error: '無効なパラメータです'
      }, 400);
    }
    
    // 数量が0の場合は削除
    if (quantity === 0) {
      await c.env.DB.prepare(`
        DELETE FROM cart_items 
        WHERE id = ? AND user_id = ?
      `).bind(cartItemId, user.id).run();
      
      return c.json<ApiResponse>({
        success: true,
        message: 'カートから削除しました'
      });
    }
    
    // カートアイテム確認
    const cartItem = await c.env.DB.prepare(`
      SELECT ci.*, p.name, i.stock_quantity, i.reserved_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE ci.id = ? AND ci.user_id = ?
    `).bind(cartItemId, user.id).first<{
      id: number,
      product_id: number,
      current_quantity: number,
      stock_quantity: number,
      reserved_quantity: number
    }>();
    
    if (!cartItem) {
      return c.json<ApiResponse>({
        success: false,
        error: 'カートアイテムが見つかりません'
      }, 404);
    }
    
    // 在庫確認
    const availableStock = (cartItem.stock_quantity || 0) - (cartItem.reserved_quantity || 0);
    if (availableStock < quantity) {
      return c.json<ApiResponse>({
        success: false,
        error: `在庫が不足しています（在庫: ${availableStock}個）`
      }, 400);
    }
    
    // 数量更新
    await c.env.DB.prepare(`
      UPDATE cart_items 
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(quantity, cartItemId).run();
    
    return c.json<ApiResponse>({
      success: true,
      message: 'カートを更新しました'
    });
    
  } catch (error) {
    console.error('Cart update error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * カートアイテム削除
 */
cart.delete('/remove/:id', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const cartItemId = parseInt(c.req.param('id'));
    
    if (!cartItemId) {
      return c.json<ApiResponse>({
        success: false,
        error: '無効なカートアイテムIDです'
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      DELETE FROM cart_items 
      WHERE id = ? AND user_id = ?
    `).bind(cartItemId, user.id).run();
    
    if (result.changes === 0) {
      return c.json<ApiResponse>({
        success: false,
        error: 'カートアイテムが見つかりません'
      }, 404);
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: 'カートから削除しました'
    });
    
  } catch (error) {
    console.error('Cart remove error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * カート全体クリア
 */
cart.delete('/clear', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    
    await c.env.DB.prepare(`
      DELETE FROM cart_items WHERE user_id = ?
    `).bind(user.id).run();
    
    return c.json<ApiResponse>({
      success: true,
      message: 'カートを空にしました'
    });
    
  } catch (error) {
    console.error('Cart clear error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

export default cart;