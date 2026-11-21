// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
    { ignores: ['dist/**', 'node_modules/**', '.content/**', '.vite-ssg-temp/**', '.agents/**', '.astro/**', 'public/**', 'demo/**', 'docs/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                sourceType: 'module',
                extraFileExtensions: ['.vue'],
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                history: 'readonly',
                location: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                requestAnimationFrame: 'readonly',
                IntersectionObserver: 'readonly',
                ResizeObserver: 'readonly',
            },
        },
    },
    {
        files: ['**/*.ts', '**/*.mjs', 'scripts/**'],
        languageOptions: {
            globals: {
                process: 'readonly',
                Buffer: 'readonly',
                console: 'readonly',
                URL: 'readonly',
                module: 'readonly',
                require: 'readonly',
            },
        },
    },
    {
        files: ['**/*.{ts,vue}'],
        rules: {
            // TypeScript 负责全局类型检查，ESLint 的 no-undef 对 DOM/define 常量会误报
            'no-undef': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['**/*.cjs'],
        languageOptions: {
            globals: { module: 'readonly', require: 'readonly', __dirname: 'readonly', process: 'readonly' },
        },
    },
    {
        rules: {
            'vue/multi-word-component-names': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
]