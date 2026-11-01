Dim swApp As SldWorks.SldWork
Dim testViz As IVisualizeAddin
    Dim visualizeAddinMgr As IVisualizeAddinManager

    Sub main()

    ' Get the Visualize add-in object

    Set swApp = Application.SldWorks
    Set testViz = swApp.GetAddInObject("SolidWorks.Visualize.Implementation.VisualizeAddin")
    Set visualizeAddinMgr = testViz.GetAddinManager
   
    ' Set render options as needed

    Set vizRenderOptions = visualizeAddinMgr.RenderOptions
    vizRenderOptions.ImageFormat = ImageFormat_e.JPEG
        vizRenderOptions.FrameCount = 1000
        vizRenderOptions.Width = 800
        vizRenderOptions.Height = 800
        vizRenderOptions.JobName = "Toaster"
        vizRenderOptions.OutputFolder = "E:\SOLIDWORKS Visualize Content\Images"
        vizRenderOptions.DenoiserEnabled = False

        ' Render the model

        Call visualizeAddinMgr.Render
