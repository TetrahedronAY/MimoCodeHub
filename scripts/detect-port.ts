/**
 * Detect mimo serve port by reading the latest log file.
 * Falls back to scanning common ports.
 */
import { execSync } from 'child_process'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const LOG_DIR = join(process.env.HOME || '~', '.local/share/mimocode/log')
const COMMON_PORTS = [4096, 19880, 3000, 8080, 9000]

function detectFromLogs(): number | null {
  try {
    const files = readdirSync(LOG_DIR)
      .filter((f) => f.endsWith('.log'))
      .sort()
      .reverse()

    for (const file of files.slice(0, 3)) {
      const content = readFileSync(join(LOG_DIR, file), 'utf-8')
      // Match: args=["serve","--port","19880"]
      const match = content.match(/"--port","(\d+)"/)
      if (match) {
        return parseInt(match[1]!, 10)
      }
    }
  } catch {
    // log dir not accessible
  }
  return null
}

function detectFromProcess(): number | null {
  try {
    const output = execSync('ps aux | grep "mimo serve" | grep -v grep', {
      encoding: 'utf-8',
      timeout: 2000,
    })
    const match = output.match(/--port\s+(\d+)/)
    if (match) {
      return parseInt(match[1]!, 10)
    }
  } catch {
    // no process found
  }
  return null
}

async function detectFromScan(): Promise<number | null> {
  for (const port of COMMON_PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/config`, {
        signal: AbortSignal.timeout(500),
      })
      if (res.ok) return port
    } catch {
      // not available
    }
  }
  return null
}

export async function detectMimoPort(): Promise<number | null> {
  // 1. Try log files (fastest, no network)
  const logPort = detectFromLogs()
  if (logPort) return logPort

  // 2. Try running process
  const procPort = detectFromProcess()
  if (procPort) return procPort

  // 3. Scan common ports
  const scanPort = await detectFromScan()
  if (scanPort) return scanPort

  return null
}
