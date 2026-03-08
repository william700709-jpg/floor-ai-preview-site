const SHEET_NAME = 'Leads';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = getLeadSheet_();

    const row = [
      payload.reference || '',
      payload.createdAt || new Date().toISOString(),
      payload.source || '',
      payload.name || '',
      payload.phone || '',
      payload.lineId || '',
      payload.requestType || '',
      payload.sizeInfo || '',
      payload.message || ''
    ];

    sheet.appendRow(row);

    return jsonOutput_({
      ok: true,
      message: 'stored'
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: String(error)
    });
  }
}

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'reference',
      'createdAt',
      'source',
      'name',
      'phone',
      'lineId',
      'requestType',
      'sizeInfo',
      'message'
    ]);
  }

  return sheet;
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
