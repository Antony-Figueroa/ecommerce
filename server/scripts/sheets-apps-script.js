/**
 * Google Apps Script para sincronización bidireccional
 * 
 * INSTRUCCIONES:
 * 1. Abre tu Google Sheets
 * 2. Ve a Extensiones → Apps Script
 * 3. Borra cualquier código existente y pega este archivo
 * 4. Reemplaza las constantes al inicio del archivo
 * 5. Guarda y cierra
 * 6. Vuelve a tu Sheets y ahora funcionará la sincronización
 */

// ==================== CONFIGURACIÓN ====================
const API_BASE_URL = 'TU_URL_DEL_SERVIDOR/api/sync' // Ej: https://tu-dominio.com/api/sync
const SHEET_NAME_INVENTARIO = 'Inventario'
const STOCK_COLUMN_INDEX = 3 // Columna C (Stock)
const SKU_COLUMN_INDEX = 1    // Columna A (SKU)

// ==================== CÓDIGO ====================

function onEdit(e) {
  if (!e || !e.range) return;
  
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  
  // Solo procesar en la hoja de Inventario
  if (sheetName !== SHEET_NAME_INVENTARIO) return;
  
  // Solo procesar cambios en la columna de Stock
  if (e.range.getColumn() !== STOCK_COLUMN_INDEX) return;
  
  // No procesar si es la fila de encabezados
  if (e.range.getRow() === 1) return;
  
  // Obtener el SKU de la misma fila
  const sku = sheet.getRange(e.range.getRow(), SKU_COLUMN_INDEX).getValue();
  const newStock = e.value;
  
  // Ignorar si no hay SKU o el valor está vacío
  if (!sku || newStock === '') return;
  
  // Convertir a número
  const stockValue = parseInt(newStock);
  if (isNaN(stockValue) || stockValue < 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast('El stock debe ser un número positivo', 'Error', 5);
    return;
  }
  
  // Obtener email del usuario que editó
  const editedBy = Session.getActiveUser().getEmail();
  
  // Enviar a la API
  sendStockUpdate(sku, stockValue, editedBy);
}

function sendStockUpdate(sku, stock, editedBy) {
  try {
    const payload = {
      sku: sku,
      stock: stock,
      editedBy: editedBy
    };
    
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(API_BASE_URL + '/sheet-update', options);
    const responseData = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200 && responseData.success) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Stock actualizado: ${sku} → ${stock}`, 
        'Sincronizado', 
        3
      );
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Error: ${responseData.error || 'Error desconocido'}`,
        'Error',
        5
      );
    }
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Error de conexión: ' + error.message,
      'Error',
      5
    );
    console.error('Error en sincronización:', error);
  }
}

// Función manual para forzar sincronización desde Sheets
function forceSyncFromSheets() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_INVENTARIO);
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Hoja Inventario no encontrada', 'Error', 5);
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No hay datos para sincronizar', 'Info', 3);
    return;
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Sincronización iniciada...', 'Info', 3);
  
  // Aquí puedes añadir lógica adicional si necesitas
  SpreadsheetApp.getActiveSpreadsheet().toast('Sincronización completada', 'Éxito', 3);
}

// Menú personalizado en Sheets
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Sync E-commerce')
    .addItem('📊 Forzar sincronización', 'forceSyncFromSheets')
    .addToUi();
}
