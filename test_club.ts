import { readFileSync } from "fs";

function normWS(s) { return (s ?? "").replace(/\s+/g, " ").trim(); }
function stripDot00(s) { return s; }
function looksLikeTotalsOrFooter(line) { return false; }
function looksLikeTrashCommon(line) { return false; }
function looksLikeTrashCLUBMARTHA(line) { return false; }

async function parseCLUBMARTHA(lines: string[]) {
  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];
  
  // Robust regex: matches Quantity, UM (text), Precio, optional Coste, Total
  const tailRegex = /\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z].*?)\s+(\d+(?:[.,]\d+)?)(?:\s+(\d+(?:[.,]\d+)?))?\s+(\d+(?:[.,]\d+)?)\s*$/;
  
  let pendingDesc: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    let line = normWS(original);
    if (!line) continue;
    
    if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line) || looksLikeTrashCLUBMARTHA(line)) continue;
    
    const m = line.match(tailRegex);
    if (m) {
      const cantidad = stripDot00(m[1]);
      const um = m[2];
      const precio = m[3].replace(/[^\d.,]/g, '');
      const coste = m[4] ? m[4].replace(/[^\d.,]/g, '') : precio;
      const importe = m[5];
      
      const head = line.replace(tailRegex, "").trim();
      
      let producto = "";
      let descAndProv = head;
      let codProv = "";
      
      const headMatch = head.match(/^(\d{6,11})\s+(.*)$/);
      if (headMatch) {
         producto = headMatch[1];
         descAndProv = headMatch[2];
      }
      
      if (/^\s*\d+\s*$/.test(descAndProv)) {
          codProv = descAndProv.trim();
          descAndProv = "";
      } else {
          const provMatch = descAndProv.match(/^(.*?)\s+(\d+)$/);
          if (provMatch) {
            descAndProv = provMatch[1];
            codProv = provMatch[2];
          }
      }
      
      const desc = normWS([...pendingDesc, descAndProv].join(" "));
      pendingDesc = [];
      
      if (!codProv) codProv = "(saved)";
      rows.push([producto, desc, codProv, cantidad, um, precio, coste, importe]);
    } else {
      pendingDesc.push(line);
    }
  }
  
  return { rows };
}

async function run() {
    const text = readFileSync("test.txt", "utf8");
    const lines = text.split("\n");
    const res = await parseCLUBMARTHA(lines);
    console.log(res);
}

run();
