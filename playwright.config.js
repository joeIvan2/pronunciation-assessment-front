// Playwright 配置文件
// 發音評估應用程式自動化測試配置

module.exports = {
  testDir: './tests',
  testMatch: ['**/*.spec.js', '**/playwright-test.js'],
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