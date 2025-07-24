const { test, expect } = require('@playwright/test');

test.describe('MCP Header Style Test', () => {
  test('Visually inspect the header on pitch-details-v2', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:3000/pitch-details-v2');

    // Locate the header element
    const header = page.locator('.pitch-header');

    // Expect the header to be visible
    await expect(header).toBeVisible();

    // Take a screenshot of the header for visual verification
    const screenshotPath = 'playwright-report/mcp-header-screenshot.png';
    await header.screenshot({ path: screenshotPath });

    console.log(`Screenshot of the header has been saved to: ${screenshotPath}`);
  });
});
