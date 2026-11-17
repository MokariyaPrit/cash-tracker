import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Pre-bundle heavy UI libs so first page load doesn't crawl them live.
    // Prefer deep icon imports in code; do NOT include all of @mui/icons-material.
    include: [
      '@mui/material',
      '@mui/material/styles',
      '@emotion/react',
      '@emotion/styled',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@mui/x-date-pickers/AdapterDayjs',
      'dayjs',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
  },
  server: {
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/AddTransaction.tsx',
        './src/pages/Transactions.tsx',
        './src/pages/CalendarDashboard.tsx',
      ],
    },
  },
})
