// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'off',
  },
  projects: [
    {
      name: 'source',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'dist',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001/dist',
      },
    },
  ],
});
