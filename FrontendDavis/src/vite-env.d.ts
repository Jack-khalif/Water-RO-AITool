/// <reference types="vite/client" />
import path from 'path'
// …
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  }
})
