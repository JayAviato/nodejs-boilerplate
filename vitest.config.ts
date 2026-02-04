import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/main.ts',
                'src/**/*.d.ts',
                'src/infrastructure/database/prisma/**',
            ],
            thresholds: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80,
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@domain': path.resolve(__dirname, './src/domain'),
            '@application': path.resolve(__dirname, './src/application'),
            '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
            '@presentation': path.resolve(__dirname, './src/presentation'),
            '@shared': path.resolve(__dirname, './src/shared'),
        },
    },
});
