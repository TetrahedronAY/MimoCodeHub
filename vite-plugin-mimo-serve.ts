import { spawn, type ChildProcess } from 'child_process'
import type { Plugin } from 'vite'

let mimoProcess: ChildProcess | null = null
let mimoPort = 0

export function mimoServePlugin(): Plugin {
  return {
    name: 'mimo-serve',
    configureServer(server) {
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
    },
  }
}
