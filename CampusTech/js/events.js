// =====================================================
// 1. DATA
// =====================================================

// Helper: turns a Date into text like "2026-10-20" (the format used for deadlines)
function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

// Helper: the date that is N days from today (negative N = in the past).
// Demo deadlines use this so they always look fresh when you open the page.
function daysFromToday(numberOfDays) {
  const date = new Date();
  date.setDate(date.getDate() + numberOfDays);
  return formatDate(date);
}

// FICTIONAL demo data. url is empty on purpose: there are no real links.
// To add a real opportunity, copy one object, set source: "real"
// and paste a verified link into url.
const demoEvents = [
  { id: "demo-1", source: "demo", level: "Beginner", cost: "Free", registration: "open", title: "Demo Hack Sprint", category: "Hackathons", mode: "Online", deadline: daysFromToday(5),
    description: "A fictional 24-hour hackathon where teams build a small app that solves a campus problem.",
    skills: ["JavaScript", "Teamwork", "Prototyping"], eligibility: "Open to all undergraduate students.", url: "" },
  { id: "demo-2", source: "demo", level: "Intermediate", cost: "Free", registration: "open", title: "Demo Code Clash", category: "Coding Contests", mode: "Online", deadline: daysFromToday(12),
    description: "A fictional timed contest with algorithm and problem-solving questions.",
    skills: ["C++", "Python", "Algorithms"], eligibility: "Any year, any branch.", url: "" },
  { id: "demo-3", source: "demo", level: "Beginner", cost: "Paid", registration: "open", title: "Demo Embedded Systems Workshop", category: "Workshops", mode: "Offline", deadline: daysFromToday(20),
    description: "A fictional hands-on workshop on microcontrollers, sensors and simple circuits.",
    skills: ["Arduino", "C", "Electronics"], eligibility: "ECE and EEE students, beginners welcome.", url: "" },
  { id: "demo-4", source: "demo", level: "Intermediate", cost: "Free", registration: "open", title: "Demo IoT Internship", category: "Internships", mode: "Hybrid", deadline: daysFromToday(30),
    description: "A fictional summer internship building small IoT prototypes with a mentor.",
    skills: ["IoT", "Python", "Sensors"], eligibility: "Second and third year engineering students.", url: "" },
  { id: "demo-5", source: "demo", level: "Beginner", cost: "Free", registration: "open", title: "Demo Open Source Mentorship", category: "Other Opportunities", mode: "Online", deadline: daysFromToday(45),
    description: "A fictional program that pairs beginners with mentors to make first open-source contributions.",
    skills: ["Git", "GitHub", "Documentation"], eligibility: "Beginners with basic programming knowledge.", url: "" },
  { id: "demo-6", source: "demo", level: "Intermediate", cost: "Paid", registration: "waitlist", title: "Demo AI Build Weekend", category: "Hackathons", mode: "Offline", deadline: daysFromToday(2),
    description: "A fictional weekend event to build a simple machine learning project in teams of up to four.",
    skills: ["Python", "Machine Learning", "Presentation"], eligibility: "Teams of 2 to 4 students.", url: "" },
  { id: "demo-7", source: "demo", level: "Advanced", cost: "Free", registration: "open", title: "Demo Algorithm Cup", category: "Coding Contests", mode: "Online", deadline: daysFromToday(-3),
    description: "A fictional contest whose deadline has already passed, shown to test the expired style.",
    skills: ["Data Structures", "Java"], eligibility: "Open to all students.", url: "" },
  { id: "demo-8", source: "demo", level: "Beginner", cost: "Free", registration: "open", title: "Demo Web Dev Workshop", category: "Workshops", mode: "Online", deadline: daysFromToday(9),
    description: "A fictional beginner workshop covering HTML, CSS and JavaScript by building a small page.",
    skills: ["HTML", "CSS", "JavaScript"], eligibility: "No experience needed.", url: "" }
];

