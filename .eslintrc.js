module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  ignorePatterns: ['node_modules/**', 'dist/**', 'coverage/**'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'off',
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_|next',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
  overrides: [
    // Add this override for JavaScript files
    {
      files: ['*.js'],
      extends: ['eslint:recommended'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: undefined,
      },
      rules: {
        // Turn off TypeScript-specific rules for JS files
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/ban-types': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
