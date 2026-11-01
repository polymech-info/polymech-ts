using System;
using System.IO;
using System.IO.Pipes;
using CommandLine;
using SolidWorks.Interop.sldworks;
using SolidWorks.Interop.swconst;

class Options
{
    [Option('s', "source", Required = true, HelpText = "Input file path")]
    public string InputFilePath { get; set; }

    [Option('t', "target", Required = true, HelpText = "Output file path")]
    public string OutputFilePath { get; set; }

    [Option('c', "configuration", Required = false, HelpText = "SolidWorks configuration name", Default = "Default")]
    public string configuration{ get; set; }

    [Option('p', "pipeName", Required = false, HelpText = "Named pipe name for IPC", Default = "osr-cad")]
    public string PipeName { get; set; }
    
    [Option('v', "view", Required = false, HelpText = "Solidworks view", Default = "*Render")]
    public string View{ get; set; } 

    [Option('h', "hidden", Required = false, HelpText = "Hide Solidworks window", Default = "true")]
    public string Hidden { get; set; }

    [Option('q', "quality", Required = false, HelpText = "Raytrace quality", Default = 0)]
    public string quality { get; set; }
    
    [Option('r', "renderer", Required = false, HelpText = "Renderer: photoview or solidworks", Default = 0)]
    public string renderer { get; set; }
    
    [Option('w', "width", Required = false, HelpText = "Width", Default = "1024")]
    public string width { get; set; }

    [Option('h', "height", Required = false, HelpText = "Height", Default = "1024")]
    public string height{ get; set; }

    [Option("swv", Required = false, HelpText = "Solidworks Version, 30=2022", Default = 32)]
    public int swv{ get; set; }

    [Option("write", Required = false, HelpText = "Open in write mode", Default = false)]
    public bool write { get; set; }

    [Option("rebuild", Required = false, HelpText = "Rebuild after opening", Default = false)]
    public bool rebuild { get; set; }

    [Option("light", Required = false, HelpText = "Open in Lightweight mode", Default = false)]
    public bool light{ get; set; }

    [Option("save", Required = false, HelpText = "Save part/assembly", Default = false)]
    public bool save { get; set; }

    [Option("pack", Required = false, HelpText = "Pack and Go Assembly", Default = false)]
    public bool pack { get; set; }

}

class Program
{
    static void Main(string[] args)
    {
        Parser.Default.ParseArguments<Options>(args)
            .WithParsed(options => Run(options))
            .WithNotParsed(errors => HandleParseErrors(errors));
    }

