# Atithi (అతిథి) — Hyderabad Restaurant Rating & Review Platform (MERN Stack)

A full-stack, production-grade **Restaurant Rating & Review Platform** built with MongoDB, Express.js, React, and Node.js. It provides curated Hyderabad restaurant discovery, email OTP verified customer registration, live MongoDB-aggregated ratings and distributions, Light & Dark theme support, strict backend role-based access control (`ADMIN`, `CUSTOMER`, `RESTAURANT_OWNER`), secure HttpOnly cookie JWT + CSRF authentication, and polished responsive dashboards.

---

## Technology Stack

### Frontend (`client/`)
- **React 19** + **Vite**
- **React Router DOM** for client-side routing and role-protected routes
- **Tailwind CSS** for clean, minimal, responsive styling
- **Framer Motion** for subtle page transitions, staggered cards, modals, and star animations (`prefers-reduced-motion` aware)
- **React Hook Form** for validated forms
- **Axios** with cookie credentials & automatic CSRF token handling
- **Recharts** for Admin rating distribution analytics
- **Lucide React** icons & **Sonner** toast notifications

### Backend (`server/`)
- **Node.js** + **Express.js**
- **MongoDB** / **MongoDB Atlas** with **Mongoose** schemas & indexes
- **JWT** stored in `HttpOnly` cookies + double-submit **CSRF** protection (`XSRF-TOKEN` / `X-CSRF-Token`)
- **bcryptjs** password hashing (salt rounds: 12)
- **express-validator** request validation
- **Helmet**, **CORS**, **Morgan**, **cookie-parser**

---

## Core Features

### Customer Module
- **Discovery Home**: Search restaurants by name, filter dynamically by location & cuisine, sort by popularity/rating/reviews/newest, view popular restaurants, and browse paginated cards showing average rating (or `"No ratings yet"`), review counts, and the logged-in customer's own rating.
- **Restaurant Details**: Full venue info, live MongoDB-aggregated average rating, 5-to-1 star distribution progress bars (including zero-count tiers), and customer reviews list with star filters & sorting.
- **Single-Review Rule**: Compound unique index on `(customer, restaurant)` enforces one review per customer per restaurant at both API (`409 Conflict`) and database levels. Existing reviewers see their published review with **Edit** and **Delete** controls.
- **Email OTP Verification & Confirmation**: New customer registrations receive a 6-digit OTP valid for 10 minutes (with Resend OTP) and receive an **"Successfully logged into Atithi"** confirmation email once verified.
- **My Reviews & Edit Review**: Manage personal reviews, edit ratings/comments, and remove reviews with confirmation dialogs.

### Restaurant Owner Module
- **Owner Dashboard**: Displays assigned restaurant name, live average rating, total reviews, individual 5★–1★ count cards, distribution bars, and recent feedback.
- **My Restaurant & Edit Restaurant**: Update permitted metadata (`description`, `phone`, `address`, `location`, `cuisine`, `image`, `priceRange`) while blocking modifications to ownership, role, or activation status.
- **Restaurant Reviews**: Filter, search, and read customer reviews (strictly read-only; owners cannot alter or remove customer reviews).

### Administrator Module
- **Admin Dashboard**: Sidebar navigation, 4 KPI cards (Total Users, Total Restaurants, Total Reviews, Average Platform Rating), Recharts bar chart for platform rating distribution, and recent activity feeds.
- **Manage Users**: Search by name/email, filter by role/status, view details, activate/deactivate accounts, and delete users safely.
- **Manage Restaurants**: Create, edit, activate/deactivate, delete restaurants, search & filter, and assign restaurant owners.
- **Manage Restaurant Owners**: Provision new `RESTAURANT_OWNER` accounts (with strong password hashing) and assign or reassign restaurants.
- **Manage Reviews**: Search/filter all reviews, inspect customer & restaurant metadata, and remove inappropriate reviews.

---

## Project Architecture

