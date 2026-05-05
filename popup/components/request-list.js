/**
 * Responsabilidad: renderizar la lista de peticiones capturadas con checkboxes.
 * Emite un evento cuando el usuario cambia su selección.
 * No conoce storage ni el exportador.
 */

export class RequestList {
  /**
   * @param {HTMLElement} container
   * @param {function(string[]): void} onSelectionChange - IDs seleccionados
   */
  constructor(container, onSelectionChange) {
    this.container = container;
    this.onSelectionChange = onSelectionChange;
    this.requests = [];
    this._render();
  }

  /**
   * Actualiza la lista con nuevas peticiones.
   * @param {import('../../background/storage.js').CapturedRequest[]} requests
   */
  setRequests(requests) {
    this.requests = requests;
    this._renderItems();
  }

  _render() {
    this.container.innerHTML = `
      <div class="list-header">
        <label class="select-all-label">
          <input type="checkbox" id="select-all" />
          <span>Seleccionar todo</span>
        </label>
        <span id="count-label" class="count-label">0 peticiones</span>
      </div>
      <ul id="request-items" class="request-items"></ul>
      <p id="empty-state" class="empty-state">No hay peticiones JSON capturadas aún.</p>
    `;

    this.listEl = this.container.querySelector('#request-items');
    this.emptyEl = this.container.querySelector('#empty-state');
    this.countEl = this.container.querySelector('#count-label');
    this.selectAllEl = this.container.querySelector('#select-all');

    this.selectAllEl.addEventListener('change', () => this._onSelectAll());
  }

  _renderItems() {
    const count = this.requests.length;
    this.countEl.textContent = `${count} petición${count !== 1 ? 'es' : ''}`;
    this.emptyEl.style.display = count === 0 ? 'block' : 'none';
    this.listEl.style.display = count === 0 ? 'none' : 'block';

    this.listEl.innerHTML = this.requests.map((req) => `
      <li class="request-item" data-id="${req.id}">
        <label class="request-label">
          <input type="checkbox" class="request-checkbox" data-id="${req.id}" />
          <span class="request-info">
            <span class="request-method method-${req.method.toLowerCase()}">${req.method}</span>
            <span class="request-url" title="${req.url}">${truncateUrl(req.url)}</span>
          </span>
          <span class="request-time">${formatTime(req.timestamp)}</span>
        </label>
      </li>
    `).join('');

    this.listEl.querySelectorAll('.request-checkbox').forEach((cb) => {
      cb.addEventListener('change', () => this._emitSelection());
    });
  }

  _onSelectAll() {
    const checked = this.selectAllEl.checked;
    this.listEl.querySelectorAll('.request-checkbox').forEach((cb) => {
      cb.checked = checked;
    });
    this._emitSelection();
  }

  _emitSelection() {
    const selected = Array.from(this.listEl.querySelectorAll('.request-checkbox:checked'))
      .map((cb) => cb.dataset.id);
    this.onSelectionChange(selected);
  }

  getSelectedRequests() {
    const selectedIds = new Set(
      Array.from(this.listEl.querySelectorAll('.request-checkbox:checked')).map((cb) => cb.dataset.id)
    );
    return this.requests.filter((r) => selectedIds.has(r.id));
  }
}

function truncateUrl(url) {
  try {
    const { pathname, hostname } = new URL(url);
    const full = `${hostname}${pathname}`;
    return full.length > 55 ? `...${full.slice(-52)}` : full;
  } catch {
    return url.length > 55 ? `...${url.slice(-52)}` : url;
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}
