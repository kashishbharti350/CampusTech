# CampusTech: GitHub issues

28 issues. Upload them all with `node scripts/create-issues.js` (needs the GitHub CLI), or copy them by hand from below.


---

### 1. Modal is too tall on small phones
**Labels:** bug, design

## Why
The details modal now holds details, rounds, tracker, checklist and buttons, so on a 360px-wide phone users must scroll a long way to reach Close.

## Acceptance criteria
- [ ] Close button stays visible (sticky header or footer)
- [ ] Checklist and rounds can be collapsed
- [ ] Tested at 360x640 and 768x1024


---

### 2. Add browser-level automated tests (Playwright)
**Labels:** testing

## Why
Current tests cover pure logic only. Search, filters, modal, saving and theme are verified by hand.

## Acceptance criteria
- [ ] Tests for search + category + sort
- [ ] Tests for save, refresh, saved-only
- [ ] Modal closes with button, backdrop and Esc
- [ ] Runs in CI


---

### 3. Accessibility audit (WCAG 2.2 AA)
**Labels:** accessibility

## Why
Many new interactive parts were added (toasts, modal extras, tracker, bars).

## Acceptance criteria
- [ ] Contrast checked in light and dark themes
- [ ] Screen reader pass (NVDA or VoiceOver) on modal, toasts and forms
- [ ] Focus returns to the opener when the modal closes
- [ ] Dashboard bars have text equivalents
- [ ] Document the results in docs/a11y.md


---

### 4. Keep filters and sort in the URL
**Labels:** enhancement

## Why
Users cannot share or bookmark a filtered view.

## Acceptance criteria
- [ ] Search, category, filters and sort are written to the query string
- [ ] Opening a URL restores the same view
- [ ] Reset filters clears the URL


---

### 5. Export and import my data as JSON
**Labels:** enhancement

## Why
Everything lives in localStorage, so clearing the browser loses it.

## Acceptance criteria
- [ ] Export button downloads one JSON file
- [ ] Import validates data with the existing sanitize functions
- [ ] Clear error message for invalid files


---

### 6. Add a Clear all my data button
**Labels:** enhancement, privacy

## Why
Users should be able to wipe locally stored data.

## Acceptance criteria
- [ ] Confirmation dialog explains what is deleted
- [ ] Removes saved, custom, tracker, checklist, profile, team and theme keys
- [ ] Toast confirms


---

### 7. Move sample data to data/events.json
**Labels:** refactor

## Why
Sample data is hard-coded in events.js. A JSON file is easier to edit and closer to a future API.

## Acceptance criteria
- [ ] Loaded with fetch and a clear loading and error state
- [ ] Works on GitHub Pages
- [ ] README explains that file:// needs Live Server


---

### 8. Pagination or Load more for long lists
**Labels:** performance

## Why
Rendering every card at once will not scale beyond a few hundred listings.

## Acceptance criteria
- [ ] 12 cards per page with a Load more button
- [ ] Result count stays accurate
- [ ] Focus is managed for keyboard users


---

### 9. Friendly error screen if scripts fail to load
**Labels:** robustness

## Why
If a script is missing, the page looks empty with no explanation.

## Acceptance criteria
- [ ] Visible message with a reload tip
- [ ] Console logs the real error


---

### 10. Add ESLint and Prettier
**Labels:** devops

## Why
Keep code style consistent as contributors join.

## Acceptance criteria
- [ ] Config files committed
- [ ] npm run lint passes
- [ ] Lint runs in the GitHub Actions workflow


---

### 11. Set up GitHub Pages deployment notes and badge
**Labels:** documentation

## Why
Make it obvious how to run and see the live demo.

## Acceptance criteria
- [ ] README shows the live URL and a test status badge
- [ ] CONTRIBUTING.md explains branches and pull requests


---

### 12. Organizer profile pages and Follow organizer
**Labels:** enhancement, unstop-parity

## Why
Students follow clubs and companies, not only single events.

## Acceptance criteria
- [ ] Clicking an organizer shows all their listings
- [ ] Follow stores a local list
- [ ] For you shows listings from followed organizers


---

### 13. Gamification: XP, badges and a local leaderboard
**Labels:** enhancement, unstop-parity

## Why
Progress rewards keep students coming back.

## Acceptance criteria
- [ ] XP for saving, tracking, finishing checklists and applying
- [ ] Badges (First Save, Checklist Master, and so on)
- [ ] Leaderboard is labelled local-only until a backend exists


