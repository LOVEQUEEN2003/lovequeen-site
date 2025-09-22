// ECサイト フロントエンドJavaScript

// グローバル変数
let currentUser = null;
let currentProducts = [];
let currentOffset = 0;
const PRODUCTS_PER_PAGE = 12;
let currentSearchParams = {};

// API ベースURL
const API_BASE = '/api';

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

async function initializeApp() {
  // 認証状態確認
  checkAuthState();
  
  // カート数更新
  updateCartCount();
  
  // カテゴリ読み込み
  loadCategories();
  
  // 人気商品読み込み
  loadFeaturedProducts();
  
  // ショップSNSアカウント読み込み
  loadShopSocialAccounts();
  
  // イベントリスナー設定
  setupEventListeners();
}

function setupEventListeners() {
  // ログインボタン
  document.getElementById('loginButton').addEventListener('click', () => {
    showModal('loginModal');
  });
  
  // 登録ボタン
  document.getElementById('registerButton').addEventListener('click', () => {
    showModal('registerModal');
  });
  
  // フォーム送信
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
  
  // ユーザーメニュー
  document.getElementById('userMenuButton').addEventListener('click', toggleUserDropdown);
  
  // 検索
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  });
  
  // ソート変更
  document.getElementById('sortSelect').addEventListener('change', searchProducts);
}

// 認証状態確認
function checkAuthState() {
  const token = localStorage.getItem('authToken');
  if (token) {
    // トークンの有効性確認
    axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => {
      if (response.data.success) {
        currentUser = response.data.data.user;
        updateAuthUI(true);
      } else {
        localStorage.removeItem('authToken');
        updateAuthUI(false);
      }
    }).catch(() => {
      localStorage.removeItem('authToken');
      updateAuthUI(false);
    });
  } else {
    updateAuthUI(false);
  }
}

// 認証UI更新
function updateAuthUI(isLoggedIn) {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  
  if (isLoggedIn && currentUser) {
    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.name;
  } else {
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

// ログイン処理
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      const { user, token } = response.data.data;
      localStorage.setItem('authToken', token);
      currentUser = user;
      
      showNotification('ログインしました', 'success');
      closeModal('loginModal');
      updateAuthUI(true);
      updateCartCount();
    } else {
      showNotification(response.data.error, 'error');
    }
  } catch (error) {
    showNotification('ログインに失敗しました', 'error');
  }
}

// 登録処理
async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('registerPhone').value;
  const password = document.getElementById('registerPassword').value;
  
  if (password.length < 6) {
    showNotification('パスワードは6文字以上で入力してください', 'error');
    return;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      name,
      email,
      phone: phone || undefined,
      password
    });
    
    if (response.data.success) {
      const { user, token } = response.data.data;
      localStorage.setItem('authToken', token);
      currentUser = user;
      
      showNotification('アカウントを作成しました', 'success');
      closeModal('registerModal');
      updateAuthUI(true);
    } else {
      showNotification(response.data.error, 'error');
    }
  } catch (error) {
    showNotification('アカウント作成に失敗しました', 'error');
  }
}

// カテゴリ読み込み
async function loadCategories() {
  try {
    const response = await axios.get(`${API_BASE}/products/categories/list`);
    
    if (response.data.success) {
      const categories = response.data.data.categories;
      displayCategories(categories);
    }
  } catch (error) {
    console.error('カテゴリ読み込みエラー:', error);
  }
}

// カテゴリ表示（LOEWE風）
function displayCategories(categories) {
  const container = document.getElementById('categoriesContainer');
  
  container.innerHTML = categories.map(category => `
    <div class="loewe-category-card group cursor-pointer text-center" 
         onclick="filterByCategory(${category.id})">
      <div class="border border-gray-300 p-8 group-hover:border-gray-400 transition-colors">
        <h4 class="font-light text-lg text-gray-800 group-hover:text-black transition-colors uppercase tracking-wide">${category.name}</h4>
        <p class="text-xs text-gray-500 mt-2 uppercase tracking-wider">Browse</p>
      </div>
    </div>
  `).join('');
}

// 人気商品読み込み
async function loadFeaturedProducts() {
  try {
    const response = await axios.get(`${API_BASE}/products/featured/list?limit=8`);
    
    if (response.data.success) {
      const products = response.data.data.products;
      displayFeaturedProducts(products);
    }
  } catch (error) {
    console.error('人気商品読み込みエラー:', error);
  }
}

