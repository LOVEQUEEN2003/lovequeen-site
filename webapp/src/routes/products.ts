import { Hono } from 'hono';
import { Env, Product, ProductImage, Category, ProductSearchParams, ApiResponse } from '../types';

const products = new Hono<{ Bindings: Env }>();

/**
 * 商品一覧取得（フィルタリング・検索対応）
 */
products.get('/', async (c) => {
  try {
    const params = c.req.query();
    const searchParams: ProductSearchParams = {
      category: params.category ? parseInt(params.category) : undefined,
      keyword: params.keyword,
      min_price: params.min_price ? parseInt(params.min_price) : undefined,
      max_price: params.max_price ? parseInt(params.max_price) : undefined,
      featured: params.featured === 'true',
      limit: params.limit ? parseInt(params.limit) : 20,
      offset: params.offset ? parseInt(params.offset) : 0,
      sort: params.sort as any || 'created_at'
    };
    
    // WHERE句構築
    const whereClauses = ['p.status = ?'];
    const bindings = ['active'];
    
    if (searchParams.category) {
      whereClauses.push('p.category_id = ?');
      bindings.push(searchParams.category.toString());
    }
    
    if (searchParams.keyword) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
      const keywordPattern = `%${searchParams.keyword}%`;
      bindings.push(keywordPattern, keywordPattern);
    }
    
    if (searchParams.min_price) {
      whereClauses.push('p.price >= ?');
      bindings.push(searchParams.min_price.toString());
    }
    
    if (searchParams.max_price) {
      whereClauses.push('p.price <= ?');
      bindings.push(searchParams.max_price.toString());
    }
    
    if (searchParams.featured) {
      whereClauses.push('p.featured = true');
    }
    
    // ORDER BY句構築
    let orderBy = 'p.created_at DESC';
    switch (searchParams.sort) {
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'name':
        orderBy = 'p.name ASC';
        break;
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    // 商品取得
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        i.stock_quantity,
        i.reserved_quantity,
        pi.image_url as primary_image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    bindings.push(searchParams.limit!.toString(), searchParams.offset!.toString());
    
    const results = await c.env.DB.prepare(query)
      .bind(...bindings)
      .all<Product & {
        category_name: string,
        stock_quantity: number,
        reserved_quantity: number,
        primary_image_url: string
      }>();
    
    // 総件数取得
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereClause}
    `;
    const countBindings = bindings.slice(0, -2); // LIMIT, OFFSETを除く
    
    const countResult = await c.env.DB.prepare(countQuery)
      .bind(...countBindings)
      .first<{total: number}>();
    
    return c.json<ApiResponse<{products: any[], total: number}>>({
      success: true,
      data: {
        products: results.results?.map(product => ({
          ...product,
          available_stock: (product.stock_quantity || 0) - (product.reserved_quantity || 0)
        })) || [],
        total: countResult?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Product list error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * 商品詳細取得
 */
products.get('/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    
    if (!productId) {
      return c.json<ApiResponse>({
        success: false,
        error: '無効な商品IDです'
      }, 400);
    }
    
    // 商品基本情報取得
    const product = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        i.stock_quantity,
        i.reserved_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ? AND p.status = 'active'
    `).bind(productId).first<Product & {
      category_name: string,
      stock_quantity: number,
      reserved_quantity: number
    }>();
    
    if (!product) {
      return c.json<ApiResponse>({
        success: false,
        error: '商品が見つかりません'
      }, 404);
    }
    
    // 商品画像取得
    const images = await c.env.DB.prepare(`
      SELECT * FROM product_images 
      WHERE product_id = ? 
      ORDER BY sort_order ASC
    `).bind(productId).all<ProductImage>();
    
    return c.json<ApiResponse<{product: any}>>({
      success: true,
      data: {
        product: {
          ...product,
          available_stock: (product.stock_quantity || 0) - (product.reserved_quantity || 0),
          images: images.results || []
        }
      }
    });
    
  } catch (error) {
    console.error('Product detail error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * カテゴリ一覧取得
 */
products.get('/categories/list', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT * FROM categories 
      WHERE is_active = true 
      ORDER BY sort_order ASC, name ASC
    `).all<Category>();
    
    return c.json<ApiResponse<{categories: Category[]}>>({
      success: true,
      data: {
        categories: categories.results || []
      }
    });
    
  } catch (error) {
    console.error('Categories list error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

/**
 * 人気商品・おすすめ商品取得
 */
products.get('/featured/list', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '8');
    
    const products = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        i.stock_quantity,
        i.reserved_quantity,
        pi.image_url as primary_image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE p.status = 'active' AND p.featured = true
      ORDER BY p.created_at DESC
      LIMIT ?
    `).bind(limit).all<Product & {
      category_name: string,
      stock_quantity: number,
      reserved_quantity: number,
      primary_image_url: string
    }>();
    
    return c.json<ApiResponse<{products: any[]}>>({
      success: true,
      data: {
        products: products.results?.map(product => ({
          ...product,
          available_stock: (product.stock_quantity || 0) - (product.reserved_quantity || 0)
        })) || []
      }
    });
    
  } catch (error) {
    console.error('Featured products error:', error);
    return c.json<ApiResponse>({
      success: false,
      error: 'サーバーエラーが発生しました'
    }, 500);
  }
});

export default products;