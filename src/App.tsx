import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Copy, Trash2, Play, Settings2, CheckCircle2, AlertTriangle, XCircle, FileText, ClipboardList } from 'lucide-react';

// ================= HEADERS =================
const HEADERS = {
  HM: ["Referencia","Artículo","Descripción","M.C.","Cant.","Bonif.","Precio","Dto1","Dto2","Dto3","Importe"],
  AMADIP: ["Ref.Prov.","Artículo","Formato","Cantidad","Precio","Dto.","IVA","Total"],
  CARIBBEAN: ["Producto","Descripción","Cód. proveedor","Cantidad","U. M."],
  FLAMINGO: ["Código","Descripción","Formato","Cant."],
  BONANZA: ["Descripción","Unidades","Unid. medida"],
  NIUUT: ["Ref Cli.","Ref Prov.","Descripción","Cantidad","U. M.","Precio Unit.","Importe"],
  H24: ["Código","Ref Prov.","Descripción","Cantidad","U. M.","Precio Unit.","Importe"],
  HELIOS: ["Código", "Descripción", "Cantidad", "U. M."],
  MARHOTELES: ["Producto", "Descripción", "Unidad Medida", "Cantidad", "Precio", "Coste unitario", "Descuento", "Importe"],
  OLIVIA: ["Código", "Descripción", "Cantidad", "U. M."],
  SERUNION: ["Código", "Descripción", "Cantidad", "Cant. Unidad", "U. M.", "Precio", "Importe"],
  CLUBMARTHA: ["Producto", "Descripción", "Cód. proveedor", "Cantidad", "U. M.", "Precio", "Coste unitario", "Importe"],
  CAPDEMAR: ["Código", "Descripción", "Cód. proveedor", "Cantidad", "U. M.", "Precio", "Precio 2", "Importe"],
  GARONDA: ["Producto", "Descripción", "Cód. proveedor", "Cantidad", "U. M.", "Precio", "Coste unitario", "Importe"],
  FRUTAS: ["Descripción", "Cód. Prov.", "Código", "Cantidad", "Unidad"],
  LAGARDERE: ["EAN", "Código", "Descripción", "Cantidad", "Unidad"],
  NUEVO_FORMATO: ["Código", "Descripción", "Precio", "Unidad", "Cantidad"]
};

// ================= MEMORIA DE CÓDIGOS =================
function getSavedCode(desc: string): string {
  try {
    const memoria = JSON.parse(localStorage.getItem('misCodigosGuardados') || '{}');
    return memoria[desc.toUpperCase().trim()] || "";
  } catch (e) {
    return "";
  }
}

function saveCode(desc: string, code: string) {
  if (!desc || !code.trim()) return;
  try {
    const memoria = JSON.parse(localStorage.getItem('misCodigosGuardados') || '{}');
    memoria[desc.toUpperCase().trim()] = code.trim();
    localStorage.setItem('misCodigosGuardados', JSON.stringify(memoria));
  } catch (e) {}
}

// ================= CONFIG / STORAGE =================
const LS_CFG_KEY = "pedido_parser_copy_cfg_v12";
const LS_FOLD_KEY = "pedido_parser_copy_fold_open_v1";

const DEFAULT_COPY_CFG = {
  cfgHM: "Artículo\nDescripción\nCant.\nPrecio\nImporte",
  cfgAMADIP: "Ref.Prov.\nArtículo\nFormato\nCantidad\nPrecio\nTotal",
  cfgCAR: "Producto\nDescripción\nCantidad\nU. M.",
  cfgFLA: "Código\nDescripción\nCant.",
  cfgBON: "Descripción\nUnidades\nUnid. medida",
  cfgGARONDA: "Producto\nDescripción\nCód. proveedor\nCantidad\nU. M.\nPrecio\nCoste unitario\nImporte",
  cfgFRUTAS: "Descripción\nCód. Prov.\nCódigo\nCantidad\nUnidad",
  cfgNIU: "Ref Cli.\nDescripción\nCantidad\nU. M.",
  cfgH24: "Código\nDescripción\nCantidad\nU. M.",
  cfgHELIOS: "Código\nDescripción\nCantidad\nU. M.",
  cfgMAR: "Producto\nDescripción\nUnidad Medida\nCantidad\nPrecio\nImporte",
  cfgOLIVIA: "Código\nDescripción\nCantidad\nU. M.",
  cfgSERUNION: "Código\nDescripción\nCantidad\nCant. Unidad\nU. M.\nPrecio\nImporte",
  cfgCLUBMARTHA: "Producto\nDescripción\nCód. proveedor\nCantidad\nU. M.\nPrecio\nImporte",
  cfgCAPDEMAR: "Código\nDescripción\nCód. proveedor\nCantidad\nU. M.\nPrecio\nImporte",
  cfgBIOEN: "Código\nDescripción\nCód. proveedor\nCantidad\nU. M.\nPrecio\nCoste\nImporte",
  cfgLAGARDERE: "EAN\nCódigo\nDescripción\nCantidad\nUnidad",
  cfgNUEVO_FORMATO: "Código\nDescripción\nPrecio\nUnidad\nCantidad",
  includeHeader: true,
  strictCopy: true
};

// ================= COMMON HELPERS =================
const RE_INT     = /^\d+$/;
const RE_QTY3    = /^\d+,\d{3}$/;
const RE_MONEY2  = /^\d+,\d{2}$/;
const RE_PRICE4  = /^\d+,\d{4}$/;
const RE_PRICE3  = /^\d+,\d{3}$/;
const RE_WORD    = /^[A-Za-zÁÉÍÓÚÜÑ.]{1,10}$/;
const RE_CAR_PROD = /^\d{9}$/;

function looksLikeTotalsOrFooter(line: string){
  return /Subtotal|Base Imponible|Importe Total|Euros|Base imponible|IVA total|Total pedido|HOJA DE PEDIDO|DESCRIPCION|Depto\./i.test(line);
}
function looksLikeTrashCommon(line: string){
  return /^(Pedido\b|^\d+\s*\/\s*\d+\s*$|^\d+\s+de\s+\d+$)/i.test(line);
}
function normWS(s: string){ return (s ?? "").replace(/\s+/g, " ").trim(); }

type ParseResult = { ok: true, row: string[], original: string } | { ok: false, reason: string, original: string };

// ================= BIOEN =================
function looksLikeTrashBIOEN(line: string) {
  return /^(Producto\s+Descripción|Coste|Cód\.\s+proveedor|bioen)/i.test(line);
}

