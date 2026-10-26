# iMovies – Movie Ticket Booking Made Simple

A full-stack, responsive, production-ready MERN movie ticket booking web application with real-time seat selection, temporary seat locking, double-booking prevention, Razorpay test mode integration, mock cinema payment gateway fallback, QR code ticket generation, user bookings management, and an administrative control panel.

---

## 🌟 Key Features

### 🎬 User Features
- **Cinema-Themed Landing Page**: Obsidian navy and crimson red dark theme inspired by cinema multiplexes.
- **Dynamic Catalog**: Movies loaded dynamically from MongoDB with genres, languages, certifications, and IMDb-style ratings.
- **Search & Multi-Filter**: Real-time search by movie title, actor, or genre, plus filter pills and language dropdowns.
- **Movie Details & Trailers**: High-resolution backdrops, cast & director info, and embedded video trailer modal.
- **Saved Watchlist**: One-click bookmarking of movies to personal watchlist.
- **Theatre & Showtime Explorer**: Browse multiplexes (IMAX Laser, Dolby Atmos) and select dates from calendar tabs.
- **Interactive Visual Seating Grid**:
  - Curved screen projection with spotlight glow.
  - Tiered seating: **Balcony (VIP Recliner)**, **Executive (Middle Tier)**, and **Classic (Lower Tier)**.
  - Real-time seat statuses: Available, Selected (Crimson Glow), Booked (Muted Gray), and Locked (Amber Pulse).
  - Multi-seat selection with automatic price and fee calculation.
- **Double-Booking Prevention & Seat Locking**:
  - Server-side atomic locking (`POST /api/bookings/lock-seats`) with a 5-minute countdown clock.
  - Prevents another user from selecting or booking seats currently in checkout.
  - Automatic expiration cleaner releases locks back to the pool if checkout is abandoned.
  - Real-time updates broadcasted via **Socket.IO**.
- **Checkout & Payment**:
  - **Mock Cinema Payment Gateway (Demo Mode)**: Instant zero-config testing simulating UPI, Card, and Netbanking verification.
  - **Razorpay Test Mode**: Integrated with HMAC SHA-256 signature verification.
- **Printable M-Ticket Pass & QR Code**:
  - Authentic perforated cinema pass layout with high-resolution QR code.
  - Instant print and download options.
- **Booking Management & Cancellation Policy**:
  - View upcoming and past bookings.
  - 85% refund calculation policy up to 2 hours prior to showtime.
  - Automatically releases seats back to the theatre's availability upon cancellation.

### 🛡️ Admin Dashboard (`/admin/dashboard`)
- **Protected Role-Based Access**: Role validation (`admin`) on both frontend routes and backend REST middleware.
- **Real-Time Analytics & Revenue**: Total registered users, active movies, theatres, scheduled shows, total tickets sold, and paid revenue.
- **Movie Management (`/admin/movies`)**: Add, edit, delete movies with poster preview, trailer URLs, runtime, and certification.
- **Theatre Management (`/admin/theatres`)**: Configure multiplex screens and generate custom seating layouts (rows, seats per row, tiered ticket prices).
- **Show Scheduling (`/admin/shows`)**: Schedule screenings with conflict prevention (avoids scheduling the same screen at the same time).
- **Bookings Master Table (`/admin/bookings`)**: Search and filter all customer transactions, view ticket QR codes, and cancel bookings.
- **User Management (`/admin/users`)**: View registered customers, promote or demote administrator privileges, and manage accounts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Bootstrap 5, Custom CSS, React Router DOM v6, Axios, React Toastify, React Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js, Socket.IO, Helmet, CORS, Express Rate Limit, Dotenv |
| **Database** | MongoDB with Mongoose ODM (Supports local MongoDB, MongoDB Atlas, and embedded in-memory MongoDB) |
| **Authentication** | JWT (JSON Web Tokens), bcrypt.js password hashing |
| **Payment Gateway** | Razorpay Test Mode with fallback to verified Mock Cinema Gateway |
| **Ticketing** | Node QRCode (Base64 Data URI) |

