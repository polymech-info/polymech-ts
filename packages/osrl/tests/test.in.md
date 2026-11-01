---
permalink: /system/testosr
---
# Examples

## Retrieve Environment variables

- NUMBER_OF_PROCESSORS = 16

## Directory listing using fs.iterator (provides mime and directory sizes)

- sal-test-ai.md - ./docs/sal-test-ai.md - file - text/markdown | Size : 2.8 kB
- sal-test.md - ./docs/sal-test.md - file - text/markdown | Size : 98 B
- sample_ai_svg.md - ./docs/sample_ai_svg.md - file - text/markdown | Size : 5.7 kB
- glands-scad-glands.md - ./osr-ai/glands-scad-glands.md - file - text/markdown | Size : 1.2 kB
- glands-scad.md - ./osr-ai/glands-scad.md - file - text/markdown | Size : 1.2 kB
- html-attributes.md - ./osr-ai/html-attributes.md - file - text/markdown | Size : 6 B
- open-ai-test-glands-table-glands.md - ./osr-ai/open-ai-test-glands-table-glands.md - file - text/markdown | Size : 1.9 kB
- open-ai-test-glands-table.md - ./osr-ai/open-ai-test-glands-table.md - file - text/markdown | Size : 1.9 kB
- open-ai-test-svg-balls.md - ./osr-ai/open-ai-test-svg-balls.md - file - text/markdown | Size : 211 B
- open-ai-test-svg-bolts.md - ./osr-ai/open-ai-test-svg-bolts.md - file - text/markdown | Size : 553 B
- open-ai-test-svg-solarsystem.md - ./osr-ai/open-ai-test-svg-solarsystem.md - file - text/markdown | Size : 590 B
- open-ai-test.md - ./osr-ai/open-ai-test.md - file - text/markdown | Size : 1.6 kB
- open-ai-test.out.md - ./osr-ai/open-ai-test.out.md - file - text/markdown | Size : 25.3 kB
- sal-test.md - ./sal-test.md - file - text/markdown | Size : 52 B
- test.md - ./sub/test.md - file - text/markdown | Size : 0 B
- source.md - ./templates/source.md - file - text/markdown | Size : 42 B
- template.md - ./templates/template.md - file - text/markdown | Size : 31 B
- test.in.md - ./test.in.md - file - text/markdown | Size : 2.0 kB

## Directory listing using simple glob (relative)

- sal-test.md
- test.in.md

## Directory listing using built in glob (absolute)

- config.js
- constants.js
- debug.js
- Engine.js
- Gruntfile.js
- index.js
- lib.js
- library.js
- main.js
- options.js
- types.js
- _cli.js
## Embedded SVG from file

<div style="max-width:80%">

</div>

## Embedded XLSX from file

```js
const _path = path.resolve('./content.xlsx');
const data = xlsx.parse(_path);
return markdownTable(data[0].data);
```

| Product - Data | Website        | Library        | Shop           | Forum          | Wiki           |
| -------------- | -------------- | -------------- | -------------- | -------------- | -------------- |
| Authors        | x              | x              | x              | x              | x              |
| Gallery        | oscript-widget | oscript-widget | oscript-widget | oscript-widget | oscript-widget |

Where the JSON data looks as follows:

```js
const data = xlsx.parse(path.resolve('./content.xlsx'));
return JSON.stringify(data,null,2);
```

```json
[
  {
    "name": "Sheet1",
    "data": [
      [
        "Product - Data",
        "Website",
        "Library",
        "Shop",
        "Forum",
        "Wiki"
      ],
      [
        "Authors",
        "x",
        "x",
        "x",
        "x",
        "x"
      ],
      [
        "Gallery",
        "oscript-widget",
        "oscript-widget",
        "oscript-widget",
        "oscript-widget",
        "oscript-widget"
      ]
    ]
  }
]
```