function parseBIOEN(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  
  const headMatch = line.match(/^(\S+)\s+(.+)$/);
  if (!headMatch) return { ok: false, original, reason: "No se pudo extraer el código" };
  
  const codigo = headMatch[1];
  const rest = headMatch[2];
  
  const tailRegex = /\s+(\d+(?:\.\d+)?)\s+((?:[A-Za-z]|\d+[A-Za-z]).*?)\s+(\S+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
  const m2 = rest.match(tailRegex);
  
  if (!m2) return { ok: false, original, reason: "No coincide con el formato de BIOEN" };
  
  let descAndProv = rest.replace(tailRegex, "").trim();
  let codProv = "";
  const provMatch = descAndProv.match(/^(.*?)\s+(\d+)$/);
  if (provMatch) {
    descAndProv = provMatch[1];
    codProv = provMatch[2];
  }
  
  const cantidad = m2[1];
  const um = m2[2];
  const precio = m2[3].replace(/[^\d.,]/g, ''); // Clean up OCR errors like UNID1A.D55000
  const coste = m2[4];
  const importe = m2[5];
  
  return { ok: true, row: [codigo, descAndProv, codProv, cantidad, um, precio, coste, importe], original };
}

// ================= GARONDA =================
function looksLikeTrashGARONDA(line: string) {
  return /^(GARONDA|Pedido|Total|Subtotal|IVA|Base|Fecha|Proveedor|P[áa]gina|Albar[áa]n|Factura|Cliente|Direcci[óo]n|Tel[ée]fono|Email|NIF|CIF|Observaciones|Comentarios)/i.test(line);
}

function parseGARONDA(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  
  // Fix OCR errors like KIL1O.50000 -> KILO 1.50000
  line = line.replace(/([A-Za-z]+)1([A-Za-z]*)\.([0-9]+)/, "$1O$2 1.$3");
  
  const headMatch = line.match(/^(\S+)\s+(.+)$/);
  if (!headMatch) return { ok: false, original, reason: "No se pudo extraer el código" };
  
  const codigo = headMatch[1];
  const rest = headMatch[2];
  
  const tailRegex = /\s+(\d+(?:\.\d+)?)\s+((?:[A-Za-z]|\d+[A-Za-z]).*?)\s+(\S+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
  const m2 = rest.match(tailRegex);
  
  if (!m2) return { ok: false, original, reason: "No coincide con el formato de GARONDA" };
  
  let descAndProv = rest.replace(tailRegex, "").trim();
  let codProv = "";
  const provMatch = descAndProv.match(/^(.*?)\s+(\d+)$/);
  if (provMatch) {
    descAndProv = provMatch[1];
    codProv = provMatch[2];
  }
  
  const cantidad = m2[1].replace(/\.00$/, "");
  const um = m2[2];
  const precio = m2[3].replace(/\.00$/, "");
  const coste = m2[4].replace(/\.00$/, "");
  const importe = m2[5].replace(/\.00$/, "");
  
  return { ok: true, row: [codigo, descAndProv, codProv, cantidad, um, precio, coste, importe], original };
}

function parseFRUTAS(line: string): ParseResult {
  const original = line;
  const cleanLine = line.trim();
  if (!cleanLine) return { ok: false, original, reason: "Línea vacía" };

  // Try to find the quantity and unit at the end
  const qUnitMatch = cleanLine.match(/(\d+(?:[.,]\d+)?)\s+([A-Za-zÁÉÍÓÚÜÑ.]{1,15})$/);
  if (!qUnitMatch) return { ok: false, original, reason: "No se encontró cantidad y unidad al final" };

  const cantidad = qUnitMatch[1];
  const unidad = qUnitMatch[2];
  
  const restOfLine = cleanLine.substring(0, cleanLine.length - qUnitMatch[0].length).trim();
  const parts = restOfLine.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
  
  let descripcion = restOfLine;
  let codProv = "";
  let codigo = "";
  
  // 1. Extract Provider Reference from parentheses (00182)
  const allCodesInParens = restOfLine.match(/\((\d+)\)/g);
  if (allCodesInParens) {
      const lastMatch = allCodesInParens[allCodesInParens.length - 1];
      const codeMatch = lastMatch.match(/\((\d+)\)/);
      if (codeMatch) {
          codProv = codeMatch[1];
          // Remove the parentheses code from the description
          descripcion = descripcion.replace(lastMatch, "").trim();
      }
  }
  
  // 2. Extract the "Código" (the number that follows or is in the middle column)
  // Re-split the cleaned description to find the middle column
  const cleanParts = descripcion.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
  if (cleanParts.length >= 2) {
      const lastPart = cleanParts[cleanParts.length - 1];
      if (/^\d+$/.test(lastPart)) {
          codigo = lastPart;
          descripcion = cleanParts.slice(0, -1).join(" ").trim();
      }
  } else if (cleanParts.length === 1 && !codigo) {
      // If only one part left, it might be the description itself
      descripcion = cleanParts[0];
  }

  if (!descripcion) return { ok: false, original, reason: "No se pudo extraer la descripción" };

  return { ok: true, row: [descripcion, codProv, codigo, cantidad, unidad], original };
}

function parseLAGARDERE(line: string): ParseResult {
  const original = line;
  const cleanLine = line.trim();
  if (!cleanLine) return { ok: false, original, reason: "Línea vacía" };

  // Sample: 1000004802173 480217 CHAMPIÑON LAMINADO BANDEJA 250G 20 UN
  // Sample: 1000004040834 404083 LIMON MALLORCA 15,000 KG
  
  // Try to find quantity and unit at the end
  const qUnitMatch = cleanLine.match(/(\d+(?:[.,]\d+)?)\s+([A-Za-zÁÉÍÓÚÜÑ.]{1,15})$/);
  if (!qUnitMatch) return { ok: false, original, reason: "No se encontró cantidad y unidad al final" };

  const cantidad = qUnitMatch[1];
  const unidad = qUnitMatch[2];
  
  const restOfLine = cleanLine.substring(0, cleanLine.length - qUnitMatch[0].length).trim();
  
  // Split by spaces
  const parts = restOfLine.split(/\s+/);
  if (parts.length < 3) return { ok: false, original, reason: "Formato Lagardere inválido" };
  
  const ean = parts[0];
  const shortCode = parts[1];
  const descripcion = parts.slice(2).join(" ");
  const savedCode = getSavedCode(descripcion);
  const finalCode = savedCode || shortCode;

  return { ok: true, row: [ean, finalCode, descripcion, cantidad, unidad], original };
}

function parseNUEVO_FORMATO(line: string): ParseResult {
  const original = line;
  const cleanLine = line.trim();
  if (!cleanLine) return { ok: false, original, reason: "Línea vacía" };

  // Example: 1150501139 BERENJENA RALLADA GANDIA 1,20 KG 5,00
  // Or separated by tabs.
  const m = cleanLine.match(/^(\d{10})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z.]+)\s+(\d+(?:[.,]\d+)?)$/);
  if (!m) return { ok: false, original, reason: "No coincide con el formato" };

  const codigo = m[1];
  const desc = m[2].trim();
  const precio = m[3];
  const unidad = m[4];
  const cantidad = m[5];

  const savedCode = getSavedCode(desc);
  const finalCode = savedCode || codigo;

  return { ok: true, row: [finalCode, desc, precio, unidad, cantidad], original };
}

// ================= HM =================
function looksLikeTrashHM(line: string) {
  return /^(Referencia|Cant\.|Cif:|Balanguera|Illes Balears|España|\d{5}\s+-|Tel\.|Pedido\b|Subtotal\b|Total pedido\b|Página\s+\d+)/i.test(line)
    || /^\d+\s+\d{2}[-/]\d{2}[-/]\d{4}$/.test(line);
}

const HM_MC = new Set(["Kg","Ud","Paq","Caja","Bulto","Mjo","Manojo","Unidad","UNIDAD","KG"]);
function parseHM(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  const tokens = line.split(" ");
  if (tokens.length < 6) return { ok:false, original, reason:"Línea muy corta" };

  let ref = "", art = "";
  let descStart = 0;
  if (RE_INT.test(tokens[0]) && RE_INT.test(tokens[1])) {
    ref = tokens[0];
    art = tokens[1];
    descStart = 2;
  } else if (RE_INT.test(tokens[0])) {
    ref = tokens[0];
    descStart = 1;
  }

  const importe = tokens[tokens.length - 1];
  if (!RE_MONEY2.test(importe)) return { ok:false, original, reason:`Importe inválido: "${importe}"` };

  let i = tokens.length - 2;
  while (i >= 0 && !RE_PRICE4.test(tokens[i])) i--;
  if (i < 0) return { ok:false, original, reason:"No encontré Precio (4 decimales)" };
  const precio = tokens[i];

  const cant = tokens[i - 2];
  const bonif = tokens[i - 1];
  if (!RE_QTY3.test(cant)) return { ok:false, original, reason:`Cantidad inválida: "${cant ?? ""}"` };
  if (!RE_MONEY2.test(bonif)) return { ok:false, original, reason:`Bonif inválida: "${bonif ?? ""}"` };

  const mc = tokens[i - 3];
  if (!mc) return { ok:false, original, reason:`M.C. ausente` };
  if (!HM_MC.has(mc) && !RE_WORD.test(mc)) return { ok:false, original, reason:`M.C. inválida: "${mc}"` };

  const between = tokens.slice(i + 1, tokens.length - 1);
  if (between.some(x => !RE_MONEY2.test(x))) return { ok:false, original, reason:`Valores inválidos entre precio e importe` };
  if (between.length > 3) return { ok:false, original, reason:`Demasiados campos entre precio e importe (${between.length})` };

  const dto1 = between[0] ?? "0,00";
  const dto2 = between[1] ?? "0,00";
  const dto3 = between[2] ?? "0,00";
  const desc = tokens.slice(descStart, i - 3).join(" ").trim();
  if (!desc) return { ok:false, original, reason:"Descripción vacía" };
  
  const saved = getSavedCode(desc);
  const finalRef = saved || ref;

  return { ok:true, row:[finalRef, art, desc, mc, cant, bonif, precio, dto1, dto2, dto3, importe], original };
}

// ================= AMADIP =================
const AMADIP_FMT = new Set(["KG","UNIDAD","MANOJO","CAJA","PAQUETE","TARRINA","BOLSA","CAJ","UD"]);
function parseAMADIP(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  const tokens = line.split(" ");
  if (tokens.length < 9) return { ok:false, original, reason:"Línea muy corta AMADIP" };

  const total = tokens[tokens.length - 1];
  if (!RE_MONEY2.test(total)) return { ok:false, original, reason:`Total inválido: "${total}"` };
  const iva = tokens[tokens.length - 2];
  if (!RE_INT.test(iva)) return { ok:false, original, reason:`IVA inválido: "${iva}"` };
  if (tokens[tokens.length - 3] !== "%") return { ok:false, original, reason:`No encontré "%"` };

  const dto = tokens[tokens.length - 4];
  if (!RE_MONEY2.test(dto)) return { ok:false, original, reason:`Dto inválido: "${dto}"` };

  const precio = tokens[tokens.length - 5];
  if (!RE_PRICE3.test(precio) && !RE_MONEY2.test(precio)) return { ok:false, original, reason:`Precio inválido: "${precio}"` };

  const cantidad = tokens[tokens.length - 6];
  if (!RE_INT.test(cantidad) && !/^\d+,\d+$/.test(cantidad)) return { ok:false, original, reason:`Cantidad inválida: "${cantidad}"` };

  let refProv = "";
  let artStart = 0;
  if (RE_INT.test(tokens[0])) {
    refProv = tokens[0];
    artStart = 1;
  }

  const endFormatIdx = tokens.length - 7;

  let splitK = 1;
  for (let j = endFormatIdx; j >= 2; j--) {
    const t = tokens[j].toUpperCase();
    if (AMADIP_FMT.has(t) || t.includes("/") || t.endsWith("GR") || t.endsWith("KG")) { splitK = j - 1; break; }
  }
  if (splitK < 1) splitK = 1;
  if (splitK >= endFormatIdx) splitK = endFormatIdx - 1;

  const articulo = tokens.slice(artStart, splitK + 1).join(" ").trim();
  const formato  = tokens.slice(splitK + 1, endFormatIdx + 1).join(" ").trim();
  if (!articulo) return { ok:false, original, reason:"Artículo vacío" };
  if (!formato) return { ok:false, original, reason:"Formato vacío" };
  
  if (!refProv) refProv = getSavedCode(articulo);

  return { ok:true, row:[refProv, articulo, formato, cantidad, precio, dto, iva, total], original };
}

