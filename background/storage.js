/**
 * Responsabilidad: abstracción sobre chrome.storage.session para peticiones capturadas.
 * No conoce filtros ni la UI.
 */

const STORAGE_KEY = 'captured_requests';
const MAX_REQUESTS = 200;

/**
 * @typedef {Object} CapturedRequest
 * @property {string} id
 * @property {string} url
 * @property {string} method
 * @property {string} timestamp
 * @property {string|Object} body
 */

/**
 * Obtiene todas las peticiones almacenadas.
 * @returns {Promise<CapturedRequest[]>}
 */
export async function getRequests() {
  const result = await chrome.storage.session.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

/**
 * Agrega una nueva petición al historial, respetando el límite máximo.
 * @param {CapturedRequest} request
 * @returns {Promise<void>}
 */
export async function addRequest(request) {
  const current = await getRequests();
  const updated = [request, ...current].slice(0, MAX_REQUESTS);
  await chrome.storage.session.set({ [STORAGE_KEY]: updated });
}

/**
 * Elimina todas las peticiones almacenadas.
 * @returns {Promise<void>}
 */
export async function clearRequests() {
  await chrome.storage.session.remove(STORAGE_KEY);
}

/**
 * Lee el patrón de filtro de URL guardado por el usuario.
 * @returns {Promise<string>}
 */
export async function getUrlPattern() {
  const result = await chrome.storage.session.get('url_pattern');
  return result['url_pattern'] || '';
}

/**
 * Guarda el patrón de filtro de URL.
 * @param {string} pattern
 * @returns {Promise<void>}
 */
export async function saveUrlPattern(pattern) {
  await chrome.storage.session.set({ url_pattern: pattern });
}

/**
 * Lee el estado de escaneo (activo por defecto).
 * @returns {Promise<boolean>}
 */
export async function getScanningState() {
  const result = await chrome.storage.session.get('is_scanning');
  return result['is_scanning'] === true; // false por defecto
}

/**
 * Guarda el estado de escaneo.
 * @param {boolean} active
 * @returns {Promise<void>}
 */
export async function setScanningState(active) {
  await chrome.storage.session.set({ is_scanning: active });
}
