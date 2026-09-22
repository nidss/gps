import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base ต้องตรงกับชื่อ repo เพราะ deploy ขึ้น GitHub Pages ที่ https://nidss.github.io/gps/
export default defineConfig({
  base: '/gps/',
  plugins: [react(), tailwindcss()],
})
