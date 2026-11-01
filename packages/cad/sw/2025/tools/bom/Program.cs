using System;
using System.IO;
using Xarial.XCad.Documents;
using Xarial.XCad.Documents.Enums;
using Xarial.XCad.Enums;
using Xarial.XCad.SolidWorks;
using Xarial.XCad.SolidWorks.Documents;
using Xarial.XCad.SolidWorks.Enums;

using System.Data;
using System.Linq;
using Newtonsoft.Json;

using SolidWorks.Interop.sldworks;
using SolidWorks.Interop.swconst;
using System.Runtime.InteropServices;
using System.Diagnostics;
using CommandLine;

namespace model_reader
{
    class Program
    {

        public class Options
        {
            [ Option('v', "verbose", Required = false, HelpText = "Set output to verbose messages.", Default = true)]
            public bool Verbose { get; set; }
                        
            [Option("configuration", Required = false, HelpText = "Set the Model Configuration to be used, default = Default", Default ="Default")]
            public string configuration { get; set; }
            
            [Option("images", Required = false, HelpText = "Generate images in first column, default = true", Default = false)]
            public bool images { get; set; }
                        
            [Option("template", Required = false, HelpText = "Set the BOM template")]
            public string template { get; set; }

            [Option("type", Required = false, HelpText = "Bom Type : default = 2 - PartsOnly = 1 | TopLevelOnly = 2 | Indented = 3 ", Default = 2)]
            public int type { get; set; }

            [Option("detail", Required = false, HelpText = "Bom Numbering : default = 1 - Type_None = 0 |  Type_Detailed = 1 | Type_Flat = 2 | BOMNotSet = 3 ", Default = 1)]
            public int detail { get; set; }

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
                   });
                return;
            }

            var versions = SwApplicationFactory.GetInstalledVersions();

            var version = (SwVersion_e)30;// sw - 2022
            using (var app = SwApplicationFactory.Create(version, ApplicationState_e.Background))
            {

                ModelDoc2 swModel = default(ModelDoc2);
                ModelDocExtension swModelDocExt = default(ModelDocExtension);
                TableAnnotation swTable = default(TableAnnotation);
                
                BomTableAnnotation swBOMAnnotation = default(BomTableAnnotation);
                int BomType = 0;
                string TemplateName = null;
                
                var _args = System.Environment.GetCommandLineArgs();
                var output = "";
                var input = "";
                var config = "Default";
                var type = 2;
                var template = "";
                var detail = 1;
                var images = false;
                var verbose = false;
                
                parser = new Parser(config => config.HelpWriter = Console.Out);


                Parser.Default.ParseArguments<Options>(args)
                   .WithParsed<Options>(o =>
                   {
                       config = o.configuration;
                       type = o.type;
                       template = o.template;
                       detail = o.detail;
                       images = o.images;
                       verbose = o.Verbose;
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

                Console.WriteLine("Convert {0} to {1} ", input, output);

                var doc = app.Documents.Open(input, DocumentState_e.ReadOnly | DocumentState_e.Hidden);
                
                var assm = ((ISwDocument)doc).Model;
                swModel = (ModelDoc2)assm;

                swModelDocExt = (ModelDocExtension)swModel.Extension;

                if (String.IsNullOrEmpty(template)){
                    TemplateName = Path.Combine(new FileInfo(_args[0]).Directory.FullName, "bom-all.sldbomtbt");
                }
                else
                {
                    TemplateName = template;
                }
                Console.WriteLine("Use BOM template at {0}", TemplateName);

                if (verbose)
                {
                    Console.WriteLine("Config {0}", config);
                    Console.WriteLine("detail {0}", detail);
                    Console.WriteLine("type {0}", type);
                    Console.WriteLine("image {0}", images);
                    Console.WriteLine("template {0}", TemplateName);
                }


                BomType = (int)swBomType_e.swBomType_Indented;
                
                Configuration swConf;
                
                ConfigurationManager swConfMgr;
                swConfMgr = (ConfigurationManager)swModel.ConfigurationManager;
                swConf = (Configuration)swConfMgr.ActiveConfiguration;
                var configName = swConf.Name;
                swBOMAnnotation = (BomTableAnnotation)swModelDocExt.InsertBomTable3(TemplateName, 0, 0, BomType, configName, false, detail, true);
                swTable = (TableAnnotation)swBOMAnnotation;
                var swSpecTable = (IBomTableAnnotation)swTable;
                Console.WriteLine("Write BOM to {0}", output);

                if (swSpecTable!=null)
                {
                    swSpecTable.SaveAsExcel(output, false, images);
                }
                else
                {
                    Console.WriteLine("Invalid table!");
                }
                app.Close();
            }
        }
    }
}
