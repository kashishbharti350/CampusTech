let customEvents = loadFromStorage(customKey).map(withDefaults).filter(isValidEvent);  // adds defaults, drops broken records  // opportunities the user added
let savedIds = loadFromStorage(savedKey);       // ids of bookmarked opportunities
// Forget saved ids whose opportunity no longer exists
savedIds = savedIds.filter(function (id) { return getAllEvents().some(function (e) { return e.id === id; }); });
let selectedCategory = "All";
let hideExpired = false;
let showSavedOnly = false;

// =====================================================
// 3. GRABBING HTML ELEMENTS
// =====================================================
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const savedToggle = document.getElementById("savedToggle");
const categoryFilters = document.getElementById("categoryFilters");
const eventGrid = document.getElementById("eventGrid");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");
const detailsDialog = document.getElementById("detailsDialog");
const modalBody = document.getElementById("modalBody");
const resetButton = document.getElementById("resetFilters");
const hideExpiredInput = document.getElementById("hideExpired");
const filterMode = document.getElementById("filterMode");
const filterLevel = document.getElementById("filterLevel");
const filterCost = document.getElementById("filterCost");
const filterSkill = document.getElementById("filterSkill");
const closingSoonInput = document.getElementById("closingSoon");
const upcomingList = document.getElementById("upcomingList");
const hasPrizeInput = document.getElementById("hasPrize");

// =====================================================
// 4. HELPER FUNCTIONS
// =====================================================

// All opportunities = demo + user-added
function getAllEvents() {
  return demoEvents.concat(customEvents);
}


function getSourceLabel(event) {
  if (event.source === "user") return "Added by you";
  if (event.source === "demo") return "Demo data";
  return "";
}

// =====================================================
// 5. SEARCH + FILTER + SORT
// =====================================================
function getVisibleEvents() {
  const results = filterEvents(getAllEvents(), {
    category: selectedCategory, search: searchInput.value, savedOnly: showSavedOnly, savedIds: savedIds,
    hideExpired: hideExpired, mode: filterMode.value, level: filterLevel.value, cost: filterCost.value,
    skill: filterSkill.value, closingSoon: closingSoonInput.checked, prizeOnly: hasPrizeInput.checked
  });

  // sort() reorders the list. Dates like "2026-10-20" sort correctly as text.
  const sortChoice = sortSelect.value;
  results.sort(function (a, b) {
    if (sortChoice === "deadline-asc") return compareByDeadline(a, b);
    if (sortChoice === "prize") return (b.prize - a.prize) || compareByDeadline(a, b);
    if (sortChoice === "deadline-desc") return b.deadline.localeCompare(a.deadline);
    return a.title.localeCompare(b.title);
  });

  return results;
}

// =====================================================
// 6. RENDERING (turning data into HTML)
// =====================================================
function createCardHtml(event) {
  const deadlineInfo = getDeadlineInfo(event.deadline);
  const isSaved = savedIds.includes(event.id);
  const sourceLabel = getSourceLabel(event);
  const registration = getRegistrationStatus(event);

  return `
    <article class="card${deadlineInfo.cssClass === "expired" ? " is-expired" : ""}">
      <div class="card-top">
        <span class="tag">${escapeHtml(event.category)}</span>
        ${sourceLabel ? `<span class="tag tag-demo">${sourceLabel}</span>` : ""}
        <span class="tag status status-${registration.cssClass}">${registration.text}</span>
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      <p class="meta">Mode: ${escapeHtml(event.mode)} | Level: ${escapeHtml(event.level)} | Cost: ${escapeHtml(event.cost)}<br>Deadline: ${escapeHtml(event.deadline)}<br>Prize: ${formatPrize(event.prize)} | Team: ${escapeHtml(event.teamSize)}<br>By ${escapeHtml(event.organizer)}</p>
      <p class="deadline ${deadlineInfo.cssClass}">${deadlineInfo.text}</p>
      <p>${escapeHtml(event.description)}</p>
      <div class="card-actions">
        <button class="btn btn-primary" type="button" data-action="details" data-id="${escapeHtml(event.id)}">View details</button>
        <button class="btn btn-outline" type="button" data-action="save" data-id="${escapeHtml(event.id)}"
          aria-pressed="${isSaved}" aria-label="${isSaved ? "Unsave" : "Save"} ${escapeHtml(event.title)}">
          ${isSaved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </article>`;
}

