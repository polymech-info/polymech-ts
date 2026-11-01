using System;
using System.IO;
using Xarial.XCad.Documents;
using Xarial.XCad.Documents.Enums;
using Xarial.XCad.Enums;
using Xarial.XCad.SolidWorks;
using Xarial.XCad.SolidWorks.Documents;
using Xarial.XCad.SolidWorks.Enums;

using SolidWorks.Interop.sldworks;
using CommandLine;
using System.Diagnostics;

namespace model_reader
{
    class Program
    {

        public class Options
        {
            [ Option('v', "verbose", Required = false, HelpText = "Set output to verbose messages.", Default = true)]
            public bool Verbose { get; set; }

            [Option('f', "flatten", Required = false, HelpText = "Flatten to one folder", Default = true)]
            public bool Flatten { get; set; }


            [Option("configuration", Required = false, HelpText = "Set the Model Configuration to be used, default = Default", Default ="Default")]
            public string configuration { get; set; }

            
            [Option("type", Required = false, HelpText = "None", Default = 2)]
            public int type { get; set; }
                        

        }

        static void Main(string[] args)
        {


            var parser = new Parser(config => config.HelpWriter = Console.Out);
            var __args = System.Environment.GetCommandLineArgs();
            if (__args.Length==1)
            {
                return;
            }

            if (__args.Length == 2 && __args[1]=="help")
            {
                Parser.Default.ParseArguments<Options>(args)
                   .WithParsed<Options>(o =>
                   {
                       parser = new Parser(config => config.HelpWriter = Console.Out);
                       Console.WriteLine("--");
                   });
                return;
            }

            using (var app = SwApplicationFactory.Create(SwVersion_e.Sw2020, ApplicationState_e.Background))
            {

                ModelDoc2 swModel = default(ModelDoc2);
                ModelDocExtension swModelDocExt = default(ModelDocExtension);

                
                var _args = System.Environment.GetCommandLineArgs();
                var output = "";
                var input = "";
                var config = "Default";
                var type = 1;
                var flatten = true;
                var verbose = true;
                
                parser = new Parser(config => config.HelpWriter = Console.Out);


                Parser.Default.ParseArguments<Options>(args)
                   .WithParsed<Options>(o =>
                   {
                       // config = o.configuration;
                       type = o.type;
                       verbose = o.Verbose;
                       flatten = o.Flatten;
                   });
                
                if (_args.Length == 1)
                {
                    Console.WriteLine("Need at least one argument : Input path");
                    return;
                }
                else if (_args.Length == 2)
                {
                    input = _args[1];
                    output = Path.Combine(new FileInfo(input).Directory.FullName, Path.GetFileNameWithoutExtension(input) + "_bom_.xlsx");
                }
                else if (_args.Length > 2)
                {
                    input = _args[1];
                    output = _args[2];
                }

                Console.WriteLine("Pack {0} to {1} ", input, output);

                var doc = app.Documents.Open(input, DocumentState_e.ReadOnly );
                
                var assm = ((ISwDocument)doc).Model;
                swModel = (ModelDoc2)assm;

                swModelDocExt = (ModelDocExtension)swModel.Extension;

                
                if (verbose)
                {
                    Console.WriteLine("Config {0}", config);
                    Console.WriteLine("type {0}", type);
                }


                Configuration swConf;
                
                ConfigurationManager swConfMgr;
                swConfMgr = (ConfigurationManager)swModel.ConfigurationManager;
                swConf = (Configuration)swConfMgr.ActiveConfiguration;
                var configName = swConf.Name;

                Console.WriteLine("Open Config", configName);

                PackAndGo swPackAndGo = default(PackAndGo);

                swPackAndGo = (PackAndGo)swModelDocExt.GetPackAndGo();

                // Get number of documents in assembly
                // namesCount = swPackAndGo.GetDocumentNamesCount();
                // Debug.Print("  Number of model documents: " + namesCount);


                // Include any drawings, SOLIDWORKS Simulation results, and SOLIDWORKS Toolbox components
                swPackAndGo.IncludeDrawings = true;
                //Debug.Print(" Include drawings: " + swPackAndGo.IncludeDrawings);
                swPackAndGo.IncludeSimulationResults = true;
                //Debug.Print(" Include SOLIDWORKS Simulation results: " + swPackAndGo.IncludeSimulationResults);
                swPackAndGo.IncludeToolboxComponents = true;
                //Debug.Print(" Include SOLIDWORKS Toolbox components: " + swPackAndGo.IncludeToolboxComponents);
                
                bool status = false;
                int[] statuses = null;
                int i = 0;
                int namesCount = 0;
                
                status = swPackAndGo.SetSaveToName(true, output);

                // Flatten the Pack and Go folder structure; save all files to the root directory
                swPackAndGo.FlattenToSingleFolder = true;


                // Add a prefix and suffix to the filenames
                // swPackAndGo.AddPrefix = "SW_";
                //swPackAndGo.AddSuffix = "_PackAndGo";

                // Verify document paths and filenames after adding prefix and suffix
                object getFileNames;
                object getDocumentStatus;
                // string[] pgGetFileNames = new string[namesCount - 1];
                swPackAndGo.FlattenToSingleFolder = true;
                
                status = swPackAndGo.GetDocumentSaveToNames(out getFileNames, out getDocumentStatus);
                // pgGetFileNames = (string[])getFileNames;
                //Console.WriteLine("  My Pack and Go path and filenames after adding prefix and suffix: ");
                for (i = 0; i <= namesCount - 1; i++)
                {
                   // Console.WriteLine("    My path and filename is: " + pgGetFileNames[i]);
                }
                

                // Pack and Go
                statuses = (int[])swModelDocExt.SavePackAndGo(swPackAndGo);
                // statuses = (int[])swModelDocExt.SaveDeFeaturedFile("as.as")
                app.Close();
            }
        }
    }
}
