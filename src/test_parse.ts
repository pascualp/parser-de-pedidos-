const text = `CODIGO\tREFERENCIA\tPRECIO\tMEDIDA\tPEDIDO
\t
1150501139\tBERENJENA RALLADA GANDIA\t1,20\tKG\t5,00
1150501155\tCANONIGOS PENINSULA 125GR\t1,60\tPAQ\t10,00
1150501294\tTOMATE 2" ENSALADA MM\t1,05\tKG\t30,00`;

function autoDetect(text) {
  if (/^\s*\d{10}\s+.+\s+\d+(?:[.,]\d+)?\s+[A-Za-z.]+\s+\d+(?:[.,]\d+)?\s*$/m.test(text)) return "NUEVO_FORMATO";
  return "UNKNOWN";
}

console.log("AutoDetect:", autoDetect(text));

const lines = text.split(/\r?\n/);
for (const line of lines) {
  const cleanLine = line.trim();
  if (!cleanLine) continue;
  const m = cleanLine.match(/^(\d{10})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z.]+)\s+(\d+(?:[.,]\d+)?)$/);
  console.log("Line:", cleanLine);
  console.log("Match:", m ? m.slice(1) : null);
}