function updateStats() {
  document.getElementById("statTotal").textContent = getAllEvents().length;
  document.getElementById("statSaved").textContent = savedIds.length;
  document.getElementById("savedCount").textContent = savedIds.length;
}

// The main function: call it any time something changes
function renderEvents() {
  const visibleEvents = getVisibleEvents();

  // map() turns each event into HTML text; join() glues the pieces together
  eventGrid.innerHTML = visibleEvents.map(createCardHtml).join("");

  emptyState.hidden = visibleEvents.length > 0;
  resetButton.hidden = !hasActiveFilters();
  renderUpcoming();
  resultCount.textContent = "Showing " + visibleEvents.length + " of " + getAllEvents().length + " opportunities";
  updateStats();
  if (typeof renderStudent === "function") renderStudent();  // refresh dashboard, tracker, recommendations
}

// =====================================================
// 7. SAVING BOOKMARKS
// =====================================================
function toggleSave(eventId) {
  if (savedIds.includes(eventId)) {
    savedIds = savedIds.filter(function (id) { return id !== eventId; });
  } else {
    savedIds.push(eventId);
  }
  saveToStorage(savedKey, savedIds);
  renderEvents();
  showToast(savedIds.includes(eventId) ? "Saved to your list." : "Removed from your list.");
}

// =====================================================
// 8. MODAL
// =====================================================
function openDetails(eventId) {
  const event = getAllEvents().find(function (item) { return item.id === eventId; });
  if (!event) return;

  const deadlineInfo = getDeadlineInfo(event.deadline);
  const linkHtml = event.url
    ? `<a href="${escapeHtml(event.url)}" target="_blank" rel="noopener noreferrer">Apply / learn more</a>`
    : "No application link (this is demo data)";

  modalBody.innerHTML = `
    <span class="tag">${escapeHtml(event.category)}</span>
    <h3 id="modalTitle">${escapeHtml(event.title)}</h3>
    <p>${escapeHtml(event.description)}</p>
    <dl>
      <dt>Mode</dt><dd>${escapeHtml(event.mode)}</dd>
      <dt>Level</dt><dd>${escapeHtml(event.level)}</dd>
      <dt>Cost</dt><dd>${escapeHtml(event.cost)}</dd>
      <dt>Registration</dt><dd>${getRegistrationStatus(event).text}${event.source === "demo" ? " (sample status)" : ""}</dd>
      <dt>Deadline</dt><dd>${escapeHtml(event.deadline)} (${deadlineInfo.text})</dd>
      <dt>Skills</dt><dd>${escapeHtml(event.skills.join(", "))}</dd>
      <dt>Eligibility</dt><dd>${escapeHtml(event.eligibility)}</dd>
      <dt>Organizer</dt><dd>${escapeHtml(event.organizer)}</dd>
      <dt>Prize</dt><dd>${formatPrize(event.prize)}${event.source === "demo" && event.prize > 0 ? " (sample figure)" : ""}</dd>
      <dt>Team size</dt><dd>${escapeHtml(event.teamSize)}</dd>
      <dt>Application</dt><dd>${linkHtml}</dd>
    </dl>`;
  if (typeof modalExtras === "function") modalBody.innerHTML += modalExtras(event);  // tracker, checklist, share (student.js)
  detailsDialog.showModal();  // built-in: traps focus, Esc closes it
}

// =====================================================
// 9. ADD-OPPORTUNITY FORM
// =====================================================
function showError(fieldName, message) {
  document.getElementById(fieldName + "Error").textContent = message;
}

