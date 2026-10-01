/* =============================================================
   SkillNest - js/navigation.js
   Role based guards, shared module shell (sidebar + topbar),
   active navigation state, logout and safe relative links.
   ============================================================= */
(function (global) {
  'use strict';

  const doc = global.document;
  const store = global.YGE;
  const ui = global.YGE.ui;
  const auth = global.YGE.auth;

  const ROOT_PREFIX = './';
  const MODULE_PREFIX = '../';

  /* ---------------- Relative path safety ---------------- */
  /**
   * Depth is detected from the script tags of the current page so every
   * internal link can be written once as data-nav="user/dashboard.html"
   * and still resolve correctly from root/, user/ and admin/ pages.
   */
  const detectPrefix = () => {
    const scripts = Array.prototype.slice.call(doc.querySelectorAll('script[src]'));
    for (let i = 0; i < scripts.length; i += 1) {
      const src = scripts[i].getAttribute('src') || '';
      const match = src.match(/^(\.\.\/)+\s*js\//);
      if (match) return src.replace(/js\/.*$/, '');
    }
    return ROOT_PREFIX;
  };

  const PREFIX = detectPrefix();

  const route = (path) => PREFIX + String(path).replace(/^\.?\//, '');

  const applyRelativeLinks = (scope) => {
    const nodes = (scope || doc).querySelectorAll('[data-nav]');
    Array.prototype.forEach.call(nodes, (node) => {
      const target = node.getAttribute('data-nav');
      if (target) node.setAttribute('href', route(target));
    });
  };

  const nav = (path) => route(path);

  /* ---------------- Guards ---------------- */
  /* Built through route() so a module page resolves to ../login.html
     instead of the non-existent user/login.html. */
  const loginPath = () => route('login.html');

  const redirect = (path) => {
    global.location.href = route(path);
  };

  /**
   * Protects a module page.
   * @param {'user'|'admin'|'guest'} module
   * @returns {object|false|null} the account for protected pages, `false` on an
   *   allowed guest page, or `null` when a redirect was issued
   */
  const guard = (module) => {
    store.init();
    const user = auth.requireLogin();

    /* Guest pages (login/signup) must be checked first: redirecting an
       unauthenticated visitor to login.html would self-redirect in a loop. */
    if (module === 'guest') {
      if (user) {
        redirect(auth.homeFor(user));
        return null;
      }
      return false;
    }

    if (!user) {
      global.location.replace(loginPath());
      return null;
    }

    if (module === 'user' && user.role === 'admin') {
      if (ui) ui.toastInfo('You are signed in as an administrator. Opening the admin panel.');
      global.setTimeout(() => redirect('admin/dashboard.html'), 900);
      return null;
    }

    if (module === 'admin' && user.role !== 'admin') {
      if (ui) ui.toastWarning('Administrator access is required. Taking you to your dashboard.');
      global.setTimeout(() => redirect('user/dashboard.html'), 900);
      return null;
    }

    return user;
  };

  const logout = (message) => {
    auth.logout();
    const path = loginPath();
    if (message) {
      try {
        global.sessionStorage.setItem('yge_flash', message);
      } catch (err) {
        /* storage unavailable - fall back to a plain redirect */
      }
    }
    global.location.href = path;
  };

  const showFlash = () => {
    let message = null;
    try {
      message = global.sessionStorage.getItem('yge_flash');
      if (message) global.sessionStorage.removeItem('yge_flash');
    } catch (err) {
      message = null;
    }
    if (message && ui) ui.toastSuccess(message);
    return message;
  };

  const showUrlFlash = () => {
    if (!ui) return;
    try {
      const params = new URLSearchParams(global.location.search);
      const success = params.get('success');
      const error = params.get('error');
      if (success) ui.toastSuccess(success);
      if (error) ui.toastError(error);
      if (success || error) {
        const clean = global.location.pathname;
        global.history.replaceState({}, '', clean);
      }
    } catch (err) {
      /* ignore malformed query strings */
    }
  };

  /* ---------------- Module shell ---------------- */
  const MODULE_MENUS = {
    user: [
      { path: 'user/dashboard.html', label: 'Dashboard', icon: 'M3 12l9-8 9 8v8a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1z' },
      { path: 'user/events.html', label: 'Training Events', icon: 'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v9H5v-9h14z' },
      { path: 'user/registrations.html', label: 'My Registrations', icon: 'M9 11l3 3L22 4l-1.4-1.4L12 11.2 9.4 8.6 9 9zm-4 8h14v-2H5v2zm0-8h7V9H5v2z' },
      { path: 'user/profile.html', label: 'My Profile', icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z' }
    ],
    admin: [
      { path: 'admin/dashboard.html', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zM13 9h8V3h-8v6z' },
      { path: 'admin/events.html', label: 'Manage Events', icon: 'M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z' },
      { path: 'admin/users.html', label: 'Manage Users', icon: 'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V21h8v-2.5C9 15 11 14 13 14zm8 0v2.5V21h8v-3.5c0-2.3-4.7-3.5-7-3.5z' },
      { path: 'admin/registrations.html', label: 'Registrations', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' }
    ]
  };

  const NAV_ICONS = {
    Home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    Calendar: 'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7z',
    Users: 'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V21h8v-2.5C9 15 11 14 13 14z',
    Ticket: 'M4 6h16a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V8a2 2 0 0 1 2-2z',
    Logout: 'M17 7l-1.4 1.4L18.2 11H9v2h9.2l-2.6 2.6L17 17l5-5-5-5zM5 5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7v-2H5V5z',
    Search: 'M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z',
    Menu: 'M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z',
    Close: 'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z'
  };

  const svgIcon = (pathData) =>
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + pathData + '"/></svg>';

  const icon = (name) => svgIcon(NAV_ICONS[name] || '');

  const setActive = (pageFile) => {
    const links = doc.querySelectorAll('.sidebar-nav a[data-nav]');
    Array.prototype.forEach.call(links, (link) => {
      const target = link.getAttribute('data-nav');
      const isActive = target.split('/').pop() === pageFile;
      if (isActive) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  };

  /**
   * Builds sidebar + topbar for a module page, wires logout and the
   * responsive sidebar toggle.
   */
  const mountShell = (module, pageFile) => {
    const user = auth.requireLogin();
    if (!user) return null;

    const menu = MODULE_MENUS[module] || [];
    const isAdmin = module === 'admin';
    const moduleLabel = isAdmin ? 'Admin Console' : 'Learner Portal';
    const initials = ui.initials(user.name);

    const sidebar = doc.getElementById('sidebar');
    if (sidebar) {
      sidebar.innerHTML =
        '<div class="sidebar-brand">' +
        '<a class="brand" data-nav="index.html" href="#">' +
        '<img src="' + MODULE_PREFIX + 'assets/images/logo.svg" alt="" width="38" height="38" />' +
        '<span class="brand-text"><strong>SkillNest</strong><small>' + moduleLabel + '</small></span>' +
        '</a>' +
        '<button type="button" class="sidebar-close" id="sidebarClose" aria-label="Close navigation">' + icon('Close') + '</button>' +
        '</div>' +
        '<nav class="sidebar-nav" aria-label="Module navigation">' +
        menu
          .map((item) => '<a data-nav="' + item.path + '" href="#">' + svgIcon(item.icon) + '<span>' + item.label + '</span></a>')
          .join('') +
        '<div class="sidebar-divider" role="separator"></div>' +
        '<a class="sidebar-nav-secondary" data-nav="index.html" href="#">' + icon('Home') + '<span>Back to Home</span></a>' +
        '<button type="button" class="sidebar-nav-secondary sidebar-logout" data-action="logout">' + icon('Logout') + '<span>Logout</span></button>' +
        '</nav>' +
        '<div class="sidebar-footer">' +
        '<p class="sidebar-footer-title">Signed in as</p>' +
        '<div class="sidebar-user">' +
        '<span class="avatar" aria-hidden="true">' + initials + '</span>' +
        '<span class="sidebar-user-text"><strong>' + ui.escapeHtml(user.name) + '</strong><small>' + ui.escapeHtml(user.email) + '</small></span>' +
        '</div>' +
        '<p class="sidebar-version">SkillNest v1.0 &middot; SDC Project</p>' +
        '</div>';
    }

    /* Topbar user area */
    const topbarUser = doc.getElementById('topbarUser');
    if (topbarUser) {
      topbarUser.innerHTML =
        '<span class="avatar avatar-sm" aria-hidden="true">' + initials + '</span>' +
        '<span class="topbar-user-text"><strong>' + ui.escapeHtml(user.name) + '</strong>' +
        '<small>' + (isAdmin ? 'Administrator' : 'Learner') + '</small></span>';
    }

    const topbarDate = doc.getElementById('topbarDate');
    if (topbarDate) {
      topbarDate.textContent = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }

    const pageTitle = doc.getElementById('pageTitle');
    if (pageTitle && pageTitle.textContent.trim() === '') {
      pageTitle.textContent = doc.title;
    }

    applyRelativeLinks();
    setActive(pageFile);
    showFlash();
    showUrlFlash();

    /* Logout buttons anywhere on the page */
    doc.querySelectorAll('[data-action="logout"]').forEach((el) => {
      el.addEventListener('click', () => logout('You have been logged out successfully.'));
    });

    /* Responsive sidebar */
    const openBtn = doc.getElementById('sidebarToggle');
    const sidebarEl = doc.getElementById('sidebar');
    const closeBtn = doc.getElementById('sidebarClose');
    const overlay = doc.getElementById('sidebarOverlay');

    const openSidebar = () => {
      if (!sidebarEl) return;
      sidebarEl.classList.add('open');
      doc.body.classList.add('sidebar-open');
      if (overlay) overlay.hidden = false;
    };
    const shutSidebar = () => {
      if (!sidebarEl) return;
      sidebarEl.classList.remove('open');
      doc.body.classList.remove('sidebar-open');
      if (overlay) overlay.hidden = true;
    };

    if (openBtn) openBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', shutSidebar);
    if (overlay) overlay.addEventListener('click', shutSidebar);
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') shutSidebar();
    });

    return user;
  };

  /* ---------------- Public navbar (landing page) ---------------- */
  const mountPublicNav = () => {
    const navHost = doc.getElementById('publicNav');
    if (!navHost) return;
    const user = auth.getLoggedInUser();

    navHost.innerHTML =
      '<a class="brand" href="#top">' +
      '<img src="assets/images/logo.svg" alt="" width="38" height="38" />' +
      '<span class="brand-text"><strong>SkillNest</strong><small>Skill Development Platform</small></span>' +
      '</a>' +
      '<button type="button" class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="navLinks">' +
      '<span></span><span></span><span></span>' +
      '</button>' +
      '<div class="nav-links" id="navLinks">' +
      '<a href="#home">Home</a>' +
      '<a href="#about">About</a>' +
      '<a href="#events">Events</a>' +
      '<a href="#audience">Audience</a>' +
      '<a href="#how-it-works">How It Works</a>' +
      (user
        ? '<a class="btn btn-primary btn-sm" href="' + route(auth.homeFor(user)) + '">' +
          ui.escapeHtml(user.role === 'admin' ? 'Admin Panel' : 'My Dashboard') + '</a>'
        : '<a class="btn btn-ghost btn-sm" href="login.html">Login</a>' +
          '<a class="btn btn-primary btn-sm" href="signup.html">Sign Up</a>') +
      '</div>';

    const toggle = doc.getElementById('navToggle');
    const links = doc.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.classList.toggle('active', open);
      });
      links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }
  };

  global.YGE.navigation = {
    PREFIX: PREFIX,
    route: route,
    nav: nav,
    applyRelativeLinks: applyRelativeLinks,
    guard: guard,
    logout: logout,
    showFlash: showFlash,
    showUrlFlash: showUrlFlash,
    mountShell: mountShell,
    mountPublicNav: mountPublicNav,
    setActive: setActive,
    MODULE_MENUS: MODULE_MENUS
  };
})(typeof window !== 'undefined' ? window : globalThis);