// ================= CARIBBEAN =================
const CAR_UM = new Set(["KG","UD","MJ","PAQ","CAJA","BULTO"]);
function parseCAR(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  let tokens = line.split(" ");
  if (tokens.length < 5) return { ok:false, original, reason:"Línea muy corta CARIBBEAN" };

  const last = tokens[tokens.length - 1];
  const prev = (tokens[tokens.length - 2] ?? "").toUpperCase();
  if (RE_INT.test(last) && CAR_UM.has(prev)) tokens = tokens.slice(0, -1);

  let producto = "";
  let descStart = 0;
  if (RE_INT.test(tokens[0])) {
    producto = tokens[0];
    descStart = 1;
  }

  const umRaw = tokens[tokens.length - 1];
  const um = umRaw.toUpperCase();
  if (!CAR_UM.has(um)) return { ok:false, original, reason:`U.M. inválida: "${umRaw}"` };

  const cantidad = tokens[tokens.length - 2];
  if (!RE_MONEY2.test(cantidad)) return { ok:false, original, reason:`Cantidad inválida: "${cantidad}"` };

  const codProv = tokens[tokens.length - 3];
  if (!RE_INT.test(codProv)) return { ok:false, original, reason:`Cód. proveedor inválido: "${codProv}"` };

  const desc = tokens.slice(descStart, tokens.length - 3).join(" ").trim();
  if (!desc) return { ok:false, original, reason:"Descripción vacía" };
  
  if (!producto) producto = getSavedCode(desc);

  return { ok:true, row:[producto, desc, codProv, cantidad, um], original };
}

// ================= FLAMINGO =================
const FLA_FMT = new Set(["UD","KG","BOLSA","BANDEJA","MANOJO","CAJA","PAQ"]);
const RE_FLA_TAIL = /\s\((1)\)\s+(\d+\.\d{2})\s*$/;
const RE_FLA_CODE = /^(\d+|\d+\.\d+)$/;
function stripDot00(x: string){ 
  if (typeof x !== "string") return x;
  if (x.endsWith(".000")) return x.slice(0,-4);
  if (x.endsWith(",000")) return x.slice(0,-4);
  if (x.endsWith(".00")) return x.slice(0,-3);
  if (x.endsWith(",00")) return x.slice(0,-3);
  return x;
}
function looksLikeTrashFlamingo(line: string){
  return /^(Pedido\b|MySeaHouse\b|Dirección\b|Direccion\b|C\/|Calle\b|Carrer\b|Spain\b|S\.L\.U\.|S\.L\b|B\d{8}|NIF\b|CIF\b|Email\b|@|Albar[aá]n\b|Proveedor\b|Almac[eé]n\b|Fecha\b|Tel[eé]fono\b)/i.test(line)
    || /pedidos@/i.test(line);
}
function parseFLA(line: string): ParseResult {
  const original = line;
  line = normWS(line);

  const m = line.match(RE_FLA_TAIL);
  if (!m) return { ok:false, original, reason:`No termina en "(1) 0.00"` };

  let qty = stripDot00(m[2]);

  const head = line.replace(RE_FLA_TAIL, "").trim();
  const tokens = head.split(" ");
  if (!tokens.length) return { ok:false, original, reason:"FLAMINGO sin contenido" };

  const fmtRaw = tokens[tokens.length - 1];
  const fmtUp = fmtRaw.toUpperCase();
  if (!FLA_FMT.has(fmtUp) && !/^[A-Z]{1,10}$/.test(fmtUp)) return { ok:false, original, reason:`Formato no permitido: "${fmtRaw}"` };

  let code = "";
  let startDesc = 0;
  if (RE_FLA_CODE.test(tokens[0])) { code = tokens[0]; startDesc = 1; }

  const desc = tokens.slice(startDesc, tokens.length - 1).join(" ").trim();
  if (!desc) return { ok:false, original, reason:"Descripción vacía (FLAMINGO)" };
  
  if (!code) code = getSavedCode(desc);

  return { ok:true, row:[code, desc, fmtUp + " (1)", qty], original };
}

// ================= BONANZA =================
const BON_UM = new Set(["Ud.","Kg.","KG","UD","CAJA","L","Lt","lt","L."]);
function parseBON(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  const tokens = line.split(" ");
  if (tokens.length < 3) return { ok:false, original, reason:"Línea muy corta BONANZA" };

  const umRaw = tokens[tokens.length - 1];
  const qty = tokens[tokens.length - 2];
  if (!RE_MONEY2.test(qty)) return { ok:false, original, reason:`Unidades inválidas: "${qty}"` };
  if (!BON_UM.has(umRaw) && !BON_UM.has(umRaw.toUpperCase())) {
    if (!/^[A-Za-zÁÉÍÓÚÜÑ.]{1,8}$/.test(umRaw)) return { ok:false, original, reason:`Unidad inválida: "${umRaw}"` };
  }
  const desc = tokens.slice(0, tokens.length - 2).join(" ").trim();
  if (!desc) return { ok:false, original, reason:"Descripción vacía" };
  return { ok:true, row:[desc, qty, umRaw], original };
}

// ================= NIU / UT =================
const RE_NIU_PRICE_LINE = /^(.*?)\s*(\d+(?:,\d+)?)\s*(?:(un)\s*)?Precio\s+Unit\.\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)\s*$/i;
const RE_NIU_REF_ONLY = /^(\d+)\s+(\d+\|\d+)(?:\s+(.*))?$/;
const RE_NIU_UNIT_LINE = /^\s*(Kilogramos|Kilogramo|KG|Unidades|un|ud|ST)\s*$/i;

function looksLikeTrashNIU(line: string){
  return /^(Ref Prov\.|Ref Cli\.|Descripción\b|Cdad\.\b|Concepto\b|Importe Total\b|Pedido\b|Emisor\b|Destinatario\b|Datos generales\b|Observaciones\b|Comentarios:|Contacto\b|Marca:|Unidad de Pedido:|Unidad de Facturacion:|Cdad a Facturar:|Periodo de entrega:|Divisa\b|Tipo Pedido\b|Fecha\b)/i.test(line)
    || /^\d+\s*\/\s*\d+\s*$/.test(line)
    || /^\d{6}$/.test(line)
    || /^Marca:\s*/i.test(line);
}

function normalizeNIUUnit(unitRaw: string){
  const u = (unitRaw || "").toLowerCase();
  if (u.startsWith("kilo") || u === "kg") return "KG";
  if (u === "un" || u === "ud" || u === "unidades" || u === "st") return "UD";
  return unitRaw ? unitRaw.toUpperCase() : "";
}

function parseNIUUT(lines: string[]){
  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];

  let pendingDescLines: string[] = [];
  let currentItem: any = null;
  let pendingPrice: any = null;
  let pendingUnit: any = null;

  function flushIfReady(){
    if (currentItem && pendingPrice && (pendingUnit || pendingPrice.unitInline)) {
      const um = pendingPrice.unitInline || pendingUnit;
      rows.push([currentItem.refCli, currentItem.refProv, currentItem.desc, pendingPrice.qty, um, pendingPrice.unitPrice, pendingPrice.amount]);
      currentItem = null; pendingPrice = null; pendingUnit = null; pendingDescLines = [];
    }
  }

  for (const raw of lines){
    let line = normWS(raw);
    if (!line) continue;
    if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line) || looksLikeTrashNIU(line)) continue;

    if (RE_NIU_UNIT_LINE.test(line)) {
      pendingUnit = normalizeNIUUnit(line);
      flushIfReady();
      continue;
    }

    const mPrice = line.match(RE_NIU_PRICE_LINE);
    if (mPrice) {
      const prefix = mPrice[1].trim();
      pendingPrice = {
        qty: stripDot00(mPrice[2]),
        unitInline: mPrice[3] ? "UD" : null,
        unitPrice: mPrice[4],
        amount: mPrice[5]
      };

      if (prefix) {
        const mRef = prefix.match(RE_NIU_REF_ONLY);
        if (mRef) {
          let desc = mRef[3] || "";
          if (pendingDescLines.length) {
            desc = normWS(pendingDescLines.join(" ") + " " + desc);
            pendingDescLines = [];
          }
          currentItem = { refCli: mRef[1], refProv: mRef[2], desc };
        } else {
          pendingDescLines.push(prefix);
        }
      }
      flushIfReady();
      continue;
    }

    const mRefOnly = line.match(RE_NIU_REF_ONLY);
    if (mRefOnly) {
      let desc = mRefOnly[3] || "";
      if (pendingDescLines.length) {
        desc = normWS(pendingDescLines.join(" ") + " " + desc);
        pendingDescLines = [];
      }
      currentItem = { refCli: mRefOnly[1], refProv: mRefOnly[2], desc };
      flushIfReady();
      continue;
    }

    pendingDescLines.push(line);
  }

  if (currentItem || pendingPrice || pendingUnit || pendingDescLines.length) {
    errors.push({ original: "(fin de texto)", reason: "Quedó un bloque NIU/UT incompleto (faltó item / precio / unidad)." });
  }
  return { rows, errors };
}

// ================= H24 =================
const RE_H24_INLINE = /^\s*(\d+)\s+(\d+)\s+(.+?)\s+(\d+,\d{2})\s+([A-Za-z]{1,5}|PAQ|paq|KG|kg|UN|un)\s+Precio\s+Unit\.\s+(\d+,\d{2})\s+(\d+,\d{2})\s*$/i;
const RE_H24_PRICE_NO_CODE = /^\s*(.+?)\s+(\d+,\d{2})\s+([A-Za-z]{1,5}|PAQ|paq|KG|kg|UN|un)\s+Precio\s+Unit\.\s+(\d+,\d{2})\s+(\d+,\d{2})\s*$/i;
const RE_H24_CODE_REFP = /^\s*(\d+)\s+(\d+)\s*$/;

