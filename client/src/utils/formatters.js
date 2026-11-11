export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,16}$/;

export const getPasswordChecks = (password = '') => [
  {
    label: '8 to 16 characters',
    passed: password.length >= 8 && password.length <= 16,
  },
  {
    label: 'At least one uppercase letter',
    passed: /[A-Z]/.test(password),
  },
  {
    label: 'At least one lowercase letter',
    passed: /[a-z]/.test(password),
  },
  {
    label: 'At least one number',
    passed: /\d/.test(password),
  },
  {
    label: 'At least one special character',
    passed: /[^A-Za-z0-9\s]/.test(password),
  },
];

export const extractErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) return fallback;
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (!error.response) {
    return 'Network error. Please verify your connection and server status.';
  }
  return error.message || fallback;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRating = (averageRating) => {
  if (averageRating === null || averageRating === undefined) {
    return 'No ratings yet';
  }
  return Number(averageRating).toFixed(1);
};

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  CUSTOMER: 'Customer',
  RESTAURANT_OWNER: 'Restaurant Owner',
};

export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'RESTAURANT_OWNER':
      return '/owner';
    case 'CUSTOMER':
    default:
      return '/';
  }
};

export const FALLBACK_RESTAURANT_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#F5F3EF"/>
  <circle cx="400" cy="220" r="64" fill="#FED7AA"/>
  <path d="M378 192v56M368 192v22c0 6 4 10 10 10s10-4 10-10v-22M416 192v56M416 192c10 0 16 8 16 18s-6 18-16 18" stroke="#EA580C" stroke-width="5" stroke-linecap="round" fill="none"/>
  <text x="400" y="325" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600" fill="#57534E" text-anchor="middle">Atithi Dining</text>
</svg>
`);
