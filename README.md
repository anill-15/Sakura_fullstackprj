# SkillNest

> Online training and technical skill development platform
> Academic SDC Full Stack Development Project

Built with **HTML5, CSS3, Vanilla JavaScript and Browser LocalStorage only.**
No framework, no backend, no database, no build tool, no npm dependency.

---

## 1. Project Overview

SkillNest is a static web application that lets people discover, register for and track
technical training sessions. It has two clearly separated modules:

* a **User (Learner) Module** for browsing events, registering, cancelling and managing a profile
* an **Admin Module** for platform statistics, user management, event CRUD and registration management

All data is stored in the browser using `localStorage`, which makes the project trivial to run,
demonstrate and explain during an academic review.

---

## 2. Problem Statement

Technical learners (students, teachers, working professionals and lifelong learners) need a
simple way to find upcoming training sessions, understand the schedule of each session and
reserve a seat without dealing with complex software. Institutes that run such sessions need
an equally simple way to publish events and know who registered for what.

SkillNest solves this by providing:

* a landing page that explains the platform and shows upcoming sessions
* signup / login with role based redirection
* a learner dashboard, event catalogue, registration management and profile management
* an administrator console with statistics, complete event CRUD, user management and a
  platform-wide registration overview

Because this is an academic project, all of the above is implemented in the browser only. There is
no server, so the data lives in the browser's LocalStorage.

---

## 3. Aim

To design and develop a complete, responsive and easy-to-demonstrate web application for online
technical training sessions using only HTML, CSS and JavaScript, while correctly implementing
role based access control, data validation and complete CRUD operations on browser storage.

---

## 4. Scope

**In scope**

* Landing page with dynamic upcoming events
* Signup, login, logout and session handling
* Learner module: dashboard, event catalogue, registrations, profile
* Admin module: dashboard, event manager (CRUD), user manager, registration manager
* Validation for every form
* Toast notifications and confirmation dialogs
* Responsive design from 320px mobile to large desktop screens
* Accessibility basics (labels, semantic HTML, keyboard focus, alt text)

**Out of scope (explicitly)**

* Backend API, server-side database and server-side authentication
* Payments, email/SMS notifications and video conferencing integration
* Certificates, reporting exports and analytics dashboards

---

## 5. Target Audience

| Audience | What they get |
| --- | --- |
| Students | Project-ready skills and structured session schedules |
| Teachers & mentors | A ready platform to publish workshops and track attendance |
| Working professionals | Evening / weekend upskilling without leaving their job |
| Lifelong learners | Short, focused sessions on emerging technologies |
| Academic enthusiasts | A complete, explainable demo project |
| Career switchers | In-demand technical skills in a scheduled format |

---

## 6. Modules

### Admin Module

* **Dashboard** – total users, total events, total registrations, upcoming events, completed
  events, seat occupancy, recent registrations, popular sessions and quick actions
* **Event Manager (CRUD)** – create, read, update and delete training events with search,
  category filter and status filter
* **User Manager** – list all users, view full user details and registration history, delete
  learners (administrators are protected)
* **Registration Manager** – every registration with search and filters by event, user and
  status, plus the ability to release a seat

### User Module

* **Dashboard** – welcome message, available events, upcoming / ongoing / completed registration
  statistics, next sessions and quick actions
* **Training Events** – full catalogue with search, category filter, status filter, seat
  availability and one-click registration
* **My Registrations** – active registrations with cancellation, plus registration history
* **My Profile** – view and edit name and phone, change password, read-only email, role and
  account creation date

### Event Manager / Event Schedule

The event object carries its own schedule: `date`, `startTime`, `endTime`, `duration`, `mode`
and `venueOrLink`. Status is calculated automatically:

| Condition | Status |
| --- | --- |
| Stored status is `cancelled` | Cancelled |
| Now is after the end of the event day | Completed |
| Now is inside the event day | Ongoing |
| Otherwise | Upcoming |

### Authentication

