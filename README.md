# A Squared Services website

The website is live at **https://asquaredservices.github.io**.

## How it works

- `index.html` is the page content and `style.css` is how it looks.
- Make changes on the `main` branch.
- GitHub Pages serves the site from the `live` branch.
- For now, every push to `main` is copied to `live` automatically by
  [.github/workflows/publish.yml](.github/workflows/publish.yml), so changes
  show up on the website a minute or two after they're pushed.

## Previewing locally

Open `index.html` in a web browser, or run a small local server from this folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
