import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

function detectMimoPort(): number | null {
  // 1. Try log files
  try {
    const logDir = join(process.env.HOME || '~', '.local/share/mimocode/log')
    const files = readdirSync(logDir)
      .filter((f) => f.endsWith('.log'))
      .sort()
      .reverse()
    for (const file of files.slice(0, 3)) {
      const content = readFileSync(join(logDir, file), 'utf-8')
      const match = content.match(/"--port","(\d+)"/)
      if (match) return parseInt(match[1]!, 10)
    }
  } catch { /* ignore */ }

  // 2. Try running process
  try {
    const output = execSync('ps aux | grep "mimo serve" | grep -v grep', {
      encoding: 'utf-8',
      timeout: 2000,
    })
    const match = output.match(/--port\s+(\d+)/)
    if (match) return parseInt(match[1]!, 10)
  } catch { /* ignore */ }

  return null
}

const mimoPort = detectMimoPort()

if (mimoPort) {
  console.log(`[mimocode] Detected mimo serve on port ${mimoPort}`)
} else {
  console.log('[mimocode] No mimo serve detected, will use manual connection')
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
  },
  define: {
    __MIMO_PORT__: JSON.stringify(mimoPort),
  },
})
