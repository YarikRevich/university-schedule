CY GL4 Timetable — installable web app (PWA)

A PWA must be served over HTTPS (or localhost). Pick one:

1) GitHub Pages: create a repo, upload all files from this folder (keep the icons/ folder),
   Settings -> Pages -> Deploy from branch (main, / root). Open https://<you>.github.io/<repo>/
2) Netlify Drop: drag this folder onto https://app.netlify.com/drop
3) Local test: in this folder run  python3 -m http.server 8000  and open http://localhost:8000

Install:
- Android / desktop Chrome or Edge: "Install app" button in the page, or browser menu -> Install.
- iPhone / iPad (Safari): Share -> Add to Home Screen.

After editing index.html, change VERSION in sw.js so phones pick up the new version.
