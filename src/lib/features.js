// js/features.js: pure logic for the student features (no HTML, so Node can test it).
// Needs events.js loaded first (CATEGORIES, LEVELS, getDaysLeft, compareByDeadline, parseSkills).
const STATUSES = ["Interested", "Preparing", "Applied", "Interview", "Accepted", "Rejected"];
const TEAM_ROLES = ["Frontend", "Backend", "Designer", "Hardware / Embedded", "Data / AI", "Any role"];

// ---- Profile + recommendations ----
function sanitizeProfile(p) {
  const out = { categories: [], skills: [], level: "All levels" };
  if (!p || typeof p !== "object") return out;
  if (Array.isArray(p.categories)) out.categories = p.categories.filter(function (c) { return CATEGORIES.includes(c); });
  if (Array.isArray(p.skills)) {
    out.skills = p.skills.filter(function (s) { return typeof s === "string"; })
      .map(function (s) { return s.trim().slice(0, 30); }).filter(Boolean).slice(0, 12);
  }
  if (LEVELS.includes(p.level)) out.level = p.level;
  return out;
}

// Points: +3 for a liked category, +2 per shared skill, +1 level bonus (only if something else matched).
function scoreEvent(event, profile) {
  const reasons = [];
  let score = 0;
  if (profile.categories.includes(event.category)) { score += 3; reasons.push("matches your interest in " + event.category); }
  const mine = profile.skills.map(function (s) { return s.toLowerCase(); });
  const shared = event.skills.filter(function (s) { return mine.includes(s.toLowerCase()); });
  if (shared.length) { score += 2 * shared.length; reasons.push("uses your skills: " + shared.join(", ")); }
  if (score > 0 && profile.level !== "All levels" && (event.level === profile.level || event.level === "All levels")) {
    score += 1; reasons.push("suits the " + profile.level.toLowerCase() + " level");
  }
  return { score: score, reasons: reasons };
}

function recommendEvents(events, profile, limit) {
  return events.filter(function (e) { return getDaysLeft(e.deadline) >= 0; })   // never recommend expired events
    .map(function (e) { return Object.assign({ event: e }, scoreEvent(e, profile)); })
    .filter(function (r) { return r.score > 0; })
    .sort(function (a, b) { return b.score - a.score || compareByDeadline(a.event, b.event); })
    .slice(0, limit || 3);
}

// ---- Application tracker + checklist ----
const CHECKLISTS = {
  "Hackathons": ["Find or form a team", "Pick a project idea", "Set up GitHub and your dev tools"],
  "Coding Contests": ["Practice past problems", "Check the allowed languages", "Test your internet and setup"],
  "Workshops": ["Install the required tools", "Review the prerequisites", "Prepare questions to ask"],
  "Internships": ["Update your resume", "Clean up your GitHub or portfolio", "Draft a short cover letter"],
  "Other Opportunities": ["Check the eligibility carefully", "Gather any documents needed"]
};
function getChecklistItems(event) {
  return ["Read the rules and eligibility", "Add the deadline to your calendar"]
    .concat(CHECKLISTS[event.category] || [], ["Submit before the deadline"]);
}

function sanitizeTracker(obj, validIds) {
  const out = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return out;
  Object.keys(obj).forEach(function (id) {
    if (validIds.includes(id) && STATUSES.includes(obj[id])) out[id] = obj[id];
  });
  return out;
}

function sanitizeChecks(obj, events) {
  const out = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return out;
  events.forEach(function (event) {
    const saved = obj[event.id];
    if (!Array.isArray(saved)) return;
    const max = getChecklistItems(event).length;
    const clean = saved.filter(function (n, i) { return Number.isInteger(n) && n >= 0 && n < max && saved.indexOf(n) === i; });
    if (clean.length) out[event.id] = clean;
  });
  return out;
}

// ---- Dashboard numbers ----
function computeStats(events, savedIds, tracker) {
  const stats = { total: events.length, open: 0, expired: 0, free: 0, saved: savedIds.length, tracked: 0, byCategory: {}, byMode: {}, byStatus: {} };
  STATUSES.forEach(function (s) { stats.byStatus[s] = 0; });
  events.forEach(function (e) {
    if (getDaysLeft(e.deadline) < 0) stats.expired++; else stats.open++;
    if (e.cost === "Free") stats.free++;
    stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1;
    stats.byMode[e.mode] = (stats.byMode[e.mode] || 0) + 1;
  });
  Object.keys(tracker).forEach(function (id) { stats.byStatus[tracker[id]]++; stats.tracked++; });
  return stats;
}

