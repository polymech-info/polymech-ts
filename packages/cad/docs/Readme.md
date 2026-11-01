# PolyMech CAD Tools

![PolyMech CAD Tools](./hero.png)

**Automate your SolidWorks workflow from the command line.** Batch-convert assemblies, parts, and drawings to STEP, PDF, HTML, XLSX, and more — no GUI clicking required.

---

## Why pm-cad?

| Pain point | pm-cad solution |
|---|---|
| Manual "Save As" for every file format | One command converts hundreds of files in parallel |
| No easy way to export BOMs | Generates XLSX bills of materials directly from assemblies |
| HTML previews require eDrawings seats | Batch-exports interactive HTML webviews via eDrawings API |
| Configuration variants are tedious | Iterates all configurations automatically with `${CONFIGURATION}` |
| Hard to integrate into build pipelines | Works as a CLI, Node.js library, or Grunt task |

## Quick Start

```sh
# Install globally
npm i @polymech/cad -g

# Convert an assembly to STEP + PDF
pm-cad sw --src="./cad/Global*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.+(step|pdf)"

# See all options
pm-cad --help
```

## Installation

### Via npm (recommended)

```sh
npm i @polymech/cad -g
```

### Windows Installer

Download and run `PolyMechCAD-Setup.exe`. The installer auto-detects privileges:

- **Double-click** → installs per-user to `%LOCALAPPDATA%`, no admin required
- **Right-click → Run as administrator** → installs system-wide to `Program Files`

Both modes add `pm-cad` to your PATH automatically.

## What It Does

### Format Conversions

Convert between any supported format using glob patterns:

```sh
# Assembly → STEP
pm-cad sw --src="./cad/**/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.step"

# Parts + Assemblies → PDF + JPG (recursive)
pm-cad sw --src="./cad/**/*.+(SLDASM|SLDPRT)" --dst="${SRC_DIR}/${SRC_NAME}.+(pdf|jpg)"

# Assembly → Interactive HTML webview (via eDrawings)
pm-cad sw --src="./cad/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.html"

# Draw.io diagrams → PNG
pm-cad sw --src="./docs/**/*.drawio" --dst="${SRC_DIR}/${SRC_NAME}.png"
```

### Bill of Materials (BOM)

Extract structured BOMs directly from assemblies:

```sh
pm-cad sw --src="./cad/**/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.xlsx"
```

### Metadata & Configuration Export

```sh
# Custom properties → JSON
pm-cad sw --src="./cad/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.json"

# All configurations → JSON
pm-cad sw --src="./cad/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}-configs.json"

# Per-configuration STEP + HTML export
pm-cad sw --src="./cad/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}-${CONFIGURATION}.+(step|html)"
```

### Pack & Go

Flatten an assembly and all its references into a single folder:

```sh
pm-cad pack --src="./cad/Global*.SLDASM" --dst="./packed"
```

## Path Variables

Build dynamic output paths using built-in variables:

| Variable | Description |
|---|---|
| `${SRC_DIR}` | Directory of the current source file |
| `${SRC_NAME}` | Base name without extension |
| `${SRC_FILE_EXT}` | Source file extension |
| `${CONFIGURATION}` | Current model configuration name |

## Glob Pattern Syntax

| Pattern | Matches |
|---|---|
| `*.SLDASM` | All assemblies in current directory |
| `**/*.SLDPRT` | All parts, recursively |
| `*.+(SLDASM\|SLDPRT)` | Assemblies and parts |
| `*.+(step\|pdf\|jpg)` | Multiple output formats |

## Integration

### File Manager (Altap Salamander)

Register `pm-cad` as a custom menu command (F9) for right-click conversions:

```
Command:    pm-cad
Arguments:  sw --src="$(FullName)" --dst="&{SRC_DIR}/&{SRC_NAME}.+(step)"
```

> Use `--alt=true` to switch variable prefix from `$` to `&` when the host app uses `$` for its own variables.

### Batch Droplets

Create a `.bat` file and drag-and-drop files onto it:

```batch
@echo off
pm-cad sw --src="%~1" --dst="${SRC_DIR}/${SRC_NAME}.+(html)"
```

For folders:

```batch
@echo off
pm-cad sw --src="%~1/**/*.+(SLDASM|SLDPRT)" --dst="${SRC_DIR}/${SRC_NAME}.+(html)"
```

### Node.js Library

```js
import { convert } from '@polymech/cad/cad/sw-lib';

await convert({
  src: './cad/**/*.SLDASM',
  dst: '${SRC_DIR}/${SRC_NAME}.+(step|pdf)',
  verbose: true,
  skip: true
});
```

### Grunt Task