```text
Restaurent_App/
├── client/
│   ├── src/
│   │   ├── api/            # Axios client (CSRF + credentials) and endpoint wrappers
│   │   ├── components/     # Reusable UI, AtithiLogo, ThemeToggle, modals, stars, skeletons
│   │   ├── context/        # AuthContext & ThemeContext (Light/Dark theme persistence)
│   │   ├── hooks/          # useDebounce
│   │   ├── layouts/        # CustomerLayout & DashboardLayout (responsive sidebar)
│   │   ├── pages/
│   │   │   ├── auth/       # LoginPage, RegisterPage, VerifyOtpPage
│   │   │   ├── customer/   # HomePage, RestaurantDetailsPage, MyReviewsPage, EditReviewPage
│   │   │   ├── owner/      # OwnerDashboardPage, OwnerRestaurantPage, OwnerEditRestaurantPage, OwnerReviewsPage
│   │   │   └── admin/      # AdminDashboardPage, ManageUsersPage, ManageRestaurantsPage, ManageOwnersPage, ManageReviewsPage
│   │   ├── routes/         # ProtectedRoute role guard
│   │   └── utils/          # Validation helpers, formatters, fallback SVG
│   └── package.json
├── server/
│   ├── config/             # Environment config & MongoDB connection
│   ├── controllers/        # auth, restaurant, review, owner, admin controllers
│   ├── middleware/         # JWT auth, role authorization, CSRF, error handler, validation
│   ├── models/             # User, Restaurant, Review Mongoose models & indexes
│   ├── routes/             # Modular Express route definitions
│   ├── services/           # MongoDB aggregation service for ratings & distributions
│   ├── validators/         # express-validator chains
│   ├── utils/              # AppError, asyncHandler, token/cookie utils, regex helper
│   ├── scripts/            # Idempotent database seed script
│   ├── tests/              # Integration & security test suite (supertest + mongodb-memory-server)
│   ├── app.js
│   ├── server.js
│   └── package.json
├── postman/
│   └── restaurant-platform.postman_collection.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Database Schema

### 1. `users`
- `_id`: ObjectId
- `name`: String (required)
- `email`: String (required, unique, lowercase)
- `password`: String (required, bcrypt hash, `select: false`)
- `role`: `'ADMIN' | 'CUSTOMER' | 'RESTAURANT_OWNER'` (default `'CUSTOMER'`)
- `isActive`: Boolean (default `true`)
- `createdAt`, `updatedAt`: Date timestamps
- **Indexes**: `email` (unique), `role`, `isActive`, `name`

### 2. `restaurants`
- `_id`: ObjectId
- `name`: String (required)
- `description`: String (required)
- `location`: String (required)
- `address`: String (required)
- `cuisine`: `[String]` (required, non-empty)
- `image`: String (required)
- `phone`: String (required)
- `priceRange`: `'$' | '$$' | '$$$' | '$$$$'`
- `owner`: ObjectId (`ref: 'User'`, nullable)
- `isActive`: Boolean (default `true`)
- `createdAt`, `updatedAt`: Date timestamps
- **Indexes**: `name`, `location`, `cuisine`, `owner`, `(isActive, createdAt)`

### 3. `reviews`
- `_id`: ObjectId
- `customer`: ObjectId (`ref: 'User'`, required)
- `restaurant`: ObjectId (`ref: 'Restaurant'`, required)
- `rating`: Number (integer `1`–`5`, required)
- `comment`: String (required, `1`–`1000` chars)
- `createdAt`, `updatedAt`: Date timestamps
- **Indexes**: `{ customer: 1, restaurant: 1 }` (**compound unique index**), `{ restaurant: 1, createdAt: -1 }`, `{ customer: 1, createdAt: -1 }`

---

## Installation & Setup

### Prerequisites
- **Node.js** `>= 18.x`
- **MongoDB** (local MongoDB instance or MongoDB Atlas connection string)

### 1. Configure Environment Variables

Copy `.env.example` into `server/.env` (or root `.env`) and update values as needed:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/atithi_restaurant_platform
JWT_SECRET=your_strong_64_char_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false

# Email OTP Verification (Gmail SMTP with 16-char Google App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_atithi_email@gmail.com
SMTP_PASS=your_16_char_google_app_password
EMAIL_FROM=Atithi <your_atithi_email@gmail.com>
```

> In HTTPS production deployments, set `NODE_ENV=production`, `COOKIE_SECURE=true`, and use a cryptographically random `JWT_SECRET`.

### 2. Install Dependencies

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 3. Seed Sample Data

Populate the database with 1 admin, 4 restaurant owners, 6 customers, 12 Hyderabad restaurants, and realistic reviews (safe to re-run without creating duplicates):

```bash
cd server
npm run seed
```

### 4. Run Backend & Frontend

```bash
# Terminal 1 — Start Express API (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Start React Vite App (http://localhost:5173)
cd client
npm run dev
```

### 5. Run Automated Backend Tests

```bash
cd server
npm test
```

---

## Sample Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@atithi.com` | `Admin@1234` |
| **Restaurant Owner** | `owner1@atithi.com` | `Owner@1234` |
| **Restaurant Owner** | `owner2@atithi.com` | `Owner@1234` |
| **Customer** | `customer1@atithi.com` | `Customer@1234` |
| **Customer** | `customer2@atithi.com` | `Customer@1234` |

