import { spawn, execSync, type ChildProcess } from 'child_process'
import { readFileSync } from 'fs'
import type { Plugin } from 'vite'
import { join } from 'path'

let mimoProcess: ChildProcess | null = null
let mimoPort = 0

function getPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
    return pkg.version || '0.0.0'
  } catch { return '0.0.0' }
}

export function mimoServePlugin(): Plugin {
  return {
    name: 'mimo-serve',
    configureServer(server) {
      // Install mimo CLI endpoint
      server.middlewares.use('/api/install-mimo', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        const send = (msg: string) => {
          res.write(`data: ${JSON.stringify({ message: msg })}\n\n`)
        }

        send('Running: npm install -g @mimo-ai/cli ...')

        const install = spawn('npm', ['install', '-g', '@mimo-ai/cli'], {
          stdio: ['ignore', 'pipe', 'pipe'],
        })

        install.stdout?.on('data', (chunk: Buffer) => send(chunk.toString().trim()))
        install.stderr?.on('data', (chunk: Buffer) => send(chunk.toString().trim()))

        install.on('close', (code) => {
          if (code === 0) {
            send('MimoCode CLI installed successfully!')
            res.write(`data: ${JSON.stringify({ ok: true })}\n\n`)
          } else {
            send(`Installation failed (exit code ${code})`)
            res.write(`data: ${JSON.stringify({ ok: false, error: `Exit code ${code}` })}\n\n`)
          }
          res.end()
        })

        install.on('error', (err) => {
          send(`Error: ${err.message}`)
          res.write(`data: ${JSON.stringify({ ok: false, error: err.message })}\n\n`)
          res.end()
        })
      })

      // Environment check endpoint
      server.middlewares.use('/api/check-env', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })

        const result = { node: '', mimo: '', mimoVersion: '', serveRunning: false }

        // Check Node.js
        try {
          result.node = execSync('node --version', { encoding: 'utf-8', timeout: 3000 }).trim()
        } catch { result.node = '' }

        // Check mimo CLI
        try {
          result.mimo = execSync('which mimo', { encoding: 'utf-8', timeout: 3000 }).trim()
          try {
            result.mimoVersion = execSync('mimo --version', { encoding: 'utf-8', timeout: 3000 }).trim()
          } catch { result.mimoVersion = '' }
        } catch { result.mimo = '' }

        // Check if mimo serve is running on common ports
        for (const port of [4096, 19880]) {
          try {
            execSync(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://127.0.0.1:${port}/config`, {
              encoding: 'utf-8',
              timeout: 2000,
            })
            result.serveRunning = true
            break
          } catch { /* not running on this port */ }
        }

        res.end(JSON.stringify(result))
      })

      server.middlewares.use('/api/start-server', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        // Already running
        if (mimoProcess && !mimoProcess.killed) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, port: mimoPort, message: 'Already running' }))
          return
        }

        // Pick a port
        mimoPort = 4096

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        const send = (msg: string) => {
          res.write(`data: ${JSON.stringify({ message: msg })}\n\n`)
        }

        send(`Starting mimo serve on port ${mimoPort}...`)

        mimoProcess = spawn('mimo', ['serve', '--port', String(mimoPort)], {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        })

        mimoProcess.unref()

        let output = ''
        let started = false

        const checkReady = (chunk: Buffer) => {
          const text = chunk.toString()
          output += text
          send(text.trim())

          if (!started && (output.includes('listening') || output.includes('ready'))) {
            started = true
            send(`Server started on port ${mimoPort}`)
            res.write(`data: ${JSON.stringify({ ok: true, port: mimoPort })}\n\n`)
            res.end()
          }
        }

        mimoProcess.stdout?.on('data', checkReady)
        mimoProcess.stderr?.on('data', checkReady)

        mimoProcess.on('error', (err) => {
          send(`Error: ${err.message}`)
          res.write(`data: ${JSON.stringify({ ok: false, error: err.message })}\n\n`)
          res.end()
        })

        mimoProcess.on('exit', (code) => {
          if (!started) {
            send(`Process exited with code ${code}`)
            res.write(`data: ${JSON.stringify({ ok: false, error: `Exit code ${code}` })}\n\n`)
            res.end()
          }
          mimoProcess = null
        })

        // Timeout after 15s
        setTimeout(() => {
          if (!started) {
            send('Timeout waiting for server')
            res.write(`data: ${JSON.stringify({ ok: false, error: 'Timeout' })}\n\n`)
            res.end()
            mimoProcess?.kill()
          }
        }, 15000)
      })

      server.middlewares.use('/api/stop-server', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }
        if (mimoProcess && !mimoProcess.killed) {
          mimoProcess.kill()
          mimoProcess = null
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, message: 'Not running' }))
        }
      })

      // Version check: local mimo vs npm latest
      server.middlewares.use('/api/check-mimo-version', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        let local = ''
        try { local = execSync('mimo --version', { encoding: 'utf-8', timeout: 3000 }).trim() } catch { /* ignore */ }
        let latest = ''
        try {
          const info = execSync('npm view @mimo-ai/cli version', { encoding: 'utf-8', timeout: 5000 }).trim()
          latest = info
        } catch { /* ignore */ }
        res.end(JSON.stringify({ local, latest, updateAvailable: local && latest && local !== latest }))
      })

      // Version check: MimoCodeHub latest release from GitHub
      server.middlewares.use('/api/check-hub-version', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        const current = getPackageVersion()
        try {
          const data = execSync('curl -s https://api.github.com/repos/TetrahedronAY/MimoCodeHub/releases/latest', {
            encoding: 'utf-8',
            timeout: 5000,
          })
          const release = JSON.parse(data)
          const latest = (release.tag_name || '').replace('v', '')
          res.end(JSON.stringify({ current, latest, updateAvailable: current !== latest }))
        } catch {
          res.end(JSON.stringify({ current, latest: '', updateAvailable: false }))
        }
      })

      // Update MimoCode CLI
      server.middlewares.use('/api/update-mimo', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
        const send = (msg: string) => res.write(`data: ${JSON.stringify({ message: msg })}\n\n`)

        send('Updating @mimo-ai/cli...')
        const proc = spawn('npm', ['install', '-g', '@mimo-ai/cli@latest'], { stdio: ['ignore', 'pipe', 'pipe'] })
        proc.stdout?.on('data', (c: Buffer) => send(c.toString().trim()))
        proc.stderr?.on('data', (c: Buffer) => send(c.toString().trim()))
        proc.on('close', (code) => {
          if (code === 0) { send('MimoCode CLI updated successfully!'); res.write(`data: ${JSON.stringify({ ok: true })}\n\n`) }
          else { send(`Update failed (exit code ${code})`); res.write(`data: ${JSON.stringify({ ok: false })}\n\n`) }
          res.end()
        })
        proc.on('error', (err) => { send(`Error: ${err.message}`); res.write(`data: ${JSON.stringify({ ok: false })}\n\n`); res.end() })
      })

      // Update MimoCodeHub (download latest release zip)
      server.middlewares.use('/api/update-hub', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return }
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
        const send = (msg: string) => res.write(`data: ${JSON.stringify({ message: msg })}\n\n`)

        send('Checking latest release...')
        try {
          const data = execSync('curl -s https://api.github.com/repos/TetrahedronAY/MimoCodeHub/releases/latest', { encoding: 'utf-8', timeout: 5000 })
          const release = JSON.parse(data)
          const zipAsset = (release.assets || []).find((a: { name: string }) => a.name === 'mimocodehub.zip')
          if (!zipAsset) { send('No zip asset found'); res.write(`data: ${JSON.stringify({ ok: false })}\n\n`); res.end(); return }

          send(`Downloading v${release.tag_name}...`)
          const distDir = join(process.cwd(), 'dist')
          execSync(`curl -sL ${zipAsset.browser_download_url} -o /tmp/mimocodehub.zip`, { timeout: 30000 })
          send('Extracting...')
          execSync(`cd ${distDir} && unzip -o /tmp/mimocodehub.zip`, { timeout: 10000 })
          send('MimoCodeHub updated! Refresh the page to use the new version.')
          res.write(`data: ${JSON.stringify({ ok: true })}\n\n`)
        } catch (err) {
          send(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
          res.write(`data: ${JSON.stringify({ ok: false })}\n\n`)
        }
        res.end()
      })
    },
  }
}
