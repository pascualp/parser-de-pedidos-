import { readFileSync } from "fs";

const text = readFileSync("test.txt", "utf8");
const match = text.match(/\s\d+,\d{2}\s+[A-Za-zÁÉÍÓÚÜÑ.]{1,8}\s*$/m);
console.log(match);
