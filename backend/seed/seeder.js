const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('../config/db');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const { moviesData, theatresData } = require('./seedData');

const seedAll = async (auto = false) => {
  try {
    if (!auto) {
      await connectDB();
    }

    console.log('[Seeder] Checking existing data...');

    // Clear existing collections if manually invoked
    if (!auto) {
      await Promise.all([
        User.deleteMany(),
        Movie.deleteMany(),
        Theatre.deleteMany(),
        Show.deleteMany(),
        Booking.deleteMany()
      ]);
      console.log('[Seeder] Cleared previous database records.');
    }

    // 1. Create Default Users (Admin & Demo User)
    const adminUser = await User.create({
      username: 'Admin Officer',
      email: 'admin@imovies.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPassword@123',
      role: 'admin',
      phone: '+91 98765 43210'
    });

    const demoUser = await User.create({
      username: 'Rahul Verma',
      email: 'user@imovies.com',
      password: process.env.USER_PASSWORD || 'UserPassword@123',
      role: 'user',
      phone: '+91 98123 45678'
    });

    console.log('[Seeder] Created Admin user: admin@imovies.com');
    console.log('[Seeder] Created Demo user: user@imovies.com');

    // 2. Insert Movies
    const createdMovies = await Movie.insertMany(moviesData);
    console.log(`[Seeder] Inserted ${createdMovies.length} movies.`);

    // 3. Insert Theatres
    const createdTheatres = await Theatre.insertMany(theatresData);
    console.log(`[Seeder] Inserted ${createdTheatres.length} theatres.`);

    // 4. Create Shows for the next 7 days
    const showtimes = ['10:30 AM', '02:00 PM', '06:30 PM', '09:45 PM'];
    const now = new Date();
    const showsToInsert = [];

    // Helper for formatting date as YYYY-MM-DD
    const formatDate = (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // For first 4 movies that are 'now_showing'
    const nowShowingMovies = createdMovies.filter((m) => m.status === 'now_showing');

    // Generate dates for today + next 4 days
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);
      const dateString = formatDate(targetDate);

      // Loop through theatres
      createdTheatres.forEach((theatre, tIndex) => {
        // Pick 2 movies per theatre for this date
        const assignedMovies = [
          nowShowingMovies[tIndex % nowShowingMovies.length],
          nowShowingMovies[(tIndex + 1) % nowShowingMovies.length]
        ];

        assignedMovies.forEach((movie, mIndex) => {
          const times = mIndex === 0 ? ['10:30 AM', '06:30 PM'] : ['02:00 PM', '09:45 PM'];

          times.forEach((time) => {
            const seats = Show.generateSeatsFromTheatre(theatre);

            // Pre-simulate a few booked seats for realistic looks (e.g. 4-6 seats booked)
            if (dayOffset === 0 && (time === '06:30 PM' || time === '09:45 PM')) {
              const bookedIndices = [5, 6, 14, 15, 25];
              bookedIndices.forEach((idx) => {
                if (seats[idx]) {
                  seats[idx].status = 'booked';
                }
              });
            }

            showsToInsert.push({
              movie: movie._id,
              theatre: theatre._id,
              showDate: dateString,
              showTime: time,
              screenName: theatre.screenName,
              seatTiers: {
                balcony: { price: theatre.seatConfiguration.balcony.price },
                middle: { price: theatre.seatConfiguration.middle.price },
                lower: { price: theatre.seatConfiguration.lower.price }
              },
              seats,
              totalSeats: seats.length,
              availableSeatsCount: seats.filter((s) => s.status === 'available').length,
              isActive: true
            });
          });
        });
      });
    }

    const createdShows = await Show.insertMany(showsToInsert);
    console.log(`[Seeder] Generated ${createdShows.length} dynamic scheduled shows with full seating layouts.`);

    // 5. Create a sample confirmed booking for Demo User
    if (createdShows.length > 0) {
      const sampleShow = createdShows[0];
      const bookedSeats = [sampleShow.seats[5], sampleShow.seats[6]];

      await Booking.create({
        bookingId: 'IMV-DEMO-TKT01',
        user: demoUser._id,
        movie: sampleShow.movie,
        theatre: sampleShow.theatre,
        show: sampleShow._id,
        movieTitle: 'Oppenheimer',
        moviePoster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
        theatreName: createdTheatres[0].name,
        theatreLocation: `${createdTheatres[0].location}, ${createdTheatres[0].city}`,
        showDate: sampleShow.showDate,
        showTime: sampleShow.showTime,
        screenName: sampleShow.screenName,
        seats: bookedSeats.map((s) => ({
          seatNumber: s.seatNumber,
          tier: s.tier,
          price: s.price
        })),
        ticketCount: 2,
        subtotal: bookedSeats.reduce((acc, s) => acc + s.price, 0),
        convenienceFee: 60,
        totalAmount: bookedSeats.reduce((acc, s) => acc + s.price, 0) + 60,
        paymentStatus: 'completed',
        paymentMethod: 'mock',
        paymentDetails: {
          mockRef: 'MOCK-DEMO-TXN-001',
          paidAt: new Date()
        },
        bookingStatus: 'confirmed',
        qrCode: ''
      });
      console.log('[Seeder] Created sample confirmed booking.');
    }

    console.log('[Seeder] Database seeding completed successfully! 🎉');

    if (!auto) {
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seeder] Error during seeding:', err);
    if (!auto) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedAll(false);
}

module.exports = { seedAll };
