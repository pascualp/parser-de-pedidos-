const lines = `cap de mar

37VER0595 PERA CONFERENCIA (nacional) 6004 5,00 KG 1,10000 1,10000 5,50
38VER0135 ALBAHACA (balear 1ª) 70 4,00 UNIDAD 2,25000 2,25000 9,00
38VER0160 APIO BLANCO (nacional) 3080 1,00 BOLSA 1,40000 1,40000 1,40
38VER0210 CANONIGO BARQUETA (nacional) 488 6,00 UNIDAD 1,55000 1,55000 9,30
CEBOLLA PELADA ENTERA 5KG (balear
1ª)
38VER0225 234 5,00 KG 1,70000 1,70000 8,50
38VER0295 COL CHINA (balear 1ª) 7305 2,00 UNIDAD 1,80000 1,80000 3,60
38VER0305 COL LOMBARDA (balear 1ª) 7303 2,00 UNIDAD 0,90000 0,90000 1,80
38VER0310 COL REPOLLO (balear 1ª) 7302 2,00 KG 0,90000 0,90000 1,80
38VER0320 ENSALADA MEZCLUM (nacional) 447 4,00 KG 8,00000 8,00000 32,00
38VER0390 LAUREL HOJAS (balear 1ª) 500 2,00 MANOJO 0,95000 0,95000 1,90
38VER0630 PIMIENTO ROJO (nacional) 4720 5,00 KG 1,99000 1,99000 9,95
38VER0641 PIMIENTO VERDE (balear 1ª) 7729 5,00 KG 1,69000 1,69000 8,45
38VER0690 ROMERO (balear 1ª ) 451 6,00 MANOJO 1,25000 1,25000 7,50
38VER0700 RUCULA bandeja (nacional) 482 6,00 UNIDAD 1,60000 1,60000 9,60
38VER0746 TOMATE G (balear 1ª) 7905 10,00 KG 2,39000 2,39000 23,90
38VER0766 TOMATE PERA (balear 1ª) 7906 50,00 KG 2,75000 2,75000 137,50
38VER0811 ZANAHORIA BOLSA 5KG (nacional) 1980 5,00 KG 0,88000 0,88000 4,40`.split('\n');

function normWS(s) { return (s ?? "").replace(/\s+/g, " ").trim(); }
function looksLikeTotalsOrFooter(line){
  return /Subtotal|Base Imponible|Importe Total|Euros|Base imponible|IVA total|Total pedido|HOJA DE PEDIDO|DESCRIPCION|Depto\./i.test(line);
}
function looksLikeTrashCommon(line){
  return /^(Pedido\b|^\d+\s*\/\s*\d+\s*$)/i.test(line);
}
function looksLikeTrashCAPDEMAR(line) {
  return /^(Cap de mar|Pedido|Total|Subtotal|IVA|Base|Fecha|Proveedor)/i.test(line);
}

const rows = [];
const errors = [];
let pendingDesc = [];

for (const raw of lines) {
  let line = normWS(raw);
  if (!line) continue;
  if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line) || looksLikeTrashCAPDEMAR(line)) continue;

  const tailRegex = /\s+(\d+(?:,\d+)?)\s+([A-Za-z.]+)\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)$/;
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

console.log("Errors:", errors);