// 人気商品表示（LOEWE風）
function displayFeaturedProducts(products) {
  const container = document.getElementById('featuredProducts');
  
  container.innerHTML = products.map(product => `
    <div class="loewe-product-card group cursor-pointer">
      <div class="relative overflow-hidden mb-4">
        <img src="${product.primary_image_url || '/static/images/no-image.jpg'}" 
             alt="${product.name}" 
             class="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700">
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
      </div>
      <div class="space-y-3">
        <h4 class="font-light text-lg text-gray-800 leading-tight">${product.name}</h4>
        <p class="text-sm text-gray-600 leading-relaxed line-clamp-2">${product.description || ''}</p>
        <div class="flex justify-between items-center pt-2">
          <span class="text-lg font-light text-gray-900">¥${product.price.toLocaleString()}</span>
          <button onclick="addToCart(${product.id})" 
                  class="text-xs uppercase tracking-wide text-gray-600 hover:text-black transition-colors border-b border-transparent hover:border-black pb-1">
            Add to Cart
          </button>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
          <div class="text-xs text-gray-500 uppercase tracking-wide">
            Stock: ${product.available_stock}
          </div>
          <div class="flex space-x-4">
            <button onclick="shareProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', 'twitter')" 
                    class="text-gray-400 hover:text-gray-600 transition-colors" title="Share on Twitter">
              <i class="fab fa-twitter text-sm"></i>
            </button>
            <button onclick="shareProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', 'facebook')" 
                    class="text-gray-400 hover:text-gray-600 transition-colors" title="Share on Facebook">
              <i class="fab fa-facebook text-sm"></i>
            </button>
            <button onclick="shareProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', 'copy_link')" 
                    class="text-gray-400 hover:text-gray-600 transition-colors" title="Copy Link">
              <i class="fas fa-link text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// 商品一覧読み込み
async function loadProducts(reset = true) {
  if (reset) {
    currentOffset = 0;
    currentProducts = [];
  }
  
  const params = new URLSearchParams({
    ...currentSearchParams,
    limit: PRODUCTS_PER_PAGE,
    offset: currentOffset
  });
  
  try {
    const response = await axios.get(`${API_BASE}/products?${params}`);
    
    if (response.data.success) {
      const { products, total } = response.data.data;
      
      if (reset) {
        currentProducts = products;
      } else {
        currentProducts = [...currentProducts, ...products];
      }
      
      displayProducts(currentProducts);
      
      // 「もっと見る」ボタンの表示制御
      const loadMoreButton = document.getElementById('loadMoreButton');
      if (currentProducts.length >= total) {
        loadMoreButton.classList.add('hidden');
      } else {
        loadMoreButton.classList.remove('hidden');
      }
      
      // 商品一覧セクション表示
      document.getElementById('productsSection').classList.remove('hidden');
    }
  } catch (error) {
    console.error('商品読み込みエラー:', error);
    showNotification('商品の読み込みに失敗しました', 'error');
  }
}

// 商品表示（LOEWE風）
function displayProducts(products) {
  const container = document.getElementById('productsContainer');
  
  container.innerHTML = products.map(product => `
    <div class="loewe-product-card group cursor-pointer">
      <div class="relative overflow-hidden mb-4">
        <img src="${product.primary_image_url || '/static/images/no-image.jpg'}" 
             alt="${product.name}" 
             class="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700">
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
        ${product.available_stock <= 0 ? '<div class="absolute top-4 left-4 bg-white px-3 py-1 text-xs uppercase tracking-wide text-gray-600">Out of Stock</div>' : ''}
      </div>
      <div class="space-y-3">
        <h4 class="font-light text-lg text-gray-800 leading-tight">${product.name}</h4>
        <p class="text-sm text-gray-600 leading-relaxed line-clamp-2">${product.description || ''}</p>
        <div class="flex justify-between items-center pt-2">
          <span class="text-lg font-light text-gray-900">¥${product.price.toLocaleString()}</span>
          <button onclick="addToCart(${product.id})" 
                  class="text-xs uppercase tracking-wide text-gray-600 hover:text-black transition-colors border-b border-transparent hover:border-black pb-1 ${product.available_stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                  ${product.available_stock <= 0 ? 'disabled' : ''}>
            ${product.available_stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
          <div class="text-xs ${product.available_stock <= 5 ? 'text-red-500' : 'text-gray-500'} uppercase tracking-wide">
            Stock: ${product.available_stock}
          </div>
          <div class="flex space-x-4">
            <button onclick="shareProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', 'twitter')" 
                    class="text-gray-400 hover:text-gray-600 transition-colors" title="Share on Twitter">
              <i class="fab fa-twitter text-sm"></i>
            </button>
            <button onclick="shareProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', 'facebook')" 
                    class="text-gray-400 hover:text-gray-600 transition-colors" title="Share on Facebook">
              <i class="fab fa-facebook text-sm"></i>
            </button>
            <button onclick="shareProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', 'copy_link')" 
                    class="text-gray-400 hover:text-gray-600 transition-colors" title="Copy Link">
              <i class="fas fa-link text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// カテゴリでフィルタリング
function filterByCategory(categoryId) {
  currentSearchParams = { category: categoryId };
  loadProducts(true);
}

// 商品検索
function searchProducts() {
  const keyword = document.getElementById('searchInput').value;
  const sort = document.getElementById('sortSelect').value;
  
  currentSearchParams = {
    ...(keyword && { keyword }),
    ...(sort && { sort })
  };
  
  loadProducts(true);
}

// もっと見る
function loadMoreProducts() {
  currentOffset += PRODUCTS_PER_PAGE;
  loadProducts(false);
}

// カートに追加
async function addToCart(productId) {
  if (!currentUser) {
    showNotification('ログインしてください', 'warning');
    showModal('loginModal');
    return;
  }
  
  try {
    const response = await axios.post(`${API_BASE}/cart/add`, {
      product_id: productId,
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    
    if (response.data.success) {
      showNotification('カートに追加しました', 'success');
      updateCartCount();
    } else {
      showNotification(response.data.error, 'error');
    }
  } catch (error) {
    console.error('カート追加エラー:', error);
    showNotification('カートへの追加に失敗しました', 'error');
  }
}

// カート数更新
async function updateCartCount() {
  if (!currentUser) {
    document.getElementById('cartCount').classList.add('hidden');
    return;
  }
  
  try {
    const response = await axios.get(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    
    if (response.data.success) {
      const cart = response.data.data.cart;
      const cartCount = document.getElementById('cartCount');
      
      if (cart.total_items > 0) {
        cartCount.textContent = cart.total_items;
        cartCount.classList.remove('hidden');
      } else {
        cartCount.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('カート数取得エラー:', error);
  }
}

// モーダル表示
function showModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

// モーダル非表示
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  
  // フォームリセット
  const forms = document.getElementById(modalId).querySelectorAll('form');
  forms.forEach(form => form.reset());
}

// 通知表示
function showNotification(message, type = 'info') {
  // 既存の通知を削除
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // アニメーション表示
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // 3秒後に非表示
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// モーダル外クリックで閉じる
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
    const modals = ['loginModal', 'registerModal', 'profileModal'];
    modals.forEach(modalId => {
      if (!document.getElementById(modalId).classList.contains('hidden')) {
        closeModal(modalId);
      }
    });
  }
});

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modals = ['loginModal', 'registerModal', 'profileModal'];
    modals.forEach(modalId => {
      if (!document.getElementById(modalId).classList.contains('hidden')) {
        closeModal(modalId);
      }
    });
  }
});

// ========== SNS関連機能 ==========

// ショップSNSアカウント読み込み
async function loadShopSocialAccounts() {
  try {
    const response = await axios.get(`${API_BASE}/social/shop-accounts`);
    
    if (response.data.success) {
      const accounts = response.data.data.accounts;
      displayShopSocialAccounts(accounts);
    }
  } catch (error) {
    console.error('Shop social accounts fetch error:', error);
  }
}

// ショップSNSアカウント表示
function displayShopSocialAccounts(accounts) {
  const container = document.getElementById('shopSocialAccounts');
  
  const socialIcons = {
    twitter: 'fab fa-twitter',
    instagram: 'fab fa-instagram', 
    facebook: 'fab fa-facebook',
    youtube: 'fab fa-youtube',
    tiktok: 'fab fa-tiktok',
    linkedin: 'fab fa-linkedin'
  };
  
  container.innerHTML = accounts.map(account => `
    <a href="${account.url}" 
       target="_blank" 
       rel="noopener noreferrer"
       class="text-gray-400 hover:text-gray-600 transition-colors text-lg"
       title="${account.display_name}">
      <i class="${socialIcons[account.platform]}"></i>
    </a>
  `).join('');
}

// ユーザードロップダウン表示切り替え
function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('hidden');
}

// プロフィール表示・編集
async function showProfile() {
  if (!currentUser) {
    showNotification('ログインしてください', 'warning');
    return;
  }
  
  try {
    const response = await axios.get(`${API_BASE}/social/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    
    if (response.data.success) {
      const user = response.data.data.user;
      populateProfileForm(user);
      showModal('profileModal');
    } else {
      showNotification('プロフィールの取得に失敗しました', 'error');
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    showNotification('プロフィールの取得に失敗しました', 'error');
  }
}

// プロフィールフォームに既存データを設定
function populateProfileForm(user) {
  document.getElementById('profileName').value = user.name || '';
  document.getElementById('profilePhone').value = user.phone || '';
  document.getElementById('profileBio').value = user.bio || '';
  document.getElementById('profileTwitter').value = user.twitter_handle || '';
  document.getElementById('profileInstagram').value = user.instagram_handle || '';
  document.getElementById('profileFacebook').value = user.facebook_url || '';
  document.getElementById('profileYoutube').value = user.youtube_url || '';
  document.getElementById('profileTiktok').value = user.tiktok_handle || '';
  document.getElementById('profileLinkedin').value = user.linkedin_url || '';
  document.getElementById('profileWebsite').value = user.website_url || '';
}

// プロフィール更新処理
async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const profileData = {
    name: document.getElementById('profileName').value,
    phone: document.getElementById('profilePhone').value,
    bio: document.getElementById('profileBio').value,
    twitter_handle: document.getElementById('profileTwitter').value,
    instagram_handle: document.getElementById('profileInstagram').value,
    facebook_url: document.getElementById('profileFacebook').value,
    youtube_url: document.getElementById('profileYoutube').value,
    tiktok_handle: document.getElementById('profileTiktok').value,
    linkedin_url: document.getElementById('profileLinkedin').value,
    website_url: document.getElementById('profileWebsite').value
  };
  
  try {
    const response = await axios.put(`${API_BASE}/social/profile`, profileData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    
    if (response.data.success) {
      currentUser = response.data.data.user;
      showNotification('プロフィールを更新しました', 'success');
      closeModal('profileModal');
      updateAuthUI(true);
    } else {
      showNotification(response.data.error, 'error');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showNotification('プロフィールの更新に失敗しました', 'error');
  }
}

// 商品シェア機能
function shareProduct(productId, productName, platform) {
  const baseUrl = window.location.origin;
  const productUrl = `${baseUrl}?product=${productId}`;
  const text = `${productName} をチェック！`;
  
  let shareUrl = '';
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
      break;
    case 'line':
      shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(productUrl)}`;
      break;
    case 'copy_link':
      navigator.clipboard.writeText(productUrl).then(() => {
        showNotification('リンクをコピーしました', 'success');
      });
      recordShare(productId, platform);
      return;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    recordShare(productId, platform);
  }
}

// シェア記録
async function recordShare(productId, platform) {
  try {
    await axios.post(`${API_BASE}/social/share/${productId}`, {
      platform: platform
    });
  } catch (error) {
    console.error('Share record error:', error);
  }
}

// 注文履歴表示
function showOrderHistory() {
  showNotification('注文履歴機能は準備中です', 'info');
}

// ログアウト
function logout() {
  localStorage.removeItem('authToken');
  currentUser = null;
  updateAuthUI(false);
  showNotification('ログアウトしました', 'success');
  
  // ドロップダウンを閉じる
  document.getElementById('userDropdown').classList.add('hidden');
}

// ドキュメント外クリックでドロップダウンを閉じる
document.addEventListener('click', function(e) {
  const userMenu = document.getElementById('userMenu');
  const dropdown = document.getElementById('userDropdown');
  
  if (userMenu && !userMenu.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});