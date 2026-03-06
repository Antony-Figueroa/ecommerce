/**
 * ============================================
 * Google Apps Script - Sincronización Completa
 * ============================================
 * 
 * CARACTERÍSTICAS INCLUIDAS:
 * ✓ Validación de SKU y datos
 * ✓ Detección de duplicados
 * ✓ Solo permite editar columna Stock
 * ✓ Resolución de conflictos
 * ✓ Historial de cambios
 * ✓ Barra de progreso
 * ✓ Validación de rango de stock
 * ✓ Validación de precios
 * ✓ Stats y configuración
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheets
 * 2. Ve a Extensiones → Apps Script
 * 3. Borra cualquier código existente y pega este archivo
 * 4. Configura CONFIG al final del archivo
 * 5. Guarda y ejecuta onOpen() una vez
 * 6. Configura un disparador para syncOnOpen
 */

// ==================== CONFIGURACIÓN ====================
const CONFIG = {
  // 1️⃣ ENTORNO DE PRODUCCIÓN (Cuando subas la app a Vercel/Render, pega el link aquí)
  API_URL_PROD: 'https://api.tu-ecommerce.com/api/sync',

  // 2️⃣ ENTORNO DE DESARROLLO (Túnel hacia tu compu, ej: npx localtunnel --port 3001)
  API_URL_DEV: 'https://tu-url-de-ngrok.loca.lt/api/sync',

  SHEET_NAME: 'Inventario',
  PROTECT_OTHER_COLUMNS: true,
  SHOW_PROGRESS: true,
  MAX_RETRIES: 3,
  TIMEOUT_SECONDS: 30,
  CONFLICT_WARNING_THRESHOLD: 5,
  VALIDATE_ON_EDIT: true,
  COLOR_CODES: {
    SYNCED: '#d4edda',      // Verde - sincronizado
    MODIFIED: '#fff3cd',    // Amarillo - modificado
    ERROR: '#f8d7da',       // Rojo - error
    CONFLICT: '#ffeaa7'     // Naranja - conflicto
  }
};

const COLUMNS = {
  SKU: 1,
  NOMBRE: 2,
  STOCK: 3,
  STOCK_MINIMO: 4,
  PRECIO: 5,
  PRECIO_COMPRA: 6,
  MARCA: 7,
  EN_STOCK: 8,
  ULTIMA_ACTUALIZACION: 9,
  ID: 10,
  STATUS: 11
};

const SHEET_HEADERS = [
  'SKU', 'Nombre', 'Stock', 'Stock Mínimo', 'Precio',
  'Precio Compra', 'Marca', 'En Stock', 'Última Actualización', 'ID', 'Estado'
];

/**
 * Sistema Inteligente Evaluador de Entorno
 * Comprueba si debe usar API de Producción o API de Desarrollo (Túnel Local)
 */
let cachedApiUrl = null;
function getApiUrl() {
  if (cachedApiUrl) return cachedApiUrl;

  try {
    const response = UrlFetchApp.fetch(CONFIG.API_URL_PROD + '/ping', {
      muteHttpExceptions: true,
      timeout: 3000
    });
    if (response.getResponseCode() === 200) {
      cachedApiUrl = CONFIG.API_URL_PROD;
      return cachedApiUrl;
    }
  } catch (e) { }

  cachedApiUrl = CONFIG.API_URL_DEV;
  return cachedApiUrl;
}

// ==================== MENÚS ====================
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🔄 Sync E-commerce')
    .addItem('📥 Descargar productos del servidor', 'syncFromServer')
    .addItem('🔄 Forzar sincronización completa', 'fullSync')
    .addSeparator()
    .addItem('⚠️ Verificar conflictos', 'checkConflicts')
    .addItem('✅ Validar datos', 'validateData')
    .addSeparator()
    .addItem('📊 Ver estadísticas', 'showStats')
    .addItem('⚙️ Configuración', 'showConfig')
    .addSeparator()
    .addItem('📤 Exportar a CSV', 'exportToCSV')
    .addItem('🗑️ Limpiar hoja', 'clearSheet')
    .addToUi();

  createTrigger();
}

function onEdit(e) {
  if (!CONFIG.VALIDATE_ON_EDIT) return;
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;
  if (e.range.getRow() === 1) return;

  const col = e.range.getColumn();

  if (CONFIG.PROTECT_OTHER_COLUMNS && col !== COLUMNS.STOCK) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '⚠️ Solo puedes editar la columna Stock',
      'Columna protegida',
      3
    );
    e.range.clearContent();
    return;
  }

  if (col === COLUMNS.STOCK) {
    validateAndSyncStock(e.range);
  }
}

function createTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const hasOpenTrigger = triggers.some(t => t.getHandlerFunction() === 'syncOnOpen');

  if (!hasOpenTrigger) {
    ScriptApp.newTrigger('syncOnOpen')
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onOpen()
      .create();
  }
}

function syncOnOpen() {
  if (CONFIG.AUTO_SYNC_ON_OPEN !== false) {
    syncFromServer();
  }
}

// ==================== SINCRONIZACIÓN PRINCIPAL ====================
function syncFromServer() {
  const sheet = getOrCreateSheet();
  const startTime = Date.now();

  try {
    showProgress('Conectando al servidor...', 0);

    const response = fetchWithTimeout(getApiUrl() + '/export-products', {
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`Error del servidor: ${response.getResponseCode()}`);
    }

    const data = JSON.parse(response.getContentText());

    if (!data.success) {
      throw new Error(data.error || 'Error desconocido');
    }

    const products = data.data;
    const total = products.length;

    if (total === 0) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        '⚠️ No hay productos en el sistema',
        'Advertencia',
        5
      );
      return;
    }

    sheet.clear();
    sheet.appendRow(SHEET_HEADERS);

    const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e9ecef');

    showProgress(`Sincronizando ${total} productos...`, 20);

    let synced = 0;
    let errors = 0;

    products.forEach((product, index) => {
      const progress = 20 + Math.floor((index / total) * 60);
      showProgress(`Procesando ${index + 1}/${total}...`, progress);

      try {
        const row = [
          product.SKU || '',
          product.Nombre || '',
          product.Stock || 0,
          product.StockMinimo || 0,
          product.Precio || 0,
          product.PrecioCompra || 0,
          product.Marca || '',
          product.EnStock || 'No',
          product._lastUpdated || '',
          product._id || '',
          'Sincronizado'
        ];

        sheet.appendRow(row);

        const rowNum = index + 2;
        const statusRange = sheet.getRange(rowNum, COLUMNS.STATUS);
        statusRange.setBackground(CONFIG.COLOR_CODES.SYNCED);

        synced++;
      } catch (err) {
        errors++;
        console.error(`Error en producto ${index}:`, err);
      }
    });

    sheet.getRange(2, 1, synced, SHEET_HEADERS.length)
      .setHorizontalAlignment('left');

    sheet.setColumnWidths(1, SHEET_HEADERS.length, 150);
    sheet.autoResizeColumns(1, 5);

    protectColumns();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const message = `✅ Sincronizado: ${synced} productos\n⏱️ Tiempo: ${elapsed}s\n❌ Errores: ${errors}`;

    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Sincronización Completa', 10);
    console.log(message);

  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `❌ Error: ${error.message}`,
      'Error de Conexión',
      15
    );
    console.error('Error en sincronización:', error);
  } finally {
    hideProgress();
  }
}

function fullSync() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ Sincronización Completa',
    'Esto descargará todos los productos del servidor y sobrescribirá la hoja actual. ¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    syncFromServer();
  }
}

// ==================== EDICIÓN DE STOCK ====================
function validateAndSyncStock(range) {
  const row = range.getRow();
  const sheet = range.getSheet();
  const newValue = range.getValue();

  const skuRange = sheet.getRange(row, COLUMNS.SKU);
  const sku = skuRange.getValue();

  if (!sku) {
    showError(row, 'SKU no encontrado');
    return;
  }

  const stockValue = parseInt(newValue);
  if (isNaN(stockValue) || stockValue < 0) {
    showError(row, 'Stock debe ser ≥ 0');
    range.setValue('');
    return;
  }

  markAsModified(row);

  sendStockUpdateWithRetry(sku, stockValue, row);
}

function sendStockUpdateWithRetry(sku, stock, row, attempt = 1) {
  try {
    const payload = {
      sku: sku,
      stock: stock,
      editedBy: Session.getActiveUser().getEmail() || 'sheets-user'
    };

    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(getApiUrl() + '/sheet-update', options);
    const data = JSON.parse(response.getResponseCode());

    if (response.getResponseCode() === 200 && data.success) {
      const statusRange = SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName(CONFIG.SHEET_NAME)
        .getRange(row, COLUMNS.STATUS);

      statusRange.setValue('Actualizado');
      statusRange.setBackground(CONFIG.COLOR_CODES.SYNCED);

      SpreadsheetApp.getActiveSpreadsheet().toast(
        `✅ ${sku}: ${stock}`,
        'Stock Actualizado',
        3
      );

      if (data.warnings && data.warnings.length > 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `⚠️ ${data.warnings.join(', ')}`,
          'Advertencia',
          5
        );
      }
    } else {
      showError(row, data.error || 'Error desconocido');
      if (attempt < CONFIG.MAX_RETRIES) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          `🔄 Reintentando (${attempt}/${CONFIG.MAX_RETRIES})...`,
          'Error',
          3
        );
        setTimeout(() => sendStockUpdateWithRetry(sku, stock, row, attempt + 1), 1000);
      }
    }
  } catch (error) {
    showError(row, error.message);
    if (attempt < CONFIG.MAX_RETRIES) {
      setTimeout(() => sendStockUpdateWithRetry(sku, stock, row, attempt + 1), 1000);
    }
  }
}

