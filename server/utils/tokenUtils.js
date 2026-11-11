const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const signAuthToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const getCookieOptions = (httpOnly) => ({
  httpOnly,
  secure: env.cookieSecure,
  sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
  path: '/',
  maxAge: COOKIE_MAX_AGE_MS,
});

const setAuthCookies = (res, token, csrfToken) => {
  res.cookie('token', token, getCookieOptions(true));
  res.cookie('XSRF-TOKEN', csrfToken, getCookieOptions(false));
};

const setCsrfCookie = (res, csrfToken) => {
  res.cookie('XSRF-TOKEN', csrfToken, getCookieOptions(false));
};

const clearAuthCookies = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  });
  res.clearCookie('XSRF-TOKEN', {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};

module.exports = {
  signAuthToken,
  generateCsrfToken,
  setAuthCookies,
  setCsrfCookie,
  clearAuthCookies,
};
