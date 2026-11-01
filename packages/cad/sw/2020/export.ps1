$inputFilePath=$args[0]
$outFilePath=$args[1]
$view=$args[2]

$ScriptDir = Split-Path $script:MyInvocation.MyCommand.Path

$Assem = ( 
    $ScriptDir + "\SolidWorks.Interop.sldworks.dll"
    ) 
    
$Source = @"
using SolidWorks.Interop.sldworks;
using System;

 namespace CodeStack
 {
    public static class Exporter
    {
        #region Libraries
        
        static Exporter()
        {
            AppDomain.CurrentDomain.AssemblyResolve += OnAssemblyResolve;
        }

        public static void LoadLibrary(params object[] libs)
        {
            foreach(string lib in libs)
            {
                Console.WriteLine(string.Format("Loading library: {0}", lib));
                System.Reflection.Assembly assm = System.Reflection.Assembly.LoadFrom(lib);
                Console.WriteLine(assm.GetName().ToString());
            }
        }
        
        private static System.Reflection.Assembly OnAssemblyResolve(object sender, ResolveEventArgs args)
        {
            foreach (System.Reflection.Assembly assm in AppDomain.CurrentDomain.GetAssemblies())
            {
               if(assm.GetName().ToString() == args.Name)
               {
                   return assm;
               }
            };
            
            return null;
        }
        
        #endregion
        
        public static void ExportFile(string filePath, string outFilePath, string view)
        {
            Console.WriteLine("Connecting to SOLIDWORKS...");

            ISldWorks app = Activator.CreateInstance(Type.GetTypeFromProgID("SldWorks.Application")) as ISldWorks;

            if (app != null)
            {
                Console.WriteLine(string.Format("Opening file '{0}'...", filePath));

                IDocumentSpecification docSpec = app.GetOpenDocSpec(filePath) as IDocumentSpecification;
                docSpec.ReadOnly = true;
                docSpec.Silent = true;
                IModelDoc2 model = app.OpenDoc7(docSpec);
                model.ShowNamedView2(view,-1);
                model.ViewZoomtofit2();

                int swViewDisplayHideAllTypes = 198;
                model.SetUserPreferenceToggle(swViewDisplayHideAllTypes, true);

                // DrawingDoc swDraw = model as DrawingDoc;
                // View swView =  swDraw.GetFirstView() as View;      

                // view.SetDisplayMode3(False, 4, false, false);

                /*Member	Description
                    swDisplayModeDEFAULT	8
                    swDisplayModeUNKNOWN	-1
                    swFACETED_HIDDEN	6
                    swFACETED_HIDDEN_GREYED	5
                    swFACETED_WIREFRAME	4
                    swHIDDEN	2; Hidden Lines Removed (HLR)
                    swHIDDEN_GREYED	1; Hidden Lines Visible (HLV)
                    swSHADED	3
                    swSHADED_EDGES	7
                    swWIREFRAME	0
                */

                if (model != null)
                {
                    const int swSaveAsCurrentVersion = 0;
                    const int swSaveAsOptions_Silent = 1;
                    int err = -1;
                    int warn = -1;

                    Console.WriteLine(string.Format("Exporting file '{0}' to '{1}'...", filePath, outFilePath));

                    if (!model.Extension.SaveAs(outFilePath, swSaveAsCurrentVersion,
                        swSaveAsOptions_Silent, null, ref err, ref warn))
                    {
                        Console.WriteLine(string.Format("Failed to export '{0}' to '{1}'. Error code: {2}", filePath, outFilePath, err));
                    }

                    Console.WriteLine(string.Format("Closing file '{0}'...", filePath));

                    app.CloseDoc(model.GetTitle());
                }
                else
                {
                    Console.WriteLine(string.Format("Failed to open document: '{0}'. Error code: {1}",filePath, docSpec.Error));
                }
            }
            else
            {
                Console.WriteLine("Failed to connect to SOLIDWORKS instance");
            }
        }
    }
}
"@
 
Add-Type -TypeDefinition $Source -ReferencedAssemblies $Assem -Language CSharp
 
[CodeStack.Exporter]::LoadLibrary($Assem)
[CodeStack.Exporter]::ExportFile($inputFilePath, $outFilePath, $view)