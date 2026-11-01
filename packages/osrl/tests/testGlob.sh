## Test compiler with glob patters for input and outputs

node ../main.js compile --source='./*in*.+(osr)' --output='./${SRC_NAME}.+(md)' --debug=true --language=osr
