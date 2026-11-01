var fs = require("fs");
var CodeGen = require("swagger-typescript-codegen").CodeGen;
var write = require('@plastichub/fs/write').sync;

var file = "./schema.json";
var swagger = JSON.parse(fs.readFileSync(file, "UTF-8"));
var tsSourceCode = CodeGen.getTypescriptCode({
    className: "Test",
    swagger: swagger,
    beautify: true,
    template: {
       // class: fs.readFileSync("./class.mustache", "utf-8"),
       // method: fs.readFileSync("./method.mustache", "utf-8"),
       // type: fs.readFileSync("./type.mustache", "utf-8")
    }
});

write('./client.ts', tsSourceCode);