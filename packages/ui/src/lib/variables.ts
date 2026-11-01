
// Ported from @polymech/commons/variables.ts and @polymech/core/constants.ts
// Optimized for browser usage (no process/fs dependencies)

// standard expression for variables, eg : ${foo}
export const REGEX_VAR = /\$\{([^\s:}]+)(?::([^\s:}]+))?\}/g

// alternate expression for variables, eg : %{foo}. this is required
// to deal with parent expression parsers where '$' is reserved, eg: %{my_var}
export const REGEX_VAR_ALT = /&\{([^\s:}]+)(?::([^\s:}]+))?\}/g

// Minimal config replacement for browser
export const DEFAULT_ROOTS = {
    // Add any safe defaults if needed, or leave empty for frontend
}

export const DATE_VARS = () => {
    return {
        YYYY: new Date(Date.now()).getFullYear(),
        MM: new Date(Date.now()).getMonth() + 1,
        DD: new Date(Date.now()).getDate(),
        HH: new Date(Date.now()).getHours(),
        SS: new Date(Date.now()).getSeconds()
    }
}

export const _substitute = (template: string, map: Record<string, any>, keep: boolean = true, alt: boolean = false) => {
    const transform = (k: any) => k || ''
    return template.replace(alt ? REGEX_VAR_ALT : REGEX_VAR, (match, key, format) => {
        if (map[key] !== undefined && map[key] !== null) {
            return transform(map[key]).toString()
        } else if (map[key.replace(/-/g, '_')] !== undefined && map[key.replace(/-/g, '_')] !== null) {
            return transform(map[key.replace(/-/g, '_')]).toString()
        } else if (keep) {
            return "${" + key + "}"
        } else {
            return ""
        }
    })
}

export const substitute = (alt: boolean, template: string, vars: Record<string, any> = {}, keep: boolean = true) =>
    alt ? _substitute(template, vars, keep, alt) : _substitute(template, vars, keep, alt)

export const DEFAULT_VARS = (vars: any) => {
    return {
        ...DEFAULT_ROOTS,
        ...DATE_VARS(),
        ...vars
    }
}

export const resolveVariables = (path: string, alt: boolean = false, vars: Record<string, string> = {}, keep = false) =>
    substitute(alt, path, DEFAULT_VARS(vars), keep)

export const resolve = (path: string, alt: boolean = false, vars: Record<string, string> = {}, keep = false) =>
    resolveVariables(path, alt, vars, keep)

export const template = (
    path: string,
    vars: Record<string, any> = {},
    keep: boolean = false,
    depth: number = 3
): string => {
    const map = DEFAULT_VARS(vars)
    let oldValue = path
    let newValue = resolve(oldValue, false, map, keep)
    let iterationCount = 0
    while (newValue !== oldValue && iterationCount < depth) {
        iterationCount++
        oldValue = newValue
        newValue = resolve(oldValue, false, map, keep)
    }
    return newValue
}