`js/auth.js` implements `signup()`, `login()`, `logout()`, `requireLogin()`, `requireAdmin()`,
`getLoggedInUser()` and `isLoggedIn()` on top of LocalStorage. Every module page runs a guard
before rendering, so hiding buttons is never the only protection.

---

## 7. Features

**Landing page**

* Responsive navbar with mobile menu
* Hero section with calls to action and live platform counters
* Features, training categories (generated from stored events), upcoming events preview,
  target audience, how it works, call-to-action band and footer

**Authentication**

* Signup with full name, email, phone, password and confirm password
* Field level validation, unique email check, password rules and password confirmation
* Login with role based redirection and clear error messages
* Show/hide password controls and one-click demo credential filling
* Session stored in `yge_currentUser`, cleared on logout

**Learner**

* Event catalogue with search + category + status filters
* Registration rules: must be logged in, no duplicates, no registration for cancelled or
  completed events, capacity enforced
* Live seat counter update after registering or cancelling
* Registration list with cancellation (only for upcoming events) and a history section
* Profile editing (name, phone), password change, read-only role and email

**Admin**

* Real calculated dashboard statistics
* Full event CRUD with validation (required fields, start time before end time, capacity >= 1)
* Deleting an event also removes its registrations
* User list with search and role filter, user detail modal, protected administrator account
* Registration list with search, event filter, user filter, status filter and cancel action

**Interface**

* CSS Grid and Flexbox layouts, CSS custom properties, cards, shadows, badges, tables
* Reusable toast system (success / error / warning / info) and a promise based confirmation modal
* Empty states for every list
* Accessible labels, semantic landmarks, `aria-current`, `aria-live` and visible focus rings

---

## 8. Technology Stack

| Layer | Technology |
| --- | --- |
| Structure | HTML5 (semantic elements, no templating) |
| Styling | CSS3 - custom properties, CSS Grid, Flexbox, media queries |
| Behaviour | Vanilla JavaScript (ECMAScript 2015+): `const`/`let`, arrow functions, template-free string building, `Array` methods, `FormData`, events |
| Persistence | Browser LocalStorage (keys: `yge_users`, `yge_events`, `yge_registrations`, `yge_currentUser`) |
| Build tools | None |
| Dependencies | None - no npm, no package manager, no bundler |

**Not used:** React, Vite, Node.js, Express, MongoDB, MySQL, Firebase, Bootstrap, Tailwind,
jQuery, Angular, Vue, TypeScript, any frontend framework, any backend, any database.

---

## 9. System Architecture

```
                 +-----------------------+
                 |       User            |
                 +-----------+-----------+
                             |
                             v
                 +-----------+-----------+
                 |  Login / Signup       |   js/auth.js
                 |  (LocalStorage)       |
                 +-----------+-----------+
                             |
                             v
                 +-----------+-----------+
                 |    yge_currentUser    |   js/storage.js
                 |  + role based check    |
                 +-----+-----------+-----+
                       |           |
          role=user   |           |   role=admin
                       v           v
        +--------------+--+     +--+---------------+
        |  User Module   |     |   Admin Module   |
        |  dashboard     |     |   dashboard     |
        |  events        |     |   events (CRUD) |
        |  registrations |     |   users         |
        |  profile       |     |   registrations |
        +----------------+     +----------------+
                       \           /
                        v         v
                 +-----------------------+
                 |      LocalStorage     |
                 |  yge_users           |
                 |  yge_events          |
                 |  yge_registrations   |
                 +-----------------------+
```

Navigation between modules happens in JavaScript: `js/navigation.js` resolves the page depth
from the loaded script paths, guards the current route and rewrites every internal link so
`../` paths can never break.

---

## 10. Module Diagram