---

### 14. Practice quizzes and mock tests
**Labels:** enhancement, unstop-parity

## Why
Students prepare for contests and placements on the same site.

## Acceptance criteria
- [ ] At least 3 topics with 10 questions each
- [ ] Score summary and review of wrong answers
- [ ] Best scores stored locally


---

### 15. Mentorship listings and request form (demo)
**Labels:** enhancement, unstop-parity

## Why
Mentorship is a core category on competing platforms.

## Acceptance criteria
- [ ] Mentor cards with topics and availability (clearly fictional)
- [ ] Request form with validation
- [ ] Clearly marked demo until a backend exists


---

### 16. Separate Jobs and Internships with stipend and duration
**Labels:** enhancement, unstop-parity

## Why
Career listings need fields that competitions do not.

## Acceptance criteria
- [ ] New fields: stipend, duration, location, skills required
- [ ] Filters for stipend range and duration
- [ ] Add form supports them


---

### 17. Eligibility filters (year, degree, branch)
**Labels:** enhancement, unstop-parity

## Why
Students want only what they are allowed to apply to.

## Acceptance criteria
- [ ] Structured eligibility data instead of free text
- [ ] Filter by year, degree and branch
- [ ] Profile can prefill the filters


---

### 18. Compare up to 3 opportunities side by side
**Labels:** enhancement, unstop-parity

## Why
Helps students choose between similar events.

## Acceptance criteria
- [ ] Compare checkbox on cards
- [ ] Comparison table with prize, team size, deadline, level, cost
- [ ] Accessible table markup


---

### 19. Reminders: browser notifications and bulk calendar export
**Labels:** enhancement, unstop-parity

## Why
Single-event calendar export exists. Students also want reminders for everything they saved.

## Acceptance criteria
- [ ] Export all saved deadlines as one .ics file
- [ ] Optional Notification API reminders 1 day before (works only while the site is open, say so in the UI)


---

### 20. Student profile and printable resume page
**Labels:** enhancement, unstop-parity

## Why
Profiles are central on competing platforms.

## Acceptance criteria
- [ ] Profile form: name, college, skills, links, achievements
- [ ] Print-friendly resume view
- [ ] All data stays local


---

### 21. Trending, Featured and Recently added rows
**Labels:** enhancement, unstop-parity

## Why
Discovery should highlight more than the nearest deadline.

## Acceptance criteria
- [ ] Featured flag on listings
- [ ] Recently added from creation date
- [ ] Rows appear above the main grid


---

### 22. PWA: installable and works offline
**Labels:** enhancement

## Why
Students use phones with weak connections.

## Acceptance criteria
- [ ] Web app manifest and icons
- [ ] Service worker caches the app shell
- [ ] Lighthouse PWA checks pass


---

### 23. Open Graph and SEO meta tags
**Labels:** enhancement

## Why
Shared links should preview nicely.

## Acceptance criteria
- [ ] Title, description and og:image
- [ ] Lighthouse SEO score 90 or higher


---

### 24. Hindi language support (i18n)
**Labels:** enhancement

## Why
Reach more students.

## Acceptance criteria
- [ ] All visible text moved into a translations file
- [ ] Language switcher remembered locally


---

### 25. Accounts and cloud sync (Supabase or Firebase)
**Labels:** backend, unstop-parity

## Why
Everything is per-browser today. Real accounts allow syncing across devices.

## Acceptance criteria
- [ ] Email or Google sign-in
- [ ] Saved events, tracker and profile sync
- [ ] Row-level security so users only see their own data
- [ ] Local mode still works when logged out


---

### 26. Organizer submission and admin approval flow
**Labels:** backend, unstop-parity

## Why
Verified listings are the main trust factor. Fictional sample data must be replaced.

## Acceptance criteria
- [ ] Organizers submit listings with an official link
- [ ] Admins approve or reject
- [ ] Only approved listings are public and show a Verified badge


---

### 27. Real team finder with matching and messaging
**Labels:** backend, unstop-parity

## Why
The current team finder is a local demo that no one else can see.

## Acceptance criteria
- [ ] Posts are shared between users
- [ ] Request-to-join flow
- [ ] Basic abuse reporting


---

### 28. Email or push digests of upcoming deadlines
**Labels:** backend

## Why
Reminders must work when the site is closed.

## Acceptance criteria
- [ ] Opt-in digest with unsubscribe
- [ ] Weekly summary of saved and tracked deadlines
