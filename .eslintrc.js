module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['standard-with-typescript', 'prettier'],
  overrides: [],
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    indent: 'off',
    '@typescript-eslint/indent': ['error', 2],
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
  },
};