```
SkillNest
├── Authentication
│   ├── Signup (js/auth.js)
│   ├── Login  (js/auth.js)
│   ├── Logout (js/navigation.js)
│   └── Guards (requireLogin / requireAdmin)
├── User Module
│   ├── Dashboard      user/dashboard.html
│   ├── Events         user/events.html
│   ├── Registrations  user/registrations.html
│   └── Profile        user/profile.html
├── Admin Module
│   ├── Dashboard               admin/dashboard.html
│   ├── Event Manager (CRUD)    admin/events.html
│   ├── User Manager            admin/users.html
│   └── Registration Manager    admin/registrations.html
└── LocalStorage
    ├── yge_users          (js/storage.js)
    ├── yge_events         (js/events.js)
    ├── yge_registrations  (js/events.js)
    └── yge_currentUser    (js/auth.js)
```

File map:

```
SkillNest/
├── index.html          landing page
├── login.html          login + demo credentials
├── signup.html         registration
├── user/               learner module (4 pages)
├── admin/              administrator module (4 pages)
├── css/
│   ├── style.css       tokens, base, components, landing page
│   ├── auth.css        signup / login layout
│   ├── dashboard.css   module shell, sidebar, cards
│   ├── admin.css       administrator console
│   └── responsive.css  breakpoints + print + reduced motion
├── js/
│   ├── storage.js      LocalStorage layer + seed data + init
│   ├── auth.js         signup, login, logout, guards, profile, password
│   ├── navigation.js   role based redirection, sidebar, relative links
│   ├── events.js       event CRUD, status, registration rules, renderers
│   ├── user.js         learner module logic + landing page rendering
│   ├── admin.js        administrator module logic
│   └── ui.js           toasts, modal, formatting, form helpers
├── assets/images/      logo, favicon, hero illustration, placeholders
├── README.md
└── .gitignore
```

---

## 11. Data Model

### `yge_users` – array of user objects

```json
{
  "id": "USR001",
  "name": "YGE Administrator",
  "email": "admin@ygeupskill.com",
  "phone": "+91 90000 00001",
  "password": "Admin@123",
  "role": "admin",
  "createdAt": "2025-01-06T09:00:00.000Z"
}
```

`role` is either `user` or `admin`. It is set once at signup and can never be edited from the UI.
The default administrator (`admin@ygeupskill.com`) is created automatically on first load and is
protected from deletion.

### `yge_events` – array of event objects

```json
{
  "id": "EVT001",
  "title": "Full Stack Web Development",
  "description": "Build complete web applications from scratch ...",
  "category": "Web Development",
  "trainer": "Aarav Mehta",
  "date": "2025-06-12",
  "startTime": "10:00",
  "endTime": "13:00",
  "duration": "3 hours",
  "mode": "Online",
  "venueOrLink": "https://meet.ygeupskill.com/fullstack",
  "maxParticipants": 40,
  "status": "upcoming",
  "createdAt": "2025-05-20T10:00:00.000Z"
}
```

### `yge_registrations` – array of registration objects

Starts as an **empty array** on a clean browser; each record created through the UI has this shape:

```json
{
  "id": "REG001",
  "userId": "USR002",
  "userName": "Test Student",
  "userEmail": "student@example.com",
  "eventId": "EVT006",
  "eventTitle": "Git and GitHub for Beginners",
  "eventDate": "2025-06-03",
  "status": "confirmed",
  "registeredAt": "2025-05-30T09:15:00.000Z",
  "cancelledAt": null
}
```

`status` is `confirmed`, `cancelled` or `event_removed`. A cancelled or removed record never
occupies a seat, which is why `getAvailableSeats()` only counts confirmed records. Deleting an event
marks its registrations `event_removed` instead of deleting them, so the learner's history and the
admin registration manager stay accurate.

### `yge_currentUser` – single object (session)

```json
{ "id": "USR002", "name": "Test Student", "email": "student@example.com", "role": "user" }
```

The password is never copied into the session. On every guarded page the session is validated
against `yge_users`; if the account no longer exists the session is cleared.

### Initialisation rules

`js/storage.js` runs `init()` on every page load:

