using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.Windows.Shapes;
using CommandLine;
using Newtonsoft.Json;
using SolidWorks.Interop.sldworks;
using SolidWorks.Interop.swconst;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

class Options
{
    [Option('s', "source", Required = true, HelpText = "Input file path")]
    public string InputFilePath { get; set; }

    [Option('t', "target", Required = true, HelpText = "Output file path")]
    public string OutputFilePath { get; set; }

    [Option('c', "configuration", Required = false, HelpText = "SolidWorks configuration name", Default = "Default")]
    public string ConfigurationName { get; set; }

    [Option('p', "pipeName", Required = false, HelpText = "Named pipe name for IPC", Default = "osr-cad")]
    public string PipeName { get; set; }

    [Option('l', "logFilePath", Required = false, HelpText = "File path to redirect SolidWorks stdout", Default = "log.txt")]
    public string LogFilePath { get; set; }

    [Option('h', "hidden", Required = false, HelpText = "Hide Solidworks window", Default = "true")]
    public string Hidden { get; set; }
}

public class TreeItem
{
    public string Name { get; set; }
    public List<TreeItem> Children { get; set; }
}

class Program
{
    static void Main(string[] args)
    {
        Parser.Default.ParseArguments<Options>(args)
            .WithParsed(options => Run(options))
            .WithNotParsed(errors => HandleParseErrors(errors));
    }
    

    static void TraverseComponents(Component2[] components, List<TreeItem> parentList)
    {
        foreach (Component2 component in components)
        {
            TreeItem item = new TreeItem();
            item.Name = component.Name2;
            Component2[] childs = (Component2[])component.GetChildren();

            if (childs.Length > 0)
            {
                List<TreeItem> children = new List<TreeItem>();
                TraverseComponents((Component2[])component.GetChildren(), children);
                item.Children = children;
            }

            parentList.Add(item);
        }
    }
    public class ComponentData
    {
        public string Name { get; set; }
        public string Path { get; set; }
        public bool IsSuppressed { get; set; }
    }
    public class AssemblyData
    {
        public List<ComponentData> Components { get; set; } = new List<ComponentData>();
    }
    public static AssemblyData GetAssemblyData(AssemblyDoc swAssembly)
    {
        var assemblyData = new AssemblyData();
        //var components = swAssembly.GetComponents(false);
        object[] components = (object[])swAssembly.GetComponents(false);        
        // Component2[] components = (Component2[])swAssembly.GetComponents(false);

        foreach (object component in components)
        {
            var compData = new ComponentData
            {
                Name = ((Component2)component).Name2,
                Path = ((Component2)component).GetPathName(),
                IsSuppressed = ((Component2)component).IsSuppressed()
            };

            assemblyData.Components.Add(compData);
        }

        return assemblyData;
     }
    static string CreateAssemblyTreeJson(string filePath,string configuration, string dst)
    {
        SldWorks swApp = null;
        
        int errors = 0;
        int warnings = 0;
        
        swApp = Activator.CreateInstance(Type.GetTypeFromProgID("SldWorks.Application")) as SldWorks;
        ModelDoc2 swModel = swApp.OpenDoc6(filePath, (int)swDocumentTypes_e.swDocASSEMBLY, (int)swOpenDocOptions_e.swOpenDocOptions_Silent, "", 0, 0);
        AssemblyDoc swAssembly = (AssemblyDoc)swModel;

        AssemblyData aData = GetAssemblyData(swAssembly);

        Configuration swConfig = (Configuration)swModel.GetConfigurationByName(configuration);
        if (swConfig == null)
        {
            swConfig = swModel.ConfigurationManager.ActiveConfiguration;
        }

        if (swConfig == null)
        {
            Console.WriteLine($"Configuration '{configuration}' not found.");
            swApp.CloseDoc(filePath);
            swApp.ExitApp();
            return "";
        }

        TreeItem root = new TreeItem();
        root.Name = swModel.GetTitle();

        List<TreeItem> children = new List<TreeItem>();
        //Component2[] components = (Component2[])swAssembly.GetComponents(false);
        Component2[] components = (Component2[])swAssembly.GetComponents(false);
        TraverseComponents(components, children);
        root.Children = children;

        swApp.CloseDoc(swModel.GetTitle());

        return JsonConvert.SerializeObject(root);
    }

