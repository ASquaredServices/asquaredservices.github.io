# Connecting the website forms to a Google Sheet

When someone sends a request on the website, it will:

- add a row to a Google Sheet (one tab each for Fall, Winter, Spring & Summer, and Season Pass)
- send an email to you with the details. Hitting **Reply** on that email goes straight to the customer.

This takes about 10 minutes and only needs to be done once.

## 1. Make the sheet

1. Sign in to the Google account that should own the requests (ideally the A Squared Services business account).
2. Go to [sheets.new](https://sheets.new) to make a new spreadsheet. Name it something like **A2 Requests**.

## 2. Add the script

1. In the spreadsheet menu, click **Extensions → Apps Script**.
2. Delete the few lines of sample code that are there.
3. Copy everything in [Code.gs](Code.gs) and paste it in.
4. Optional: to send notifications to a different email (or to more than one), put it between the quotes on the `NOTIFY_EMAIL` line.
5. Click the **Save** icon.

## 3. Publish it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - Description: `A2 website form`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**.
5. Google will ask you to authorize the script:
   - Click **Authorize access** and pick your account.
   - You'll see "Google hasn't verified this app." That's expected, because it's your own script. Click **Advanced**, then **Go to (project name) (unsafe)**, then **Allow**.
6. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/…/exec`.

To check that it worked, paste the URL into a browser. You should see "The A Squared Services form receiver is running."

## 4. Connect the website

Put the URL in [config.js](../config.js) between the quotes on the `formEndpoint:` line, then commit and push to `main`. Or just send the URL to your dad and we'll do it.

Then send yourself a test request from the website. A new tab should appear in the sheet, and you should get an email.

## Changing the script later

If you edit the script, the website won't use the new version until you publish it: **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy**. The URL stays the same.
