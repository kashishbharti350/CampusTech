// Run with:  node tests/logic.test.js
// Loads events.js and storage.js into a sandbox (no browser needed) and checks the pure logic.
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

function load(file, extra) {
  const ctx = vm.createContext(Object.assign({ console: console, URL: URL }, extra || {}));
  vm.runInContext(fs.readFileSync(__dirname + "/../js/" + file, "utf8"), ctx);
  return ctx;
}
let passed = 0;
function same(a, b) { assert.strictEqual(JSON.stringify(a), JSON.stringify(b)); }  // compares contents only
function test(name, fn) { fn(); passed++; console.log("  ok  " + name); }

const ev = load("events.js");
const ft = vm.createContext({ console: console, URL: URL });  // events.js + features.js share one sandbox
["events.js", "features.js"].forEach(function (f) { vm.runInContext(fs.readFileSync(__dirname + "/../js/" + f, "utf8"), ft); });
const runF = function (code) { return vm.runInContext(code, ft); };
const run = function (code) { return vm.runInContext(code, ev); };
const goodEvent = { id: "user-1", source: "user", title: "My Event", category: "Workshops", mode: "Online",
  deadline: "2030-01-15", description: "A long enough description.", url: "https://example.com", skills: ["Git"], eligibility: "All", level: "Beginner", cost: "Free", registration: "open", organizer: "Club", prize: 0, teamSize: "Solo", rounds: ["One"] };

