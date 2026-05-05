/**
 * Responsabilidad: construir y descargar un .xlsx usando ExcelJS.
 * Escribe fila a fila sin acumular celdas en memoria → sin límite práctico de tamaño.
 * Cada captura se convierte en una hoja independiente del mismo libro.
 */

/**
 * @param {{ columns: string[], rows: Object[], label?: string }[]} captures
 * @returns {Promise<void>}
 */
export async function buildAndDownloadExcel(captures) {
  if (!window.ExcelJS) {
    throw new Error('ExcelJS no está disponible.');
  }

  const workbook = new window.ExcelJS.Workbook();
  workbook.creator = 'JSON to Excel Interceptor';
  workbook.created = new Date();

  for (let i = 0; i < captures.length; i++) {
    const { rows, label } = captures[i];
    // Cap duro: Excel no soporta más de 16 384 columnas
    const columns = captures[i].columns.slice(0, 16384);
    const sheetName = sanitizeSheetName(label || `Hoja ${i + 1}`);
    const sheet = workbook.addWorksheet(sheetName);

    // Ancho de columnas antes de agregar filas (requerido por ExcelJS)
    sheet.columns = columns.map((col) => ({
      header: col,
      key: col,
      width: Math.min(Math.max(col.length + 2, 12), 50),
    }));

    // Aplicar estilo al encabezado
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Filas de datos — una a una, sin acumular en memoria
    for (const row of rows) {
      sheet.addRow(columns.map((col) => serializeCell(row[col])));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);

  await new Promise((resolve, reject) => {
    chrome.downloads.download({ url, filename: buildFileName() }, (downloadId) => {
      URL.revokeObjectURL(url);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(downloadId);
      }
    });
  });
}

function serializeCell(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function buildFileName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
  return `captura_${date}_${time}.xlsx`;
}

function sanitizeSheetName(name) {
  return String(name).replace(/[\\\/\?\*\[\]:]/g, '_').substring(0, 31);
}
