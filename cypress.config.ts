import {defineConfig} from 'cypress';

export default defineConfig({
  allowCypressEnv: false,
  video: false,
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots',
  fixturesFolder: 'cypress/fixtures',
  downloadsFolder: 'cypress/downloads',
  viewportWidth: 1440,
  viewportHeight: 900,
  e2e: {
    baseUrl: 'http://next-app:3010',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts'
  }
});
