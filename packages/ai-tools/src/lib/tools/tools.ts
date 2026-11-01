import { tools as fsTools } from './fs.js'
import { tools as npmTools } from './npm.js'
import { tools as gitTools } from './git.js'
import { tools as terminalTools } from './terminal.js'
import { tools as interactTools } from './interact.js'
import { tools as userTools } from './user.js'
import { tools as search } from './search.js'
//import { tools as webTools } from './web.js'
import { tools as memoryTools } from './memory.js'
// import { tools as emailTools } from './email'

export const tools = {
    fs: fsTools,
    npm: npmTools,
    git: gitTools,
    terminal: terminalTools,
    interact: interactTools,
    user: userTools,
    search: search,
    // web: webTools,
    memory: memoryTools
    // email: emailTools
}
