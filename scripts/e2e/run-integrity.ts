import { get, type IncomingMessage } from 'node:http'
import { spawn, spawnSync, type ChildProcess, type StdioOptions } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export interface RunCommandOptions {
  cwd: string
  timeoutMs: number
  stdio: StdioOptions
}

export interface RunCommandResult {
  exitCode: number
  timedOut: boolean
  durationMs: number
  stdout: string
  stderr: string
}

const integrityTimeoutMs: number = 180_000
const serverStartupTimeoutMs: number = 120_000
const forceKillDelayMs: number = 2_000
const repositoryRoot: string = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const playwrightCliPath: string = resolve(repositoryRoot, 'node_modules/playwright/cli.js')
const playwrightConfigPath: string = resolve(repositoryRoot, 'playwright.config.ts')
const nuxtCliPath: string = resolve(repositoryRoot, 'node_modules/nuxt/bin/nuxt.mjs')
const serverUrl: string = 'http://127.0.0.1:3000'

function killPosixProcessGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
  } catch {
    // Process may have already exited.
  }
}

export function terminateProcessTree(child: ChildProcess): NodeJS.Timeout | undefined {
  const pid: number | undefined = child.pid ?? undefined
  if (pid === undefined) return undefined

  if (process.platform === 'win32') {
    try {
      const taskkillResult = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
      if (taskkillResult.status !== 0) child.kill()
    } catch {
      child.kill()
    }
    return undefined
  }

  killPosixProcessGroup(pid, 'SIGTERM')
  return setTimeout((): void => killPosixProcessGroup(pid, 'SIGKILL'), forceKillDelayMs)
}

function waitForClose(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return Promise.resolve()
  return new Promise<void>((resolveClose): void => {
    child.once('close', (): void => resolveClose())
  })
}

async function stopProcessTree(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return
  const forceKillHandle: NodeJS.Timeout | undefined = terminateProcessTree(child)
  await Promise.race([waitForClose(child), delay(3_000)])
  if (forceKillHandle !== undefined) clearTimeout(forceKillHandle)
}

function delay(milliseconds: number): Promise<void> {
  return new Promise<void>((resolveDelay): void => {
    setTimeout(resolveDelay, milliseconds)
  })
}

function probeServer(url: string): Promise<boolean> {
  return new Promise<boolean>((resolveProbe): void => {
    const request = get(url, (response: IncomingMessage): void => {
      response.resume()
      resolveProbe(true)
    })
    request.setTimeout(1_000, (): void => {
      request.destroy()
      resolveProbe(false)
    })
    request.on('error', (): void => resolveProbe(false))
  })
}

async function waitForServer(child: ChildProcess, url: string, timeoutMs: number): Promise<boolean> {
  const startedAt: number = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) return false
    if (await probeServer(url)) return true
    await delay(250)
  }
  return false
}

export function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions,
): Promise<RunCommandResult> {
  return new Promise<RunCommandResult>((resolveResult): void => {
    const startedAt: number = Date.now()
    const child: ChildProcess = spawn(command, args, {
      cwd: options.cwd,
      detached: process.platform !== 'win32',
      stdio: options.stdio,
      windowsHide: true,
    })
    let timedOut: boolean = false
    let forcedExitCode: number | undefined
    let settled: boolean = false
    let forceKillHandle: NodeJS.Timeout | undefined
    let stdout: string = ''
    let stderr: string = ''

    child.stdout?.on('data', (data: Buffer): void => {
      stdout += data.toString()
    })
    child.stderr?.on('data', (data: Buffer): void => {
      stderr += data.toString()
    })

    const cleanup = (): void => {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
      if (forceKillHandle !== undefined) clearTimeout(forceKillHandle)
      process.off('SIGINT', handleInterrupt)
      process.off('SIGTERM', handleTerminate)
    }

    const complete = (closeCode: number): void => {
      if (settled) return
      settled = true
      cleanup()
      resolveResult({
        exitCode: forcedExitCode ?? closeCode,
        timedOut,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      })
    }

    const stopChild = (exitCode: number): void => {
      forcedExitCode = exitCode
      forceKillHandle = terminateProcessTree(child)
    }

    const handleInterrupt = (): void => stopChild(130)
    const handleTerminate = (): void => stopChild(143)
    const timeoutHandle: NodeJS.Timeout = setTimeout((): void => {
      timedOut = true
      stopChild(124)
    }, options.timeoutMs)

    process.once('SIGINT', handleInterrupt)
    process.once('SIGTERM', handleTerminate)

    child.once('error', (): void => complete(forcedExitCode ?? 1))
    child.once('close', (closeCode: number | null): void => {
      complete(forcedExitCode ?? closeCode ?? 1)
    })

  })
}

function failedResult(message: string, startedAt: number): RunCommandResult {
  return {
    exitCode: 1,
    timedOut: false,
    durationMs: Date.now() - startedAt,
    stdout: '',
    stderr: message,
  }
}

function startNuxtServer(): ChildProcess {
  return spawn(
    process.execPath,
    [nuxtCliPath, 'dev', '--host', '127.0.0.1', '--port', '3000'],
    {
      cwd: repositoryRoot,
      env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  )
}

export async function runIntegrity(args: string[] = process.argv.slice(2)): Promise<RunCommandResult> {
  const startedAt: number = Date.now()
  if (!existsSync(playwrightCliPath)) return failedResult(`Playwright CLI not found: ${playwrightCliPath}`, startedAt)
  if (!existsSync(nuxtCliPath)) return failedResult(`Nuxt CLI not found: ${nuxtCliPath}`, startedAt)

  const playwrightArgs: string[] = [playwrightCliPath, 'test', '--config', playwrightConfigPath, ...args]
  if (args.includes('--list')) {
    const listResult: RunCommandResult = await runCommand(
      process.execPath,
      playwrightArgs,
      { cwd: repositoryRoot, timeoutMs: integrityTimeoutMs, stdio: 'inherit' },
    )
    return { ...listResult, durationMs: Date.now() - startedAt }
  }

  const server: ChildProcess = startNuxtServer()
  let serverOutput: string = ''
  server.stdout?.on('data', (data: Buffer): void => { serverOutput += data.toString() })
  server.stderr?.on('data', (data: Buffer): void => { serverOutput += data.toString() })

  try {
    const ready: boolean = await waitForServer(server, serverUrl, serverStartupTimeoutMs)
    if (!ready) {
      return failedResult(`Nuxt dev server did not become ready.\n${serverOutput}`, startedAt)
    }

    const remainingTimeoutMs: number = Math.max(1, integrityTimeoutMs - (Date.now() - startedAt))
    const result: RunCommandResult = await runCommand(
      process.execPath,
      playwrightArgs,
      { cwd: repositoryRoot, timeoutMs: remainingTimeoutMs, stdio: 'inherit' },
    )
    return { ...result, durationMs: Date.now() - startedAt }
  } finally {
    await stopProcessTree(server)
  }
}

async function main(): Promise<void> {
  const result: RunCommandResult = await runIntegrity()
  console.log(`Integrity E2E lifecycle: exitCode=${result.exitCode} timedOut=${result.timedOut} durationMs=${result.durationMs}`)
  process.exitCode = result.exitCode
}

const entrypoint: string = process.argv[1] === undefined ? '' : resolve(process.argv[1])
const currentModule: string = resolve(fileURLToPath(import.meta.url))
if (entrypoint === currentModule) {
  void main().catch((error: unknown): void => {
    console.error(error)
    process.exitCode = 1
  })
}
