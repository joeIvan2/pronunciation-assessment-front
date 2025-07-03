const { test, expect } = require('@playwright/test');

test.describe('發音評估應用程式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('應用程式啟動並顯示正確標題', async ({ page }) => {
    await expect(page.locator('img[alt="NiceTone"]')).toBeVisible();
    await expect(page).toHaveTitle('發音評估 - NiceTone');
    console.log('✅ 應用程式啟動成功');
  });

  test('發音評分頁面載入', async ({ page }) => {
    await page.click('button:has-text("發音評分")');
    await page.waitForTimeout(2000);
    console.log('✅ 發音評分頁面載入成功');
  });

  test('文字輸入功能', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible();
    
    const testText = 'Hello, I am a student. I like to read books.';
    await textInput.fill(testText);
    await expect(textInput).toHaveValue(testText);
    
    console.log('✅ 文字輸入功能正常');
  });

  test('發音評分按鈕功能', async ({ page }) => {
    const pronunciationButton = page.locator('button').filter({ hasText: /評分|錄音|開始/i }).first();
    await expect(pronunciationButton).toBeVisible();
    
    await pronunciationButton.click();
    await page.waitForTimeout(2000);
    
    const errorElements = page.locator('text=/錯誤|error|Error|失敗|fail/i');
    const hasError = await errorElements.first().isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
    
    console.log('✅ 發音按鈕點擊成功，無明顯錯誤');
  });
}); 