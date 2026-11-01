import * as CLI from 'yargs'
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { cli } from '../cli.js'
import { defaults } from '../_cli.js'

function findMediaImg(): string {
    if (process.env.MEDIA_IMG && process.env.MEDIA_IMG.length > 0)
        return process.env.MEDIA_IMG
    const pkg = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
    const p = join(pkg, 'cpp', 'dist', 'media-img.exe')
    if (existsSync(p))
        return p
    return 'media-img.exe'
}

export const command = 'register-explorer'
export const desc = 'Forward to media-img.exe register-explorer (Windows; implementation is in C++)'
export const builder = (yargs: CLI.Argv) => yargs.strict(false)

export async function handler() {
    defaults()
    if (process.platform !== 'win32') {
        console.error('register-explorer is only supported on Windows.')
        process.exit(1)
    }
    const exe = findMediaImg()
    const args = process.argv.slice(2)
    const r = spawnSync(exe, args, { stdio: 'inherit', shell: false, windowsHide: true })
    process.exit(r.status === null ? 1 : r.status)
}

cli.command(command, desc, builder, handler)
