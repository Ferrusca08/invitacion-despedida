/**
 * GOOGLE APPS SCRIPT - CONEXIÓN RSVP A GOOGLE SHEETS
 * 
 * Este script se ejecuta en el entorno de Google Apps Script asociado a tu hoja de cálculo.
 * Recibe las confirmaciones de asistencia (RSVP) desde la invitación web y las guarda automáticamente.
 * Si un invitado vuelve a enviar el formulario con el mismo ID, actualiza su registro en lugar de duplicarlo.
 * 
 * =========================================================================================
 * INSTRUCCIONES DE INSTALACIÓN:
 * 
 * 1. Crea una nueva Hoja de Cálculo en Google Sheets (https://sheets.google.com).
 * 2. En el menú superior, ve a: Extensiones -> Apps Script.
 * 3. Borra el código por defecto en el editor (normalmente "myFunction") y pega este archivo completo.
 * 4. Guarda el proyecto presionando el ícono de Guardar (o Ctrl+S / Cmd+S).
 * 5. Haz clic en el botón superior "Implementar" (Deploy) -> "Nueva implementación" (New deployment).
 * 6. En el engrane de tipo, selecciona "Aplicación web" (Web app).
 * 7. Configura los parámetros:
 *    - Descripción: "API RSVP Invitación Despedida"
 *    - Ejecutar como: "Tú" (ej. tu_correo@gmail.com)
 *    - Quién tiene acceso: "Cualquiera" (Anyone) -> IMPORTANTE para que la web pueda enviar datos sin iniciar sesión.
 * 8. Haz clic en "Implementar". Google te pedirá autorizar permisos para acceder a tus Hojas de Cálculo. Concédelos.
 * 9. Copia la "URL de la aplicación web" generada (debe terminar en "/exec").
 * 10. Pega esa URL en tu archivo "app.js", en la constante `GOOGLE_SHEET_SCRIPT_URL`.
 * =========================================================================================
 */

// Nombre de la hoja dentro del documento donde se guardarán las respuestas
const SHEET_NAME = "Respuestas RSVP";

function doPost(e) {
  try {
    // 1. Validar que el request contenga datos
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse("No se recibieron datos válidos.");
    }
    
    // 2. Parsear el JSON enviado
    const data = JSON.parse(e.postData.contents);
    const timestamp = data.timestamp || new Date().toISOString();
    const guestId = data.id || "GENERIC";
    const guestName = data.nombre || "Sin Nombre";
    const attendance = data.asistencia || "Sin Especificar";
    const confirmedPasses = parseInt(data.pasesConfirmados, 10) || 0;
    const companionsCount = parseInt(data.acompanantesCount, 10) || 0;
    const companionsNames = data.acompanantesNombres || "";
    const message = data.mensaje || "";
    
    // 3. Abrir la Hoja de Cálculo activa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Si la hoja no existe, la creamos y añadimos los encabezados
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = ["ID Invitado", "Nombre", "Asistencia", "Pases Confirmados", "Nº Acompañantes", "Nombres Acompañantes", "Mensaje", "Fecha Confirmación"];
      sheet.appendRow(headers);
      // Dar formato a los encabezados
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight("bold")
           .setBackground("#b87c67")
           .setFontColor("#ffffff")
           .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // Obtener todos los datos existentes para verificar si ya existe el ID
    const lastRow = sheet.getLastRow();
    let rowToUpdate = -1;
    
    if (lastRow > 1) {
      // Leer los IDs de la primera columna (columna A)
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === guestId) {
          // El ID ya existe en la fila (i + 2) debido al encabezado en fila 1 y el índice 0 del loop
          rowToUpdate = i + 2;
          break;
        }
      }
    }
    
    const rowValues = [guestId, guestName, attendance, confirmedPasses, companionsCount, companionsNames, message, timestamp];
    
    if (rowToUpdate !== -1) {
      // Actualizar registro existente
      sheet.getRange(rowToUpdate, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Insertar nuevo registro al final
      sheet.appendRow(rowValues);
    }
    
    // Retornar respuesta exitosa
    return successResponse("RSVP registrado con éxito.");
    
  } catch (err) {
    return errorResponse("Error en el servidor: " + err.toString());
  }
}

// Permitir solicitudes preflight OPTIONS (CORS)
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Auxiliar para respuesta exitosa
function successResponse(message) {
  const output = JSON.stringify({ status: "success", message: message });
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Auxiliar para respuesta de error
function errorResponse(message) {
  const output = JSON.stringify({ status: "error", message: message });
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}
