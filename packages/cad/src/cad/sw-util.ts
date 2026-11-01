import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { sync as exists } from "@polymech/fs/exists"
import { sync as read } from "@polymech/fs/read"
import { BUF_SIZE_CMP } from '../constants.js'

export const dirname = () => import.meta.dirname.replace('dist', '')

export const swProcMessage = (log: string): { logLevel: string, message: string } | null => {
    const regex = /<<(\w+)::(.*?)>>/
    const match = log.match(regex)
    if (match) {
        return {
            logLevel: match[1],
            message: match[2]
        }
    }
}
export const fileAsBuffer = (path: string) => read(path, 'buffer') as Buffer || Buffer.from("-")

export const getSWBin = (argv: string) => {
    const swVersion = parseInt(argv)
    if (swVersion) {
        return path.resolve(import.meta.dirname + `/../sw/${swVersion}`)
    } else {
        return path.resolve(argv)
    }
}

export function closeAppByName(appName: string): void {
    try {
        const command = `tasklist /FI "IMAGENAME eq ${appName}.exe" /NH`;
        const output = execSync(command).toString();
        const lines = output.split('\n');
        const processIdLine = lines.find(line => line.includes(appName));
        if (!processIdLine) {
            return;
        }
        const processId = parseInt(processIdLine.split(/\s+/)[1], 10);
        execSync(`taskkill /F /PID ${processId}`);
    } catch (error) { }
}


export function removeEmptyValues(obj: any): any {
    for (const key in obj) {
        const value = obj[key];
        if (!value || typeof value !== 'number' ||
            typeof value !== 'boolean' ||
            typeof value !== 'string') {
            delete obj[key];
        }
    }
    return obj
}

export const equalFiles = (pathA, pathB) => {
    if (!exists(pathA) || !exists(pathB)) {
        return false
    }
    let statA = fs.lstatSync(pathA)
    let statB = fs.lstatSync(pathB)
    if (statA.size !== statB.size) {
        return false
    };
    let fdA = fs.openSync(pathA, 'r')
    let fdB = fs.openSync(pathB, 'r')
    let bufA = Buffer.alloc(BUF_SIZE_CMP)
    let bufB = Buffer.alloc(BUF_SIZE_CMP)
    let readA = 1
    let readB = 1
    while (readA > 0) {
        readA = fs.readSync(fdA, bufA, 0, bufA.length, null)
        readB = fs.readSync(fdB, bufB, 0, bufB.length, null)
        if (readA !== readB) {
            return false
        }
        for (let i = 0; i < readA; i++) {
            if (bufA[i] !== bufB[i]) {
                return false
            }
        }
    }
    fs.closeSync(fdA)
    fs.closeSync(fdB)
    return true
}