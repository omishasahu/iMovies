const crypto = require('crypto');
const Razorpay = require('razorpay');

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (
    key_id &&
    key_secret &&
    !key_id.includes('demoKeyId') &&
    key_id.startsWith('rzp_')
  ) {
    try {
      return new Razorpay({ key_id, key_secret });
    } catch (e) {
      console.warn('Razorpay init error:', e.message);
      return null;
    }
  }
  return null;
};

// @desc    Get payment gateway configuration / capabilities
// @route   GET /api/payment/config
// @access  Public
exports.getPaymentConfig = (req, res) => {
  const instance = getRazorpayInstance();
  const hasLiveRazorpay = !!instance;

  res.json({
    success: true,
    razorpayEnabled: hasLiveRazorpay,
    razorpayKeyId: hasLiveRazorpay ? process.env.RAZORPAY_KEY_ID : null,
    mockPaymentEnabled: true,
    message: hasLiveRazorpay
      ? 'Razorpay Test Mode is active.'
      : 'Mock Payment Gateway is active for zero-config testing.'
  });
};

// @desc    Initiate payment order (Razorpay or Mock)
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required.'
      });
    }

    const razorpay = getRazorpayInstance();

    // If Razorpay live/test credentials are configured
    if (razorpay) {
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`
      };

      try {
        const order = await razorpay.orders.create(options);
        return res.json({
          success: true,
          mode: 'razorpay',
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID
        });
      } catch (err) {
        console.warn('Razorpay order creation failed, falling back to mock payment:', err.message);
      }
    }

    // Mock Payment Gateway fallback
    const mockOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    res.json({
      success: true,
      mode: 'mock',
      orderId: mockOrderId,
      amount: Math.round(amount * 100),
      currency,
      message: 'Mock payment order generated. You can test instant checkout without real credit cards.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify payment signature / status
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_order_id } = req.body;

    // 1. Mock payment verification
    if (mock_order_id) {
      return res.json({
        success: true,
        verified: true,
        mode: 'mock',
        paymentId: `MOCK_TXN_${Date.now()}`,
        message: 'Mock payment verification successful.'
      });
    }

    // 2. Razorpay signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay secret not configured.'
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({
        success: true,
        verified: true,
        mode: 'razorpay',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        message: 'Razorpay signature verified successfully.'
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        message: 'Payment verification failed: invalid signature.'
      });
    }
  } catch (err) {
    next(err);
  }
};
