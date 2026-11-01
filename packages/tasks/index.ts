exports.initConfig = function (grunt: IGrunt) {    
    require('./tasks/compile').register(grunt)
    require('./tasks/cad').register(grunt)
    require('./tasks/sync').register(grunt)
    require('./tasks/laser').register(grunt)
    require('./tasks/laser2').register(grunt)
    require('./tasks/cscart').register(grunt)
    require('./tasks/images').register(grunt)
    require('./tasks/git').register(grunt)
    require('./tasks/i18n').register(grunt)
    require('./tasks/sshexec').register(grunt)
}
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
