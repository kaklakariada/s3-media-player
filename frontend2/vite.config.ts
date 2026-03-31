import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        global: 'globalThis',
    },
    build: {
        outDir: 'build',
    },
});
