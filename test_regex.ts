const t = "38VER0595 PERA CONFERENCIA (nacional) 6004 5,00 KG 1,10000 1,10000 5,50";
const r = /^\s*\d+[A-Za-z]+\d+\s+.*\s+\d+(?:[.,]\d+)?\s+[A-Za-z.\/]+\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{2})\s*$/m;
console.log(r.test(t));
