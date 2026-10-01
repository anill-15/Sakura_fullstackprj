/* =============================================================
   SkillNest - js/admin.js
   Administrator module logic: statistics, user management,
   event CRUD screens and the platform registration overview.
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

  const ICONS = {
    users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V21h8v-2.5C9 15 11 14 13 14zm8 0v2.5V21h8v-3.5c0-2.3-4.7-3.5-7-3.5z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v9H5v-9h14z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V8a2 2 0 0 1 2-2zm8 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-5v-2h3V6h2v7z"/></svg>',
    live: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4a8 8 0 0 0-.7-3.2l1.5-1.2-2-3.4-1.8.7A9 9 0 0 0 15.4 3l-.4-2h-4l-.4 2a9 9 0 0 0-2.6 1.6l-1.8-.7-2 3.4L5.7 8.8A8 8 0 0 0 5 12a8 8 0 0 0 .7 3.2l-1.5 1.2 2 3.4 1.8-.7a9 9 0 0 0 2.6 1.6l.4 2h4l.4-2a9 9 0 0 0 2.6-1.6l1.8.7 2-3.4-1.5-1.2A8 8 0 0 0 19 12z"/></svg>'
  };

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

  /* =============================================================
     Statistics
     ============================================================= */
  const getPlatformStats = () => {
    const users = store.getUsers();
    const events = eventsApi.getEvents().map(eventsApi.withStatus);
    const registrations = store.getRegistrations();
    const active = registrations.filter(eventsApi.isRegistrationActive);

    return {
      totalUsers: users.length,
      learnerUsers: users.filter((user) => user.role === 'user').length,
      adminUsers: users.filter((user) => user.role === 'admin').length,
      totalEvents: events.length,
      upcomingEvents: events.filter((event) => event.computedStatus === 'upcoming').length,
      ongoingEvents: events.filter((event) => event.computedStatus === 'ongoing').length,
      completedEvents: events.filter((event) => event.computedStatus === 'completed').length,
      cancelledEvents: events.filter((event) => event.computedStatus === 'cancelled').length,
      totalRegistrations: active.length,
      cancelledRegistrations: registrations.length - active.length,
      totalSeats: events.reduce((sum, event) => sum + Number(event.maxParticipants || 0), 0),
      filledSeats: active.length
    };
  };

  /* =============================================================
     Admin dashboard
     ============================================================= */
  const initDashboard = () => {
    const admin = navigation.guard('admin');
    if (!admin) return;
    navigation.mountShell('admin', 'dashboard.html');

    const stats = getPlatformStats();

    const heading = $('#adminGreeting');
    if (heading) {
      const hour = new Date().getHours();
      const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      heading.textContent = part + ', ' + admin.name;
    }
    const sub = $('#adminGreetingSub');
    if (sub) {
      sub.textContent =
        stats.upcomingEvents + ' upcoming session(s) · ' + stats.totalRegistrations + ' active registration(s) · ' + stats.learnerUsers + ' registered learner(s)';
    }

    renderStatCards($('#adminStats'), [
      { label: 'Total Users', value: stats.totalUsers, hint: stats.learnerUsers + ' learners, ' + stats.adminUsers + ' admin', icon: ICONS.users, tone: 'primary' },
      { label: 'Total Events', value: stats.totalEvents, hint: stats.cancelledEvents + ' cancelled', icon: ICONS.calendar, tone: 'info' },
      { label: 'Registrations', value: stats.totalRegistrations, hint: stats.cancelledRegistrations + ' cancelled records', icon: ICONS.ticket, tone: 'success' },
      { label: 'Upcoming Events', value: stats.upcomingEvents, hint: stats.ongoingEvents + ' ongoing now', icon: ICONS.clock, tone: 'warning' },
      { label: 'Completed Events', value: stats.completedEvents, hint: 'Sessions finished', icon: ICONS.check, tone: 'success' },
      { label: 'Seat Occupancy', value: (stats.totalSeats ? Math.round((stats.filledSeats / stats.totalSeats) * 100) : 0) + '%', hint: stats.filledSeats + ' of ' + stats.totalSeats + ' seats', icon: ICONS.live, tone: 'info' }
    ]);

    /* Popular events */
    const popularHost = $('#popularEvents');
    if (popularHost) {
      const rows = eventsApi
        .getEvents()
        .map((event) => ({ event: event, count: eventsApi.getActiveRegistrationsForEvent(event.id).length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const max = Math.max(1, ...rows.map((row) => row.count));
      popularHost.innerHTML = rows
        .map(
          (row) =>
            '<li class="bar-row">' +
            '<div class="bar-head"><span>' + ui.escapeHtml(row.event.title) + '</span><strong>' + row.count + '</strong></div>' +
            '<div class="bar-track"><span class="bar-fill" style="width:' + Math.round((row.count / max) * 100) + '%"></span></div>' +
            '</li>'
        )
        .join('');
    }

    /* Recent registrations */
    const recentHost = $('#recentRegistrations');
    if (recentHost) {
      const rows = store
        .getRegistrations()
        .slice()
        .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))
        .slice(0, 6);
      recentHost.innerHTML = rows.length
        ? rows
            .map((reg) => {
              const event = eventsApi.getEventById(reg.eventId);
              const status = event ? event.computedStatus : reg.status;
              return (
                '<tr>' +
                '<td data-label="Registration ID"><strong>' + ui.escapeHtml(reg.id) + '</strong></td>' +
                '<td data-label="Learner">' + ui.escapeHtml(reg.userName) + '<small class="cell-sub">' + ui.escapeHtml(reg.userEmail) + '</small></td>' +
                '<td data-label="Event">' + ui.escapeHtml(event ? event.title : reg.eventTitle || 'Removed event') + '</td>' +
                '<td data-label="Registered">' + ui.escapeHtml(ui.formatDate(reg.registeredAt)) + '</td>' +
                '<td data-label="Status">' + ui.statusBadge(status === 'cancelled' ? 'cancelled' : status) + '</td>' +
                '</tr>'
              );
            })
            .join('')
        : ui.emptyState('No registrations yet', 'Registrations made by learners will appear here.');
    }

    /* Upcoming events */
    const upcomingHost = $('#upcomingEvents');
    if (upcomingHost) {
      const rows = eventsApi.getSortedEvents({ filter: 'upcoming' }).slice(0, 5);
      upcomingHost.innerHTML = rows.length
        ? rows
            .map(
              (event) =>
                '<li class="list-row">' +
                '<div class="list-row-main">' +
                '<strong>' + ui.escapeHtml(event.title) + '</strong>' +
                '<small>' + ui.escapeHtml(ui.formatDate(event.date)) + ' · ' + ui.escapeHtml(ui.formatTime(event.startTime)) + ' · ' + ui.escapeHtml(event.trainer) + '</small>' +
                '</div>' +
                '<div class="list-row-side">' + ui.statusBadge(event.computedStatus) +
                '<span class="seats">' + eventsApi.getAvailableSeats(event.id) + ' seats left</span>' +
                '</div>' +
                '</li>'
            )
            .join('')
        : ui.emptyState('Nothing scheduled', 'Create a training event to get started.');
    }
  };

  /* =============================================================
     Admin - event manager (create / read / update / delete)
     ============================================================= */
  let adminEventState = { search: '', category: 'all', status: 'all' };
  let adminEventRefresh = null;

  const populateEventFormOptions = () => {
    const categorySelect = $('#eventCategory');
    const modeSelect = $('#eventMode');
    const statusSelect = $('#eventStatus');

    if (categorySelect) {
      categorySelect.innerHTML =
        '<option value="">Select a category</option>' +
        eventsApi.getCategories().map((category) => '<option value="' + ui.escapeHtml(category) + '">' + ui.escapeHtml(category) + '</option>').join('');
    }
    if (modeSelect) {
      modeSelect.innerHTML =
        '<option value="">Select a mode</option>' +
        eventsApi.MODES.map((mode) => '<option value="' + ui.escapeHtml(mode) + '">' + ui.escapeHtml(mode) + '</option>').join('');
    }
    if (statusSelect) {
      statusSelect.innerHTML =
        eventsApi.STATUSES.map(
          (status) => '<option value="' + status + '">' + status.charAt(0).toUpperCase() + status.slice(1) + '</option>'
        ).join('');
    }
  };

  const showEventForm = (eventId) => {
    const form = $('#eventForm');
    const panel = $('#eventFormPanel');
    const heading = $('#eventFormTitle');
    const resetBtn = $('[data-action="reset-event-form"]');
    if (!form || !panel) return;

    ui.clearFormErrors(form);
    form.reset();
    populateEventFormOptions();

    const editing = eventId ? eventsApi.getEventById(eventId) : null;
    if (editing) {
      form.dataset.eventId = editing.id;
      if (heading) heading.textContent = 'Edit training event';
      $('#eventTitle').value = editing.title;
      $('#eventDescription').value = editing.description;
      $('#eventCategory').value = editing.category;
      $('#eventTrainer').value = editing.trainer;
      $('#eventDate').value = editing.date;
      $('#eventStartTime').value = editing.startTime;
      $('#eventEndTime').value = editing.endTime;
      $('#eventDuration').value = editing.duration || '';
      $('#eventMode').value = editing.mode;
      $('#eventVenue').value = editing.venueOrLink || '';
      $('#eventCapacity').value = editing.maxParticipants;
      $('#eventStatus').value = editing.status || 'upcoming';
      if (resetBtn) resetBtn.textContent = 'Cancel editing';
    } else {
      delete form.dataset.eventId;
      if (heading) heading.textContent = 'Create a new training event';
      if (resetBtn) resetBtn.textContent = 'Reset form';
      const statusField = $('#eventStatus');
      if (statusField) statusField.value = 'upcoming';
      const pad = (n) => String(n).padStart(2, '0');
      const dateInput = $('#eventDate');
      if (dateInput && !dateInput.value) {
        /* Default to one week from today, letting the Date object roll over
           month/year boundaries instead of producing 32 or 31. */
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        dateInput.value =
          nextWeek.getFullYear() + '-' + pad(nextWeek.getMonth() + 1) + '-' + pad(nextWeek.getDate());
      }
    }

    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const firstField = $('#eventTitle');
    if (firstField) firstField.focus();
  };

  const hideEventForm = () => {
    const form = $('#eventForm');
    const panel = $('#eventFormPanel');
    if (form) {
      form.reset();
      delete form.dataset.eventId;
      ui.clearFormErrors(form);
      populateEventFormOptions();
    }
    if (panel) panel.hidden = true;
  };

  const readEventForm = (form) => {
    const data = ui.getFormData(form);
    return {
      title: data.title || '',
      description: data.description || '',
      category: data.category || '',
      trainer: data.trainer || '',
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      duration: data.duration || '',
      mode: data.mode || '',
      venueOrLink: data.venueOrLink || '',
      maxParticipants: data.maxParticipants === undefined ? '' : String(data.maxParticipants).trim(),
      status: data.status || 'upcoming'
    };
  };

  const wireEventForm = () => {
    const form = $('#eventForm');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      ui.clearFormErrors(form);
      const payload = readEventForm(form);
      const editingId = form.dataset.eventId;

      const result = editingId ? eventsApi.updateEvent(editingId, payload) : eventsApi.addEvent(payload);

      if (result.success) {
        ui.toastSuccess(result.message);
        hideEventForm();
        if (typeof adminEventRefresh === 'function') adminEventRefresh();
        if ($('#adminStats')) {
          const stats = getPlatformStats();
          const node = $('#adminStats');
          node.innerHTML = '';
          renderStatCards(node, [
            { label: 'Total Users', value: stats.totalUsers, hint: stats.learnerUsers + ' learners', icon: ICONS.users, tone: 'primary' },
            { label: 'Total Events', value: stats.totalEvents, hint: stats.cancelledEvents + ' cancelled', icon: ICONS.calendar, tone: 'info' },
            { label: 'Registrations', value: stats.totalRegistrations, hint: 'Active records', icon: ICONS.ticket, tone: 'success' },
            { label: 'Upcoming', value: stats.upcomingEvents, hint: stats.ongoingEvents + ' ongoing', icon: ICONS.clock, tone: 'warning' }
          ]);
        }
      } else {
        ui.toastError(result.message);
        ui.applyFieldErrors(form, result.errors);
      }
    });

    const resetBtn = $('[data-action="reset-event-form"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (form.dataset.eventId) hideEventForm();
        else {
          form.reset();
          ui.clearFormErrors(form);
          populateEventFormOptions();
          const statusField = $('#eventStatus');
          if (statusField) statusField.value = 'upcoming';
        }
      });
    }

    const cancelBtn = $('[data-action="close-event-form"]');
    if (cancelBtn) cancelBtn.addEventListener('click', hideEventForm);
  };

  const deleteEventById = async (eventId) => {
    const event = eventsApi.getEventById(eventId);
    if (!event) {
      ui.toastError('Event not found.');
      return;
    }
    const registrations = eventsApi.getEventRegistrations(eventId, true);
    const confirmed = await ui.confirmDialog({
      title: 'Delete training event?',
      message: 'Delete "' + event.title + '"?',
      detail: registrations.length
        ? registrations.length + ' registration record(s) linked to this event will also be removed. This action cannot be undone.'
        : 'This action cannot be undone.',
      confirmText: 'Delete event',
      cancelText: 'Keep event',
      tone: 'danger'
    });
    if (!confirmed) return;

    const result = eventsApi.deleteEvent(eventId);
    if (result.success) {
      /* Registrations are flagged `event_removed`, not deleted, so the seats are
       released and the history stays visible. */
    ui.toastSuccess(result.message + (result.removedRegistrations ? ' ' + result.removedRegistrations + ' registration(s) marked Event Removed and seats released.' : ''));
      const form = $('#eventForm');
      if (form && form.dataset.eventId === eventId) hideEventForm();
      if (typeof adminEventRefresh === 'function') adminEventRefresh();
    } else {
      ui.toastError(result.message);
    }
  };

  const showEventRegistrations = (eventId) => {
    const event = eventsApi.getEventById(eventId);
    if (!event) {
      ui.toastError('Event not found.');
      return;
    }
    const registrations = eventsApi.sortByDate(
      eventsApi.getEventRegistrations(eventId, true).map((reg) => {
        const rowEvent = eventsApi.getEventById(reg.eventId);
        return Object.assign({}, reg, { date: rowEvent ? rowEvent.date : reg.eventDate, startTime: rowEvent ? rowEvent.startTime : '00:00' });
      })
    );

    const body = registrations.length
      ? '<div class="table-wrap"><table class="data-table">' +
        '<caption class="sr-only">Registrations for ' + ui.escapeHtml(event.title) + '</caption>' +
        '<thead><tr><th>ID</th><th>Learner</th><th>Email</th><th>Registered</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
        registrations
          .map(
            (reg) =>
              '<tr>' +
              '<td data-label="ID">' + ui.escapeHtml(reg.id) + '</td>' +
              '<td data-label="Learner">' + ui.escapeHtml(reg.userName) + '</td>' +
              '<td data-label="Email">' + ui.escapeHtml(reg.userEmail) + '</td>' +
              '<td data-label="Registered">' + ui.escapeHtml(ui.formatDate(reg.registeredAt)) + '</td>' +
              '<td data-label="Status">' + ui.statusBadge(reg.status) + '</td>' +
              '<td data-label="Action" class="table-actions">' +
              (eventsApi.isRegistrationActive(reg)
                ? '<button type="button" class="btn btn-xs btn-danger-outline" data-action="admin-cancel-registration" data-registration-id="' + reg.id + '" data-event-id="' + event.id + '">Cancel</button>'
                : '<span class="muted-text">Closed</span>') +
              '</td></tr>'
          )
          .join('') +
        '</tbody></table></div>'
      : ui.emptyState('No registrations', 'No learner has registered for this session yet.');

    ui.modal({
      title: 'Registrations · ' + event.title,
      body: body,
      footer: '<button type="button" class="btn btn-ghost" data-modal-close="true">Close</button>'
    });

    $$('[data-action="admin-cancel-registration"]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = eventsApi.cancelRegistration(button.getAttribute('data-registration-id'), null, true);
        if (result.success) {
          ui.toastSuccess(result.message);
          ui.closeModal();
          if (typeof adminEventRefresh === 'function') adminEventRefresh();
        } else {
          ui.toastError(result.message);
        }
      });
    });
  };

  const initAdminEvents = () => {
    const admin = navigation.guard('admin');
    if (!admin) return;
    navigation.mountShell('admin', 'events.html');

    populateEventFormOptions();
    wireEventForm();

    const searchInput = $('#adminEventSearch');
    const categorySelect = $('#adminCategoryFilter');
    const statusSelect = $('#adminStatusFilter');
    const tbody = $('#adminEventRows');
    const countLabel = $('#adminEventCount');
    const formPanel = $('#eventFormPanel');

    if (formPanel) formPanel.hidden = true;

    if (categorySelect) {
      categorySelect.innerHTML =
        '<option value="all">All categories</option>' +
        eventsApi.getCategories().map((category) => '<option value="' + ui.escapeHtml(category) + '">' + ui.escapeHtml(category) + '</option>').join('');
      categorySelect.addEventListener('change', (event) => {
        adminEventState.category = event.target.value;
        paint();
      });
    }
    if (statusSelect) {
      statusSelect.innerHTML =
        '<option value="all">All statuses</option>' +
        eventsApi.STATUSES.map((status) => '<option value="' + status + '">' + status.charAt(0).toUpperCase() + status.slice(1) + '</option>').join('');
      statusSelect.addEventListener('change', (event) => {
        adminEventState.status = event.target.value;
        paint();
      });
    }
    if (searchInput) {
      searchInput.addEventListener(
        'input',
        ui.debounce((event) => {
          adminEventState.search = event.target.value;
          paint();
        }, 200)
      );
    }

    const paint = () => {
      const list = eventsApi.getSortedEvents({
        search: adminEventState.search,
        category: adminEventState.category,
        filter: adminEventState.status
      });

      if (countLabel) {
        countLabel.textContent = list.length + ' of ' + eventsApi.getEvents().length + ' event(s) shown';
      }
      if (!tbody) return;

      tbody.innerHTML = list.length
        ? list.map(eventsApi.renderEventRow).join('')
        : '<tr><td colspan="8" class="table-empty">No events match your filters.</td></tr>';

      $$('[data-action="edit-event"]', tbody).forEach((button) => {
        button.addEventListener('click', () => showEventForm(button.getAttribute('data-event-id')));
      });
      $$('[data-action="delete-event"]', tbody).forEach((button) => {
        button.addEventListener('click', () => deleteEventById(button.getAttribute('data-event-id')));
      });

      const cardHost = $('#adminEventCards');
      if (cardHost) {
        cardHost.innerHTML = list
          .map((event) => eventsApi.renderEventCard(event, { showAdminActions: true }))
          .join('');
        $$('[data-action="edit-event"]', cardHost).forEach((button) => {
          button.addEventListener('click', () => showEventForm(button.getAttribute('data-event-id')));
        });
        $$('[data-action="delete-event"]', cardHost).forEach((button) => {
          button.addEventListener('click', () => deleteEventById(button.getAttribute('data-event-id')));
        });
        $$('[data-action="event-registrations"]', cardHost).forEach((button) => {
          button.addEventListener('click', () => showEventRegistrations(button.getAttribute('data-event-id')));
        });
        $$('[data-action="details"]', cardHost).forEach((button) => {
          button.addEventListener('click', () => global.YGE.user.openEventDetails(button.getAttribute('data-event-id')));
        });
      }
    };

    const addBtn = $('[data-action="add-event"]');
    if (addBtn) addBtn.addEventListener('click', () => showEventForm(null));

    paint();
    adminEventRefresh = paint;
  };

  /* =============================================================
     Admin - user manager
     ============================================================= */
  const deleteUser = async (userId, currentAdmin) => {
    const target = store.getUserById(userId);
    if (!target) {
      ui.toastError('User not found.');
      return;
    }
    if (target.role === 'admin') {
      ui.toastError('Administrator accounts cannot be deleted.');
      return;
    }
    if (userId === currentAdmin.id) {
      ui.toastError('You cannot delete your own account.');
      return;
    }

    const regs = eventsApi.getUserRegistrations(userId);
    const confirmed = await ui.confirmDialog({
      title: 'Delete user?',
      message: 'Delete "' + target.name + '" (' + target.email + ')?',
      detail: regs.length
        ? regs.length + ' active registration(s) of this learner will be released. This action cannot be undone.'
        : 'This action cannot be undone.',
      confirmText: 'Delete user',
      cancelText: 'Keep user',
      tone: 'danger'
    });
    if (!confirmed) return;

    const users = store.getUsers().filter((user) => user.id !== userId);
    store.saveUsers(users);

    const registrations = store.getRegistrations();
    const kept = registrations.filter((reg) => reg.userId !== userId);
    store.saveRegistrations(kept);

    ui.toastSuccess('User deleted successfully.' + (registrations.length - kept.length ? ' ' + (registrations.length - kept.length) + ' registration(s) released.' : ''));
    if (typeof adminUsersRefresh === 'function') adminUsersRefresh();
  };

  let adminUsersRefresh = null;

  const showUserDetails = (userId) => {
    const user = store.getUserById(userId);
    if (!user) {
      ui.toastError('User not found.');
      return;
    }
    const registrations = store
      .getRegistrations()
      .filter((reg) => reg.userId === user.id)
      .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));

    const body =
      '<dl class="detail-grid">' +
      '<div><dt>User ID</dt><dd>' + ui.escapeHtml(user.id) + '</dd></div>' +
      '<div><dt>Full name</dt><dd>' + ui.escapeHtml(user.name) + '</dd></div>' +
      '<div><dt>Email</dt><dd>' + ui.escapeHtml(user.email) + '</dd></div>' +
      '<div><dt>Phone</dt><dd>' + ui.escapeHtml(user.phone) + '</dd></div>' +
      '<div><dt>Role</dt><dd>' + ui.escapeHtml(user.role) + '</dd></div>' +
      '<div><dt>Registered on</dt><dd>' + ui.escapeHtml(ui.formatDateTime(user.createdAt)) + '</dd></div>' +
      '<div><dt>Total registrations</dt><dd>' + registrations.length + '</dd></div>' +
      '<div><dt>Active registrations</dt><dd>' + eventsApi.getUserRegistrations(user.id).length + '</dd></div>' +
      '</dl>' +
      '<h4 class="modal-subhead">Registration history</h4>' +
      (registrations.length
        ? '<ul class="mini-list">' +
          registrations
            .slice(0, 8)
            .map((reg) => {
              const event = eventsApi.getEventById(reg.eventId);
              return (
                '<li><span>' + ui.escapeHtml(reg.id) + '</span><span>' + ui.escapeHtml(event ? event.title : reg.eventTitle || 'Removed event') + '</span>' +
                '<span>' + ui.escapeHtml(ui.formatDate(reg.registeredAt)) + '</span>' + ui.statusBadge(reg.status) + '</li>'
              );
            })
            .join('') +
          '</ul>'
        : '<p class="muted-text">This user has no registrations yet.</p>');

    ui.modal({
      title: 'User details',
      body: body,
      footer: '<button type="button" class="btn btn-ghost" data-modal-close="true">Close</button>'
    });
  };

  const initAdminUsers = () => {
    const admin = navigation.guard('admin');
    if (!admin) return;
    navigation.mountShell('admin', 'users.html');

    const searchInput = $('#adminUserSearch');
    const roleSelect = $('#adminUserRole');
    const tbody = $('#adminUserRows');
    const countLabel = $('#adminUserCount');
    const state = { search: '', role: 'all' };

    if (roleSelect) {
      roleSelect.addEventListener('change', (event) => {
        state.role = event.target.value;
        paint();
      });
    }
    if (searchInput) {
      searchInput.addEventListener(
        'input',
        ui.debounce((event) => {
          state.search = event.target.value;
          paint();
        }, 200)
      );
    }

    const paint = () => {
      const allUsers = store.getUsers();
      let list = allUsers.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));

      if (state.role !== 'all') list = list.filter((user) => user.role === state.role);
      if (state.search) {
        const needle = state.search.toLowerCase();
        list = list.filter((user) => [user.name, user.email, user.phone, user.id].join(' ').toLowerCase().includes(needle));
      }

      if (countLabel) countLabel.textContent = list.length + ' of ' + allUsers.length + ' user(s) shown';

      if (!tbody) return;
      tbody.innerHTML = list.length
        ? list
            .map((user) => {
              const regs = eventsApi.getUserRegistrations(user.id).length;
              const isProtected = user.role === 'admin';
              return (
                '<tr data-user-id="' + user.id + '">' +
                '<td data-label="User ID"><strong>' + ui.escapeHtml(user.id) + '</strong></td>' +
                '<td data-label="Name"><span class="cell-user"><span class="avatar avatar-xs" aria-hidden="true">' + ui.initials(user.name) + '</span>' +
                '<span>' + ui.escapeHtml(user.name) + '</span></span></td>' +
                '<td data-label="Email">' + ui.escapeHtml(user.email) + '</td>' +
                '<td data-label="Phone">' + ui.escapeHtml(user.phone) + '</td>' +
                '<td data-label="Role"><span class="badge ' + (isProtected ? 'badge-role-admin' : 'badge-role-user') + '">' +
                (isProtected ? 'Admin' : 'Learner') + '</span></td>' +
                '<td data-label="Registered on">' + ui.escapeHtml(ui.formatDate(user.createdAt)) + '</td>' +
                '<td data-label="Registrations">' + regs + '</td>' +
                '<td data-label="Actions" class="table-actions">' +
                '<button type="button" class="btn btn-xs btn-outline" data-action="view-user" data-user-id="' + user.id + '">View</button>' +
                '<button type="button" class="btn btn-xs btn-danger-outline" data-action="delete-user" data-user-id="' + user.id + '"' +
                (isProtected ? ' disabled title="Administrator accounts are protected"' : '') + '>Delete</button>' +
                '</td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="8" class="table-empty">No users match your filters.</td></tr>';

      $$('[data-action="view-user"]', tbody).forEach((button) => {
        button.addEventListener('click', () => showUserDetails(button.getAttribute('data-user-id')));
      });
      $$('[data-action="delete-user"]', tbody).forEach((button) => {
        button.addEventListener('click', () => {
          if (button.disabled) {
            ui.toastWarning('Administrator accounts cannot be deleted.');
            return;
          }
          deleteUser(button.getAttribute('data-user-id'), admin);
        });
      });
    };

    paint();
    adminUsersRefresh = paint;
  };

  /* =============================================================
     Admin - registration manager
     ============================================================= */
  const initAdminRegistrations = () => {
    const admin = navigation.guard('admin');
    if (!admin) return;
    navigation.mountShell('admin', 'registrations.html');

    const searchInput = $('#adminRegSearch');
    const eventSelect = $('#adminRegEvent');
    const userSelect = $('#adminRegUser');
    const statusSelect = $('#adminRegStatus');
    const tbody = $('#adminRegRows');
    const countLabel = $('#adminRegCount');
    const state = { search: '', eventId: 'all', userId: 'all', status: 'all' };

    if (eventSelect) {
      eventSelect.innerHTML =
        '<option value="all">All events</option>' +
        eventsApi
          .getEvents()
          .map((event) => '<option value="' + ui.escapeHtml(event.id) + '">' + ui.escapeHtml(event.title) + '</option>')
          .join('');
      eventSelect.addEventListener('change', (event) => {
        state.eventId = event.target.value;
        paint();
      });
    }
    if (userSelect) {
      userSelect.innerHTML =
        '<option value="all">All users</option>' +
        store
          .getUsers()
          .map((user) => '<option value="' + ui.escapeHtml(user.id) + '">' + ui.escapeHtml(user.name) + ' (' + ui.escapeHtml(user.email) + ')</option>')
          .join('');
      userSelect.addEventListener('change', (event) => {
        state.userId = event.target.value;
        paint();
      });
    }
    if (statusSelect) {
      statusSelect.innerHTML =
        '<option value="all">All statuses</option>' +
        ['confirmed', 'cancelled', 'event_removed']
          .map((status) => {
            const meta = status === 'confirmed' ? 'Confirmed' : status === 'cancelled' ? 'Cancelled' : 'Event Removed';
            return '<option value="' + status + '">' + meta + '</option>';
          })
          .join('');
      statusSelect.addEventListener('change', (event) => {
        state.status = event.target.value;
        paint();
      });
    }
    if (searchInput) {
      searchInput.addEventListener(
        'input',
        ui.debounce((event) => {
          state.search = event.target.value;
          paint();
        }, 200)
      );
    }

    const paint = () => {
      let rows = store.getRegistrations();

      if (state.eventId !== 'all') rows = rows.filter((reg) => reg.eventId === state.eventId);
      if (state.userId !== 'all') rows = rows.filter((reg) => reg.userId === state.userId);
      if (state.status !== 'all') rows = rows.filter((reg) => reg.status === state.status);
      if (state.search) {
        const needle = state.search.toLowerCase();
        rows = rows.filter((reg) => [reg.id, reg.userName, reg.userEmail, reg.eventTitle].join(' ').toLowerCase().includes(needle));
      }

      rows = rows.slice().sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));

      if (countLabel) {
        countLabel.textContent = rows.length + ' of ' + store.getRegistrations().length + ' registration record(s) shown';
      }

      const summaryHost = $('#registrationSummary');
      if (summaryHost) {
        const all = store.getRegistrations();
        summaryHost.innerHTML = [
          { label: 'Total Records', value: all.length, tone: 'accent' },
          { label: 'Confirmed', value: all.filter((reg) => reg.status === 'confirmed').length, tone: 'success' },
          { label: 'Cancelled', value: all.filter((reg) => reg.status === 'cancelled').length, tone: 'warning' },
          { label: 'Event Removed', value: all.filter((reg) => reg.status === 'event_removed').length, tone: 'danger' }
        ]
          .map(
            (chip) =>
              '<div class="summary-chip summary-chip-' + chip.tone + '">' +
              '<p class="chip-label">' + ui.escapeHtml(chip.label) + '</p>' +
              '<p class="chip-value">' + chip.value + '</p>' +
              '</div>'
          )
          .join('');
      }

      if (!tbody) return;

      tbody.innerHTML = rows.length
        ? rows
            .map((reg) => {
              const event = eventsApi.getEventById(reg.eventId);
              return (
                '<tr data-registration-id="' + reg.id + '">' +
                '<td data-label="Registration ID"><strong>' + ui.escapeHtml(reg.id) + '</strong></td>' +
                '<td data-label="User">' + ui.escapeHtml(reg.userName) + '<small class="cell-sub">' + ui.escapeHtml(reg.userId) + '</small></td>' +
                '<td data-label="Email">' + ui.escapeHtml(reg.userEmail) + '</td>' +
                '<td data-label="Event">' + ui.escapeHtml(event ? event.title : reg.eventTitle || 'Removed event') + '<small class="cell-sub">' + ui.escapeHtml(reg.eventId) + '</small></td>' +
                '<td data-label="Event date">' + ui.escapeHtml(ui.formatDate(event ? event.date : reg.eventDate)) + '</td>' +
                '<td data-label="Registered on">' + ui.escapeHtml(ui.formatDate(reg.registeredAt)) + '</td>' +
                '<td data-label="Status">' + ui.statusBadge(reg.status) + '</td>' +
                '<td data-label="Actions" class="table-actions">' +
                (eventsApi.isRegistrationActive(reg) && event && eventsApi.computeStatus(event) !== 'completed'
                  ? '<button type="button" class="btn btn-xs btn-danger-outline" data-action="admin-cancel" data-registration-id="' + reg.id + '">Cancel</button>'
                  : '<span class="muted-text">-</span>') +
                '</td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="8" class="table-empty">No registrations match your filters.</td></tr>';

      $$('[data-action="admin-cancel"]', tbody).forEach((button) => {
        button.addEventListener('click', async () => {
          const confirmed = await ui.confirmDialog({
            title: 'Cancel registration?',
            message: 'Cancel registration ' + button.getAttribute('data-registration-id') + '?',
            detail: 'The seat will be released back to the event and the learner loses their place in the session.',
            confirmText: 'Cancel registration',
            cancelText: 'Keep it',
            tone: 'danger'
          });
          if (!confirmed) return;
          const result = eventsApi.cancelRegistration(button.getAttribute('data-registration-id'), null, true);
          if (result.success) {
            ui.toastSuccess(result.message);
            paint();
          } else {
            ui.toastError(result.message);
          }
        });
      });
    };

    paint();
  };

  global.YGE.admin = {
    getPlatformStats: getPlatformStats,
    renderStatCards: renderStatCards,
    initDashboard: initDashboard,
    initAdminEvents: initAdminEvents,
    initAdminUsers: initAdminUsers,
    initAdminRegistrations: initAdminRegistrations,
    showEventForm: showEventForm,
    hideEventForm: hideEventForm,
    showEventRegistrations: showEventRegistrations,
    showUserDetails: showUserDetails,
    deleteUser: deleteUser
  };
})(typeof window !== 'undefined' ? window : globalThis);
