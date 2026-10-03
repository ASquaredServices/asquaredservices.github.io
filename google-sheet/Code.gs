/**
 * A Squared Services: website form receiver.
 *
 * Every request sent from the website is added as a row in this Google
 * Sheet (one tab per form: Fall, Winter, Spring & Summer, Season Pass).
 * Then the customer gets a confirmation email with a copy of their
 * request, and we get a notification. Setup steps: google-sheet/SETUP.md
 */

// About the business, for the emails to customers.
const BUSINESS = {
  name: "A² Services",
  signOff: "Adrian & Adrian",
  replyTo: "adriandthaler@icloud.com", // where customers' replies go
  phone: "617-682-6164",
  website: "https://asquaredservices.github.io",
};

// Who gets an email for each new request is set in the sheet's "Settings"
// tab, cell B1: one or more email addresses, separated by commas. Changes
// there work right away, with no need to publish a new version. If it's
// empty, emails go to the Google account that owns this script, which
// needs a Gmail address (see SETUP.md).

// To test the setup, click "Run" with testSetup picked in the menu at the
// top. It adds a row to a "Test" tab, makes the "Settings" tab if it's
// missing, emails everyone listed there, and sends you a copy of the
// customer confirmation email so you can see what customers get.
function testSetup() {
  settingsSheet_();
  const owner = Session.getEffectiveUser().getEmail();
  const data = {
    Name: "Test Person",
    Phone: "617-555-0123",
    Email: owner,
    Address: "1 Lilac Court",
    Date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    Bags: "3",
    Payment: "Cash",
    Comments: "This is a test from testSetup. You can delete the Test tab.",
    Estimate: "$15",
    "Estimate details": "3 bags × $5: $15",
  };
  const fields = Object.keys(data);
  saveRow_("Test", fields, data);
  const confirmed = confirm_("Test", fields, data);
  const sentTo = notify_("Test", fields, data, confirmed);
  console.log("It worked! Check the new Test tab in the sheet.");
  console.log("Request email sent to: " + sentTo.join(", "));
  console.log("Customer confirmation example sent to: " + (confirmed ? owner : "(not sent)"));
}

