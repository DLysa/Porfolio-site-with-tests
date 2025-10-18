import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8000', // Twój frontend
    specPattern: 'cypress/e2e/**/*.ts',
    supportFile: "cypress/support/e2e.ts",
  },
})
