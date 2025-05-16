/**
 * TDM Data Collection - Google Apps Script
 * 
 * This script serves as a backend for the TDM Data Collection web application.
 * It handles saving and retrieving data from a Google Sheet.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Replace the default code with this script
 * 4. Save and deploy as a web app
 * 5. Copy the web app URL to your frontend application
 */

// Sheet name to store data
const SHEET_NAME = 'Data';

/**
 * Handles GET and POST requests from the web app
 */
function doPost(e) {
  try {
    // Add CORS headers for cross-origin support
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Parse incoming data
    const payload = e.parameter.payload;
    if (!payload) {
      return outputJSON({ success: false, error: 'No payload found' });
    }
    
    // Parse the payload JSON
    const data = JSON.parse(payload);
    if (!data.userId) {
      return outputJSON({ success: false, error: 'Missing userId' });
    }
    
    // Save data to sheet
    const result = saveDataToSheet(data);
    return outputJSON({ success: true, result });
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return outputJSON({ 
      success: false, 
      error: error.toString() 
    });
  }
}

/**
 * Handles GET requests to retrieve data
 */
function doGet(e) {
  try {
    // Handle JSONP callback if provided
    const callback = e.parameter.callback;
    
    // Check if userId is provided
    const userId = e.parameter.userId;
    if (!userId) {
      const response = { success: false, error: 'Missing userId parameter' };
      return outputJSON(response, callback);
    }
    
    // Get data for the userId
    const userData = getUserData(userId);
    const response = {
      success: true,
      data: userData
    };
    
    return outputJSON(response, callback);
    
  } catch (error) {
    console.error('Error in doGet:', error);
    const response = { 
      success: false, 
      error: error.toString() 
    };
    return outputJSON(response, callback);
  }
}

/**
 * Handles preflight OPTIONS requests to allow CORS
 */
function doOptions(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Set CORS headers
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  output.setHeader('Access-Control-Max-Age', '86400');
  
  return output;
}

/**
 * Saves data to the spreadsheet
 */
function saveDataToSheet(data) {
  // Get or create the data sheet
  const sheet = getOrCreateDataSheet();
  
  // Get headers (or create if sheet is new)
  const headers = getOrCreateHeaders(sheet, data);
  
  // Prepare row data based on headers
  const rowData = headers.map(header => {
    if (header === 'timestamp' && !data.timestamp) {
      return new Date().toISOString();
    }
    return data[header] !== undefined ? data[header] : '';
  });
  
  // Add the row to the sheet
  sheet.appendRow(rowData);
  
  return {
    message: 'Data saved successfully',
    rowCount: sheet.getLastRow()
  };
}

/**
 * Gets the most recent data for a specific user
 */
function getUserData(userId) {
  const sheet = getOrCreateDataSheet();
  
  // Get all data
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return null; // No data or only headers
  }
  
  // Get header row
  const headers = data[0];
  const userIdIndex = headers.indexOf('userId');
  
  // If userId column doesn't exist
  if (userIdIndex === -1) {
    return null;
  }
  
  // Find rows matching the userId, starting from the bottom (most recent)
  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    if (row[userIdIndex] === userId) {
      // Create an object with all columns
      const userData = {};
      for (let j = 0; j < headers.length; j++) {
        userData[headers[j]] = row[j];
      }
      return userData;
    }
  }
  
  return null; // No data found for this userId
}

/**
 * Gets or creates the data sheet
 */
function getOrCreateDataSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  return sheet;
}

/**
 * Gets existing headers or creates them if needed
 */
function getOrCreateHeaders(sheet, data) {
  // Check if headers already exist
  const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // If we have headers, return them
  if (firstRow.length > 0 && firstRow[0] !== '') {
    return firstRow;
  }
  
  // Otherwise, create headers based on the data
  const headers = Object.keys(data);
  
  // Ensure userId and timestamp are first
  const orderedHeaders = ['userId', 'timestamp'];
  headers.forEach(header => {
    if (!orderedHeaders.includes(header)) {
      orderedHeaders.push(header);
    }
  });
  
  // Set the headers in the sheet
  sheet.getRange(1, 1, 1, orderedHeaders.length).setValues([orderedHeaders]);
  
  return orderedHeaders;
}

/**
 * Outputs JSON response with optional JSONP callback
 */
function outputJSON(data, callback) {
  const output = ContentService.createTextOutput();
  
  // Set CORS headers
  output.setHeader('Access-Control-Allow-Origin', '*');
  
  if (callback) {
    // JSONP response
    output.setContent(callback + '(' + JSON.stringify(data) + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Regular JSON response
    output.setContent(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
  }
  
  return output;
}