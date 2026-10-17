// Creates every issue in docs/issues.json on your GitHub repo using the GitHub CLI.
// Setup once:  install https://cli.github.com/  then run  gh auth login
// Preview:     node scripts/create-issues.js --dry-run
// Upload:      node scripts/create-issues.js
const { execFileSync } = require("child_process");
const issues = require("../docs/issues.json");
const dryRun = process.argv.includes("--dry-run");
const colors = { bug: "d73a4a", enhancement: "a2eeef", accessibility: "7057ff", testing: "fbca04", design: "c5def5", backend: "0e8a16",
  "unstop-parity": "5b3df5", documentation: "0075ca", performance: "fef2c0", refactor: "bfdadc", privacy: "e99695", robustness: "f9d0c4", devops: "ededed" };
const wait = function (ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
const gh = function (args) { return execFileSync("gh", args, { encoding: "utf8" }); };  // no shell, so titles cannot inject commands

if (!dryRun) {
  try { gh(["auth", "status"]); } catch (e) { console.error("Run `gh auth login` first."); process.exit(1); }
  Object.keys(colors).forEach(function (name) { gh(["label", "create", name, "--color", colors[name], "--force"]); });
}
issues.forEach(function (issue, i) {
  console.log((i + 1) + "/" + issues.length + "  " + issue.title);
  if (dryRun) return;
  gh(["issue", "create", "--title", issue.title, "--body", issue.body, "--label", issue.labels.join(",")]);
  wait(1500);  // gentle on GitHub's rate limits
});
console.log(dryRun ? "Dry run only. Nothing was created." : "Done. Open the Issues tab on GitHub.");
