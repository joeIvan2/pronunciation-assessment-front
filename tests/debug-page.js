const { test, expect } = require('@playwright/test');

test('頁面結構調試', async ({ page }) => {
  console.log('🔍 開始調試頁面結構...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // 檢查頁面標題
  const title = await page.title();
  console.log('📄 頁面標題:', title);
  
  // 檢查是否有 NiceTone logo
  const logo = await page.locator('img[alt="NiceTone"]');
  if (await logo.isVisible()) {
    console.log('✅ NiceTone logo 存在');
  } else {
    console.log('❌ NiceTone logo 不存在');
  }
  
  // 檢查所有按鈕
  const buttons = await page.locator('button').all();
  console.log(`🔘 找到 ${buttons.length} 個按鈕:`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    try {
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const classes = await button.getAttribute('class');
      console.log(`  ${i + 1}. 按鈕文字: "${text}" | 可見: ${isVisible} | 類別: ${classes}`);
    } catch (error) {
      console.log(`  ${i + 1}. 按鈕讀取失敗:`, error.message);
    }
  }
  
  // 檢查是否有文字輸入框
  const textInputs = await page.locator('input[type="text"], textarea').all();
  console.log(`📝 找到 ${textInputs.length} 個文字輸入框:`);
  
  for (let i = 0; i < textInputs.length; i++) {
    const input = textInputs[i];
    try {
      const placeholder = await input.getAttribute('placeholder');
      const isVisible = await input.isVisible();
      console.log(`  ${i + 1}. 輸入框 placeholder: "${placeholder}" | 可見: ${isVisible}`);
    } catch (error) {
      console.log(`  ${i + 1}. 輸入框讀取失敗:`, error.message);
    }
  }
  
  // 檢查是否有選項卡或導航
  const tabs = await page.locator('[role="tab"], .tab, .nav-item').all();
  console.log(`📑 找到 ${tabs.length} 個選項卡:`);
  
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    try {
      const text = await tab.textContent();
      const isVisible = await tab.isVisible();
      console.log(`  ${i + 1}. 選項卡文字: "${text}" | 可見: ${isVisible}`);
    } catch (error) {
      console.log(`  ${i + 1}. 選項卡讀取失敗:`, error.message);
    }
  }
  
  // 檢查是否有包含「發音」、「錄音」等關鍵字的元素
  const keywords = ['發音', '錄音', 'record', 'pronunciation', '評分', '開始', 'start'];
  
  for (const keyword of keywords) {
    const elements = await page.locator(`text="${keyword}"`).all();
    if (elements.length > 0) {
      console.log(`🔍 找到包含「${keyword}」的元素 ${elements.length} 個:`);
      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        try {
          const element = elements[i];
          const tagName = await element.evaluate(el => el.tagName);
          const text = await element.textContent();
          const isVisible = await element.isVisible();
          console.log(`  - ${tagName}: "${text}" | 可見: ${isVisible}`);
        } catch (error) {
          console.log(`  - 元素讀取失敗:`, error.message);
        }
      }
    }
  }
  
  // 截圖以便查看
  await page.screenshot({ path: 'debug-page-structure.png', fullPage: true });
  console.log('📸 已保存完整頁面截圖: debug-page-structure.png');
  
  console.log('🔍 調試完成!');
}); 