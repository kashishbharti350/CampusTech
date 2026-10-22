# CampusTech: Discover. Build. Compete.

A responsive web app that helps students find hackathons, coding contests, workshops and internships in one place. Built with plain HTML, CSS and JavaScript. No framework, no build step, no backend.

> **All sample opportunities are fictional demo data.** They have no application links and must not be treated as real events. Statuses, levels and costs on them are made up.

## Features

**Discovery:** search (title, category, skills, description), category chips, filters for mode, level, free/paid, skill, closing within 7 days and hide expired, sorting, reset filters, deadline countdowns, registration status, an upcoming-deadlines section, details modal, add your own opportunity (validated), organizer, prize, team size and rounds on each listing, prize filter and sort, add-deadline-to-calendar (.ics), and "did you mean" help for skill typos.

**Student tools:** interests and recommendations ("why recommended"), application tracker, per-event preparation checklist, share button, team finder, learning resources, statistics dashboard, light and dark themes, toast messages.

## What works locally vs. what needs a backend

| Works in the browser (localStorage, this device only) | Needs a backend (not included) |
|---|---|
| Saved events, your added events, theme | User accounts and login |
| Interests, recommendations, tracker, checklists | Syncing data between devices |
| Team requests you post | Team requests visible to other students, real matching, messaging |
| Share (device share sheet or copy to clipboard) | Verified live event data and registration links |

## Project structure

```text
CampusTech/
├── index.html
├── css/style.css
├── js/
│   ├── events.js     sample data, date, validation and filter helpers
│   ├── features.js   recommendations, checklist, stats, team rules, resources
│   ├── storage.js    all localStorage code (safe if the browser blocks it)
│   ├── app.js        discovery page: render, filters, modal, form, theme
│   └── student.js    interests, tracker, teams, resources, dashboard
├── tests/logic.test.js
├── docs/             issues.json and ISSUES.md (the GitHub issue list)
├── scripts/create-issues.js
├── .github/          issue templates and the test workflow
├── package.json
└── README.md
```

## Upload the issues to GitHub

Install the [GitHub CLI](https://cli.github.com/), run `gh auth login`, then from the project folder: `node scripts/create-issues.js --dry-run` to preview and `node scripts/create-issues.js` to create them.

## Run it

1. Open the folder in VS Code.
2. Right-click `index.html`, choose **Open with Live Server** (or just double-click the file).
3. Run the tests (needs Node.js): `node tests/logic.test.js` or `npm test`.

## Publish on GitHub and deploy (free)

```bash
git init                      # skip if the folder already has a .git folder
git add .
git commit -m "CampusTech: complete app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/CampusTech.git
git push -u origin main
```

Then on GitHub: **Settings > Pages > Build and deployment > Deploy from a branch > main / (root) > Save**. After a minute your site is live at `https://YOUR-USERNAME.github.io/CampusTech/`. Alternatively drag the folder onto Netlify Drop, or import the repo in Vercel (no build command, output directory `.`).

## Manual test checklist

| Do this | Expect |
|---|---|
| Open the page | 8 cards, upcoming section with events closing within 7 days |
| Category + search, then change sort | Results stay filtered; expired events sort last |
| Search `zzzz` | Empty state with Reset filters |
| Save a card, refresh | Still saved; counts match |
| Open a card: Esc, Close button, click outside | Modal closes each way |
| Choose an interest, press Update | Up to 3 recommendations with reasons; none expired |
| In a modal set status and tick checklist items | Tracker section and dashboard update |
| Press Share | Share sheet or "Copied" toast |
| Post a team request with a 1-letter name | Error message; nothing saved |
| Toggle dark theme, refresh | Theme remembered |
| Add an event with a past date | Error: deadline cannot be in the past |
| Resize to phone width | Single column, nav wraps, no sideways scrolling |

## Known limitations

localStorage is per browser and can be cleared by the user. Sample deadlines are generated relative to today's date so the demo always looks alive. Resource links point to well-known sites but should be checked before relying on them.

## Author

**Kashish Bharti**, Student Developer | Electronics and Communication Engineering(2nd yr)
