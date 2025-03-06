module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
    ],
    plugins: ['@typescript-eslint'],
    env: {
      node: true,
      jest: true
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  };