function normalizeH24Unit(u: string){
  const up = (u||"").toUpperCase();
  if (up === "UN") return "UD";
  if (up === "KG") return "KG";
  if (up === "PAQ") return "PAQ";
  return up;
}

function parseH24(lines: string[]){
  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];

  let pendingDesc: string[] = [];
  let pendingPrice: any = null;
  let pendingCode: any = null;

  function flushIfReady(){
    if (pendingPrice && pendingCode) {
      const desc = normWS([...pendingDesc, pendingPrice.desc].join(" "));
      rows.push([pendingCode.code, pendingCode.refp, desc, pendingPrice.qty, pendingPrice.um, pendingPrice.unitPrice, pendingPrice.amount]);
      pendingDesc = [];
      pendingPrice = null;
      pendingCode = null;
    }
  }

  for (const raw0 of lines){
    let line = normWS(raw0);
    if (!line) continue;
    if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line)) continue;
    if (/^Pedido\s+H24/i.test(line)) continue;

    let m = line.match(RE_H24_INLINE);
    if (m) {
      const code = m[1], refp = m[2], desc0 = m[3].trim();
      const qty = m[4], um = normalizeH24Unit(m[5]), unitPrice = m[6], amount = m[7];

      if (!RE_INT.test(code) || !RE_INT.test(refp) || !RE_MONEY2.test(qty) || !RE_MONEY2.test(unitPrice) || !RE_MONEY2.test(amount)) {
        errors.push({ original: raw0, reason:"Campos numéricos inválidos en H24 (inline)." });
        continue;
      }
      const desc = normWS([...pendingDesc, desc0].join(" "));
      pendingDesc = [];

      rows.push([code, refp, desc, qty, um, unitPrice, amount]);
      pendingPrice = null; pendingCode = null;
      continue;
    }

    m = line.match(RE_H24_CODE_REFP);
    if (m) {
      pendingCode = { code: m[1], refp: m[2] };
      flushIfReady();
      continue;
    }

    if (/Precio\s+Unit\./i.test(line)) {
      m = line.match(RE_H24_PRICE_NO_CODE);
      if (!m) {
        errors.push({ original: raw0, reason:"Línea con Precio Unit. no reconocida (H24)." });
        continue;
      }
      const desc = m[1].trim();
      const qty = m[2];
      const um = normalizeH24Unit(m[3]);
      const unitPrice = m[4];
      const amount = m[5];

      if (!RE_MONEY2.test(qty) || !RE_MONEY2.test(unitPrice) || !RE_MONEY2.test(amount)) {
        errors.push({ original: raw0, reason:"Cantidad/Precio/Importe inválidos (H24)." });
        continue;
      }

      pendingPrice = { desc, qty, um, unitPrice, amount };
      flushIfReady();
      continue;
    }

    pendingDesc.push(line);
  }

  if (pendingPrice || pendingCode) {
    errors.push({ original: "(fin de texto)", reason:"H24 incompleto: quedó un precio sin código/refprov o viceversa." });
  }

  return { rows, errors };
}

// ================= HELIOS =================
function parseHELIOS(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  const tokens = line.split(" ");
  if (tokens.length < 3) return { ok: false, original, reason: "Línea muy corta HELIOS" };
  
  const um = tokens[tokens.length - 1];
  const qtyRaw = tokens[tokens.length - 2];
  
  if (!/^\d+(\.\d+)?$/.test(qtyRaw) && !/^\d+(,\d+)?$/.test(qtyRaw)) {
      return { ok: false, original, reason: `Cantidad inválida: "${qtyRaw}"` };
  }

  const qty = stripDot00(qtyRaw);
  let code = "";
  let descStart = 0;
  if (/^\d+$/.test(tokens[0])) {
    code = tokens[0];
    descStart = 1;
  }
  const desc = tokens.slice(descStart, tokens.length - 2).join(" ").trim();
  
  if (!code) code = getSavedCode(desc);
  
  return { ok: true, row: [code, desc, qty, um], original };
}

// ================= MAR HOTELES =================
function looksLikeTrashMAR(line: string) {
  return /^(Mar Hotels|FRUITES BON ANY|MERCAPALMA|Illes Balears|España|Tel\.|Pedido\b|Producto\s+Descripción|Subtotal\b|Total pedido\b|0,00\s+0,00\s+0,00)/i.test(line)
    || /B\d{8}/.test(line)
    || /Carrer de Formentor/.test(line)
    || /POLLENÇA/.test(line)
    || /Almacén destino/.test(line)
    || /^\d+\s+de\s+\d+$/.test(line);
}

function parseMAR(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  
  const tailRegex = /\s+([A-Za-z]+)\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)\s+(\d+(?:,\d+)?)$/;
  const m = line.match(tailRegex);
  
  if (!m) return { ok: false, original, reason: "No coincide con el formato de MAR HOTELES (Unidad Cantidad Precio Coste Dto Importe)" };
  
  const um = m[1];
  const cantidad = m[2];
  const precio = m[3];
  const coste = m[4];
  const dto = m[5];
  const importe = m[6];
  
  const head = line.replace(tailRegex, "").trim();
  const tokens = head.split(" ");
  if (tokens.length < 1) return { ok: false, original, reason: "Falta descripción" };
  
  let producto = "";
  let descStart = 0;
  if (/^\d+$/.test(tokens[0])) {
    producto = tokens[0];
    descStart = 1;
  }
  const desc = tokens.slice(descStart).join(" ");
  
  if (!producto) producto = getSavedCode(desc);
  
  return { ok: true, row: [producto, desc, um, cantidad, precio, coste, dto, importe], original };
}

// ================= OLIVIA =================
function looksLikeTrashOLIVIA(line: string) {
  return /^(Fecha|Depto\.|Proveedor|Almacén|ALM\.|UNIDADES|UNID\.|MEDIDA|DESCRIPCION|HOJA DE PEDIDO|COCINA|HOTEL|olivia|Nombre, apellidos|- HOTELS)/i.test(line)
    || /00902395/.test(line)
    || /^\d{2}\/\d{2}\/\d{4}$/.test(line);
}

function parseOLIVIA(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  const match = line.match(/^(.*?)\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z.]+)$/);
  if (!match) return { ok: false, original, reason: "No coincide con formato OLIVIA" };
  
  const desc = match[1];
  const code = getSavedCode(desc);
  
  return { ok: true, row: [code, desc, stripDot00(match[2]), match[3]], original };
}

// ================= SERUNION =================
function looksLikeTrashSERUNION(line: string) {
  return /^(Pedido Nº|Pedido Spairal|Cliente|Proveedor|Día de entrega|Sociedad:|CIF:|P\.O\. cliente|Dirección|Islas Baleares|Teléfono|Email:|Contacto:|Pedido enviado|Líneas|Posición|Totales|Total:|Página|Powered by)/i.test(line)
    || /SERUNION/i.test(line)
    || /spairal/i.test(line);
}

function parseSERUNION(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  
  let code = "";
  let desc = "";
  let cantRaw = "";
  let umRaw = "";
  let precio = "";
  let importe = "";

  // Intentamos primero el regex estricto que asume que el artículo proveedor tiene el formato "CODIGO - DESCRIPCION"
  // Usamos (.*) greedy para el artículo cliente, para asegurarnos de coger el ÚLTIMO "CODIGO - DESCRIPCION"
  let match = line.match(/^(\d{6})\s+(.*)\s+(\d+)\s+-\s+(.*?)\s+(\d+(?:[.,]\d{1,3})?)\s+(.*?)\s+Precio neto\s*unitario:\s*([\d.,]+)\s*€.*?Total de línea:\s*([\d.,]+)\s*€/i);
  
  if (match) {
    code = match[3];
    desc = match[4];
    cantRaw = match[5];
    umRaw = match[6];
    precio = match[7];
    importe = match[8];
  } else {
    // Fallback por si el artículo proveedor NO tiene código (ej. solo "LECHUGA ICEBERG")
    // Usamos (.*) greedy antes de la cantidad para que consuma toda la descripción
    match = line.match(/^(\d{6})\s+(.*)\s+(\d+(?:[.,]\d{1,3})?)\s+([A-Za-z].*?)\s+Precio neto\s*unitario:\s*([\d.,]+)\s*€.*?Total de línea:\s*([\d.,]+)\s*€/i);
    if (!match) return { ok: false, original, reason: "No coincide con formato SERUNION" };
    
    let descRaw = match[2];
    desc = descRaw.replace(/^\d{10,}\s*-\s*/, ""); // Quitar código largo de cliente si existe
    cantRaw = match[3];
    umRaw = match[4];
    precio = match[5];
    importe = match[6];
  }
  
  let cant = stripDot00(cantRaw);
  
  let cantUnidad = "";
  // Buscar la cantidad unitaria dentro de los paréntesis, ej: "(BOLSA 10KG = 10,000 )"
  const cantUnidadMatch = umRaw.match(/\=\s*([\d.,]+)\s*\)/);
  if (cantUnidadMatch) {
    cantUnidad = stripDot00(cantUnidadMatch[1]);
  }
  
  // Limpiar la UM (ej. "BOLSA 10KG(BOLSA 10KG = 10,000 )" -> "BOLSA 10KG")
  let um = umRaw.replace(/\(.*?\)/g, "").trim();
  
  // Si la UM empieza por un número (ej. "10,000 Unidades" donde cantRaw falló y se lo tragó la descripción)
  const umCantMatch = um.match(/^(\d+(?:[.,]\d+)?)\s+(.*)$/);
  if (umCantMatch && !cant) {
    cant = stripDot00(umCantMatch[1]);
    um = umCantMatch[2];
  }
  
  if (!code) code = getSavedCode(desc);
  
  return { ok: true, row: [code, desc, cant, cantUnidad, um, precio, importe], original };
}

