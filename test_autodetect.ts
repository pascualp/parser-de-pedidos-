const text2 = `38VER0595 PERA CONFERENCIA (nacional) 6004 5,00 KG 1,10000 1,10000 5,50
38VER0135 ALBAHACA (balear 1ª) 70 4,00 UNIDAD 2,25000 2,25000 9,00`;

function autoDetect(text){
  if (/^\s*\d+\s+.*\s+\d+(?:[.,]\d+)?\s+\S+\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{2})\s*$/m.test(text)) return "CLUBMARTHA";
  if (/^\s*\d+[A-Za-z]+\d+\s+.*\s+\d+(?:[.,]\d+)?\s+[A-Za-z.\/]+\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{2})\s*$/m.test(text)) return "CAPDEMAR";
  return "HM";
}

console.log("Detected 2:", autoDetect(text2));
