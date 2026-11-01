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

namespace model_reader
{
    class Program
    {
        
        static void Main(string[] args)
        {
            using(var app = SwApplicationFactory.Create(SwVersion_e.Sw2020, ApplicationState_e.Background))
            {


                var _args = Environment.GetCommandLineArgs();
                var output = "";
                var input = "";
                if (_args.Length == 1)
                {
                    Console.WriteLine("Need at least one argument : Input path");
                    return;
                }
                else if (_args.Length == 2)
                {
                    input = _args[1];
                    output = Path.Combine(new FileInfo(input).Directory.FullName, Path.GetFileNameWithoutExtension(input) + ".json");
                }
                else if (_args.Length == 3)
                {
                    input = _args[1];
                    output = _args[2];
                }


                Console.WriteLine("Convert {0} to {1} ", input, output);

                var file = Path.Combine(Path.GetDirectoryName(typeof(Program).Assembly.Location), @"template\600_GearBrackets\600_GlobalAssembly.SLDASM");
                var doc = (ISwDocument)app.Documents.Open(input, DocumentState_e.ReadOnly);

                Console.WriteLine("Read {0}",input);

                const string FILE_PATH_COLUMN_NAME = "File Path";
                var prpsTable = new DataTable();
                prpsTable.Columns.Add(FILE_PATH_COLUMN_NAME);

                var assm = (IXAssembly)doc;
                var refDocsAll = assm.Configurations.Active.Components.Flatten().GroupBy(x =>
                {
                    try
                    {
                        return x.Path;
                    }
                    catch
                    {
                        return "";
                    }
                }).Select(x => x.First().Document).ToList();

                var refDocs = assm.Configurations.Active.Components.Flatten()
                .GroupBy(x =>
                {
                    try
                    {
                        return x.Path;
                    }
                    catch
                    {
                        return "";
                    }
                }).Where(x => !string.IsNullOrEmpty(x.Key))
                .Select(x => x.First().Document)
                .Where(x => x.IsCommitted).ToList();

                refDocs = refDocs.Prepend(assm).ToList();

                foreach (var refDoc in refDocs)
                {

                    if (refDoc.Path.Contains("IC~~")){
                        continue;
                    }

                    var row = prpsTable.NewRow();
                    row[FILE_PATH_COLUMN_NAME] = refDoc.Path;
                    foreach (var prp in refDoc.Configurations.Active.Properties)
                    {
                        if (prp.Value == null || String.IsNullOrEmpty(prp.Value.ToString()) || prp.Value == DBNull.Value)
                        {
                            continue;
                        }

                        var col = prpsTable.Columns[prp.Name];

                        if (col == null)
                        {
                            col = prpsTable.Columns.Add(prp.Name);
                        }

                        row[prp.Name] = prp.Value;
                    }


                    foreach (var prp in refDoc.Properties)
                    {
                        if (prp.Value == null || String.IsNullOrEmpty(prp.Value.ToString()) || prp.Value == DBNull.Value)
                        {
                            continue;
                        }

                        var col = prpsTable.Columns[prp.Name];

                        if (col == null)
                        {
                            col = prpsTable.Columns.Add(prp.Name);
                        }
                        
                    }

                    prpsTable.Rows.Add(row);
                    Console.WriteLine("Parsing {0}", row[FILE_PATH_COLUMN_NAME]);
                }
                Console.WriteLine("Serialize to {0}", output);
                string json = JsonConvert.SerializeObject(prpsTable, Formatting.Indented, new JsonConverter[] { new Newtonsoft.Json.Converters.StringEnumConverter() });
                // Console.Write(json);
                File.WriteAllText(output, json);
                app.Close();
            }
        }
    }
}
