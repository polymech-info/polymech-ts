const { compile } = require('nexe')

compile({
  input: './main.js',
  build: true, //required to use patches
  clean:false,
  output:'./dist/win32/osr-cad.exe',
  verbose:true,
  fakeArgv: false,
  temp:'./.nexe',
  _patches: [
    async (compiler, next) => {
      await compiler.setFileContentsAsync(
        'lib/new-native-module.js',
        'module.exports = 42'
      )
      return next()
    }
  ]
}).then(() => {
  console.log('success')
})