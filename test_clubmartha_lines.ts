import * as fs from 'fs';

function normWS(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function stripDot00(s: string) {
  return s;
}

function getSavedCode(d: string) { return ""; }

const lines = [
  "011201001 CIRUELA ROJA 3253 10.00 KILO 2.50000 2.50000 25.00",
  "HIERBAS AROMATICAS CARACOLES",
  "MALLORCA",
  "011101150 450 1.00 MJO 1 UNIDAD 1.15000 1.15000 1.15",
  "011201071 KIWI ITALIA 3512 10.00 KILO 2.10000 2.10000 21.00",
  "011101148 LECHUGA ICEBERG 3521 10.00 UNIDAD 0.89000 0.89000 8.90",
  "011201015 MANZANA GOLDEN 26 5686 10.00 KILO 1.16000 1.16000 11.60"
];

function parseCLUBMARTHALines(lines: string[]) {
  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];
  
  const tailRegex = /\s+(\d+(?:[.,]\d+)?)\s+((?:[A-Za-z]|\d+[A-Za-z]|BDJ|MJO).*?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)(?:\s+([a-zA-Z\u00C0-\u017F].*))?$/;
  
  let pendingDesc: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    let line = normWS(original);
    
    // Check if it's the 1 \de \d page footer
    if (/^\d+\s+de\s+\d+/.test(line)) continue;
    
    const m = line.match(tailRegex);
    if (m) {
      const cantidad = stripDot00(m[1]);
      const um = m[2];
      const precio = m[3];
      const coste = m[4];
      const importe = m[5];
      const trailingDesc = m[6] ? " " + m[6].trim() : "";
      
      const head = line.replace(tailRegex, "").trim();
      
      let producto = "";
      let descAndProv = head;
      let codProv = "";
      
      const headMatch = head.match(/^(\d{6,})\s+(.*)$/);
      if (headMatch) {
         producto = headMatch[1];
         descAndProv = headMatch[2];
      } else {
         if (pendingDesc.length > 0) {
             const pd0Match = pendingDesc[0].match(/^(\d{6,})\s+(.*)$/);
             if (pd0Match) {
                 producto = pd0Match[1];
                 pendingDesc[0] = pd0Match[2];
             }
         }
      }
      
      if (/^\d+$/.test(descAndProv)) {
          codProv = descAndProv;
          descAndProv = "";
      } else {
          const provMatch = descAndProv.match(/^(.*?)\s+(\d+)$/);
          if (provMatch) {
            descAndProv = provMatch[1];
            codProv = provMatch[2];
          } else if (!descAndProv.trim()) {
            if (pendingDesc.length > 0) {
              const lastIndex = pendingDesc.length - 1;
              const matchLast = pendingDesc[lastIndex].match(/^(.*?)\s+(\d+)$/);
              if (matchLast) {
                 pendingDesc[lastIndex] = matchLast[1];
                 codProv = matchLast[2];
              }
            }
          }
      }
      
      const desc = normWS([...pendingDesc, descAndProv, trailingDesc].join(" "));
      pendingDesc = [];
      
      if (!codProv) codProv = getSavedCode(desc);
      rows.push([producto, desc, codProv, cantidad, um, precio, coste, importe]);
    } else {
      pendingDesc.push(line);
    }
  }
  
  return { rows, errors };
}

console.dir(parseCLUBMARTHALines(lines), {depth: null});
