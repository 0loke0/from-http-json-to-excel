/**
 * Responsabilidad: parsear un JSON crudo y transformarlo en { columns, rows }.
 * Sin dependencias de Chrome API ni de SheetJS.
 */

const NUMERIC_KEY    = /^\d+$/;
const NUMERIC_PREFIX = /^\d+\./;
const MAX_DEPTH      = 2;
const SCHEMA_ROWS    = 10; // filas usadas para determinar columnas

// ─── Punto de entrada ────────────────────────────────────────────────────────

/**
 * @param {string|Object} rawJson
 * @returns {{ columns: string[], rows: Object[] } | null}
 */
export function parseJson(rawJson) {
  let parsed;
  try {
    parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  } catch {
    return null;
  }

  const array = findLargestArray(parsed);
  if (!array || array.length === 0) return null;

  // Aplanar cada ítem, normalizar claves con prefijo numérico ("1.Campo" → "Campo")
  const rows = array
    .filter(item => typeof item === 'object' && item !== null && !Array.isArray(item))
    .map(item => normalizeKeys(flattenItem(item)));

  if (rows.length === 0) return null;

  // Columnas = unión de claves de las primeras SCHEMA_ROWS filas
  const columns = schemaColumns(rows);
  if (columns.length === 0) return null;

  return { columns, rows };
}

// ─── Búsqueda del array más grande ───────────────────────────────────────────

function findLargestArray(value, acc = []) {
  if (Array.isArray(value)) {
    const objects = value.filter(
      v => typeof v === 'object' && v !== null && !Array.isArray(v)
    );
    if (objects.length > 0) acc.push(objects);          // guarda solo los items-objeto
    // Un nivel de recursión dentro de los items para cubrir [{Table:[…]}]
    for (const item of value.slice(0, 5)) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        findLargestArray(item, acc);
      }
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value)) findLargestArray(v, acc);
  }
  if (acc.length === 0) return null;
  return acc.reduce((a, b) => (b.length > a.length ? b : a));
}

// ─── Normalización de claves ──────────────────────────────────────────────────

// Quita prefijos numéricos del tipo "1.Campo", "23.Campo" → "Campo".
// La primera ocurrencia de cada clave normalizada gana (preserva el orden natural).
function normalizeKeys(obj) {
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    const k = key.replace(NUMERIC_PREFIX, '');
    if (!(k in out)) out[k] = val;
  }
  return out;
}

// ─── Aplanado de un ítem ──────────────────────────────────────────────────────

function flattenItem(obj, prefix = '', depth = 0) {
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    // Claves puramente numéricas que apuntan a objetos son registros embebidos, no campos reales
    if (NUMERIC_KEY.test(key) && typeof val === 'object' && val !== null && !Array.isArray(val)) {
      continue;
    }
    const k = prefix ? `${prefix}.${key}` : key;
    if (depth < MAX_DEPTH && typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(out, flattenItem(val, k, depth + 1));
    } else {
      out[k] = (val === null || val === undefined)
        ? ''
        : (typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
  return out;
}

// ─── Determinación de columnas ────────────────────────────────────────────────

function schemaColumns(rows) {
  const seen  = new Set();
  const order = [];
  for (const row of rows.slice(0, SCHEMA_ROWS)) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) { seen.add(key); order.push(key); }
    }
  }
  return order;
}
