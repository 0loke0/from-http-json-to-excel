# from-http-json-to-excel

Chrome extension that intercepts HTTP responses containing JSON data from any web page and exports the captured results to a formatted Excel file.

## Overview

Many enterprise web applications consume REST APIs that return large JSON datasets. This extension sits transparently between the browser and those APIs, captures the responses in real time, and lets the user export any selection of them to a multi-sheet `.xlsx` file — one sheet per captured request.

## Features

- Intercepts `fetch` and `XMLHttpRequest` calls on any page
- Filters captures by URL pattern and `Content-Type: application/json`
- Detects and extracts the primary data array from arbitrarily nested JSON structures
- Normalizes column names, flattens nested objects up to two levels deep
- Exports selected requests to a `.xlsx` file, one worksheet per request
- Scanning toggle with a 30-second auto-stop timer
- Stores up to 200 captured requests per browser session

## Architecture

The extension follows a strict separation of responsibilities across three layers.

```
from-http-json-to-excel/
├── manifest.json
├── background/
│   ├── service-worker.js      # Orchestrates the background layer
│   ├── interceptor-relay.js   # Message routing
│   ├── filter.js              # URL and content-type filtering
│   └── storage.js             # chrome.storage.session abstraction
├── content-script/
│   ├── page-script.js         # Runs in MAIN world — patches fetch and XHR
│   └── content-script.js      # Runs in ISOLATED world — relays to service worker
├── popup/
│   ├── popup.html
│   ├── popup.js               # Initializes and coordinates UI components
│   ├── popup.css
│   └── components/
│       ├── scan-toggle.js     # Start/stop scanning button with countdown
│       ├── filter-input.js    # URL pattern filter input
│       ├── request-list.js    # Captured request list with checkboxes
│       └── export-button.js   # Triggers parsing and Excel export
├── services/
│   ├── json-parser.js         # JSON to { columns, rows } transformer
│   └── excel-builder.js       # Excel file builder using ExcelJS
└── lib/
    └── exceljs.min.js         # ExcelJS bundled locally (required by MV3)
```

### Why two content scripts

Chrome Manifest V3 content scripts run in an isolated JavaScript context and cannot access the page's own `window.fetch` or `XMLHttpRequest`. To intercept real network calls, `page-script.js` is injected into the `MAIN` world where it patches those globals. It then forwards captured payloads to `content-script.js` via `window.postMessage`, which relays them to the service worker via `chrome.runtime.sendMessage`.

### JSON parsing strategy

`json-parser.js` locates the largest array of objects within the response, regardless of nesting depth. It then flattens each object (up to two levels), skips numeric-keyed sub-objects, and normalizes keys that carry a numeric prefix (e.g. `1.FieldName` becomes `FieldName`). Column names are derived from the union of keys found in the first ten rows.

## Installation

This extension is not published to the Chrome Web Store. Load it manually as an unpacked extension.

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the root folder of this repository.

## Usage

1. Navigate to the web application whose API responses you want to capture.
2. Click the extension icon to open the popup.
3. Optionally enter a URL pattern in the filter field to limit captures to a specific endpoint (e.g. `api/reportes`).
4. Click **Iniciar** to start a 30-second scanning window.
5. Interact with the web application to trigger the HTTP requests.
6. Select one or more captured requests from the list using the checkboxes.
7. Click **Exportar a Excel**. The file downloads automatically with a timestamp in the filename.

## Requirements

- Google Chrome 102 or later (Manifest V3 and `chrome.storage.session` support)
- No internet connection required after installation

## Limitations

- Only responses with `Content-Type: application/json` are captured
- Maximum of 200 requests stored per browser session
- Excel column limit: 16,384 columns per sheet (Excel specification)
- The extension cannot intercept requests made before the content scripts are injected (i.e. requests fired during the initial page load before `document_start`)

## Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| [ExcelJS](https://github.com/exceljs/exceljs) | 4.x | Excel file generation |

ExcelJS is bundled locally under `lib/` as required by Chrome's Manifest V3 Content Security Policy, which prohibits loading remote scripts.

## License

MIT
