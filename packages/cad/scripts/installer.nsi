; ============================================================================
; PolyMech CAD Tools - NSIS Installer
; ============================================================================
; Build:  makensis scripts\installer.nsi   (run from packages/cad)
; Output: dist\PolyMechCAD-Setup.exe
; ============================================================================

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "WinMessages.nsh"

; ---------------------------------------------------------------------------
; Self-contained string helpers (replace StrFunc.nsh for portability)
; ---------------------------------------------------------------------------

; -- StrContains: check if SubString exists in String --
!macro _StrContainsConstructor un
	Function ${un}StrContains
		Exch $R1 ; SubString
		Exch 1
		Exch $R0 ; String
		Push $R2
		Push $R3
		Push $R4
		StrLen $R2 $R0
		StrLen $R3 $R1
		StrCpy $R4 0
		loop:
		IntCmp $R4 $R2 notfound 0 notfound
		StrCpy $R5 $R0 $R3 $R4
		StrCmp $R5 $R1 found
		IntOp $R4 $R4 + 1
		Goto loop
		found:
		StrCpy $R0 $R1
		Goto done
		notfound:
		StrCpy $R0 ""
		done:
		Pop $R4
		Pop $R3
		Pop $R2
		Pop $R1
		Exch $R0
	FunctionEnd
!macroend

!insertmacro _StrContainsConstructor ""

!macro StrContains ResultVar String SubString
	Push `${String}`
	Push `${SubString}`

	!ifdef __UNINSTALL__
		Call un.StrContains
	!else
		Call StrContains
	!endif

	Pop `${ResultVar}`
!macroend

; -- StrReplace: replace all occurrences of Old with New in String --
!macro _StrReplaceConstructor un
	Function ${un}StrReplace
		Exch $R2 ; New
		Exch 1
		Exch $R1 ; Old
		Exch 2
		Exch $R0 ; String
		Push $R3
		Push $R4
		Push $R5
		Push $R6
		Push $R7
		Push $R8
		Push $R9
		StrCpy $R3 0
		StrLen $R4 $R1
		StrLen $R6 $R0
		StrLen $R9 $R2
		loop:
		StrCpy $R5 $R0 $R4 $R3
		StrCmp $R5 $R1 found
		StrCmp $R3 $R6 done
		IntOp $R3 $R3 + 1
		Goto loop
		found:
		StrCpy $R5 $R0 $R3
		IntOp $R8 $R3 + $R4
		StrCpy $R7 $R0 "" $R8
		StrCpy $R0 "$R5$R2$R7"
		StrLen $R6 $R0
		IntOp $R3 $R3 + $R9
		Goto loop
		done:
		Pop $R9
		Pop $R8
		Pop $R7
		Pop $R6
		Pop $R5
		Pop $R4
		Pop $R3
		Push $R0
		Exch 3
		Pop $R1
		Pop $R0
		Pop $R2
	FunctionEnd
!macroend

!insertmacro _StrReplaceConstructor ""
!insertmacro _StrReplaceConstructor "un."

!macro StrReplace ResultVar String Old New
	Push `${String}`
	Push `${Old}`
	Push `${New}`

	!ifdef __UNINSTALL__
		Call un.StrReplace
	!else
		Call StrReplace
	!endif

	Pop `${ResultVar}`
!macroend

; ---------------------------------------------------------------------------
; Metadata
; ---------------------------------------------------------------------------
!define PRODUCT_NAME        "PolyMech CAD Tools"
!define PRODUCT_VERSION     "1.8.9"
!define PRODUCT_PUBLISHER   "PlasticHub"
!define PRODUCT_WEB_SITE    "https://git.polymech.info/mono/cad"
!define PRODUCT_EXE         "pm-cad.exe"
!define PRODUCT_UNINST_KEY  "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define ENV_KEY             "Environment"

; ---------------------------------------------------------------------------
; General – set base directory to packages/cad (parent of scripts/)
; ---------------------------------------------------------------------------
!cd ".."
Name        "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile     "dist\PolyMechCAD-Setup.exe"
InstallDir  ""  ; set dynamically in .onInit
RequestExecutionLevel user  ; no UAC; right-click "Run as admin" for all-users

; Runtime variable: "1" = all users (admin), "0" = current user
Var IsAdmin

; ---------------------------------------------------------------------------
; Modern UI pages
; ---------------------------------------------------------------------------
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ---------------------------------------------------------------------------
; .onInit – detect admin rights, set default install dir
; ---------------------------------------------------------------------------
Function .onInit
	UserInfo::GetAccountType
	Pop $0
	StrCmp $0 "Admin" 0 not_admin
		StrCpy $IsAdmin "1"
		StrCpy $INSTDIR "$PROGRAMFILES\${PRODUCT_NAME}"
		Goto init_done
	not_admin:
		StrCpy $IsAdmin "0"
		StrCpy $INSTDIR "$LOCALAPPDATA\${PRODUCT_NAME}"
	init_done:
