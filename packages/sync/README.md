# Sync folders

## Installation

``` sh
npm install -g @plastichub/osr-sync
```

## Usage

### sync (folder)

``` sh
 osrc-sync --clear=true --source='./products/lydia-v4' --target='../plastic-hub-public/products/lydia-v4_test' --debug=true --profile='./osr-sync.json'
```

where `` `osr-sync.json` `` is

``` json
{
    "debug": false,
    "matching": [
        "*.json",
        "*.md",
        "*.yaml",
        "*.csv",
        "*.xls",
        "cad/**",
        "media/gallery/**",
        "resources/**",
        "drawings/**",
        "vendor/**",
        "resources/**",
        "laser/**",
        "howto/**",
        "renderings/**",
        "!./.git/**",
        "!./node_modules/**",
        "!./_MACOSX/**",
        "!./production/**",
        "!./templates/**",
        "!./.*/**",
        "!./**/*.zip",
        "!./**/*.tar"
    ]
}
```

#### Sync: Rename output nodes

Additionally, output paths can be manipulated specifying the --renamer argument:

``` sh
osr-sync --renamer="./.laser-renamer.js" --clear=true --source='./products/sheetpress-cell' --target='../../rosa/laser_sheetpress' --debug=true --profile="./.osr-sync-laser-sheetpress.json"
```

where ´osr-sync-laser-sheetpress.json´ is:

``` json
{
    "debug": false,
    "matching": [
        "laser/**"
    ]
}
```

and ´./.laser-renamer.js´ is :

``` js
exports.default = function (from, to) {
    return to.replace("Ferro", "Steel").replace("Inox", "Stainless");
}
```

Another example is to read command line arguments

``` js

function getQuantity() {
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i].indexOf('--quantity') !== -1) {
            return process.argv[i].split('=')[1];
        }
    }
}

exports.default = function (from, to) {
    const sets = getQuantity();
    const parts = to.split("_");
    const partsLength = parts.length;
    const qtyToken = parts[partsLength - 3];
    if (qtyToken) {
        let qty = parseInt(qtyToken.replace('x', '')) * sets;
        parts[partsLength - 3] = 'x' + qty;
        return parts.join('_');
    }
    return null;
}
```

In this case, the script renames SP1.0_001_Lower_Rib_1A_**x1**_6.0mm_Ferro.DXF to SP1.0_001_Lower_Rib_1A_**[CLI-Arg --quantity]**_6.0mm_Ferro.DXF
The feature is useful to strip custom filename syntax, or just batch rename stuff.

### Zip

Same as sync, a profile contains glob patterns for includes and excludes. Multiple sources can be hinged together at one root using the cwd argument

``` sh
node ./node_modules/osr-sync/dist/main.js zip --clear=true --source='./products/zoe' --source='./products/components/hal' --cwd="./" --target='../out.zip'  --debug=true --profile='./.osr-sync-zip.json'
```

or when used globally

``` sh
osr-sync zip --clear=true --source='./products/zoe' --source='./products/components/hal' --cwd="./" --target='../out.zip'  --debug=true --profile='./.osr-sync-zip.json'
```


### Todos

 - [-] CLI:Sync: Support component level firmware config patches (overlays)
 - [-] jekyll2mc
 - [-] pack'n go for laser vendor template/renamer (generate folders, by material and thickness)
 - [ ] Shell Extension (OS context menu)
 - [-] Sheets2*: URL, cell transform (using config)
 - [ ] Drive
 - [-] SW Configs => CAD = Laser => Report (@osr-cad & @osr-deploy)
 - [ ] Sync osr-template folder per dist (@osr-templates & @osr-deploy)
