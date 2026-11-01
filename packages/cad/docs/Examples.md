### General usage

```sh
pm-cad sw --src=(FOLDER||FILE)/GLOB --dst=EXPRESSION||FILE||FOLDER/GLOB
```

### Parameters

**src** : The source directory or file. This can be a glob pattern.

**dst** : The source directory or file. This can be a glob pattern with expressions.

**configuration** : The model configuration

### Variables


**SRC_DIR** : The directory of the current file being converted

**SRC_NAME** : The file name of the current file being converted

**SRC_FILE_EXT** : The file extension of the current file being converted

## Basics

### Convert all assembly files to PDF files in the current directory

```sh
pm-cad sw --src='../plastichub/products/elena/cad/*.SLDASM' --dst='${SRC_NAME}.pdf'
```
### Convert all assembly files to PDF files in the source directory

```sh
pm-cad sw --src='../plastichub/products/elena/cad/*.SLDASM' --dst='${SRC_DIR}/${SRC_NAME}.pdf'
```

### Convert all assembly files to PDF files in the source directory, recursively

**Note** : Recursion can be added by using `**/`.

```sh
pm-cad sw --src='../plastichub/products/elena/cad/**/*.SLDASM' --dst='${SRC_DIR}/${SRC_NAME}.pdf'
```

### Convert all assembly and part files to PDF files in the source directory, recursively

**Note** : Recursion can be added by using `**/`.

**Note** : To select or use multiple file extensions, write ```*.+(SLDASM|SLDPRT)``` instead of ```*.SLDASM``` 

```sh
pm-cad sw --src='../plastichub/products/elena/cad/**/*.+(SLDASM|SLDPRT)' --dst='${SRC_DIR}/${SRC_NAME}.pdf'
```

### Convert all assembly and part files to PDF and JPG files in the source directory, recursively

**Note** : Recursion can be added by using `**/`.

**Note** : To select or use multiple file extensions, write ```*.+(SLDASM|SLDPRT)``` instead of ```*.SLDASM``` 

```sh
pm-cad sw --src='../plastichub/products/elena/cad/**/*.+(SLDASM|SLDPRT)' --dst='${SRC_DIR}/${SRC_NAME}.+(pdf|jpg)'
```

### Convert all assembly files to STEP and PDF files in the source directory

```sh
pm-cad sw --src='./products/asterix-pp/cad/*.+(SLDASM)' --dst='${SRC_DIR}/${SRC_NAME}.+(step|pdf)'
```

### Extra all custom properties and depending parts from assembly files to JSON files in the source directory

```sh
pm-cad sw --src='./products/asterix-pp/cad/*.+(SLDASM)' --dst='${SRC_DIR}/${SRC_NAME}.+(json)'
```

### Convert parts or assemblies to HTML files (all incl. view and data) - using eDrawings interop API

```sh
pm-cad sw --src='./products/asterix-pp/cad/*.+(SLDASM)' --dst='${SRC_DIR}/${SRC_NAME}.+(html)'
```

### Extract all configurations and their custom properties to a JSON file

**Note** : append the destination path with `-configs.json` ! It accepts only `SLDASM` as source!

```sh
pm-cad sw --src='./products/asterix-pp/cad/*.+(SLDASM)' --dst='${SRC_DIR}/${SRC_NAME}-configs.+(json)'
```

### Convert all assembly configurations to step & HTML

**Note** : append the destination path with `${CONFIGURATION}` to enumerate through all configurations ! It accepts only `SLDASM` as source!

```sh
pm-cad sw --src='./products/asterix-pp/cad/*.+(SLDASM)' --dst='${SRC_DIR}/${SRC_NAME}-${CONFIGURATION}.+(step|html)'
```

### Export drawio files to png, pdf or jpg

**Remarks**

- make sure that draw.io.exe is being found globally (add the path to Draw.io to your Environment path variable! )
- Draw.io can be downloaded here [https://github.com/jgraph/drawio-desktop/releases/tag/v14.6.13](https://github.com/jgraph/drawio-desktop/releases/tag/v14.6.13)
- to see more options, please run ```draw.io.exe --help```: (forward the arguments using ```--args='-t'```)

```bash
Usage: draw.io [options] [input file/folder]

Options:
  -V, --version                      output the version number
  -c, --create                       creates a new empty file if no file is
                                     passed
  -k, --check                        does not overwrite existing files
  -x, --export                       export the input file/folder based on the
                                     given options
  -r, --recursive                    for a folder input, recursively convert
                                     all files in sub-folders also
  -o, --output <output file/folder>  specify the output file/folder. If
                                     omitted, the input file name is used for
                                     output with the specified format as
                                     extension
  -f, --format <format>              if output file name extension is
                                     specified, this option is ignored (file
                                     type is determined from output extension,
                                     possible export formats are pdf, png, jpg,
                                     svg, vsdx, and xml) (default: "pdf")
  -q, --quality <quality>            output image quality for JPEG (default:
                                     90)
  -t, --transparent                  set transparent background for PNG
  -e, --embed-diagram                includes a copy of the diagram (for PNG
                                     format only)
  -b, --border <border>              sets the border width around the diagram
                                     (default: 0)
  -s, --scale <scale>                scales the diagram size
  --width <width>                    fits the generated image/pdf into the
                                     specified width, preserves aspect ratio.
  --height <height>                  fits the generated image/pdf into the
                                     specified height, preserves aspect ratio.
  --crop                             crops PDF to diagram size
  -a, --all-pages                    export all pages (for PDF format only)
  -p, --page-index <pageIndex>       selects a specific page, if not specified
                                     and the format is an image, the first page
                                     is selected
  -g, --page-range <from>..<to>      selects a page range (for PDF format only)
  -u, --uncompressed                 Uncompressed XML output (for XML format
                                     only)
  -h, --help                         display help for command
```

```sh
pm-cad sw --src='./products/extrusion/**/*.+(drawio)' --dst='${SRC_DIR}/${SRC_NAME}.+(png)'
```

### Create & export BOMs from assembly files

**Remarks**

- it's using by default pm-cad/sw/bom-all.sldbomtbt as table template
- run pm-cad --help to see the BOM options

```sh
pm-cad sw --src='./products/extrusion/**/*.+(SLDASM)' --dst='${SRC_DIR}/${SRC_NAME}.+(xlsx)'
```

### Pack Assembly (aka 'pack and go')

```sh
pm-cad pack --src=../../ph3/products/products/injection/elena/cad/Global*.SLDASM --dst="../test"
```
