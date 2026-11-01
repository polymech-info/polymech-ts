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
using System.Collections.Generic;
using SolidWorks.Interop.sldworks;
using CommandLine;
using SolidWorks.Interop.swconst;
using System.Text.RegularExpressions;
namespace model_reader
{
    class Options
    {
        [Option('s', "source", Required = true, HelpText = "Input file path")]
        public string Source { get; set; }

        [Option('t', "target", Required = true, HelpText = "Output file path")]
        public string Target { get; set; }

        [Option('c', "configuration", Required = false, HelpText = "SolidWorks configuration name", Default = "Default")]
        public string Configuration { get; set; }

        [Option('p', "pipeName", Required = false, HelpText = "Named pipe name for IPC", Default = "osr-cad")]
        public string PipeName { get; set; }

        [Option('l', "logFilePath", Required = false, HelpText = "File path to redirect SolidWorks stdout", Default = "log.txt")]
        public string LogFilePath { get; set; }

        [Option('h', "hidden", Required = false, HelpText = "Hide Solidworks window", Default = "true")]
        public string Hidden { get; set; }

        [Option('t', "tree", Required = false, HelpText = "Dump Model Tree Data", Default = "false")]
        public string Tree { get; set; }

        [Option('f', "flags", Required = false, HelpText = "Document Open Flags", Default = DocumentState_e.ReadOnly | DocumentState_e.Hidden)]
        public int flags{ get; set; }

        [Option("swv", Required = false, HelpText = "Solidworks version, 30=2022, 31=2023, 32=2024, 33=2025", Default = 33)]
        public int swv{ get; set; }
    }

    public class TreeItem
    {
        public string Name { get; set; }
        public List<TreeItem> Children { get; set; }

        public string Path { get; set; }

        public string Parent { get; set; }

        public Dictionary<string, Dictionary<string, string>> Properties { get; set; }

        public Dictionary<string, double>Equations { get; set; }

        public Dictionary<string, double>Mass { get; set; }

        public Dictionary<string, double> Box { get; set; }

        public Dictionary<string, string>Material { get; set; }

        public Dictionary<string, string> States { get; set; }

        public Dictionary<string, string> LaserParts { get; set; }

        public bool IsSuppressed { get; set; }

        public string activeConfiguration { get; set; }
    }

