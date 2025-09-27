import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-prototype-builtins': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-prototype-builtins': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'lib/',
      'cdk.out/',
      'coverage/',
    ],
  },
);