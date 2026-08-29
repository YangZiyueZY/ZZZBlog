// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import { parseForESLint as astroParse } from 'astro-eslint-parser';
import tsParser from '@typescript-eslint/parser';

export default [
    { ignores: ['dist/**', 'node_modules/**', '.astro/**', '.github/**', 'public/**', 'demo/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...astro.configs.recommended,
    {
        files: ['**/*.astro'],
        languageOptions: {
            parser: { parseForESLint: astroParse },
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: ['.astro'],
            },
        },
    },
    {
        // Node.js 环境的构建/配置文件（CJS/ESM 均适用）
        files: ['**/*.cjs', '**/*.mjs', 'scripts/**'],
        languageOptions: {
            globals: {
                module: 'readonly',
                require: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                console: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
            },
        },
    },
];
