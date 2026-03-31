const lines = `38VER0700 RUCULA bandeja (nacional) 482
1,00 UNIDAD 1,50000 1,50000 1,50`.split('\n');

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
      let headTokens = head ? head.split(" ") : [];
      
      let codigo = "";
      let codProv = "";
      let inlineDesc = "";

      if (headTokens.length === 0) {
        if (pendingDesc.length > 0) {
          const fullPending = pendingDesc.join(" ").trim();
          const pendingTokens = fullPending.split(" ");
          codigo = pendingTokens[0];
          if (pendingTokens.length > 1 && /^\d+$/.test(pendingTokens[pendingTokens.length - 1])) {
            codProv = pendingTokens[pendingTokens.length - 1];
            inlineDesc = pendingTokens.slice(1, pendingTokens.length - 1).join(" ");
          } else {
            inlineDesc = pendingTokens.slice(1).join(" ");
          }
          pendingDesc = [];
        } else {
          errors.push({ original: raw, reason: "Línea sin código ni descripción previa" });
          continue;
        }
      } else {
        codigo = headTokens[0];
        if (headTokens.length > 1 && /^\d+$/.test(headTokens[headTokens.length - 1])) {
          codProv = headTokens[headTokens.length - 1];
          inlineDesc = headTokens.slice(1, headTokens.length - 1).join(" ");
        } else {
          inlineDesc = headTokens.slice(1).join(" ");
        }
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

const res = parseCAPDEMAR(lines);
console.log("Rows:", res.rows);
console.log("Errors:", res.errors);
