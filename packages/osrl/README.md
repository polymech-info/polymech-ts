# Content & Expression Engine based on Liquid (JS Implementation)

## Installation

```sh
# local
npm install @plastichub/osrl

#global 
npm -g @plastichub/osrl

# CLI help
osrl compile --help

```

### References

- [LiquidJS Docs](https://liquidjs.com/api/classes/liquid_.liquid.html)
- [Liquid Docs - Shopify](https://shopify.github.io/liquid/)

### Usage

Please find examples in ['./examples](./examples)

## Todos

- [ ] Filter/Tags
  - [x] Datasources
    - [x] Google Sheet
    - [x] Local Sheet
      - see [exceljs](https://github.com/exceljs/exceljs)
    - [x] CSV
    - [x] selectors
  - [ ] Iterators (scopes)
  - [ ] Enums
  - [ ] CSS Parser
- [ ] Files / Refs / Variables
- [ ] PDF tables, see [site:tabula](https://github.com/tabulapdf/tabula)
- [ ] JS
  - [x] Bind Datasources in local scope
  - [x] Default bootstrap
    - [x] Plastichub
    - [-] OSR
    - [x] Default functions: unit conv, string manipulation
- [x] User Plugins
- [x] Refine Engine for scoping
- [ ] RT Security
  - Options
    - [Secure VM (native)](https://github.com/laverdet/isolated-vm)
    - [VM2](https://github.com/patriksimek/vm2#debugging-a-sandboxed-code)
    - [ ] fix fucking globals
    - [ ] run plugins in cached vm.Script contexts
- [-] Multi Env
  - [x] support multi env in profiles
- [x] Settings / Profile
  - [-] should read local profil per consumed directory within ```include``` calls
- [-] Instrumentation
  - add support for clinic.js | clinic.doctor
- [ ] Platform / Services
  - [x] Discourse - API (related, category feed, custom search, topic acc)
  - [-] Magento - API (related, components, configurations, options)
  - [-] Media Wiki
  - [-] CSCart API
- [ ] Documentation
  - [ ] Auto - JS Bootstrap docs
  - [ ] Generate documented tests
  - [ ] Watcher
- [x] OSRL commons (plugins)
- [x] Partials cache
  - [x] osr-cache
- [-] VFS & RQL
- [-] OSR-Search
  - [-] consume/provide elastic-search queries
  - [ ] PDF mining : https://pypi.org/project/pdfminer/
  - [x] basics
- [x] new include tag 'emerge' based on the original 'include'
  - [x] context/implicit: evaluate conditional statement as variable
  - [-] implicit: forward output format (New: AST/partials), gives format agnostic results
  - [-] explicit: cache expiration (=>osr-tasks)
  - [ ] track i/o access in context meta db
  - [ ] i/o: re-impl. old vfs/service API
- [-] output masking via profile json(-get) paths
- [-] support pandoc for input/output pre/post processing
- [x] OSR-i18n
  - [x] tags
  - [ ] typings
    - [ ] partials => store
- [ ] OSR-AI
  - [x] prompt tags
- [ ] Doxygen
- [ ] Binaries
- [ ] Pipes
- [ ] Watcher
  - [ ] watch glob
- [ ] Targets
- [ ] Logging
- [ ] Typescript

## References

- https://docs.asciidoctor.org/
- https://github.com/asciidoctor/asciidoctor.js
- [MDAST & Co](https://github.com/syntax-tree/mdast-util-to-markdown)
- https://www.npmjs.com/package/link-preview-js
- https://github.com/microlinkhq/metascraper
- https://github.com/arcetros/scrape-recipe-schema/blob/main/src/index.ts
- https://github.com/digitalbazaar/jsonld.js
