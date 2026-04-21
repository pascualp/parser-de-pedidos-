const text = `CODIGO	REFERENCIA	PRECIO	MEDIDA	PEDIDO
	
1150501155	CANONIGOS PENINSULA 125GR		PAQ	1,60	6,00
1150521406	NARANJAS 1º		KG	1,25	20,00
1150531418	PERAS BLANQUILLA 24 -K-		KG	1,60	10,00`;

function autoDetect(text) {
  // Flexible detection: 10 digits followed by at least 3 parts (price/unit/qty)
  if (/^\s*\d{10}\s+.+\s+\S+\s+\S+\s+[\d,.]+\s*$/m.test(text)) return "NUEVO_FORMATO";
  return "UNKNOWN";
}

console.log("AutoDetect:", autoDetect(text));

const lines = text.split(/\r?\n/).filter(l => l.trim());
for (const line of lines) {
  const cleanLine = line.replace(/\s+/g, " ").trim();
  if (!cleanLine || /CODIGO|REFERENCIA/.test(cleanLine)) continue;
  
  // Robust match: CODE(10) ... DESC ... [UNIT/PRICE] [PRICE/UNIT] QTY
  const m = cleanLine.match(/^(\d{10})\s+(.+?)\s+(\S+)\s+(\S+)\s+(\d+(?:[.,]\d+)?)$/);
  console.log("Line:", cleanLine);
  if (m) {
      const codigo = m[1];
      const desc = m[2].trim();
      const p1 = m[3];
      const p2 = m[4];
      const qty = m[5];
      console.log("Match:", [codigo, desc, p1, p2, qty]);
  } else {
      console.log("Match: null");
  }
}
