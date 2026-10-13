// Downloads the FK Planer timetable and updates data.json with this site's groups.
// Runs in the "Sync FK Planer" GitHub Action; can also be run locally:  node scripts/sync-planner.mjs
// The parsing code is taken from index.html (between the "schedule core" markers),
// so the page and this script always interpret the planner the same way.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT_URL = process.env.SNAPSHOT_URL || "https://ii.pk.edu.pl/~fkruzel/fk-planer-lti/public/plan-st/snapshot.php";
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const a = html.indexOf("/* ===== schedule core"), b = html.indexOf("/* ===== end core ===== */");
if (a < 0 || b < 0) throw new Error("Couldn't find the schedule core in index.html");
const { plannerToClasses, campusOf, diffClasses } =
  new Function(html.slice(a, b) + ";return {plannerToClasses,campusOf,diffClasses};")();

// Current data: data.json if present, otherwise the copy embedded in index.html.
const dataPath = path.join(ROOT, "data.json");
let data;
if (fs.existsSync(dataPath)) data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
else {
  const m = /<script type="application\/json" id="schedule-data">([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error("No data.json and no embedded schedule data");
  data = JSON.parse(m[1]);
}

console.log(`Fetching ${SNAPSHOT_URL}`);
const res = await fetch(SNAPSHOT_URL, {
  headers: { "user-agent": "university-schedule-sync (+https://github.com/YarikRevich/university-schedule)", "accept": "application/json" },
  signal: AbortSignal.timeout(120000),
});
if (!res.ok) throw new Error(`FK Planer answered ${res.status} ${res.statusText}`);
const snap = await res.json();
if (!snap || !snap.calendarExport || !Array.isArray(snap.calendarExport.events)) throw new Error("Unexpected planner data (no calendarExport.events)");

const now = new Date().toISOString();
let calendar = data.calendar;
const rooms = { ...data.rooms };
const groups = {};
const report = [];
for (const [id, g] of Object.entries(data.groups)) {
  const res = plannerToClasses(snap, g.classes, { plannerGroups: g.plannerGroups, source: data.source });
  if (res.calendar) calendar = res.calendar;
  Object.assign(rooms, res.rooms);
  if (!res.classes.length) { groups[id] = g; report.push(`${id}: no classes in the planner for ${data.source?.label || "this semester"} — kept as is`); continue; }
  groups[id] = { ...g, classes: res.classes };
}
for (const g of Object.values(groups))
  g.classes = g.classes.map(c => ({ ...c, c: campusOf(c.r, rooms) })).sort((p, q) => p.day - q.day || p.a.localeCompare(q.a));

let changed = JSON.stringify(calendar) !== JSON.stringify(data.calendar);
for (const [id, g] of Object.entries(groups)) {
  const df = diffClasses(data.groups[id].classes, g.classes);
  const n = df.added.length + df.removed.length + df.moved.length;
  if (n) { changed = true; report.push(`${id}: +${df.added.length} −${df.removed.length} room changes ${df.moved.length}`); }
}

if (!changed) { console.log("No changes."); report.forEach(l => console.log(l)); process.exit(0); }

for (const g of Object.values(groups)) g.meta = { ...g.meta, planner: now, origin: "planner" };
const out = { ...data, meta: { ...data.meta, updated: now }, calendar, rooms, groups };
fs.writeFileSync(dataPath, JSON.stringify(out) + "\n");
console.log("data.json updated:"); report.forEach(l => console.log("  " + l));
