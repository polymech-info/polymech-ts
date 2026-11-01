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
using System.Collections.Generic;
using System.Linq;

namespace model_reader
{
    class Program
    {

        public class Options
        {
            [ Option('v', "verbose", Required = false, HelpText = "Set output to verbose messages.", Default = true)]
            public bool Verbose { get; set; }

            [Option('f', "flatten", Required = false, HelpText = "Flatten to one folder", Default = false)]
            public bool Flatten { get; set; }

            [Option('t', "toolbox", Required = false, HelpText = "Include Toolbox Components", Default = false)]
            public bool Toolbox { get; set; }

            [Option('d', "drawings", Required = false, HelpText = "Include Drawings", Default = false)]
            public bool Drawings { get; set; }

            [Option('s', "simulation", Required = false, HelpText = "Include Simulation Results", Default = false)]
            public bool Simulation{ get; set; }


            [Option('c', "configuration", Required = false, HelpText = "Set the Model Configuration to be used, default = Default", Default ="Default")]
            public string configuration { get; set; }

            
            [Option("type", Required = false, HelpText = "None", Default = 2)]
            public int type { get; set; }
                        

        }
        static int RunOptionsAndReturnExitCode(Options o)
        {
            /*Console.WriteLine("Success");
            var exitCode = 0;
            var props = o.PR;
            //foreach (var prop in props)
            Console.WriteLine("props= {0}", string.Join(",", props));
            return exitCode;*/
            return 1;
        }
        //in case of errors or --help or --version
        static int HandleParseError(IEnumerable<Error> errs)
        {
            var result = -2;
            Console.WriteLine("errors {0}", errs.Count());
            if (errs.Any(x => x is HelpRequestedError || x is VersionRequestedError))
                result = -1;
            Console.WriteLine("Exit code {0}", result);
            return result;
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
            var version = (SwVersion_e)30;
            using (var app = SwApplicationFactory.Create(version, ApplicationState_e.Background))
            {

                ModelDoc2 swModel = default(ModelDoc2);
                ModelDocExtension swModelDocExt = default(ModelDocExtension);

                
                var _args = System.Environment.GetCommandLineArgs();
                var output = "";
                var input = "";
                var config = "Default";
                var type = 1;
                
                var flatten = false;
                var verbose = true;

                var toolbox = false;
                var drawings = false;
                var simulation = false;


                parser = new Parser(config => config.HelpWriter = Console.Out);

                // var o = Parser.Default.ParseArguments<Options>(args);


                Parser.Default.ParseArguments<Options>(args)
                   .WithParsed<Options>(o =>
                   {
                       config = o.configuration;
                       type = o.type;
                       verbose = o.Verbose;
                       flatten = o.Flatten;
                       drawings = o.Drawings;
                       toolbox = o.Toolbox;
                       simulation = o.Simulation;

                   });
                   

                //var result2 = CommandLine.Parser.Default.ParseArguments<Options>(args).MapResult((opts) => RunOptionsAndReturnExitCode(opts), errs => HandleParseError(errs)); //in  case parser fail
                
                

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
                swPackAndGo.IncludeDrawings = drawings;
                //Debug.Print(" Include drawings: " + swPackAndGo.IncludeDrawings);
                swPackAndGo.IncludeSimulationResults = simulation;
                //Debug.Print(" Include SOLIDWORKS Simulation results: " + swPackAndGo.IncludeSimulationResults);
                swPackAndGo.IncludeToolboxComponents = toolbox;
                //Debug.Print(" Include SOLIDWORKS Toolbox components: " + swPackAndGo.IncludeToolboxComponents);
                
                bool status = false;
                int[] statuses = null;
                int i = 0;
                int namesCount = 0;

                swPackAndGo.FlattenToSingleFolder = flatten;
                status = swPackAndGo.SetSaveToName(false, output);

                // Flatten the Pack and Go folder structure; save all files to the root directory
                

                // Add a prefix and suffix to the filenames
                // swPackAndGo.AddPrefix = "SW_";
                // swPackAndGo.AddSuffix = "_PackAndGo";

                // Verify document paths and filenames after adding prefix and suffix
                object getFileNames;
                object getDocumentStatus;
                //string[] pgGetFileNames = new string[namesCount - 1];
                /*
                status = swPackAndGo.GetDocumentSaveToNames(out getFileNames, out getDocumentStatus);
                pgGetFileNames = (string[])getFileNames;
                //Console.WriteLine("  My Pack and Go path and filenames after adding prefix and suffix: ");
                for (i = 0; i <= namesCount - 1; i++)
                {
                   Console.WriteLine("    My path and filename is: " + pgGetFileNames[i]);
                }*/
                

                // Pack and Go
                statuses = (int[])swModelDocExt.SavePackAndGo(swPackAndGo);
                
                //statuses = (int[])swModelDocExt.SaveDeFeaturedFile("as.as")
                app.Close();
            }
        }
    }
}
