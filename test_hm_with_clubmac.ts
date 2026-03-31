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
function looksLikeTrashHM(line) {
  return /^(Referencia|Artículo|Descripción|M\.C\.|Cant\.|Bonif\.|Precio|Dto1|Dto2|Dto3|Importe|P[áa]gina|Albar[áa]n|Factura|Fecha|Cliente|Direcci[óo]n|Tel[ée]fono|Email|NIF|CIF|Observaciones|Comentarios)/i.test(line);
}

function joinBrokenLines(lines, fmt){
  const out = [];

  function clean(raw){
    let t = (raw ?? "").trim();
    if (!t) return "";
    t = t.replace(/\s+/g, " ").trim();
    if (!t) return "";
    if (looksLikeTotalsOrFooter(t) || looksLikeTrashCommon(t)) return "";
    if (fmt === "HM" && looksLikeTrashHM(t)) return "";
    return t;
  }

  let prevEndsWithHMTail = false;

  for (const raw0 of lines) {
    const t0 = clean(raw0);
    if (!t0) continue;

    const isHMTail = /\d+,\d{4}\s+(?:\d+,\d{2}\s+){0,3}\d+,\d{2}$/;
    prevEndsWithHMTail = out.length > 0 && isHMTail.test(out[out.length - 1]);

    const starter = (fmt === "HM") ? (/^\d+\s+/.test(t0) || prevEndsWithHMTail) : false;

    if (starter) out.push(t0);
    else if (out.length) out[out.length - 1] = normWS(out[out.length - 1] + " " + t0);
  }
  return out;
}

const merged = joinBrokenLines(lines, "HM");
console.log("Merged:", merged.length);
