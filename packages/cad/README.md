# OSR CAD Tools

This is a CLI(CommandLineInterface) toolset to convert 3D files, using Solidworks and other software.

## Requirements

1. [Node-JS](https://nodejs.org/en/download/)
2. Optional: install [Git](https://git-scm.com/downloads) (Make sure you enable Linux tools on Windows console)
3. Solidworks 2020. In case you are using another version, please find on your disc 'SolidWorks.Interop.sldworks.dll' and replace the one in [./sw/2022](https://git.osr-plastic.org/osr-plastic/osr-cad/src/branch/master/sw/2022)

## Installation

```sh

git clone https://git.osr-plastic.org/osr-plastic/osr-cad.git
cd osr-convert-cad
npm i

# or globally (recommended)

npm i @plastichub/osr-cad -g

```

## Usage

Open a terminal and run this:

```sh
osr-cad --help
```

See more in [./docs/Examples.md](./docs/Examples.md) and [./docs/Integration.md](./docs/Integration.md)

### References - Development

- [site:Solidworks API basics - examples](https://www.codestack.net/labs/solidworks/)
- [site:Rhino-API](https://developer.rhino3d.com/api/RhinoCommon/html/R_Project_RhinoCommon.htm)
- [site:Solidworks Reverse Decoder](http://heybryan.org/solidworks_file_format.html)
- [sw interop - component - API ](https://help.solidworks.com/2019/English/api/swdocmgrapi/Get_Current_Name_of_Configuration_of_Suppressed_Component_Example_CSharp.htm)

## Todos

- [x] Select default views via CLI Argument
- [ ] Arg: Skip suppressed | hidden (difficult since it's out of part file scope, check explorer api ) | dry mode
- [x] Arg: Overwrite files
- [-] Arg: skip non OSR parts
- [-] Arg: displaymode : wireframe, shaded, ... (see [SW Docs](http://help.solidworks.com/2017/english/api/sldworksapi/solidworks.interop.sldworks~solidworks.interop.sldworks.iview~setdisplaymode3.html))
- [-] report
- [x] export as lib
- [-] Multi view (trainings data for @plastichub/part-detector)
- [-] Speed: use same instance for multiple exports
- [-] Context Menu Shell Extension (@osr-tools)
- [-] Local/Global config (=>osrl)
- [ ] emit/merge authors from components in target artefact
- [-] Add CLI Arg Path variables
  - [-] json-path for glob patterns
  - [-] bracket expansion
- [-] Report templates (=> @osrl | osr-reports)
  - [ ] xls
  - [ ] md
  - [ ] txt
  - [ ] json
  - [ ] meta | ts | tree
- [-] Plugin interface for custom format (chained) => osrl
- [x] Conversions
  - [x] STEP -> SLDPRT (via xcad->fc->fw)
  - [x] any -> 3dxml (osrl!)
  - [x] any -> html (via edrawings)
- [ ] Structural
  - [ ] support pipes, eg: intermediate formats
  - [-] add pre, post and content filters, as pipes
  - [-] plugins
  - [-] integrate osrl
  - [-] omit format options in --help
  - [ ] omit possible conversions in ```info``
    - [ ] per in and out args
    - [ ] global
  - [-] Cache hash fuckery : integrate options in integrity
    - [ ] external cache directory
  - [ ] bom|html|props : configurations
  - [ ] explicit cache directory

### Commands - Todos - Solidworks

- [x] Solidworks
  - [-] Set system wide options for JPG output
  - [-] Set system wide options for PDF output
- [-] Directory index (=>osrl)
  - [ ] arg: local HTML path/dir offset
  - [ ] arg: generate UNC paths
  - [ ] format: PDF
  - [-] arg: sw drawing/BOMs to CSV/xls
- [-] Part/Sub-Assembly web(&local) compilation/index (=>osrl)
- [-] Web directory ([xeokit](https://gitlab.com/plastichub/osr/xeokit-sdk))
- [-] Git hook, check components  & references
- [x] move 2D formats to osr-media
- [-] implement osr-cli-common specs: info/introspect|supported
- [x] root offset
- [x] sw:info|bom -> i18n
- [ ] remove toolbox write protection (sldsetdocprop.exe | https://www.youtube.com/watch?v=N7_HSvWPAXw | https://help.solidworks.com/2022/english/api/swdocmgrapi/SolidWorks.Interop.swdocumentmgr~SolidWorks.Interop.swdocumentmgr.ISwDMDocument~ToolboxPart.html)
- [-] sw: catch read errors
- [ ] sw: migrate xcad latest
- [ ] sw: addons - API (disable, ..)
- [-] sw: model-reader : iterator | filter | findup-references
- [-] sw: bom : filter & map
- [-] sw: set properties | save-as, ...
- [ ] sw: osr-log
- [ ] sw: sub commands: convert | validate | pack | set | get | clean | render | tree (cp/mv/rm) | unlink
  - [x] get: configurations -> json
  - [x] convert(conf) -> model
  - [x] render(conf) -> image
  - [ ] validate
    - [-] internal files
    - [ ] outside root / component
    - [ ] naming conventions
    - [ ] default configurations
    - [ ] sw errors
    - [ ] library compat
    - [ ] orphan files
    - [ ] equations
  - [ ] tree
    - [ ] md
    - [x] json
    - [ ] fs
    - [-] xls
      - [ ] osr-i8n
    - [ ] walker -> piped
  - [ ] orphans (incl. assets / maps)
- [x] sw: render : renderers (+options)
- [x] sw: render
  - [-] scene defaults
  - [ ] motion analysis
  - [x] query(tree)
- [ ] sw: explode
- [-] sw: timeouts
- [x] sw: osr-default props
- [-] sw: cache instance (node IPC | csharp JIT?)
- [x] sw: cache
  - [x] meta: diff
  - [ ] invalidate
  - [-] mv
  - [ ] pack / unpack
- [ ] versioning
- [ ] packages
- [ ] registry
- [ ] shared equations (design table alternative) -> osrl | equation templates
- [ ] sketch / block templates

### Commands - Todos - SCad

- [ ] impl. basic verbs: convert (see https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Using_OpenSCAD_in_a_command_line_environment)

### Lib - Todos

- [-] SW: 4 view single image
- [-] Incorrect JPG output with sw2020

### Utils

- [Batch Export to HTML via EDrawings OCX](ref/edrawings-api/BatchExportHTML)

- For SOLIDWORKS Document Manager API, please check the intro [here](https://www.codestack.net/solidworks-document-manager-api/) which leads to [https://xcad.xarial.com/]. Their actual API code is now at [./ref/xcad](./ref/xcad). Please check also [xcad basics on YouTube](https://www.youtube.com/watch?v=dLjlTYYeMpo)

### Resources - Solidworks

- [Custom Properties Write API](https://help.solidworks.com/2017/english/api/sldworksapi/change_configuration_properties_example_vb.htm)
- [XCad Github](https://github.com/xarial/xcad.git)
- [SOLIDWORKS](https://www.linkedin.com/company/solidworks?trk=public_post_share-update_update-text) 
- [SW Model Error Ref](https://help.solidworks.com/2019/english/api/swconst/SO_Messages.htm)
- API Help Files [https://lnkd.in/d9QX6wvS](https://lnkd.in/d9QX6wvS?trk=public_post_share-update_update-text) 
- Free API Books, Macros and Utilities by [Luke Malpass](https://uk.linkedin.com/in/angelsix?trk=public_post_share-update_update-text) - [https://lnkd.in/d8EbSDiB](https://lnkd.in/d8EbSDiB?trk=public_post_share-update_update-text) 
- Video Tutorials (first few lessons are free and rest are paid) by [SolidProfessor](https://www.linkedin.com/company/solidprofessor?trk=public_post_share-update_update-text) 
- [https://lnkd.in/d6bJew-z](https://lnkd.in/d6bJew-z?trk=public_post_share-update_update-text) 
- [https://lnkd.in/dAv2366P](https://lnkd.in/dAv2366P?trk=public_post_share-update_update-text) 
- [Artem Taturevych](https://au.linkedin.com/in/artem-taturevych?trk=public_post_share-update_update-text)’s free SOLIDWORKS Goodies 
- [http://www.codestack.net](http://www.codestack.net/?trk=public_post_share-update_update-text)/ 
- [Lenny Kikstra](https://www.linkedin.com/in/lennyworks?trk=public_post_share-update_update-text) 
- free SOLIDWORKS Goodies [https://lnkd.in/d6RJfCuZ](https://lnkd.in/d6RJfCuZ?trk=public_post_share-update_update-text) 
- [Roland Schwarz](https://www.linkedin.com/in/rolandschwarz?trk=public_post_share-update_update-text) 
- free SOLIDWORKS Goodies [https://lnkd.in/dSiq6r6h](https://lnkd.in/dSiq6r6h?trk=public_post_share-update_update-text)  
- Video Tutorials (free and paid with macros library) by [Keith Rice](https://www.linkedin.com/in/keitharice?trk=public_post_share-update_update-text) 
- [https://www.cadsharp.com](https://www.cadsharp.com/?trk=public_post_share-update_update-text) 
- MySolidWorks Video Training (paid) [https://lnkd.in/dpXnNBsy](https://lnkd.in/dpXnNBsy?trk=public_post_share-update_update-text) 
- SOLIDWORKS Free Macros at Cadforum: [https://lnkd.in/d4W63jBX](https://lnkd.in/d4W63jBX?trk=public_post_share-update_update-text) 
- SOLIDWORKS Free Macros at 3D Content Central: [https://lnkd.in/d4zVEfhh](https://lnkd.in/d4zVEfhh?trk=public_post_share-update_update-text) • SOLIDWORKS Customization eBook using VB.Net (paid) by [Tushar Suradkar](https://in.linkedin.com/in/tusharsuradkar?trk=public_post_share-update_update-text) 
- [https://lnkd.in/dD_sn3ai](https://lnkd.in/dD_sn3ai?trk=public_post_share-update_update-text) 
- [Mike Spens](https://www.linkedin.com/in/mikespens?trk=public_post_share-update_update-text) 
- API resources [http://www.solidapi.com](http://www.solidapi.com/?trk=public_post_share-update_update-text)/ and book (paid) by him "Automating SOLIDWORKS Using Macros" ([https://amzn.to/3nWOmYn](https://amzn.to/3nWOmYn?trk=public_post_share-update_update-text)) 
- Stefan Berlitz's free SOLIDWORKS Goodies [https://lnkd.in/dMCmnX6h](https://lnkd.in/dMCmnX6h?trk=public_post_share-update_update-text) 
- SOLIDWORKS users on active subscription also have access to two API SolidPractices available from [https://lnkd.in/d9VD3f5A](https://lnkd.in/d9VD3f5A?trk=public_post_share-update_update-text) 
- Free SOLIDWORKS API [VBA + C#] Tutorials from [Prashant Baher](https://in.linkedin.com/in/prashantbaher?trk=public_post_share-update_update-text) [https://thecadcoder.com](https://thecadcoder.com/?trk=public_post_share-update_update-text)/ 
- Video Tutorials by [GoEngineer](https://www.linkedin.com/company/goengineer?trk=public_post_share-update_update-text) [https://lnkd.in/gfBKmeU4](https://lnkd.in/gfBKmeU4?trk=public_post_share-update_update-text) 
- SOLIDWORKS forums to ask/find great solutions/macros 3DSwym SOLIDWORKS User Forum: [https://lnkd.in/dFG_isCJ](https://lnkd.in/dFG_isCJ?trk=public_post_share-update_update-text) 
- Eng-Tips: [https://lnkd.in/dgspDQ-H](https://lnkd.in/dgspDQ-H?trk=public_post_share-update_update-text) 
- CadOverFlow: [https://lnkd.in/d3bFWXUb](https://lnkd.in/d3bFWXUb?trk=public_post_share-update_update-text)

### XEO

- https://github.com/xeokit/xeokit-convert

### Free - CAD

- https://forum.freecadweb.org/viewtopic.php?p=556013#p556013
- https://hub.docker.com/r/amrit3701/freecad-cli
- https://wiki.opensourceecology.org/wiki/FreeCAD_BOM_Generator

### GEO

- https://macwright.com/2023/11/13/placemark

### Exce Build Dependencies for 'nexe'

- [NASM](https://www.nasm.us/pub/nasm/releasebuilds/2.16rc12/win64/)