// ================= CLUB MARTHA =================
function looksLikeTrashCLUBMARTHA(line: string) {
  return /^(BON ANY|B57954166|C\/ Cardenal|07007|Illes Balears|España|Pedido de compra|Entrega|CLUB MARTHA|Hotels & Resorts|B57817215|Parc de la Mar|07660|Producto\s+Descripción|Total pedido|\d+\s+de\s+\d+|es club mac)/i.test(line);
}

function parseCLUBMARTHA(line: string): ParseResult {
  const original = line;
  line = normWS(line);
  
  const tailRegex = /\s+(\d+(?:[.,]\d+)?)\s+((?:[A-Za-z]|\d+[A-Za-z]).*?)\s+(\S+)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)$/;
  const m = line.match(tailRegex);
  if (!m) return { ok: false, original, reason: "No coincide con el formato de CLUB MARTHA" };
  
  const cantidad = stripDot00(m[1]);
  const um = m[2];
  const precio = m[3];
  const coste = m[4];
  const importe = m[5];
  
  const head = line.replace(tailRegex, "").trim();
  const headMatch = head.match(/^(\d+)\s+(.*)$/);
  if (!headMatch) return { ok: false, original, reason: "Falta código de producto o descripción" };
  
  const producto = headMatch[1];
  let descAndProv = headMatch[2];
  
  let codProv = "";
  const provMatch = descAndProv.match(/^(.*?)\s+(\d+)$/);
  if (provMatch) {
    descAndProv = provMatch[1];
    codProv = provMatch[2];
  }
  
  const desc = descAndProv;
  if (!codProv) codProv = getSavedCode(desc);
  
  return { ok: true, row: [producto, desc, codProv, cantidad, um, precio, coste, importe], original };
}

// ================= CAP DE MAR =================
function looksLikeTrashCAPDEMAR(line: string) {
  return /^(Cap de mar|Pedido|Total|Subtotal|IVA|Base|Fecha|Proveedor|P[áa]gina|Albar[áa]n|Factura|Cliente|Direcci[óo]n|Tel[ée]fono|Email|NIF|CIF|Observaciones|Comentarios)/i.test(line);
}

function parseCAPDEMAR(lines: string[]) {
  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];

  let pendingDesc: string[] = [];

  for (const raw of lines) {
    let line = normWS(raw);
    if (!line) continue;
    if (looksLikeTotalsOrFooter(line) || looksLikeTrashCommon(line) || looksLikeTrashCAPDEMAR(line)) continue;

    const tailRegex = /(?:\s+|^)(\d+(?:[.,]\d+)?)\s+([A-Za-z.\/]+)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)$/;
    const m = line.match(tailRegex);

    if (m) {
      const cantidad = m[1];
      const um = m[2];
      const precio = m[3];
      const precio2 = m[4];
      const importe = m[5];

      const head = line.replace(tailRegex, "").trim();
      let headTokens = head ? head.split(" ") : [];
      
      let codigo = "";
      let codProv = "";
      let inlineDesc = "";

      if (headTokens.length === 0) {
        // The head is entirely in pendingDesc
        if (pendingDesc.length > 0) {
          const fullPending = pendingDesc.join(" ").trim();
          const pendingTokens = fullPending.split(" ");
          codigo = pendingTokens[0];
          if (pendingTokens.length > 1 && /^\d+$/.test(pendingTokens[pendingTokens.length - 1])) {
            codProv = pendingTokens[pendingTokens.length - 1];
            inlineDesc = pendingTokens.slice(1, pendingTokens.length - 1).join(" ");
          } else {
            inlineDesc = pendingTokens.slice(1).join(" ");
          }
          pendingDesc = [];
        } else {
          errors.push({ original: raw, reason: "Línea sin código ni descripción previa" });
          continue;
        }
      } else {
        codigo = headTokens[0];
        if (headTokens.length > 1 && /^\d+$/.test(headTokens[headTokens.length - 1])) {
          codProv = headTokens[headTokens.length - 1];
          inlineDesc = headTokens.slice(1, headTokens.length - 1).join(" ");
        } else {
          inlineDesc = headTokens.slice(1).join(" ");
        }
      }
      
      const desc = normWS([...pendingDesc, inlineDesc].join(" "));
      pendingDesc = [];
      
      const savedCode = getSavedCode(desc);
      const finalCode = savedCode || codigo;
      
      rows.push([finalCode, desc, codProv, cantidad, um, precio, precio2, importe]);
    } else {
      pendingDesc.push(line);
    }
  }

  if (pendingDesc.length > 0) {
    errors.push({ original: "(fin de texto)", reason: "Quedó texto sin procesar al final (CAP DE MAR): " + pendingDesc.join(" | ") });
  }

  return { rows, errors };
}

// ================= JOIN BROKEN LINES =================
function joinBrokenLines(lines: string[], fmt: string){
  const out: string[] = [];

  function clean(raw: string){
    let t = (raw ?? "").trim();
    if (!t) return "";
    t = t.replace(/\s+/g, " ").trim();
    if (!t) return "";
    if (looksLikeTotalsOrFooter(t) || looksLikeTrashCommon(t)) return "";
    if (fmt === "HM" && looksLikeTrashHM(t)) return "";
    if (fmt === "FLAMINGO" && looksLikeTrashFlamingo(t)) return "";
    if (fmt === "NIUUT" && looksLikeTrashNIU(t)) return "";
    if (fmt === "H24" && /^Pedido\s+H24/i.test(t)) return "";
    if (fmt === "MARHOTELES" && looksLikeTrashMAR(t)) return "";
    if (fmt === "OLIVIA" && looksLikeTrashOLIVIA(t)) return "";
    if (fmt === "SERUNION" && looksLikeTrashSERUNION(t)) return "";
    if (fmt === "CLUBMARTHA" && looksLikeTrashCLUBMARTHA(t)) return "";
    if (fmt === "CAPDEMAR" && looksLikeTrashCAPDEMAR(t)) return "";
    if (fmt === "GARONDA" && looksLikeTrashGARONDA(t)) return "";
    return t;
  }

  if (fmt === "AMADIP") {
    const TAIL_ONLY = /^\s*\d+(?:,\d+)?\s+\d+,\d{3}\s+\d+,\d{2}\s+%\s+\d+\s+\d+,\d{2}\s*$/;
    const TAIL_AT_END = /\b\d+(?:,\d+)?\s+\d+,\d{3}\s+\d+,\d{2}\s+%\s+\d+\s+\d+,\d{2}\s*$/;

    let cur = "";
    for (const raw0 of lines) {
      const t = clean(raw0);
      if (!t) continue;

      const isTailOnly = TAIL_ONLY.test(t);
      const isCompleteLine = !isTailOnly && TAIL_AT_END.test(t);

      if (isCompleteLine) {
        if (cur) { out.push(cur); cur = ""; }
        out.push(t);
        continue;
      }

      if (isTailOnly) {
        if (!cur) { out.push(t); continue; }
        out.push(normWS(cur + " " + t));
        cur = "";
        continue;
      }

      if (!cur) cur = t;
      else cur = normWS(cur + " " + t);
    }
    if (cur) out.push(cur);
    return out;
  }

  if (fmt === "NIUUT" || fmt === "H24" || fmt === "CAPDEMAR" || fmt === "BIOEN" || fmt === "GARONDA" || fmt === "LAGARDERE" || fmt === "NUEVO_FORMATO") {
    for (const raw0 of lines) {
      const t = clean(raw0);
      if (!t) continue;
      out.push(t);
    }
    return out;
  }

  for (const raw0 of lines) {
    const t0 = clean(raw0);
    if (!t0) continue;

    const isHMTail = /\d+,\d{4}\s+(?:\d+,\d{2}\s+){0,3}\d+,\d{2}$/;
    const prevEndsWithHMTail = out.length > 0 && isHMTail.test(out[out.length - 1]);

    const starter =
      (fmt === "HM") ? (/^\d+\s+/.test(t0) || prevEndsWithHMTail) :
      (fmt === "CARIBBEAN") ? (/^\d{9}\s+/.test(t0) || /\d+,\d{2}\s+[A-Za-z]+$/.test(t0)) :
      (fmt === "FLAMINGO") ? RE_FLA_TAIL.test(t0) :
      (fmt === "BONANZA") ? /\s\d+,\d{2}\s+\S+\s*$/.test(t0) :
      (fmt === "HELIOS") ? (/^\d+\s+/.test(t0) || /\d+(\.\d+)?\s+[A-Za-z]+$/.test(t0)) :
      (fmt === "MARHOTELES") ? (/^\d+\s+[A-Za-z]/.test(t0) || /\d+(,\d+)?\s+\d+(,\d+)?\s+\d+(,\d+)?\s+\d+(,\d+)?\s+\d+(,\d+)?$/.test(t0)) :
      (fmt === "OLIVIA") ? /\s\d+(?:[.,]\d+)?\s+[A-Za-z.]+\s*$/.test(t0) :
      (fmt === "SERUNION") ? /^\d{6}\s+/.test(t0) :
      (fmt === "CLUBMARTHA") ? /^\d+\s+[A-Za-z]/.test(t0) :
      (fmt === "FRUTAS") ? true :
      (fmt === "LAGARDERE") ? /^\d{13}\s+\d{6}\s+/.test(t0) :
      ( /^\d+\s+\d+\s+/.test(t0) || /^\d{9}\s+/.test(t0) || RE_FLA_TAIL.test(t0) );

    if (starter) out.push(t0);
    else if (out.length) out[out.length - 1] = normWS(out[out.length - 1] + " " + t0);
  }
  return out;
}

