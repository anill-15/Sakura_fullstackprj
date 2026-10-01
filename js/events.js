/* =============================================================
   SkillNest - js/events.js
   Event CRUD, registration rules, status calculation and the
   reusable event card / table renderers used by user + admin + landing.
   ============================================================= */
(function (global) {
  'use strict';

  const store = global.YGE;
  const ui = global.YGE.ui;

  const CATEGORIES = [
    'Web Development',
    'Programming',
    'Data Science',
    'AI & ML',
    'Design',
    'Tools & DevOps',
    'Cybersecurity',
    'Soft Skills'
  ];

  const MODES = ['Online', 'Offline', 'Hybrid'];
  const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

  /* =============================================================
     Status calculation
     ============================================================= */
  const dayBounds = (dateString) => {
    const date = ui.parseDate(dateString);
    if (!date) return null;
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    return { start: start, end: end };
  };

  /* Returns a copy carrying `computedStatus`. Declared before addEvent /
     updateEvent so those can return it without a temporal-dead-zone error. */
  const withStatus = (event) => Object.assign({}, event, { computedStatus: computeStatus(event) });

  const computeStatus = (event) => {
    if (!event || !event.date) return 'upcoming';
    /* An explicit cancellation always wins. */
    if (String(event.status).toLowerCase() === 'cancelled') return 'cancelled';

    const bounds = dayBounds(event.date);
    if (!bounds) return 'upcoming';

    const now = new Date();
    if (now.getTime() > bounds.end.getTime()) return 'completed';
    if (now.getTime() >= bounds.start.getTime()) return 'ongoing';
    return 'upcoming';
  };

  const getEventStatus = (eventOrId) => {
    const event = typeof eventOrId === 'string' ? getEventById(eventOrId) : eventOrId;
    return event ? computeStatus(event) : null;
  };

  /* =============================================================
     Event CRUD
     ============================================================= */
  const getEvents = () => store.getEvents();

  const getEventById = (id) => store.getEventById(id);

  const nextEventId = (events) => {
    let max = 0;
    events.forEach((event) => {
      const match = String(event.id || '').match(/(\d+)\s*$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    });
    return 'EVT' + String(max + 1).padStart(3, '0');
  };

  const validateEvent = (data) => {
    const errors = {};
    const required = ['title', 'description', 'category', 'trainer', 'date', 'startTime', 'endTime', 'mode'];

    required.forEach((field) => {
      const value = data[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        errors[field] = 'This field is required.';
      }
    });

    if (!errors.title && String(data.title).trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    }
    if (!errors.description && String(data.description).trim().length < 20) {
      errors.description = 'Description must be at least 20 characters.';
    }
    if (!errors.trainer && String(data.trainer).trim().length < 3) {
      errors.trainer = 'Trainer name must be at least 3 characters.';
    }
    if (!errors.category && CATEGORIES.indexOf(data.category) === -1) {
      errors.category = 'Select a valid category.';
    }
    if (!errors.mode && MODES.indexOf(data.mode) === -1) {
      errors.mode = 'Select a valid mode.';
    }
    if (!errors.date) {
      const parsed = ui.parseDate(data.date);
      const text = String(data.date).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        /* Reject other layouts before parsing: `new Date('03-03-2099')`
           silently resolves to a real date in some engines. */
        errors.date = 'Use the date format YYYY-MM-DD.';
      } else if (!parsed) {
        errors.date = 'Enter a valid date.';
      }
    }
    if (!errors.startTime) {
      if (ui.to24Hour(data.startTime) === null) errors.startTime = 'Enter a valid start time.';
    }
    if (!errors.endTime) {
      if (ui.to24Hour(data.endTime) === null) errors.endTime = 'Enter a valid end time.';
    }
    if (!errors.startTime && !errors.endTime && data.startTime && data.endTime) {
      const start = ui.to24Hour(data.startTime);
      const end = ui.to24Hour(data.endTime);
      if (start === end) errors.endTime = 'End time must be different from start time.';
      else if (end < start) errors.endTime = 'End time must be after start time.';
    }

    if (data.maxParticipants === undefined || data.maxParticipants === null || String(data.maxParticipants).trim() === '') {
      errors.maxParticipants = 'Maximum participants is required.';
    } else {
      const capacity = Number(data.maxParticipants);
      if (!Number.isFinite(capacity) || capacity < 1) errors.maxParticipants = 'Capacity must be a number of at least 1.';
      else if (!Number.isInteger(capacity)) errors.maxParticipants = 'Capacity must be a whole number.';
    }

    if (data.status && STATUSES.indexOf(data.status) === -1) {
      errors.status = 'Select a valid status.';
    }

    if (!errors.mode && data.mode !== 'Offline' && ui.isEmpty(data.venueOrLink)) {
      errors.venueOrLink = 'Meeting link is required for online / hybrid sessions.';
    }
    if (!errors.mode && data.mode === 'Offline' && ui.isEmpty(data.venueOrLink)) {
      errors.venueOrLink = 'Venue is required for offline sessions.';
    }

    return { valid: Object.keys(errors).length === 0, errors: errors };
  };

  const normaliseEvent = (data, base) => {
    const start = ui.to24Hour(data.startTime);
    const end = ui.to24Hour(data.endTime);
    const autoDuration = (start !== null && end !== null && end > start ? Math.round(((end - start) / 60) * 10) / 10 : 0);
    const manualDuration = Number(data.duration);

    return Object.assign({}, base || {}, {
      title: String(data.title).trim(),
      description: String(data.description).trim(),
      category: data.category,
      trainer: String(data.trainer).trim(),
      date: String(data.date).trim(),
      startTime: String(data.startTime).trim(),
      endTime: String(data.endTime).trim(),
      duration: String(data.duration || '').trim() || (autoDuration ? autoDuration + (autoDuration === 1 ? ' hour' : ' hours') : ''),
      mode: data.mode,
      venueOrLink: String(data.venueOrLink || '').trim() || 'To be announced',
      maxParticipants: Number(data.maxParticipants),
      status: data.status || 'upcoming'
    });
  };

  const addEvent = (data) => {
    const result = validateEvent(data);
    if (!result.valid) return { success: false, message: 'Please correct the highlighted fields.', errors: result.errors };

    const events = getEvents();
    const event = normaliseEvent(data, {
      id: nextEventId(events),
      createdAt: new Date().toISOString()
    });
    events.push(event);
    store.saveEvents(events);
    /* Returned with computedStatus so callers (admin list, tests) do not have
       to re-derive it; the stored record keeps the plain `status` field. */
    return { success: true, message: 'Event "' + event.title + '" created successfully.', event: withStatus(event) };
  };

  const updateEvent = (id, data) => {
    const events = getEvents();
    const index = events.findIndex((event) => event.id === id);
    if (index === -1) return { success: false, message: 'Event not found.' };

    const result = validateEvent(data);
    if (!result.valid) return { success: false, message: 'Please correct the highlighted fields.', errors: result.errors };

    const updated = normaliseEvent(data, Object.assign({}, events[index]));
    updated.status = data.status || computeStatus(updated);

    /* Capacity can never drop below the seats already taken. */
    const taken = getActiveRegistrationsForEvent(id).length;
    if (updated.maxParticipants < taken) {
      return {
        success: false,
        message: 'Capacity cannot be lower than the ' + taken + ' participant(s) already registered.',
        errors: { maxParticipants: 'At least ' + taken + ' seat(s) are already booked.' }
      };
    }

    events[index] = updated;
    store.saveEvents(events);
    syncRegistrationCache(updated);
    return { success: true, message: 'Event updated successfully.', event: withStatus(updated) };
  };

  /**
   * Deleting an event keeps its registrations but flags them
   * `event_removed`, so no broken rows remain and the seats are freed.
   */
  const deleteEvent = (id) => {
    const events = getEvents();
    const event = events.find((item) => item.id === id);
    if (!event) return { success: false, message: 'Event not found.' };

    const remaining = events.filter((item) => item.id !== id);
    store.saveEvents(remaining);

    /* Registrations are preserved and marked event_removed rather than
       deleted, so the learner's history stays truthful and the admin
       registration manager can still account for the freed seats. */
    const registrations = store.getRegistrations();
    let removedRegistrations = 0;
    registrations.forEach((reg) => {
      if (reg.eventId !== id) return;
      reg.status = 'event_removed';
      reg.cancelledAt = reg.cancelledAt || new Date().toISOString();
      if (!reg.eventTitle) reg.eventTitle = event.title;
      if (!reg.eventDate) reg.eventDate = event.date;
      removedRegistrations += 1;
    });
    store.saveRegistrations(registrations);

    return {
      success: true,
      message: 'Event "' + event.title + '" deleted successfully.',
      removedRegistrations
    };
  };

  /* =============================================================
     Registrations
     ============================================================= */
  const getRegistrations = () => store.getRegistrations();

  const isRegistrationActive = (reg) => reg && reg.status !== 'cancelled' && reg.status !== 'event_removed';

  const getEventRegistrations = (eventId, includeCancelled) => {
    const rows = getRegistrations().filter((reg) => reg.eventId === eventId);
    return includeCancelled ? rows : rows.filter(isRegistrationActive);
  };

  const getActiveRegistrationsForEvent = (eventId) => getEventRegistrations(eventId, false);

  const getAvailableSeats = (eventIdOrEvent) => {
    const event = typeof eventIdOrEvent === 'string' ? getEventById(eventIdOrEvent) : eventIdOrEvent;
    if (!event) return 0;
    const taken = getActiveRegistrationsForEvent(event.id).length;
    return Math.max(0, event.maxParticipants - taken);
  };

  const isEventFull = (eventIdOrEvent) => {
    const event = typeof eventIdOrEvent === 'string' ? getEventById(eventIdOrEvent) : eventIdOrEvent;
    if (!event) return false;
    return getActiveRegistrationsForEvent(event.id).length >= event.maxParticipants;
  };

  const hasRegistered = (eventId, userId) =>
    getRegistrations().some((reg) => reg.eventId === eventId && reg.userId === userId && isRegistrationActive(reg));

  const getUserRegistration = (eventId, userId) =>
    getRegistrations().find((reg) => reg.eventId === eventId && reg.userId === userId && isRegistrationActive(reg)) || null;

  const getUserRegistrations = (userId) =>
    getRegistrations()
      .filter((reg) => reg.userId === userId && isRegistrationActive(reg))
      .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));

  const syncRegistrationCache = (event) => {
    const registrations = getRegistrations();
    let changed = false;
    registrations.forEach((reg) => {
      if (reg.eventId !== event.id) return;
      if (reg.eventTitle !== event.title) {
        reg.eventTitle = event.title;
        changed = true;
      }
      if (reg.eventDate !== event.date) {
        reg.eventDate = event.date;
        changed = true;
      }
    });
    if (changed) store.saveRegistrations(registrations);
  };

  /** Returns a structured reason so the UI can show the right message. */
  const canRegister = (eventId, user) => {
    const event = getEventById(eventId);
    if (!event) return { ok: false, reason: 'Event not found.' };
    if (!user) return { ok: false, reason: 'Please login to register for a training event.' };

    const status = computeStatus(event);
    if (status === 'cancelled') return { ok: false, reason: 'This event has been cancelled.' };
    if (status === 'completed') return { ok: false, reason: 'This event has already been completed.' };
    if (hasRegistered(eventId, user.id)) return { ok: false, reason: 'You are already registered for this event.', duplicate: true };
    if (isEventFull(event)) return { ok: false, reason: 'This event is already full.', full: true };

    return { ok: true, reason: '' };
  };

  const registerForEvent = (eventId, userId) => {
    const users = store.getUsers();
    const user = users.find((item) => item.id === userId);
    if (!user) return { success: false, code: 'unauthenticated', message: 'Please login to register for a training event.' };

    const check = canRegister(eventId, user);
    if (!check.ok) return { success: false, code: check.duplicate ? 'duplicate' : check.full ? 'full' : 'blocked', message: check.reason };

    const event = getEventById(eventId);
    const registrations = getRegistrations();

    let max = 0;
    registrations.forEach((reg) => {
      const match = String(reg.id || '').match(/(\d+)\s*$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    });

    const registration = {
      id: 'REG' + String(max + 1).padStart(3, '0'),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      status: 'confirmed',
      registeredAt: new Date().toISOString(),
      cancelledAt: null
    };

    registrations.push(registration);
    store.saveRegistrations(registrations);

    return {
      success: true,
      message: 'Registration successful for "' + event.title + '".',
      registration: registration
    };
  };

  const cancelRegistration = (registrationId, userId, isAdminAction) => {
    const registrations = getRegistrations();
    const index = registrations.findIndex((reg) => reg.id === registrationId);
    if (index === -1) return { success: false, message: 'Registration record not found.' };

    const registration = registrations[index];
    if (!isAdminAction && userId && registration.userId !== userId) {
      return { success: false, message: 'You can only cancel your own registrations.' };
    }
    if (!isRegistrationActive(registration)) {
      return { success: false, message: 'This registration is already cancelled.' };
    }

    const event = getEventById(registration.eventId);
    if (event) {
      const status = computeStatus(event);
      if (status === 'completed') {
        return { success: false, message: 'Completed sessions cannot be cancelled.' };
      }
    }

    registration.status = 'cancelled';
    registration.cancelledAt = new Date().toISOString();
    registrations[index] = registration;
    store.saveRegistrations(registrations);

    return {
      success: true,
      message: 'Registration cancelled. Your seat has been released.',
      registration: registration
    };
  };

  const sortByDate = (list) =>
    list.slice().sort((a, b) => {
      const keyA = String(a.date || '') + ' ' + String(a.startTime || '');
      const keyB = String(b.date || '') + ' ' + String(b.startTime || '');
      return keyA.localeCompare(keyB);
    });

  const getSortedEvents = (options) => {
    const config = Object.assign({ filter: 'all', search: '', category: 'all' }, options || {});
    let list = getEvents().map(withStatus);

    if (config.filter === 'upcoming') list = list.filter((event) => event.computedStatus === 'upcoming');
    if (config.filter === 'ongoing') list = list.filter((event) => event.computedStatus === 'ongoing');
    if (config.filter === 'completed') list = list.filter((event) => event.computedStatus === 'completed');
    if (config.filter === 'cancelled') list = list.filter((event) => event.computedStatus === 'cancelled');
    if (config.category && config.category !== 'all') list = list.filter((event) => event.category === config.category);

    if (config.search) {
      const needle = String(config.search).toLowerCase();
      list = list.filter((event) =>
        [event.title, event.description, event.trainer, event.category, event.mode]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      );
    }

    return sortByDate(list);
  };

  const getCategories = () => CATEGORIES.slice();

  const getStats = () => {
    const events = getEvents().map(withStatus);
    return {
      totalEvents: events.length,
      upcomingEvents: events.filter((event) => event.computedStatus === 'upcoming').length,
      ongoingEvents: events.filter((event) => event.computedStatus === 'ongoing').length,
      completedEvents: events.filter((event) => event.computedStatus === 'completed').length,
      cancelledEvents: events.filter((event) => event.computedStatus === 'cancelled').length
    };
  };

  /* =============================================================
     Rendering helpers
     ============================================================= */
  const seatsLabel = (event) => {
    const available = getAvailableSeats(event.id);
    if (available === 0) return '<span class="seats seats-full">Full</span>';
    return '<span class="seats">' + available + ' seat' + (available === 1 ? '' : 's') + ' left</span>';
  };

  const modeIcon = (mode) => {
    if (mode === 'Offline') return '&#127968;';
    if (mode === 'Hybrid') return '&#127912;';
    return '&#128187;';
  };

  const metaItem = (label, value, extraClass) =>
    '<div class="event-meta-item ' + (extraClass || '') + '"><span class="event-meta-label">' + label + '</span>' +
    '<span class="event-meta-value">' + value + '</span></div>';

  /**
   * Renders one event card for the learner module.
   */
  const renderEventCard = (event, options) => {
    const config = Object.assign({ user: null, showAdminActions: false }, options || {});
    const status = computeStatus(event);
    const available = getAvailableSeats(event.id);
    const registered = config.user ? hasRegistered(event.id, config.user.id) : false;
    const full = available === 0;
    const canJoin = status === 'upcoming' && !full && !registered;

    let actionHtml;
    if (registered) {
      actionHtml = '<button type="button" class="btn btn-success btn-block" disabled>&#10003; Registered</button>' +
        '<a class="btn btn-ghost btn-block" data-nav="user/registrations.html" href="#">View my registrations</a>';
    } else if (status === 'cancelled') {
      actionHtml = '<button type="button" class="btn btn-disabled btn-block" disabled>Registration closed</button>';
    } else if (status === 'completed' || status === 'ongoing') {
      actionHtml = '<button type="button" class="btn btn-disabled btn-block" disabled>' +
        (status === 'completed' ? 'Session completed' : 'Session in progress') + '</button>';
    } else if (full) {
      actionHtml = '<button type="button" class="btn btn-disabled btn-block" disabled>Event is full</button>';
    } else {
      actionHtml = '<button type="button" class="btn btn-primary btn-block" data-action="register" data-event-id="' + event.id + '">Register Now</button>';
    }
    actionHtml += '<button type="button" class="btn btn-outline btn-block" data-action="details" data-event-id="' + event.id + '">View Details</button>';

    const adminActions = config.showAdminActions
      ? '<div class="event-admin-actions">' +
        '<button type="button" class="btn btn-xs btn-outline" data-action="edit-event" data-event-id="' + event.id + '">Edit</button>' +
        '<button type="button" class="btn btn-xs btn-danger-outline" data-action="delete-event" data-event-id="' + event.id + '">Delete</button>' +
        '<button type="button" class="btn btn-xs btn-ghost" data-action="event-registrations" data-event-id="' + event.id + '">Registrations (' + getActiveRegistrationsForEvent(event.id).length + ')</button>' +
        '</div>'
      : '';

    return (
      '<article class="event-card ' + (status === 'cancelled' ? 'event-card-muted' : '') + '" data-event-id="' + event.id + '">' +
      '<div class="event-card-top">' +
      '<div class="event-badges">' +
      '<span class="badge badge-category">' + ui.escapeHtml(event.category) + '</span>' +
      ui.statusBadge(status) +
      '</div>' +
      seatsLabel(event) +
      '</div>' +
      '<h3 class="event-card-title">' + ui.escapeHtml(event.title) + '</h3>' +
      '<p class="event-card-description">' + ui.escapeHtml(event.description.length > 130 ? event.description.slice(0, 130) + '...' : event.description) + '</p>' +
      '<div class="event-meta">' +
      metaItem('Trainer', ui.escapeHtml(event.trainer)) +
      metaItem('Date', ui.escapeHtml(ui.formatDate(event.date))) +
      metaItem('Time', ui.escapeHtml(ui.formatTime(event.startTime) + ' - ' + ui.formatTime(event.endTime))) +
      metaItem('Duration', ui.escapeHtml(event.duration || 'Flexible')) +
      metaItem('Mode', modeIcon(event.mode) + ' ' + ui.escapeHtml(event.mode)) +
      metaItem('Capacity', event.maxParticipants + ' participants') +
      '</div>' +
      '<div class="event-card-footer">' + actionHtml + '</div>' +
      adminActions +
      '</article>'
    );
  };

  /** Renders the event table used by the admin event manager. */
  const renderEventRow = (event) => {
    const status = computeStatus(event);
    const available = getAvailableSeats(event.id);
    const registered = getActiveRegistrationsForEvent(event.id).length;
    return (
      '<tr data-event-id="' + event.id + '">' +
      '<td data-label="Event"><strong>' + ui.escapeHtml(event.title) + '</strong><small class="cell-sub">' + ui.escapeHtml(event.id) + '</small></td>' +
      '<td data-label="Category"><span class="badge badge-category">' + ui.escapeHtml(event.category) + '</span></td>' +
      '<td data-label="Trainer">' + ui.escapeHtml(event.trainer) + '</td>' +
      '<td data-label="Date">' + ui.escapeHtml(ui.formatDate(event.date, 'short')) + '<small class="cell-sub">' + ui.escapeHtml(ui.formatTime(event.startTime) + ' - ' + ui.formatTime(event.endTime)) + '</small></td>' +
      '<td data-label="Mode">' + ui.escapeHtml(event.mode) + '</td>' +
      '<td data-label="Seats"><strong>' + registered + ' / ' + event.maxParticipants + '</strong><small class="cell-sub">' + (available === 0 ? 'Full' : available + ' left') + '</small></td>' +
      '<td data-label="Status">' + ui.statusBadge(status) + '</td>' +
      '<td data-label="Actions" class="table-actions">' +
      '<button type="button" class="btn btn-xs btn-outline" data-action="edit-event" data-event-id="' + event.id + '" aria-label="Edit ' + ui.escapeHtml(event.title) + '">Edit</button>' +
      '<button type="button" class="btn btn-xs btn-danger-outline" data-action="delete-event" data-event-id="' + event.id + '" aria-label="Delete ' + ui.escapeHtml(event.title) + '">Delete</button>' +
      '</td>' +
      '</tr>'
    );
  };

  const buildEventDetailHtml = (event) => {
    const status = computeStatus(event);
    const registered = getActiveRegistrationsForEvent(event.id).length;
    const available = Math.max(0, event.maxParticipants - registered);
    const venue = /^https?:\/\//i.test(event.venueOrLink)
      ? '<a href="' + ui.escapeHtml(event.venueOrLink) + '" target="_blank" rel="noopener noreferrer">Open meeting link</a>'
      : ui.escapeHtml(event.venueOrLink);

    return (
      '<div class="detail-head">' +
      '<div class="event-badges"><span class="badge badge-category">' + ui.escapeHtml(event.category) + '</span>' + ui.statusBadge(status) + '</div>' +
      '<h3 id="detailTitle">' + ui.escapeHtml(event.title) + '</h3>' +
      '<p class="detail-trainer">Conducted by <strong>' + ui.escapeHtml(event.trainer) + '</strong></p>' +
      '</div>' +
      '<p class="detail-description">' + ui.escapeHtml(event.description) + '</p>' +
      '<dl class="detail-grid">' +
      '<div><dt>Date</dt><dd>' + ui.escapeHtml(ui.formatDate(event.date)) + '</dd></div>' +
      '<div><dt>Time</dt><dd>' + ui.escapeHtml(ui.formatTime(event.startTime) + ' - ' + ui.formatTime(event.endTime)) + '</dd></div>' +
      '<div><dt>Duration</dt><dd>' + ui.escapeHtml(event.duration || 'Flexible') + '</dd></div>' +
      '<div><dt>Mode</dt><dd>' + ui.escapeHtml(event.mode) + '</dd></div>' +
      '<div><dt>Venue / Link</dt><dd>' + venue + '</dd></div>' +
      '<div><dt>Seats</dt><dd>' + registered + ' of ' + event.maxParticipants + ' filled (' + available + ' available)</dd></div>' +
      '<div><dt>Event ID</dt><dd>' + ui.escapeHtml(event.id) + '</dd></div>' +
      '<div><dt>Created on</dt><dd>' + ui.escapeHtml(ui.formatDate(event.createdAt)) + '</dd></div>' +
      '</dl>'
    );
  };

  global.YGE.events = {
    CATEGORIES: CATEGORIES,
    MODES: MODES,
    STATUSES: STATUSES,
    getEvents: getEvents,
    getEventById: getEventById,
    addEvent: addEvent,
    updateEvent: updateEvent,
    deleteEvent: deleteEvent,
    validateEvent: validateEvent,
    computeStatus: computeStatus,
    getEventStatus: getEventStatus,
    registerForEvent: registerForEvent,
    cancelRegistration: cancelRegistration,
    canRegister: canRegister,
    hasRegistered: hasRegistered,
    getEventRegistrations: getEventRegistrations,
    getActiveRegistrationsForEvent: getActiveRegistrationsForEvent,
    getAvailableSeats: getAvailableSeats,
    isEventFull: isEventFull,
    getUserRegistration: getUserRegistration,
    getUserRegistrations: getUserRegistrations,
    getRegistrations: getRegistrations,
    isRegistrationActive: isRegistrationActive,
    getSortedEvents: getSortedEvents,
    getCategories: getCategories,
    getStats: getStats,
    sortByDate: sortByDate,
    withStatus: withStatus,
    renderEventCard: renderEventCard,
    renderEventRow: renderEventRow,
    buildEventDetailHtml: buildEventDetailHtml,
    seatsLabel: seatsLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);
