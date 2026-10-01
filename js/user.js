/* =============================================================
   SkillNest - js/user.js
   Learner module logic: dashboard statistics, profile rendering and
   updates, registration lists, event rendering, plus the dynamic
   landing page sections.
   ============================================================= */
(function (global) {
  'use strict';

  const doc = global.document;
  const store = global.YGE;
  const ui = global.YGE.ui;
  const auth = global.YGE.auth;
  const eventsApi = global.YGE.events;
  const navigation = global.YGE.navigation;

  const $ = (selector, scope) => (scope || doc).querySelector(selector);
  const $$ = (selector, scope) => Array.prototype.slice.call((scope || doc).querySelectorAll(selector));

  /* =============================================================
     Statistics
     ============================================================= */
  const getDashboardStats = (user) => {
    const allEvents = eventsApi.getEvents().map(eventsApi.withStatus);
    const myRegs = eventsApi.getUserRegistrations(user.id);
    const eventById = new Map(allEvents.map((event) => [event.id, event]));

    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;
    myRegs.forEach((reg) => {
      const event = eventById.get(reg.eventId);
      const status = event ? event.computedStatus : reg.status;
      if (status === 'upcoming') upcoming += 1;
      else if (status === 'ongoing') ongoing += 1;
      else if (status === 'completed') completed += 1;
    });

    return {
      totalEvents: allEvents.length,
      upcomingEvents: allEvents.filter((event) => event.computedStatus === 'upcoming').length,
      availableEvents: allEvents.filter((event) => event.computedStatus === 'upcoming').length,
      totalRegistrations: myRegs.length,
      upcomingRegistrations: upcoming,
      ongoingRegistrations: ongoing,
      completedRegistrations: completed,
      categories: new Set(allEvents.map((event) => event.category)).size
    };
  };

  const getRecommendedEvents = (user, limit) => {
    const registeredIds = new Set(eventsApi.getUserRegistrations(user.id).map((reg) => reg.eventId));
    const open = eventsApi
      .getSortedEvents({ filter: 'upcoming' })
      .filter((event) => !registeredIds.has(event.id) && eventsApi.getAvailableSeats(event.id) > 0);
    return open.slice(0, limit || 3);
  };

  /* =============================================================
     Shared rendering used across learner pages
     ============================================================= */
  const renderStatCards = (container, cards) => {
    if (!container) return;
    container.innerHTML = cards
      .map(
        (card) =>
          '<article class="stat-card stat-' + (card.tone || 'primary') + '">' +
          '<span class="stat-icon" aria-hidden="true">' + (card.icon || '') + '</span>' +
          '<div class="stat-body">' +
          '<p class="stat-label">' + ui.escapeHtml(card.label) + '</p>' +
          '<p class="stat-value">' + ui.escapeHtml(String(card.value)) + '</p>' +
          '<p class="stat-hint">' + ui.escapeHtml(card.hint || '') + '</p>' +
          '</div>' +
          '</article>'
      )
      .join('');
  };

  const registrationRow = (reg, options) => {
    const config = Object.assign({ showCancel: true }, options || {});
    const event = eventsApi.getEventById(reg.eventId);
    const status = event ? eventsApi.computeStatus(event) : reg.status;
    const canCancel = config.showCancel && status === 'upcoming';
    const seats = event ? eventsApi.getAvailableSeats(event.id) : 0;

    return (
      '<article class="registration-card" data-registration-id="' + reg.id + '">' +
      '<div class="registration-main">' +
      '<div class="registration-title-row">' +
      '<h3>' + ui.escapeHtml(event ? event.title : reg.eventTitle || 'Removed event') + '</h3>' +
      ui.statusBadge(status) +
      '</div>' +
      '<div class="event-meta">' +
      '<div class="event-meta-item"><span class="event-meta-label">Trainer</span><span class="event-meta-value">' + ui.escapeHtml(event ? event.trainer : 'Not available') + '</span></div>' +
      '<div class="event-meta-item"><span class="event-meta-label">Date</span><span class="event-meta-value">' + ui.escapeHtml(ui.formatDate(event ? event.date : reg.eventDate)) + '</span></div>' +
      '<div class="event-meta-item"><span class="event-meta-label">Time</span><span class="event-meta-value">' +
      ui.escapeHtml(event ? ui.formatTime(event.startTime) + ' - ' + ui.formatTime(event.endTime) : 'Not available') + '</span></div>' +
      '<div class="event-meta-item"><span class="event-meta-label">Mode</span><span class="event-meta-value">' + ui.escapeHtml(event ? event.mode : 'Not available') + '</span></div>' +
      '<div class="event-meta-item"><span class="event-meta-label">Seats left</span><span class="event-meta-value">' + (event ? seats : 0) + '</span></div>' +
      '<div class="event-meta-item"><span class="event-meta-label">Registered on</span><span class="event-meta-value">' + ui.escapeHtml(ui.formatDate(reg.registeredAt)) + '</span></div>' +
      '</div>' +
      '<p class="registration-id">Registration ID: <strong>' + ui.escapeHtml(reg.id) + '</strong></p>' +
      '</div>' +
      '<div class="registration-actions">' +
      (event && event.venueOrLink && /^https?:\/\//i.test(event.venueOrLink)
        ? '<a class="btn btn-outline btn-sm" href="' + ui.escapeHtml(event.venueOrLink) + '" target="_blank" rel="noopener noreferrer">Join Session</a>'
        : '') +
      '<button type="button" class="btn btn-outline btn-sm" data-action="view-event" data-event-id="' + ui.escapeHtml(reg.eventId) + '">View Event</button>' +
      (canCancel
        ? '<button type="button" class="btn btn-danger-outline btn-sm" data-action="cancel-registration" data-registration-id="' + reg.id + '">Cancel Registration</button>'
        : '<button type="button" class="btn btn-disabled btn-sm" disabled>Cancellation closed</button>') +
      '</div>' +
      '</article>'
    );
  };

  /* =============================================================
     Learner dashboard
     ============================================================= */
  const ICONS = {
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v9H5v-9h14z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V8a2 2 0 0 1 2-2zm8 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2v7z"/></svg>'
  };

  const initDashboard = () => {
    const user = navigation.guard('user');
    if (!user) return;
    navigation.mountShell('user', 'dashboard.html');

    const stats = getDashboardStats(user);

    const welcome = $('#welcomeText');
    if (welcome) {
      const hour = new Date().getHours();
      const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      welcome.textContent = part + ', ' + user.name.split(' ')[0] + '!';
    }
    const sub = $('#welcomeSub');
    if (sub) sub.textContent = 'You have ' + stats.upcomingRegistrations + ' upcoming training session(s) scheduled.';

    renderStatCards($('#dashStats'), [
      { label: 'Available Events', value: stats.availableEvents, hint: stats.totalEvents + ' events in total', icon: ICONS.calendar, tone: 'primary' },
      { label: 'My Registrations', value: stats.upcomingRegistrations + stats.ongoingRegistrations, hint: stats.upcomingRegistrations + ' upcoming, ' + stats.ongoingRegistrations + ' in progress', icon: ICONS.ticket, tone: 'info' },
      { label: 'Completed', value: stats.completedRegistrations, hint: 'Sessions finished', icon: ICONS.check, tone: 'success' },
      { label: 'Skill Categories', value: stats.categories, hint: 'Live across the platform', icon: ICONS.clock, tone: 'warning' }
    ]);

    const nextHost = $('#nextSessions');
    if (nextHost) {
      const rows = eventsApi
        .getUserRegistrations(user.id)
        .map((reg) => ({ reg: reg, event: eventsApi.getEventById(reg.eventId) }))
        .filter((item) => item.event && (item.event.computedStatus === 'upcoming' || item.event.computedStatus === 'ongoing'))
        .sort((a, b) => (a.event.date + a.event.startTime).localeCompare(b.event.date + b.event.startTime))
        .slice(0, 4);
      nextHost.innerHTML = rows.length
        ? rows.map((item) => registrationRow(item.reg)).join('')
        : ui.emptyState(
            'No sessions yet',
            'Browse the training catalogue and register for your first session.',
            '<a class="btn btn-primary btn-sm" data-nav="user/events.html" href="#">Browse Events</a>'
          );
      navigation.applyRelativeLinks(nextHost);
      wireRegistrationActions(nextHost, user);
    }

    const recoHost = $('#recommendedEvents');
    if (recoHost) {
      const reco = getRecommendedEvents(user, 3);
      recoHost.innerHTML = reco.length
        ? reco.map((event) => eventsApi.renderEventCard(event, { user: user })).join('')
        : ui.emptyState('All caught up', 'You are registered for every upcoming session right now.');
      navigation.applyRelativeLinks(recoHost);
      wireEventActions(recoHost, user);
    }
  };

  /* =============================================================
     Learner events page
     ============================================================= */
  let eventsPageState = { search: '', category: 'all', status: 'all' };

  const initUserEvents = () => {
    const user = navigation.guard('user');
    if (!user) return;
    navigation.mountShell('user', 'events.html');

    const searchInput = $('#eventSearch');
    const categorySelect = $('#categoryFilter');
    const statusSelect = $('#statusFilter');
    const host = $('#eventList');
    const countLabel = $('#eventCount');

    const paint = () => {
      const list = eventsApi.getSortedEvents({
        search: eventsPageState.search,
        category: eventsPageState.category,
        filter: eventsPageState.status
      });

      if (countLabel) {
        countLabel.textContent =
          list.length + ' event(s) shown · ' + eventsApi.getUserRegistrations(user.id).length + ' of your registrations active';
      }
      if (!host) return;
      host.innerHTML = list.length
        ? list.map((event) => eventsApi.renderEventCard(event, { user: user })).join('')
        : ui.emptyState(
            'No events match your filters',
            'Try clearing the search box or choosing a different category.',
            '<button type="button" class="btn btn-outline btn-sm" data-action="clear-filters">Clear filters</button>'
          );
      navigation.applyRelativeLinks(host);
      wireEventActions(host, user);
      const clearBtn = $('[data-action="clear-filters"]', host);
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          eventsPageState = { search: '', category: 'all', status: 'all' };
          if (searchInput) searchInput.value = '';
          if (categorySelect) categorySelect.value = 'all';
          if (statusSelect) statusSelect.value = 'all';
          paint();
        });
      }
    };

    if (categorySelect) {
      categorySelect.innerHTML =
        '<option value="all">All categories</option>' +
        eventsApi.getCategories().map((category) => '<option value="' + ui.escapeHtml(category) + '">' + ui.escapeHtml(category) + '</option>').join('');
      categorySelect.addEventListener('change', (event) => {
        eventsPageState.category = event.target.value;
        paint();
      });
    }
    if (statusSelect) {
      statusSelect.innerHTML =
        '<option value="all">All statuses</option>' +
        ['upcoming', 'ongoing', 'completed', 'cancelled']
          .map((status) => '<option value="' + status + '">' + status.charAt(0).toUpperCase() + status.slice(1) + '</option>')
          .join('');
      statusSelect.addEventListener('change', (event) => {
        eventsPageState.status = event.target.value;
        paint();
      });
    }
    if (searchInput) {
      searchInput.value = eventsPageState.search;
      searchInput.addEventListener(
        'input',
        ui.debounce((event) => {
          eventsPageState.search = event.target.value;
          paint();
        }, 220)
      );
    }

    paint();
    refreshEventListView = paint;
  };

  let refreshEventListView = null;

  const wireEventActions = (scope, user) => {
    $$('[data-action="register"]', scope).forEach((button) => {
      button.addEventListener('click', () => {
        const eventId = button.getAttribute('data-event-id');
        const result = eventsApi.registerForEvent(eventId, user.id);
        if (result.success) {
          ui.toastSuccess(result.message);
          const card = button.closest('.event-card');
          if (card) {
            const footer = card.querySelector('.event-card-footer');
            if (footer) {
              footer.innerHTML =
                '<button type="button" class="btn btn-success btn-block" disabled>&#10003; Registered</button>' +
                '<a class="btn btn-ghost btn-block" data-nav="user/registrations.html" href="#">View my registrations</a>';
              navigation.applyRelativeLinks(card);
            }
            const seatsNode = card.querySelector('.seats');
            if (seatsNode) {
              const left = eventsApi.getAvailableSeats(eventId);
              seatsNode.textContent = left + ' seat' + (left === 1 ? '' : 's') + ' left';
              seatsNode.classList.toggle('seats-full', left === 0);
            }
          }
        } else if (result.code === 'duplicate' || result.code === 'full') {
          ui.toastWarning(result.message);
        } else {
          ui.toastError(result.message);
        }
      });
    });

    $$('[data-action="details"]', scope).forEach((button) => {
      button.addEventListener('click', () => openEventDetails(button.getAttribute('data-event-id')));
    });
  };

  /* =============================================================
     Learner registrations page
     ============================================================= */
  const initRegistrations = () => {
    const user = navigation.guard('user');
    if (!user) return;
    navigation.mountShell('user', 'registrations.html');

    const render = () => {
      const host = $('#registrationList');
      const all = store.getRegistrations().filter((reg) => reg.userId === user.id);
      const active = eventsApi.getUserRegistrations(user.id);
      const cancelled = all.filter((reg) => reg.status === 'cancelled');
      const history = all.filter((reg) => reg.status === 'event_removed');

      renderStatCards($('#regStats'), [
        { label: 'Active', value: active.length, hint: 'Confirmed registrations', icon: ICONS.ticket, tone: 'primary' },
        { label: 'Upcoming', value: active.filter((reg) => { const e = eventsApi.getEventById(reg.eventId); return e && e.computedStatus === 'upcoming'; }).length, hint: 'Sessions yet to start', icon: ICONS.calendar, tone: 'info' },
        { label: 'Cancelled', value: cancelled.length, hint: 'Seats released', icon: ICONS.clock, tone: 'warning' },
        { label: 'Completed', value: active.filter((reg) => { const e = eventsApi.getEventById(reg.eventId); return e && e.computedStatus === 'completed'; }).length, hint: 'Attended sessions', icon: ICONS.check, tone: 'success' }
      ]);

      const sections = [];
      sections.push('<section class="panel"><h2 class="panel-title">Active registrations</h2><div class="stack">' +
        (active.length
          ? eventsApi
              .sortByDate(
                active.map((reg) => {
                  const event = eventsApi.getEventById(reg.eventId);
                  return Object.assign({}, reg, { date: event ? event.date : reg.eventDate, startTime: event ? event.startTime : '00:00' });
                })
              )
              .map((reg) => registrationRow(reg))
              .join('')
          : ui.emptyState('No registrations yet', 'You have not registered for any training session so far.',
              '<a class="btn btn-primary btn-sm" data-nav="user/events.html" href="#">Browse Events</a>')) +
        '</div></section>');

/* Cancelled and event_removed records share the history panel so a
         registration is never silently lost when its event is deleted. */
      const past = cancelled.concat(history);
      if (past.length) {
        sections.push(
          '<section class="panel"><h2 class="panel-title">Registration history</h2><div class="stack">' +
          past
            .map((reg) => {
              const event = eventsApi.getEventById(reg.eventId);
              const removed = reg.status === 'event_removed';
              return (
                '<article class="registration-card registration-card-muted">' +
                '<div class="registration-main">' +
                '<div class="registration-title-row"><h3>' + ui.escapeHtml(event ? event.title : reg.eventTitle || 'Removed event') + '</h3>' + ui.statusBadge(reg.status) + '</div>' +
                '<p class="registration-id">Registration ID: <strong>' + ui.escapeHtml(reg.id) + '</strong> · Registered on ' + ui.escapeHtml(ui.formatDate(reg.registeredAt)) + '</p>' +
                (removed ? '<p class="registration-id">This event was deleted by an administrator, so the seat was released.</p>' : '') +
                (reg.cancelledAt ? '<p class="registration-id">Cancelled on ' + ui.escapeHtml(ui.formatDateTime(reg.cancelledAt)) + '</p>' : '') +
                '</div></article>'
              );
            })
            .join('') +
          '</div></section>'
        );
      }

      host.innerHTML = sections.join('');
      navigation.applyRelativeLinks(host);
      wireRegistrationActions(host, user);
    };

    render();
    refreshRegistrationsView = render;
  };

  let refreshRegistrationsView = null;

  const wireRegistrationActions = (scope, user) => {
    $$('[data-action="cancel-registration"]', scope).forEach((button) => {
      button.addEventListener('click', async () => {
        const registrationId = button.getAttribute('data-registration-id');
        const registration = store.getRegistrations().find((reg) => reg.id === registrationId);
        const event = registration ? eventsApi.getEventById(registration.eventId) : null;
        const confirmed = await ui.confirmDialog({
          title: 'Cancel registration?',
          message: 'Cancel your seat for "' + ((event && event.title) || 'this session') + '"?',
          detail: 'Your seat will be released for other learners and the registration will move to your history.',
          confirmText: 'Yes, cancel it',
          cancelText: 'Keep my seat',
          tone: 'danger'
        });
        if (!confirmed) return;
        const result = eventsApi.cancelRegistration(registrationId, user.id, false);
        if (result.success) {
          ui.toastSuccess(result.message);
          if (typeof refreshRegistrationsView === 'function') refreshRegistrationsView();
        } else {
          ui.toastError(result.message);
        }
      });
    });

    $$('[data-action="view-event"]', scope).forEach((button) => {
      button.addEventListener('click', () => openEventDetails(button.getAttribute('data-event-id')));
    });
  };

  /* =============================================================
     Event details modal
     ============================================================= */
  const openEventDetails = (eventId) => {
    const event = eventsApi.getEventById(eventId);
    if (!event) {
      ui.toastError('This event is no longer available.');
      return;
    }
    const user = auth.getLoggedInUser();
    let footer;
    if (!user) {
      footer = '<a class="btn btn-primary" href="' + navigation.route('login.html') + '">Login to Register</a>';
    } else if (user.role !== 'user') {
      footer = '<a class="btn btn-primary" href="' + navigation.route('admin/events.html') + '">Manage this event</a>';
    } else if (eventsApi.hasRegistered(eventId, user.id)) {
      footer = '<a class="btn btn-success" href="' + navigation.route('user/registrations.html') + '">&#10003; Already Registered</a>';
    } else if (!eventsApi.canRegister(eventId, user).ok) {
      footer = '<button type="button" class="btn btn-disabled" disabled>Registration unavailable</button>';
    } else {
      footer = '<button type="button" class="btn btn-primary" data-action="modal-register" data-event-id="' + event.id + '">Register Now</button>';
    }

    ui.modal({
      title: 'Event Details',
      body: eventsApi.buildEventDetailHtml(event),
      footer:
        '<button type="button" class="btn btn-ghost" data-modal-close="true">Close</button>' + footer
    });

    const registerBtn = doc.querySelector('[data-action="modal-register"]');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        const result = eventsApi.registerForEvent(event.id, user.id);
        if (result.success) {
          ui.toastSuccess(result.message);
          ui.closeModal();
          if (typeof refreshEventListView === 'function') refreshEventListView();
        } else {
          ui.toastWarning(result.message);
        }
      });
    }
  };

  /* =============================================================
     Learner profile
     ============================================================= */
  const initProfile = () => {
    const user = navigation.guard('user');
    if (!user) return;
    navigation.mountShell('user', 'profile.html');

    const nameInput = $('#profileName');
    const phoneInput = $('#profilePhone');
    const emailInput = $('#profileEmail');
    const roleInput = $('#profileRole');
    const idInput = $('#profileId');
    const createdInput = $('#profileCreated');
    const statsHost = $('#profileStats');

    const paint = () => {
      if (nameInput) nameInput.value = user.name;
      if (phoneInput) phoneInput.value = user.phone;
      if (emailInput) emailInput.value = user.email;
      if (roleInput) roleInput.value = user.role === 'admin' ? 'Administrator' : 'Learner';
      if (idInput) idInput.value = user.id;
      if (createdInput) createdInput.value = ui.formatDateTime(user.createdAt);
      if (statsHost) {
        const stats = getDashboardStats(user);
        renderStatCards(statsHost, [
          { label: 'Total Registrations', value: stats.totalRegistrations, hint: 'All time', icon: ICONS.ticket, tone: 'primary' },
          { label: 'Upcoming', value: stats.upcomingRegistrations, hint: 'Sessions scheduled', icon: ICONS.calendar, tone: 'info' },
          { label: 'Completed', value: stats.completedRegistrations, hint: 'Sessions finished', icon: ICONS.check, tone: 'success' }
        ]);
      }
      const initialsNode = $('#profileInitials');
      if (initialsNode) initialsNode.textContent = ui.initials(user.name);
      const displayName = $('#profileDisplayName');
      if (displayName) displayName.textContent = user.name;
      const memberSince = $('#profileMemberSince');
      if (memberSince) memberSince.textContent = 'Member since ' + ui.formatDate(user.createdAt);
    };

    paint();

    const form = $('#profileForm');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        ui.clearFormErrors(form);
        const result = auth.updateProfile(user.id, {
          name: ui.getFormData(form).name,
          phone: ui.getFormData(form).phone
        });
        if (result.success) {
          ui.toastSuccess(result.message);
          const fresh = store.getUserById(user.id);
          if (fresh) Object.assign(user, fresh);
          paint();
        } else {
          ui.toastError(result.message);
          ui.applyFieldErrors(form, result.errors);
        }
      });
    }

    const passwordForm = $('#passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (event) => {
        event.preventDefault();
        ui.clearFormErrors(passwordForm);
        const data = ui.getFormData(passwordForm);
        const result = auth.changePassword(user.id, data.currentPassword, data.newPassword, data.confirmPassword);
        if (result.success) {
          ui.toastSuccess(result.message);
          passwordForm.reset();
        } else {
          ui.toastError(result.message);
          ui.applyFieldErrors(passwordForm, result.errors);
        }
      });
    }

    const resetBtn = $('[data-action="reset-profile"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const fresh = store.getUserById(user.id);
        if (fresh) Object.assign(user, fresh);
        if (form) ui.clearFormErrors(form);
        paint();
        ui.toastInfo('Form reset to your saved values.');
      });
    }
  };

  /* =============================================================
     Landing page (index.html) - dynamic sections
     ============================================================= */
  const initLanding = () => {
    navigation.mountPublicNav();
    navigation.showUrlFlash();

    const previewHost = $('#landingEvents');
    const renderPreview = () => {
      if (!previewHost) return;
      const upcoming = eventsApi.getSortedEvents({ filter: 'upcoming' }).slice(0, 3);
      if (!upcoming.length) {
        previewHost.innerHTML = ui.emptyState('No upcoming sessions', 'New training sessions will be announced shortly.');
        return;
      }
      previewHost.innerHTML = upcoming
        .map((event) =>
          '<article class="landing-event">' +
          '<div class="landing-event-date"><strong>' + ui.parseDate(event.date).getDate() + '</strong><span>' +
          ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][ui.parseDate(event.date).getMonth()] +
          '</span></div>' +
          '<div class="landing-event-body">' +
          '<span class="badge badge-category">' + ui.escapeHtml(event.category) + '</span>' +
          '<h3>' + ui.escapeHtml(event.title) + '</h3>' +
          '<p>' + ui.escapeHtml(event.description.slice(0, 96)) + '...</p>' +
          '<ul class="landing-event-meta">' +
          '<li>' + ui.escapeHtml(ui.formatDate(event.date)) + '</li>' +
          '<li>' + ui.escapeHtml(ui.formatTime(event.startTime)) + '</li>' +
          '<li>' + ui.escapeHtml(event.trainer) + '</li>' +
          '<li>' + ui.escapeHtml(event.mode) + '</li>' +
          '</ul>' +
          '</div>' +
          '<div class="landing-event-action">' + ui.statusBadge(event.computedStatus) +
          '<span class="seats">' + eventsApi.getAvailableSeats(event.id) + ' seats left</span>' +
          '<a class="btn btn-outline btn-sm" href="signup.html">Reserve a seat</a>' +
          '</div>' +
          '</article>'
        )
        .join('');
    };

    renderPreview();

    const statNodes = {
      events: $('#statEvents'),
      trainers: $('#statTrainers'),
      learners: $('#statLearners'),
      categories: $('#statCategories')
    };
    if (statNodes.events) statNodes.events.textContent = eventsApi.getStats().totalEvents;
    if (statNodes.categories) statNodes.categories.textContent = eventsApi.getCategories().length;
    if (statNodes.trainers) {
      const trainers = new Set(eventsApi.getEvents().map((event) => event.trainer));
      statNodes.trainers.textContent = trainers.size;
    }
    if (statNodes.learners) {
      statNodes.learners.textContent = store.getUsers().filter((user) => user.role === 'user').length;
    }

    const categoryHost = $('#categoryGrid');
    if (categoryHost) {
      const descriptions = {
        'Web Development': 'Structure, styling and scripting for the modern browser platform.',
        Programming: 'Core language fundamentals with hands-on exercises.',
        'Data Science': 'Clean, analyse and visualise data to answer real questions.',
        'AI & ML': 'Understand intelligent systems from first principles.',
        Design: 'Accessible, user focused interface design and prototyping.',
        'Tools & DevOps': 'Version control, deployment and productivity tooling.',
        Cybersecurity: 'Protect applications, data and infrastructure.',
        'Soft Skills': 'Communication, teamwork and interview readiness.'
      };
      const used = new Set(eventsApi.getEvents().map((event) => event.category));
      const list = Array.from(used);
      categoryHost.innerHTML = list
        .map(
          (category) =>
            '<article class="category-card">' +
            '<h3>' + ui.escapeHtml(category) + '</h3>' +
            '<p>' + ui.escapeHtml(descriptions[category] || 'Focused technical training sessions.') + '</p>' +
            '<span class="category-count">' +
            eventsApi.getEvents().filter((event) => event.category === category).length + ' session(s)</span>' +
            '</article>'
        )
        .join('');
    }

    const yearNode = $('#currentYear');
    if (yearNode) yearNode.textContent = new Date().getFullYear();
  };

  global.YGE.user = {
    getDashboardStats: getDashboardStats,
    getRecommendedEvents: getRecommendedEvents,
    renderStatCards: renderStatCards,
    registrationRow: registrationRow,
    wireEventActions: wireEventActions,
    wireRegistrationActions: wireRegistrationActions,
    openEventDetails: openEventDetails,
    initDashboard: initDashboard,
    initUserEvents: initUserEvents,
    initRegistrations: initRegistrations,
    initProfile: initProfile,
    initLanding: initLanding
  };
})(typeof window !== 'undefined' ? window : globalThis);
