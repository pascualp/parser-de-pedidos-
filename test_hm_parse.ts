const lines = [
  "011201001 CIRUELA ROJA 3253 10.00 KILO 2.65000 2.65000 26.50",
  "011101012 ACELGA PAK CHOI 439 6.00 KILO 2.95000 2.95000 17.70",
  "011101063 ENDIVIAS BELGAS 3400 6.00 BDJ 1 UNIDAD 1.95000 1.95000 11.70"
];

function parseHM(line) {
  const original = line;
  const RE_WORD = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/;
  const HM_MC = new Set(["Kg","Ud","Paq","Caja","Bulto","Mjo","Manojo","Unidad","UNIDAD","KG"]);

  const tailRegex = /\s+([A-Za-z]+)\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)\s+(\d+,\d{4})\s+(?:\d+,\d{2}\s+){0,3}(\d+,\d{2})$/;
  const m = line.match(tailRegex);
  if (!m) return { ok:false, original, reason:"No coincide con el formato de precios/cantidades esperado" };
  
  const mc = m[1];
  if (!HM_MC.has(mc) && !RE_WORD.test(mc)) return { ok:false, original, reason:`M.C. inválida: "${mc}"` };

  const cant = m[2];
  const bonif = m[3];
  const precio = m[4];
  const importe = m[5];

  const head = line.replace(tailRegex, "").trim();
  const headMatch = head.match(/^(\d+)\s+(.*)$/);
  if (!headMatch) return { ok:false, original, reason:"Falta código de artículo o descripción" };

  const ref = headMatch[1];
  const desc = headMatch[2];

  return { ok:true, row:[ref, desc, mc, cant, bonif, precio, "", "", "", importe], original };
}

let errors = 0;
let rows = 0;
for (const line of lines) {
  const res = parseHM(line);
  if (res.ok) rows++;
  else errors++;
}
console.log("Rows:", rows, "Errors:", errors);
