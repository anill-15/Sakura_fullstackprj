/* =============================================================
   SkillNest - js/ui.js
   Reusable UI helpers: toasts, modals, form errors, formatting.
   Shared by the landing, user and admin modules.
   ============================================================= */
(function (global) {
  'use strict';

  const doc = global.document;

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------------- Formatting ---------------- */
  const escapeHtml = (value) =>
    String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const text = String(value).trim();
if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
   const parts = text.split('-').map(Number);
   const [year, month, day] = parts;
   const date = new Date(year, month - 1, day);
   /* Reject impossible dates such as 2025-02-30 that would otherwise
      silently roll over into the following month. */
   if (
     date.getFullYear() !== year ||
     date.getMonth() !== month - 1 ||
     date.getDate() !== day
   ) {
     return null;
   }
   return date;
   }
    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (value, style) => {
    const date = parseDate(value);
    if (!date) return 'Not available';
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    if (style === 'short') return day + ' ' + MONTHS_SHORT[date.getMonth()] + ' ' + year;
    if (style === 'long') return day + ' ' + month + ' ' + year;
    return day + ' ' + month + ' ' + year;
  };

  const formatTime = (value) => {
    if (!value) return '--:--';
    const [hours, minutes] = String(value).split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (isNaN(h) || isNaN(m)) return String(value);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return display + ':' + String(m).padStart(2, '0') + ' ' + suffix;
  };

  const formatDateTime = (value) => {
    const date = parseDate(value);
    if (!date) return 'Not available';
    const hours = date.getHours();
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const display = hours % 12 === 0 ? 12 : hours % 12;
    return formatDate(date) + ', ' + display + ':' + String(date.getMinutes()).padStart(2, '0') + ' ' + suffix;
  };

  const timeAgo = (value) => {
    const date = parseDate(value);
    if (!date) return 'Not available';
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return minutes + ' minute' + (minutes === 1 ? '' : 's') + ' ago';
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';
    const days = Math.round(hours / 24);
    if (days < 30) return days + ' day' + (days === 1 ? '' : 's') + ' ago';
    return formatDate(date);
  };

const to24Hour = (value) => {
   if (!value) return null;
   const text = String(value).trim();
   if (!/^\d{1,2}:\d{2}$/.test(text)) return null;
   const [hours, minutes] = text.split(':').map(Number);
   if (isNaN(hours) || isNaN(minutes)) return null;
   if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
   return hours * 60 + minutes;
   };

  const initials = (name) => {
    const parts = String(name || 'User').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  /** True when a value is null, undefined, or only whitespace. */
  const isEmpty = (value) => value === null || value === undefined || String(value).trim() === '';

  /* ---------------- Badges ---------------- */
  const STATUS_META = {
    upcoming: { label: 'Upcoming', className: 'badge-upcoming' },
    ongoing: { label: 'Ongoing', className: 'badge-ongoing' },
    completed: { label: 'Completed', className: 'badge-completed' },
    cancelled: { label: 'Cancelled', className: 'badge-cancelled' },
    confirmed: { label: 'Confirmed', className: 'badge-confirmed' },
    event_removed: { label: 'Event Removed', className: 'badge-removed' }
  };

  const statusBadge = (status) => {
    const meta = STATUS_META[status] || { label: status || 'Unknown', className: 'badge-neutral' };
    return '<span class="badge ' + meta.className + '">' + escapeHtml(meta.label) + '</span>';
  };

  /* ---------------- Toasts ---------------- */
  const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    error: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>',
    warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2zm0-4h-2v-4h2z"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>'
  };

  const toastHost = () => {
    let host = doc.getElementById('toastHost');
    if (!host) {
      host = doc.createElement('div');
      host.id = 'toastHost';
      host.className = 'toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      doc.body.appendChild(host);
    }
    return host;
  };

  const toast = (message, type, duration) => {
    if (!doc || !doc.body) return null;
    const kind = type || 'info';
    const host = toastHost();
    const node = doc.createElement('div');
    node.className = 'toast toast-' + kind;
    node.innerHTML =
      '<span class="toast-icon" aria-hidden="true">' + (TOAST_ICONS[kind] || TOAST_ICONS.info) + '</span>' +
      '<p class="toast-message">' + escapeHtml(message) + '</p>' +
      '<button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>';

    const dismiss = () => {
      node.classList.add('toast-hide');
      global.setTimeout(() => node.remove(), 260);
    };
    node.querySelector('.toast-close').addEventListener('click', dismiss);
    host.appendChild(node);
    global.requestAnimationFrame(() => node.classList.add('toast-show'));
    global.setTimeout(dismiss, duration || 3600);
    return node;
  };

  const toastSuccess = (m, d) => toast(m, 'success', d);
  const toastError = (m, d) => toast(m, 'error', d || 4600);
  const toastWarning = (m, d) => toast(m, 'warning', d || 4200);
  const toastInfo = (m, d) => toast(m, 'info', d);

  /* ---------------- Confirm modal ---------------- */
  const modalRoot = () => {
    let root = doc.getElementById('modalRoot');
    if (!root) {
      root = doc.createElement('div');
      root.id = 'modalRoot';
      root.className = 'modal-root';
      root.hidden = true;
      doc.body.appendChild(root);
    }
    return root;
  };

  const closeModal = () => {
    const root = modalRoot();
    root.hidden = true;
    root.innerHTML = '';
    doc.body.classList.remove('modal-open');
  };

  /**
   * Promise based confirmation dialog used for destructive actions.
   * Resolves true when confirmed, false when dismissed.
   */
  const confirmDialog = (options) => {
    const config = Object.assign(
      {
        title: 'Please confirm',
        message: 'Are you sure you want to continue?',
        detail: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        tone: 'danger'
      },
      options || {}
    );

    if (!doc || !doc.body) return Promise.resolve(global.confirm ? global.confirm(config.message) : false);

    return new Promise((resolve) => {
      const root = modalRoot();
      root.hidden = false;
      root.innerHTML =
        '<div class="modal-backdrop" data-modal-close="true"></div>' +
        '<div class="modal modal-' + escapeHtml(config.tone) + '" role="alertdialog" aria-modal="true" aria-labelledby="modalTitle" aria-describedby="modalMessage">' +
        '<div class="modal-header">' +
        '<h3 id="modalTitle">' + escapeHtml(config.title) + '</h3>' +
        '<button type="button" class="modal-close" data-modal-close="true" aria-label="Close dialog">&times;</button>' +
        '</div>' +
        '<div class="modal-body">' +
        '<p id="modalMessage">' + escapeHtml(config.message) + '</p>' +
        (config.detail ? '<p class="modal-detail">' + escapeHtml(config.detail) + '</p>' : '') +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-ghost" data-modal-cancel="true">' + escapeHtml(config.cancelText) + '</button>' +
        '<button type="button" class="btn btn-' + escapeHtml(config.tone) + '" data-modal-confirm="true">' + escapeHtml(config.confirmText) + '</button>' +
        '</div>' +
        '</div>';

      doc.body.classList.add('modal-open');
      const confirmBtn = root.querySelector('[data-modal-confirm="true"]');
      const done = (value) => {
        closeModal();
        doc.removeEventListener('keydown', onKey);
        resolve(value);
      };
      const onKey = (event) => {
        if (event.key === 'Escape') done(false);
      };

      root.querySelectorAll('[data-modal-close="true"]').forEach((el) => el.addEventListener('click', () => done(false)));
      root.querySelector('[data-modal-cancel="true"]').addEventListener('click', () => done(false));
      confirmBtn.addEventListener('click', () => done(true));
      doc.addEventListener('keydown', onKey);
      global.setTimeout(() => confirmBtn.focus(), 40);
    });
  };

  /**
   * Generic content modal (used for event details).
   */
  const modal = (options) => {
    const config = Object.assign({ title: 'Details', body: '', footer: '' }, options || {});
    const root = modalRoot();
    root.hidden = false;
    root.innerHTML =
      '<div class="modal-backdrop" data-modal-close="true"></div>' +
      '<div class="modal modal-lg" role="dialog" aria-modal="true" aria-label="' + escapeHtml(config.title) + '">' +
      '<div class="modal-header">' +
      '<h3>' + escapeHtml(config.title) + '</h3>' +
      '<button type="button" class="modal-close" data-modal-close="true" aria-label="Close dialog">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' + config.body + '</div>' +
      '<div class="modal-footer">' + config.footer + '</div>' +
      '</div>';
    doc.body.classList.add('modal-open');
    const onKey = (event) => {
      if (event.key === 'Escape') {
        closeModal();
        doc.removeEventListener('keydown', onKey);
      }
    };
    root.querySelectorAll('[data-modal-close="true"]').forEach((el) =>
      el.addEventListener('click', () => {
        closeModal();
        doc.removeEventListener('keydown', onKey);
      })
    );
    doc.addEventListener('keydown', onKey);
    return root;
  };

  /* ---------------- Form helpers ---------------- */
  const setFieldError = (input, message) => {
    if (!input) return;
    const field = input.closest('.form-field') || input.parentElement;
    const errorNode = field ? field.querySelector('.field-error') : null;
    if (message) {
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');
      if (errorNode) errorNode.textContent = message;
    } else {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
      if (errorNode) errorNode.textContent = '';
    }
  };

  const clearFormErrors = (form) => {
    if (!form) return;
    form.querySelectorAll('.input-error').forEach((el) => {
      el.classList.remove('input-error');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.field-error').forEach((el) => {
      el.textContent = '';
    });
    const summary = form.querySelector('.form-alert');
    if (summary) {
      summary.textContent = '';
      summary.hidden = true;
    }
  };

  const showFormAlert = (form, message, type) => {
    if (!form) return;
    let alert = form.querySelector('.form-alert');
    if (!alert) {
      alert = doc.createElement('div');
      alert.className = 'form-alert';
      alert.setAttribute('role', 'alert');
      const firstField = form.querySelector('.form-field');
      if (firstField) form.insertBefore(alert, firstField);
      else form.insertBefore(alert, form.firstChild);
    }
    alert.className = 'form-alert form-alert-' + (type || 'error');
    alert.textContent = message;
    alert.hidden = false;
  };

  const applyFieldErrors = (form, errors) => {
    Object.entries(errors || {}).forEach(([fieldName, message]) => {
      const input = form.querySelector('[name="' + fieldName + '"]');
      setFieldError(input, message);
    });
    const firstKey = Object.keys(errors || {})[0];
    if (firstKey) {
      const input = form.querySelector('[name="' + firstKey + '"]');
      if (input) input.focus();
    }
  };

  const getFormData = (form) => {
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    return data;
  };

  /* ---------------- Misc ---------------- */
  const debounce = (fn, delay) => {
    let timer = null;
    return (...args) => {
      global.clearTimeout(timer);
      timer = global.setTimeout(() => fn(...args), delay || 200);
    };
  };

  const emptyState = (title, message, actionHtml) =>
    '<div class="empty-state">' +
    '<div class="empty-icon" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5zm0 7.5L4.2 6 12 2.5 19.8 6 12 9.5zM2 12l10 5 10-5v2l-10 5L2 14v-2zm0 5 10 5 10-5v2l-10 5-10-5v-2z"/></svg>' +
    '</div>' +
    '<h3>' + escapeHtml(title) + '</h3>' +
    '<p>' + escapeHtml(message) + '</p>' +
    (actionHtml ? '<div class="empty-actions">' + actionHtml + '</div>' : '') +
    '</div>';

  global.YGE.ui = {
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
    timeAgo: timeAgo,
    parseDate: parseDate,
    to24Hour: to24Hour,
    isEmpty: isEmpty,
    initials: initials,
    statusBadge: statusBadge,
    toast: toast,
    toastSuccess: toastSuccess,
    toastError: toastError,
    toastWarning: toastWarning,
    toastInfo: toastInfo,
    confirmDialog: confirmDialog,
    modal: modal,
    closeModal: closeModal,
    setFieldError: setFieldError,
    clearFormErrors: clearFormErrors,
    showFormAlert: showFormAlert,
    applyFieldErrors: applyFieldErrors,
    getFormData: getFormData,
    debounce: debounce,
    emptyState: emptyState
  };
})(typeof window !== 'undefined' ? window : globalThis);
