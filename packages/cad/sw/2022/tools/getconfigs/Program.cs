using CommandLine;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using SolidWorks.Interop.sldworks;

namespace AssemblyConfigEnumerator
{
    class Program
    {
        class Options
        {
            [Option('s', "source", Required = true, HelpText = "Path to the SolidWorks assembly file.")]
            public string AssemblyPath { get; set; }

            [Option('t', "target", Required = true, HelpText = "Path to the target JSON file.")]
            public string TargetJsonPath { get; set; }
        }

        static void Main(string[] args)
        {
            Parser.Default.ParseArguments<Options>(args)
                .WithParsed(RunApp);
        }
        
        static Dictionary<string, string> GetCustomProperties(IConfiguration configuration)
        {
            var customProperties = new Dictionary<string, string>();

            var propertyManager = configuration.CustomPropertyManager as ICustomPropertyManager;

            var propertyNames = propertyManager.GetNames() as object[];

            if (propertyNames != null)
            {
                foreach (var propertyName in propertyNames)
                {
                    var propName = propertyName.ToString();
                    var propValue = propertyManager.Get(propName).ToString();
                    customProperties.Add(propName, propValue);
                }
            }

            return customProperties;
        }

        static void RunApp(Options options)
        {
            string assemblyPath = options.AssemblyPath;
            string targetJsonPath = options.TargetJsonPath;

            SldWorks swApp = null;
            ModelDoc2 swModel = null;

            try
            {
                swApp = Activator.CreateInstance(Type.GetTypeFromProgID("SldWorks.Application")) as SldWorks;
                IDocumentSpecification docSpec = swApp.GetOpenDocSpec(assemblyPath) as IDocumentSpecification;
                docSpec.ReadOnly = true;
                docSpec.Silent = true;

                swModel = swApp.OpenDoc7(docSpec);

                if (swModel != null)
                {
                    List<string> configurations = new List<string>();

                    ConfigurationManager swConfigMgr = swModel.ConfigurationManager;
                    object[] configNameArr = null;
                    configNameArr = (object[])swModel.GetConfigurationNames();
                    string configName = null;
                    Configuration swConfig = default(Configuration);
                    bool status = false;
                    int i = 0;
                    var configurationsWithProperties = new Dictionary<string, Dictionary<string, string>>();
                    for (i = 0; i <= configNameArr.GetUpperBound(0); i++)
                    {
                        configName = (string)configNameArr[i];
                        swConfig = (Configuration)swModel.GetConfigurationByName(configName);

                        var customProperties = GetCustomProperties(swConfig);
                        status = swModel.ShowConfiguration2(configName);
                        if (swConfig.AddRebuildSaveMark == false)
                        {
                            swConfig.AddRebuildSaveMark = true;
                        }
                        configurationsWithProperties.Add(configName, customProperties);
                    }                    
                    string json = JsonConvert.SerializeObject(configurationsWithProperties, Formatting.Indented);
                    File.WriteAllText(targetJsonPath, json);
                    Console.Write(json);
                }
                else
                {
                    Console.WriteLine("Failed to open the SolidWorks assembly.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("An error occurred: " + ex.Message);
            }
            finally
            {
                swApp.CloseDoc(assemblyPath);
                swApp.ExitApp();
            }
        }
    }
}
