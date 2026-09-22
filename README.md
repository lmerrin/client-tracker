# Webby Wahine Client Tracker

A private-by-default client project tracker built with plain HTML, CSS, and JavaScript. It is ready for GitHub Pages and does not require a build process.

## Important privacy note

Client records are stored in the browser's local storage. They are not included in this repository or sent to GitHub. Data entered on one browser or device will not automatically appear on another.

Use **Export backup** regularly. Use **Import backup** to restore records or move them to another browser.

## Preview on your computer

1. Open this folder in Visual Studio Code.
2. Install the Live Server extension if needed.
3. Right-click `index.html` and select **Open with Live Server**.

You can also double-click `index.html`, although Live Server is recommended.

## Upload to GitHub Pages

1. Create a new GitHub repository. Do not add a README during setup because this package already contains one.
2. Upload all files in this folder to the repository root.
3. Commit the files with a message such as `Add Webby Wahine client tracker`.
4. Open the repository's **Settings**.
5. Select **Pages** in the left sidebar.
6. Under **Build and deployment**, choose **Deploy from a branch**.
7. Select the `main` branch and the `/ (root)` folder, then save.
8. GitHub will display the public Pages URL after deployment finishes.

## Files

- `index.html` — application structure
- `styles.css` — responsive design and brand styling
- `app.js` — client records, filters, backups, and browser storage
- `favicon.svg` — browser icon
- `404.html` — GitHub Pages fallback

## Data safety

- The GitHub Pages website itself may be publicly reachable, but it starts empty for every new visitor.
- Do not add client records directly to `app.js` or commit backup JSON files to GitHub.
- Browser storage can be erased if browser data is cleared, so keep current backup files somewhere private.
