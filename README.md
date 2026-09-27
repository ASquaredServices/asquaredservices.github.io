# A Squared Services website

The website is live at **https://asquaredservices.github.io**.

## What's where

| File | What it is |
| --- | --- |
| [index.html](index.html) | All the page text: home page, Fall, Winter, Spring & Summer, and the forms |
| [config.js](config.js) | **Prices, payment options, contact info**, and the Google Sheet link. Change prices here. |
| [style.css](style.css) | Colors and layout. Each season's colors are near the top. |
| [app.js](app.js) | Makes the tabs work, calculates the estimates, checks phone numbers, and sends the forms |
| [logo.svg](logo.svg) | The A² logo in color. [flier/logo-bw.svg](flier/logo-bw.svg) is the black-and-white version, and [favicon.svg](favicon.svg) is the browser tab icon. |
| [google-sheet/](google-sheet/SETUP.md) | How to connect the forms to a Google Sheet, plus the script to paste in |
| [flier/](flier/) | The printable black-and-white flier ([flier.pdf](flier/flier.pdf)) and QR code. No prices on it; the QR code sends people to the website. |

Text that still needs Adrian's real wording is marked with `DRAFT` comments in `index.html`. What's left before the full rollout is in [TODO.md](TODO.md).

## How publishing works

- Make changes on the `main` branch.
- GitHub Pages serves the site from the `live` branch.
- For now, every push to `main` is copied to `live` automatically by
  [.github/workflows/publish.yml](.github/workflows/publish.yml), so changes
  show up on the website a minute or two after they're pushed.

## Previewing locally

Run a small local server from this folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Remaking the flier PDF

Open `flier/index.html` through the local server (http://localhost:8000/flier/) in Chrome, print it, choose **Save as PDF**, set Margins to **None**, and turn on **Background graphics**. Or from the command line on a Mac:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf=flier/flier.pdf http://localhost:8000/flier/
```