test("daysFromToday / getDaysLeft agree (+5, 0, -3)", function () {
  assert.strictEqual(ev.getDaysLeft(ev.daysFromToday(5)), 5);
  assert.strictEqual(ev.getDaysLeft(ev.daysFromToday(0)), 0);
  assert.strictEqual(ev.getDaysLeft(ev.daysFromToday(-3)), -3);
});
test("deadline labels: expired, due today, 1 day, soon, ok", function () {
  assert.strictEqual(ev.getDeadlineInfo(ev.daysFromToday(-1)).cssClass, "expired");
  assert.strictEqual(ev.getDeadlineInfo(ev.daysFromToday(0)).text, "Due today");
  assert.strictEqual(ev.getDeadlineInfo(ev.daysFromToday(1)).text, "1 day left");
  assert.strictEqual(ev.getDeadlineInfo(ev.daysFromToday(7)).cssClass, "soon");
  assert.strictEqual(ev.getDeadlineInfo(ev.daysFromToday(8)).cssClass, "ok");
});
test("invalid dates never crash and are labelled unknown", function () {
  ["", undefined, null, "abc", "2026-02-30", "2026-13-01", "20-1-1"].forEach(function (d) {
    assert.strictEqual(ev.isValidDateString(d), false);
    assert.strictEqual(ev.getDeadlineInfo(d).cssClass, "unknown");
  });
  assert.strictEqual(ev.isValidDateString("2028-02-29"), true);  // leap day
});
test("default sort puts expired events last", function () {
  const list = [{ deadline: ev.daysFromToday(-3) }, { deadline: ev.daysFromToday(9) }, { deadline: ev.daysFromToday(2) }];
  const sorted = list.sort(ev.compareByDeadline).map(function (e) { return ev.getDaysLeft(e.deadline); });
  same(sorted, [2, 9, -3]);
});
test("escapeHtml blocks tags and attribute break-outs", function () {
  const out = ev.escapeHtml('"><img src=x onerror=alert(1)>\'');
  assert.ok(!/[<>"']/.test(out));
  assert.strictEqual(ev.escapeHtml(undefined), "");
});
test("isValidUrl accepts http(s) only", function () {
  assert.ok(ev.isValidUrl("https://example.com/a?b=1"));
  assert.ok(!ev.isValidUrl("javascript:alert(1)"));
  assert.ok(!ev.isValidUrl("example.com"));
});
test("isValidEvent accepts a good record, rejects bad or tampered ones", function () {
  assert.ok(ev.isValidEvent(goodEvent));
  const bad = [null, "text", {}, Object.assign({}, goodEvent, { deadline: '"><script>' }), Object.assign({}, goodEvent, { category: "Hacks" }),
    Object.assign({}, goodEvent, { skills: "Git" }), Object.assign({}, goodEvent, { url: "javascript:1" }), Object.assign({}, goodEvent, { title: "  " })];
  bad.forEach(function (b) { assert.strictEqual(ev.isValidEvent(b), false); });
});
test("sample data: unique ids, valid dates, marked demo, no invented links", function () {
  const demos = run("demoEvents");
  assert.strictEqual(new Set(demos.map(function (d) { return d.id; })).size, demos.length);
  demos.forEach(function (d) {
    assert.ok(ev.isValidDateString(d.deadline));
    assert.strictEqual(d.source, "demo");
    assert.strictEqual(d.url, "");
    assert.ok(run("CATEGORIES").includes(d.category));
  });
});

// ---- storage.js with a broken and a working localStorage ----
const broken = load("storage.js", { localStorage: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } });
test("storage: blocked localStorage returns safe defaults instead of crashing", function () {
  same(broken.loadFromStorage("x"), []);
  assert.strictEqual(broken.loadText("x"), null);
  assert.strictEqual(broken.saveToStorage("x", [1]), false);
});
const data = {};
const fake = load("storage.js", { localStorage: { getItem: function (k) { return k in data ? data[k] : null; }, setItem: function (k, v) { data[k] = String(v); } } });
test("storage: round trip, corrupt JSON and non-arrays become []", function () {
  assert.strictEqual(fake.saveToStorage("saved", ["a", "b"]), true);
  same(fake.loadFromStorage("saved"), ["a", "b"]);
  data.bad = "{not json"; data.obj = '{"a":1}';
  same(fake.loadFromStorage("bad"), []);
  same(fake.loadFromStorage("obj"), []);
});

// ---- Stage 2 ----
const demos = run("demoEvents");
const all = { category: "All", search: "", savedOnly: false, savedIds: [], hideExpired: false, mode: "All", level: "All", cost: "All", skill: "All", closingSoon: false };
const ids = function (over) { return ev.filterEvents(demos, Object.assign({}, all, over)).map(function (e) { return e.id; }).join(","); };

test("no filters returns all 8 demo events", function () { assert.strictEqual(ids({}).split(",").length, 8); });
test("category + search combine (Hackathons + python = demo-6)", function () { assert.strictEqual(ids({ category: "Hackathons", search: "python" }), "demo-6"); });
test("search with no match returns nothing", function () { assert.strictEqual(ids({ search: "zzzz" }), ""); });
test("mode, level, cost and skill filters", function () {
  assert.strictEqual(ids({ mode: "Hybrid" }), "demo-4");
  assert.strictEqual(ids({ level: "Advanced" }), "demo-7");
  assert.strictEqual(ids({ cost: "Paid" }), "demo-3,demo-6");
  assert.strictEqual(ids({ skill: "Arduino" }), "demo-3");
});
test("all filters together narrow correctly (Online + Beginner + Free)", function () { assert.strictEqual(ids({ mode: "Online", level: "Beginner", cost: "Free" }), "demo-1,demo-5,demo-8"); });
test("hide expired removes demo-7; closing-soon keeps deadlines 0-7 days (demo-1, demo-6)", function () {
  assert.ok(!ids({ hideExpired: true }).includes("demo-7"));
  assert.strictEqual(ids({ closingSoon: true }), "demo-1,demo-6");
});
test("saved only uses the saved id list", function () { assert.strictEqual(ids({ savedOnly: true, savedIds: ["demo-2", "gone"] }), "demo-2"); });
test("registration status: open, closing soon, waitlist, closed", function () {
  const s = function (d, r) { return ev.getRegistrationStatus({ deadline: ev.daysFromToday(d), registration: r }).cssClass; };
  assert.strictEqual(s(10, "open"), "open"); assert.strictEqual(s(2, "open"), "soon");
  assert.strictEqual(s(10, "waitlist"), "waitlist"); assert.strictEqual(s(-1, "waitlist"), "closed");
});
test("parseSkills trims, dedupes, limits and has a fallback", function () {
  same(ev.parseSkills(" Python, git ,python,, "), ["Python", "git"]);
  same(ev.parseSkills(""), ["Not specified"]);
  assert.strictEqual(ev.parseSkills("a,b,c,d,e,f,g,h,i,j").length, 8);
});
test("Stage 1 records without level/cost are upgraded, then valid", function () {
  const old = Object.assign({}, goodEvent); delete old.level; delete old.cost; delete old.registration;
  assert.strictEqual(ev.isValidEvent(old), false);
  assert.strictEqual(ev.isValidEvent(ev.withDefaults(old)), true);
  assert.strictEqual(ev.isValidEvent(Object.assign({}, goodEvent, { cost: "Cheap" })), false);
});
test("demo events all have valid level, cost and registration", function () {
  demos.forEach(function (d) { assert.ok(run("LEVELS").includes(d.level) && run("COSTS").includes(d.cost) && ["open", "waitlist"].includes(d.registration)); });
});

// ---- Stage 3 and 4 ----
const fdemos = runF("demoEvents");
test("sanitizeProfile drops unknown categories, bad skills and bad levels", function () {
  same(ft.sanitizeProfile({ categories: ["Hackathons", "Nope"], skills: [" Python ", 5, ""], level: "Expert" }), { categories: ["Hackathons"], skills: ["Python"], level: "All levels" });
  same(ft.sanitizeProfile("garbage"), { categories: [], skills: [], level: "All levels" });
});
test("recommendations: best match first, explained, never expired", function () {
  const recs = ft.recommendEvents(fdemos, { categories: ["Hackathons"], skills: ["Python"], level: "Beginner" }, 3);
  assert.strictEqual(recs[0].event.id, "demo-6");
  assert.ok(recs.every(function (r) { return r.score > 0 && r.reasons.length > 0; }));
  const contests = ft.recommendEvents(fdemos, { categories: ["Coding Contests"], skills: [], level: "All levels" }, 9);
  assert.ok(!contests.some(function (r) { return r.event.id === "demo-7"; }));
  assert.strictEqual(ft.recommendEvents(fdemos, { categories: [], skills: [], level: "Beginner" }, 3).length, 0);
});
test("checklists: common first and last items, category items in between", function () {
  const items = ft.getChecklistItems({ category: "Internships" });
  assert.strictEqual(items[0], "Read the rules and eligibility");
  assert.strictEqual(items[items.length - 1], "Submit before the deadline");
  assert.ok(items.includes("Update your resume"));
  assert.ok(ft.getChecklistItems({ category: "Unknown" }).length >= 3);
});
test("tracker and checklist data from storage is cleaned", function () {
  same(ft.sanitizeTracker({ "demo-1": "Applied", "demo-2": "Hacked", ghost: "Applied" }, ["demo-1", "demo-2"]), { "demo-1": "Applied" });
  same(ft.sanitizeTracker([1, 2], ["demo-1"]), {});
  const max = ft.getChecklistItems(fdemos[0]).length;
  same(ft.sanitizeChecks({ "demo-1": [0, 0, 1, -1, 99, "x", max] }, fdemos), { "demo-1": [0, 1] });
});
test("dashboard stats add up", function () {
  const st = ft.computeStats(fdemos, ["demo-1", "demo-2"], { "demo-1": "Applied", "demo-3": "Interested" });
  assert.strictEqual(st.total, 8); assert.strictEqual(st.open + st.expired, 8); assert.strictEqual(st.saved, 2);
  assert.strictEqual(st.tracked, 2); assert.strictEqual(st.byStatus.Applied, 1);
  assert.strictEqual(Object.values(st.byCategory).reduce(function (a, b) { return a + b; }, 0), 8);
});
test("share text labels sample events and never invents a link", function () {
  const t = ft.buildShareText(fdemos[0]);
  assert.ok(t.includes("sample listing") && !t.includes("http"));
  assert.ok(ft.buildShareText(Object.assign({}, fdemos[0], { source: "user", url: "https://example.com" })).includes("https://example.com"));
});
test("team posts: validation, limits and stored-data checks", function () {
  const good = { name: "Asha", eventTitle: "Demo Hack Sprint", role: "Frontend", skills: "React, CSS", message: "Looking for a designer friend." };
  const r = ft.validateTeamPost(good);
  assert.strictEqual(r.errors.length, 0); assert.ok(ft.isValidTeamPost(r.post)); same(r.post.skills, ["React", "CSS"]);
  assert.strictEqual(ft.validateTeamPost(Object.assign({}, good, { name: "A", message: "short", role: "King" })).errors.length, 3);
  assert.strictEqual(ft.sanitizeTeams([r.post, { id: 1 }, null]).length, 1);
});
test("resources: https links only, each with tags", function () {
  runF("RESOURCES").forEach(function (r) { assert.ok(r.url.startsWith("https://") && r.tags.length && r.title); });
});

// ---- Unstop-style batch ----
test("prize formatting and parsing", function () {
  assert.strictEqual(ev.formatPrize(0), "No prize listed");
  assert.strictEqual(ev.formatPrize(100000), "\u20B91,00,000");
  assert.strictEqual(ev.parsePrize("abc"), 0); assert.strictEqual(ev.parsePrize("-5"), 0); assert.strictEqual(ev.parsePrize("999999999"), 10000000);
});
test("demo events have organizer, team size, rounds; prize filter and tampered prize", function () {
  demos.forEach(function (d) { assert.ok(d.organizer && d.teamSize && Number.isInteger(d.prize) && Array.isArray(d.rounds) && d.rounds.length); });
  assert.strictEqual(ids({ prizeOnly: true }), "demo-1,demo-2,demo-6,demo-7");
  assert.strictEqual(ev.isValidEvent(Object.assign({}, goodEvent, { prize: "1000" })), false);
  assert.strictEqual(ev.isValidEvent(Object.assign({}, goodEvent, { rounds: "x" })), false);
});
test("calendar file: all-day deadline, next-day end, escaping, valid shape", function () {
  const ics = ev.buildIcs({ id: "demo-1", title: "A, B; C", category: "Hackathons", mode: "Online", deadline: "2026-12-31", source: "demo", url: "" }, new Date("2026-10-17T08:30:00Z"));
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261231") && ics.includes("DTEND;VALUE=DATE:20270101"));
  assert.ok(ics.includes("DTSTAMP:20261017T083000Z") && ics.includes("SUMMARY:Deadline: A\\, B\\; C"));
  assert.ok(ics.includes("Sample listing") && !ics.includes("Apply:"));
});
test("skill typo suggestions", function () {
  const known = ["Arduino", "Python", "Git", "JavaScript"];
  same(ft.suggestSkills(["arduin", "python", "Go", "xylophone"], known), [{ typed: "arduin", suggestion: "Arduino" }, { typed: "Go", suggestion: null }, { typed: "xylophone", suggestion: null }]);
  assert.strictEqual(ft.editDistance("kitten", "sitting"), 3);
});

console.log("\nAll " + passed + " tests passed.");
