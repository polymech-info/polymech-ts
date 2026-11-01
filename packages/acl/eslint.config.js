import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
    { files: ['src/**/*.ts'] },
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            // Aligned with monorepo root config
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/consistent-indexed-object-style': 'off',
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/prefer-for-of': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/await-thenable': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/dot-notation': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/prefer-optional-chain': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-redundant-type-constituents': 'off',
            '@typescript-eslint/only-throw-error': 'off',
            '@typescript-eslint/prefer-promise-reject-errors': 'off',
            '@typescript-eslint/unbound-method': 'off',
            'prefer-const': 'off',
        },
    },
);
