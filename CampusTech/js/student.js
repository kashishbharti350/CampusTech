// js/student.js: the student-focused features (interests, tracker, checklist, share, teams, resources, dashboard).
// Everything here is stored in localStorage on this device only. There are no accounts and no backend.
// Loaded after app.js, so it can use getAllEvents(), savedIds, openDetails() and showToast().
let profile = sanitizeProfile(loadObject(profileKey));
let tracker = sanitizeTracker(loadObject(trackerKey), getAllEvents().map(function (e) { return e.id; }));
let checks = sanitizeChecks(loadObject(checksKey), getAllEvents());
let teams = sanitizeTeams(loadFromStorage(teamsKey));

function byId(id) { return document.getElementById(id); }
function findEvent(id) { return getAllEvents().find(function (e) { return e.id === id; }); }
function checkedCount(event) { return (checks[event.id] || []).length; }

// ---------- Extra block inside the details modal (called by openDetails in app.js) ----------
function modalExtras(event) {
  const id = escapeHtml(event.id);
  const done = checks[event.id] || [];
  const items = getChecklistItems(event);
  return `
    <hr class="rule">
    <label for="trackSelect"><strong>Application status</strong> (tracked by you, in this browser)</label>
    <select id="trackSelect" data-id="${id}">
      <option value="">Not tracking</option>
      ${STATUSES.map(function (s) { return `<option${tracker[event.id] === s ? " selected" : ""}>${s}</option>`; }).join("")}
    </select>
    <h4>Preparation checklist <span id="checkProgress">${done.length}/${items.length}</span></h4>
    <ul class="checklist">
      ${items.map(function (text, i) {
        return `<li><label><input type="checkbox" data-id="${id}" data-check="${i}"${done.includes(i) ? " checked" : ""}> ${escapeHtml(text)}</label></li>`;
      }).join("")}
    </ul>
    <button class="btn btn-outline btn-small" type="button" data-action="share" data-id="${id}">Share this opportunity</button>`;
}

modalBody.addEventListener("change", function (e) {
  const t = e.target;
  const event = findEvent(t.dataset.id);
  if (!event) return;
  if (t.id === "trackSelect") setStatus(event.id, t.value);
  if (t.dataset.check !== undefined) {
    const list = (checks[event.id] || []).filter(function (n) { return n !== +t.dataset.check; });
    if (t.checked) list.push(+t.dataset.check);
    if (list.length) checks[event.id] = list; else delete checks[event.id];
    saveToStorage(checksKey, checks);
    byId("checkProgress").textContent = checkedCount(event) + "/" + getChecklistItems(event).length;
    renderStudent();
  }
});

modalBody.addEventListener("click", function (e) {
  const button = e.target.closest("button");
  if (button && button.dataset.action === "share" && findEvent(button.dataset.id)) shareEvent(findEvent(button.dataset.id));
});

function setStatus(id, value) {
  if (value === "") delete tracker[id]; else if (STATUSES.includes(value)) tracker[id] = value;
  saveToStorage(trackerKey, tracker);
  renderStudent();
  showToast(value === "" ? "Removed from tracker." : "Status set to " + value + ".");
}

// ---------- Share: native share sheet, then clipboard, then a copy dialog ----------
async function shareEvent(event) {
  const text = buildShareText(event);
  try {
    if (navigator.share) { await navigator.share({ title: event.title, text: text }); return; }
  } catch (error) {
    if (error && error.name === "AbortError") return;  // user closed the share sheet
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to your clipboard.", "success");
  } catch (error) {
    window.prompt("Copy this text:", text);
  }
}

// ---------- For you: interests + recommendations ----------
function renderProfileForm() {
  byId("interestChecks").innerHTML = CATEGORIES.map(function (c) {
    return `<label class="check"><input type="checkbox" name="interest" value="${escapeHtml(c)}"${profile.categories.includes(c) ? " checked" : ""}> ${escapeHtml(c)}</label>`;
  }).join("");
  byId("profileSkills").value = profile.skills.join(", ");
  byId("profileLevel").value = profile.level;
}

byId("profileForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const raw = byId("profileSkills").value;
  profile = sanitizeProfile({
    categories: Array.from(document.querySelectorAll('input[name="interest"]:checked')).map(function (i) { return i.value; }),
    skills: raw.trim() === "" ? [] : parseSkills(raw), level: byId("profileLevel").value
  });
  saveToStorage(profileKey, profile);
  renderStudent();
  showToast("Recommendations updated.", "success");
});
byId("clearProfile").addEventListener("click", function () {
  profile = sanitizeProfile(null);
  saveToStorage(profileKey, profile);
  renderProfileForm();
  renderStudent();
  showToast("Your interests were cleared.");
});

function detailsButton(id, label) {
  return `<button class="btn btn-outline btn-small" type="button" data-action="details" data-id="${escapeHtml(id)}">${label}</button>`;
}

function renderRecommendations() {
  const box = byId("recommendations");
  if (!profile.categories.length && !profile.skills.length) {
    box.innerHTML = '<p class="notice">Pick at least one interest or skill, then press Update recommendations.</p>';
    return;
  }
  const recs = recommendEvents(getAllEvents(), profile, 3);
  box.innerHTML = recs.length ? recs.map(function (r) {
    const info = getDeadlineInfo(r.event.deadline);
    return `<article class="row-card"><div><h3>${escapeHtml(r.event.title)}</h3>
      <p class="meta">Recommended because it ${escapeHtml(r.reasons.join("; "))}.</p></div>
      <div class="row-side"><span class="deadline ${info.cssClass}">${info.text}</span>${detailsButton(r.event.id, "View details")}</div></article>`;
  }).join("") : '<p class="notice">No open opportunities match yet. Try adding more interests or skills.</p>';
}

