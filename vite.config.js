import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import leaderboardPlugin from './vite-leaderboard-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), leaderboardPlugin()],
})