function sendStockUpdate(sku, stock, editedBy) {
  try {
    const payload = {
      sku: sku,
      stock: stock,
      editedBy: editedBy || Session.getActiveUser().getEmail() || 'sheets-user'
    };

    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(getApiUrl() + '/sheet-update', options);
    const responseData = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200 && responseData.success) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Stock actualizado: ${sku} → ${stock}`,
        'Sincronizado',
        3
      );
      return { success: true, data: responseData };
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Error: ${responseData.error || 'Error desconocido'}`,
        'Error',
        5
      );
      return { success: false, error: responseData.error };
    }
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Error de conexión: ' + error.message,
      'Error',
      5
    );
    return { success: false, error: error.message };
  }
}

// ==================== VALIDACIÓN ====================
function validateData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No hay hoja de inventario', 'Error', 3);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const products = data.slice(1);

  const errors = [];
  const skuMap = new Map();

  products.forEach((row, index) => {
    const rowNum = index + 2;
    const sku = row[COLUMNS.SKU - 1];
    const stock = row[COLUMNS.STOCK - 1];
    const precio = row[COLUMNS.PRECIO - 1];
    const precioCompra = row[COLUMNS.PRECIO_COMPRA - 1];

    if (!sku || sku.toString().trim() === '') {
      errors.push({ row: rowNum, error: 'SKU vacío' });
      return;
    }

    const skuPattern = /^[A-Za-z0-9\-_]+$/;
    if (!skuPattern.test(sku)) {
      errors.push({ row: rowNum, error: 'SKU con caracteres inválidos' });
    }

    if (skuMap.has(sku)) {
      errors.push({ row: rowNum, error: `SKU duplicado (primera aparición: fila ${skuMap.get(sku)})` });
    }
    skuMap.set(sku, rowNum);

    if (stock !== '' && (isNaN(stock) || stock < 0)) {
      errors.push({ row: rowNum, error: 'Stock inválido o negativo' });
    }

    if (precio !== '' && (isNaN(precio) || precio < 0)) {
      errors.push({ row: rowNum, error: 'Precio inválido o negativo' });
    }

    if (precioCompra !== '' && (isNaN(precioCompra) || precioCompra < 0)) {
      errors.push({ row: rowNum, error: 'Precio de compra inválido o negativo' });
    }
  });

  const message = errors.length === 0
    ? '✅ Validación passed: Sin errores encontrados'
    : `⚠️ Se encontraron ${errors.length} errores`;

  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Validación', 5);

  if (errors.length > 0) {
    console.table(errors);
  }

  return errors;
}

