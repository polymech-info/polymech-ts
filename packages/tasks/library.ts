export const gruntOptions = (grunt) =>{
    const ret = {}
    grunt.option.keys().forEach((k)=>{
        ret[k] = grunt.option(k)
    })
    delete ret['verbose']
    delete ret['help']
    delete ret['gruntfile']
    return ret
}
export const option = (option: string, taskOptions: any, grunt, _default?: any) => {
    let ret = taskOptions[option] !== undefined ? taskOptions[option] : _default;
    if (grunt.option(option) !== undefined) {
        ret = grunt.option(option)
    }
    return ret
}

import * as path from 'path'
import { sync as exists } from '@plastichub/fs/exists'

const fg = require('fast-glob')

export const CAD_MAIN_PATTERN = '**/cad/**/*Global*.+(SLDASM)'

export const MainAssembly = (dir, filePattern = CAD_MAIN_PATTERN) => files(dir, filePattern)[0]

export const files = (dir, glob) => fg.sync(glob, {
    dot: true,
    cwd: dir,
    absolute: true,
    caseSensitiveMatch: false
})

export const forward_slash = (path) => {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }
    return path.replace(/\\/g, '/');
}


export const file_path_with_ext = (file, ext) => {
    const parts = path.parse(file)
    return path.join(parts.dir, parts.name + '.' + ext)
}

export const file_path_with_ext_ex = (file, ext) => {
    let parts = path.parse(file)
    let _path = path.join(parts.dir, parts.name.toLowerCase() + '.' + ext.toLowerCase())
    if (exists(_path)) {
        return _path
    }
    _path = file_path_with_ext(file, ext)
    if (exists(_path)) {
        return _path
    }
    return ''
}

export const unique_by = (arr, key) => {
    return [...new Map(arr.map(item => [item[key], item])).values()]
}