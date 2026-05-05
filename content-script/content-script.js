/**
 * Corre en el ISOLATED world.
 * Escucha mensajes de page-script.js (MAIN world) y los reenvía al service worker.
 */

const MESSAGE_TYPE = '__JSON_INTERCEPTOR__';

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== MESSAGE_TYPE) return;

  const payload = event.data.payload;
  if (!payload?.url || !payload?.body) return;

  try {
    chrome.runtime.sendMessage({ type: 'REQUEST_CAPTURED', payload });
  } catch {
    // La extensión puede estar inactiva — ignorar silenciosamente
  }
});
