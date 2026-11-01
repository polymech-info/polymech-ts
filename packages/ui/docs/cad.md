# PolyMech CAD Tools (pm-cad)

**Automate your SolidWorks workflow from the command line.** PolyMech CAD Tools (aka **`pm-cad`**) is a Windows-first CLI and Node.js toolkit that **batch-converts SolidWorks assemblies, parts, and drawings** into downstream-friendly formats—**STEP, PDF, JPG, interactive HTML webviews, XLSX BOMs, and JSON metadata**—without repetitive GUI "Save As" clicks.

If you build products in SolidWorks and need **repeatable exports for manufacturing, quoting, documentation, release packages, or CI/CD**, `pm-cad` turns CAD deliverables into a scriptable, auditable pipeline.

> Keywords: SolidWorks CLI, batch convert SolidWorks, SolidWorks STEP export automation, SolidWorks BOM to Excel, eDrawings HTML export, CAD conversion tool, Pack and Go automation, Node.js CAD automation.

---

## Why pm-cad?

Engineering teams lose hours to manual export routines: opening models, switching configurations, rebuilding, exporting PDFs, STEP files, and BOMs—then doing it again after every change. `pm-cad` replaces all that with **one command** that can process **hundreds of files in parallel**, consistently.

| Pain point | pm-cad solution |
|---|---|
| Manual "Save As" for every file format | **One command** converts entire folders (glob patterns) into multiple outputs (e.g., `step|pdf|jpg`) |
| No easy way to export BOMs | Generates **XLSX bills of materials** directly from assemblies |
| HTML previews require eDrawings seats | Batch-exports **interactive HTML webviews** via the **eDrawings API** (eDrawings is free) |
| Configuration variants are tedious | Iterates **all configurations automatically** with `${CONFIGURATION}` |
| Hard to integrate into build pipelines | Use it as a **CLI**, **Node.js library**, or **Grunt task** |

---

## What you can do with PolyMech CAD Tools

### 1) Batch CAD conversion (SolidWorks → STEP/PDF/JPG)
Export manufacturing and documentation deliverables from **parts, assemblies, and drawings**:

- **STEP** for CAM, CNC, suppliers, and neutral exchange
- **PDF** for drawings, release packs, and approvals
- **JPG** for thumbnails, product pages, and catalogs

### 2) Interactive HTML webviews (via eDrawings)
Create **lightweight, shareable HTML previews** for assemblies and parts—ideal for:

- internal reviews
- sales/support handoffs
- web portals
- vendor communication

### 3) Excel BOM export (XLSX)
Generate structured **Bills of Materials in Excel** directly from assemblies, with support for:

- BOM type (Parts Only / Top Level / Indented)
- detail level
- BOM templates
- optional component images

### 4) Metadata & configuration export (JSON)
Extract rich assembly intelligence for PLM, QA, quoting, and analytics:

- custom properties (global + per-configuration)
- mass properties, materials, bounding boxes
- suppression state, equations, and more

### 5) Pack & Go (flatten references)
Collect an assembly and all referenced files into a clean folder for:

- supplier packages
- archiving
- controlled handoff
- reproducible builds

---

## Quick Start

```sh
# Install globally
npm i @polymech/cad -g

# Convert an assembly to STEP + PDF
pm-cad sw --src="./cad/Global*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.+(step|pdf)"

# See all options
pm-cad --help
```

---

## Installation

### Via npm (recommended)

```sh
npm i @polymech/cad -g
```

### Windows Installer

Download and run `PolyMechCAD-Setup.exe`. The installer auto-detects privileges:

- **Double-click** → installs per-user to `%LOCALAPPDATA%`, no admin required
- **Right-click → Run as administrator** → installs system-wide to `Program Files`

Both modes add `pm-cad` to your **PATH** automatically.

---

## Core features (in detail)

### Format conversions (glob patterns + multi-output)
Convert between supported formats using glob patterns and multi-extension outputs.

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

### Bill of Materials (BOM) → Excel (XLSX)
Extract structured BOMs directly from assemblies.

```sh
pm-cad sw --src="./cad/**/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.xlsx"
```

### Metadata & configuration export (JSON)
Turn SolidWorks models into data you can use in automation, dashboards, and audits.

```sh
# Custom properties → JSON
pm-cad sw --src="./cad/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}.json"

# All configurations → JSON
pm-cad sw --src="./cad/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}-configs.json"

# Per-configuration STEP + HTML export
pm-cad sw --src="./cad/*.SLDASM" --dst="${SRC_DIR}/${SRC_NAME}-${CONFIGURATION}.+(step|html)"
```

### Pack & Go (flatten assembly references)

```sh
pm-cad pack --src="./cad/Global*.SLDASM" --dst="./packed"
```

---

## Path variables (dynamic, repeatable output paths)

Build deterministic output paths using built-in variables:

| Variable | Description |
|---|---|
| `${SRC_DIR}` | Directory of the current source file |
| `${SRC_NAME}` | Base name without extension |
| `${SRC_FILE_EXT}` | Source file extension |
| `${CONFIGURATION}` | Current model configuration name |

This makes it easy to keep exports adjacent to sources, mirror folder structures, or produce configuration-specific deliverables.

---

## Glob pattern syntax

| Pattern | Matches |
|---|---|
| `*.SLDASM` | All assemblies in current directory |
| `**/*.SLDPRT` | All parts, recursively |
| `*.+(SLDASM\|SLDPRT)` | Assemblies and parts |
| `*.+(step\|pdf\|jpg)` | Multiple output formats |

---

## Integration options

### File manager integration (Altap Salamander)
Register `pm-cad` as a custom menu command (F9) for right-click conversions:

