const xlsx = require("xlsx");

const data = [
  { FunctionalCodeSet: "SKI780", Group: "Group P (readable)", Codes: ["P0","P1","P2","P3","P4","P5","P6","P7","P8","P9","PA","PB"] },
  { FunctionalCodeSet: "SKI780", Group: "Group A (readable)", Codes: ["A0","A1","A2","A5","A6","A7","A8","A9","AA","AB","AC"] }
];

const rows = data.flatMap(({ FunctionalCodeSet, Group, Codes }) =>
  Codes.map(code => ({ FunctionalCodeSet, Group, Code: code }))
);

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(rows);
xlsx.utils.book_append_sheet(wb, ws, "SKI780 Codes");

ws['!freeze']     = { ySplit: 1 };               // freeze header row
ws['!autofilter'] = { ref: `A1:C${rows.length+1}` };
ws['!cols']       = [ { wch: 18 }, { wch: 22 }, { wch: 6 } ]; // or compute

xlsx.writeFile(wb, "SKI780_Functional_Codes.xlsx");
console.log("✓  SKI780_Functional_Codes.xlsx created with proper column widths!");