// Run this once to add money tracking: a "Jobs" tab where you write down
// each finished job and what it paid, and a "Finances" tab that works out
// totals, averages, your goal progress, and charts from it. (Pick
// setupFinances in the menu at the top and click Run.) It never touches
// your request tabs, and running it again won't erase anything.
function setupFinances() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  jobsSheet_(spreadsheet);
  if (spreadsheet.getSheetByName("Finances")) {
    console.log("There's already a Finances tab. To rebuild it, delete that tab and run setupFinances again (the Jobs tab is kept).");
    return;
  }
  const fin = spreadsheet.insertSheet("Finances", 0);
  const money = "$#,##0.00";
  const purple = "#7950f2";

  fin.getRange("A1").setValue("A² Finances").setFontSize(18).setFontWeight("bold");
  fin.getRange("A2").setValue("Add each finished job to the Jobs tab. Everything here updates on its own.").setFontColor("#586174");

  // Summary
  fin.getRange("A4:A9").setValues([["Our goal"], ["Total earned"], ["Progress"], ["Still to go"], ["Jobs done"], ["Average job"]])
    .setFontWeight("bold").setBackground("#f3f0ff");
  fin.getRange("B4").setValue(500).setBackground("#fff3bf").setNumberFormat(money);
  fin.getRange("C4").setValue("← type your goal here").setFontColor("#586174");
  fin.getRange("B5").setFormula("=SUM(Jobs!D2:D)").setNumberFormat(money);
  fin.getRange("B6").setFormula("=IFERROR(B5/B4, 0)").setNumberFormat("0%");
  fin.getRange("C6:E6").merge().setFormula('=SPARKLINE(MIN(B5, MAX(B4, 1)), {"charttype","bar"; "max",MAX(B4, 1); "color1","' + purple + '"})');
  fin.getRange("B7").setFormula("=MAX(0, B4 - B5)").setNumberFormat(money);
  fin.getRange("B8").setFormula("=COUNT(Jobs!D2:D)");
  fin.getRange("B9").setFormula("=IFERROR(AVERAGE(Jobs!D2:D), 0)").setNumberFormat(money);
  fin.getRange("B4:B9").setFontSize(12).setFontWeight("bold");

  // Earned by service
  fin.getRange("A11").setValue("Earned by service").setFontWeight("bold").setFontSize(12);
  fin.getRange("A12:C12").setValues([["Service", "Earned", "Jobs"]]).setFontWeight("bold").setBackground("#f3f0ff");
  fin.getRange("A13").setFormula(
    '=IFERROR(QUERY(Jobs!C2:D, "select C, sum(D), count(D) where C is not null and D is not null group by C label C \'\', sum(D) \'\', count(D) \'\'", 0), "No jobs yet")');
  fin.getRange("B13:B20").setNumberFormat(money);

  // Chart data, worked out automatically (the charts below use these columns)
  fin.getRange("H1").setValue("Chart data (filled in automatically)").setFontColor("#586174");
  fin.getRange("H3:J3").setValues([["Date", "Earned", "Running total"]]).setFontWeight("bold");
  fin.getRange("H4").setFormula('=IFERROR(SORT(FILTER({Jobs!A2:A, Jobs!D2:D}, Jobs!A2:A <> "", Jobs!D2:D <> ""), 1, TRUE), "")');
  fin.getRange("J4").setFormula('=ARRAYFORMULA(IF(I4:I = "", , SUMIF(ROW(I4:I), "<=" & ROW(I4:I), I4:I)))');
  fin.getRange("H4:H").setNumberFormat("mmm d, yyyy");
  fin.getRange("I4:J").setNumberFormat(money);
  fin.getRange("L3:M3").setValues([["Month", "Earned"]]).setFontWeight("bold");
  fin.getRange("L4").setFormula(
    '=IFERROR(QUERY({ARRAYFORMULA(IF(Jobs!A2:A = "", , EOMONTH(Jobs!A2:A, -1) + 1)), Jobs!D2:D}, "select Col1, sum(Col2) where Col1 is not null and Col2 is not null group by Col1 order by Col1 label Col1 \'\', sum(Col2) \'\'", 0), "")');
  fin.getRange("L4:L").setNumberFormat("mmm yyyy");
  fin.getRange("M4:M").setNumberFormat(money);

  fin.setColumnWidth(1, 160);
  fin.setColumnWidth(2, 120);
  fin.setColumnWidth(3, 120);
  fin.setColumnWidths(8, 6, 110);

  // Charts. If one can't be made, the rest of the tab still works.
  try {
    fin.insertChart(fin.newChart()
      .setChartType(Charts.ChartType.LINE)
      .addRange(fin.getRange("H3:H500"))
      .addRange(fin.getRange("J3:J500"))
      .setNumHeaders(1)
      .setPosition(22, 1, 0, 0)
      .setOption("title", "Money earned over time")
      .setOption("legend", { position: "none" })
      .setOption("colors", [purple])
      .setOption("width", 560)
      .setOption("height", 300)
      .build());
    fin.insertChart(fin.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(fin.getRange("L3:M120"))
      .setNumHeaders(1)
      .setPosition(38, 1, 0, 0)
      .setOption("title", "Earned each month")
      .setOption("legend", { position: "none" })
      .setOption("colors", [purple])
      .setOption("width", 560)
      .setOption("height", 300)
      .build());
  } catch (err) {
    console.error("Couldn't make the charts: " + err);
  }
  spreadsheet.setActiveSheet(fin);
  console.log("Done! Check the new Finances and Jobs tabs. Type your goal in Finances, cell B4.");
}

// The "Jobs" tab: one row per finished job. Made if it's missing; an
// existing Jobs tab (and everything in it) is left alone.
function jobsSheet_(spreadsheet) {
  let jobs = spreadsheet.getSheetByName("Jobs");
  if (jobs) return jobs;
  jobs = spreadsheet.insertSheet("Jobs", 0);
  jobs.getRange("A1:F1").setValues([["Date", "Customer", "Service", "Amount paid", "Payment", "Notes"]])
    .setFontWeight("bold").setBackground("#f3f0ff");
  jobs.setFrozenRows(1);
  jobs.getRange("A2:A").setNumberFormat("mmm d, yyyy")
    .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
  jobs.getRange("C2:C").setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(["Fall", "Winter", "Spring & Summer", "Season Pass", "Other"], true).build());
  jobs.getRange("D2:D").setNumberFormat("$#,##0.00")
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());
  jobs.getRange("E2:E").setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(["Cash", "Venmo", "Other"], true).build());
  jobs.setColumnWidth(1, 120);
  jobs.setColumnWidth(2, 180);
  jobs.setColumnWidth(3, 140);
  jobs.setColumnWidth(4, 110);
  jobs.setColumnWidth(5, 100);
  jobs.setColumnWidth(6, 300);
  return jobs;
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

  // The request is saved even if the emails can't be sent.
  let confirmed = false;
  try {
    confirmed = confirm_(formName, fields, data);
  } catch (err) {
    console.error(err);
  }
  try {
    notify_(formName, fields, data, confirmed);
  } catch (err) {
    console.error(err);
  }
  // "confirmed" tells the website whether the customer was emailed a copy.
  return reply_({ result: "success", confirmed: confirmed });
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