// ---------- Tracker ----------
function renderTracker() {
  const rows = Object.keys(tracker).map(findEvent).filter(Boolean);
  byId("trackerList").innerHTML = rows.length ? rows.map(function (event) {
    const info = getDeadlineInfo(event.deadline);
    return `<article class="row-card"><div><h3>${escapeHtml(event.title)}</h3>
      <p class="meta">Status: <strong>${tracker[event.id]}</strong> | Checklist ${checkedCount(event)}/${getChecklistItems(event).length}</p></div>
      <div class="row-side"><span class="deadline ${info.cssClass}">${info.text}</span>${detailsButton(event.id, "Update")}</div></article>`;
  }).join("") : '<p class="notice">Nothing tracked yet.</p>';
}

// ---------- Teams (local demo) ----------
function renderTeams() {
  byId("teamList").innerHTML = teams.length ? teams.map(function (t) {
    const id = escapeHtml(t.id);
    return `<article class="row-card"><div><h3>${escapeHtml(t.eventTitle)}${t.filled ? " (team full)" : ""}</h3>
      <p class="meta">${escapeHtml(t.name)} needs: ${escapeHtml(t.role)}${t.skills.length ? " | Skills: " + escapeHtml(t.skills.join(", ")) : ""}</p>
      <p>${escapeHtml(t.message)}</p></div>
      <div class="row-side"><button class="btn btn-outline btn-small" type="button" data-team="fill" data-id="${id}">${t.filled ? "Reopen" : "Mark full"}</button>
      <button class="btn btn-outline btn-small" type="button" data-team="delete" data-id="${id}">Delete</button></div></article>`;
  }).join("") : '<p class="notice">No team requests yet. Posts you add appear here, on this device only.</p>';
}

byId("teamRole").innerHTML = TEAM_ROLES.map(function (r) { return "<option>" + escapeHtml(r) + "</option>"; }).join("");
byId("teamForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const out = byId("teamMessageOut");
  const result = validateTeamPost({ name: byId("teamName").value, eventTitle: byId("teamEvent").value, role: byId("teamRole").value,
    skills: byId("teamSkills").value, message: byId("teamMessage").value });
  if (result.errors.length) {
    out.textContent = result.errors.join(" ");
    out.className = "form-message fail";
    return;
  }
  teams.unshift(result.post);
  teams = teams.slice(0, 50);
  saveToStorage(teamsKey, teams);
  byId("teamForm").reset();
  out.textContent = "";
  renderTeams();
  showToast("Team request posted (visible only on this device).", "success");
});
byId("teamList").addEventListener("click", function (e) {
  const button = e.target.closest("button");
  if (!button) return;
  if (button.dataset.team === "delete") teams = teams.filter(function (t) { return t.id !== button.dataset.id; });
  if (button.dataset.team === "fill") teams.forEach(function (t) { if (t.id === button.dataset.id) t.filled = !t.filled; });
  saveToStorage(teamsKey, teams);
  renderTeams();
});

// ---------- Resources ----------
function renderResources() {
  const tag = byId("resourceTag").value || "All";
  byId("resourceList").innerHTML = RESOURCES.filter(function (r) { return tag === "All" || r.tags.includes(tag); }).map(function (r) {
    return `<article class="card"><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.note)}</p>
      <div class="card-top">${r.tags.map(function (t) { return `<span class="tag">${escapeHtml(t)}</span>`; }).join("")}</div>
      <a class="btn btn-outline" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">Open site</a></article>`;
  }).join("");
}
(function setupResources() {
  const tags = [];
  RESOURCES.forEach(function (r) { r.tags.forEach(function (t) { if (!tags.includes(t)) tags.push(t); }); });
  tags.sort();
  byId("resourceTag").innerHTML = '<option value="All">All topics</option>' + tags.map(function (t) { return "<option>" + escapeHtml(t) + "</option>"; }).join("");
  byId("resourceTag").addEventListener("change", renderResources);
})();

// ---------- Dashboard ----------
function barRows(counts, max) {
  return Object.keys(counts).map(function (label) {
    const pct = max ? Math.round((counts[label] / max) * 100) : 0;
    return `<div class="bar-row"><span>${escapeHtml(label)}</span><div class="bar"><div style="width:${pct}%"></div></div><strong>${counts[label]}</strong></div>`;
  }).join("");
}
function renderDashboard() {
  const s = computeStats(getAllEvents(), savedIds, tracker);
  const max = Math.max(1, s.total);
  const card = function (n, label) { return `<div class="stat-card"><span class="stat-big">${n}</span>${label}</div>`; };
  byId("dashboardBody").innerHTML = `<div class="stat-grid">${card(s.total, "opportunities")}${card(s.open, "still open")}${card(s.expired, "expired")}${card(s.free, "free")}${card(s.saved, "saved")}${card(s.tracked, "tracked")}</div>
    <div class="dash-cols"><div><h3>By category</h3>${barRows(s.byCategory, max)}</div><div><h3>By mode</h3>${barRows(s.byMode, max)}</div>
    <div><h3>Your applications</h3>${barRows(s.byStatus, Math.max(1, s.tracked))}</div></div>`;
}

function renderStudent() {
  renderRecommendations();
  renderTracker();
  renderDashboard();
}

// Start-up
renderProfileForm();
renderTeams();
renderResources();
renderStudent();
// "View details" buttons in the new sections reuse the same opener as the cards
["recommendations", "trackerList"].forEach(function (id) {
  byId(id).addEventListener("click", function (e) {
    const button = e.target.closest("button");
    if (button && button.dataset.action === "details") openDetails(button.dataset.id);
  });
});