```
Command:    pm-cad
Arguments:  sw --src="$(FullName)" --dst="&{SRC_DIR}/&{SRC_NAME}.+(step)"
```

> Use `--alt=true` to switch variable prefix from `$` to `&` when the host app uses `$` for its own variables.

### Batch droplets (drag & drop)
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

### Node.js library (programmatic automation)

```js
import { convert } from '@polymech/cad/cad/sw-lib';

await convert({
  src: './cad/**/*.SLDASM',
  dst: '${SRC_DIR}/${SRC_NAME}.+(step|pdf)',
  verbose: true,
  skip: true
});
```

### Grunt task (build pipeline)

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

---

## Supported formats

### Input formats

| Format | Extension |
|---|---|
| SolidWorks Assembly | `.SLDASM` |
| SolidWorks Part | `.SLDPRT` |
| SolidWorks Drawing | `.SLDDRW` |
| STEP | `.step`, `.stp` |

### Output formats

| Format | Extension | Source | Engine |
|---|---|---|---|
| STEP | `.step` | Parts, Assemblies | `convert.exe` |
| PDF | `.pdf` | Parts, Assemblies, Drawings | `convert.exe` |
| JPEG | `.jpg` | Parts, Assemblies, Drawings | `convert.exe` |
| HTML (eDrawings) | `.html` | Parts, Assemblies | `ExportHTML.exe` |
| JSON (metadata) | `.json` | Assemblies | `model-reader.exe` |
| JSON (configs) | `-configs.json` | Assemblies | `getconfigs.exe` |
| Excel BOM | `.xlsx` | Assemblies | `bom.exe` |

---

## Native toolchain (how it works under the hood)

`pm-cad` orchestrates a high-performance native toolchain built in C# that talks directly to SolidWorks via **COM interop** (using [xCAD](https://xcad.xarial.com/) + SolidWorks Interop) and to eDrawings via the **eDrawings API**.

| Binary | Role |
|---|---|
| `convert.exe` | Opens models via COM and calls `SaveAs` for STEP/PDF/JPG. Supports PhotoView 360 ray-trace rendering with configurable quality, resolution, and camera view. Includes Pack & Go support for assembly flattening. |
| `model-reader.exe` | Traverses the full assembly tree and extracts per-component data. Outputs a flat properties table plus a hierarchical `.tree.json`. |
| `bom.exe` | Inserts a BOM table annotation via xCAD, then calls `SaveAsExcel` to produce XLSX output. Supports custom templates, BOM type (PartsOnly / TopLevel / Indented), detail level, and optional component images. |
| `ExportHTML.exe` | Headless eDrawings API export—opens a hidden WinForms host, loads the model, and saves interactive HTML. No SolidWorks license required (eDrawings is free). |
| `getconfigs.exe` | Enumerates all configurations in a model and serializes configuration names + properties to JSON. |

### Extracted data (model-reader)
For each component in the assembly tree, `model-reader.exe` can extract:

| Category | Fields |
|---|---|
| **Custom Properties** | All configuration-specific + global custom properties (evaluated values) |
| **Mass Properties** | Mass, Density, Volume, Surface Area, Center of Mass (X/Y/Z) |
| **Materials** | Material name + database per part |
| **Bounding Box** | Min/Max X/Y/Z per component |
| **Equations** | All equation names and evaluated values |
| **Model States** | What's Wrong count, error codes, warning flags, affected feature types |
| **Suppression** | Component suppression state |

---

## CLI options reference

### Rendering

| Flag | Default | Description |
|---|---|---|
| `--renderer` | `solidworks` | Render engine (`solidworks` or `photoview`) |
| `--quality` | `2` (Good) | Ray trace quality level |
| `--width` | `1024` | Output image width in pixels |
| `--height` | `1024` | Output image height in pixels |
| `--view` | `Render` | Camera view name |
| `--configuration` | `Default` | Model configuration to use |

### BOM options

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

---

## Requirements

- **Node.js** 18+
- **SolidWorks** 2020–2025 (auto-detected)
- **Windows** (SolidWorks COM interop)

---

## Who pm-cad is for (common use cases)

- **Manufacturing handoffs:** Export STEP + drawing PDFs for suppliers in one repeatable step.
- **Engineering release:** Generate a "release pack" folder with consistent naming and formats.
- **Sales/Support enablement:** Produce interactive **HTML previews** that anyone can open in a browser.
- **Automation & CI:** Create nightly exports (STEP/PDF/BOM) whenever CAD changes.
- **Data extraction:** Pull custom properties and mass/material data into JSON for quoting or audits.

---

## FAQ

### Does HTML export require a SolidWorks license?
No. HTML export is performed via the **eDrawings API**. eDrawings is free; `pm-cad` uses a headless host to export interactive HTML.

### Can I export all configurations automatically?
Yes. Use `${CONFIGURATION}` in the destination pattern and `pm-cad` will iterate configurations.

### Can I keep exports next to source files with matching names?
Yes. Use `${SRC_DIR}` and `${SRC_NAME}` for deterministic output paths.

### Is it safe to run on large assemblies?
`pm-cad` is designed for batch processing and supports workflow controls like caching (`--cache`), rebuild control (`--rebuild`), lightweight mode (`--light`), and closing SolidWorks between jobs (`--close`) depending on your stability/performance needs.

---

## Summary

**PolyMech CAD Tools** brings modern automation to SolidWorks deliverables: **batch exports**, **BOM to Excel**, **interactive HTML previews**, **metadata extraction**, and **Pack & Go**—all from a **scriptable CLI** or **Node.js API**. Standardize your exports, eliminate manual steps, and make CAD output a reliable part of your engineering pipeline.
