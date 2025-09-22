import { Hono } from 'hono';
import { Env, LoginRequest, RegisterRequest, ApiResponse, AuthUser } from '../types';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  getUserByEmail 
} from '../utils/auth';

const auth = new Hono<{ Bindings: Env }>();

/**
 * ユーザー登録
 */
auth.post('/register', async (c) => {
  try {
    const { email, password, name, phone }: RegisterRequest = await c.req.json();
    
    // バリデーション
    if (!email || !password || !name) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'メールアドレス、パスワード、名前は必須です' 
      }, 400);
    }
    
    if (password.length < 6) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'パスワードは6文字以上で入力してください' 
      }, 400);
    }
    
    // メールアドレス重複チェック
    const existingUser = await getUserByEmail(c.env.DB, email);
    if (existingUser) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'このメールアドレスは既に登録されています' 
      }, 409);
    }
    
    // パスワードハッシュ化
    const passwordHash = await hashPassword(password);
    
    // ユーザー作成
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password_hash, name, phone, role)
      VALUES (?, ?, ?, ?, 'customer')
    `).bind(email, passwordHash, name, phone || null).run();
    
    if (!result.success) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'ユーザー登録に失敗しました' 
      }, 500);
    }
    
    // 作成されたユーザー情報を取得
    const newUser = await getUserByEmail(c.env.DB, email);
    if (!newUser) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'ユーザー情報の取得に失敗しました' 
      }, 500);
    }
    
    // JWT トークン生成
    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };
    
    const token = await generateToken(authUser);
    
    return c.json<ApiResponse<{user: AuthUser, token: string}>>({
      success: true,
      data: { user: authUser, token },
      message: 'ユーザー登録が完了しました'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    }, 500);
  }
});

/**
 * ログイン
 */
auth.post('/login', async (c) => {
  try {
    const { email, password }: LoginRequest = await c.req.json();
    
    // バリデーション
    if (!email || !password) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'メールアドレスとパスワードを入力してください' 
      }, 400);
    }
    
    // ユーザー取得
    const user = await getUserByEmail(c.env.DB, email);
    if (!user) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'メールアドレスまたはパスワードが間違っています' 
      }, 401);
    }
    
    // アクティブユーザーチェック
    if (!user.is_active) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'このアカウントは無効化されています' 
      }, 401);
    }
    
    // パスワード検証
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'メールアドレスまたはパスワードが間違っています' 
      }, 401);
    }
    
    // JWT トークン生成
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    const token = await generateToken(authUser);
    
    return c.json<ApiResponse<{user: AuthUser, token: string}>>({
      success: true,
      data: { user: authUser, token },
      message: 'ログインしました'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    }, 500);
  }
});

/**
 * プロフィール取得（認証必須）
 */
auth.get('/profile', async (c) => {
  try {
    // 認証情報はミドルウェアで設定される
    const user = c.get('user') as AuthUser;
    
    // データベースから最新のユーザー情報を取得
    const dbUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(user.id)
      .first<{id: number, email: string, name: string, phone: string, role: string, created_at: string}>();
    
    if (!dbUser) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'ユーザーが見つかりません' 
      }, 404);
    }
    
    return c.json<ApiResponse<{user: any}>>({
      success: true,
      data: { 
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          phone: dbUser.phone,
          role: dbUser.role,
          created_at: dbUser.created_at
        }
      }
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    }, 500);
  }
});

export default auth;