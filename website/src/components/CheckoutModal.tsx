import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateBookingQuote, createBookingApi, createPaymentOrderApi, PaymentOrderResponse } from '../services/api';
import { PaymentGatewayModal } from './PaymentGatewayModal';

export const CheckoutModal: React.FC = () => {
  const { checkoutItem, setCheckoutItem, setActiveConfirmation, addBooking, user, setIsAuthModalOpen } = useApp();

  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'PAY_AT_STAY'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Gateway State
  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentOrderResponse | null>(null);
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);

  // Sync with user profile if user logs in while modal is open
  React.useEffect(() => {
    if (user) {
      if (!guestName) setGuestName(user.name || '');
      if (!guestEmail) setGuestEmail(user.email || '');
      if (!guestPhone) setGuestPhone(user.phone || '');
    }
  }, [user]);

  if (!checkoutItem) return null;

  const { stay, experience, checkIn = '2026-08-16', checkOut = '2026-08-18', guests = 2, slotId } = checkoutItem;

  const isStay = !!stay;
  const itemTitle = isStay ? stay!.title : experience!.title;
  const itemLocation = isStay ? stay!.location : experience!.location;
  const itemImage = isStay ? stay!.imageUrls[0] : experience!.imageUrls[0];
  const price = isStay ? stay!.pricePerNight : experience!.pricePerPerson;
  const adultCount = checkoutItem.adults || (isStay ? 2 : guests || 1);
  const kidCount = checkoutItem.children || 0;
  const expBaseTotal = isStay
    ? 0
    : Math.round(price * adultCount + price * 0.5 * kidCount);

  const quote = isStay
    ? calculateBookingQuote(price, checkIn, checkOut)
    : {
        nights: 1,
        basePrice: price,
        baseTotal: expBaseTotal,
        cleaningFee: 0,
        serviceFee: 0,
        gstAmount: Math.round(expBaseTotal * 0.18),
        discountAmount: 0,
        totalAmount: Math.round(expBaseTotal * 1.18),
      };

  const handleFinalizeBooking = async (paidMethod: string, _transactionRef?: string) => {
    const finalName = guestName.trim() || user?.name || 'Guest';
    const finalEmail = guestEmail.trim() || user?.email || 'guest@stayq.space';
    const finalPhone = guestPhone.trim() || user?.phone || '+91 9999999999';

    setIsSubmitting(true);
    try {
      const newBooking = await createBookingApi({
        type: isStay ? 'STAY' : 'EXPERIENCE',
        itemId: isStay ? stay!.id : experience!.id,
        itemTitle,
        itemLocation,
        itemImage,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestName: finalName,
        guestEmail: finalEmail,
        guestPhone: finalPhone,
        guestsCount: guests,
        totalPrice: quote.totalAmount,
        paymentMethod: paidMethod,
        slotDetails: slotId ? `Slot: ${slotId}` : undefined,
      });

      addBooking(newBooking);
      setIsGatewayOpen(false);
      setActivePaymentOrder(null);
      setCheckoutItem(null);
      setActiveConfirmation(newBooking);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const finalName = guestName.trim() || user.name || 'Guest';
    const finalEmail = guestEmail.trim() || user.email || 'guest@stayq.space';
    const finalPhone = guestPhone.trim() || user.phone || '+91 9999999999';

    if (paymentMethod === 'PAY_AT_STAY') {
      await handleFinalizeBooking('Pay at Check-in (Zero Deposit)');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createPaymentOrderApi({
        amount: quote.totalAmount,
        customerName: finalName,
        customerEmail: finalEmail,
        customerPhone: finalPhone,
      });
      if (order && order.orderId) {
        setActivePaymentOrder(order);
        setIsGatewayOpen(true);
      } else {
        alert('Could not initialize payment session. Please try again.');
      }
    } catch (err) {
      console.error('[CheckoutModal] Payment order creation failed:', err);
      alert('Payment initialization failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-modal-backdrop" onClick={() => setCheckoutItem(null)}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal__header">
          <h2 className="h3">Confirm and Pay</h2>
          <button className="modal-close-btn" onClick={() => setCheckoutItem(null)}>
            <X size={20} />
          </button>
        </div>

        <form className="checkout-modal__body" onSubmit={handleConfirmBooking}>
          {/* Left: Guest Details & Payment Selection */}
          <div className="checkout-form-col">
            {/* Step 1: Trip Details Summary */}
            <div className="checkout-section">
              <h3 className="checkout-section-title">1. Trip Summary</h3>
              <div className="checkout-trip-details">
                <div className="checkout-trip-row">
                  <div>
                    <strong>Dates</strong>
                    <p>{checkIn} &rarr; {checkOut} ({quote.nights} {quote.nights === 1 ? 'night' : 'nights'})</p>
                  </div>
                </div>
                <div className="checkout-trip-row">
                  <div>
                    <strong>Travel Crew &amp; Guests</strong>
                    <p style={{ margin: 0, fontWeight: 700 }}>{guests} {guests === 1 ? 'Guest' : 'Guests'}</p>
                    {(checkoutItem.adults || checkoutItem.children || checkoutItem.infants || checkoutItem.pets) && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'block', marginTop: '0.2rem' }}>
                        {[
                          checkoutItem.adults ? `${checkoutItem.adults} adult${checkoutItem.adults > 1 ? 's' : ''}` : '',
                          checkoutItem.children ? `${checkoutItem.children} child${checkoutItem.children > 1 ? 'ren' : ''}` : '',
                          checkoutItem.infants ? `${checkoutItem.infants} infant${checkoutItem.infants > 1 ? 's' : ''}` : '',
                          checkoutItem.pets ? `${checkoutItem.pets} pet${checkoutItem.pets > 1 ? 's' : ''}` : '',
                        ].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Guest Information */}
            <div className="checkout-section">
              <h3 className="checkout-section-title">2. Guest Information</h3>
              <div className="checkout-inputs-grid">
                <div className="checkout-input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Kabir Verma"
                  />
                </div>
                <div className="checkout-input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="e.g. kabir@gmail.com"
                  />
                </div>
                <div className="checkout-input-group">
                  <label>Phone Number (for OTP & gate access)</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="checkout-input-group">
                  <label>Special Requests (Optional)</label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Early check-in, dietary restrictions"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="checkout-section">
              <h3 className="checkout-section-title">3. Payment Method</h3>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'UPI' ? 'payment-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                  />
                  <div className="payment-option__content">
                    <div className="payment-option__icon">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <strong>Instant UPI (Google Pay, PhonePe, Paytm)</strong>
                      <p>Scan QR code or pay directly from any UPI app</p>
                    </div>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'CARD' ? 'payment-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                  />
                  <div className="payment-option__content">
                    <div className="payment-option__icon">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <strong>Credit / Debit Card</strong>
                      <p>Visa, MasterCard, RuPay, American Express</p>
                    </div>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'PAY_AT_STAY' ? 'payment-option--active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'PAY_AT_STAY'}
                    onChange={() => setPaymentMethod('PAY_AT_STAY')}
                  />
                  <div className="payment-option__content">
                    <div className="payment-option__icon">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <strong>Pay at Check-in</strong>
                      <p>Reserve now with zero advance deposit, pay host on arrival</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary Sticky Card */}
          <div className="checkout-summary-col">
            <div className="checkout-order-card">
              <div className="checkout-order-card__item">
                <img src={itemImage} alt={itemTitle} />
                <div>
                  <span className="checkout-order-card__category">{isStay ? stay!.category : experience!.category}</span>
                  <h4>{itemTitle}</h4>
                  <p>{itemLocation}</p>
                </div>
              </div>

              <div className="checkout-order-card__divider" />

              <h4 className="checkout-order-card__heading">Price Details</h4>
              <div className="checkout-order-card__breakdown">
                <div className="checkout-row">
                  <span>
                    ₹{price.toLocaleString('en-IN')} × {isStay ? `${quote.nights} nights` : `${guests} guests`}
                  </span>
                  <span>₹{quote.baseTotal.toLocaleString('en-IN')}</span>
                </div>
                {quote.cleaningFee > 0 && (
                  <div className="checkout-row">
                    <span>Cleaning fee</span>
                    <span>₹{quote.cleaningFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="checkout-row">
                  <span>Taxes & GST (18%)</span>
                  <span>₹{quote.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                {quote.discountAmount > 0 && (
                  <div className="checkout-row checkout-row--discount">
                    <span>Discount</span>
                    <span>-₹{quote.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="checkout-order-card__divider" />

                <div className="checkout-row checkout-row--total">
                  <span>Total Amount</span>
                  <strong>₹{quote.totalAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="checkout-guarantee">
                <ShieldCheck size={18} />
                <span>Stay Q Money-Back Guarantee & 24/7 Support</span>
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--block btn--lg checkout-submit-btn"
                disabled={isSubmitting}
              >
                <Lock size={16} />
                <span>{isSubmitting ? 'Processing Booking...' : `Pay ₹${quote.totalAmount.toLocaleString('en-IN')}`}</span>
              </button>

              <p className="checkout-terms">
                By selecting the button above, you agree to the Property Rules and Stay Q Cancellation Policy.
              </p>
            </div>
          </div>
        </form>

        {/* Live Ultra-Real Payment Gateway Terminal */}
        <PaymentGatewayModal
          isOpen={isGatewayOpen}
          onClose={() => setIsGatewayOpen(false)}
          order={activePaymentOrder}
          guestName={guestName.trim() || user?.name || 'Guest'}
          guestEmail={guestEmail.trim() || user?.email || 'guest@stayq.space'}
          guestPhone={guestPhone.trim() || user?.phone || '+91 9999999999'}
          itemTitle={itemTitle}
          onPaymentSuccess={(paymentRef, method) => {
            handleFinalizeBooking(method, paymentRef);
          }}
        />
      </div>
    </div>
  );
};
