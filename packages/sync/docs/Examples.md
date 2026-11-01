### General usage

```sh
osr-sync sync --source=FOLDER --target=FOLDER
```

### Parameters


**source** : The source directory.

**target** : The target directory.

## Basics

### Convert all assembly files to PDF files in the current directory

```sh
osr-sync sync --source='../plastichub/products/elena/cad/*.SLDASM' --target='${SRC_NAME}.pdf'
```
### Convert all assembly files to PDF files in the source directory

```sh
osr-sync sync --source='../plastichub/products/elena/cad/*.SLDASM' --target='${SRC_DIR}/${SRC_NAME}.pdf'
```
