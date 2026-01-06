/**
 * Configuração do ESLint para o projeto.
 * Define regras de linting para JavaScript e React, garantindo qualidade e consistência do código.
 */
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignora a pasta de build
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser, // Define globais do navegador (window, document, etc.)
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true }, // Habilita suporte a JSX
        sourceType: 'module',
      },
    },
    rules: {
      // Regra personalizada para ignorar variáveis não usadas que comecem com letra maiúscula ou _
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
