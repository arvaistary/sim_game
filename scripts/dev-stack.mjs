import { spawn } from 'node:child_process'

const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'
const children = []
let shuttingDown = false

function start(script) {
  const command = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : npmCommand
  const args = isWindows ? ['/d', '/s', '/c', `${npmCommand} run ${script}`] : ['run', script]
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  children.push(child)

  child.once('exit', (code, signal) => {
    if (shuttingDown) return
    shuttingDown = true
    stopChildren()
    process.exit(code ?? (signal ? 1 : 0))
  })
}

function stopChildren() {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  stopChildren()
  setTimeout(() => process.exit(code), 250)
}

process.once('SIGINT', () => shutdown(0))
process.once('SIGTERM', () => shutdown(0))

start('dev:standalone-server')
start('dev:client')