function handleFormSubmit(submitEvent) {
  submitEvent.preventDefault();  // stop the page from reloading

  const title = document.getElementById("titleInput").value.trim();
  const category = document.getElementById("categoryInput").value;
  const deadline = document.getElementById("deadlineInput").value;
  const mode = document.getElementById("modeInput").value;
  const description = document.getElementById("descriptionInput").value.trim();
  const url = document.getElementById("urlInput").value.trim();

  // Check every field; each failed check shows its own message
  let isValid = true;
  showError("title", title.length < 3 ? "Enter a title of at least 3 characters." : "");
  showError("category", category === "" ? "Choose a category." : "");
  showError("deadline", deadline === "" ? "Choose a deadline." : getDaysLeft(deadline) < 0 ? "Deadline cannot be in the past." : "");
  showError("mode", mode === "" ? "Choose a mode." : "");
  showError("description", description.length < 20 ? "Write at least 20 characters." : "");
  showError("url", url !== "" && !isValidUrl(url) ? "Enter a full link starting with http:// or https://" : "");

  document.querySelectorAll(".error").forEach(function (span) {
    if (span.textContent !== "") isValid = false;
  });

  const message = document.getElementById("formMessage");
  if (!isValid) {
    message.textContent = "Please fix the errors above.";
    message.className = "form-message fail";
    return;
  }

  customEvents.push({
    id: "user-" + Date.now(),
    source: "user",
    title: title, category: category, deadline: deadline, mode: mode,
    description: description, url: url,
    level: document.getElementById("levelInput").value,
    cost: document.getElementById("costInput").value,
    registration: "open",
    organizer: document.getElementById("organizerInput").value.trim().slice(0, 60) || "Added by you",
    prize: parsePrize(document.getElementById("prizeInput").value),
    teamSize: "Not specified",
    rounds: [],
    skills: parseSkills(document.getElementById("skillsInput").value),
    eligibility: "Not specified"
  });
  saveToStorage(customKey, customEvents);
  populateSkillOptions();

  document.getElementById("addForm").reset();
  message.textContent = "Added! Your opportunity is now in the list above.";
  message.className = "form-message success";
  showToast("Opportunity added.", "success");
  renderEvents();
}

// =====================================================
// 10. THEME
// =====================================================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const button = document.getElementById("themeToggle");
  button.textContent = theme === "dark" ? "☀️" : "🌙";
  button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

// =====================================================
// 11. EVENT LISTENERS (connecting user actions to functions)
// =====================================================
// ---- Toasts: small messages that disappear by themselves ----
function showToast(message, type) {
  const region = document.getElementById("toastRegion");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = "toast" + (type ? " toast-" + type : "");
  toast.textContent = message;  // textContent (not innerHTML) keeps it safe
  region.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3500);
}

// ---- Filters ----
function setCategory(category) {
  selectedCategory = category;
  document.querySelectorAll(".chip").forEach(function (chip) {
    const isActive = chip.dataset.category === category;
    chip.classList.toggle("active", isActive);
    chip.setAttribute("aria-pressed", isActive);
  });
}

function hasActiveFilters() {
  return searchInput.value.trim() !== "" || selectedCategory !== "All" || showSavedOnly || hideExpired ||
    filterMode.value !== "All" || filterLevel.value !== "All" || filterCost.value !== "All" ||
    filterSkill.value !== "All" || closingSoonInput.checked || hasPrizeInput.checked;
}

function resetFilters() {
  searchInput.value = "";
  hideExpired = false;
  hideExpiredInput.checked = false;
  [filterMode, filterLevel, filterCost, filterSkill].forEach(function (select) { select.value = "All"; });
  closingSoonInput.checked = false;
  hasPrizeInput.checked = false;
  showSavedOnly = false;
  savedToggle.setAttribute("aria-pressed", "false");
  setCategory("All");
  renderEvents();
  showToast("Filters cleared.");
}

document.querySelectorAll("[data-reset]").forEach(function (button) {
  button.addEventListener("click", resetFilters);
});
hideExpiredInput.addEventListener("change", function () {
  hideExpired = hideExpiredInput.checked;
  renderEvents();
});

