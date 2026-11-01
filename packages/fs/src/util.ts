import { substitute as _substitute, substituteAlt  } from "@polymech/core/strings"
export const substitute = (alt:boolean, template:string, vars:Record<string, string>) => alt ? substituteAlt(template,vars) : _substitute(template, vars)
