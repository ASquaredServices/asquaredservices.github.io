/**
 * A Squared Services: website form receiver.
 *
 * Every request sent from the website is added as a row in this Google
 * Sheet (one tab per form: Fall, Winter, Spring & Summer, Season Pass),
 * and an email notification goes out. Setup steps: google-sheet/SETUP.md
 */

// Who gets an email for each new request. Leave "" to use the Google
// account that owns this script. Separate several addresses with commas.
const NOTIFY_EMAIL = "";

function doPost(e) {
  const data = e.parameter;

  // Bots fill in the hidden "website" field; people never see it.
  if (data.website) return reply_({ result: "success" });

  const formName = String(data.form || "Requests").slice(0, 40);
  const fields = Object.keys(data).filter((key) => key !== "form" && key !== "website");

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    saveRow_(formName, fields, data);
  } catch (err) {
    return reply_({ result: "error", error: String(err) });
  } finally {
    lock.releaseLock();
  }

  // The request is saved even if the email can't be sent.
  try {
    notify_(formName, fields, data);
  } catch (err) {
    console.error(err);
  }
  return reply_({ result: "success" });
}

// Opening the web app link in a browser shows this message, which is an
// easy way to check that the deployment worked.
function doGet() {
  return ContentService.createTextOutput("The A Squared Services form receiver is running.");
}

function saveRow_(formName, fields, data) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(formName) || spreadsheet.insertSheet(formName);

  // The first row holds the column names. New fields get new columns.
  const headers = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    : ["Received"];
  fields.forEach((field) => {
    if (!headers.includes(field)) headers.push(field);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);

  sheet.appendRow(headers.map((header) => (header === "Received" ? new Date() : asText_(data[header]))));
}

function notify_(formName, fields, data) {
  const message = {
    to: NOTIFY_EMAIL || Session.getEffectiveUser().getEmail(),
    subject: "New " + formName + " request from " + (data.Name || "the website"),
    body:
      fields.map((field) => field + ": " + (data[field] || "-")).join("\n") +
      "\n\nAll requests: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  };
  // Hitting "Reply" on the notification emails the customer.
  if (data.Email) message.replyTo = data.Email;
  MailApp.sendEmail(message);
}

// Keeps values as plain text, so a phone number like "+1 617..." isn't
// turned into a number and nothing starting with "=" becomes a formula.
function asText_(value) {
  const text = value == null ? "" : String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function reply_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}
