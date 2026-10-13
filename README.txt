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

Automatic FK Planer sync (GitHub Action)
- .github/workflows/sync-planner.yml runs every 2 hours (and on demand: Actions tab -> "Sync FK Planer" -> Run workflow).
- It runs scripts/sync-planner.mjs, which downloads FK Planer, keeps this site's groups for the semester in data.json
  ("source" -> e.g. II st. sem. 2 CY) and commits data.json only when something changed.
- The page loads data.json on every open and shows a pop-up listing what changed.
- Run it locally:  node scripts/sync-planner.mjs   (Node 20+)
- New semester: load the new Excel with "Update source" in the Claude version of the page, then ask Claude to
  update data.json's "source" here (or edit it by hand) so the Action follows the new semester.
