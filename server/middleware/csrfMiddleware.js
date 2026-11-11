const crypto = require('crypto');
const AppError = require('../utils/AppError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const verifyCsrf = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // CSRF targets ambient cookie credentials. If request does not carry a session
  // cookie (e.g. unauthenticated login/register or pure Bearer token client), skip.
  const hasSessionCookie = Boolean(req.cookies && req.cookies.token);
  if (!hasSessionCookie) {
    return next();
  }

  const cookieToken = req.cookies['XSRF-TOKEN'];
  const headerToken =
    req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

  if (!cookieToken || !headerToken || typeof headerToken !== 'string') {
    return next(new AppError('CSRF token missing or invalid.', 403));
  }

  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (
    cookieBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, headerBuf)
  ) {
    return next(new AppError('CSRF token mismatch.', 403));
  }

  next();
};

module.exports = { verifyCsrf };