// ================= DETECT =================
function autoDetect(text: string){
  if (/Pedido\s+H24/i.test(text)) return "H24";
  if (/\bPrecio\s+Unit\.\b/i.test(text) && /^\s*\d+\s+\d+\s+.+\s+\d+,\d{2}\s+\w+\s+Precio\s+Unit\./mi.test(text)) return "H24";
  if (/Precio\s+Unit\./i.test(text) && /\b\d+\|\d+\b/.test(text)) return "NIUUT";
  if (/^\s*\d{9}\s+.+\s+\d+\s+\d+,\d{2}\s+[A-Za-z]{1,5}(\s+\d+)?\s*$/m.test(text)) return "CARIBBEAN";
  if (/\s%\s*\d+\s+\d+,\d{2}\s*$/m.test(text)) return "AMADIP";
  if (/\d+,\d{4}/.test(text)) return "HM";
  if (RE_FLA_TAIL.test(text)) return "FLAMINGO";
  if (/\s\d+,\d{2}\s+[A-Za-zÁÉÍÓÚÜÑ.]{1,8}\s*$/m.test(text)) return "BONANZA";
  if (/Mar Hotels/i.test(text) || /\bCoste\s+unitario\s+Descuento\b/i.test(text)) return "MARHOTELES";
  if (/olivia hotelscollection/i.test(text) || /HOJA DE PEDIDO POR CENTRO/i.test(text)) return "OLIVIA";
  if (/SERUNION/i.test(text) || /spairal/i.test(text)) return "SERUNION";
  if (/CLUB MARTHA/i.test(text) || /Hotels & Resorts Blue Sea/i.test(text) || /club mac/i.test(text) || /^\s*\d+\s+.*\s+\d+(?:[.,]\d+)?\s+(?:[A-Za-z]+|BDJ\s+\d+\s+UNIDAD|BDJ\s+\d+GR\s+\d+\s+UNID1A\.D55000|MJO\s+\d+\s+UNIDAD)\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{5})\s+\d+(?:[.,]\d{2})\s*$/m.test(text)) return "CLUBMARTHA";
  if (/cap de mar/i.test(text) || /^\s*[A-Z0-9]+(?:\s+.*)?\s+\d+\s+\d+(?:[.,]\d+)?\s+[A-Za-z.\/]+\s+\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?\s*$/m.test(text)) return "CAPDEMAR";
  if (/bioen/i.test(text)) return "BIOEN";
  if (/^\s*\d{13}\s+\d{6}\s+/m.test(text)) return "LAGARDERE";
  if (/\t\d+\t\d+\s+|\s{2,}\d+\s{2,}\d+\s+/.test(text)) return "FRUTAS";
  if (/garonda/i.test(text)) return "GARONDA";
  const textLines = text.split(/\r?\n/).filter(l => l.trim());
  if (/^\s*\d{10}\s+.+\s+\d+(?:[.,]\d+)?\s+[A-Za-z.]+\s+\d+(?:[.,]\d+)?\s*$/m.test(text)) return "NUEVO_FORMATO";
  if (textLines.length > 0 && /^\s*\d{9}\s+[A-Za-z]/.test(textLines[0]) && /\s+\d+(?:\.\d+)?\s+[A-Za-z]+\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/.test(textLines[0])) {
    return "GARONDA";
  }
  if (textLines.length > 0 && /^\s*\d{7}\s+[A-Za-z]/.test(textLines[0]) && /\s+\d+(?:\.\d+)?\s+[A-Za-z]+\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/.test(textLines[0])) {
    return "BIOEN";
  }
  if (/^\s*\d+\s+(?:.*\s+)?\d+\.\d{2}\s+[A-Za-z]+\s*$/m.test(text)) return "HELIOS";
  return "HM";
}

function parseBy(fmt: string, mergedLines: string[]){
  if (fmt === "NIUUT") return parseNIUUT(mergedLines);
  if (fmt === "H24") return parseH24(mergedLines);
  if (fmt === "CAPDEMAR") return parseCAPDEMAR(mergedLines);

  const rows: string[][] = [];
  const errors: {original: string, reason: string}[] = [];
  for (const line of mergedLines){
    const p =
      (fmt === "AMADIP") ? parseAMADIP(line) :
      (fmt === "CARIBBEAN") ? parseCAR(line) :
      (fmt === "FLAMINGO") ? parseFLA(line) :
      (fmt === "BONANZA") ? parseBON(line) :
      (fmt === "HELIOS") ? parseHELIOS(line) :
      (fmt === "MARHOTELES") ? parseMAR(line) :
      (fmt === "OLIVIA") ? parseOLIVIA(line) :
      (fmt === "SERUNION") ? parseSERUNION(line) :
      (fmt === "CLUBMARTHA") ? parseCLUBMARTHA(line) :
      (fmt === "BIOEN") ? parseBIOEN(line) :
      (fmt === "GARONDA") ? parseGARONDA(line) :
      (fmt === "FRUTAS") ? parseFRUTAS(line) :
      (fmt === "LAGARDERE") ? parseLAGARDERE(line) :
      (fmt === "NUEVO_FORMATO") ? parseNUEVO_FORMATO(line) :
      parseHM(line);

    if (p.ok) rows.push(p.row);
    else errors.push({ original: p.original, reason: (p as any).reason });
  }
  return { rows, errors };
}

