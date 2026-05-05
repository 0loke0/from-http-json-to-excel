/**
 * Responsabilidad: botón de inicio/pausa del escaneo.
 * Al activar, corre un contador de 30 segundos y se detiene automáticamente.
 * No conoce la lista ni el exportador.
 */

const SCAN_DURATION_SEC = 30;

export class ScanToggle {
  /**
   * @param {HTMLElement} container
   * @param {function(boolean): void} onChange
   */
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange;
    this.active = false;
    this._secondsLeft = 0;
    this._timerId = null;
    this._render();
    this._loadState();
  }

  _render() {
    this.container.innerHTML = `
      <button id="scan-toggle-btn" class="scan-toggle paused" title="Iniciar escaneo (30s)">
        <span class="scan-icon">▶</span>
        <span class="scan-label">Iniciar</span>
      </button>
    `;
    this.btn = this.container.querySelector('#scan-toggle-btn');
    this.btn.addEventListener('click', () => this._toggle());
  }

  async _loadState() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SCANNING' });
    const active = response?.active === true;
    // Si al abrir el popup el SW dice que está activo, retomamos el contador visual
    if (active) {
      this._startCountdown();
    } else {
      this._applyState(false);
    }
  }

  async _toggle() {
    if (this.active) {
      this._stop();
    } else {
      this._start();
    }
  }

  async _start() {
    await chrome.runtime.sendMessage({ type: 'SET_SCANNING', payload: { active: true } });
    this._startCountdown();
    this.onChange(true);
  }

  async _stop() {
    clearInterval(this._timerId);
    this._timerId = null;
    await chrome.runtime.sendMessage({ type: 'SET_SCANNING', payload: { active: false } });
    this._applyState(false);
    this.onChange(false);
  }

  _startCountdown() {
    this._secondsLeft = SCAN_DURATION_SEC;
    this._applyState(true);
    clearInterval(this._timerId);

    this._timerId = setInterval(async () => {
      this._secondsLeft -= 1;
      if (this._secondsLeft <= 0) {
        await this._stop();
      } else {
        this.btn.querySelector('.scan-label').textContent = `${this._secondsLeft}s`;
      }
    }, 1000);
  }

  _applyState(active) {
    this.active = active;
    this.btn.classList.toggle('scanning', active);
    this.btn.classList.toggle('paused', !active);
    this.btn.title = active ? 'Detener escaneo' : 'Iniciar escaneo (30s)';
    this.btn.querySelector('.scan-icon').textContent = active ? '⏸' : '▶';
    this.btn.querySelector('.scan-label').textContent = active
      ? `${this._secondsLeft}s`
      : 'Iniciar';
  }

  isActive() {
    return this.active;
  }
}
