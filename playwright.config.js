// Playwright 配置文件
// 發音評估應用程式自動化測試配置

module.exports = {
  testDir: './tests',
  testMatch: ['**/*.spec.js', '**/playwright-test.js', '**/auth-*.js', '**/manual-*.js', '**/extract-*.js', '**/stealth-*.js', '**/debug-*.js', '**/*-test.js'],
  testIgnore: ['src/**/*.test.js', 'src/**/*.spec.js', 'jest.config.js', 'setupTests.js'],
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: process.env.HEADLESS === 'true',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...require('playwright').devices['Desktop Chrome'],
        // 讓瀏覽器看起來更像真實用戶環境
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-automation',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-infobars',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--exclude-switches=enable-automation',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
        javaScriptEnabled: true,
        acceptDownloads: true,
        // 重要：移除自動化檢測標誌
        extraHTTPHeaders: {
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...require('playwright').devices['Desktop Firefox'],
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...require('playwright').devices['Desktop Safari'],
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...require('playwright').devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...require('playwright').devices['iPhone 12'],
      },
    },
    {
      name: 'Tablet',
      use: {
        ...require('playwright').devices['iPad Pro'],
      },
    },
  ],
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  outputDir: 'test-results/',
}; 