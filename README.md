# from-http-json-to-excel

Extension de Chrome que intercepta respuestas HTTP con datos JSON en cualquier pagina web y permite exportar los resultados capturados a un archivo Excel formateado.

Chrome extension that intercepts HTTP responses containing JSON data from any web page and exports the captured results to a formatted Excel file.

---

## Descripcion general / Overview

Muchas aplicaciones empresariales consumen APIs REST que retornan grandes volumenes de datos JSON. Esta extension se situa de forma transparente entre el navegador y esas APIs, captura las respuestas en tiempo real y permite al usuario exportar cualquier seleccion de ellas a un archivo `.xlsx` con multiples hojas, una por peticion capturada.

Many enterprise web applications consume REST APIs that return large JSON datasets. This extension sits transparently between the browser and those APIs, captures the responses in real time, and lets the user export any selection of them to a multi-sheet `.xlsx` file — one sheet per captured request.

---

## Caracteristicas / Features

- Intercepta llamadas `fetch` y `XMLHttpRequest` en cualquier pagina
- Filtra capturas por patron de URL y `Content-Type: application/json`
- Detecta y extrae el array principal de datos en estructuras JSON anidadas
- Normaliza nombres de columnas y aplana objetos hasta dos niveles de profundidad
- Exporta las peticiones seleccionadas a `.xlsx`, una hoja por peticion
- Toggle de escaneo con auto-stop de 30 segundos
- Almacena hasta 200 peticiones capturadas por sesion del navegador

---

- Intercepts `fetch` and `XMLHttpRequest` calls on any page
- Filters captures by URL pattern and `Content-Type: application/json`
- Detects and extracts the primary data array from arbitrarily nested JSON structures
- Normalizes column names, flattens nested objects up to two levels deep
- Exports selected requests to a `.xlsx` file, one worksheet per request
- Scanning toggle with a 30-second auto-stop timer
- Stores up to 200 captured requests per browser session

---

## Arquitectura / Architecture

La extension sigue una separacion estricta de responsabilidades en tres capas.

The extension follows a strict separation of responsibilities across three layers.

```
from-http-json-to-excel/
├── manifest.json
├── background/
│   ├── service-worker.js      # Orquesta la capa background / Orchestrates the background layer
│   ├── filter.js              # Filtrado por URL y Content-Type / URL and content-type filtering
│   └── storage.js             # Abstraccion de chrome.storage.session / chrome.storage.session abstraction
├── content-script/
│   ├── page-script.js         # Corre en MAIN world, parchea fetch y XHR / Runs in MAIN world — patches fetch and XHR
│   └── content-script.js      # Corre en ISOLATED world, retransmite al SW / Runs in ISOLATED world — relays to service worker
├── popup/
│   ├── popup.html
│   ├── popup.js               # Inicializa y coordina los componentes UI / Initializes and coordinates UI components
│   ├── popup.css
│   └── components/
│       ├── scan-toggle.js     # Boton inicio/pausa con cuenta regresiva / Start/stop button with countdown
│       ├── filter-input.js    # Campo de filtro por URL / URL pattern filter input
│       ├── request-list.js    # Lista de peticiones con checkboxes / Captured request list with checkboxes
│       └── export-button.js   # Dispara el parseo y la exportacion / Triggers parsing and Excel export
├── services/
│   ├── json-parser.js         # Transforma JSON a { columns, rows } / JSON to { columns, rows } transformer
│   └── excel-builder.js       # Construye el archivo Excel con ExcelJS / Excel file builder using ExcelJS
└── lib/
    └── exceljs.min.js         # ExcelJS empaquetado localmente (requerido por MV3) / ExcelJS bundled locally (required by MV3)
```

### Por que dos content scripts / Why two content scripts

Los content scripts de Chrome MV3 corren en un contexto JavaScript aislado y no pueden acceder al `window.fetch` ni al `XMLHttpRequest` real de la pagina. Para interceptar llamadas de red reales, `page-script.js` se inyecta en el mundo `MAIN` donde parchea esos globales. Luego reenvía los datos capturados a `content-script.js` via `window.postMessage`, que los retransmite al service worker via `chrome.runtime.sendMessage`.