// ==================== CONFLICTOS ====================
function checkConflicts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No hay hoja de inventario', 'Error', 3);
    return;
  }

  showProgress('Verificando conflictos...', 0);

  const data = sheet.getDataRange().getValues();
  const products = data.slice(1).map(row => ({
    sku: row[COLUMNS.SKU - 1],
    stock: row[COLUMNS.STOCK - 1]
  })).filter(p => p.sku);

  try {
    const response = fetchWithTimeout(getApiUrl() + '/check-conflicts', {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify({ products }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (!result.success) {
      throw new Error(result.error);
    }

    showProgress('Marcando conflictos...', 80);

    if (result.conflictList && result.conflictList.length > 0) {
      result.conflictList.forEach(conflict => {
        const row = products.findIndex(p => p.sku === conflict.sku) + 2;
        if (row > 1) {
          const statusRange = sheet.getRange(row, COLUMNS.STATUS);
          statusRange.setValue(`⚠️ Conflicto (BD: ${conflict.systemStock})`);
          statusRange.setBackground(
            conflict.severity === 'high'
              ? CONFIG.COLOR_CODES.ERROR
              : CONFIG.COLOR_CODES.CONFLICT
          );
        }
      });
    }

    const message = result.conflicts === 0
      ? '✅ No hay conflictos'
      : `⚠️ ${result.conflicts} conflictos encontrados`;

    SpreadsheetApp.getActiveSpreadsheet().toast(
      `${message}\nAlta: ${result.summary.high} | Media: ${result.summary.medium} | Baja: ${result.summary.low}`,
      'Conflictos',
      10
    );

  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Error: ${error.message}`, 'Error', 5);
  } finally {
    hideProgress();
  }
}

// ==================== ESTADÍSTICAS ====================
function showStats() {
  try {
    const response = UrlFetchApp.fetch(getApiUrl() + '/stats', {
      muteHttpExceptions: true
    });

    const data = JSON.parse(response.getContentText());

    if (!data.success) {
      throw new Error(data.error);
    }

    const s = data.stats;
    const message =
      `📊 ESTADÍSTICAS\n\n` +
      `📦 Productos: ${s.products.total}\n` +
      `  ✓ En Stock: ${s.products.inStock}\n` +
      `  ⚠️ Bajo Stock: ${s.products.lowStock}\n` +
      `  ❌ Agotados: ${s.products.outOfStock}\n\n` +
      `📈 Inventario:\n` +
      `  Total: ${s.inventory.totalStock} unidades\n` +
      `  Promedio: ${s.inventory.averageStock}/producto\n\n` +
      `🔄 Sincronizaciones hoy: ${s.sync.today}`;

    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Estadísticas', 15);

  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Error: ${error.message}`, 'Error', 5);
  }
}

function showConfig() {
  try {
    const response = UrlFetchApp.fetch(getApiUrl() + '/config', {
      muteHttpExceptions: true
    });

    const data = JSON.parse(response.getContentText());

    if (!data.success) {
      throw new Error(data.error);
    }

    const c = data.config;
    const message =
      `⚙️ CONFIGURACIÓN\n\n` +
      `Máx productos/sync: ${c.maxProductsPerSync}\n` +
      `SKU válido: ${c.skuPattern}\n` +
      `Columnas editables: ${c.editableColumns.join(', ')}\n` +
      `Auth requerido: ${c.requireAuth}`;

    SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Configuración', 10);

  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Error: ${error.message}`, 'Error', 5);
  }
}

// ==================== UTILIDADES ====================
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }

  return sheet;
}

function protectColumns() {
  if (!CONFIG.PROTECT_OTHER_COLUMNS) return;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;

  const protection = sheet.protect();
  protection.setWarningOnly(true);

  const unprotected = [COLUMNS.STOCK];
  protection.setUnprotectedRanges(unprotected.map(col =>
    sheet.getRange(2, col, sheet.getLastRow() - 1, 1)
  ));
}

function markAsModified(row) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const statusRange = sheet.getRange(row, COLUMNS.STATUS);
  statusRange.setValue('Modificado');
  statusRange.setBackground(CONFIG.COLOR_CODES.MODIFIED);
}

function showError(row, message) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const statusRange = sheet.getRange(row, COLUMNS.STATUS);
  statusRange.setValue(`❌ ${message}`);
  statusRange.setBackground(CONFIG.COLOR_CODES.ERROR);
}

function showProgress(message, percent) {
  if (!CONFIG.SHOW_PROGRESS) return;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (sheet) {
    sheet.getRange('A1').setValue(`${message} (${percent}%)`);
  }
}

function hideProgress() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (sheet && sheet.getRange('A1').getValue().toString().includes('%')) {
    sheet.getRange('A1').setValue('');
  }
}

function fetchWithTimeout(url, options, timeout = CONFIG.TIMEOUT_SECONDS * 1000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      return UrlFetchApp.fetch(url, options);
    } catch (e) {
      if (e.message.includes('Exception')) {
        Utilities.sleep(500);
        continue;
      }
      throw e;
    }
  }

  throw new Error('Timeout de conexión');
}

function exportToCSV() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No hay hoja de inventario', 'Error', 3);
    return;
  }

  const range = sheet.getDataRange();
  const values = range.getValues();

  const csvContent = values
    .map(row => row.map(cell => {
      if (cell === null || cell === undefined) return '';
      return typeof cell === 'string' && cell.includes(',')
        ? `"${cell.replace(/"/g, '""')}"`
        : String(cell);
    }).join(','))
    .join('\n');

  const blob = Utilities.newBlob(csvContent, 'text/csv', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
  const file = DriveApp.createFile(blob);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `📁 Archivo guardado en Drive:\n${file.getUrl()}`,
    'Exportado',
    10
  );
}

function clearSheet() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '🗑️ Limpiar Hoja',
    '¿Estás seguro de que quieres limpiar todos los datos? (Los encabezados se mantendrán)',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
    }
    SpreadsheetApp.getActiveSpreadsheet().toast('Hoja limpiada', 'Listo', 3);
  }
}
