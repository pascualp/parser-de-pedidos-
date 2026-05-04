const tailRegex = /\s+(\d+(?:[.,]\d+)?)\s+((?:[A-Za-z]|\d+[A-Za-z]|BDJ|MJO).*?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)(?:\s+([a-zA-Z\u00C0-\u017F].*))?$/;
const lines = [
  "011201001 CIRUELA ROJA",
  "HIERBAS AROMATICAS CARACOLES MALLORCA 011101 3253 10 KILO 2.50 2.50 25.00",
  "DE TEMPORADA 3253 10 KILO 2.50 2.50 25.00"
];

for (const line of lines) {
  const head = line.replace(tailRegex, "");
  console.log("Line:", line);
  console.log("Head:", head);
  console.log("Contains 6-digit?", /\b\d{6,10}\b/.test(head));
}
