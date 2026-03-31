function normWS(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function parseGARONDA(line: string) {
  const original = line;
  line = normWS(line);
  
  // Fix OCR errors like KIL1O.50000 -> KILO 1.50000
  line = line.replace(/([A-Za-z]+)1([A-Za-z]*)\.([0-9]+)/, "$1O$2 1.$3");
  
  const headMatch = line.match(/^(\S+)\s+(.+)$/);
  if (!headMatch) return { ok: false, original, reason: "No se pudo extraer el código" };
  
  const codigo = headMatch[1];
  const rest = headMatch[2];
  
  const tailRegex = /\s+(\d+(?:\.\d+)?)\s+((?:[A-Za-z]|\d+[A-Za-z]).*?)\s+(\S+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
  const m2 = rest.match(tailRegex);
  
  if (!m2) return { ok: false, original, reason: "No coincide con el formato" };
  
  let descAndProv = rest.replace(tailRegex, "").trim();
  let codProv = "";
  const provMatch = descAndProv.match(/^(.*?)\s+(\d+)$/);
  if (provMatch) {
    descAndProv = provMatch[1];
    codProv = provMatch[2];
  }
  
  const cantidad = m2[1];
  const um = m2[2];
  const precio = m2[3];
  const coste = m2[4];
  const importe = m2[5];
  
  return { ok: true, row: [codigo, descAndProv, codProv, cantidad, um, precio, coste, importe], original };
}

const lines = [
  "011101011 AJO TIERNO 47 1.00 BDJ 100GR 1 BDJ 2.25000 2.25000 2.25",
  "011101026 CEBOLLA BLN 231 5.00 KILO 1.60000 1.60000 8.00",
  "011101128 CHALOTA 66 6.00 BLS 250GR 0.25 KIL1O.50000 1.50000 9.00",
  "011201075 ZUMO NARANJA NATURAL HPP 9979 10.00 GFA 5L 5 LITRO 13.75000 13.75000 137.50"
];

for (const line of lines) {
  console.log(parseGARONDA(line));
}
