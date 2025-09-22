import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { Env } from './types'
import { authMiddleware, adminMiddleware } from './utils/auth'

// ルートインポート
import auth from './routes/auth'
import products from './routes/products'
import cart from './routes/cart'
import orders from './routes/orders'
import social from './routes/social'

const app = new Hono<{ Bindings: Env }>()

// CORS設定
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

// API ルート（認証不要）
app.route('/api/auth', auth)
app.route('/api/products', products)

// API ルート（認証必要）
app.use('/api/cart/*', authMiddleware)
app.route('/api/cart', cart)

app.use('/api/orders/*', authMiddleware)
app.route('/api/orders', orders)

// SNSルート（一部認証必要）
app.route('/api/social', social)
app.use('/api/social/profile*', authMiddleware)

// ヘルスチェック
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    message: 'ECサイトAPI稼働中',
    timestamp: new Date().toISOString()
  })
})

// メインページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LoveQueen - プレミアムオンラインショップ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            'loewe': ['Helvetica Neue', 'Arial', 'sans-serif']
                        },
                        colors: {
                            'loewe-beige': '#f5f4f2',
                            'loewe-brown': '#8b7355',
                            'loewe-black': '#1a1a1a',
                            'loewe-gray': '#666666'
                        }
                    }
                }
            }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-loewe-beige font-loewe">
        <!-- ヘッダー -->
        <header class="bg-white border-b border-gray-200">
            <div class="max-w-6xl mx-auto px-6">
                <div class="flex items-center justify-between h-20">
                    <div class="flex items-center">
                        <h1 class="text-3xl font-light tracking-wider text-loewe-black uppercase">
                            LoveQueen
                        </h1>
                    </div>
                    <nav class="hidden md:flex space-x-12">
                        <a href="#" class="text-loewe-gray hover:text-loewe-black transition-colors text-sm uppercase tracking-wide">Collection</a>
                        <a href="#" class="text-loewe-gray hover:text-loewe-black transition-colors text-sm uppercase tracking-wide">Categories</a>
                        <a href="#" class="text-loewe-gray hover:text-loewe-black transition-colors text-sm uppercase tracking-wide">Contact</a>
                    </nav>
                    <div class="flex items-center space-x-8">
                        <button id="cartButton" class="relative text-loewe-gray hover:text-loewe-black transition-colors">
                            <i class="far fa-shopping-bag text-lg"></i>
                            <span id="cartCount" class="absolute -top-1 -right-1 bg-loewe-brown text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hidden">0</span>
                        </button>
                        <div id="authButtons" class="flex space-x-6">
                            <button id="loginButton" class="text-loewe-gray hover:text-loewe-black transition-colors text-sm uppercase tracking-wide">
                                Sign In
                            </button>
                            <button id="registerButton" class="text-loewe-gray hover:text-loewe-black transition-colors text-sm uppercase tracking-wide">
                                Register
                            </button>
                        </div>
                        <div id="userMenu" class="hidden relative">
                            <button id="userMenuButton" class="flex items-center text-loewe-gray hover:text-loewe-black transition-colors">
                                <i class="far fa-user mr-2"></i>
                                <span id="userName" class="text-sm uppercase tracking-wide">Account</span>
                                <i class="fas fa-chevron-down ml-2 text-xs"></i>
                            </button>
                            <div id="userDropdown" class="hidden absolute right-0 mt-3 w-48 bg-white border border-gray-200 shadow-sm z-50">
                                <div class="py-2">
                                    <a href="#" onclick="showProfile()" class="block px-4 py-3 text-xs text-loewe-gray hover:text-loewe-black hover:bg-gray-50 uppercase tracking-wide">
                                        Profile
                                    </a>
                                    <a href="#" onclick="showOrderHistory()" class="block px-4 py-3 text-xs text-loewe-gray hover:text-loewe-black hover:bg-gray-50 uppercase tracking-wide">
                                        Orders
                                    </a>
                                    <hr class="border-gray-100">
                                    <a href="#" onclick="logout()" class="block px-4 py-3 text-xs text-loewe-gray hover:text-loewe-black hover:bg-gray-50 uppercase tracking-wide">
                                        Sign Out
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- メインコンテンツ -->
        <main class="max-w-6xl mx-auto px-6">
            <!-- ヒーローセクション -->
            <section class="py-20 text-center border-b border-gray-200">
                <div class="max-w-2xl mx-auto">
                    <h2 class="text-6xl font-light text-loewe-black mb-8 tracking-wider uppercase">
                        Autumn<br>Collection
                    </h2>
                    <p class="text-lg text-loewe-gray mb-12 leading-relaxed">
                        Discover our carefully curated selection of premium goods,<br>
                        crafted with exceptional attention to detail.
                    </p>
                    <button onclick="loadProducts()" class="border border-loewe-black text-loewe-black px-8 py-4 text-sm uppercase tracking-wider hover:bg-loewe-black hover:text-white transition-all duration-300">
                        Explore Collection
                    </button>
                </div>
            </section>

            <!-- 商品カテゴリ -->
            <section class="py-16 border-b border-gray-200">
                <h3 class="text-2xl font-light text-loewe-black mb-12 text-center uppercase tracking-wider">Categories</h3>
                <div id="categoriesContainer" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    <!-- カテゴリがここに動的に表示されます -->
                </div>
            </section>

            <!-- 人気商品 -->
            <section class="py-16">
                <h3 class="text-2xl font-light text-loewe-black mb-12 text-center uppercase tracking-wider">Featured</h3>
                <div id="featuredProducts" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    <!-- 人気商品がここに動的に表示されます -->
                </div>
            </section>

            <!-- 商品一覧 -->
            <section id="productsSection" class="hidden py-16 border-t border-gray-200">
                <div class="flex justify-between items-center mb-12">
                    <h3 class="text-2xl font-light text-loewe-black uppercase tracking-wider">Collection</h3>
                    <div class="flex items-center space-x-6">
                        <select id="sortSelect" class="border border-gray-300 px-4 py-2 text-sm text-loewe-gray bg-white">
                            <option value="created_at">Newest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="name">Alphabetical</option>
                        </select>
                        <input id="searchInput" type="text" placeholder="Search products..." class="border border-gray-300 px-4 py-2 text-sm text-loewe-gray bg-white w-64">
                        <button onclick="searchProducts()" class="border border-loewe-black text-loewe-black px-4 py-2 text-sm hover:bg-loewe-black hover:text-white transition-all">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                <div id="productsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    <!-- 商品がここに動的に表示されます -->
                </div>
                <div id="loadMoreButton" class="text-center mt-16">
                    <button onclick="loadMoreProducts()" class="border border-loewe-black text-loewe-black px-8 py-4 text-sm uppercase tracking-wide hover:bg-loewe-black hover:text-white transition-all">
                        Load More
                    </button>
                </div>
            </section>
        </main>

        <!-- フッター -->
        <footer class="bg-white border-t border-gray-200 py-16 mt-20">
            <div class="max-w-6xl mx-auto px-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <!-- ブランド情報 -->
                    <div class="md:col-span-2">
                        <h3 class="text-2xl font-light text-loewe-black mb-6 uppercase tracking-wider">LoveQueen</h3>
                        <p class="text-loewe-gray leading-relaxed mb-6">
                            Exceptional craftsmanship meets contemporary design.<br>
                            Discover timeless pieces that define luxury.
                        </p>
                        <p class="text-xs text-loewe-gray uppercase tracking-wide">© 2024 LoveQueen. All rights reserved.</p>
                    </div>
                    
                    <!-- リンク -->
                    <div>
                        <h4 class="text-sm font-medium text-loewe-black mb-6 uppercase tracking-wide">Services</h4>
                        <ul class="space-y-3">
                            <li><a href="#" class="text-loewe-gray hover:text-loewe-black text-sm transition-colors">Collection</a></li>
                            <li><a href="#" class="text-loewe-gray hover:text-loewe-black text-sm transition-colors">Contact</a></li>
                            <li><a href="#" class="text-loewe-gray hover:text-loewe-black text-sm transition-colors">Terms</a></li>
                            <li><a href="#" class="text-loewe-gray hover:text-loewe-black text-sm transition-colors">Privacy</a></li>
                        </ul>
                    </div>
                    
                    <!-- SNSアカウント -->
                    <div>
                        <h4 class="text-sm font-medium text-loewe-black mb-6 uppercase tracking-wide">Follow</h4>
                        <div id="shopSocialAccounts" class="flex space-x-6">
                            <!-- SNSアカウントがここに動的に表示されます -->
                        </div>
                    </div>
                </div>
            </div>
        </footer>

        <!-- モーダル -->
        <div id="loginModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">ログイン</h3>
                    <form id="loginForm">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">メールアドレス</label>
                            <input type="email" id="loginEmail" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2">パスワード</label>
                            <input type="password" id="loginPassword" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" required>
                        </div>
                        <div class="flex justify-between">
                            <button type="button" onclick="closeModal('loginModal')" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                                キャンセル
                            </button>
                            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                ログイン
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- 登録モーダル -->
        <div id="registerModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">新規登録</h3>
                    <form id="registerForm">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">名前</label>
                            <input type="text" id="registerName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">メールアドレス</label>
                            <input type="email" id="registerEmail" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2">電話番号（任意）</label>
                            <input type="tel" id="registerPhone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500">
                        </div>
                        <div class="mb-6">
                            <label class="block text-gray-700 text-sm font-bold mb-2">パスワード（6文字以上）</label>
                            <input type="password" id="registerPassword" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" required>
                        </div>
                        <div class="flex justify-between">
                            <button type="button" onclick="closeModal('registerModal')" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                                キャンセル
                            </button>
                            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                登録
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- プロフィール編集モーダル -->
        <div id="profileModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">プロフィール編集</h3>
                    <form id="profileForm" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- 基本情報 -->
                            <div>
                                <label class="block text-gray-700 text-sm font-bold mb-2">名前</label>
                                <input type="text" id="profileName" class="form-input">
                            </div>
                            <div>
                                <label class="block text-gray-700 text-sm font-bold mb-2">電話番号</label>
                                <input type="tel" id="profilePhone" class="form-input">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">自己紹介</label>
                            <textarea id="profileBio" rows="3" class="form-input"></textarea>
                        </div>

                        <!-- SNSアカウント -->
                        <div>
                            <h4 class="text-md font-semibold text-gray-800 mb-3">SNSアカウント</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">
                                        <i class="fab fa-twitter text-blue-400 mr-1"></i>Twitter/X
                                    </label>
                                    <input type="text" id="profileTwitter" placeholder="@username" class="form-input">
                                </div>
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">
                                        <i class="fab fa-instagram text-pink-500 mr-1"></i>Instagram
                                    </label>
                                    <input type="text" id="profileInstagram" placeholder="@username" class="form-input">
                                </div>
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">
                                        <i class="fab fa-facebook text-blue-600 mr-1"></i>Facebook
                                    </label>
                                    <input type="url" id="profileFacebook" placeholder="https://facebook.com/..." class="form-input">
                                </div>
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">
                                        <i class="fab fa-youtube text-red-600 mr-1"></i>YouTube
                                    </label>
                                    <input type="url" id="profileYoutube" placeholder="https://youtube.com/..." class="form-input">
                                </div>
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">
                                        <i class="fab fa-tiktok text-gray-800 mr-1"></i>TikTok
                                    </label>
                                    <input type="text" id="profileTiktok" placeholder="@username" class="form-input">
                                </div>
                                <div>
                                    <label class="block text-gray-700 text-sm font-bold mb-2">
                                        <i class="fab fa-linkedin text-blue-700 mr-1"></i>LinkedIn
                                    </label>
                                    <input type="url" id="profileLinkedin" placeholder="https://linkedin.com/..." class="form-input">
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">
                                <i class="fas fa-globe mr-1"></i>ウェブサイト
                            </label>
                            <input type="url" id="profileWebsite" placeholder="https://..." class="form-input">
                        </div>

                        <div class="flex justify-between pt-4">
                            <button type="button" onclick="closeModal('profileModal')" class="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600">
                                キャンセル
                            </button>
                            <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                                保存
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

// 管理者ダッシュボード（将来実装）
app.get('/admin', authMiddleware, adminMiddleware, (c) => {
  return c.html(`
    <h1>管理者ダッシュボード</h1>
    <p>商品管理、注文管理、在庫管理機能を実装予定</p>
  `)
})

export default app