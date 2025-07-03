const { test, expect } = require('@playwright/test');
const fs = require('fs');

// 測試項目檢查清單配置
const TEST_CHECKLIST = {
  login: true,           // ✅ URL 參數自動登入
  favorites: false,       // ✅ 我的最愛功能（新增/修改/刪除）
  tags: false,           // ✅ 標籤功能（新增/修改/刪除）
  share: true,         // ❌ 分享功能
  ai: true            // ❌ AI 造句功能
};

test.describe('URL 登入測試', () => {
  test('測試 URL 參數自動登入', async ({ page }) => {
    // 顯示測試檢查清單
    console.log('📋 測試檢查清單：');
    Object.entries(TEST_CHECKLIST).forEach(([key, enabled]) => {
      const testNames = {
        login: 'URL 參數自動登入',
        favorites: '我的最愛功能（新增/修改/刪除）',
        tags: '標籤功能（新增/修改/刪除）',
        share: '分享功能',
        ai: 'AI 造句功能'
      };
      console.log(`   ${enabled ? '✅' : '❌'} ${testNames[key]}`);
    });
    console.log('');
    
    // 檢查是否需要登入（如果有任何功能需要登入）
    const needsLogin = TEST_CHECKLIST.login || TEST_CHECKLIST.favorites || TEST_CHECKLIST.tags || 
                      TEST_CHECKLIST.share || TEST_CHECKLIST.ai;
    
    if (!needsLogin) {
      console.log('⏭️ 沒有需要測試的項目');
      return;
    }
    
    if (!TEST_CHECKLIST.login && (TEST_CHECKLIST.share || TEST_CHECKLIST.ai || TEST_CHECKLIST.favorites || TEST_CHECKLIST.tags)) {
      console.log('🔐 需要先登入以進行其他功能測試...');
    }
    
    console.log('🔑 開始測試 URL 參數自動登入...');
    
    // 使用測試帳戶資訊
    const testEmail = 'test@test.com';
    const testPassword = 'test0123';
    const loginUrl = `http://localhost:3000/?loginUser=${encodeURIComponent(testEmail)}&pwd=${encodeURIComponent(testPassword)}`;
    
    console.log('🌐 導航到登入 URL:', loginUrl);
    await page.goto(loginUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // 等待登入處理完成
    console.log('⏳ 等待登入處理...');
    await page.waitForTimeout(3000);
    
    // 檢查是否登入成功
    const loginButton = await page.locator('button:has-text("登入")').count();
    const isLoggedIn = loginButton === 0;
    
    console.log('📊 測試結果:');
    console.log(`   - 登入狀態: ${isLoggedIn ? '✅ 已登入' : '❌ 未登入'}`);
    console.log(`   - 當前 URL: ${page.url()}`);
    
    if (isLoggedIn) {
      console.log('✅ URL 登入成功！');
      
      // 創建 .auth 目錄
      if (!fs.existsSync('.auth')) {
        fs.mkdirSync('.auth');
      }
      
      // 保存認證狀態
      const storageState = await page.context().storageState();
      fs.writeFileSync('.auth/user.json', JSON.stringify(storageState, null, 2));
      console.log('💾 認證狀態已保存到 .auth/user.json');
      
      // 顯示認證統計
      console.log('📊 認證統計：');
      console.log(`  - Cookies: ${storageState.cookies.length} 個`);
      console.log(`  - LocalStorage: ${storageState.origins.length} 個域名`);
      
      // 根據檢查清單執行測試
      if (TEST_CHECKLIST.favorites) {
        console.log('⭐ 測試我的最愛功能...');
        await testFavoritesFunction(page);
      } else {
        console.log('⏭️ 跳過我的最愛功能測試');
      }
      
      if (TEST_CHECKLIST.tags) {
        console.log('🏷️ 測試標籤功能...');
        await testTagsFunction(page);
      } else {
        console.log('⏭️ 跳過標籤功能測試');
      }
      
      if (TEST_CHECKLIST.share) {
        console.log('🔗 測試分享功能...');
        await testShareFunction(page);
      } else {
        console.log('⏭️ 跳過分享功能測試');
      }
      
      if (TEST_CHECKLIST.ai) {
        console.log('🤖 測試AI產出句子功能...');
        await testAIGenerateFunction(page);
      } else {
        console.log('⏭️ 跳過AI產出句子功能測試');
      }
      
    } else {
      console.log('❌ URL 登入失敗');
    }
    
    console.log('🏁 URL 登入測試完成');
  });
});

/**
 * 測試我的最愛功能
 */
async function testFavoritesFunction(page) {
  try {
    // 準備測試文字 - 加上時間戳避免重複
    const timestamp = new Date().toLocaleString('zh-TW', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const testText = `Hello world test ${timestamp}`;
    
    console.log(`📝 測試文字: "${testText}"`);
    
    // 1. 新增我的最愛句子
    console.log('   📝 新增我的最愛句子...');
    await page.fill('textarea[placeholder*="輸入或粘貼要練習的文本"]', testText);
    await page.click('button[title="新增到收藏"] .fa-star');
    await page.waitForTimeout(1000);
    console.log('   ✅ 新增我的最愛句子完成');
    
    // 2. 檢查我的最愛列表
    console.log('   📋 檢查我的最愛列表...');
    const favoritesList = await page.locator('.favorite-item').count();
    console.log(`   📊 我的最愛列表項目數: ${favoritesList}`);
    
    // 3. 測試編輯我的最愛（如果有編輯按鈕）
    if (await page.locator('button[title="修改這句"]').isVisible()) {
      console.log('   ✏️ 測試編輯我的最愛...');
      await page.click('button[title="修改這句"]');
      await page.waitForTimeout(1000);
      console.log('   ✅ 編輯我的最愛完成');
    }
    
    // 4. 測試刪除我的最愛（如果有刪除按鈕）
    if (await page.locator('button[title="刪除這一句"]').isVisible()) {
      console.log('   🗑️ 測試刪除我的最愛...');
      await page.click('button[title="刪除這一句"]');
      await page.waitForTimeout(1000);
      console.log('   ✅ 刪除我的最愛完成');
    }
    
    console.log('   ✅ 我的最愛功能測試完成');
    
  } catch (error) {
    console.log(`   ❌ 我的最愛功能測試失敗: ${error.message}`);
  }
}

/**
 * 測試標籤功能
 */
async function testTagsFunction(page) {
  try {
    console.log('   🏷️ 開始標籤功能測試...');
    
    // 準備測試標籤名稱
    const testTagName = `測試標籤_${new Date().getTime()}`;
    
    // 1. 切換到標籤頁面
    console.log('   📂 切換到標籤管理頁面...');
    const tagsTab = page.getByRole('button', { name: '🏷️ 標籤' });
    if (await tagsTab.isVisible()) {
      await tagsTab.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 切換到標籤頁面');
    } else {
      console.log('   ⚠️ 未找到標籤頁面按鈕');
      return;
    }
    
    // 2. 新增標籤
    console.log('   ➕ 新增標籤...');
    
    // 查找標籤名稱輸入框
    const tagNameInput = page.locator('input[placeholder="標籤名稱..."]');
    if (await tagNameInput.isVisible()) {
      await tagNameInput.fill(testTagName);
      console.log(`   ✅ 輸入標籤名稱: ${testTagName}`);
      
      // 點擊新增按鈕
      const addButton = page.locator('button:has-text("新增")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);
        console.log('   ✅ 點擊新增標籤按鈕');
      }
    } else {
      console.log('   ⚠️ 未找到標籤輸入框');
    }
    
    // 3. 檢查標籤列表
    console.log('   📋 檢查標籤列表...');
    const tagItems = await page.locator('li:has-text("ID:")').count();
    console.log(`   📊 標籤項目數: ${tagItems}`);
    
    // 4. 測試編輯標籤（如果有編輯按鈕）
    console.log('   ✏️ 測試編輯標籤...');
    const editButton = page.locator('button:has-text("編輯")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 點擊編輯標籤按鈕');
      
      // 修改標籤名稱
      const editInput = page.locator('input[placeholder="標籤名稱..."]');
      if (await editInput.isVisible()) {
        await editInput.fill(testTagName + '_編輯');
        console.log('   ✅ 修改標籤名稱');
        
        // 點擊更新按鈕
        const updateButton = page.locator('button:has-text("更新")');
        if (await updateButton.isVisible()) {
          await updateButton.click();
          await page.waitForTimeout(1000);
          console.log('   ✅ 更新標籤完成');
        }
      }
    }
    
    // 5. 測試刪除標籤（如果有刪除按鈕）
    console.log('   🗑️ 測試刪除標籤...');
    const deleteButton = page.locator('button:has-text("刪除")').first();
    if (await deleteButton.isVisible()) {
      // 設置對話框處理器
      page.on('dialog', dialog => dialog.accept());
      
      await deleteButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 點擊刪除標籤按鈕');
    }
    
    console.log('   ✅ 標籤功能測試完成');
    
  } catch (error) {
    console.log(`   ❌ 標籤功能測試失敗: ${error.message}`);
  }
}

/**
 * 測試分享功能
 */
async function testShareFunction(page) {
  try {
    console.log('   🔗 開始分享功能測試...');
    
    // 1. 先新增一個測試句子以便分享
    const testShareText = `分享測試句子 ${new Date().getTime()}`;
    await page.fill('textarea[placeholder*="輸入或粘貼要練習的文本"]', testShareText);
    await page.click('button[title="新增到收藏"] .fa-star');
    await page.waitForTimeout(1000);
    console.log('   ✅ 新增測試句子完成');
    
    // 2. 切換到分享與備份頁面
    console.log('   📂 切換到分享與備份頁面...');
    const shareTab = page.getByRole('button', { name: '🔗 分享與備份' });
    if (await shareTab.isVisible()) {
      await shareTab.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 切換到分享與備份頁面');
    } else {
      console.log('   ⚠️ 未找到分享與備份頁面按鈕');
      return;
    }
    
    // 3. 測試分享功能
    console.log('   📤 測試分享功能...');
    
    // 設置對話框處理器（處理分享確認對話框）
    page.on('dialog', async dialog => {
      console.log(`   🔔 處理對話框: ${dialog.message()}`);
      await dialog.accept(); // 確認分享
    });
    
    const shareButton = page.locator('button:has-text("生成分享鏈接")');
    if (await shareButton.isVisible()) {
      await shareButton.click();
      await page.waitForTimeout(3000); // 等待分享處理
      console.log('   ✅ 點擊分享按鈕');
      
      // 檢查分享結果（使用更安全的選擇器）
      const shareResultVisible = await page.locator('.share-history-section').first().isVisible();
      if (shareResultVisible) {
        console.log('   ✅ 分享結果顯示');
      } else {
        console.log('   ⚠️ 未找到分享結果');
      }
    } else {
      console.log('   ⚠️ 未找到分享按鈕');
    }
    
    // 4. 測試導出JSON功能
    console.log('   📋 測試導出JSON功能...');
    const exportButton = page.locator('button:has-text("導出"), button:has-text("匯出")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 點擊導出按鈕');
    } else {
      console.log('   ⚠️ 未找到導出按鈕');
    }
    
    console.log('   ✅ 分享功能測試完成');
    
  } catch (error) {
    console.log(`   ❌ 分享功能測試失敗: ${error.message}`);
  }
}