function OccidentalParser() {
  const [inputData, setInputData] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [memoria, setMemoria] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('misCodigosGuardados') || '{}'); }
    catch { return {}; }
  });

  const procesar = () => {
    const lines = inputData.split('\n');
    const newRows: any[] = [];
    let currentRowsCount = rows.length;

    lines.forEach(line => {
      if (line.trim() === "") return;
      let parts = line.trim().split(/\s+/);
      let pos, fecha, material, cant, desc, unidad, precio, importe, imp;

      if (parts.length >= 9) {
          pos = parts[0]; fecha = parts[1]; material = parts[2];
          imp = parts[parts.length - 1]; importe = parts[parts.length - 2];
          precio = parts[parts.length - 3]; unidad = parts[parts.length - 4];
          cant = parts[parts.length - 5]; desc = parts.slice(3, parts.length - 5).join(" ");
      } else {
          desc = line.replace(/[0-9]+,[0-9]+$/, '').trim(); 
          const matchCant = line.match(/[0-9]+,[0-9]+$/);
          cant = matchCant ? matchCant[0] : "";
          
          material = memoria[desc.toUpperCase()] || ""; 
          
          currentRowsCount++;
          pos = currentRowsCount * 10;
          fecha = "18.12.2025"; 
          unidad = "Kilogramo"; precio = "0,00"; importe = "0,00"; imp = "4";
      }
      newRows.push({ id: Math.random().toString(), pos, fecha, material, desc, cant, unidad, precio, importe, imp });
    });
    setRows([...rows, ...newRows]);
    setInputData("");
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows(rows.map(r => {
      if (r.id === id) {
        const newRow = { ...r, [field]: value };
        if (field === 'material' && newRow.desc && value) {
          const newMemoria = { ...memoria, [newRow.desc.toUpperCase().trim()]: value.trim() };
          setMemoria(newMemoria);
          localStorage.setItem('misCodigosGuardados', JSON.stringify(newMemoria));
        }
        return newRow;
      }
      return r;
    }));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const nuevoPedido = () => {
    if(window.confirm("¿Borrar tabla actual? Los códigos aprendidos se mantendrán.")) {
      setRows([]);
      setInputData("");
    }
  };

  const borrarColumnaMaterial = () => {
    if(window.confirm("¿Vaciar columna? Esto no borra la memoria guardada.")) {
      setRows(rows.map(r => ({ ...r, material: "" })));
    }
  };

  const aplicarCodigosGuardados = () => {
    setRows(rows.map(r => {
      if (!r.material && r.desc) {
        const savedCode = memoria[r.desc.toUpperCase().trim()];
        if (savedCode) {
          return { ...r, material: savedCode };
        }
      }
      return r;
    }));
  };

  const copiarParaExcel = async () => {
    let excelData = "Material\tDescripción\tCantidad\n"; 
    rows.forEach(row => {
        excelData += `${row.material}\t${row.desc}\t${row.cant}\n`;
    });
    await navigator.clipboard.writeText(excelData);
    alert("Copiado para Excel.");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = document.getElementById(`material-${index + 1}`);
      if (next) next.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = document.getElementById(`material-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm print:hidden">
        <h2 className="font-bold text-gray-800 mb-3">Panel de Herramientas:</h2>
        <textarea 
          value={inputData}
          onChange={e => setInputData(e.target.value)}
          placeholder="Pega aquí el listado de la orden de compra..."
          className="w-full h-24 font-mono text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-y mb-4"
        />
        <div className="flex flex-wrap gap-3">
          <button onClick={procesar} className="px-4 py-2 bg-[#00457c] text-white font-bold rounded hover:bg-blue-900 transition-colors">
            1. Procesar Listado
          </button>
          <button onClick={nuevoPedido} className="px-4 py-2 bg-[#f39c12] text-white font-bold rounded hover:bg-yellow-600 transition-colors">
            2. Limpiar para Pedido Nuevo
          </button>
          <button onClick={borrarColumnaMaterial} className="px-4 py-2 bg-[#d32f2f] text-white font-bold rounded hover:bg-red-700 transition-colors">
            Vaciar Columna Material
          </button>
          <button onClick={aplicarCodigosGuardados} className="px-4 py-2 bg-[#1976d2] text-white font-bold rounded hover:bg-blue-800 transition-colors">
            Aplicar Códigos Guardados
          </button>
          <button onClick={copiarParaExcel} className="px-4 py-2 bg-[#2e7d32] text-white font-bold rounded hover:bg-green-800 transition-colors">
            3. Copiar para EXCEL
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition-colors">
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between font-bold text-sm mb-4">
          <div>Centro 2307 Occidental Playa de Palma</div>
          <div>Almacén 2081 COCINA (Propio)</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-800">
                <th className="p-2 w-10 border-b border-black">Pos</th>
                <th className="p-2 w-20 border-b border-black">F.entrega</th>
                <th className="p-2 w-24 border-b border-black">Material</th>
                <th className="p-2 border-b border-black">Descrip. Material</th>
                <th className="p-2 w-16 text-right border-b border-black">Cant.</th>
                <th className="p-2 w-24 border-b border-black">Unidad</th>
                <th className="p-2 w-16 text-right border-b border-black">Precio</th>
                <th className="p-2 w-16 text-right border-b border-black">Importe</th>
                <th className="p-2 w-10 text-right border-b border-black">Imp.</th>
                <th className="p-2 w-8 print:hidden border-b border-black"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-1"><input type="text" value={row.pos} onChange={e => updateRow(row.id, 'pos', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1" /></td>
                  <td className="p-1"><input type="text" value={row.fecha} onChange={e => updateRow(row.id, 'fecha', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1" /></td>
                  <td className="p-1"><input id={`material-${i}`} type="text" value={row.material} onChange={e => updateRow(row.id, 'material', e.target.value)} onKeyDown={e => handleKeyDown(e, i)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1 font-bold text-blue-700" /></td>
                  <td className="p-1"><input type="text" value={row.desc} onChange={e => updateRow(row.id, 'desc', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1" /></td>
                  <td className="p-1"><input type="text" value={row.cant} onChange={e => updateRow(row.id, 'cant', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1 text-right" /></td>
                  <td className="p-1"><input type="text" value={row.unidad} onChange={e => updateRow(row.id, 'unidad', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1" /></td>
                  <td className="p-1"><input type="text" value={row.precio} onChange={e => updateRow(row.id, 'precio', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1 text-right" /></td>
                  <td className="p-1"><input type="text" value={row.importe} onChange={e => updateRow(row.id, 'importe', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1 text-right" /></td>
                  <td className="p-1"><input type="text" value={row.imp} onChange={e => updateRow(row.id, 'imp', e.target.value)} className="w-full bg-transparent outline-none focus:bg-[#fffde7] focus:ring-1 focus:ring-[#ffd600] px-1 text-right" /></td>
                  <td className="p-1 print:hidden text-center">
                    <button onClick={() => removeRow(row.id)} className="text-red-600 hover:text-red-800 font-bold px-2 text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'general'|'occidental'>('general');
  const [format, setFormat] = useState("HM");
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(DEFAULT_COPY_CFG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [parsedData, setParsedData] = useState<{
    headers: string[],
    rows: string[][],
    errors: {original: string, reason: string}[],
    fmt: string
  } | null>(null);

  const [status, setStatus] = useState<{msg: string, type: 'ok'|'warn'|'err'} | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_CFG_KEY);
    if (saved) {
      try { setConfig({ ...DEFAULT_COPY_CFG, ...JSON.parse(saved) }); } catch(e){}
    }
    const fold = localStorage.getItem(LS_FOLD_KEY);
    if (fold === "1") setIsConfigOpen(true);
  }, []);

  const updateConfig = (key: keyof typeof DEFAULT_COPY_CFG, value: any) => {
    const newCfg = { ...config, [key]: value };
    setConfig(newCfg);
    localStorage.setItem(LS_CFG_KEY, JSON.stringify(newCfg));
  };

  const toggleConfig = () => {
    const next = !isConfigOpen;
    setIsConfigOpen(next);
    localStorage.setItem(LS_FOLD_KEY, next ? "1" : "0");
  };

  const handleParse = () => {
    const text = input || "";
    const fmt = format === "AUTO" ? autoDetect(text) : format;
    const lines = text.split(/\r?\n/);
    const merged = joinBrokenLines(lines, fmt);
    const { rows, errors } = parseBy(fmt, merged);
    const headers = HEADERS[fmt as keyof typeof HEADERS] || HEADERS.HM;

    setParsedData({ headers, rows, errors, fmt });

    if (!rows.length && !errors.length) {
      setStatus({ msg: "No se pudo parsear nada.", type: "err" });
    } else if (errors.length) {
      setStatus({ msg: `${fmt}: ${rows.length} filas válidas, ${errors.length} con error.`, type: "warn" });
    } else {
      setStatus({ msg: `${fmt}: ${rows.length} filas. Sin errores.`, type: "ok" });
    }
  };

  const handleCopyFull = async () => {
    if (!parsedData || parsedData.rows.length === 0) {
      setStatus({ msg: "No hay datos válidos para copiar.", type: "err" });
      return;
    }
    const text = [parsedData.headers.join("\t"), ...parsedData.rows.map(r => r.join("\t"))].join("\n");
    await navigator.clipboard.writeText(text);
    setStatus({ msg: `Copiado completo (${parsedData.rows.length} filas válidas).`, type: "ok" });
  };

  const handleCopyCustom = async () => {
    if (!parsedData || parsedData.rows.length === 0) {
      setStatus({ msg: "No hay datos válidos para copiar.", type: "err" });
      return;
    }
    
    const fmtKey = parsedData.fmt === "AMADIP" ? "cfgAMADIP" :
                   parsedData.fmt === "CARIBBEAN" ? "cfgCAR" :
                   parsedData.fmt === "FLAMINGO" ? "cfgFLA" :
                   parsedData.fmt === "BONANZA" ? "cfgBON" :
                   parsedData.fmt === "NIUUT" ? "cfgNIU" :
                   parsedData.fmt === "H24" ? "cfgH24" : 
                   parsedData.fmt === "HELIOS" ? "cfgHELIOS" : 
                   parsedData.fmt === "MARHOTELES" ? "cfgMAR" : 
                   parsedData.fmt === "OLIVIA" ? "cfgOLIVIA" : 
                   parsedData.fmt === "SERUNION" ? "cfgSERUNION" : 
                   parsedData.fmt === "CLUBMARTHA" ? "cfgCLUBMARTHA" : 
                   parsedData.fmt === "BIOEN" ? "cfgBIOEN" : 
                   parsedData.fmt === "GARONDA" ? "cfgGARONDA" : 
                   parsedData.fmt === "LAGARDERE" ? "cfgLAGARDERE" : 
                   parsedData.fmt === "NUEVO_FORMATO" ? "cfgNUEVO_FORMATO" : 
                   parsedData.fmt === "CAPDEMAR" ? "cfgCAPDEMAR" : "cfgHM";
                   
    const rawWanted = config[fmtKey as keyof typeof config] as string;
    const wanted = rawWanted.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    
    const idx = new Map(parsedData.headers.map((h,i)=>[h,i]));
    const missing = wanted.filter(h => !idx.has(h));
    
    if (missing.length && config.strictCopy) {
      setStatus({ msg: `No se puede copiar (personalizado): Columnas no encontradas: ${missing.join(", ")}`, type: "err" });
      return;
    }

    const outRows = parsedData.rows.map(r => wanted.map(h => {
      const j = idx.get(h);
      return (j === undefined) ? "" : (r[j as number] ?? "");
    }));

    const out = config.includeHeader
        ? [wanted.join("\t"), ...outRows.map(r => r.join("\t"))].join("\n")
        : outRows.map(r => r.join("\t")).join("\n");

    await navigator.clipboard.writeText(out);
    setStatus({ msg: `Copiado personalizado (${parsedData.rows.length} filas válidas).`, type: "ok" });
  };

  const handleClear = () => {
    setInput("");
    setParsedData(null);
    setStatus(null);
  };

  const handleSaveAllCodes = () => {
    if (!parsedData) return;
    const fmt = parsedData.fmt;
    let codeCol = -1;
    let descCol = -1;

    if (fmt === "HM") {
      codeCol = 0;
      descCol = 2;
    } else if (["AMADIP", "CARIBBEAN", "FLAMINGO", "HELIOS", "MARHOTELES", "OLIVIA", "SERUNION", "CAPDEMAR"].includes(fmt)) {
      codeCol = 0;
      descCol = 1;
    } else if (["NIUUT", "H24"].includes(fmt)) {
      codeCol = 0;
      descCol = 2;
    } else if (fmt === "CLUBMARTHA") {
      codeCol = 2;
      descCol = 1;
    } else if (fmt === "LAGARDERE") {
      codeCol = 1;
      descCol = 2;
    } else if (fmt === "GARONDA" || fmt === "BIOEN") {
      codeCol = 2;
      descCol = 1;
    } else if (fmt === "FRUTAS") {
      codeCol = 2;
      descCol = 0;
    } else if (fmt === "NUEVO_FORMATO") {
      codeCol = 0;
      descCol = 1;
    }

    if (codeCol !== -1 && descCol !== -1) {
      parsedData.rows.forEach(row => {
        const c = row[codeCol];
        const d = row[descCol];
        if (c && d) saveCode(d, c);
      });
      setStatus({ msg: "Memoria de códigos actualizada correctamente.", type: "ok" });
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setParsedData(prev => {
      if (!prev) return prev;
      const newRows = [...prev.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][colIndex] = value;
      
      const fmt = prev.fmt;
      let codeCol = -1;
      let descCol = -1;
      
      if (fmt === "HM") {
        codeCol = 0;
        descCol = 2; // "Descripción" is at index 2
      } else if (["AMADIP", "CARIBBEAN", "FLAMINGO", "HELIOS", "MARHOTELES", "OLIVIA", "SERUNION", "CAPDEMAR"].includes(fmt)) {
        codeCol = 0;
        descCol = 1;
      } else if (["NIUUT", "H24"].includes(fmt)) {
        codeCol = 0;
        descCol = 2;
      } else if (fmt === "CLUBMARTHA") {
        codeCol = 2;
        descCol = 1;
      } else if (fmt === "LAGARDERE") {
        codeCol = 1;
        descCol = 2;
      } else if (fmt === "GARONDA" || fmt === "BIOEN") {
        codeCol = 2;
        descCol = 1;
      } else if (fmt === "FRUTAS") {
        codeCol = 2;
        descCol = 0;
      } else if (fmt === "NUEVO_FORMATO") {
        codeCol = 0;
        descCol = 1;
      }
      
      if (colIndex === codeCol && descCol !== -1) {
        const desc = newRows[rowIndex][descCol];
        saveCode(desc, value);
      }
      
      return { ...prev, rows: newRows };
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_COPY_CFG);
    localStorage.setItem(LS_CFG_KEY, JSON.stringify(DEFAULT_COPY_CFG));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parser de pedidos → Excel</h1>
            <p className="text-gray-500 mt-1">Convierte texto de pedidos a formato tabla y cópialo a Excel</p>
          </div>
          <div className="flex bg-gray-200 p-1 rounded-lg w-fit">
            <button 
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <FileText className="w-4 h-4" />
              General
            </button>
            <button 
              onClick={() => setActiveTab('occidental')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'occidental' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Occidental
            </button>
          </div>
        </header>

        {activeTab === 'general' ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-semibold text-gray-700">Formato:</span>
            {[
              { id: 'HM', label: 'HM' },
              { id: 'AMADIP', label: 'AMADIP' },
              { id: 'CARIBBEAN', label: 'CARIBBEAN BAY' },
              { id: 'FLAMINGO', label: 'FLAMINGO' },
              { id: 'BONANZA', label: 'BONANZA (ANTIGUO)' },
              { id: 'NIUUT', label: 'NIU / UT' },
              { id: 'H24', label: 'TODOS LOS H24' },
              { id: 'HELIOS', label: 'HELIOS' },
              { id: 'MARHOTELES', label: 'MAR HOTELES' },
              { id: 'OLIVIA', label: 'BONANZA PLAYA' },
              { id: 'SERUNION', label: 'SERUNION' },
              { id: 'CLUBMARTHA', label: 'CLUB MARTHA / MAC HOTEL / CLUB MAC' },
              { id: 'CAPDEMAR', label: 'CAP DE MAR' },
              { id: 'BIOEN', label: 'BIOEN' },
              { id: 'GARONDA', label: 'GARONDA' },
              { id: 'FRUTAS', label: 'FRUTAS' },
              { id: 'LAGARDERE', label: 'LAGARDERE' },
              { id: 'NUEVO_FORMATO', label: 'NUEVO FORMATO (VERDE)' },
              { id: 'AUTO', label: 'Auto-detectar' },
            ].map(f => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                <input 
                  type="radio" 
                  name="fmt" 
                  value={f.id} 
                  checked={format === f.id} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium">{f.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p>• Si hay 1 sola línea dudosa: se marca como error y se bloquea "Copiar".</p>
            <p>• Copiado personalizado: eliges columnas y orden por formato (se guarda).</p>
            <p>• <strong>¡NUEVO!</strong> Puedes editar cualquier celda directamente en la tabla antes de copiar (ideal para añadir códigos faltantes).</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={toggleConfig}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              {isConfigOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Settings2 className="w-5 h-5 text-gray-500" />
              Columnas al copiar (personalizado)
            </div>
          </button>
          
          {isConfigOpen && (
            <div className="p-5 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Una columna por línea (nombre exacto de cabecera). El orden será el orden en Excel.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'cfgHM', title: 'HM' },
                  { key: 'cfgAMADIP', title: 'AMADIP' },
                  { key: 'cfgCAR', title: 'CARIBBEAN BAY' },
                  { key: 'cfgFLA', title: 'FLAMINGO' },
                  { key: 'cfgBON', title: 'BONANZA (ANTIGUO)' },
                  { key: 'cfgNIU', title: 'NIU / UT' },
                  { key: 'cfgH24', title: 'TODOS LOS H24' },
                  { key: 'cfgHELIOS', title: 'HELIOS' },
                  { key: 'cfgMAR', title: 'MAR HOTELES' },
                  { key: 'cfgOLIVIA', title: 'BONANZA PLAYA' },
                  { key: 'cfgSERUNION', title: 'SERUNION' },
                  { key: 'cfgCLUBMARTHA', title: 'CLUB MARTHA / MAC HOTEL / CLUB MAC' },
                  { key: 'cfgCAPDEMAR', title: 'CAP DE MAR' },
                  { key: 'cfgBIOEN', title: 'BIOEN' },
                  { key: 'cfgGARONDA', title: 'GARONDA' },
                  { key: 'cfgFRUTAS', title: 'FRUTAS' },
                  { key: 'cfgLAGARDERE', title: 'LAGARDERE' },
                  { key: 'cfgNUEVO_FORMATO', title: 'NUEVO FORMATO (VERDE)' },
                ].map(item => (
                  <div key={item.key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h4 className="font-medium text-sm mb-2 text-gray-700">{item.title}</h4>
                    <textarea 
                      value={config[item.key as keyof typeof DEFAULT_COPY_CFG] as string}
                      onChange={(e) => updateConfig(item.key as keyof typeof DEFAULT_COPY_CFG, e.target.value)}
                      className="w-full h-28 text-xs font-mono p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}

                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/50 flex flex-col justify-center gap-4">
                  <h4 className="font-medium text-sm text-gray-700">Opciones</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.includeHeader}
                      onChange={(e) => updateConfig('includeHeader', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Incluir cabeceras</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.strictCopy}
                      onChange={(e) => updateConfig('strictCopy', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Estricto (si falta columna → error)</span>
                  </label>
                  <button 
                    onClick={resetConfig}
                    className="mt-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors w-fit"
                  >
                    Restablecer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pega aquí el texto del pedido..."
            className="w-full min-h-[240px] font-mono text-sm border border-gray-300 rounded-xl p-4 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleParse}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />
              Parsear
            </button>
            <button 
              onClick={handleCopyFull}
              disabled={!parsedData}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Copy className="w-4 h-4" />
              Copiar (completo)
            </button>
            <button 
              onClick={handleCopyCustom}
              disabled={!parsedData}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Copy className="w-4 h-4" />
              Copiar (personalizado)
            </button>
            <button 
              onClick={handleClear}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>

            <button 
              onClick={handleSaveAllCodes}
              disabled={!parsedData}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              title="Guardar todos los códigos modificados en la memoria"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar Códigos
            </button>

            {status && (
              <div className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
                status.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                status.type === 'warn' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {status.type === 'ok' && <CheckCircle2 className="w-4 h-4" />}
                {status.type === 'warn' && <AlertTriangle className="w-4 h-4" />}
                {status.type === 'err' && <XCircle className="w-4 h-4" />}
                {status.msg}
              </div>
            )}
          </div>
        </div>

        {parsedData && parsedData.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" />
              Errores detectados ({parsedData.errors.length}) — NO se permite copiar hasta que sea 0.
            </h3>
            <ul className="space-y-3 list-decimal list-inside text-sm">
              {parsedData.errors.map((e, i) => (
                <li key={i} className="text-red-900 bg-white/60 p-3 rounded-lg border border-red-100">
                  <div className="font-mono text-xs text-gray-600 mb-1 break-all bg-gray-100 p-1.5 rounded">{e.original}</div>
                  <div className="font-medium">{e.reason}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {parsedData && parsedData.rows.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {parsedData.headers.map((h, i) => (
                    <th key={i} className="p-3 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                    {row.map((cell, j) => {
                      const header = parsedData.headers[j].toLowerCase();
                      const isCode = header.includes("cód") || header.includes("ref") || header === "producto" || header === "artículo";
                      const needsMod = isCode && cell.trim().startsWith("7");

                      return (
                        <td key={j} className="p-0 border-r border-gray-100 last:border-r-0 text-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-blue-50">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleCellChange(i, j, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown' || e.key === 'Enter') {
                                e.preventDefault();
                                const nextInput = document.querySelector(`tr:nth-child(${i + 2}) td:nth-child(${j + 1}) input`) as HTMLInputElement;
                                nextInput?.focus();
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prevInput = document.querySelector(`tr:nth-child(${i}) td:nth-child(${j + 1}) input`) as HTMLInputElement;
                                prevInput?.focus();
                              } else if (e.key === 'ArrowRight') {
                                e.preventDefault();
                                const nextInput = document.querySelector(`tr:nth-child(${i + 1}) td:nth-child(${j + 2}) input`) as HTMLInputElement;
                                nextInput?.focus();
                              } else if (e.key === 'ArrowLeft') {
                                e.preventDefault();
                                const prevInput = document.querySelector(`tr:nth-child(${i + 1}) td:nth-child(${j}) input`) as HTMLInputElement;
                                prevInput?.focus();
                              }
                            }}
                            className={`w-full h-full p-3 bg-transparent outline-none min-w-[80px] transition-colors ${
                              needsMod ? 'bg-red-50 text-red-700 font-bold placeholder:text-red-400 placeholder:font-normal' : ''
                            }`}
                            placeholder={needsMod ? "Modificar código..." : (j === 0 ? "Sin código" : "")}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        ) : (
          <OccidentalParser />
        )}
      </div>
    </div>
  );
}

