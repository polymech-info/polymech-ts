
import { forward_slash, pathInfo, pathInfoEx,substitute } from "@polymech/commons"
import { isFile, resolve, globBase } from "@polymech/commons"
import { sync as exists } from "@polymech/fs/exists"

export const defaults = () => {
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    process.on('unhandledRejection', (reason: string) => {
        console.error('Unhandled rejection, reason: ', reason)
    })
}