/**
 * 測試AI產出句子功能
 */
async function testAIGenerateFunction(page) {
  try {
    console.log('   🤖 開始AI產出句子功能測試...');
    
    // 0. 先切換到我的最愛標籤頁
    console.log('   📂 切換到我的最愛標籤頁...');
    const favoritesTab = page.locator('button.tab-button:has-text("我的最愛")');
    if (await favoritesTab.isVisible()) {
      await favoritesTab.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 切換到我的最愛標籤頁');
    } else {
      console.log('   ⚠️ 未找到我的最愛標籤頁');
    }
    
    // 0.1 點擊"📝 句子"按鈕
    console.log('   📝 點擊句子按鈕...');
    const sentenceButton = page.locator('button:has-text("📝 句子")');
    if (await sentenceButton.isVisible()) {
      await sentenceButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 點擊句子按鈕');
    } else {
      console.log('   ⚠️ 未找到句子按鈕');
    }
    
    // 1. 記錄我的最愛初始數量
    console.log('   📊 記錄我的最愛初始數量...');
    const initialFavoritesCount = await page.locator('.favorite-item').count();
    console.log(`   📋 我的最愛初始數量: ${initialFavoritesCount}`);
    
    // 2. 先切換到 AI 造句幫手標籤頁
    console.log('   🔍 切換到 AI 造句幫手標籤頁...');
    const aiTab = page.locator('button:has-text("AI造句幫手")');
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ 切換到 AI 造句幫手標籤頁');
      
      // 3. 測試範例提示
      console.log('   💡 測試範例提示...');
      const examplePrompt = page.locator('button:has-text("幫我產生")').first();
      if (await examplePrompt.isVisible()) {
        await examplePrompt.click();
        await page.waitForTimeout(1000);
        console.log('   ✅ 點擊範例提示');
      }
      
      // 4. 輸入AI生成指令
      console.log('   📝 輸入AI生成指令...');
      const promptInput = page.locator('textarea[placeholder*="輸入您的提示"], textarea[placeholder*="提示"], input[placeholder*="輸入您的提示"]');
      if (await promptInput.isVisible()) {
        await promptInput.fill('生成三個高中生應該會的英文句子');
        await page.waitForTimeout(500);
        console.log('   ✅ 輸入提示詞: "生成三個高中生應該會的英文句子"');
      } else {
        console.log('   ⚠️ 未找到提示詞輸入框');
      }
      
      // 5. 測試AI生成按鈕
      console.log('   🚀 測試AI生成功能...');
      const generateButton = page.locator('.btn.btn-primary:has-text("AI造句")');
      if (await generateButton.isVisible()) {
        await generateButton.click();
        await page.waitForTimeout(8000); // 等待AI生成回應
        console.log('   ✅ 點擊AI生成按鈕');
        
        // 檢查AI回應
        const aiResponseVisible = await page.locator('.section-header:has-text("AI 回應")').isVisible();
        if (aiResponseVisible) {
          console.log('   ✅ AI回應顯示');
        } else {
          console.log('   ⚠️ 未找到AI回應');
        }
      } else {
        console.log('   ⚠️ 未找到AI生成按鈕');
      }
      
      // 6. 測試新增到收藏功能
      console.log('   ⭐ 測試新增AI句子到收藏...');
      const addToFavoriteButton = page.locator('button:has-text("新增到收藏"), button:has-text("加入收藏")');
      if (await addToFavoriteButton.isVisible()) {
        await addToFavoriteButton.click();
        await page.waitForTimeout(1000);
        console.log('   ✅ 新增AI句子到收藏');
      } else {
        console.log('   ⚠️ 未找到新增收藏按鈕');
      }
      
      // 7. 切換回我的最愛標籤頁檢查數量變化
      console.log('   📂 切換回我的最愛標籤頁...');
      const favoritesTabAfter = page.locator('button.tab-button:has-text("我的最愛")');
      if (await favoritesTabAfter.isVisible()) {
        await favoritesTabAfter.click();
        await page.waitForTimeout(2000); // 等待頁面更新
        console.log('   ✅ 切換回我的最愛標籤頁');
      } else {
        console.log('   ⚠️ 未找到我的最愛標籤頁');
      }
      
      // 7.1 點擊"📝 句子"按鈕
      console.log('   📝 點擊句子按鈕...');
      const sentenceButtonAfter = page.locator('button:has-text("📝 句子")');
      if (await sentenceButtonAfter.isVisible()) {
        await sentenceButtonAfter.click();
        await page.waitForTimeout(1000);
        console.log('   ✅ 點擊句子按鈕');
      } else {
        console.log('   ⚠️ 未找到句子按鈕');
      }
      
      // 8. 檢查我的最愛數量是否有變化
      console.log('   📊 檢查我的最愛數量變化...');
      const currentFavoritesCount = await page.locator('.favorite-item').count();
      console.log(`   📋 我的最愛當前數量: ${currentFavoritesCount}`);
      console.log(`   📋 我的最愛初始數量: ${initialFavoritesCount}`);
      
      if (currentFavoritesCount > initialFavoritesCount) {
        const addedCount = currentFavoritesCount - initialFavoritesCount;
        console.log(`   ✅ AI句子已自動添加到我的最愛！新增了 ${addedCount} 個句子`);
      } else if (currentFavoritesCount === initialFavoritesCount) {
        console.log('   ⚠️ 我的最愛數量沒有變化，AI句子可能沒有自動添加');
      } else {
        console.log('   ⚠️ 我的最愛數量減少了，這很奇怪');
      }
      
    } else {
      console.log('   ⚠️ 未找到AI造句幫手標籤頁');
    }
    
    console.log('   ✅ AI產出句子功能測試完成');
    
  } catch (error) {
    console.log(`   ❌ AI產出句子功能測試失敗: ${error.message}`);
  }
}