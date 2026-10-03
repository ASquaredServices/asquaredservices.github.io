# Connecting the website forms to a Google Sheet

When someone sends a request on the website, it will:

- add a row to a Google Sheet (one tab each for Fall, Winter, Spring & Summer, and Season Pass)
- send an email to you with the details. Hitting **Reply** on that email goes straight to the customer.

This takes about 10 minutes and only needs to be done once.

## 1. Make the sheet

1. Sign in to the Google account that should own the requests (ideally the A Squared Services business account). **It needs a Gmail address.** If you sign in to Google with another address, like an iCloud one, the notification emails are sent "from" that address through Google, so services like iCloud treat them as fake and reject them ("554 5.7.1 [HM08] Message rejected due to local policy"). To fix that, [add Gmail to your Google Account](https://support.google.com/accounts/answer/76194): go to [mail.google.com](https://mail.google.com), sign in, and follow the steps.
2. Go to [sheets.new](https://sheets.new) to make a new spreadsheet. Name it something like **A2 Requests**.

You don't need to make any tabs or columns. The first time each form sends a request, the script makes its tab (**Fall**, **Winter**, **Spring & Summer**, **Season Pass**) with the column names in row 1. If you already made tabs for these, it uses them. Capitalization and punctuation don't matter, so a tab called "spring/summer" works too.

## 2. Add the script

1. In the spreadsheet menu, click **Extensions → Apps Script**.
2. Delete the few lines of sample code that are there.
3. Copy everything in [Code.gs](Code.gs) and paste it in.
4. Click the **Save** icon.

## 3. Test it

1. In the menu at the top of the editor (next to **Run**), make sure **testSetup** is picked.
2. Click **Run**.
3. The first time, Google asks you to authorize the script:
   - Click **Review permissions** and pick your account.
   - You'll see "Google hasn't verified this app." That's expected, because it's your own script. Click **Advanced**, then **Go to (project name) (unsafe)**, then **Allow**.
4. The log at the bottom should say "It worked!" and list who got the test email. The sheet should have new **Test** and **Settings** tabs, and you should get a test email. You can delete the Test tab afterward (keep Settings).

Don't click Run with **doPost** picked. It only runs when the website sends a form, so running it by hand just gives an error.

## 4. Publish it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - Description: `A2 website form`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**. If Google asks you to authorize again, follow the same steps as in part 3.
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/…/exec`.

To check that it worked, paste the URL into a browser. You should see "The A Squared Services form receiver is running."

## 5. Connect the website

Put the URL in [config.js](../config.js) between the quotes on the `formEndpoint:` line, then commit and push to `main`. Or just send the URL to your dad and we'll do it.

Then send yourself a test request from the website. A new tab should appear in the sheet, and you should get an email.

## The emails

Every request sends two kinds of email:

- **To the customer:** a thank-you with a copy of their request and estimate. It comes from the Google account that owns the sheet, shows up as "A² Services", and replies go to the business email. The business name, email, and phone for these emails are at the top of the script (`BUSINESS`). Each address gets at most 3 of these per hour, so nobody can use the form to flood someone's inbox.
- **To us:** the customer's details, the request, and the estimate. Hit Reply to email the customer.

## Who gets the emails

The **Settings** tab, cell **B1**, lists who gets an email for each new request. To add someone, type their address after yours with a comma in between, like `you@gmail.com, friend@example.com`. Changes work right away, with no need to touch the script. If B1 is empty, emails go to the Google account that owns the sheet.

To get alerts on your phone, use the Gmail app, or add the Gmail account to your iPhone's Mail app.

## Using the sheet

- Change colors, column widths, and sorting however you like.
- Add your own columns to the right, like **Done?** or **Paid?**. New requests leave them blank for you to fill in.
- Don't rename the column names the script made in row 1. If you do, it adds a new column with the original name.

## Tracking money

To add money tracking, open **Extensions → Apps Script**, pick **setupFinances** in the menu at the top, and click **Run**. It adds two tabs:

- **Jobs:** write down each finished job: the date, the customer, the service (pick from the list), the amount they paid, how they paid, and any notes. A Season Pass counts as one job.
- **Finances:** works everything out from the Jobs tab: your goal (type it in cell **B4**), total earned, a progress bar toward the goal, how much is still to go, jobs done, average job price, earnings by service, and two charts (money earned over time, and earned each month).

Running it again won't erase anything. To rebuild the Finances tab, delete it and run setupFinances again; the Jobs tab is kept.

## Changing the script later

If you edit the script, the website won't use the new version until you publish it: **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy**. The URL stays the same.
