# i18n related library and CLI for OSR content

Currently translates Markdown directories using [DeepL](deepl.com) API.

## Installation

1. Install from NPM
```sh
  npm i -g @polymech/pm-i18n
```
2. Define an environment variable on your system `OSR-CONFIG` which holds the path to a json file, eg: `C:\Users\nobody-likeyou\.osr\config.json` with the following content (see [./docs/config.json](./docs/config.json) example): 

```json
{
  "deepl": {
    "comment": "Please get a key on deepl.com ! ",
    "auth_key": "34dbf59f-adeb-1959-d906-502e0ec6afb7",
    "free_api": false
  }
}
```

You can verify the config by ```pm-i18n info```

## Commands

### `info`

**Brief**: outputs configuration and supported language keys

```js
  pm-i18n info
```

### `translate`

#### Simple

```sh

pm-i18n translate --text="Na Du Schnecke" --sourceLang="DE" --targetLang="EN"

# or pipe into a file

pm-i18n translate --text="Na Du Schnecke" --sourceLang="DE" --targetLang="EN" > translations.json


```json
Translating Na Du Schnecke! Du schaust so traurig aus! to 
[
  {
    detected_source_language: 'DE',
    text: 'Well you snail! You look so sad!'
  }
]
```

### Using Glob patters

#### 1. Translate directory of files, simple

```sh

pm-i18n translate --src="./**/*.md" --sourceLang="DE" --targetLang="EN"

```

**Remarks:**

- this will translate all files in ```./**/*.md```, to ```./**/somefile.EN.md```

- when no ```--dst``` argument is specified, the output path is composed by adding the target language in the filename, eg: `my-info.md` becomes `my-info_de.md`

- please run `pm-i18n translate --help` for supported file types

#### 2. Translate directory of files, advanced

```sh

pm-i18n translate --src="./**/*.md" --dst='${SRC_DIR}/${SRC_NAME}.${DST_LANG}.+(md)' --sourceLang="DE" --targetLang="EN"

```

#### 2. Translate directory of files, advanced

```sh

pm-i18n translate --src="./**/*.md" --cwd='source directory' --dst='target directory' --sourceLang="DE" --targetLang="EN"

```

**Remarks:**

- sourceLang is not needed to be set explicit, DeepL will recognize
- please run `pm-i18n translate --help` for supported file types
- See more examples in [./tests/](./tests)
- Please see more integration examples in [./docs/Integration.md](./docs/Integration.md)

### Example : Create a glossary

```sh

pm-i18n glossary create --name="pp" --src="${OSR_ROOT}/commons/i18n/glossary/en/de/*.csv" --srcLang="EN" --dstLang="DE"

```

**Remarks:**

This creates a glossary file, given a CSV file, eg:

```csv
Plastic,Kunststoff
Shredder,Granulator
Mould,Spritzgussform
Precious – Plastic,Precious - Plastic
Sheetpress,Plattenpresse
Injection,Spritzgießmaschine
Injection Kits,Injection Kits 

```

It creates a meta file, adding '_glossary.json' to the source CSV file, with the content:

```json
{
  "glossaryId": "60c0b19b-27f0-45ab-a375-feaef2b85b92",
  "name": "pp",
  "ready": true,
  "sourceLang": "en",
  "targetLang": "de",
  "creationTime": "2023-02-18T17:25:37.800Z",
  "entryCount": 7
}
```

---

## Path variables

- **DST_LANG**: Destination language
- **SRC_LANG**: Destination language
- **CWD**: Current working directory, as specified on the CLI
- **SRC_REL**: Relative directory, from main source path to currently translated file

---

## Todos

- [x] Support [Glossaries](https://www.deepl.com/en/docs-api/glossaries)
- [x] Plugins: emoji fuckery removal, ignore filter/patterns
- [-] Imprint meta (osr-version, config)
- [x] XLS (osr-lib-data)
- [-] Google Sheets, direct
- [-] Google Speech API to produce audio files (see boilerplate in [./src/speech/google.ts](./src/speech/google.ts))
- [-] Audio (from osr-ai/chatgpt)
- [-] translate keys in `unitconv`
- [-] OSRL AST
- [x] JSON values, via JSON-get|path

## References

- [js-quantities](http://gentooboontoo.github.io/js-quantities/)
- [xl8 service - units](https://www.xl8.ai/products)
- [i18n units - blog](https://whpintl.com/blog/localization-measurement-units-dita/)

### LLMs

- [ChatGPT vs GoogleBard vs DeepL](https://www.youtube.com/watch?v=CoH7nzWFeQQ&ab_channel=Freelanceverse-AdrianProbst)