Chrome Manifest V3 content scripts run in an isolated JavaScript context and cannot access the page's own `window.fetch` or `XMLHttpRequest`. To intercept real network calls, `page-script.js` is injected into the `MAIN` world where it patches those globals. It then forwards captured payloads to `content-script.js` via `window.postMessage`, which relays them to the service worker via `chrome.runtime.sendMessage`.

### Estrategia de parseo JSON / JSON parsing strategy

`json-parser.js` localiza el array de objetos mas grande dentro de la respuesta, sin importar el nivel de anidamiento. Luego aplana cada objeto (hasta dos niveles), omite sub-objetos con claves numericas y normaliza claves que llevan prefijo numerico (ej. `1.Campo` se convierte en `Campo`). Los nombres de columna se derivan de la union de claves encontradas en las primeras diez filas.

`json-parser.js` locates the largest array of objects within the response, regardless of nesting depth. It then flattens each object (up to two levels), skips numeric-keyed sub-objects, and normalizes keys that carry a numeric prefix (e.g. `1.FieldName` becomes `FieldName`). Column names are derived from the union of keys found in the first ten rows.

---

## Instalacion / Installation

Esta extension no esta publicada en Chrome Web Store. Se carga manualmente como extension sin empaquetar.

This extension is not published to the Chrome Web Store. Load it manually as an unpacked extension.

1. Clona o descarga este repositorio. / Clone or download this repository.
2. Abre Chrome y navega a `chrome://extensions`. / Open Chrome and navigate to `chrome://extensions`.
3. Activa el **Modo desarrollador** con el toggle en la esquina superior derecha. / Enable **Developer mode** using the toggle in the top-right corner.
4. Haz clic en **Cargar descomprimida** y selecciona la carpeta raiz del repositorio. / Click **Load unpacked** and select the root folder of this repository.

---

## Uso / Usage

1. Navega a la aplicacion web cuyas respuestas de API deseas capturar. / Navigate to the web application whose API responses you want to capture.
2. Haz clic en el icono de la extension para abrir el popup. / Click the extension icon to open the popup.
3. Opcionalmente escribe un patron de URL en el campo de filtro para limitar las capturas a un endpoint especifico (ej. `api/reportes`). / Optionally enter a URL pattern in the filter field to limit captures to a specific endpoint (e.g. `api/reportes`).
4. Haz clic en **Iniciar** para abrir una ventana de escaneo de 30 segundos. / Click **Iniciar** to start a 30-second scanning window.
5. Interactua con la aplicacion web para disparar las peticiones HTTP. / Interact with the web application to trigger the HTTP requests.
6. Selecciona una o varias peticiones capturadas de la lista usando los checkboxes. / Select one or more captured requests from the list using the checkboxes.
7. Haz clic en **Exportar a Excel**. El archivo se descarga automaticamente con un timestamp en el nombre. / Click **Exportar a Excel**. The file downloads automatically with a timestamp in the filename.

---

## Requisitos / Requirements

- Google Chrome 102 o superior (soporte para Manifest V3 y `chrome.storage.session`) / Google Chrome 102 or later (Manifest V3 and `chrome.storage.session` support)
- No requiere conexion a internet despues de la instalacion / No internet connection required after installation

---

## Limitaciones / Limitations

- Solo se capturan respuestas con `Content-Type: application/json` / Only responses with `Content-Type: application/json` are captured
- Maximo 200 peticiones almacenadas por sesion del navegador / Maximum of 200 requests stored per browser session
- Limite de columnas de Excel: 16.384 columnas por hoja (especificacion de Excel) / Excel column limit: 16,384 columns per sheet (Excel specification)
- La extension no puede interceptar peticiones disparadas antes de que los content scripts sean inyectados / The extension cannot intercept requests fired before the content scripts are injected

---

## Dependencias / Dependencies

| Libreria / Library | Version | Proposito / Purpose |
|--------------------|---------|---------------------|
| [ExcelJS](https://github.com/exceljs/exceljs) | 4.x | Generacion de archivos Excel / Excel file generation |

ExcelJS se empaqueta localmente bajo `lib/` tal como lo requiere la Politica de Seguridad de Contenido de Chrome MV3, que prohibe cargar scripts remotos.

ExcelJS is bundled locally under `lib/` as required by Chrome's Manifest V3 Content Security Policy, which prohibits loading remote scripts.

---

## Licencia / License

MIT