---

## 📁 Project Structure

```text
imovie/
├── backend/
│   ├── config/
│   │   └── db.js                 # Multi-mode MongoDB connector (Atlas, Local, Embedded)
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, GetMe, Watchlist, Profile
│   │   ├── movieController.js    # Movie CRUD, Search, Filters, Trending
│   │   ├── theatreController.js  # Theatre CRUD & Seating Tier layout calculator
│   │   ├── showController.js     # Show scheduling, Conflict check, Seat matrix
│   │   ├── bookingController.js  # Atomic seat lock, Double-booking check, Booking & Cancel
│   │   ├── paymentController.js  # Razorpay & Mock payment order + signature verification
│   │   └── adminController.js    # Statistics, Revenue aggregations, User management
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & Admin role authorization
│   │   ├── errorMiddleware.js    # Global error & 404 handler
│   │   └── rateLimiter.js        # Auth and API rate limiters
│   ├── models/
│   │   ├── User.js               # User model with bcrypt pre-save & toJSON security
│   │   ├── Movie.js              # Movie model with text search indexes
│   │   ├── Theatre.js            # Theatre model with tier pricing & capacities
│   │   ├── Show.js               # Show model with per-show seat matrix & lock expiry
│   │   └── Booking.js            # Booking model with QR code & cancellation policy
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── movieRoutes.js
│   │   ├── theatreRoutes.js
│   │   ├── showRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── adminRoutes.js
│   ├── seed/
│   │   ├── seedData.js           # Realistic movies and theatres datasets
│   │   └── seeder.js             # Standalone & automatic database seeder
│   ├── utils/
│   │   └── qrGenerator.js        # High-res QR code generator
│   ├── test_suite.js             # 16-test automated API test suite
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── server.js                 # Express server + Socket.IO + background lock cleaner
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Responsive navigation with search & profile dropdown
│   │   │   ├── Footer.jsx        # Cinema perks and quick navigation
│   │   │   ├── MovieCard.jsx     # Cinema poster card with badges & watchlist toggle
│   │   │   ├── SeatGrid.jsx      # Cinema screen & Balcony/Middle/Lower seat selector
│   │   │   ├── TicketCard.jsx    # Perforated ticket with QR code
│   │   │   ├── ProtectedRoute.jsx# Auth and Admin route guards
│   │   │   └── LoadingSpinner.jsx# Cinema reel loader
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Authentication and watchlist state provider
│   │   ├── pages/
│   │   │   ├── HomePage.jsx      # Hero, Search, Filters, Trending, Catalog
│   │   │   ├── MoviesCatalogPage.jsx # Full movie library with sort & filters
│   │   │   ├── MovieDetailsPage.jsx  # Poster, Trailer modal, Cast, Book button
│   │   │   ├── ShowSelectionPage.jsx # Date selector tabs & Theatres list
│   │   │   ├── SeatSelectionPage.jsx # Real-time seat locking with 5-min timer
│   │   │   ├── CheckoutPage.jsx      # Order breakdown, Mock & Razorpay payment
│   │   │   ├── BookingConfirmationPage.jsx # Confetti + Ticket pass
│   │   │   ├── MyBookingsPage.jsx    # User bookings history & cancellation modal
│   │   │   ├── WatchlistPage.jsx     # Bookmarked movies
│   │   │   ├── ProfilePage.jsx       # Profile editor
│   │   │   ├── LoginPage.jsx         # Sign in with 1-click demo buttons
│   │   │   ├── RegisterPage.jsx      # Account creation with validation
│   │   │   ├── NotFoundPage.jsx      # 404 handler
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx       # Sidebar layout
│   │   │       ├── AdminDashboardPage.jsx# Stats & Revenue overview
│   │   │       ├── AdminMoviesPage.jsx   # Movie CRUD
│   │   │       ├── AdminTheatresPage.jsx # Theatre CRUD & Seating tiers
│   │   │       ├── AdminShowsPage.jsx    # Schedule screenings
│   │   │       ├── AdminBookingsPage.jsx # Transactions & admin cancel
│   │   │       └── AdminUsersPage.jsx    # User role management
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptor
│   │   ├── styles/
│   │   │   ├── custom.css        # Cinema dark navy & crimson design system
│   │   │   └── seating.css       # Seating grid & screen curve illumination
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── package.json                  # Root orchestration
└── README.md
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- Node.js (v18.x or later)
- npm or pnpm
- MongoDB (Optional: local MongoDB daemon, MongoDB Atlas, or the built-in zero-setup embedded fallback)

### 1. Clone & Setup Backend
```bash
cd backend
npm install
```
Configure your `.env` (or copy `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/imovies
JWT_SECRET=imovies_super_secret_jwt_key_2026_cinema_hub_xyz
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_demoKeyId12345
RAZORPAY_KEY_SECRET=rzp_test_demoSecretKey67890
SEAT_LOCK_DURATION_MINUTES=5
```

### 2. Seed Database
Run the seeder to populate sample movies, theatres, and 80 scheduled shows:
```bash
npm run seed
```

### 3. Start Backend Server
```bash
npm start
```
The server will start on `http://localhost:5000`.

