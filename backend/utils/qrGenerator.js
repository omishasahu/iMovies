const QRCode = require('qrcode');

/**
 * Generate a QR code base64 Data URL for a booking
 */
const generateBookingQRCode = async (bookingData) => {
  try {
    const payload = JSON.stringify({
      bookingId: bookingData.bookingId,
      movie: bookingData.movieTitle,
      theatre: bookingData.theatreName,
      dateTime: `${bookingData.showDate} ${bookingData.showTime}`,
      seats: bookingData.seats.map((s) => s.seatNumber).join(', '),
      totalAmount: `₹${bookingData.totalAmount}`
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#0a0e17',
        light: '#ffffff'
      },
      width: 256
    });

    return qrDataUrl;
  } catch (err) {
    console.error('QR code generation failed:', err.message);
    return '';
  }
};

module.exports = { generateBookingQRCode };
