import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MdAccessTime,
  MdShield,
  MdCreditCard,
  MdAccountBalance,
  MdQrCode,
  MdArrowBack,
  MdCheckCircle,
  MdWarning
} from 'react-icons/md';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookingData, setBookingData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins in seconds
  const [paymentMode, setPaymentMode] = useState('mock'); // 'mock' or 'razorpay'
  const [mockPaymentSubMethod, setMockPaymentSubMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);

  // Load active booking session
  useEffect(() => {
    const raw = sessionStorage.getItem('imovies_active_booking');
    if (!raw) {
      toast.warn('No active seat selection found. Please select your seats.');
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setBookingData(parsed);

      // Calculate initial countdown based on expiresAt timestamp
      if (parsed.expiresAt) {
        const remaining = Math.max(
          0,
          Math.floor((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
      }
    } catch (e) {
      navigate('/');
    }

    // Check payment gateway config
    API.get('/payment/config')
      .then((res) => {
        if (res.data.success) {
          setPaymentConfig(res.data);
          if (res.data.razorpayEnabled) {
            setPaymentMode('razorpay');
          }
        }
      })
      .catch(() => {});
  }, [navigate]);

  // Seat Lock Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error('Seat lock expired! Your seats have been released.');
      sessionStorage.removeItem('imovies_active_booking');
      if (bookingData?.showId) {
        navigate(`/seats/${bookingData.showId}`);
      } else {
        navigate('/');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, bookingData, navigate]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Cancel and release seats
  const handleCancelAndRelease = async () => {
    if (bookingData?.showId) {
      try {
        await API.post('/bookings/release-seats', {
          showId: bookingData.showId,
          seatNumbers: bookingData.seatNumbers
        });
      } catch (e) {
        // ignore
      }
    }
    sessionStorage.removeItem('imovies_active_booking');
    navigate(bookingData?.showId ? `/seats/${bookingData.showId}` : '/');
  };

  // Handle Mock Payment Checkout
  const handleMockPayment = async () => {
    setPaymentProcessing(true);
    try {
      // 1. Initiate order
      const orderRes = await API.post('/payment/create-order', {
        amount: bookingData.pricing.totalAmount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });

      // 2. Simulate 1.5s transaction verification
      await new Promise((r) => setTimeout(r, 1200));

      const verifyRes = await API.post('/payment/verify', {
        mock_order_id: orderRes.data.orderId
      });

      if (!verifyRes.data.success) {
        throw new Error('Payment verification failed');
      }

      // 3. Confirm booking on backend
      const bookingRes = await API.post('/bookings', {
        showId: bookingData.showId,
        seatNumbers: bookingData.seatNumbers,
        paymentMethod: 'mock',
        paymentDetails: {
          mockRef: verifyRes.data.paymentId,
          paidAt: new Date()
        }
      });

      if (bookingRes.data.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Store confirmed booking and clear active booking session
        sessionStorage.removeItem('imovies_active_booking');
        sessionStorage.setItem('imovies_last_booking', JSON.stringify(bookingRes.data.booking));

        toast.success('Payment verified! Booking confirmed 🎉');
        navigate(`/booking-confirmation/${bookingRes.data.booking._id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment processing failed.';
      toast.error(msg);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Handle Razorpay Payment
  const handleRazorpayPayment = async () => {
    setPaymentProcessing(true);
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await API.post('/payment/create-order', {
        amount: bookingData.pricing.totalAmount,
        currency: 'INR'
      });

      if (orderRes.data.mode === 'mock') {
        // Fallback to mock if test keys not active
        return handleMockPayment();
      }

      const options = {
        key: orderRes.data.keyId,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: 'iMovies Cinema Booking',
        description: `Booking for ${bookingData.show?.movie?.title}`,
        order_id: orderRes.data.orderId,
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
          contact: user?.phone || '9999999999'
        },
        theme: {
          color: '#e50914'
        },
        handler: async (response) => {
          try {
            // Verify signature
            const verifyRes = await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              // Confirm booking
              const bookingRes = await API.post('/bookings', {
                showId: bookingData.showId,
                seatNumbers: bookingData.seatNumbers,
                paymentMethod: 'razorpay',
                paymentDetails: {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  paidAt: new Date()
                }
              });

              if (bookingRes.data.success) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                sessionStorage.removeItem('imovies_active_booking');
                sessionStorage.setItem('imovies_last_booking', JSON.stringify(bookingRes.data.booking));
                toast.success('Payment verified! Booking confirmed 🎉');
                navigate(`/booking-confirmation/${bookingRes.data.booking._id}`);
              }
            }
          } catch (verifyErr) {
            toast.error('Payment signature verification failed.');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            toast.info('Payment was cancelled.');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      toast.error('Razorpay initialization failed. Switching to Demo Mock Payment.');
      handleMockPayment();
    }
  };

  if (!bookingData) return null;

  return (
    <div className="py-5">
      <div className="container">
        {/* Lock Expiry Alert Banner */}
        <div className="alert alert-warning d-flex align-items-center justify-content-between p-3 rounded-3 mb-4 border-warning bg-opacity-10 bg-warning text-warning">
          <div className="d-flex align-items-center gap-2">
            <MdAccessTime size={22} />
            <div>
              <strong>Seats are temporarily locked!</strong> Please complete payment before the timer expires.
            </div>
          </div>
          <div className="badge bg-warning text-dark fs-6 px-3 py-2 fw-bold font-monospace">
            {formatCountdown(timeLeft)}
          </div>
        </div>

        <div className="row g-4">
          {/* Left Column: Order Breakdown & Movie Info */}
          <div className="col-lg-7">
            <div className="cinema-glass-card mb-4">
              <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-secondary mb-3">
                <h5 className="text-light fw-bold mb-0">Order Summary</h5>
                <button
                  className="btn btn-outline-secondary btn-sm text-light border-secondary"
                  onClick={handleCancelAndRelease}
                >
                  <MdArrowBack /> Change Seats
                </button>
              </div>

              {/* Movie and Show Details */}
              <div className="d-flex gap-3 mb-4">
                <img
                  src={bookingData.show?.movie?.posterUrl}
                  alt={bookingData.show?.movie?.title}
                  className="rounded"
                  style={{ width: '80px', height: '110px', objectFit: 'cover' }}
                />
                <div>
                  <h4 className="text-light fw-bold mb-1">{bookingData.show?.movie?.title}</h4>
                  <div className="text-muted small mb-2">
                    <span className="badge bg-danger me-2">{bookingData.show?.movie?.certification}</span>
                    <span>{bookingData.show?.movie?.language}</span> •{' '}
                    <span>{bookingData.show?.movie?.runtime}m</span>
                  </div>
                  <div className="text-secondary small">
                    <strong>{bookingData.show?.theatre?.name}</strong> ({bookingData.show?.screenName})
                  </div>
                  <div className="text-danger small fw-bold">
                    {bookingData.show?.showDate} • {bookingData.show?.showTime}
                  </div>
                </div>
              </div>

              {/* Selected Seats Matrix */}
              <div className="mb-4">
                <h6 className="text-light fw-bold small text-uppercase mb-2">
                  Selected Seats ({bookingData.seatDetails?.length || bookingData.seatNumbers?.length}):
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {bookingData.seatDetails?.map((seat) => (
                    <span
                      key={seat.seatNumber}
                      className="badge bg-dark border border-secondary text-light px-3 py-2 d-flex align-items-center gap-2"
                    >
                      <strong className="text-danger">{seat.seatNumber}</strong>
                      <span className="text-muted">({seat.tier})</span>
                      <span className="text-warning">₹{seat.price}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Calculation Table */}
              <div className="border-top border-secondary pt-3">
                <div className="d-flex justify-content-between mb-2 text-muted small">
                  <span>Tickets Subtotal ({bookingData.pricing?.ticketCount} seats)</span>
                  <span className="text-light">₹{bookingData.pricing?.subtotal}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 text-muted small">
                  <span>Convenience Fee & Cinema Tax</span>
                  <span className="text-light">₹{bookingData.pricing?.convenienceFee}</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top border-secondary fs-5 fw-bold">
                  <span className="text-light">Grand Total Amount</span>
                  <span className="text-warning">₹{bookingData.pricing?.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Policy Notes */}
            <div className="cinema-glass-card p-3 text-muted small">
              <div className="d-flex align-items-center gap-2 text-light fw-bold mb-1">
                <MdShield className="text-success" /> Cancellation & Refund Policy
              </div>
              <div>
                Tickets are 85% refundable up to 2 hours before the scheduled showtime.
                Convenience fees are non-refundable. M-Tickets are sent instantly upon payment.
              </div>
            </div>
          </div>

          {/* Right Column: Payment Gateway Selection */}
          <div className="col-lg-5">
            <div className="cinema-glass-card">
              <h5 className="text-light fw-bold mb-3 border-bottom border-secondary pb-3">
                Select Payment Mode
              </h5>

              {/* Mock Cinema Payment Gateway (Enabled by Default / Zero Config) */}
              <div
                className={`p-3 rounded-3 mb-3 border cursor-pointer ${
                  paymentMode === 'mock'
                    ? 'border-danger bg-danger bg-opacity-10'
                    : 'border-secondary bg-dark bg-opacity-50'
                }`}
                onClick={() => setPaymentMode('mock')}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <MdCheckCircle
                      size={20}
                      className={paymentMode === 'mock' ? 'text-danger' : 'text-secondary'}
                    />
                    <strong className="text-light">Mock Cinema Payment (Instant Test Mode)</strong>
                  </div>
                  <span className="badge bg-success">Recommended</span>
                </div>
                <p className="text-muted small mb-3">
                  Test the complete booking workflow immediately without needing real credit cards or external credentials.
                </p>

                {paymentMode === 'mock' && (
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${
                        mockPaymentSubMethod === 'upi' ? 'btn-danger' : 'btn-outline-secondary text-light'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMockPaymentSubMethod('upi');
                      }}
                    >
                      <MdQrCode className="me-1" /> UPI FastPay
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${
                        mockPaymentSubMethod === 'card' ? 'btn-danger' : 'btn-outline-secondary text-light'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMockPaymentSubMethod('card');
                      }}
                    >
                      <MdCreditCard className="me-1" /> Debit / Credit
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${
                        mockPaymentSubMethod === 'netbanking' ? 'btn-danger' : 'btn-outline-secondary text-light'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMockPaymentSubMethod('netbanking');
                      }}
                    >
                      <MdAccountBalance className="me-1" /> NetBanking
                    </button>
                  </div>
                )}
              </div>

              {/* Razorpay Test Mode Option */}
              <div
                className={`p-3 rounded-3 mb-4 border cursor-pointer ${
                  paymentMode === 'razorpay'
                    ? 'border-danger bg-danger bg-opacity-10'
                    : 'border-secondary bg-dark bg-opacity-50'
                }`}
                onClick={() => setPaymentMode('razorpay')}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <MdCheckCircle
                      size={20}
                      className={paymentMode === 'razorpay' ? 'text-danger' : 'text-secondary'}
                    />
                    <strong className="text-light">Razorpay Gateway (Test Mode)</strong>
                  </div>
                  <span className="badge bg-secondary">Official</span>
                </div>
                <p className="text-muted small mb-0">
                  {paymentConfig?.razorpayEnabled
                    ? 'Live Razorpay test credentials detected. Opens popup window.'
                    : 'Uses test mode or automatically falls back to verified mock payment if keys are default.'}
                </p>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                className="btn btn-cinema-primary btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                onClick={paymentMode === 'razorpay' ? handleRazorpayPayment : handleMockPayment}
                disabled={paymentProcessing}
              >
                <MdShield size={20} />
                {paymentProcessing
                  ? 'Verifying Payment & Issuing Tickets...'
                  : `Pay ₹${bookingData.pricing?.totalAmount} & Confirm Tickets`}
              </button>

              <div className="text-center text-muted small mt-3">
                100% Encrypted & Safe Cinema Transaction
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