---

## API Reference

All routes are prefixed with `/api`. Cookie-authenticated `POST`/`PUT`/`DELETE` requests require an `X-CSRF-Token` header matching the `XSRF-TOKEN` cookie (automatically handled by the frontend Axios client and Postman collection scripts).

### Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/csrf-token` | Public | Issues CSRF token cookie & payload |
| `POST` | `/api/auth/register` | Public | Register a new Customer & send 6-digit OTP (10 min expiry) |
| `POST` | `/api/auth/verify-otp` | Public | Verify registration OTP, log customer in, send confirmation email |
| `POST` | `/api/auth/resend-otp` | Public | Resend 6-digit OTP to unverified email (30s cooldown) |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue HttpOnly JWT cookie |
| `POST` | `/api/auth/logout` | Public | Clear session cookies |
| `GET` | `/api/auth/me` | Authenticated | Get logged-in user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update own display name |
| `PUT` | `/api/auth/password` | Authenticated | Change account password |

### Restaurants
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/restaurants` | Public | Search, filter (`location`, `cuisine`), sort, paginate |
| `GET` | `/api/restaurants/filters` | Public | Distinct active locations & cuisines |
| `GET` | `/api/restaurants/:id` | Public | Restaurant details + aggregated rating stats |
| `POST` | `/api/restaurants` | `ADMIN` | Create restaurant |
| `PUT` | `/api/restaurants/:id` | `ADMIN` | Update restaurant |
| `DELETE` | `/api/restaurants/:id` | `ADMIN` | Delete restaurant & associated reviews |

### Reviews
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | `CUSTOMER` | Create review (1 per customer per restaurant) |
| `GET` | `/api/reviews/restaurant/:restaurantId` | Public | Paginated reviews & distribution for restaurant |
| `GET` | `/api/reviews/my-reviews` | `CUSTOMER` | List logged-in customer's reviews |
| `GET` | `/api/reviews/:id` | `CUSTOMER` (own) / `ADMIN` | Fetch single review |
| `PUT` | `/api/reviews/:id` | `CUSTOMER` (own only) | Update own review |
| `DELETE` | `/api/reviews/:id` | `CUSTOMER` (own) / `ADMIN` | Delete review |

### Restaurant Owner
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/owner/dashboard` | `RESTAURANT_OWNER` | Restaurant KPIs, 1★–5★ breakdown, recent reviews |
| `GET` | `/api/owner/restaurant` | `RESTAURANT_OWNER` | Assigned restaurant details |
| `PUT` | `/api/owner/restaurant` | `RESTAURANT_OWNER` | Update permitted restaurant fields |
| `GET` | `/api/owner/reviews` | `RESTAURANT_OWNER` | Filtered & paginated reviews for own restaurant |

### Administrator
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | `ADMIN` | Platform KPIs, rating chart data, recent activity |
| `GET` | `/api/admin/users` | `ADMIN` | Search/filter/paginate users |
| `GET` | `/api/admin/users/:id` | `ADMIN` | Inspect user details |
| `PUT` | `/api/admin/users/:id/status` | `ADMIN` | Activate or deactivate user account |
| `DELETE` | `/api/admin/users/:id` | `ADMIN` | Delete user account |
| `GET` | `/api/admin/restaurants` | `ADMIN` | Manage all restaurants (including inactive) |
| `GET` | `/api/admin/reviews` | `ADMIN` | Search/filter all reviews |
| `DELETE` | `/api/admin/reviews/:id` | `ADMIN` | Remove inappropriate review |
| `GET` | `/api/admin/owners` | `ADMIN` | List restaurant owners & assigned venues |
| `POST` | `/api/admin/owners` | `ADMIN` | Create restaurant owner account |
| `PUT` | `/api/admin/owners/:id` | `ADMIN` | Update owner details & assignment |
| `PUT` | `/api/admin/restaurants/:id/assign-owner` | `ADMIN` | Assign or unassign restaurant owner |

---

## Postman Collection

Import [`postman/restaurant-platform.postman_collection.json`](postman/restaurant-platform.postman_collection.json) into Postman. Running **Login** or **Get CSRF Token** automatically stores `csrfToken` in collection variables for subsequent requests.

---

## Screenshots

> Add screenshots of the deployed application views here:
> - Restaurant Discovery Home Page
> - Restaurant Details & Rating Distribution Bars
> - Customer My Reviews Page
> - Restaurant Owner Dashboard
> - Administrator Overview & Analytics
