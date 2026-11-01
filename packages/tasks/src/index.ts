/**
 * Callback prototype signature when content has been compiled
 * @param {string} src The path of the source file
 * @param {string} dst The path of the destination file
 * @param {string} content The content
 * @returns {boolean}
 */
export type OnCompiled = (src: string, dst: string, content: string) => Promise<string>

/**
 * Callback prototype signature when 'compile' task is finish
 * @param {string} src The path of the source file
 * @param {string} dst The path of the destination file
 * @param {string} content The content
 * @returns {boolean}
 */
export type OnCompileDone = (src: string, dst: string, options: any, content: string) => Promise<void>
