/* =============================================================
   SkillNest - js/storage.js
   Centralised LocalStorage data layer + first-run initialisation.
   Plain JavaScript (ES2015+). No frameworks, no backend.
   ============================================================= */
(function (global) {
  'use strict';

  /* ---------------- Storage keys ---------------- */
  const KEYS = {
    users: 'yge_users',
    events: 'yge_events',
    registrations: 'yge_registrations',
    currentUser: 'yge_currentUser',
    seeded: 'yge_initialised'
  };

  /* ---------------- Safe localStorage access ---------------- */
  const isLocalStorageAvailable = () => {
    try {
      const probe = '__yge_probe__';
      global.localStorage.setItem(probe, '1');
      global.localStorage.removeItem(probe);
      return true;
    } catch (err) {
      return false;
    }
  };

  const AVAILABLE = isLocalStorageAvailable();

  const memoryStore = Object.create(null);

  const rawGet = (key) => (AVAILABLE ? global.localStorage.getItem(key) : key in memoryStore ? memoryStore[key] : null);
  const rawSet = (key, value) => {
    if (AVAILABLE) global.localStorage.setItem(key, value);
    else memoryStore[key] = value;
  };
  const rawRemove = (key) => {
    if (AVAILABLE) global.localStorage.removeItem(key);
    else delete memoryStore[key];
  };

  const readJson = (key, fallback) => {
    const raw = rawGet(key);
    if (raw === null || raw === undefined || raw === '') return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (err) {
      console.warn('[YGE] Corrupt data found for key "' + key + '". Resetting to default.');
      return fallback;
    }
  };

  const writeJson = (key, value) => rawSet(key, JSON.stringify(value));

  /* ---------------- Date helpers ---------------- */
  const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
  const pad = (n) => String(n).padStart(2, '0');

  const dayOffset = (days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  const timeOffset = (hours) => {
    const d = new Date();
    d.setHours(d.getHours() + hours, 0, 0, 0);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  const dayTimeOffset = (days, hours) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours, 0, 0, 0);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  const nowIso = () => new Date().toISOString();

  /* ---------------- ID helpers ---------------- */
  const nextId = (prefix, existing) => {
    let max = 0;
    existing.forEach((item) => {
      if (!item || typeof item.id !== 'string') return;
      const match = item.id.match(/(\d+)\s*$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    });
    return prefix + String(max + 1).padStart(3, '0');
  };

  /* =============================================================
     Seed data
     ============================================================= */
  const DEFAULT_ADMIN = {
    id: 'USR001',
    name: 'YGE Administrator',
    email: 'admin@ygeupskill.com',
    phone: '+91 90000 00001',
    password: 'Admin@123',
    role: 'admin',
    createdAt: '2025-01-06T09:00:00.000Z'
  };

  /* Documented test-learner credentials. The account is intentionally NOT
     seeded: the signup test must be able to create student@example.com. */
  const DEMO_USER_CREDENTIALS = {
    name: 'Test Student',
    email: 'student@example.com',
    password: 'Student@123'
  };

  const SAMPLE_EVENTS = [
    {
      id: 'EVT001',
      title: 'Full Stack Web Development',
      description:
        'Build complete web applications from scratch. Learn HTML5 structure, modern CSS layouts with Grid and Flexbox, vanilla JavaScript fundamentals, DOM manipulation, forms and validation, and browser storage techniques. Includes a mini project to publish a personal portfolio website.',
      category: 'Web Development',
      trainer: 'Aarav Mehta',
      date: dayOffset(12),
      startTime: '10:00',
      endTime: '13:00',
      duration: '3 hours',
      mode: 'Online',
      venueOrLink: 'https://meet.ygeupskill.com/fullstack',
      maxParticipants: 40,
      status: 'upcoming',
      createdAt: dayTimeOffset(-14, -3)
    },
    {
      id: 'EVT002',
      title: 'JavaScript Essentials',
      description:
        'Strengthen your JavaScript foundation. Covers variables, functions, arrays, objects, ES6 features like arrow functions, template literals and destructuring, plus an introduction to asynchronous programming with promises and event handling.',
      category: 'Programming',
      trainer: 'Priya Nair',
      date: dayOffset(5),
      startTime: '15:00',
      endTime: '17:00',
      duration: '2 hours',
      mode: 'Online',
      venueOrLink: 'https://meet.ygeupskill.com/js-essentials',
      maxParticipants: 60,
      status: 'upcoming',
      createdAt: dayTimeOffset(-12, -1)
    },
    {
      id: 'EVT003',
      title: 'Python Programming',
      description:
        'Start programming with Python. Understand variables, data types, conditions, loops, functions, lists and dictionaries. Practise with small exercises and finish by writing a command line student record application.',
      category: 'Programming',
      trainer: 'Rahul Verma',
      date: dayOffset(20),
      startTime: '09:30',
      endTime: '12:30',
      duration: '3 hours',
      mode: 'Offline',
      venueOrLink: 'YGE Campus, Lab 3, Block B',
      maxParticipants: 35,
      status: 'upcoming',
      createdAt: dayTimeOffset(-11, -4)
    },
    {
      id: 'EVT004',
      title: 'Data Analytics with Spreadsheets and SQL',
      description:
        'Turn raw data into decisions. Clean datasets, build pivot tables, create meaningful charts and answer business questions using SQL queries such as SELECT, JOIN, GROUP BY and HAVING with guided practice datasets.',
      category: 'Data Science',
      trainer: 'Sneha Kulkarni',
      date: dayOffset(27),
      startTime: '11:00',
      endTime: '14:00',
      duration: '3 hours',
      mode: 'Online',
      venueOrLink: 'https://meet.ygeupskill.com/data-analytics',
      maxParticipants: 30,
      status: 'upcoming',
      createdAt: dayTimeOffset(-10, -2)
    },
    {
      id: 'EVT005',
      title: 'UI/UX Fundamentals',
      description:
        'Design interfaces people enjoy using. Learn about colour contrast, typography, spacing systems, user flows, wireframing, accessibility and design thinking. Includes hands-on redesign of an existing web page.',
      category: 'Design',
      trainer: 'Ishita Bansal',
      date: dayOffset(9),
      startTime: '13:00',
      endTime: '15:00',
      duration: '2 hours',
      mode: 'Offline',
      venueOrLink: 'YGE Design Studio, Room 12',
      maxParticipants: 25,
      status: 'upcoming',
      createdAt: dayTimeOffset(-9, -5)
    },
    {
      id: 'EVT006',
      title: 'Git and GitHub for Beginners',
      description:
        'Version control without the fear. Init a repository, stage and commit changes, branch and merge, resolve simple conflicts, and publish projects on GitHub. Designed for first time users of Git.',
      category: 'Tools & DevOps',
      trainer: 'Karan Shah',
      date: dayOffset(3),
      startTime: '18:00',
      endTime: '20:00',
      duration: '2 hours',
      mode: 'Online',
      venueOrLink: 'https://meet.ygeupskill.com/git-github',
      maxParticipants: 50,
      status: 'upcoming',
      createdAt: dayTimeOffset(-8, -6)
    },
    {
      id: 'EVT007',
      title: 'Artificial Intelligence Basics',
      description:
        'Understand what AI really means. Explore problem definition, data collection, intelligent agents, search algorithms, knowledge representation and the difference between AI, machine learning and deep learning.',
      category: 'AI & ML',
      trainer: 'Dr. Meera Iyer',
      date: dayOffset(-6),
      startTime: '10:00',
      endTime: '12:00',
      duration: '2 hours',
      mode: 'Online',
      venueOrLink: 'https://meet.ygeupskill.com/ai-basics',
      maxParticipants: 80,
      status: 'upcoming',
      createdAt: dayTimeOffset(-30, -2)
    },
    {
      id: 'EVT008',
      title: 'Machine Learning Fundamentals',
      description:
        'Supervised and unsupervised learning explained simply. Regression, classification, decision trees, k-means clustering, train-test splits, overfitting, accuracy metrics and model evaluation using simple datasets.',
      category: 'AI & ML',
      trainer: 'Dr. Meera Iyer',
      date: dayOffset(-20),
      startTime: '14:00',
      endTime: '17:00',
      duration: '3 hours',
      mode: 'Offline',
      venueOrLink: 'YGE Campus, Innovation Lab',
      maxParticipants: 24,
      status: 'upcoming',
      createdAt: dayTimeOffset(-45, -4)
    }
  ];

  /* Seeded so the demo always has something to show, while every
     stored record still follows the required event schema. */
  const buildSeedEvents = () => {
    const events = SAMPLE_EVENTS.map((event) => Object.assign({}, event));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = (event) => new Date(event.date + 'T23:59:59') < today;

    return events.map((event) => {
      const seedPast = isPast(event);
      const name = event.title.toLowerCase();
      if (seedPast && (name.includes('artificial intelligence') || name.includes('machine learning'))) {
        return Object.assign({}, event, { status: 'completed' });
      }
      if (seedPast && name.includes('javascript')) {
        return Object.assign({}, event, { status: 'ongoing' });
      }
      if (seedPast && name.includes('full stack')) {
        return Object.assign({}, event, { status: 'upcoming', date: dayOffset(11) });
      }
      if (seedPast && name.includes('python')) {
        return Object.assign({}, event, { status: 'upcoming', date: dayOffset(20) });
      }
      return event;
    });
  };


  /* Registrations keep a cached copy of event title/date so deleted
     events can be reported cleanly instead of leaving broken rows. */
  const backfillRegistrationCache = () => {
    const events = getEvents();
    const regs = getRegistrations();
    const byId = new Map(events.map((event) => [event.id, event]));
    let changed = false;
    regs.forEach((reg) => {
      const event = byId.get(reg.eventId);
      if (!event) {
        if (reg.status !== 'event_removed') {
          reg.status = 'event_removed';
          changed = true;
        }
        return;
      }
      if (reg.eventTitle !== event.title) {
        reg.eventTitle = event.title;
        changed = true;
      }
      if (reg.eventDate !== event.date) {
        reg.eventDate = event.date;
        changed = true;
      }
    });
    if (changed) saveRegistrations(regs);
  };

  /* ---------------- Generic collections ---------------- */
  const getUsers = () => {
    const value = readJson(KEYS.users, []);
    return Array.isArray(value) ? value : [];
  };
  const saveUsers = (users) => writeJson(KEYS.users, users);

  const getEvents = () => {
    const value = readJson(KEYS.events, []);
    return Array.isArray(value) ? value : [];
  };
  const saveEvents = (events) => writeJson(KEYS.events, events);

  const getRegistrations = () => {
    const value = readJson(KEYS.registrations, []);
    return Array.isArray(value) ? value : [];
  };
  const saveRegistrations = (registrations) => writeJson(KEYS.registrations, registrations);

  /* ---------------- Session ---------------- */
  const getCurrentUser = () => readJson(KEYS.currentUser, null);
  const setCurrentUser = (user) => {
    if (!user) return clearCurrentUser();
    rawSet(KEYS.currentUser, JSON.stringify(user));
    return user;
  };
  const clearCurrentUser = () => rawRemove(KEYS.currentUser);

  /* ---------------- Specific finders ---------------- */
  const getUserById = (id) => getUsers().find((user) => user.id === id) || null;
  const getUserByEmail = (email) => {
    if (!email) return null;
    const needle = String(email).trim().toLowerCase();
    return getUsers().find((user) => String(user.email || '').toLowerCase() === needle) || null;
  };
  const getEventById = (id) => getEvents().find((event) => event.id === id) || null;

  /* =============================================================
     Initialisation (never overwrites existing data)
     ============================================================= */
  const ensureDefaultAdmin = () => {
    const users = getUsers();
    const exists = users.some(
      (user) => String(user.email || '').toLowerCase() === DEFAULT_ADMIN.email
    );
    if (exists) return null;
    const admin = Object.assign({}, DEFAULT_ADMIN);
    users.push(admin);
    saveUsers(users);
    return admin;
  };

  const init = () => {
    ensureDefaultAdmin();

    if (rawGet(KEYS.events) === null) {
      saveEvents(buildSeedEvents());
    }
    /* Registrations deliberately start empty: sample events are unbooked
       demo content, and the documented test flow creates the first
       registration through the interface. */
    if (rawGet(KEYS.registrations) === null) {
      saveRegistrations([]);
    }

    backfillRegistrationCache();
    rawSet(KEYS.seeded, nowIso());
    return true;
  };

  /* Wipe every key owned by this project. */
  const reset = () => {
    Object.values(KEYS).forEach(rawRemove);
    return init();
  };

  const globalObj = global.YGE = global.YGE || {};
  globalObj.KEYS = KEYS;
  globalObj.storageAvailable = AVAILABLE;
  globalObj.getUsers = getUsers;
  globalObj.saveUsers = saveUsers;
  globalObj.getEvents = getEvents;
  globalObj.saveEvents = saveEvents;
  globalObj.getRegistrations = getRegistrations;
  globalObj.saveRegistrations = saveRegistrations;
  globalObj.getCurrentUser = getCurrentUser;
  globalObj.setCurrentUser = setCurrentUser;
  globalObj.clearCurrentUser = clearCurrentUser;
  globalObj.getUserById = getUserById;
  globalObj.getUserByEmail = getUserByEmail;
  globalObj.getEventById = getEventById;
  globalObj.init = init;
  globalObj.reset = reset;
  globalObj.ensureDefaultAdmin = ensureDefaultAdmin;
  globalObj.DEFAULT_ADMIN = Object.assign({}, DEFAULT_ADMIN);
  globalObj.DEMO_USER_CREDENTIALS = Object.assign({}, DEMO_USER_CREDENTIALS);

  if (typeof document !== 'undefined') {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
