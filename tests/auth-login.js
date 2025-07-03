const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// 儲存登入狀態的文件路徑
const authFile = path.join(__dirname, '../.auth/user.json');

// 確保認證目錄存在
const authDir = path.dirname(authFile);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

test.describe('手動登入設置', () => {
  test('手動登入並保存認證狀態', async ({ page }) => {
    console.log('🔑 開始手動登入設置...');
    
    // 導航到首頁
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 頁面載入完成');
    console.log('📋 請在開啟的瀏覽器中手動完成登入流程');
    console.log('⏰ 您有 5 分鐘的時間完成登入');
    console.log('🔍 系統將自動檢測登入狀態...');
    
    // 檢查初始登入狀態
    await checkLoginStatus(page);
    
    // 等待 5 分鐘讓用戶手動登入
    const maxWaitTime = 5 * 60 * 1000; // 5 分鐘
    const checkInterval = 10 * 1000; // 每 10 秒檢查一次
    const startTime = Date.now();
    
    let isLoggedIn = false;
    let lastStatus = '';
    
    while (Date.now() - startTime < maxWaitTime && !isLoggedIn) {
      await page.waitForTimeout(checkInterval);
      
      // 檢查登入狀態
      const currentStatus = await checkLoginStatus(page);
      
      if (currentStatus !== lastStatus) {
        console.log(`🔄 狀態變化: ${currentStatus}`);
        lastStatus = currentStatus;
      }
      
      // 檢查是否已登入
      if (currentStatus === 'logged_in') {
        isLoggedIn = true;
        console.log('✅ 檢測到已登入狀態！');
        break;
      }
      
      const remainingTime = Math.ceil((maxWaitTime - (Date.now() - startTime)) / 1000);
      if (remainingTime % 30 === 0) { // 每 30 秒顯示一次剩餘時間
        console.log(`⏳ 剩餘時間: ${remainingTime} 秒`);
      }
    }
    
    if (isLoggedIn) {
      // 保存認證狀態
      console.log('💾 保存認證狀態...');
      await page.context().storageState({ path: authFile });
      console.log(`✅ 認證狀態已保存到: ${authFile}`);
      
      // 驗證保存的認證狀態
      const stats = fs.statSync(authFile);
      console.log(`📊 認證文件大小: ${stats.size} bytes`);
      console.log(`📅 保存時間: ${stats.mtime.toLocaleString()}`);
      
      // 讀取並顯示認證信息摘要
      const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      console.log(`🍪 Cookies 數量: ${authData.cookies ? authData.cookies.length : 0}`);
      console.log(`🔐 LocalStorage 項目: ${authData.origins ? authData.origins.length : 0}`);
      
    } else {
      console.log('❌ 登入超時，請稍後重試');
      console.log('💡 您可以使用 npm run test:login 重新嘗試登入');
    }
    
    // 最終狀態檢查
    await checkLoginStatus(page);
    
    console.log('🏁 手動登入設置完成');
  });
});

/**
 * 檢查當前登入狀態
 * @param {Page} page - Playwright 頁面物件
 * @returns {Promise<string>} 登入狀態
 */
async function checkLoginStatus(page) {
  try {
    // 檢查是否有登入/登出按鈕
    const loginButton = page.locator('button:has-text("登入"), button:has-text("Login"), button:has-text("Google")');
    const logoutButton = page.locator('button:has-text("登出"), button:has-text("Logout"), button:has-text("帳戶"), button:has-text("Account")');
    
    const hasLoginButton = await loginButton.first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasLogoutButton = await logoutButton.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasLogoutButton) {
      console.log('🟢 狀態: 已登入');
      return 'logged_in';
    } else if (hasLoginButton) {
      console.log('🔴 狀態: 未登入');
      return 'not_logged_in';
    } else {
      console.log('🟡 狀態: 無法確定登入狀態');
      return 'unknown';
    }
  } catch (error) {
    console.log('❌ 檢查登入狀態時發生錯誤:', error.message);
    return 'error';
  }
}

/**
 * 等待登入狀態變化
 * @param {Page} page - Playwright 頁面物件
 * @param {number} maxWaitTime - 最大等待時間（毫秒）
 * @returns {Promise<boolean>} 是否成功登入
 */
async function waitForLoginChange(page, maxWaitTime = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkLoginStatus(page);
    
    if (status === 'logged_in') {
      return true;
    }
    
    await page.waitForTimeout(2000); // 每 2 秒檢查一次
  }
  
  return false;
} 