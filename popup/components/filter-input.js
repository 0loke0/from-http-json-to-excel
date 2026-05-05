/**
 * Responsabilidad: renderizar y gestionar el input de filtro por URL.
 * Guarda el patrón en el service worker cuando cambia.
 * No conoce la lista de peticiones ni el exportador.
 */

export class FilterInput {
  /**
   * @param {HTMLElement} container - Elemento donde montar el componente
   * @param {function(string): void} onChange - Callback cuando el patrón cambia
   */
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this._render();
    this._loadSavedPattern();
  }

  _render() {
    this.container.innerHTML = `
      <div class="filter-input-wrapper">
        <label for="url-filter" class="filter-label">Filtrar por URL</label>
        <input
          id="url-filter"
          type="text"
          class="filter-input"
          placeholder="ej: api.midominio.com"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="filter-hint">Vacío = capturar todo</span>
      </div>
    `;

    this.input = this.container.querySelector('#url-filter');
    this.input.addEventListener('input', () => this._onInputChange());
  }

  _onInputChange() {
    const pattern = this.input.value.trim();
    chrome.runtime.sendMessage({ type: 'SAVE_URL_PATTERN', payload: { pattern } });
    this.onChange(pattern);
  }

  async _loadSavedPattern() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_URL_PATTERN' });
    if (response?.pattern) {
      this.input.value = response.pattern;
    }
  }

  getValue() {
    return this.input?.value.trim() || '';
  }
}
