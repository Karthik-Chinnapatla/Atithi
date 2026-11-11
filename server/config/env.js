const dotenv = require('dotenv');
const path = require('path');

// Load from server/.env first, fallback to root .env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atithi_restaurant_platform',
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? ''
      : 'dev_only_fallback_secret_change_in_production_64chars_minimum'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecure:
    process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom:
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER ? `Atithi <${process.env.SMTP_USER}>` : ''),
};

if (env.nodeEnv === 'production' && !env.jwtSecret) {
  throw new Error('JWT_SECRET environment variable must be configured in production.');
}

module.exports = env;
