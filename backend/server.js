const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const Movie = require('./models/Movie');
const Show = require('./models/Show');
const { seedAll } = require('./seed/seeder');

// Route imports
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Store io on app so controllers can broadcast events
app.set('io', io);

io.on('connection', (socket) => {
  // Join a show-specific room for targeted seat updates
  socket.on('join_show', (showId) => {
    socket.join(`show_${showId}`);
  });

  socket.on('leave_show', (showId) => {
    socket.leave(`show_${showId}`);
  });

  socket.on('disconnect', () => {
    // client disconnected
  });
});

// Security & Utility Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to general API
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'iMovies API',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend build if it exists
const path = require('path');
const fs = require('fs');
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Background worker to release expired seat locks every 60 seconds
setInterval(async () => {
  try {
    const lockDuration = Number(process.env.SEAT_LOCK_DURATION_MINUTES) || 5;
    const threshold = new Date(Date.now() - lockDuration * 60 * 1000);

    const showsWithExpiredLocks = await Show.find({
      'seats.status': 'locked',
      'seats.lockedAt': { $lt: threshold }
    });

    for (const show of showsWithExpiredLocks) {
      let released = false;
      const releasedSeatNumbers = [];

      show.seats.forEach((seat) => {
        if (seat.status === 'locked' && seat.lockedAt && new Date(seat.lockedAt) < threshold) {
          seat.status = 'available';
          seat.lockedBy = null;
          seat.lockedAt = null;
          releasedSeatNumbers.push(seat.seatNumber);
          released = true;
        }
      });

      if (released) {
        show.availableSeatsCount = show.seats.filter((s) => s.status === 'available').length;
        await show.save();
        io.emit('seats_released', {
          showId: show._id,
          seatNumbers: releasedSeatNumbers
        });
      }
    }
  } catch (err) {
    // silent catch for background cleaner
  }
}, 60000);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database has 0 movies so user has instant rich data
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('[Server] Database is empty. Running initial auto-seed...');
      await seedAll(true);
    }

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 iMovies Backend Server running on port ${PORT}`);
      console.log(`📡 Real-time Socket.IO enabled`);
      console.log(`🎬 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