```js
const cad = require('@polymech/cad/cad/sw-lib');

grunt.registerMultiTask('cad-convert', 'Convert SW files', function () {
  const done = this.async();
  convert(this.data.items, { ...options }, this.data.output)
    .then(() => done());
});
```

```js
// Gruntfile config
'cad-convert': {
  step: { items: products, output: '${SRC_DIR}/${SRC_NAME}.+(step)' },
  html: { items: products, output: '${SRC_DIR}/../resources/${SRC_NAME}.+(html)' },
  bom:  { items: products, output: '${SRC_DIR}/../resources/${SRC_NAME}.+(xlsx)' }
}
```

## Supported Formats

### Input

| Format | Extension |
|---|---|
| SolidWorks Assembly | `.SLDASM` |
| SolidWorks Part | `.SLDPRT` |
| SolidWorks Drawing | `.SLDDRW` |
| STEP | `.step`, `.stp` |

### Output

| Format | Extension | Source | Engine |
|---|---|---|---|
| STEP | `.step` | Parts, Assemblies | `convert.exe` |
| PDF | `.pdf` | Parts, Assemblies, Drawings | `convert.exe` |
| JPEG | `.jpg` | Parts, Assemblies, Drawings | `convert.exe` |
| HTML (eDrawings) | `.html` | Parts, Assemblies | `ExportHTML.exe` |
| JSON (metadata) | `.json` | Assemblies | `model-reader.exe` |
| JSON (configs) | `-configs.json` | Assemblies | `getconfigs.exe` |
| Excel BOM | `.xlsx` | Assemblies | `bom.exe` |


## Native Toolchain

Under the hood, `pm-cad` orchestrates a set of C# binaries that talk directly to SolidWorks via COM interop ([xCAD](https://xcad.xarial.com/) + SolidWorks Interop) and eDrawings API.

| Binary | Role |
|---|---|
| `convert.exe` | Opens models via COM, calls `SaveAs` for STEP/PDF/JPG. PhotoView 360 ray-trace rendering with configurable quality, resolution, and camera view. Pack & Go support for assembly flattening. |
| `model-reader.exe` | Traverses the full assembly tree and extracts per-component data — see **Extracted Data** below. Outputs a flat properties table + a hierarchical `.tree.json`. |
| `bom.exe` | Inserts a BOM table annotation into the assembly via xCAD, then calls `SaveAsExcel` to produce XLSX output. Supports custom BOM templates, type (PartsOnly / TopLevel / Indented), detail level, and optional component images. |
| `ExportHTML.exe` | Headless eDrawings API export — opens a hidden WinForms host, loads the model, and saves interactive HTML. No SolidWorks license required (eDrawings is free). |
| `getconfigs.exe` | Enumerates all configurations in a model and serializes their names + properties to JSON. |

### Extracted Data (model-reader)

For each component in the assembly tree, the following data is extracted:

| Category | Fields |
|---|---|
| **Custom Properties** | All configuration-specific + global custom properties (evaluated values) |
| **Mass Properties** | Mass, Density, Volume, Surface Area, Center of Mass (X/Y/Z) |
| **Materials** | Material name + database per part |
| **Bounding Box** | Min/Max X/Y/Z per component |
| **Equations** | All equation names and evaluated values |
| **Model States** | What's Wrong count, error codes, warning flags, affected feature types |
| **Suppression** | Component suppression state |

## CLI Options Reference

### Rendering

| Flag | Default | Description |
|---|---|---|
| `--renderer` | `solidworks` | Render engine (`solidworks` or `photoview`) |
| `--quality` | `2` (Good) | Ray trace quality level |
| `--width` | `1024` | Output image width in pixels |
| `--height` | `1024` | Output image height in pixels |
| `--view` | `Render` | Camera view name |
| `--configuration` | `Default` | Model configuration to use |

### BOM Options

| Flag | Default | Description |
|---|---|---|
| `--bom-config` | `Default` | BOM configuration |
| `--bom-type` | `2` | BOM type |
| `--bom-detail` | `1` | Detail level |
| `--bom-template` | — | Custom BOM table template |
| `--bom-images` | `false` | Include component images |

### Workflow

| Flag | Description |
|---|---|
| `--dry` | Preview operations without executing |
| `--cache` | Use file hash caching to skip unchanged files |
| `--save` | Save the model after processing |
| `--rebuild` | Force model rebuild before export |
| `--pack` | Pack and go mode |
| `--light` | Lightweight mode |
| `--close` | Close SolidWorks after each conversion |
| `--alt` | Use `&` instead of `$` for variable prefix |
| `--logLevel` | Minimum log level (`debug`, `info`, `warn`, `error`) |

## Requirements

- **Node.js** 18+
- **SolidWorks** 2020–2025 (auto-detected)
- **Windows** (SolidWorks COM interop)

## License

ISC — [PlasticHub](https://git.polymech.info/mono/cad)