### 4. Setup & Start Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔑 Demo Accounts

Use these pre-seeded demo accounts or use the **1-Click Demo Login** buttons on the Login page:

| Role | Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@imovies.com` | `AdminPassword@123` | Full access to `/admin/dashboard`, Movie/Theatre/Show CRUD, all bookings, user role control |
| **Cinema Member** | `user@imovies.com` | `UserPassword@123` | Browse, interactive seat booking, checkout, ticket pass, watchlist, cancellation |

---

## 💳 Payment Gateway Modes

1. **Mock Cinema Payment Gateway (Default / Zero-Config)**:
   - Activated automatically when demo Razorpay keys are detected.
   - Lets users immediately test UPI FastPay, Debit/Credit Card, and Netbanking flows.
   - Confirms seats atomically only after the backend verification succeeds.

2. **Razorpay Test Mode (Live Keys)**:
   - To use live Razorpay sandbox, provide your official keys in `backend/.env`:
     ```env
     RAZORPAY_KEY_ID=rzp_test_YourKeyHere
     RAZORPAY_KEY_SECRET=YourSecretHere
     ```
   - Automatically activates standard Razorpay checkout modal with cryptographic HMAC SHA-256 signature verification.

---

## 🧪 Automated Testing

A 16-test end-to-end API test suite is included in `backend/test_suite.js`.
To run the verification suite:
```bash
node backend/test_suite.js
```

### Test Coverage Checklist:
- [x] Health check endpoint (`GET /api/health`)
- [x] Administrator login & token generation (`POST /api/auth/login`)
- [x] User login & token generation (`POST /api/auth/login`)
- [x] New user registration & duplicate prevention (`POST /api/auth/register`)
- [x] Movies list retrieval with search & genre filters (`GET /api/movies`)
- [x] Single movie details retrieval (`GET /api/movies/:id`)
- [x] Theatres list retrieval (`GET /api/theatres`)
- [x] Shows scheduling retrieval (`GET /api/shows`)
- [x] Single show seat matrix with tier data (`GET /api/shows/:id`)
- [x] Server-side atomic seat locking with expiry countdown (`POST /api/bookings/lock-seats`)
- [x] Double-booking prevention conflict check (409 Conflict)
- [x] Payment order generation (`POST /api/payment/create-order`)
- [x] Atomic booking confirmation & QR ticket generation (`POST /api/bookings`)
- [x] User booking history retrieval (`GET /api/bookings/my-bookings`)
- [x] Admin analytics & confirmed revenue aggregation (`GET /api/admin/stats`)
- [x] Booking cancellation policy check & seat release back to available (`PATCH /api/bookings/:id/cancel`)
