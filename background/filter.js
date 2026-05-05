/**
 * Responsabilidad: decidir si una petición capturada debe ser almacenada.
 * Pura lógica de filtrado. No conoce storage ni la UI.
 */

/**
 * Evalúa si una petición pasa los filtros activos.
 *
 * @param {{ url: string, contentType: string }} request
 * @param {string} urlPattern - Patrón de URL ingresado por el usuario (vacío = sin filtro)
 * @returns {boolean}
 */
export function shouldCapture(request, urlPattern) {
  if (!isJsonContentType(request.contentType)) return false;
  if (urlPattern && !matchesUrlPattern(request.url, urlPattern)) return false;
  return true;
}

/**
 * Verifica que el Content-Type indique JSON.
 * @param {string} contentType
 * @returns {boolean}
 */
function isJsonContentType(contentType) {
  if (!contentType) return false;
  return contentType.includes('application/json');
}

/**
 * Verifica si la URL contiene el patrón ingresado por el usuario (case-insensitive).
 * @param {string} url
 * @param {string} pattern
 * @returns {boolean}
 */
function matchesUrlPattern(url, pattern) {
  try {
    return url.toLowerCase().includes(pattern.toLowerCase());
  } catch {
    return false;
  }
}
