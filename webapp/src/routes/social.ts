import { Hono } from 'hono';
import { Env, ShopSocialAccount, SocialShare, UpdateProfileRequest, ApiResponse, AuthUser } from '../types';

const social = new Hono<{ Bindings: Env }>();

/**
 * ショップのSNSアカウント一覧取得
 */
social.get('/shop-accounts', async (c) => {
  try {
    const accounts = await c.env.DB.prepare(`
      SELECT * FROM shop_social_accounts 
      WHERE is_active = true 
      ORDER BY sort_order ASC
    `).all<ShopSocialAccount>();
    
    return c.json<ApiResponse<{accounts: ShopSocialAccount[]}>>({
      success: true,
      data: {
        accounts: accounts.results || []
      }
    });
    
  } catch (error) {
    console.error('Shop social accounts fetch error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * 商品シェア記録（認証任意）
 */
social.post('/share/:productId', async (c) => {
  try {
    const productId = parseInt(c.req.param('productId'));
    const { platform }: { platform: string } = await c.req.json();
    
    if (!productId || !platform) {
      return c.json<ApiResponse>({
        success: false,
        error: '商品IDとプラットフォームは必須です'
      }, 400);
    }
    
    // 有効なプラットフォームかチェック
    const validPlatforms = ['twitter', 'facebook', 'instagram', 'line', 'copy_link'];
    if (!validPlatforms.includes(platform)) {
      return c.json<ApiResponse>({
        success: false,
        error: '無効なプラットフォームです'
      }, 400);
    }
    
    // 商品存在確認
    const product = await c.env.DB.prepare(`
      SELECT id FROM products WHERE id = ? AND status = 'active'
    `).bind(productId).first();
    
    if (!product) {
      return c.json<ApiResponse>({
        success: false,
        error: '商品が見つかりません'
      }, 404);
    }
    
    // ユーザーIDを取得（認証されている場合のみ）
    let userId = null;
    try {
      const user = c.get('user') as AuthUser;
      if (user) {
        userId = user.id;
      }
    } catch (error) {
      // 認証されていない場合は無視（匿名シェア）
    }
    
    // シェア記録を保存
    await c.env.DB.prepare(`
      INSERT INTO social_shares (user_id, product_id, platform)
      VALUES (?, ?, ?)
    `).bind(userId, productId, platform).run();
    
    return c.json<ApiResponse>({
      success: true,
      message: 'シェアを記録しました'
    });
    
  } catch (error) {
    console.error('Social share error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * ユーザープロフィール更新（SNS情報含む）
 */
social.put('/profile', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const profileData: UpdateProfileRequest = await c.req.json();
    
    // 更新可能なフィールドのみ抽出
    const allowedFields = [
      'name', 'phone', 'bio', 'twitter_handle', 'instagram_handle', 
      'facebook_url', 'youtube_url', 'tiktok_handle', 'linkedin_url', 'website_url'
    ];
    
    const updateFields: string[] = [];
    const values: any[] = [];
    
    // 動的にSET句を構築
    Object.entries(profileData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value || null);
      }
    });
    
    if (updateFields.length === 0) {
      return c.json<ApiResponse>({
        success: false,
        error: '更新するフィールドがありません'
      }, 400);
    }
    
    // updated_atも更新
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(user.id);
    
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    const result = await c.env.DB.prepare(query).bind(...values).run();
    
    if (!result.success) {
      return c.json<ApiResponse>({
        success: false,
        error: 'プロフィールの更新に失敗しました'
      }, 500);
    }
    
    // 更新されたユーザー情報を取得
    const updatedUser = await c.env.DB.prepare(`
      SELECT id, email, name, phone, role, bio, 
             twitter_handle, instagram_handle, facebook_url, 
             youtube_url, tiktok_handle, linkedin_url, website_url,
             created_at, updated_at
      FROM users WHERE id = ?
    `).bind(user.id).first();
    
    return c.json<ApiResponse<{user: any}>>({
      success: true,
      data: { user: updatedUser },
      message: 'プロフィールを更新しました'
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * ユーザーの詳細プロフィール取得（SNS情報含む）
 */
social.get('/profile', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    
    const userProfile = await c.env.DB.prepare(`
      SELECT id, email, name, phone, role, bio,
             twitter_handle, instagram_handle, facebook_url,
             youtube_url, tiktok_handle, linkedin_url, website_url,
             created_at, updated_at
      FROM users WHERE id = ?
    `).bind(user.id).first();
    
    if (!userProfile) {
      return c.json<ApiResponse>({
        success: false,
        error: 'ユーザーが見つかりません'
      }, 404);
    }
    
    return c.json<ApiResponse<{user: any}>>({
      success: true,
      data: { user: userProfile }
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * シェア統計取得（商品別）
 */
social.get('/stats/:productId', async (c) => {
  try {
    const productId = parseInt(c.req.param('productId'));
    
    if (!productId) {
      return c.json<ApiResponse>({
        success: false,
        error: '無効な商品IDです'
      }, 400);
    }
    
    const stats = await c.env.DB.prepare(`
      SELECT 
        platform,
        COUNT(*) as count
      FROM social_shares 
      WHERE product_id = ?
      GROUP BY platform
      ORDER BY count DESC
    `).bind(productId).all<{platform: string, count: number}>();
    
    const totalShares = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM social_shares 
      WHERE product_id = ?
    `).bind(productId).first<{total: number}>();
    
    return c.json<ApiResponse<{stats: any, total: number}>>({
      success: true,
      data: {
        stats: stats.results || [],
        total: totalShares?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Share stats error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

export default social;