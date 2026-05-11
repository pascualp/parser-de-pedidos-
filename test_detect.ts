import { readFileSync } from "fs";

function detectFormat(text: string) {
  if (/^\s*\d{10}\s+.+\s+\S+\s+\S+\s+[\d,.]+\s*$/m.test(text)) return "NUEVO_FORMATO";
  if (/Pedido\s+H24/i.test(text)) return "H24";
  if (/\bPrecio\s+Unit\.\b/i.test(text) && /^\s*\d+\s+\d+\s+.+\s+\d+,\d{2}\s+\w+\s+Precio\s+Unit\./mi.test(text)) return "H24";
  if (/Precio\s+Unit\./i.test(text) && /\b\d+\|\d+\b/.test(text)) return "NIUUT";
  if (/^\s*\d{9}\s+.+\s+\d+\s+\d+,\d{2}\s+[A-Za-z]{1,5}(\s+\d+)?\s*$/m.test(text)) return "CARIBBEAN";
  if (/\s%\s*\d+\s+\d+,\d{2}\s*$/m.test(text)) return "AMADIP";
  if (/\d+,\d{4}/.test(text)) return "HM";
  if (/\bFLAMINGO\b/i.test(text)) return "FLAMINGO"; // Stub
  if (/\s\d+,\d{2}\s+[A-Za-zÁÉÍÓÚÜÑ.]{1,8}\s*$/m.test(text)) return "BONANZA";
  if (/Mar Hotels/i.test(text) || /\bCoste\s+unitario\s+Descuento\b/i.test(text)) return "MARHOTELES";
  if (/olivia hotelscollection/i.test(text) || /HOJA DE PEDIDO POR CENTRO/i.test(text)) return "OLIVIA";
  if (/SERUNION/i.test(text) || /spairal/i.test(text)) return "SERUNION";
  if (/CLUB MARTHA/i.test(text) || /Hotels & Resorts Blue Sea/i.test(text) || /club mac/i.test(text) || /mac hotel/i.test(text) || /^\s*\d+\s+.*\s+\d+(?:[.,]\d+)?\s+.+?\s+\S+\s+\S+\s+\d+(?:[.,]\d+)?\s*$/m.test(text)) return "CLUBMARTHA";
  if (/cap de mar/i.test(text) || /^\s*[A-Z0-9]+(?:\s+.*)?\s+\d+(?:[.,]\d+)?\s+[A-Za-z.\/]+\s+\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\s*$/m.test(text)) return "CAPDEMAR";
  if (/bioen/i.test(text)) return "BIOEN";
  return "UNKNOWN";
}

const text = readFileSync("test.txt", "utf8");
console.log("DETECTED:", detectFormat(text));
