const tailRegex = /\s+(\d+(?:[.,]\d+)?)\s+((?:[A-Za-z]|\d+[A-Za-z]).*?)\s+(\S+)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)$/;

const lines = [
  "12345 Tomates 987 10 BDJ 5 KG 1.55000 1.55000 15.50",
  "12345 Tomates 10 KG 1.55000 1.55000 15.50",
  "12345 Tomates 10 5KG 1.55000 1.55000 15.50",
  "12345 Tomates 10 BDJ 5GR 1 UNID1A.D55000 1.55000 1.55000 15.50",
  "12345 Tomates 987 10 5KG 1.55000 1.55000 15.50",
];

for (const line of lines) {
  const m = line.match(tailRegex);
  if (m) {
    console.log(`MATCH: ${line}`);
    console.log(`  m[1] (cant): ${m[1]}`);
    console.log(`  m[2] (um):   ${m[2]}`);
    console.log(`  m[3] (prec): ${m[3]}`);
    console.log(`  m[4] (cost): ${m[4]}`);
    console.log(`  m[5] (imp):  ${m[5]}`);
  } else {
    console.log(`NO MATCH: ${line}`);
  }
}