// ------------------------------------------------------------- Emails

// What each form is for, in words customers understand.
const SERVICES = {
  "Fall": "fall leaf removal",
  "Winter": "snow shoveling",
  "Spring & Summer": "gardening help",
  "Season Pass": "the Winter Season Pass",
  "Test": "a test request",
};

// What happens next, told to the customer.
const NEXT_STEPS = {
  "Fall": "We'll email you soon to confirm the day and the price.",
  "Winter": "We'll email you soon to confirm the day and the price.",
  "Spring & Summer": "We'll look at what you need and email you a quote soon.",
  "Season Pass": "We'll email you soon to confirm your pass and how to pay.",
};

// Friendlier names for the form's fields.
const LABELS = {
  Date: "Date of service",
  Bags: "Leaf bags",
  Snowfall: "Expected snowfall",
  Driveway: "Parking spaces",
  Cars: "Clear snow off cars",
  Request: "What you need",
  "Other payment": "Payment method",
};

// The customer's copy of their request. Returns true if it was sent.
function confirm_(formName, fields, data) {
  const email = String(data.Email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !confirmationAllowed_(email)) return false;

  const firstName = String(data.Name || "").trim().split(/\s+/)[0];
  const service = SERVICES[formName] || "your request";
  const estimate = estimateRows_(data);
  const letter = {
    heading: "Thanks" + (firstName ? ", " + firstName : "") + "!",
    intro: [
      "We got your request for " + service + ". Here's a copy for your records.",
      NEXT_STEPS[formName] || "We'll email you soon.",
    ],
    sections: [{ title: "Your request", rows: detailRows_(fields, data) }],
    outro: [
      "Something wrong, or have a question? Just reply to this email, or call or text us at " + BUSINESS.phone + ".",
      "Thanks for choosing " + BUSINESS.name + "!",
      "— " + BUSINESS.signOff,
    ],
  };
  if (estimate.rows.length) {
    letter.sections.push({ title: "Your estimate", rows: estimate.rows, total: estimate.total });
    letter.intro.push("Prices on the website are estimates, so we'll confirm the final price with you.");
  }
  MailApp.sendEmail({
    to: email,
    name: BUSINESS.name,
    replyTo: BUSINESS.replyTo,
    subject: "We got your request! (" + BUSINESS.name + ")",
    body: emailText_(letter),
    htmlBody: emailHtml_(letter),
  });
  return true;
}

