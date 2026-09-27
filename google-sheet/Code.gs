/**
 * A Squared Services: website form receiver.
 *
 * Every request sent from the website is added as a row in this Google
 * Sheet (one tab per form: Fall, Winter, Spring & Summer, Season Pass),
 * and an email notification goes out. Setup steps: google-sheet/SETUP.md
 */

// Who gets an email for each new request is set in the sheet's "Settings"
// tab, cell B1: one or more email addresses, separated by commas. Changes
// there work right away, with no need to publish a new version. If it's
// empty, emails go to the Google account that owns this script, which
// needs a Gmail address (see SETUP.md).

// To test the setup, click "Run" with testSetup picked in the menu at the
// top. It adds a row to a "Test" tab, makes the "Settings" tab if it's
// missing, and emails everyone listed there, without the website.
function testSetup() {
  settingsSheet_();
  const data = {
    Name: "Test Person",
    Phone: "617-555-0123",
    Address: "1 Lilac Court",
    Comments: "This is a test from testSetup. You can delete the Test tab.",
  };
  const fields = Object.keys(data);
  saveRow_("Test", fields, data);
  const sentTo = notify_("Test", fields, data);
  console.log("It worked! Check the new Test tab in the sheet. Test email sent to: " + sentTo.join(", "));
}

// Runs when the website sends a form. (Clicking "Run" on this in the editor
// won't work, because there's no form data. Use testSetup instead.)
function doPost(e) {
  if (!e || !e.parameter) {
    throw new Error("doPost only runs when the website sends a form. To test, pick testSetup in the menu at the top and click Run.");
  }
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
  const sheet = findSheet_(formName);

  // The first row holds the column names. New fields get new columns.
  // Columns you add yourself (like "Paid?") are left blank for new rows.
  const headers = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    : [];
  ["Received"].concat(fields).forEach((field) => {
    if (!headers.includes(field)) headers.push(field);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);

  sheet.appendRow(headers.map((header) => (header === "Received" ? new Date() : asText_(data[header]))));
}

// Finds the tab for a form, even if its name is capitalized or punctuated
// differently ("spring/summer" matches "Spring & Summer"). Makes it if needed.
function findSheet_(formName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const simplify = (name) => String(name).toLowerCase().replace(/\band\b|[^a-z0-9]/g, "");
  const match = spreadsheet.getSheets().find((sheet) => simplify(sheet.getName()) === simplify(formName));
  return match || spreadsheet.insertSheet(formName);
}

// The "Settings" tab, made (and filled in with your email) if it's missing.
function settingsSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName("Settings");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Settings");
    sheet.getRange("A1:B1").setValues([["Send request emails to:", Session.getEffectiveUser().getEmail()]]);
    sheet.getRange("A2").setValue("Separate addresses with commas. Changes work right away.");
    sheet.getRange("A1").setFontWeight("bold");
    sheet.setColumnWidth(1, 220);
    sheet.setColumnWidth(2, 380);
  }
  return sheet;
}

// The addresses in Settings!B1, or the script owner's if there are none.
function recipients_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  const list = sheet ? String(sheet.getRange("B1").getValue()) : "";
  const addresses = list.split(/[,;\s]+/).filter((address) => address.includes("@"));
  return addresses.length ? addresses : [Session.getEffectiveUser().getEmail()];
}

// Emails each person separately, so one mistyped address doesn't stop the
// others. Returns the addresses that were sent to.
function notify_(formName, fields, data) {
  const sentTo = [];
  recipients_().forEach((to) => {
    const message = {
      to: to,
      subject: "New " + formName + " request from " + (data.Name || "the website"),
      body:
        fields.map((field) => field + ": " + (data[field] || "-")).join("\n") +
        "\n\nAll requests: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    };
    // Hitting "Reply" on the notification emails the customer.
    if (data.Email) message.replyTo = data.Email;
    try {
      MailApp.sendEmail(message);
      sentTo.push(to);
    } catch (err) {
      console.error("Couldn't email " + to + ": " + err);
    }
  });
  return sentTo;
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
