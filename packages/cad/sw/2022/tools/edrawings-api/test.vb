Imports System
Imports System.IO
Imports eDrawings.Interop.EModelViewControl
Imports eDrawings.Interop.EModelViewControl.EModelViewControl

Module Program
    Sub Main(args As String())
        If args.Length < 2 Then
            Console.WriteLine("Usage: AssemblyToHTMLConverter <sourceFilePath> <configuration>")
            Return
        End If

        Dim sourceFilePath As String = args(0)
        Dim configuration As String = args(1)

        If Not File.Exists(sourceFilePath) Then
            Console.WriteLine("Source file does not exist.")
            Return
        End If

        Dim control As EModelViewControl = New EModelViewControl()
        control.OpenDoc(sourceFilePath, False, False, False, "")
        control.SetConfiguration(configuration)

        Dim htmlFilePath As String = Path.ChangeExtension(sourceFilePath, ".html")
        control.SaveAs(htmlFilePath)

        Console.WriteLine("Assembly converted to HTML successfully.")
    End Sub
End Module