    class Program
    {
        public static Dictionary<string, string> GetPhysicalMaterials(ModelDoc2 modelDoc)
        {
            if (modelDoc == null)
            {
                return null;
            }
            Dictionary<string, string> materialDict = new Dictionary<string, string>();
            try
            {
                // Check if the document is a part or assembly
                if (modelDoc.GetType() == (int)swDocumentTypes_e.swDocPART)
                {
                    PartDoc partDoc = (PartDoc)modelDoc;
                    string materialName = partDoc.GetMaterialPropertyName2("", out string materialDatabase);
                    materialDict["Material"] = materialName;
                    materialDict["Materials"] = materialDatabase;
                }
                else if (modelDoc.GetType() == (int)swDocumentTypes_e.swDocASSEMBLY)
                {
                    AssemblyDoc assemblyDoc = (AssemblyDoc)modelDoc;
                    object[] components = (object[])assemblyDoc.GetComponents(false);

                    foreach (Component2 component in components)
                    {
                        ModelDoc2 componentModel = (ModelDoc2)component.GetModelDoc2();
                        if (componentModel != null && componentModel.GetType() == (int)swDocumentTypes_e.swDocPART)
                        {
                            PartDoc partDoc = (PartDoc)componentModel;
                            string materialName = partDoc.GetMaterialPropertyName2("", out string materialDatabase);
                            materialDict[component.Name2] = materialName;
                            //materialDict[$"{component.Name2}-Materials"] = materialDatabase;
                        }
                    }
                }
            }catch(Exception ex)
            {
                Console.WriteLine("Error retrieving material: " + modelDoc.GetPathName() + " : " + ex.Message);
            }

            return materialDict;
        }
        public static Dictionary<string, string> GetStates(ModelDoc2 modelDoc)
        {
            Dictionary<string, string> states = new Dictionary<string, string>();
            try
            {
                object oFeatures;
                object oErrorCodes;
                object oWarnings;
                object[] Features = null;
                int[] ErrorCodes = null;
                bool[] Warnings = null;
                bool boolstatus = false;
                int i = 0;
                int nbrWhatsWrong = 0;
                Feature swFeature = default(Feature);
                ModelDocExtension swModelDocExt = default(ModelDocExtension);
                swModelDocExt = (ModelDocExtension)modelDoc.Extension;
                nbrWhatsWrong = swModelDocExt.GetWhatsWrongCount();
                if (nbrWhatsWrong > 0)
                {
                    boolstatus = swModelDocExt.GetWhatsWrong(out oFeatures, out oErrorCodes, out oWarnings);
                    Features = (object[])oFeatures;
                    ErrorCodes = (int[])oErrorCodes;
                    Warnings = (bool[])oWarnings;
                    states["wrong"] = "" + nbrWhatsWrong;
                    states["errors"] = string.Join(" ", ErrorCodes);
                    states["warnings"] = string.Join(" ", Warnings);
                    List<string> Names = new List<string> { };
                    for (i = 0; i < Features.Length; i++)
                    {
                        swFeature = (Feature)Features[i];
                        Names.Add(swFeature.GetTypeName2());
                    }
                    states["features"] = string.Join(" | ", Names);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error retrieving states: " + modelDoc.GetPathName() + " : " + ex.Message);
            }
            return states;
        }

        public static Dictionary<string, string> GetLaserParts(ModelDoc2 modelDoc)
        {
            Dictionary<string, string> partsWithLaserProperty = new Dictionary<string, string>();
            /*
            if (modelDoc != null && modelDoc.GetType() == (int)swDocumentTypes_e.swDocPART)
            {
                PartDoc part = (PartDoc)modelDoc;
                bool hasLaserProperty = false;
                object[] bodies = (object[])part.GetBodies2((int)swBodyType_e.swAllBodies, false);
                foreach (Body2 body in bodies)
                {
                    object[] faces = (object[])body.GetFaces();
                    foreach (Face2 face in faces)
                    {
                        var facePropMgr = face.GetUserPropertyManager();
                        string valOut = "";
                        facePropMgr.Get4("laser", false, out valOut);
                        if (!string.IsNullOrEmpty(valOut))
                        {
                            hasLaserProperty = true;
                            break;
                        }
                    }
                    if (hasLaserProperty) break;
                }

                if (hasLaserProperty)
                {
                    // partsWithLaserProperty[partPath] = modelDoc.GetPathName();
                }
            }*/
            return partsWithLaserProperty;
        }
        public static Dictionary<string, double> GetMassProperties(ModelDoc2 modelDoc)
        {
            if (modelDoc == null)
            {
                return null;
            }
            Dictionary<string, double> massPropertiesDict = new Dictionary<string, double>();
            try
            {
                MassProperty massProperty = modelDoc.Extension.CreateMassProperty();
                massPropertiesDict["Mass"] = massProperty.Mass;
                massPropertiesDict["Density"] = massProperty.Density;
                massPropertiesDict["Volume"] = massProperty.Volume;
                massPropertiesDict["SurfaceArea"] = massProperty.SurfaceArea;
                double[] centerOfMass = (double[])massProperty.CenterOfMass;
                massPropertiesDict["CenterOfMassX"] = centerOfMass[0];
                massPropertiesDict["CenterOfMassY"] = centerOfMass[1];
                massPropertiesDict["CenterOfMassZ"] = centerOfMass[2];
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error retrieving mass properties: " + modelDoc.GetPathName() + " : " + ex.Message);
            }
            return massPropertiesDict;
        }

        public static Dictionary<string, double> GetBoundingBox(Component2 modelDoc)
        {
            if (modelDoc == null)
            {
                return null;
            }
            try
            {
                Dictionary<string, double> boundingBoxDict = new Dictionary<string, double>();
                object bboxo = modelDoc.GetBox(false, false);
                if (bboxo !=null && ! System.DBNull.Value.Equals(bboxo))
                {
                    double[] boundingBox = (double[])bboxo;
                    if (boundingBox == null || boundingBox.Length != 6)
                    {
                        Console.WriteLine("Failed to retrieve the bounding box.");
                        return boundingBoxDict;
                    }

                    boundingBoxDict["MinX"] = (double)boundingBox[0];
                    boundingBoxDict["MinY"] = (double)boundingBox[1];
                    boundingBoxDict["MinZ"] = (double)boundingBox[2];
                    boundingBoxDict["MaxX"] = (double)boundingBox[3];
                    boundingBoxDict["MaxY"] = (double)boundingBox[4];
                    boundingBoxDict["MaxZ"] = (double)boundingBox[5];
                    return boundingBoxDict;
                }
            }catch(Exception e)
            {
                Console.WriteLine("Error retrieving bounding box: " + modelDoc.GetPathName() + " : " + e.Message);
            }
            return null;
        }

        public static Dictionary<string, double> GetEquations(ModelDoc2 modelDoc)
        {
            if (modelDoc == null)
            {
                return null;
            }
            Dictionary<string, double> equationDict = new Dictionary<string, double>();
            try
            {
                EquationMgr equationMgr = default(EquationMgr);
                equationMgr = (EquationMgr)modelDoc.GetEquationMgr();
                int equationCount = equationMgr.GetCount();
                for (int i = 0; i < equationCount; i++)
                {
                    string equation = equationMgr.Equation[i];
                    string[] equationParts = equation.Split('=');

                    if (equationParts.Length == 2)
                    {
                        string name = equationParts[0].Trim();
                        string pattern = "\"([^\"]*)\"";
                        Regex regex = new Regex(pattern);
                        Match match = regex.Match(name);
                        if (match.Success)
                        {
                            name = match.Groups[1].Value;
                        }
                        double evalValue = equationMgr.get_Value(i);
                        equationDict[name] = evalValue;
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("Error retrieving equations: " + modelDoc.GetPathName() + " : " + e.Message);
            }
            return equationDict;
        }
        static void TraverseComponents(object[] components, List<TreeItem> parentList, Options options)
        {
            foreach (Component2 component in components)
            {
                if (component == null) continue;

                TreeItem item = new TreeItem();
                item.Name = component.Name2;
                item.Path = component.GetPathName();
                item.IsSuppressed = component.IsSuppressed();
                ModelDoc2 model = (ModelDoc2)component.GetModelDoc2();
                if (model != null)
                {   
                    item.Properties = getProperties2(model);
                    item.Equations = GetEquations(model);
                    item.Mass   = GetMassProperties(model);
                    item.Material   = GetPhysicalMaterials(model);
                    item.Box = GetBoundingBox(component);
                    item.States = GetStates(model);
                }

                object[] vChildComp = (object[])component.GetChildren();
                if (vChildComp != null && vChildComp.Length > 0)
                {
                    List<TreeItem> children = new List<TreeItem>();
                    TraverseComponents(vChildComp, children, options);
                    item.Children = children;
                    foreach (TreeItem child in children)
                    {
                        child.Parent = item.Path;
                    }
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

        public class Tree
        {
            public AssemblyData assembly;
            public TreeItem root;
            public Dictionary<string, Dictionary<string, string>> Configurations { get; set; }
        }

        public static AssemblyData GetAssemblyData(AssemblyDoc swAssembly)
        {
            var assemblyData = new AssemblyData();
            ModelDoc2 m = (ModelDoc2)swAssembly;
            object[] components = (object[])swAssembly.GetComponents(false);
            foreach (object component in components)
            {
                const string FILE_PATH_COLUMN_NAME = "File Path";
                var prpsTable = new DataTable();
                prpsTable.Columns.Add(FILE_PATH_COLUMN_NAME);
                Component2 comp = (Component2)component;
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
                    string evaluated = "";
                    string value= "";
                    bool status = propertyManager.Get4(propName, false, out value, out evaluated);
                    customProperties.Add(propName, evaluated);
                }
            }

            return customProperties;
        }

        static Dictionary<string, Dictionary<string, string>> getProperties2(ModelDoc2 swModel)
        {
            if (swModel == null)
            {
                return null;
            }
            var configurationsWithProperties = new Dictionary<string, Dictionary<string, string>>();
            try
            {
                List<string> configurations = new List<string>();
                SolidWorks.Interop.sldworks.ConfigurationManager swConfigMgr = swModel.ConfigurationManager;
                object[] configNameArr = null;
                configNameArr = (object[])swModel.GetConfigurationNames();
                string configName = null;
                SolidWorks.Interop.sldworks.Configuration swConfig = default(SolidWorks.Interop.sldworks.Configuration);
                bool status = false;
                int i = 0;
                
                for (i = 0; i <= configNameArr.GetUpperBound(0); i++)
                {
                    configName = (string)configNameArr[i];
                    swConfig = (SolidWorks.Interop.sldworks.Configuration)swModel.GetConfigurationByName(configName);
                    var customProperties = GetCustomProperties(swConfig);
                    configurationsWithProperties.Add(configName, customProperties);
                }

                
            }catch (Exception ex)
            {
                Console.WriteLine("Error retrieving properties2: " + swModel.GetPathName() + " : " + ex.Message);
            }
            try
            {
                bool globalProperties = true;
                if (globalProperties)
                {
                    CustomPropertyManager customPropertyManagerAll = swModel.Extension.CustomPropertyManager[""];
                    string[] propertyNamesAll = (string[])customPropertyManagerAll.GetNames();
                    if (propertyNamesAll != null)
                    {
                        var customProperties = new Dictionary<string, string>();
                        configurationsWithProperties.Add("Global", customProperties);
                        foreach (var propertyName in propertyNamesAll)
                        {
                            var propName = propertyName.ToString();
                            var propValue = customPropertyManagerAll.Get(propName).ToString();
                            customProperties.Add(propName, propValue);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error retrieving properties2 : " + swModel.GetPathName() + " : " + ex.Message);
            }
            /*
            foreach (string propertyName in propertyNamesAll)
            {
                string propertyValue;
                string resolvedValue;
                bool wasResolved;
                customPropertyManagerAll.Get4(propertyName, false, out propertyValue, out resolvedValue);
                Console.WriteLine($"Property: {propertyName}, Value: {propertyValue}, Resolved Value: {resolvedValue}");
            }*/


            return configurationsWithProperties;
        }

        static TreeItem CreateAssemblyTreeJson(ModelDoc2 swModel,Options options)
        {
            AssemblyDoc swAssembly = (AssemblyDoc)swModel;
            TreeItem root = new TreeItem();
            try
            {
                root.Name = swModel.GetTitle();
                root.Path = swModel.GetPathName();
                root.Properties = getProperties2(swModel);
                root.Equations = GetEquations(swModel);
                root.Mass = GetMassProperties(swModel);
                root.Material = GetPhysicalMaterials(swModel);
                root.States = GetStates(swModel);
                //root.IsSuppressed = ((Component2)swModel).IsSuppressed();
                ConfigurationManager configMgr = swModel.ConfigurationManager;
                Configuration activeConfig = configMgr.ActiveConfiguration;
                root.activeConfiguration = activeConfig.Name;
                List<TreeItem> children = new List<TreeItem>();
                object[] components = (object[])swAssembly.GetComponents(false);
                TraverseComponents(components, children, options);
                root.Children = children;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error CreateAssemblyTreeJson: " + swModel.GetPathName() + " : " + ex.Message);
            }
            return root;
        }

        static Tree TreeMeta(ModelDoc2 swModel, Options options)
        {
            string targetJsonPath = options.Target.Replace(".json",".tree.json");
            AssemblyDoc swAssembly = (AssemblyDoc)swModel;
            AssemblyData assemblyData = GetAssemblyData(swAssembly);
            Tree tree = new Tree();

            tree.root = CreateAssemblyTreeJson(swModel, options);
            tree.assembly = assemblyData;
            tree.Configurations = getProperties2(swModel);            
            try
            {
                string json = JsonConvert.SerializeObject(tree, Formatting.Indented, new JsonConverter[] { new Newtonsoft.Json.Converters.StringEnumConverter() });
                File.WriteAllText(targetJsonPath, json);
                Console.WriteLine("<<Info::Serialized Tree to {0}>>", targetJsonPath);
            }
            catch (Exception ex)
            {
                Console.WriteLine("<<Error::Error - Writing JSON : {0}>>",ex.Message);
            }
            return tree;
        }

        static void RunTree(Options options) {

            SldWorks swApp = null;
            ModelDoc2 swModel = null;
            string assemblyPath = options.Source;
            string targetJsonPath = options.Target;
            try
            {
                swApp = Activator.CreateInstance(Type.GetTypeFromProgID("SldWorks.Application")) as SldWorks;
                swApp.Visible = false;

                IDocumentSpecification docSpec = swApp.GetOpenDocSpec(assemblyPath) as IDocumentSpecification;
                docSpec.ReadOnly = true;                
                swModel = swApp.OpenDoc7(docSpec);

                if (swModel==null)
                {
                    Console.WriteLine("Error - Reading Model: " + assemblyPath);
                    swApp.ExitApp();
                    return;
                }
                
                AssemblyDoc swAssembly = (AssemblyDoc)swModel;
                AssemblyData assemblyData = GetAssemblyData(swAssembly);
                
                Tree tree = new Tree();
                tree.root = CreateAssemblyTreeJson(swModel, options);
                tree.assembly = assemblyData;
                try
                {
                    Console.WriteLine("Serialize to {0}", targetJsonPath);
                    string json = JsonConvert.SerializeObject(tree, Formatting.Indented, new JsonConverter[] { new Newtonsoft.Json.Converters.StringEnumConverter() });
                    File.WriteAllText(targetJsonPath, json);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error - Writing JSON : " + ex.Message);
                }
                swApp.ExitApp();


            }
            catch(Exception ex)
            {
                Console.WriteLine("Error - Opening Model: " + assemblyPath);
                swApp.ExitApp();
            }
            swApp.ExitApp();
        }

        static void Run(Options options)
        {
            int version = options.swv;
            using (var app = SwApplicationFactory.Create((SwVersion_e)version, ApplicationState_e.Background))
            {
                var input = options.Source;
                var output = options.Target;
                var file = Path.Combine(Path.GetDirectoryName(typeof(Program).Assembly.Location));
                var doc = (ISwDocument)app.Documents.Open(input, (DocumentState_e)options.flags);
                ModelDoc2 swModel = (ModelDoc2)doc.Model;

                if (!swModel.ShowConfiguration2(options.Configuration))
                {
                    Console.WriteLine($"<<Warn::Failed to change configuration {input} : {options.Configuration}>>");
                }
                else
                {
                    Console.WriteLine($"<<Info::Changed Configuration: {options.Configuration}>>");
                }

                const string FILE_PATH_COLUMN_NAME = "File Path";
                var prpsTable = new DataTable();
                prpsTable.Columns.Add(FILE_PATH_COLUMN_NAME);

                var assm = (IXAssembly)doc;
                var refDocs = assm.Configurations.Active.Components.Flatten().GroupBy(x =>
                {
                    try
                    {
                        return x.Path;
                    }
                    catch
                    {
                        Console.WriteLine($"<<Error::Cant resolve path for: {x.Name }>>");
                        return "";
                    }
                }).Where(x => !string.IsNullOrEmpty(x.Key)).Select(x => x.First().Document).Where(x => x.IsCommitted).ToList();

                refDocs = refDocs.Prepend(assm).ToList();

                foreach (var refDoc in refDocs)
                {
                    if (refDoc.Path.Contains("IC~~"))
                    {
                        continue;
                    }

                    var row = prpsTable.NewRow();
                    row[FILE_PATH_COLUMN_NAME] = refDoc.Path;

                    //active props
                    foreach (var prp in refDoc.Configurations.Active.Properties)
                    {
                        try
                        {
                            if (prp.Value == null || String.IsNullOrEmpty(prp.Value.ToString()) || prp.Value == DBNull.Value)
                            {
                                continue;
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"<<Error::Unable to retrieve property: {prp.Name} : {ex.Message} >>");
                            continue;
                        }

                        var col = prpsTable.Columns[prp.Name];

                        if (col == null)
                        {
                            col = prpsTable.Columns.Add(prp.Name);
                        }

                        row[prp.Name] = prp.Value;
                    }

                    // all props
                    foreach (var prp in refDoc.Properties)
                    {
                        try
                        {

                            try
                            {
                                if (prp.Value == null || String.IsNullOrEmpty(prp.Value.ToString()) || prp.Value == DBNull.Value)
                                {
                                    continue;
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"<<Error::Unable to retrieve property: {prp.Name} >>");
                                continue;
                            }

                            var col = prpsTable.Columns[prp.Name];
                            if (col == null)
                            {
                                col = prpsTable.Columns.Add(prp.Name);
                            }
                        }
                        catch
                        {
                            Console.WriteLine("<<Error::Error reading prop {0}>>", prp.Name);
                        }
                    }
                    prpsTable.Rows.Add(row);
                }



                
                try
                {
                    string json = JsonConvert.SerializeObject(prpsTable, Formatting.Indented, new JsonConverter[] { new Newtonsoft.Json.Converters.StringEnumConverter() });
                    File.WriteAllText(output, json);
                    Console.WriteLine("<<Info::Serialized to {0}>>", output);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("<<Error::Error - Writing JSON : {0}>>", ex.Message);
                }

                TreeMeta(swModel, options);
                doc.Close();
                app.Close();
            }
        }

        static void HandleParseErrors(System.Collections.Generic.IEnumerable<Error> errors)
        {
            Console.WriteLine("<<Error::Failed to parse command-line arguments.>>");
        }

        static void Main(string[] args)
        {
            Parser.Default.ParseArguments<Options>(args)
                .WithParsed(options => Run(options))
                .WithNotParsed(errors => HandleParseErrors(errors));
        }
    }
}
