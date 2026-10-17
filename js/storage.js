// js/storage.js: everything that touches localStorage lives here.
// Every call is wrapped in try/catch because browsers can block storage
// (private mode, strict settings). Without this, one error would stop the whole app.
const savedKey = "campustech-saved";
const customKey = "campustech-custom";
const themeKey = "campustech-theme";
const profileKey = "campustech-profile";
const trackerKey = "campustech-tracker";
const checksKey = "campustech-checks";
const teamsKey = "campustech-teams";
let storageWarningShown = false;

// Read a plain object (not a list). Anything broken becomes {}.
function loadObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch (error) {
    return {};
  }
}

// Read a list (array) from storage. Anything broken becomes an empty list.
function loadFromStorage(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function loadText(key) {
  try { return localStorage.getItem(key); } catch (error) { return null; }
}

// Returns true if saved, false if the browser refused.
function saveText(key, text) {
  try {
    localStorage.setItem(key, text);
    return true;
  } catch (error) {
    if (!storageWarningShown && typeof showToast === "function") {
      storageWarningShown = true;
      showToast("Your browser is blocking storage, so changes will be lost when you close this tab.", "error");
    }
    return false;
  }
}

function saveToStorage(key, value) {
  return saveText(key, JSON.stringify(value));
}