    public static void GetCustomProperties(string assemblyFilePath, string configurationName)
    {
        
        SldWorks swApp = null;
        ModelDoc2 swModel = null;
        int errors = 0;
        int warnings = 0;
        swApp = Activator.CreateInstance(Type.GetTypeFromProgID("SldWorks.Application")) as SldWorks;
        int options = (int)swOpenDocOptions_e.swOpenDocOptions_Silent;
        swModel = swApp.OpenDoc6(assemblyFilePath, (int)swDocumentTypes_e.swDocASSEMBLY,options, "", ref errors, ref warnings) as ModelDoc2;

        if (swModel == null)
        {
            Console.WriteLine("Failed to open the assembly.");
            return;
        }

        Configuration swConfig = (Configuration)swModel.GetConfigurationByName(configurationName);
        if(swConfig == null)
        {
            swConfig = swModel.ConfigurationManager.ActiveConfiguration;
        }

        if (swConfig == null)
        {
            Console.WriteLine($"Configuration '{configurationName}' not found.");
            swApp.CloseDoc(assemblyFilePath);
            swApp.ExitApp();
            return;
        }

        CustomPropertyManager customPropertyManager = swModel.Extension.CustomPropertyManager[swConfig.Name];
        string[] propertyNames = (string[])customPropertyManager.GetNames();

        CustomPropertyManager customPropertyManagerAll = swModel.Extension.CustomPropertyManager[""];
        string[] propertyNamesAll = (string[])customPropertyManagerAll.GetNames();

        if (propertyNames == null)
        {
            Console.WriteLine("No custom properties found.");
            swApp.CloseDoc(assemblyFilePath);
            swApp.ExitApp();
            return;
        }

        foreach (string propertyName in propertyNames)
        {
            string propertyValue;
            string resolvedValue;
            bool wasResolved;
            customPropertyManager.Get4(propertyName, false, out propertyValue, out resolvedValue);
            Console.WriteLine($"Property: {propertyName}, Value: {propertyValue}, Resolved Value: {resolvedValue}");
        }

        swApp.CloseDoc(assemblyFilePath);
        swApp.ExitApp();
    }
    static void Run(Options options)
    {
        try
        {

            // Continue with the SolidWorks operation
            ISldWorks swApp = Activator.CreateInstance(Type.GetTypeFromProgID("SldWorks.Application")) as ISldWorks;
            if (swApp == null)
            {
                Console.WriteLine("<<Error::Failed to create SolidWorks Application instance.>>");
                return;
            }

            bool hidden = options.Hidden == "true";

            swApp.Visible = !hidden;

            // GetCustomProperties(options.InputFilePath, options.ConfigurationName);
            CreateAssemblyTreeJson(options.InputFilePath, options.ConfigurationName, options.OutputFilePath);
            bool s = true;
            if (s)
            {
                return;
            }

            //swApp.Visible = true;

            IDocumentSpecification docSpec = swApp.GetOpenDocSpec(options.InputFilePath) as IDocumentSpecification;
            docSpec.ReadOnly = true;
            docSpec.Silent = hidden;

            IModelDoc2 swModel = swApp.OpenDoc7(docSpec);

            if (swModel == null)
            {
                Console.WriteLine($"<<Error::Failed to open the input file: {options.InputFilePath}>>");
                swApp.ExitApp();
                return;
            }

            // Set the active configuration
            if (!swModel.ShowConfiguration2(options.ConfigurationName))
            {
                Console.WriteLine($"<<Warn::Failed to change configuration: {options.ConfigurationName}>>");
            }

            int err = -1;
            int warn = -1;
            const int swSaveAsCurrentVersion = 0;
            const int swSaveAsOptions_Silent = 1;

            bool ipcConnected = false;

            // Notify Node.js about the completion using named pipe
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
                    Console.WriteLine("<<Warn::IPC error:timeout>>");
                }
            }

            if (ipcConnected)
            {
                // Notify Node.js about the completion using named pipe
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
                        Console.WriteLine("<<Warn::IPC error:timeout>>");
                    }
                }
            }

            Console.WriteLine($"<<Info::Conversion successful. Output file saved to: {options.OutputFilePath} >>");

            // Close the model
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