// Our notification. Emails each person in Settings!B1 separately, so one
// mistyped address doesn't stop the others. Returns who it was sent to.
function notify_(formName, fields, data, confirmed) {
  const name = String(data.Name || "Someone").trim();
  const estimate = estimateRows_(data);
  const letter = {
    heading: "New " + formName + " request from " + name,
    intro: [
      confirmed
        ? "We emailed " + name + " a copy of their request. Hit Reply to email them directly."
        : "No confirmation email went to the customer (no valid email, or they sent several requests in an hour).",
    ],
    sections: [
      { title: "Customer", rows: [["Name", name], ["Email", data.Email], ["Phone", data.Phone], ["Address", data.Address]].filter((row) => row[1]) },
      { title: "Request", rows: detailRows_(fields, data).filter((row) => row[0] !== "Address") },
    ],
    outro: ["All requests: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()],
  };
  if (estimate.rows.length) letter.sections.push({ title: "Estimate", rows: estimate.rows, total: estimate.total });

  const when = data.Date ? " for " + prettyDate_(data.Date, "EEE MMM d") : "";
  const sentTo = [];
  recipients_().forEach((to) => {
    const message = {
      to: to,
      name: BUSINESS.name + " website",
      subject: "New " + formName + " request: " + name + when,
      body: emailText_(letter),
      htmlBody: emailHtml_(letter),
    };
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

// The job details, with friendly labels, skipping the contact and estimate
// fields (they have their own sections) and anything blank or "None".
function detailRows_(fields, data) {
  const skip = ["Name", "Email", "Phone", "Estimate", "Estimate details"];
  const show = (field) => {
    const value = String(data[field] || "").trim();
    if (field === "Date") return prettyDate_(value);
    if (field === "Sidewalk" && value === "Sidewalk") return "Yes";
    return value;
  };
  return fields
    .filter((field) => !skip.includes(field) && show(field) && show(field) !== "None")
    .map((field) => [LABELS[field] || field, show(field)]);
}

// "Driveway (1 space): $20; Snowfall 4–8 in (+50%): $10" becomes rows.
function estimateRows_(data) {
  const total = String(data.Estimate || "");
  if (!total.startsWith("$")) return { rows: [], total: "" };
  const rows = String(data["Estimate details"] || "")
    .split("; ")
    .filter(Boolean)
    .map((line) => {
      const cut = line.lastIndexOf(": ");
      return cut > 0 ? [line.slice(0, cut), line.slice(cut + 2)] : [line, ""];
    });
  return { rows: rows, total: total };
}

// "2026-10-05" becomes "Monday, October 5, 2026".
function prettyDate_(value, pattern) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return String(value);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Utilities.formatDate(date, Session.getScriptTimeZone(), pattern || "EEEE, MMMM d, yyyy");
}

// At most 3 confirmation emails per address per hour, so nobody can use
// the form to flood someone's inbox.
function confirmationAllowed_(email) {
  const cache = CacheService.getScriptCache();
  const key = "confirm:" + email.toLowerCase().slice(0, 200);
  const count = Number(cache.get(key) || 0);
  if (count >= 3) return false;
  cache.put(key, String(count + 1), 3600);
  return true;
}

function emailText_(letter) {
  const lines = [letter.heading, ""].concat(letter.intro, [""]);
  letter.sections.forEach((section) => {
    lines.push(section.title.toUpperCase());
    section.rows.forEach((row) => lines.push(row[0] + ": " + row[1]));
    if (section.total) lines.push("Total: " + section.total);
    lines.push("");
  });
  return lines.concat(letter.outro, ["", BUSINESS.website]).join("\n");
}

function emailHtml_(letter) {
  const p = (text) => '<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#172033">' + esc_(text) + "</p>";
  const row = (label, value, bold) =>
    '<tr><td style="padding:7px 16px 7px 0;border-top:1px solid #e2e6ee;color:#586174;vertical-align:top;white-space:nowrap">' + esc_(label) +
    '</td><td style="padding:7px 0;border-top:1px solid #e2e6ee;color:#172033;vertical-align:top;font-weight:' + (bold ? "800" : "600") + '">' + esc_(value) + "</td></tr>";
  const sections = letter.sections.map((section) =>
    '<h2 style="margin:22px 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#1d3fae">' + esc_(section.title) + "</h2>" +
    '<table style="width:100%;border-collapse:collapse;font-size:15px">' +
    section.rows.map((r) => row(r[0], r[1])).join("") +
    (section.total ? row("Total", section.total, true) : "") +
    "</table>").join("");
  return '<div style="background:#f4f6fb;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e6ee;border-radius:14px;overflow:hidden">' +
    '<div style="background:#16296e;color:#ffffff;padding:16px 24px;font-size:20px;font-weight:800">' + esc_(BUSINESS.name) + "</div>" +
    '<div style="padding:24px">' +
    '<h1 style="margin:0 0 12px;font-size:22px;color:#172033">' + esc_(letter.heading) + "</h1>" +
    letter.intro.map(p).join("") + sections +
    '<div style="margin-top:22px">' + letter.outro.map(p).join("") + "</div>" +
    '<p style="margin:0;font-size:14px"><a href="' + BUSINESS.website + '" style="color:#1d3fae">' + esc_(BUSINESS.website.replace("https://", "")) + "</a></p>" +
    "</div></div></div>";
}

// Makes text safe to put in an email, so nothing a customer types can
// change how the email looks. Line breaks are kept.
function esc_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
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
