/**
 * Responsabilidad: punto de entrada del popup.
 * Inicializa los componentes, los coordina y refresca los datos.
 */

import { FilterInput } from './components/filter-input.js';
import { RequestList } from './components/request-list.js';
import { ExportButton } from './components/export-button.js';
import { ScanToggle } from './components/scan-toggle.js';

let requestList;
let exportButton;

async function init() {
  const scanToggle = new ScanToggle(
    document.getElementById('scan-section'),
    onScanChange
  );

  new FilterInput(
    document.getElementById('filter-section'),
    onFilterChange
  );

  requestList = new RequestList(
    document.getElementById('list-section'),
    onSelectionChange
  );

  exportButton = new ExportButton(
    document.getElementById('export-section'),
    () => requestList.getSelectedRequests(),
    () => scanToggle.stop()
  );

  document.getElementById('clear-btn').addEventListener('click', onClear);

  // Cargar peticiones iniciales
  await refreshList();
}

async function refreshList() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_REQUESTS' });
  requestList.setRequests(response?.requests || []);
}

function onScanChange(_active) {
  // El badge se actualiza en el service worker; solo refrescamos la lista
  refreshList();
}

function onFilterChange(_pattern) {
  refreshList();
}

function onSelectionChange(selectedIds) {
  exportButton.updateState(selectedIds.length);
}

async function onClear() {
  await chrome.runtime.sendMessage({ type: 'CLEAR_REQUESTS' });
  chrome.action.setBadgeText({ text: '' }).catch(() => {});
  await refreshList();
  exportButton.updateState(0);
}

document.addEventListener('DOMContentLoaded', init);
