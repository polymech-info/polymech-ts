# Build

Build chain using Grunt

## Provided Grunt Task Plugins

### OSR-Language Tasks (see [source](./tasks/compile.ts))

**brief** : Task to compile files with [`osr - language`](https://git.osr-plastic.org/osr-plastic/osrl)

Example config for Grunt

```js

grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        compile: {
            documentation: {
                src: [
                    "src/documentation/**/*.md",
                ],
                options: {
                    output: 'content/en/',
                    debug: false,
                    watch: true,
                    root: path.resolve("./src/documentation/")
                }
            }
        }
});

grunt.registerTask('default', [
    'compile:documentation'
]);
require("@plastichub/osr-tasks").initConfig(grunt, {})

```

### Todos

- [x] osr-i18n
  - [ ] data assets
- [-] osr-templates (newsletter, ...)
- [x] osr-content
- [-] osr-vendor
  - [x] osr-vendor-laser
- [-] osr-kb
- [-] osr-oa
- [-] OSRL - Template/Wrapper
- [x] osr-media
  - [ ] web bundles
  - [ ] cmd (glob)
  - [ ] video
- [x] osr-cad
- [x] osr-sync
- [ ] house keeping
  - [-] npm
  - [-] packages
  - [x] git
  - [x] ssh
- [ ] validate
- [ ] osr-hugo
- [x] osr-discourse
- [-] osr-discord
- [ ] osr-ig-bot
- [ ] meta
  - [ ] lib hash (log/cache)
  - [ ] query | options
- [ ] tasks
  - [ ] laser:configuration
  - [ ] laser:virtual components
  - [ ] laser:equations (configurator)