1. Create the default administrator if it does not exist.
2. Create the sample events **only if** `yge_events` is missing.
3. Create an empty `yge_registrations` array **only if** that key is missing.
4. Refresh the cached `eventTitle` / `eventDate` on registrations.

Existing data is never overwritten.

---

## 12. Authentication Flow

**Signup**

1. User opens `signup.html`.
2. `auth.validateSignup()` checks: name present and letters only, valid and **unique** email,
   valid phone, password of at least 6 characters and a matching confirmation.
3. Errors are shown inline under each field plus a toast notification.
4. On success a user object with a generated `USRxxx` id and `role: "user"` is pushed into
   `yge_users` and the page redirects to `login.html?success=...`.

**Login**

1. User opens `login.html`.
2. `auth.login(email, password)` looks the user up in `yge_users` (case-insensitive email).
3. Wrong credentials return `Invalid email or password.`
4. On success a session object is written to `yge_currentUser`.
5. `auth.homeFor(user)` decides the destination: `admin/dashboard.html` or `user/dashboard.html`.

**Logout** clears `yge_currentUser` and returns to `login.html` with a success message.

**Guards** – every module page calls `navigation.guard('user' | 'admin' | 'guest')` before
rendering. Opening a protected page directly in the address bar is therefore not enough to
bypass anything.

---

## 13. Navigation Flow

```
Login
 ├── role === "admin"  -> admin/dashboard.html
 └── role === "user"   -> user/dashboard.html

user/dashboard.html  -> user/events.html, user/registrations.html, user/profile.html
admin/dashboard.html -> admin/events.html, admin/users.html, admin/registrations.html

Any protected page while logged out      -> login.html
admin/* while logged in as a user        -> user/dashboard.html (toast explains why)
user/*  while logged in as an admin      -> admin/dashboard.html
login.html / signup.html while logged in -> role home
```

Internal links are written once as `data-nav="user/events.html"` and converted to the correct
relative path at runtime by `navigation.applyRelativeLinks()`, so root, `user/` and `admin/`
pages can never produce a broken `../` path.

---

## 14. Event Registration Flow

1. The learner opens `user/events.html` and filters the catalogue (search / category / status).
2. `events.canRegister(eventId, user)` checks, in order: event exists, user is logged in, event
   is not cancelled, event is not completed, the user is not already registered, and the event
   is not full.
3. `events.registerForEvent(eventId, userId)` creates a `REGxxx` record with the event title and
   date cached for reporting, and writes it to `yge_registrations`.
4. The card switches to a "Registered" state, the seat counter is recalculated and a success
   toast is shown.
5. In `user/registrations.html` the learner can cancel an **upcoming** registration. The record
   is marked `cancelled`, the seat is released and the counters are refreshed. Completed events
   cannot be cancelled.
6. Deleting an event as administrator removes its registrations too, so no broken record remains.

---

## 15. How to Run

This is a **static** application. There is nothing to install and no `npm` command is required.

**Option 1 – open directly**

Double click `index.html`, or drag it into a browser window. Then navigate to `login.html`
using the buttons on the page.

**Option 2 – VS Code Live Server (recommended)**

1. Open the project folder in VS Code.
2. Install the *Live Server* extension.
3. Right click `index.html` → **Open with Live Server**.
4. The browser opens at `http://127.0.0.1:5500/index.html`.

> Tip: use the *Clear site data* option in the browser (or the browser console command
> `localStorage.clear()`) to reset the demo to its original state.

---

## 16. Demo Credentials

**Administrator**

```
Email:    admin@ygeupskill.com
Password: Admin@123
```

Created automatically on first load. Cannot be deleted and cannot be replaced.

**Learner (created through signup)**

```
Email:    student@example.com
Password: Student@123
```

Learner accounts are deliberately **not** pre-seeded, so the documented signup test can create
`student@example.com` on a clean browser. Create it from `signup.html` (or use any other email).

---

## 17. SDC Requirement Compliance

