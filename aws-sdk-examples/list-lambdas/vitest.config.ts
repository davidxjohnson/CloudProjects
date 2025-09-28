/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
    esbuild: {
        target: 'node18'
    },
    test: {
        // Test file patterns
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', 'coverage'],

        // Environment
        environment: 'node',

        // Global test functions (describe, it, expect) - disabled for explicit imports
        globals: false,

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: 'coverage',
            include: [
                'src/lambda-lister.ts',
                'src/list-lambdas.ts'
            ],
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/test-*.ts',
                'src/mock-*.ts',
                'src/*test*.ts'
            ],
            thresholds: {
                statements: 70,
                branches: 60,
                functions: 70,
                lines: 70
            }
        }
    }
})