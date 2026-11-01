Example()

Func Example()

While 1
        ; Wait 10 seconds for the Run dialogue window to appear.
        ; WinWait("eDrawings","",10)
        ; Simulate entering notepad.exe and pressing the 'ENTER' key.
        ; Send("{Enter}")
        WinClose("eDrawings")
        Sleep(100)
WEnd
        ; Send("{TAB}{ENTER}")
EndFunc   ;==>Example