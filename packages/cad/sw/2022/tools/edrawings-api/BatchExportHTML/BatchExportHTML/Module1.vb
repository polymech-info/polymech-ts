'**********************
'Batch export SOLIDWORKS files to PDF via eDrawings API (without SOLIDWORKS)
'Copyright(C) 2019 www.codestack.net
'License: https://github.com/codestack-net-dev/solidworks-api-examples/blob/master/LICENSE
'Product URL: https://www.codestack.net/edrawings-api/output/print-to-pdf/
'**********************

Imports System.Drawing.Printing
Imports System.IO
Imports System.Windows.Forms
Imports eDrawings.Interop
Imports eDrawings.Interop.EModelViewControl

Module Module1

    Dim m_Ctrl As EModelViewControl

    Dim m_Files As List(Of String)
    Dim m_OutDir As String
    Dim m_Configuration As String
    Dim m_winForm As Form

    Sub Main()

        Try
            ExtractInputParameters()
            Dim eDrwCtrl = New EDrawingsHost()
            AddHandler eDrwCtrl.ControlLoaded, AddressOf OnEdrawingsControlLoaded
            Dim winForm As Form = New Form
            winForm.Controls.Add(eDrwCtrl)
            eDrwCtrl.Dock = DockStyle.Fill
            winForm.ShowIcon = False
            winForm.ShowInTaskbar = False
            winForm.WindowState = FormWindowState.Minimized
            winForm.ShowDialog()
            m_winForm = winForm

        Catch ex As Exception
            PrintError(ex.Message)
        End Try

    End Sub

    Private Sub ExtractInputParameters()

        Dim args As String() = Environment.GetCommandLineArgs()
        Dim input As String = args(1)
        If File.Exists(input) Then
            m_Files = New List(Of String)()
            m_Files.Add(input)
        Else
            Throw New Exception("Specify input file or directory")
        End If

    End Sub

    Sub OnEdrawingsControlLoaded(ctrl As EModelViewControl)

        Console.WriteLine(String.Format("Starting job. Exporting {0} file(s)", m_Files.Count))
        m_Ctrl = ctrl
        AddHandler m_Ctrl.OnFinishedLoadingDocument, AddressOf OnDocumentLoaded
        AddHandler m_Ctrl.OnFailedLoadingDocument, AddressOf OnDocumentLoadFailed
        AddHandler m_Ctrl.OnFinishedSavingDocument, AddressOf OnDocumentSaved
        PrintNext()

    End Sub

    Sub OnDocumentSaved()
        Console.WriteLine(String.Format("Finished Saving"))
        PrintNext()
    End Sub

    Sub PrintNext()
        If m_Files.Any() Then
            Dim filePath As String
            filePath = m_Files.First()
            m_Files.RemoveAt(0)
            m_Ctrl.CloseActiveDoc("")
            m_Ctrl.OpenDoc(filePath, False, False, False, "")
        Else
            Console.WriteLine("Completed")
            Environment.Exit(0)
        End If

    End Sub

    Sub OnDocumentLoaded(fileName As String)
        Dim args As String() = Environment.GetCommandLineArgs()
        If args.Length > 3 Then
            Dim config As String = args(3)
            If config.Length Then
                Dim cCount As Integer = m_Ctrl.ConfigurationCount()
                For i As Integer = 0 To cCount
                    Dim cName = m_Ctrl.ConfigurationName(i)
                    If String.IsNullOrEmpty(cName) Then
                        Continue For
                    End If
                    If cName.Equals(config) Then
                        m_Ctrl.ShowConfiguration(i)
                    End If
                Next
            End If
        End If

        Console.WriteLine(String.Format("Opened {0}", fileName))
        Dim pdfFileName = Path.GetFileNameWithoutExtension(fileName) + ".html"
        Dim out As String = args(2)
        Dim output = Path.Combine(New FileInfo(fileName).Directory.FullName, Path.GetFileNameWithoutExtension(fileName) + ".html")
        Console.WriteLine(String.Format("Exporting {0} to {1}", fileName, out))
        m_Ctrl.Save(out, False, "")

    End Sub

    Sub OnDocumentLoadFailed(fileName As String, errorCode As Integer, errorString As String)
        PrintError(String.Format("Failed to load {0}: {1}", fileName, errorString))
        PrintNext()
    End Sub

    Sub OnDocumentPrinted(printJobName As String)
        Console.WriteLine(String.Format("'{0}' export completed", printJobName))
        PrintNext()
    End Sub

    Sub OnPrintFailed(printJobName As String)
        PrintError(String.Format("Failed to export '{0}'", printJobName))
        PrintNext()
    End Sub

    Sub PrintError(msg As String)
        'Console.ForegroundColor = ConsoleColor.Red
        System.Console.WriteLine(msg)
        Debug.WriteLine(msg)
        'Console.ResetColor()
    End Sub

End Module


