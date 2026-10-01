/* =============================================================
   SkillNest - js/auth.js
   Signup, login, logout and role guards. LocalStorage only.
   ============================================================= */
(function (global) {
  'use strict';

  const store = global.YGE;

  /* ---------------- Validation rules ---------------- */
  const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const PHONE_PATTERN = /^[+]?[0-9\s\-()]{7,20}$/;
  const MIN_PASSWORD_LENGTH = 6;

  const validators = {
    isEmpty: (value) => value === null || value === undefined || String(value).trim() === '',
    isEmail: (value) => EMAIL_PATTERN.test(String(value || '').trim()),
    isPhone: (value) => PHONE_PATTERN.test(String(value || '').trim()),
    isStrongEnough: (value) => String(value || '').length >= MIN_PASSWORD_LENGTH
  };

  const isValidEmail = (email) => validators.isEmail(email);
  const isValidPhone = (phone) => validators.isPhone(phone);

  /* ---------------- Signup ---------------- */
  const validateSignup = (data) => {
    const errors = {};
    if (validators.isEmpty(data.name)) {
      errors.name = 'Full name is required.';
    } else if (String(data.name).trim().length < 3) {
      errors.name = 'Full name must be at least 3 characters.';
    } else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(String(data.name).trim())) {
      errors.name = 'Full name should contain letters only.';
    }

    if (validators.isEmpty(data.email)) {
      errors.email = 'Email is required.';
    } else if (!validators.isEmail(data.email)) {
      errors.email = 'Enter a valid email address.';
    } else if (store.getUserByEmail(data.email)) {
      errors.email = 'This email is already registered. Please login instead.';
    }

    if (validators.isEmpty(data.phone)) {
      errors.phone = 'Phone number is required.';
    } else if (!validators.isPhone(data.phone)) {
      errors.phone = 'Enter a valid phone number (7 to 20 digits).';
    }

    if (validators.isEmpty(data.password)) {
      errors.password = 'Password is required.';
    } else if (!validators.isStrongEnough(data.password)) {
      errors.password = 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.';
    }

    if (validators.isEmpty(data.confirmPassword)) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (data.confirmPassword !== data.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return { valid: Object.keys(errors).length === 0, errors: errors };
  };

  const signup = (data) => {
    const result = validateSignup(data);
    if (!result.valid) {
      return { success: false, message: 'Please correct the highlighted fields.', errors: result.errors };
    }

    const users = store.getUsers();
    const user = {
      id: (function () {
        let max = 0;
        users.forEach((item) => {
          const match = String(item.id || '').match(/(\d+)\s*$/);
          if (match) max = Math.max(max, parseInt(match[1], 10));
        });
        return 'USR' + String(max + 1).padStart(3, '0');
      })(),
      name: String(data.name).trim(),
      email: String(data.email).trim(),
      phone: String(data.phone).trim(),
      password: String(data.password),
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(user);
    store.saveUsers(users);
    return { success: true, message: 'Account created successfully. Please login.', user: user };
  };

  /* ---------------- Login ---------------- */
  const login = (email, password) => {
    if (validators.isEmpty(email) || validators.isEmpty(password)) {
      return { success: false, message: 'Email and password are both required.' };
    }
    if (!validators.isEmail(email)) {
      return { success: false, message: 'Enter a valid email address.' };
    }

    const user = store.getUserByEmail(email);
    if (!user || user.password !== String(password)) {
      return { success: false, message: 'Invalid email or password.' };
    }

    store.setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role });
    return { success: true, message: 'Welcome back, ' + user.name + '!', user: store.getCurrentUser() };
  };

  const logout = () => {
    store.clearCurrentUser();
    return true;
  };

  /* ---------------- Session helpers ---------------- */
  /* The session record intentionally omits sensitive fields such as the
     password. Details not needed for routing (phone, createdAt) are merged
     in from the stored account so pages can display a complete profile. */
  const getLoggedInUser = () => {
    const session = store.getCurrentUser();
    if (!session) return null;
    const record = store.getUserById(session.id);
    if (!record) {
      store.clearCurrentUser();
      return null;
    }
    return Object.assign({}, record, {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role
    });
  };
  const isLoggedIn = () => Boolean(store.getCurrentUser());

  const homeFor = (user) => (user && user.role === 'admin' ? 'admin/dashboard.html' : 'user/dashboard.html');

  /* ---------------- Guards ---------------- */
  const requireLogin = () => {
    const user = getLoggedInUser();
    if (!user) return null;
    /* Session must still match a real account. */
    const record = store.getUserById(user.id);
    if (!record) {
      store.clearCurrentUser();
      return null;
    }
    return record;
  };

  const requireAdmin = () => {
    const record = requireLogin();
    return record && record.role === 'admin' ? record : null;
  };

  /* ---------------- Profile ---------------- */
  const updateProfile = (userId, changes) => {
    const users = store.getUsers();
    const index = users.findIndex((user) => user.id === userId);
    if (index === -1) return { success: false, message: 'User account not found.' };

    const errors = {};
    if (changes.name !== undefined) {
      if (validators.isEmpty(changes.name)) errors.name = 'Full name is required.';
      else if (String(changes.name).trim().length < 3) errors.name = 'Full name must be at least 3 characters.';
    }
    if (changes.phone !== undefined) {
      if (validators.isEmpty(changes.phone)) errors.phone = 'Phone number is required.';
      else if (!validators.isPhone(changes.phone)) errors.phone = 'Enter a valid phone number (7 to 20 digits).';
    }
    if (Object.keys(errors).length) {
      return { success: false, message: 'Please correct the highlighted fields.', errors: errors };
    }

    const user = users[index];
    if (changes.name !== undefined) user.name = String(changes.name).trim();
    if (changes.phone !== undefined) user.phone = String(changes.phone).trim();
    /* role, email and password can never be edited here */

    users[index] = user;
    store.saveUsers(users);

    const session = store.getCurrentUser();
    if (session && session.id === user.id) {
      store.setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role });
    }
    return { success: true, message: 'Profile updated successfully.', user: user };
  };

  const changePassword = (userId, currentPassword, newPassword, confirmPassword) => {
    const users = store.getUsers();
    const index = users.findIndex((user) => user.id === userId);
    if (index === -1) return { success: false, message: 'User account not found.' };

    const errors = {};
    if (validators.isEmpty(currentPassword)) errors.currentPassword = 'Enter your current password.';
    if (validators.isEmpty(newPassword)) errors.newPassword = 'Enter a new password.';
    else if (!validators.isStrongEnough(newPassword)) errors.newPassword = 'New password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.';
    if (validators.isEmpty(confirmPassword)) errors.confirmPassword = 'Confirm your new password.';
    else if (confirmPassword !== newPassword) errors.confirmPassword = 'Passwords do not match.';

    if (Object.keys(errors).length) return { success: false, message: 'Please correct the highlighted fields.', errors: errors };
    if (users[index].password !== String(currentPassword)) {
      return { success: false, message: 'Current password is incorrect.', errors: { currentPassword: 'Current password is incorrect.' } };
    }

    users[index].password = String(newPassword);
    store.saveUsers(users);
    return { success: true, message: 'Password updated successfully.' };
  };

  const globalObj = global.YGE;
  globalObj.auth = {
    MIN_PASSWORD_LENGTH: MIN_PASSWORD_LENGTH,
    isEmail: isValidEmail,
    isPhone: isValidPhone,
    validateSignup: validateSignup,
    signup: signup,
    login: login,
    logout: logout,
    requireLogin: requireLogin,
    requireAdmin: requireAdmin,
    getLoggedInUser: getLoggedInUser,
    isLoggedIn: isLoggedIn,
    homeFor: homeFor,
    updateProfile: updateProfile,
    changePassword: changePassword
  };
})(typeof window !== 'undefined' ? window : globalThis);
