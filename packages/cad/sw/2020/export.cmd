SET inputFilePath=%1
SET outFilePath=%2
SET view=%3

PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0export.ps1" %inputFilePath% %outFilePath% %view%
