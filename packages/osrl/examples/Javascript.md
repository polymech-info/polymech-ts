## Javascript Support

### Option 1: Run a Javascript file via filter

```liquid
JS Result : {{"./test.js" | jseval }}
```

Where ['./test.js']('./test.js') is:

```js
exports.default = function (engine) {
    console.log('hello');
    return 'cool!';
}
```

***Output***

```html
JS Result : cool!
```

**Remarks**

- Paths are resolved via Liquid standard options ```options.root``` where './test.js' is being appended to any of the roots listed in ```options.root```

### Option 2: Run a Javascript expression

```liquid
JS Expression Result : {{"2+2 + someNumber" | jsexp }}
```

***Output***

```html
JS Expression Result : 6
```

**Remarks**

- ```someNumber``` is being added to the expression in top as standard variable, using the Liquid parse option arguments, eg :

```ts

const template_ = read(`${machine_path}/templates/site/test-js.html`) as string;

let vars = {
    name: '{{test}}',
    test: '{{other}}',
    other: 'alice',
    show: false,
    someNumber: 2
};

let options = {
    root: [
        `${machine_path}/`,
        `${machine_path}/templates/site/`,
        `${machine_path}/templates/shared/`
    ],
    toHTML: false
}

let e = new Engine(options);
e.parse(template_, vars, 5).then(console.log);

return;
```