FunctionEnd

; ---------------------------------------------------------------------------
; Install section
; ---------------------------------------------------------------------------
Section "Install"
	SetOutPath "$INSTDIR"

	; -- Main executable (from nexe build) --
	File "dist\win-64\${PRODUCT_EXE}"

	; -- sw directory (runtime dependencies) --
	; Exclude .NET build artifacts and source tool dirs
	SetOutPath "$INSTDIR\sw"
	File /r /x *.pdb /x *.deps.json /x *.runtimeconfig.dev.json /x tools "sw\*.*"

	; -- Uninstaller --
	SetOutPath "$INSTDIR"
	WriteUninstaller "$INSTDIR\Uninstall.exe"

	; -- Start Menu shortcuts --
	CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
	CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_EXE}" "--help"
	CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

	; -- Add/Remove Programs registry (HKLM for admin, HKCU for user) --
	StrCmp $IsAdmin "1" 0 reg_user
		WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName"     "${PRODUCT_NAME}"
		WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion"  "${PRODUCT_VERSION}"
		WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher"        "${PRODUCT_PUBLISHER}"
		WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout"     "${PRODUCT_WEB_SITE}"
		WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString"  "$INSTDIR\Uninstall.exe"
		WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "InstallLocation"  "$INSTDIR"
		WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoModify" 1
		WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoRepair" 1
		${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
		IntFmt $0 "0x%08X" $0
		WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" $0
		; Store install mode so uninstaller knows which hive to clean
		WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "InstallMode" "AllUsers"
		Goto reg_done
	reg_user:
		WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayName"     "${PRODUCT_NAME}"
		WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayVersion"  "${PRODUCT_VERSION}"
		WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "Publisher"        "${PRODUCT_PUBLISHER}"
		WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "URLInfoAbout"     "${PRODUCT_WEB_SITE}"
		WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "UninstallString"  "$INSTDIR\Uninstall.exe"
		WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "InstallLocation"  "$INSTDIR"
		WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoModify" 1
		WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoRepair" 1
		${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
		IntFmt $0 "0x%08X" $0
		WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "EstimatedSize" $0
		WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "InstallMode" "CurrentUser"
	reg_done:

	; -- Add to user PATH (always HKCU) --
	Call AddToPath

SectionEnd

; ---------------------------------------------------------------------------
; Uninstall section
; ---------------------------------------------------------------------------
Section "Uninstall"
	; -- Remove files --
	RMDir /r "$INSTDIR\sw"
	Delete   "$INSTDIR\${PRODUCT_EXE}"
	Delete   "$INSTDIR\Uninstall.exe"
	RMDir    "$INSTDIR"

	; -- Start Menu --
	Delete  "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
	Delete  "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk"
	RMDir   "$SMPROGRAMS\${PRODUCT_NAME}"

	; -- Registry: check which hive was used during install --
	ReadRegStr $0 HKLM "${PRODUCT_UNINST_KEY}" "InstallMode"
	StrCmp $0 "AllUsers" 0 unreg_user
		DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
		Goto unreg_done
	unreg_user:
		DeleteRegKey HKCU "${PRODUCT_UNINST_KEY}"
	unreg_done:

	; -- Remove from user PATH --
	Call un.RemoveFromPath

SectionEnd

; ---------------------------------------------------------------------------
; PATH helper functions (always user-space HKCU)
; ---------------------------------------------------------------------------
Function AddToPath
	ReadRegStr $0 HKCU "${ENV_KEY}" "Path"
	!insertmacro StrContains $1 "$0" "$INSTDIR"
	StrCmp $1 "" 0 already_in_path
	StrCpy $0 "$0;$INSTDIR"
	WriteRegExpandStr HKCU "${ENV_KEY}" "Path" "$0"
	SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
	already_in_path:
FunctionEnd

Function un.RemoveFromPath
	ReadRegStr $0 HKCU "${ENV_KEY}" "Path"
	; Try ";$INSTDIR" first (middle or end of PATH)
	!insertmacro StrReplace $1 "$0" ";$INSTDIR" ""
	StrCmp $1 "$0" 0 write_path
	; Try "$INSTDIR;" (beginning of PATH)
	!insertmacro StrReplace $1 "$0" "$INSTDIR;" ""
	StrCmp $1 "$0" 0 write_path
	; Try exact match (only entry in PATH)
	!insertmacro StrReplace $1 "$0" "$INSTDIR" ""
	StrCmp $1 "$0" done_path
	write_path:
	WriteRegExpandStr HKCU "${ENV_KEY}" "Path" "$1"
	SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000
	done_path:
FunctionEnd
