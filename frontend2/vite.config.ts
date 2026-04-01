import { defineConfig } from 'vitest/config';

export default defineConfig({
    define: {
        global: 'globalThis',
    },
    build: {
        outDir: 'build',
    },
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['lcov', 'text'],
            reportsDirectory: 'coverage',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/main.ts', 'src/vite-env.d.ts'],
        },
    },
});
