function doGet(req) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('db');
  var values = sheet.getDataRange().getValues();

  var output = [];

  // Skip the header row
  for (var i = 1; i < values.length; i++) {
    // Optional: skip empty rows
    if (!values[i][0]) continue;

    var row = {};
    row['Company'] = values[i][0];
    row['Model'] = values[i][1];
    row['imagelink'] = values[i][2];
    row['Original'] = values[i][3];
    row['Offer'] = values[i][4];
    row['Price'] = values[i][5];
    row['Stock'] = values[i][6];


    output.push(row);
  }

  return ContentService.createTextOutput(JSON.stringify({ data: output }))
                       .setMimeType(ContentService.MimeType.JSON);
}
