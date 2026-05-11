import { readFileSync } from "fs";

function normWS(s) { return (s ?? "").replace(/\s+/g, " ").trim(); }
function stripDot00(s) { return s; }
function looksLikeTotalsOrFooter(line) { return false; }
function looksLikeTrashCommon(line) { return false; }
function looksLikeTrashCAPDEMAR(line) { return false; }

async function parseCAPDEMAR(lines: string[]) {
  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];

  let pendingDesc: string[] = [];

  for (const raw of lines) {
    let line = normWS(raw);
    if (!line) continue;
    if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line) || looksLikeTrashCAPDEMAR(line)) continue;

    const tailRegex = /\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z].*?)\s+(\d+(?:[.,]\d+)?)(?:\s+(\d+(?:[.,]\d+)?))?\s+(\d+(?:[.,]\d+)?)\s*$/;
    const m = line.match(tailRegex);

    if (m) {
      const cantidad = m[1];
      const um = m[2];
      const precio = m[3].replace(/[^\d.,]/g, '');
      const precio2 = m[4] ? m[4].replace(/[^\d.,]/g, '') : precio;
      const importe = m[5];

      const head = line.replace(tailRegex, "").trim();
      let headTokens = head ? head.split(" ") : [];
      
      let codigo = "";
      let codProv = "";
      let inlineDesc = "";

      if (headTokens.length === 0) {
        // The head is entirely in pendingDesc
        if (pendingDesc.length > 0) {
           const last = pendingDesc[pendingDesc.length - 1];
           const lastTokens = last.split(" ");
           if (lastTokens.length >= 2 && /^\d+$/.test(lastTokens[0]) && /^\d+$/.test(lastTokens[1])) {
               codigo = lastTokens[0];
               codProv = lastTokens[1];
               inlineDesc = lastTokens.slice(2).join(" ");
               pendingDesc.pop();
           } else if (lastTokens.length >= 1 && /^\d+$/.test(lastTokens[0])) {
               codigo = lastTokens[0];
               codProv = "(saved)";
               inlineDesc = lastTokens.slice(1).join(" ");
               pendingDesc.pop();
           }
        }
      } else {
        if (headTokens.length >= 2 && /^\d+$/.test(headTokens[0]) && /^\d+$/.test(headTokens[1])) {
            codigo = headTokens[0];
            codProv = headTokens[1];
            inlineDesc = headTokens.slice(2).join(" ");
        } else if (headTokens.length >= 1 && /^\d+$/.test(headTokens[0])) {
            codigo = headTokens[0];
            codProv = "(saved)";
            inlineDesc = headTokens.slice(1).join(" ");
        } else {
            inlineDesc = head;
        }
      }

      let descAndProv = normWS([...pendingDesc, inlineDesc].join(" "));
      pendingDesc = [];

      rows.push([codigo, descAndProv, codProv, cantidad, um, precio, precio2, importe]);
    } else {
      pendingDesc.push(line);
    }
  }

  return { rows, errors };
}

async function run() {
    const text = readFileSync("test.txt", "utf8");
    const lines = text.split("\n");
    const res = await parseCAPDEMAR(lines);
    console.log(res);
}

run();
