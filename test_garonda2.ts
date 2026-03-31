function normWS(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function parseGARONDA(line: string) {
  const original = line;
  line = normWS(line);
  
  // Fix OCR errors like KIL1O.50000 -> KILO 1.50000
  // or KIL1O.50000 -> KILO 1.50000
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
  "011101158 CEBOLLA MORADA 235 3.00 KILO 1.40000 1.40000 4.20",
  "011101128 CHALOTA 66 6.00 BLS 250GR 0.25 KIL1O.50000 1.50000 9.00",
  "011101077 CHIRIVIA 3306 5.00 KILO 2.35000 2.35000 11.75",
  "011101046 FLOR FRESCA COMESTIBLE 9002 1.00 BDJ 1 UNIDAD 5.50000 5.50000 5.50",
  "011201053 MANZANA GRAN SMITH 5566 5.00 KILO 2.30000 2.30000 11.50",
  "011201074 PERA ERCOLINA 6200 5.00 KILO 2.20000 2.20000 11.00",
  "011201030 PIÑA TROPICAL DEL MONTE 3745 30.00 KILO 1.75000 1.75000 52.50",
  "011101071 RABANITOS 830 1.00 MJO 1 UNIDAD 1.25000 1.25000 1.25",
  "011101014 TOMATE BOLA 9907 5.00 KILO 2.10000 2.10000 10.50",
  "011101072 TOMATE CHERRY RAMA 9044 3.00 KILO 4.95000 4.95000 14.85",
  "011101274 TOMATE PERA MALLORCA 7906 15.00 KILO 2.85000 2.85000 42.75",
  "011101051 NABOS 518 1.00 KILO 2.50000 2.50000 2.50",
  "011101125 RAIZ APIO 3472 1.00 KILO 2.35000 2.35000 2.35",
  "011101079 HINOJO RAIZ 3470 1.00 KILO 2.55000 2.55000 2.55",
  "011201075 ZUMO NARANJA NATURAL HPP 9979 10.00 GFA 5L 5 LITRO 13.75000 13.75000 137.50",
  "011101218 BERENJENA MALLORCA 7123 5.00 KILO 1.65000 1.65000 8.25",
  "011101219 CALABACIN NEGRO MALLORCA 7180 5.00 KILO 1.59000 1.59000 7.95",
  "011101222 CEBOLLINO MANOJO MALLORCA 55 1.00 MJO 1 UNIDAD 2.25000 2.25000 2.25",
  "011101216 CILANTRO MANOJO MALLORCA 454 1.00 MJO 1 UNIDAD 1.30000 1.30000 1.30",
  "011101237 TOMATE EXTRA MALLORCA 7905 5.00 KILO 2.20000 2.20000 11.00"
];

for (const line of lines) {
  const res = parseGARONDA(line);
  if (!res.ok) {
    console.log(`ERR: ${line}`);
  }
}