// ---- Sharing ----
function buildShareText(event) {
  const lines = [event.title + " (" + event.category + ", " + event.mode + ")", "Deadline: " + event.deadline];
  if (event.source === "demo") lines.push("Note: sample listing from CampusTech, not a verified real event.");
  if (event.url) lines.push("Apply: " + event.url);
  return lines.join("\n");
}

// ---- Team finder (local only) ----
function validateTeamPost(v) {
  const errors = [];
  const name = String(v.name || "").trim();
  const eventTitle = String(v.eventTitle || "").trim();
  const message = String(v.message || "").trim();
  if (name.length < 2 || name.length > 40) errors.push("Name must be 2 to 40 characters.");
  if (eventTitle.length < 3 || eventTitle.length > 80) errors.push("Event must be 3 to 80 characters.");
  if (!TEAM_ROLES.includes(v.role)) errors.push("Choose the role you need.");
  if (message.length < 10 || message.length > 300) errors.push("Message must be 10 to 300 characters.");
  const skills = String(v.skills || "").trim() === "" ? [] : parseSkills(v.skills);
  return { errors: errors, post: { id: "team-" + Date.now() + "-" + Math.floor(Math.random() * 1000), name: name, eventTitle: eventTitle, role: v.role, skills: skills, message: message, filled: false } };
}
function isValidTeamPost(p) {
  return !!p && typeof p === "object" && typeof p.id === "string" && typeof p.name === "string" && typeof p.eventTitle === "string"
    && typeof p.message === "string" && TEAM_ROLES.includes(p.role) && typeof p.filled === "boolean"
    && Array.isArray(p.skills) && p.skills.every(function (s) { return typeof s === "string"; });
}
function sanitizeTeams(list) { return (Array.isArray(list) ? list : []).filter(isValidTeamPost).slice(0, 50); }

// ---- Learning resources: real, well-known sites. Check each link before relying on it. ----
const RESOURCES = [
  { title: "MDN Learn Web Development", url: "https://developer.mozilla.org/en-US/docs/Learn", tags: ["HTML", "CSS", "JavaScript"], note: "Free, beginner-friendly web basics." },
  { title: "freeCodeCamp", url: "https://www.freecodecamp.org/", tags: ["JavaScript", "Python", "Web"], note: "Free interactive courses and projects." },
  { title: "CS50x (Harvard)", url: "https://cs50.harvard.edu/x/", tags: ["Programming", "Algorithms", "Python"], note: "Free intro computer science course." },
  { title: "Pro Git book", url: "https://git-scm.com/book", tags: ["Git", "Teamwork"], note: "Free book: Git from first commit to branching." },
  { title: "Python Tutorial", url: "https://docs.python.org/3/tutorial/", tags: ["Python"], note: "The official tutorial." },
  { title: "Kaggle Learn", url: "https://www.kaggle.com/learn", tags: ["Python", "Data", "AI"], note: "Short free lessons on data and machine learning." },
  { title: "LeetCode", url: "https://leetcode.com/", tags: ["Algorithms", "Contests"], note: "Practice problems for coding contests and interviews." },
  { title: "CP-Algorithms", url: "https://cp-algorithms.com/", tags: ["Algorithms", "Contests"], note: "Explained algorithms for competitive programming." },
  { title: "Arduino Learn", url: "https://docs.arduino.cc/learn/", tags: ["Arduino", "IoT", "Embedded"], note: "Official tutorials for Arduino boards." }
];

// ---- "Did you mean?" for skill typos ----
function editDistance(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const row = [];
  for (let j = 0; j <= b.length; j++) row[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = old;
    }
  }
  return row[b.length];
}
// For each profile skill that no listing mentions, find the closest known skill (if any is close enough).
function suggestSkills(profileSkills, knownSkills) {
  const known = knownSkills.map(function (s) { return s.toLowerCase(); });
  return profileSkills.filter(function (s) { return !known.includes(s.toLowerCase()); }).map(function (typed) {
    const limit = Math.max(1, Math.floor(typed.length / 3));
    let best = null, bestDistance = limit + 1;
    knownSkills.forEach(function (k) { const d = editDistance(typed, k); if (d < bestDistance) { bestDistance = d; best = k; } });
    return { typed: typed, suggestion: best };
  });
}
