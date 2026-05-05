/**
 * Corre en el MAIN world (contexto real de la página).
 * Parchea fetch y XMLHttpRequest para capturar respuestas JSON.
 * Se comunica con el isolated world vía window.postMessage.
 */
(function () {
  const MESSAGE_TYPE = '__JSON_INTERCEPTOR__';
  const originalFetch = window.fetch;
  const OriginalXHR = window.XMLHttpRequest;

  // --- Intercepción de fetch ---
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      response.clone().text().then((text) => {
        const url = response.url || resolveUrl(args[0]);
        const method = (args[1]?.method || 'GET').toUpperCase();
        notifyInterceptor({ url, method, contentType, body: text });
      }).catch(() => {});
    }

    return response;
  };

  // --- Intercepción de XMLHttpRequest ---
  function PatchedXHR() {
    const xhr = new OriginalXHR();
    let method = 'GET';
    let requestUrl = '';

    const originalOpen = xhr.open.bind(xhr);
    xhr.open = function (m, url, ...rest) {
      method = (m || 'GET').toUpperCase();
      requestUrl = url;
      return originalOpen(m, url, ...rest);
    };

    xhr.addEventListener('load', function () {
      const contentType = xhr.getResponseHeader('content-type') || '';
      if (contentType.includes('application/json') && xhr.responseText) {
        notifyInterceptor({
          url: requestUrl,
          method,
          contentType,
          body: xhr.responseText,
        });
      }
    });

    return xhr;
  }

  // Mantener compatibilidad con código que chequea instanceof XMLHttpRequest
  PatchedXHR.prototype = OriginalXHR.prototype;
  Object.setPrototypeOf(PatchedXHR, OriginalXHR);
  window.XMLHttpRequest = PatchedXHR;

  /**
   * Envía los datos al isolated world via postMessage.
   * @param {{ url: string, method: string, contentType: string, body: string }} data
   */
  function notifyInterceptor(data) {
    window.postMessage({ type: MESSAGE_TYPE, payload: data }, '*');
  }

  function resolveUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input?.url) return input.url;
    return '';
  }
})();