// =====================================================
// EVENT HELPERS
// Pure functions: they need no HTML, so tests/logic.test.js can run them in Node.
// =====================================================
const CATEGORIES = ["Hackathons", "Coding Contests", "Workshops", "Internships", "Other Opportunities"];
const MODES = ["Online", "Offline", "Hybrid"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"];
const COSTS = ["Free", "Paid", "Not specified"];

// Escapes < > & and both quote types, so text is safe inside HTML and inside attributes.
function escapeHtml(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function isValidUrl(text) {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

// True only for real dates written as YYYY-MM-DD ("2026-02-30" is rejected).
function isValidDateString(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const date = new Date(+match[1], +match[2] - 1, +match[3]);
  return date.getFullYear() === +match[1] && date.getMonth() === +match[2] - 1 && date.getDate() === +match[3];
}

// Days until the deadline (negative = passed). NaN if the date is invalid.
function getDaysLeft(deadline) {
  if (!isValidDateString(deadline)) return NaN;
  const parts = deadline.split("-");
  const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24));
}

function getDeadlineInfo(deadline) {
  const daysLeft = getDaysLeft(deadline);
  if (Number.isNaN(daysLeft)) return { text: "Date unknown", cssClass: "unknown" };
  if (daysLeft < 0) return { text: "Expired", cssClass: "expired" };
  if (daysLeft === 0) return { text: "Due today", cssClass: "soon" };
  if (daysLeft === 1) return { text: "1 day left", cssClass: "soon" };
  if (daysLeft <= 7) return { text: daysLeft + " days left", cssClass: "soon" };
  return { text: daysLeft + " days left", cssClass: "ok" };
}

// Sort rule: upcoming deadlines first (soonest on top), expired ones at the bottom.
function compareByDeadline(a, b) {
  const aExpired = getDaysLeft(a.deadline) < 0;
  const bExpired = getDaysLeft(b.deadline) < 0;
  if (aExpired !== bExpired) return aExpired ? 1 : -1;
  return a.deadline.localeCompare(b.deadline);
}

// Checks an opportunity read back from localStorage. Broken or tampered records are dropped.
function isValidEvent(e) {
  if (!e || typeof e !== "object") return false;
  const text = function (v) { return typeof v === "string" && v.trim() !== ""; };
  return text(e.id) && e.source === "user" && text(e.title) && text(e.description) && text(e.eligibility)
    && CATEGORIES.includes(e.category) && MODES.includes(e.mode) && isValidDateString(e.deadline)
    && LEVELS.includes(e.level) && COSTS.includes(e.cost) && (e.registration === "open" || e.registration === "waitlist")
    && Array.isArray(e.skills) && e.skills.every(function (s) { return typeof s === "string"; })
    && (e.url === "" || isValidUrl(e.url));
}

// ---------- Stage 2 helpers ----------
// Records saved by Stage 1 have no level/cost/registration, so give them safe defaults.
function withDefaults(e) {
  if (!e || typeof e !== "object") return e;
  return Object.assign({ level: "All levels", cost: "Not specified", registration: "open" }, e);
}

// "Python, git ,Python" -> ["Python", "git"]. Max 8 skills, 30 characters each.
function parseSkills(text) {
  const list = [];
  String(text || "").split(",").forEach(function (part) {
    const skill = part.trim().slice(0, 30);
    if (skill !== "" && !list.some(function (s) { return s.toLowerCase() === skill.toLowerCase(); })) list.push(skill);
  });
  return list.length ? list.slice(0, 8) : ["Not specified"];
}

// Registration status comes from the deadline plus the stored "registration" field.
function getRegistrationStatus(event) {
  const daysLeft = getDaysLeft(event.deadline);
  if (daysLeft < 0) return { text: "Registration closed", cssClass: "closed" };
  if (event.registration === "waitlist") return { text: "Waitlist only", cssClass: "waitlist" };
  if (daysLeft <= 3) return { text: "Closing soon", cssClass: "soon" };
  return { text: "Registration open", cssClass: "open" };
}

// All filtering in one pure function. f holds the current choices; "All" means "no filter".
function filterEvents(events, f) {
  const search = String(f.search || "").trim().toLowerCase();
  return events.filter(function (event) {
    const daysLeft = getDaysLeft(event.deadline);
    const text = (event.title + " " + event.category + " " + event.skills.join(" ") + " " + event.description).toLowerCase();
    return (f.category === "All" || event.category === f.category)
      && text.includes(search)
      && (!f.savedOnly || f.savedIds.includes(event.id))
      && (!f.hideExpired || !(daysLeft < 0))
      && (f.mode === "All" || event.mode === f.mode)
      && (f.level === "All" || event.level === f.level)
      && (f.cost === "All" || event.cost === f.cost)
      && (f.skill === "All" || event.skills.includes(f.skill))
      && (!f.closingSoon || (daysLeft >= 0 && daysLeft <= 7));
  });
}
