import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|es-toolkit|immer|@reduxjs|redux|reselect|use-sync-external-store|decimal\.js-light|eventemitter3|tiny-invariant|clsx)[\\/]/ },
          ],
        },
      },
    },
  },
})
