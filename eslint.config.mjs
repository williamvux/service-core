import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['**/dist/', '**/coverage/', '**/node_modules/'] },
    js.configs.recommended,
    {
        files: ['**/*.{ts,js,mjs}'],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        files: ['**/*.ts'],
        extends: [...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },
    {
        files: ['tests/**/*.ts'],
        rules: { '@typescript-eslint/no-floating-promises': 'off' },
    },
    {
        files: ['**/*.js', '**/*.mjs'],
        extends: [tseslint.configs.disableTypeChecked],
    },
    prettier,
);
