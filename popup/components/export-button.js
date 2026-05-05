/**
 * Responsabilidad: botón de exportación.
 * Recibe las peticiones seleccionadas, las transforma con json-parser y dispara excel-builder.
 * No conoce el interceptor ni el almacenamiento directamente.
 */

import { parseJson } from '../../services/json-parser.js';
import { buildAndDownloadExcel } from '../../services/excel-builder.js';

export class ExportButton {
  /**
   * @param {HTMLElement} container
   * @param {function(): import('../components/request-list.js').CapturedRequest[]} getSelected
   * @param {function(): void} [onExportStart] - Se llama justo antes de iniciar la exportación
   */
  constructor(container, getSelected, onExportStart) {
    this.container = container;
    this.getSelected = getSelected;
    this.onExportStart = onExportStart || null;
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <button id="export-btn" class="export-btn" disabled>
        Exportar a Excel
      </button>
      <p id="export-error" class="export-error" hidden></p>
    `;

    this.btn = this.container.querySelector('#export-btn');
    this.errorEl = this.container.querySelector('#export-error');
    this.btn.addEventListener('click', () => this._onExport());
  }

  /**
   * Habilita o deshabilita el botón según si hay selección.
   * @param {number} selectedCount
   */
  updateState(selectedCount) {
    this.btn.disabled = selectedCount === 0;
    this.btn.textContent = selectedCount > 0
      ? `Exportar ${selectedCount} petición${selectedCount !== 1 ? 'es' : ''} a Excel`
      : 'Exportar a Excel';
    this.errorEl.hidden = true;
  }

  async _onExport() {
    const selected = this.getSelected();
    if (!selected.length) return;

    const captures = [];
    for (const req of selected) {
      const parsed = parseJson(req.body);
      if (!parsed) {
        this._showError(`No se pudo parsear el JSON de: ${req.url}`);
        return;
      }
      captures.push({ ...parsed, label: buildSheetLabel(req) });
    }

    const labels = deduplicateLabels(captures.map((c) => c.label));
    labels.forEach((label, i) => { captures[i].label = label; });

    this.btn.disabled = true;
    this.btn.textContent = 'Generando…';
    this.errorEl.hidden = true;

    if (this.onExportStart) this.onExportStart();

    try {
      await buildAndDownloadExcel(captures);
    } catch (err) {
      this._showError(`Error: ${err.message}`);
    }

    // Restaurar botón sin tocar el estado del error
    this.btn.disabled = false;
    this.btn.textContent = `Exportar ${selected.length} petición${selected.length !== 1 ? 'es' : ''} a Excel`;
  }

  _showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }
}

/**
 * Genera una etiqueta corta para identificar la hoja en el Excel.
 * Extrae el ultimo segmento del path antes del "?" sin depender de URL absoluta.
 * @param {{ url: string, method: string }} req
 * @returns {string}
 */
function buildSheetLabel(req) {
  const path = req.url.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || req.method;
}

/**
 * Garantiza nombres de hoja unicos agregando sufijo numerico cuando hay colisiones.
 * @param {string[]} labels
 * @returns {string[]}
 */
function deduplicateLabels(labels) {
  const seen = new Map();
  return labels.map((label) => {
    const count = (seen.get(label) || 0) + 1;
    seen.set(label, count);
    return count === 1 ? label : `${label}_${count}`;
  });
}
