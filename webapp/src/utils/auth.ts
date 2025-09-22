import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { Env, AuthUser, User } from '../types';

const JWT_SECRET = 'your-jwt-secret-key-change-in-production';

/**
 * パスワードハッシュ化（実際の実装では bcrypt 等を使用）
 */
export async function hashPassword(password: string): Promise<string> {
  // 簡易実装：実際の本番環境では bcrypt や Web Crypto API を使用
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * パスワード検証
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

/**
 * JWTトークン生成
 */
export async function generateToken(user: AuthUser): Promise<string> {
  const payload = {
    sub: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7日間有効
  };
  return await sign(payload, JWT_SECRET);
}

/**
 * JWTトークン検証
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = await verify(token, JWT_SECRET) as any;
    return {
      id: parseInt(payload.sub),
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 認証ミドルウェア
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Authorization token required' }, 401);
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);

  if (!user) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // ユーザー情報をコンテキストに設定
  c.set('user', user);
  await next();
}

/**
 * 管理者認証ミドルウェア
 */
export async function adminMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const user = c.get('user') as AuthUser;
  
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  await next();
}

/**
 * ユーザーをデータベースから取得
 */
export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<User>();
  return result || null;
}

/**
 * メールアドレスでユーザーを取得
 */
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>();
  return result || null;
}