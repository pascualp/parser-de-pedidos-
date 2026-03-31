const text = `011201001 CIRUELA ROJA 3253 10.00 KILO 2.65000 2.65000 26.50
011101012 ACELGA PAK CHOI 439 6.00 KILO 2.95000 2.95000 17.70
011101063 ENDIVIAS BELGAS 3400 6.00 BDJ 1 UNIDAD 1.95000 1.95000 11.70`;

function autoDetect(text){
  if (/CLUB MARTHA/i.test(text) || /Hotels & Resorts Blue Sea/i.test(text) || /club mac/i.test(text) || /^\s*\d+\s+.*\s+\d+(?:[.,]\d+)?\s+(?:[A-Za-z]+|BDJ\s+\d+\s+UNIDAD|BDJ\s+\d+GR\s+\d+\s+UNID1A\.D55000|MJO\s+\d+\s+UNIDAD)\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{2})\s*$/m.test(text)) return "CLUBMARTHA";
  return "HM";
}

console.log("Detected:", autoDetect(text));
