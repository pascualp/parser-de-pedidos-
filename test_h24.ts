import { readFileSync } from "fs";

const RE_H24_INLINE = /^\s*(\d+)\s+(\d+)\s+(.+?)\s+(\d+,\d{2})\s+([A-Za-z]{1,5}|PAQ|paq|KG|kg|UN|un)\s+Precio\s+Unit\.\s+(\d+,\d{2})\s+(\d+,\d{2})\s*$/i;
const RE_H24_PRICE_NO_CODE = /^\s*(.+?)\s+(\d+,\d{2})\s+([A-Za-z]{1,5}|PAQ|paq|KG|kg|UN|un)\s+Precio\s+Unit\.\s+(\d+,\d{2})\s+(\d+,\d{2})\s*$/i;
const RE_H24_CODE_REFP = /^\s*(\d+)\s+(\d+)\s*$/;

const RE_INT     = /^\d+$/;
const RE_MONEY2  = /^\d+,\d{2}$/;

function looksLikeTotalsOrFooter(line: string){
  return /Subtotal|Base Imponible|Importe Total|Euros|Base imponible|IVA total|Total pedido|HOJA DE PEDIDO|DESCRIPCION|Depto\./i.test(line);
}
function looksLikeTrashCommon(line: string){
  return /^(Pedido\b|\d+\s*\/\s*\d+\s*$|\d+\s+de\s+\d+$|\d+\s+-K-$)/i.test(line);
}
function normWS(s: string){ return (s ?? "").replace(/\s+/g, " ").trim(); }

function normalizeH24Unit(up: string) {
  up = up.toUpperCase().replace(/\./g, "");
  if (up === "UN") return "un";
  if (up === "KG") return "kg";
  if (up === "PAQ") return "PAQ";
  return up;
}

function parseH24(lines: string[]){
  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];

  let pendingDesc: string[] = [];
  let pendingPrice: any = null;
  let pendingCode: any = null;

  function flushIfReady(){
    if (pendingPrice && pendingCode) {
      const desc = normWS([...pendingDesc, pendingPrice.desc].join(" "));
      rows.push([pendingCode.code, pendingCode.refp, desc, pendingPrice.qty, pendingPrice.um, pendingPrice.unitPrice, pendingPrice.amount]);
      pendingDesc = [];
      pendingPrice = null;
      pendingCode = null;
    }
  }

  for (const raw0 of lines){
    let line = normWS(raw0);
    if (!line) continue;
    if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line)) continue;
    if (/^Pedido\s+H24/i.test(line)) continue;

    let m = line.match(RE_H24_INLINE);
    if (m) {
      const code = m[1], refp = m[2], desc0 = m[3].trim();
      const qty = m[4], um = normalizeH24Unit(m[5]), unitPrice = m[6], amount = m[7];

      if (!RE_INT.test(code) || !RE_INT.test(refp) || !RE_MONEY2.test(qty) || !RE_MONEY2.test(unitPrice) || !RE_MONEY2.test(amount)) {
        errors.push({ original: raw0, reason:"Campos numéricos inválidos en H24 (inline)." });
        continue;
      }
      const desc = normWS([...pendingDesc, desc0].join(" "));
      pendingDesc = [];

      rows.push([code, refp, desc, qty, um, unitPrice, amount]);
      pendingPrice = null; pendingCode = null;
      continue;
    }

    m = line.match(RE_H24_CODE_REFP);
    if (m) {
      pendingCode = { code: m[1], refp: m[2] };
      flushIfReady();
      continue;
    }

    if (/Precio\s+Unit\./i.test(line)) {
      m = line.match(RE_H24_PRICE_NO_CODE);
      if (!m) {
        errors.push({ original: raw0, reason:"Línea con Precio Unit. no reconocida (H24)." });
        continue;
      }
      const desc = m[1].trim();
      const qty = m[2];
      const um = normalizeH24Unit(m[3]);
      const unitPrice = m[4];
      const amount = m[5];

      if (!RE_MONEY2.test(qty) || !RE_MONEY2.test(unitPrice) || !RE_MONEY2.test(amount)) {
        errors.push({ original: raw0, reason:"Cantidad/Precio/Importe inválidos (H24)." });
        continue;
      }

      pendingPrice = { desc, qty, um, unitPrice, amount };
      flushIfReady();
      continue;
    }

    pendingDesc.push(line);
  }

  if (pendingPrice || pendingCode) {
    errors.push({ original: "(fin de texto)", reason:"H24 incompleto: quedó un precio sin código/refprov o viceversa." });
  }

  return rows;
}

const lines = readFileSync("test.txt", "utf8").split("\n");
const result = parseH24(lines);
console.log(result);