// ---- Skill dropdown: built from the skills that actually exist in the data ----
function populateSkillOptions() {
  const current = filterSkill.value || "All";
  const skills = [];
  getAllEvents().forEach(function (event) {
    event.skills.forEach(function (skill) {
      if (skill !== "Not specified" && !skills.includes(skill)) skills.push(skill);
    });
  });
  skills.sort(function (a, b) { return a.localeCompare(b); });
  filterSkill.innerHTML = '<option value="All">Any skill</option>' +
    skills.map(function (skill) { return '<option value="' + escapeHtml(skill) + '">' + escapeHtml(skill) + "</option>"; }).join("");
  filterSkill.value = skills.includes(current) ? current : "All";
}

// ---- Upcoming deadlines: the next events closing within 7 days (ignores the filters) ----
function createUpcomingHtml(event) {
  const info = getDeadlineInfo(event.deadline);
  return `
    <article class="upcoming-item">
      <div>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="meta">${escapeHtml(event.category)} | ${escapeHtml(event.mode)} | ${escapeHtml(event.deadline)}</p>
      </div>
      <div class="upcoming-side">
        <span class="deadline ${info.cssClass}">${info.text}</span>
        <button class="btn btn-outline btn-small" type="button" data-action="details" data-id="${escapeHtml(event.id)}">View details</button>
      </div>
    </article>`;
}

function renderUpcoming() {
  const soon = getAllEvents().filter(function (event) {
    const daysLeft = getDaysLeft(event.deadline);
    return daysLeft >= 0 && daysLeft <= 7;
  }).sort(compareByDeadline).slice(0, 4);
  upcomingList.innerHTML = soon.length
    ? soon.map(createUpcomingHtml).join("")
    : '<p class="notice">Nothing closes in the next 7 days. Check the full list below.</p>';
}

[filterMode, filterLevel, filterCost, filterSkill, closingSoonInput, hasPrizeInput].forEach(function (control) {
  control.addEventListener("change", renderEvents);
});

searchInput.addEventListener("input", renderEvents);
sortSelect.addEventListener("change", renderEvents);

savedToggle.addEventListener("click", function () {
  showSavedOnly = !showSavedOnly;
  savedToggle.setAttribute("aria-pressed", showSavedOnly);
  renderEvents();
});

categoryFilters.addEventListener("click", function (clickEvent) {
  const button = clickEvent.target.closest(".chip");
  if (!button) return;
  setCategory(button.dataset.category);
  renderEvents();
});

// One listener on the grid handles every card button ("event delegation")
function handleCardClick(clickEvent) {
  const button = clickEvent.target.closest("button");
  if (!button) return;
  if (button.dataset.action === "save") toggleSave(button.dataset.id);
  if (button.dataset.action === "details") openDetails(button.dataset.id);
}
eventGrid.addEventListener("click", handleCardClick);
upcomingList.addEventListener("click", handleCardClick);

document.getElementById("closeModal").addEventListener("click", function () {
  detailsDialog.close();
});
// Clicking the dark area outside the dialog box also closes it
detailsDialog.addEventListener("click", function (clickEvent) {
  const box = detailsDialog.getBoundingClientRect();
  const outside = clickEvent.clientX < box.left || clickEvent.clientX > box.right ||
                  clickEvent.clientY < box.top || clickEvent.clientY > box.bottom;
  if (clickEvent.target === detailsDialog && outside) detailsDialog.close();
});

document.getElementById("addForm").addEventListener("submit", handleFormSubmit);

document.getElementById("themeToggle").addEventListener("click", function () {
  const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  saveText(themeKey, newTheme);
  applyTheme(newTheme);
});

// =====================================================
// 12. START THE APP
// =====================================================
// Use the saved theme, or fall back to the computer's own setting
const savedTheme = loadText(themeKey);
const computerPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : (computerPrefersDark ? "dark" : "light"));
document.getElementById("deadlineInput").min = formatDate(new Date());  // no past dates in the form
populateSkillOptions();
renderEvents();