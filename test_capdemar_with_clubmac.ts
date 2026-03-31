const lines = `es club mac
011201001 CIRUELA ROJA 3253 10.00 KILO 2.65000 2.65000 26.50
011101012 ACELGA PAK CHOI 439 6.00 KILO 2.95000 2.95000 17.70
011101063 ENDIVIAS BELGAS 3400 6.00 BDJ 1 UNIDAD 1.95000 1.95000 11.70`.split('\n');

function normWS(s) { return (s ?? "").replace(/\s+/g, " ").trim(); }
function looksLikeTotalsOrFooter(line){
  return /Subtotal|Base Imponible|Importe Total|Euros|Base imponible|IVA total|Total pedido|HOJA DE PEDIDO|DESCRIPCION|Depto\./i.test(line);
}
function looksLikeTrashCommon(line){
  return /^(Pedido\b|^\d+\s*\/\s*\d+\s*$|^\d+\s+de\s+\d+$)/i.test(line);
}
function looksLikeTrashCAPDEMAR(line) {
  return /^(Cap de mar|Pedido|Total|Subtotal|IVA|Base|Fecha|Proveedor|P[áa]gina|Albar[áa]n|Factura|Cliente|Direcci[óo]n|Tel[ée]fono|Email|NIF|CIF|Observaciones|Comentarios)/i.test(line);
}

function parseCAPDEMAR(lines) {
  const rows = [];
  const errors = [];

  let pendingDesc = [];

  for (const raw of lines) {
    let line = normWS(raw);
    if (!line) continue;
    if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line) || looksLikeTrashCAPDEMAR(line)) continue;

    const tailRegex = /\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z.\/]+)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)$/;
    const m = line.match(tailRegex);

    if (m) {
      const cantidad = m[1];
      const um = m[2];
      const precio = m[3];
      const precio2 = m[4];
      const importe = m[5];

      const head = line.replace(tailRegex, "").trim();
      const headTokens = head.split(" ");
      
      if (headTokens.length < 1) {
        errors.push({ original: raw, reason: "Línea sin código" });
        continue;
      }
      
      const codigo = headTokens[0];
      let codProv = "";
      let inlineDesc = "";

      if (headTokens.length > 1 && /^\d+$/.test(headTokens[headTokens.length - 1])) {
        codProv = headTokens[headTokens.length - 1];
        inlineDesc = headTokens.slice(1, headTokens.length - 1).join(" ");
      } else {
        inlineDesc = headTokens.slice(1).join(" ");
      }
      
      const desc = normWS([...pendingDesc, inlineDesc].join(" "));
      pendingDesc = [];
      
      rows.push([codigo, desc, codProv, cantidad, um, precio, precio2, importe]);
    } else {
      pendingDesc.push(line);
    }
  }

  if (pendingDesc.length > 0) {
    errors.push({ original: "(fin de texto)", reason: "Quedó texto sin procesar al final (CAP DE MAR): " + pendingDesc.join(" | ") });
  }

  return { rows, errors };
}

function joinBrokenLines(lines, fmt){
  const out = [];

  function clean(raw){
    let t = (raw ?? "").trim();
    if (!t) return "";
    t = t.replace(/\s+/g, " ").trim();
    if (!t) return "";
    if (looksLikeTotalsOrFooter(t) || looksLikeTrashCommon(t)) return "";
    if (fmt === "CAPDEMAR" && looksLikeTrashCAPDEMAR(t)) return "";
    return t;
  }

  for (const raw0 of lines) {
    const t0 = clean(raw0);
    if (!t0) continue;

    const starter = (fmt === "CAPDEMAR") ? /^\d+[A-Za-z]+\d+\s+/.test(t0) : false;

    if (starter) out.push(t0);
    else if (out.length) out[out.length - 1] = normWS(out[out.length - 1] + " " + t0);
  }
  return out;
}

const merged = joinBrokenLines(lines, "CAPDEMAR");
console.log("Merged:", merged.length);
const res = parseCAPDEMAR(merged);
console.log("Rows:", res.rows.length);
console.log("Errors:", res.errors);
