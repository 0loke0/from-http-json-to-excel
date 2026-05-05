/**
 * Responsabilidad: orquestar el flujo background.
 * Recibe mensajes del content script → filtra → almacena.
 * Responde mensajes del popup con los datos solicitados.
 */

import { shouldCapture } from './filter.js';
import { addRequest, getRequests, clearRequests, getUrlPattern, saveUrlPattern, getScanningState, setScanningState } from './storage.js';

/**
 * Genera un ID único para cada petición capturada.
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'REQUEST_CAPTURED':
      handleCapturedRequest(message.payload);
      break;

    case 'GET_REQUESTS':
      getRequests().then((requests) => sendResponse({ requests }));
      return true; // Mantener canal abierto para respuesta asíncrona

    case 'CLEAR_REQUESTS':
      clearRequests().then(() => sendResponse({ ok: true }));
      return true;

    case 'GET_URL_PATTERN':
      getUrlPattern().then((pattern) => sendResponse({ pattern }));
      return true;

    case 'SAVE_URL_PATTERN':
      saveUrlPattern(message.payload.pattern).then(() => sendResponse({ ok: true }));
      return true;

    case 'GET_SCANNING':
      getScanningState().then((active) => sendResponse({ active }));
      return true;

    case 'SET_SCANNING':
      setScanningState(message.payload.active).then(() => {
        updateBadge();
        sendResponse({ ok: true });
      });
      return true;
  }
});

/**
 * Procesa una petición recibida del content script.
 * @param {{ url: string, method: string, contentType: string, body: string }} payload
 */
async function handleCapturedRequest(payload) {
  const scanning = await getScanningState();
  if (!scanning) return;

  const pattern = await getUrlPattern();
  if (!shouldCapture({ url: payload.url, contentType: payload.contentType }, pattern)) return;

  await addRequest({
    id: generateId(),
    url: payload.url,
    method: payload.method,
    timestamp: new Date().toISOString(),
    body: payload.body,
  });

  updateBadge();
}

/**
 * Actualiza el contador del ícono de la extensión.
 */
async function updateBadge() {
  const [requests, scanning] = await Promise.all([getRequests(), getScanningState()]);
  if (!scanning) {
    chrome.action.setBadgeText({ text: '■' });
    chrome.action.setBadgeBackgroundColor({ color: '#f38ba8' });
    return;
  }
  const count = requests.length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}