| # | Requirement | Implementation | Status |
| --- | --- | --- | --- |
| 1 | Clearly understand and implement the problem statement | Landing page, learner module and admin module cover every capability described in the problem statement: register, login, browse events, view schedules, register for events, view registrations, manage profile, admin statistics, user management, event CRUD, registration overview | **Implemented** |
| 2 | Identify the business system and required modules | Admin Module, User Module and the Event Manager / Event Schedule are separated in `README.md` (section 6), in the file structure and in the code (`js/user.js`, `js/admin.js`, `js/events.js`) | **Implemented** |
| 3 | Develop using only HTML, CSS and JavaScript | 11 HTML pages, 5 CSS files and 7 JS files. No React, Vite, Node, Express, database, Bootstrap, Tailwind, jQuery, TypeScript, npm package or build step | **Implemented** |
| 4 | UI must use CSS Grid and CSS Flexbox | Grid is used for hero, features, categories, stat grids, event grids, tables layout, footer, auth layout, detail grids and form grids; Flexbox is used for navbars, buttons, badges, cards, stat cards, registration cards, toasts, modals and every toolbar | **Implemented** |
| 5 | Implement signup and login using LocalStorage | `js/auth.js` `signup()` and `login()` write to / read from `yge_users` and `yge_currentUser`; no cookies, no backend authentication | **Implemented** |
| 6 | Module-wise redirection / navigation using JavaScript | `js/navigation.js` `guard()`, `homeFor()`, `logout()`, `mountShell()` and `applyRelativeLinks()`; role based redirects documented in section 13 | **Implemented** |
| 7 | All identified modules and major functionality must work properly | Signup, login, logout, guards, event CRUD, registration rules, cancellation, profile update, password change, user management and registration management are all wired to real LocalStorage actions | **Implemented** |
| 8 | Project must be GitHub-ready | Clean folder structure, `.gitignore`, professional `README.md` with diagrams, tables and a demo script, no build artefacts or node_modules | **Implemented** |
| 9 | Project must be easy to demonstrate and explain | One-click demo account filling, seeded realistic data, a documented 13 step demo flow (section 20) and an academic-friendly module structure | **Implemented** |

---

## 18. Design Thinking

The project was shaped with three standard design thinking tools during requirement analysis.
No fabricated results are presented – the tables below record the *questions asked* and the
*decisions taken*, not invented survey statistics.

### 18.1 Mind Map

Central node: **"Learner cannot find a trustworthy training session"**

| Branch | Question asked | Decision taken in the application |
| --- | --- | --- |
| Discovery | How does a learner find sessions? | Landing page with a dynamic upcoming-events preview and a category overview |
| Trust | How do I know the session is real? | Trainer, mode, venue / meeting link, duration and seat count on every card |
| Action | How hard is it to reserve a seat? | One-click register with immediate feedback and a live seat counter |
| Commitment | What if my plans change? | Cancellation allowed for upcoming events, with a history section |
| Control | Can I correct my own mistakes? | Profile editing for name and phone, plus a password change form |
| Administration | How are events maintained? | Admin event manager with full CRUD, validation and confirmation dialogs |

### 18.2 Customer Journey

| Stage | Learner goal | Pain point addressed | Touchpoint in the app |
| --- | --- | --- | --- |
| Awareness | Understand what the platform offers | Generic course sites are confusing | Hero, features, categories, "how it works" |
| Consideration | Judge quality and relevance | Too much noise, unclear schedule | Trainer, date, time, duration, mode, seats, status |
| Sign-up | Create an account quickly | Long forms and unclear validation | 5-field signup with inline validation and unique email check |
| Activation | Reserve the first seat | Confusing multi-step flows | One-click register, duplicate protection, instant toast |
| Retention | Know what is next | Forgetting sessions | Dashboard with next sessions and filters |
| Support | Fix account details | Locked out of a profile | Profile edit and password change |
| Advocacy | Recommend the platform | Nothing to share | Simple, fast, dependency-free web app |

Administrator journey: sign in → read statistics → create an event → monitor registrations →
clean up records (delete event / user / registration) when needed.

