import { readFileSync } from "fs";

function normWS(s) { return s.replace(/\s+/g, ' ').trim(); }

const text = readFileSync("test.txt", "utf8");
const lines = text.split("\n");

let merged = [];
for (const raw0 of lines) {
    const t0 = raw0.trim();
    if (!t0) continue;
    const starter = /\s\d+,\d{2}\s+\S+\s*$/.test(t0);
    if (starter) merged.push(t0);
    else if (merged.length) merged[merged.length - 1] = normWS(merged[merged.length - 1] + " " + t0);
}

function parseBON(line) {
  const m = line.match(/^(.+?)\s+(\d+,\d{2})\s+([A-Za-zÁÉÍÓÚÜÑ.]{1,8})\s*$/);
  if (!m) return null;
  return m;
}

for (const m of merged) {
  console.log(parseBON(m));
}
