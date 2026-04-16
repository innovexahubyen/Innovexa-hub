/**
 * ═══════════════════════════════════════════════════════════
 *  INNOVEXA HUB — Google Apps Script (Backend)
 * ═══════════════════════════════════════════════════════════
 *
 *  HOW TO SET THIS UP:
 *
 *  1. Go to https://sheets.google.com → Create a new spreadsheet
 *  2. Name it "Innovexa Hub - Registrations"
 *  3. In Row 1, add these column headers:
 *     A1: Timestamp
 *     B1: Full Name
 *     C1: Email
 *     D1: Phone
 *     E1: Year
 *     F1: GitHub
 *     G1: LinkedIn
 *     H1: Interests
 *     I1: UTR / Transaction ID
 *     J1: Amount
 *     K1: Status
 *
 *  4. Go to Extensions → Apps Script
 *  5. Delete everything in Code.gs and paste THIS entire file
 *  6. Click Deploy → New Deployment
 *  7. Select Type: "Web app"
 *  8. Set "Execute as": Me
 *  9. Set "Who has access": Anyone
 * 10. Click Deploy → Copy the Web App URL
 * 11. Paste that URL into your index.html where it says
 *     GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
 *
 * ═══════════════════════════════════════════════════════════
 */

// ─── Configuration ──────────────────────────────────────────
// The script auto-detects the active spreadsheet.
// If you want to target a specific sheet tab, change the name below.
const SHEET_NAME = 'Sheet1';

/**
 * Handles POST requests from the registration form.
 * Receives JSON data and appends it as a new row in the spreadsheet.
 */
function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // Get the spreadsheet and target sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createResponse(false, 'Sheet not found: ' + SHEET_NAME);
    }

    // Check for duplicate UTR
    const utrColumn = sheet.getRange('I:I').getValues();
    for (let i = 0; i < utrColumn.length; i++) {
      if (utrColumn[i][0] === data.utr) {
        return createResponse(false, 'Duplicate UTR detected: ' + data.utr);
      }
    }

    // Append new row with registration data
    sheet.appendRow([
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), // Timestamp
      data.fullName   || '',    // Full Name
      data.email      || '',    // Email
      data.phone      || '',    // Phone
      data.year       || '',    // Year of Study
      data.githubUrl  || '',    // GitHub URL
      data.linkedinUrl|| '',    // LinkedIn URL
      data.interests  || '',    // Tech Interests
      data.utr        || '',    // UTR / Transaction ID
      '₹' + (data.amount || '1'), // Amount
      'Pending'                 // Status (admin updates this manually)
    ]);

    // Return success response
    return createResponse(true, 'Registration saved successfully');

  } catch (error) {
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Handles GET requests (for testing the endpoint).
 */
function doGet(e) {
  return createResponse(true, 'Innovexa Hub Registration API is running.');
}

/**
 * Creates a JSON response with CORS headers.
 */
function createResponse(success, message) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ success: success, message: message })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
