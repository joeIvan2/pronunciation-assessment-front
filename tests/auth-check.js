const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// 儲存登入狀態的文件路徑
const authFile = path.join(__dirname, '../.auth/user.json');

test.describe('認證狀態檢查', () => {
  test('檢查保存的認證狀態', async ({ page }) => {
    console.log('🔍 開始檢查認證狀態...');
    
    // 檢查認證文件是否存在
    if (!fs.existsSync(authFile)) {
      console.log('❌ 認證文件不存在');
      console.log(`📁 預期路徑: ${authFile}`);
      console.log('💡 請先執行 npm run test:login 進行登入設置');
      return;
    }
    
    // 讀取並顯示認證文件信息
    const stats = fs.statSync(authFile);
    console.log(`✅ 認證文件存在`);
    console.log(`📊 文件大小: ${stats.size} bytes`);
    console.log(`📅 最後修改: ${stats.mtime.toLocaleString()}`);
    
    // 檢查文件內容
    try {
      const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      console.log(`🍪 Cookies 數量: ${authData.cookies ? authData.cookies.length : 0}`);
      console.log(`🔐 LocalStorage 項目: ${authData.origins ? authData.origins.length : 0}`);
      
      // 顯示主要 cookies 信息
      if (authData.cookies && authData.cookies.length > 0) {
        console.log('📋 主要 Cookies:');
        authData.cookies.slice(0, 5).forEach((cookie, index) => {
          console.log(`  ${index + 1}. ${cookie.name} (${cookie.domain})`);
        });
        
        if (authData.cookies.length > 5) {
          console.log(`  ... 和其他 ${authData.cookies.length - 5} 個 cookies`);
        }
      }
      
    } catch (error) {
      console.log('❌ 認證文件格式錯誤:', error.message);
      console.log('💡 請重新執行 npm run test:login 進行登入設置');
      return;
    }
    
    // 測試認證狀態是否有效
    console.log('🧪 測試認證狀態有效性...');
    
    // 使用保存的認證狀態
    const context = await page.context();
    await context.addCookies(JSON.parse(fs.readFileSync(authFile, 'utf8')).cookies || []);
    
    // 導航到首頁
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 檢查登入狀態
    const loginStatus = await checkLoginStatus(page);
    
    console.log(`🏁 認證狀態檢查完成: ${loginStatus}`);
    
    if (loginStatus === 'logged_in') {
      console.log('✅ 認證狀態有效，可以進行登入後的功能測試');
      console.log('💡 使用 npm run test:logged-in 執行完整功能測試');
    } else {
      console.log('❌ 認證狀態無效或已過期');
      console.log('💡 請重新執行 npm run test:login 進行登入設置');
    }
  });
});

/**
 * 檢查當前登入狀態
 * @param {Page} page - Playwright 頁面物件
 * @returns {Promise<string>} 登入狀態
 */
async function checkLoginStatus(page) {
  try {
    // 等待頁面載入
    await page.waitForTimeout(2000);
    
    // 檢查是否有登入/登出按鈕
    const loginButton = page.locator('button:has-text("登入"), button:has-text("Login"), button:has-text("Google")');
    const logoutButton = page.locator('button:has-text("登出"), button:has-text("Logout"), button:has-text("帳戶"), button:has-text("Account")');
    
    const hasLoginButton = await loginButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasLogoutButton = await logoutButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    // 檢查用戶相關元素
    const userElements = [
      page.locator('text=/用戶|User|使用者|帳戶|Account/i'),
      page.locator('[data-testid*="user"]'),
      page.locator('[class*="user"]'),
      page.locator('[class*="profile"]'),
      page.locator('img[alt*="頭像"], img[alt*="avatar"], img[alt*="profile"]')
    ];
    
    let hasUserElement = false;
    for (const element of userElements) {
      const isVisible = await element.first().isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        hasUserElement = true;
        break;
      }
    }
    
    if (hasLogoutButton || hasUserElement) {
      console.log('🟢 狀態: 已登入');
      return 'logged_in';
    } else if (hasLoginButton) {
      console.log('🔴 狀態: 未登入');
      return 'not_logged_in';
    } else {
      console.log('🟡 狀態: 無法確定登入狀態');
      
      // 檢查頁面內容中是否有登入相關信息
      const pageContent = await page.textContent('body');
      const loginKeywords = ['登入', '登出', 'login', 'logout', '帳戶', 'account'];
      const foundKeywords = loginKeywords.filter(keyword => 
        pageContent.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        console.log(`🔍 找到相關關鍵字: ${foundKeywords.join(', ')}`);
      }
      
      return 'unknown';
    }
  } catch (error) {
    console.log('❌ 檢查登入狀態時發生錯誤:', error.message);
    return 'error';
  }
} 