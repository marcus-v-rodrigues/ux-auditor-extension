/**
 * Configuração do Vite para a extensão Chrome.
 * Utiliza o plugin CRXJS para integrar o manifesto V3 com o build do Vite,
 * permitindo HMR (Hot Module Replacement) e empacotamento simplificado.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    // Suporte a React com Fast Refresh
    react(),
    
    // Integração automática do manifesto.json
    // Gera os scripts de content, background e popup baseados no manifesto
    crx({ manifest }),
  ],
})