### 18.3 Survey / Poll (planned requirement gathering)

A short poll is designed to be run with the target audience **before** development, to validate
these assumptions. The actual responses are intentionally not fabricated here.

| Planned question | Options | Assumption being tested |
| --- | --- | --- |
| What information do you need before joining a session? | Trainer / Schedule / Topic / Mode | Trainer and schedule are the top two |
| What blocks you from learning a new skill? | Lack of time / Cost / Finding quality content / Irrelevant content | Finding quality content is the top blocker |
| How do you prefer to attend sessions? | Live online / In person / Recorded | Live online is the majority preference |
| What should the platform show after registering? | Upcoming reminders / Completed history / Certificate | History matters more than certificates at this stage |

Once responses exist, the results would be compared against the implemented feature set
(landing page, filters, registration tracking, cancellation and history) to decide the next
iteration.

---

## 19. Future Enhancements

These are **not** current dependencies. The application runs entirely in the browser today.

* Backend API and a real database (Node.js + Express + SQL) instead of LocalStorage
* Email / SMS notifications for confirmation, reminders and cancellations
* Video conferencing integration with generated meeting links
* Certificate generation for completed sessions
* Advanced analytics (attendance trends, category popularity, exportable reports)
* Real authentication with hashed passwords, sessions and password reset
* Cloud deployment and a public demo URL
* Progressive Web App support for offline use
* Dark mode and additional language options

---

## 20. Demonstration Flow

A complete, repeatable demo (approx. 5 minutes).

1. **Landing page** – open `index.html`. Show the hero, the live counters, the generated category
   grid and the three upcoming event cards rendered from LocalStorage. Open the browser console
   and run `JSON.parse(localStorage.yge_events).length` to prove the data is real.
2. **Signup** – click *Create a free account*, enter
   Name `Test Student`, Email `student@example.com`, Password `Student@123`,
   Confirm `Student@123`. Submit. Show the inline success message and the redirect to login.
3. **Duplicate email check** – try signing up with `student@example.com` again and show the
   "already registered" validation message.
4. **Login as learner** – login with `student@example.com` / `Student@123`. Show the redirect to
   `user/dashboard.html` and the calculated statistics.
5. **Browse events** – open *Training Events*. Search "Python", filter by category and status to
   demonstrate the filters.
6. **Register** – click *Register Now* on an upcoming event. Show the success toast, the seat
   counter decreasing and the button changing to "Registered".
7. **Duplicate prevention** – try to register for the same event again through another card
   filter view and show the "already registered" warning.
8. **Capacity** – set a tiny capacity in the admin console (or open an almost full event) to show
   the "Event is full" state.
9. **My Registrations** – open the registrations page, cancel an upcoming registration and show
   the confirmation dialog, the seat release and the entry moving to history.
10. **Profile** – open *My Profile*, update the phone number and change the password. Show that
    email and role are read-only.
11. **Logout** – click *Logout* and show that `yge_currentUser` is cleared and login is required
    again.
12. **Admin login** – login with `admin@ygeupskill.com` / `Admin@123`. Show the redirect to
    `admin/dashboard.html` and the real statistics.
13. **Admin CRUD** – create an event, verify it appears in the learner catalogue, edit it, view
its registrations and delete it. Show the confirmation dialog and that its registrations are
     flagged `Event Removed` (and the freed seats no longer count).
14. **User manager** – search for a learner, open the user details modal, delete a learner and
    show that the administrator row's Delete button is disabled.
15. **Registration manager** – filter registrations by event, by user and by status.
16. **Role protection** – log in as the learner again and try opening
    `admin/dashboard.html` directly in the address bar. Show the toast and the redirect back to
    the learner dashboard.
17. **Responsive demo** – shrink the browser width (or use device emulation) to show the mobile
    navbar, the collapsing sidebar and the table-to-card transformation.

---

## License

Academic project. Provided for educational and evaluation purposes.

**SkillNest** – SDC Full Stack Development Project