    static void Run(Options options)
    {
        try
        {            
            ISldWorks swApp = Activator.CreateInstance(Type.GetTypeFromProgID("SldWorks.Application")) as ISldWorks;
            if (swApp == null)
            {
                Console.WriteLine("<<Error::Failed to create SolidWorks Application instance.>>");
                return;
            }

            bool hidden = options.Hidden == "true";

            swApp.Visible = !hidden;
            IDocumentSpecification docSpec = swApp.GetOpenDocSpec(options.InputFilePath) as IDocumentSpecification;
            docSpec.ReadOnly = !options.write;
            docSpec.Silent = hidden;
            docSpec.LightWeight = options.light;
            
            IModelDoc2 swModel = swApp.OpenDoc7(docSpec);
            
            if (swModel == null)
            {
                Console.WriteLine($"<<Error::Failed to open the input file: {options.InputFilePath}>>");
                swApp.ExitApp();
                return;
            }
            try
            {
                if (options.View.Length > 0)
                {
                    swModel.ShowNamedView2(options.View, -1);
                    Console.WriteLine($"<<Info::Changed view: {options.View}>>");
                }
            }catch (Exception ex)
            {
                Console.WriteLine($"<<Warn::Failed to change view: {options.View}>>");
            }

            swModel.ViewZoomtofit2();
            int swViewDisplayHideAllTypes = 198;
            swModel.SetUserPreferenceToggle(swViewDisplayHideAllTypes, true);
            if (!swModel.ShowConfiguration2(options.configuration))
            {
                Console.WriteLine($"<<Warn::Failed to change configuration: {options.configuration}>>");
            }
            else
            {
                Console.WriteLine($"<<Info::Changed Configuration: {options.configuration}>>");
            }

            if (options.rebuild)
            {
                bool rebuildResult = swModel.ForceRebuild3(false);
                IModelDoc2 modelDoc = (IModelDoc2)swModel;
                IEquationMgr equationMgr = modelDoc.GetEquationMgr();
                if (!rebuildResult)
                {
                    Console.WriteLine("<<Error::Rebuilding {0}>>", options.InputFilePath);
                }
            }


            int err = -1;
            int warn = -1;
            const int swSaveAsCurrentVersion = 0;
            const int swSaveAsOptions_Silent = 1;

            bool ipcConnected = false;

            using (NamedPipeClientStream pipeClient = new NamedPipeClientStream(".", options.PipeName, PipeDirection.Out))
            {
                try
                {
                    pipeClient.Connect(1000);
                    StreamWriter writer = new StreamWriter(pipeClient);
                    writer.WriteLine("<<File::opened>>");
                    writer.Flush();
                    ipcConnected = true;
                }
                catch (TimeoutException)
                {
                    Console.WriteLine("<<Debug::IPC error:timeout>>");
                }
            }

            if (!options.pack && options.OutputFilePath.EndsWith(".jpg") && options.renderer == "photoview")
            {
                RayTraceRenderer swRayTraceRenderer;
                RayTraceRendererOptions swRayTraceRenderOptions;
                
                // Access PhotoView 360
                swRayTraceRenderer = (RayTraceRenderer)swApp.GetRayTraceRenderer((int)swRayTraceRenderType_e.swPhotoView);
                if (swRayTraceRenderer == null)
                {
                    int fileerror = swApp.LoadAddIn("PhotoView 360");
                    swRayTraceRenderer = (RayTraceRenderer)swApp.GetRayTraceRenderer((int)swRayTraceRenderType_e.swPhotoView);
                }

                // Get and set rendering options
                swRayTraceRenderOptions = swRayTraceRenderer.RayTraceRendererOptions;
                swRayTraceRenderOptions.IncludeAnnotationsInRendering = true;
                swRayTraceRenderOptions.DirectCaustics = false;
                swRayTraceRenderOptions.UseSolidWorksViewAspectRatio = false;
                
                // Get current rendering values
                /***
                Debug.Print("Current rendering values");
                Debug.Print("  Image height = " + swRayTraceRenderOptions.ImageHeight);
                Debug.Print("  Image width = " + swRayTraceRenderOptions.ImageWidth);
                Debug.Print("  Image format = " + swRayTraceRenderOptions.ImageFormat);
                Debug.Print("  Preview render quality = " + swRayTraceRenderOptions.PreviewRenderQuality);
                Debug.Print("  Final render quality = " + swRayTraceRenderOptions.FinalRenderQuality);
                Debug.Print("  Bloom enabled? " + swRayTraceRenderOptions.BloomEnabled);
                Debug.Print("  Bloom threshold = " + swRayTraceRenderOptions.BloomThreshold);
                Debug.Print("  Bloom radius = " + swRayTraceRenderOptions.BloomRadius);
                Debug.Print("  Contour/cartoon rendering enabled? " + swRayTraceRenderOptions.ContourCartoonRenderingEnabled);
                Debug.Print("  Render type = " + swRayTraceRenderOptions.RenderType);
                Debug.Print("  Shaded contour? " + swRayTraceRenderOptions.ShadedContour);
                Debug.Print("  Contour line thickness = " + swRayTraceRenderOptions.ContourLineThickness);
                Debug.Print("  Contour line color = " + swRayTraceRenderOptions.ContourLineColor);
                Debug.Print("  Use SOLIDWORKS view aspect ratio? " + swRayTraceRenderOptions.UseSolidWorksViewAspectRatio);
                Debug.Print("  Alpha output? " + swRayTraceRenderOptions.AlphaOutput);
                Debug.Print(" ");
                */
                // Change rendering values
                swRayTraceRenderOptions.ImageWidth = int.Parse(options.width);
                swRayTraceRenderOptions.ImageHeight = int.Parse(options.height);                
                swRayTraceRenderOptions.ImageFormat = (int)swRayTraceRenderImageFormat_e.swImageFormat_JPEG;
                swRayTraceRenderOptions.PreviewRenderQuality = (int)swRayTraceRenderQuality_e.swRenderQuality_Good;
                swRayTraceRenderOptions.PreviewRenderQuality = int.Parse(options.quality);                
                swRayTraceRenderOptions.FinalRenderQuality = int.Parse(options.quality);
                swRayTraceRenderOptions.IncludeAnnotationsInRendering = true;


                Console.WriteLine(string.Format("<<Render width={0} | height={1} | quality={2}>>",options.width, options.height, options.quality));
if (!hidden)
                {
                    swRayTraceRenderer.InvokeFinalRender();
                }

                Console.WriteLine(string.Format("<<Info::Rendering '{0}' to '{1}'>>", options.InputFilePath, options.OutputFilePath));
                bool status = swRayTraceRenderer.RenderToFile(options.OutputFilePath, int.Parse(options.width), int.Parse(options.height));
                if (!status)
                {
                    Console.WriteLine(string.Format("<<Error::Failed to render '{0}' to '{1}'. Error code: {2}>>", options.InputFilePath, options.OutputFilePath));
                }
                else
                {
                    Console.WriteLine(string.Format("<<Info::Rendered '{0}' to '{1}'>>", options.InputFilePath, options.OutputFilePath));
                }
            }
            else
            {
                if (!options.pack && !swModel.Extension.SaveAs(options.OutputFilePath, swSaveAsCurrentVersion, swSaveAsOptions_Silent, null, ref err, ref warn))
                {
                    Console.WriteLine(string.Format("<<Error::Failed to export '{0}' to '{1}'. Error code: {2}>>", options.InputFilePath, options.OutputFilePath, err));
                }
            }

            if (!options.pack && options.save)
            {
                if (!swModel.Extension.SaveAs(options.InputFilePath, swSaveAsCurrentVersion,
                        swSaveAsOptions_Silent, null, ref err, ref warn))
                {
                    Console.WriteLine(string.Format("<<Error::Failed to Save '{0}' to '{1}'. Error code: {2}>>", options.InputFilePath, options.InputFilePath, err));
                }
            }

            if (options.pack)
            {
                ModelDocExtension swModelDocExt = default(ModelDocExtension);
                swModelDocExt = (ModelDocExtension)swModel.Extension;
                PackAndGo swPackAndGo = default(PackAndGo);
                var flatten = true;
                var toolbox = true;
                var drawings = true;
                var simulation = true;
                var suppressed = true;

                swPackAndGo = (PackAndGo)swModelDocExt.GetPackAndGo();
                swPackAndGo.IncludeDrawings = drawings;
                swPackAndGo.IncludeSimulationResults = simulation;
                swPackAndGo.IncludeToolboxComponents = toolbox;
                swPackAndGo.IncludeSuppressed = suppressed;

                bool status = false;
                int[] statuses = null;
                
                swPackAndGo.FlattenToSingleFolder = flatten;
                status = swPackAndGo.SetSaveToName(true, options.OutputFilePath);
                // swPackAndGo.AddPrefix = "SW_";
                // swPackAndGo.AddSuffix = "_PackAndGo";                
                // Get number of documents in assembly
                int namesCount = swPackAndGo.GetDocumentNamesCount();
                object pgFileStatus;
                object fileNames;
                object[] pgFileNames = new object[namesCount - 1];
                int i = 0;
                status = swPackAndGo.GetDocumentSaveToNames(out fileNames, out pgFileStatus);
                pgFileNames = (object[])fileNames;
                if ((pgFileNames != null))
                {
                    for (i = 0; i <= pgFileNames.GetUpperBound(0); i++)
                    {                        
                        string fileName = Path.GetFileName((string)pgFileNames[i]);
                        string newFilePath = Path.Combine(options.OutputFilePath, fileName);
                        pgFileNames[i] = newFilePath;
                    }
                }
                status = swPackAndGo.SetDocumentSaveToNames(pgFileNames);
                statuses = (int[])swModelDocExt.SavePackAndGo(swPackAndGo);
            }

            if (ipcConnected)
            {
                using (NamedPipeClientStream pipeClient = new NamedPipeClientStream(".", options.PipeName, PipeDirection.Out))
                {
                    try
                    {
                        pipeClient.Connect(1000);
                        StreamWriter writer = new StreamWriter(pipeClient);
                        writer.WriteLine("<<File:saved>>");
                        writer.Flush();
                    }
                    catch (TimeoutException)
                    {
                        Console.WriteLine("<<Debug::IPC error:timeout>>");
                    }
                }
            }
            Console.WriteLine($"<<Info::Conversion successful. Output file saved to: {options.OutputFilePath} >>");
            swApp.CloseAllDocuments(true);
            swApp.ExitApp();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"<<Error::An error occurred: {ex.Message}>>");
        }
    }

    static void HandleParseErrors(System.Collections.Generic.IEnumerable<Error> errors)
    {
        // Handle command-line parsing errors
        Console.WriteLine("Failed to parse command-line arguments.");
    }
}
