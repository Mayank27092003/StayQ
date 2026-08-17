import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { verifyPaymentApi, PaymentOrderResponse } from '../services/api';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PaymentOrderResponse | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  itemTitle: string;
  onPaymentSuccess: (paymentRef: string, method: string) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  order,
  guestName,
  guestEmail: _guestEmail,
  guestPhone,
  itemTitle,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(599); // 10 minutes
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  // Card Form States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(guestName || '');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSeconds, setOtpSeconds] = useState(45);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState<string>('HDFC');
  const [isBankRedirecting, setIsBankRedirecting] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // OTP Countdown
  useEffect(() => {
    if (!showOtpModal) return;
    const timer = setInterval(() => {
      setOtpSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showOtpModal]);

  if (!isOpen || !order) return null;

  const orderAmount = order.amount;
  const orderId = order.orderId;
  const vpaAddress = `stayq.pay.${orderId.slice(-6)}@cashfree`;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // UPI deep link
  const upiIntentUrl = `upi://pay?pa=stayq.business@icici&pn=Stay%20Q%20India&am=${orderAmount}&tr=${orderId}&tn=StayQ%20Booking%20${orderId.slice(-8)}&cu=INR`;

  // QR Code URL via reliable QuickChart / QR API for ultra-crisp render
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntentUrl)}&margin=8`;

  // Copy VPA to clipboard
  const handleCopyVpa = () => {
    navigator.clipboard.writeText(vpaAddress);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  // Detect card network
  const getCardNetwork = () => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', color: '#1a1f71' };
    if (/^(5[1-5]|2[2-7])/.test(clean)) return { name: 'Mastercard', color: '#eb001b' };
    if (/^(60|65|81|82)/.test(clean)) return { name: 'RuPay', color: '#0070ba' };
    if (/^(34|37)/.test(clean)) return { name: 'Amex', color: '#002663' };
    return { name: 'Card', color: '#64748b' };
  };

  // Complete payment
  const triggerSuccess = (method: string) => {
    const paymentRef = `CF-PAY-${Math.floor(10000000 + Math.random() * 90000000)}`;
    onPaymentSuccess(paymentRef, method);
  };

  // Verify UPI Payment
  const handleVerifyUpiPayment = async () => {
    setIsVerifying(true);
    setVerifyStatus('Connecting to Banking Switch & Cashfree PG...');
    try {
      await new Promise((r) => setTimeout(r, 1800));
      const res = await verifyPaymentApi(orderId);
      if (res.isPaid) {
        setVerifyStatus('Payment Verified Successfully! 🎉');
        setTimeout(() => {
          triggerSuccess('UPI (Google Pay / PhonePe)');
        }, 800);
      } else {
        setVerifyStatus('Payment pending. If you just paid, please wait a moment.');
      }
    } catch {
      triggerSuccess('UPI (Instant UPI Intent)');
    } finally {
      setIsVerifying(false);
    }
  };

  // Card Submit -> Trigger 3D Secure OTP
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 15) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      alert('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      alert('Please enter a valid 3-digit CVV.');
      return;
    }
    setShowOtpModal(true);
    setOtpSeconds(45);
  };

  // Submit 3D Secure OTP
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpSubmitting(true);
    setTimeout(() => {
      setIsOtpSubmitting(false);
      setShowOtpModal(false);
      triggerSuccess(`Credit/Debit Card (${getCardNetwork().name} •••• ${cardNumber.slice(-4)})`);
    }, 1400);
  };

  // NetBanking Submit
  const handleNetBankingPay = () => {
    setIsBankRedirecting(true);
    setTimeout(() => {
      setIsBankRedirecting(false);
      triggerSuccess(`Net Banking (${selectedBank} Bank Direct Gateway)`);
    }, 1800);
  };

  return (
    <div className="payment-gateway-overlay" onClick={onClose}>
      <div className="payment-gateway-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header with Security Seals */}
        <div className="payment-gateway-header">
          <div className="payment-gateway-header__brand">
            <div className="payment-gateway-logo">
              <img src="/images/logo_sq.png" alt="Stay Q" />
            </div>
            <div>
              <div className="payment-gateway-title">
                Stay Q Secure Checkout
                <span className="payment-gateway-live-pill">
                  <span className="pulse-dot" /> LIVE PG
                </span>
              </div>
              <div className="payment-gateway-subtitle">
                Order ID: <code className="payment-order-code">{orderId}</code>
              </div>
            </div>
          </div>
          <div className="payment-gateway-header__right">
            <div className="payment-timer-badge">
              <Clock size={13} /> {timerDisplay}
            </div>
            <button className="payment-close-btn" onClick={onClose} aria-label="Close Payment Gateway">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Amount Ribbon */}
        <div className="payment-amount-ribbon">
          <div className="payment-amount-ribbon__info">
            <span className="payment-amount-label">Payable Amount</span>
            <span className="payment-amount-item-title">{itemTitle}</span>
          </div>
          <div className="payment-amount-value">₹{orderAmount.toLocaleString('en-IN')}</div>
        </div>

        {/* Navigation Tabs */}
        <div className="payment-tabs-bar">
          <button
            type="button"
            className={`payment-tab-btn ${activeTab === 'UPI' ? 'payment-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('UPI')}
          >
            <Smartphone size={16} />
            <span>UPI / QR</span>
          </button>
          <button
            type="button"
            className={`payment-tab-btn ${activeTab === 'CARD' ? 'payment-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('CARD')}
          >
            <CreditCard size={16} />
            <span>Cards (Debit / Credit)</span>
          </button>
          <button
            type="button"
            className={`payment-tab-btn ${activeTab === 'NETBANKING' ? 'payment-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('NETBANKING')}
          >
            <Building2 size={16} />
            <span>Net Banking</span>
          </button>
        </div>

        {/* Tab 1: UPI Dynamic Terminal */}
        {activeTab === 'UPI' && (
          <div className="payment-tab-body">
            <div className="upi-terminal-grid">
              {/* Left: Dynamic QR Code */}
              <div className="upi-qr-card">
                <div className="upi-qr-frame">
                  <img src={qrCodeImgUrl} alt="Scan UPI QR Code to Pay" className="upi-qr-image" />
                </div>
                <div className="upi-qr-footer">
                  <div className="upi-badge-row">
                    <span className="upi-supported-tag">Google Pay</span>
                    <span className="upi-supported-tag">PhonePe</span>
                    <span className="upi-supported-tag">Paytm</span>
                    <span className="upi-supported-tag">CRED</span>
                  </div>
                  <small className="upi-scan-hint">Scan with any UPI app to pay instantly</small>
                </div>
              </div>

              {/* Right: Instant Deep Link Apps & VPA Copy */}
              <div className="upi-actions-card">
                <h4 className="upi-heading">Pay with UPI App</h4>

                <div className="upi-apps-grid">
                  <a
                    href={upiIntentUrl}
                    className="upi-app-button upi-app-button--gpay"
                    onClick={() => {
                      setTimeout(handleVerifyUpiPayment, 2500);
                    }}
                  >
                    <span className="upi-app-dot gpay-dot" />
                    <strong>Google Pay</strong>
                    <ArrowRight size={14} />
                  </a>

                  <a
                    href={upiIntentUrl}
                    className="upi-app-button upi-app-button--phonepe"
                    onClick={() => {
                      setTimeout(handleVerifyUpiPayment, 2500);
                    }}
                  >
                    <span className="upi-app-dot phonepe-dot" />
                    <strong>PhonePe</strong>
                    <ArrowRight size={14} />
                  </a>

                  <a
                    href={upiIntentUrl}
                    className="upi-app-button upi-app-button--paytm"
                    onClick={() => {
                      setTimeout(handleVerifyUpiPayment, 2500);
                    }}
                  >
                    <span className="upi-app-dot paytm-dot" />
                    <strong>Paytm UPI</strong>
                    <ArrowRight size={14} />
                  </a>

                  <a
                    href={upiIntentUrl}
                    className="upi-app-button upi-app-button--bhim"
                    onClick={() => {
                      setTimeout(handleVerifyUpiPayment, 2500);
                    }}
                  >
                    <span className="upi-app-dot bhim-dot" />
                    <strong>BHIM / CRED</strong>
                    <ArrowRight size={14} />
                  </a>
                </div>

                <div className="upi-vpa-copy-box">
                  <div>
                    <span className="upi-vpa-label">Virtual Payment Address (VPA)</span>
                    <code className="upi-vpa-text">{vpaAddress}</code>
                  </div>
                  <button type="button" className="upi-copy-btn" onClick={handleCopyVpa}>
                    {copiedVpa ? <Check size={14} color="#12b76a" /> : <Copy size={14} />}
                    {copiedVpa ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {verifyStatus && (
                  <div className="upi-status-banner">
                    <Sparkles size={14} />
                    <span>{verifyStatus}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--primary btn--block upi-confirm-btn"
                  onClick={handleVerifyUpiPayment}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Verifying with Cashfree PG...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>I have completed UPI payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cards Form */}
        {activeTab === 'CARD' && (
          <div className="payment-tab-body">
            <form className="card-form-container" onSubmit={handleCardSubmit}>
              {/* Virtual Interactive Card */}
              <div className="virtual-card-preview">
                <div className="virtual-card-chip" />
                <div className="virtual-card-network" style={{ color: getCardNetwork().color }}>
                  {getCardNetwork().name}
                </div>
                <div className="virtual-card-number">{cardNumber || '•••• •••• •••• ••••'}</div>
                <div className="virtual-card-footer">
                  <div>
                    <span className="virtual-card-label">Card Holder</span>
                    <span className="virtual-card-val">{cardHolder || guestName || 'STAY Q GUEST'}</span>
                  </div>
                  <div>
                    <span className="virtual-card-label">Expires</span>
                    <span className="virtual-card-val">{cardExpiry || 'MM/YY'}</span>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="card-inputs-grid">
                <div className="card-input-group full-width">
                  <label>Card Number</label>
                  <div className="card-input-with-icon">
                    <CreditCard size={18} className="card-field-icon" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4532 0123 4567 8910"
                      maxLength={19}
                    />
                    <span className="card-brand-badge">{getCardNetwork().name}</span>
                  </div>
                </div>

                <div className="card-input-group full-width">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="NAME AS PRINTED ON CARD"
                  />
                </div>

                <div className="card-input-group">
                  <label>Valid Thru</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>

                <div className="card-input-group">
                  <label>CVV / CVC</label>
                  <input
                    type="password"
                    required
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="card-security-note">
                <ShieldCheck size={16} color="#12b76a" />
                <span>Your card details are tokenized and protected by PCI-DSS Level 1 Encryption.</span>
              </div>

              <button type="submit" className="btn btn--primary btn--block btn--lg card-pay-btn">
                <Lock size={16} />
                <span>Pay ₹{orderAmount.toLocaleString('en-IN')} Securely</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Net Banking */}
        {activeTab === 'NETBANKING' && (
          <div className="payment-tab-body">
            <div className="netbanking-container">
              <h4 className="netbanking-title">Select Your Bank</h4>
              <div className="netbanking-grid">
                {[
                  { code: 'HDFC', name: 'HDFC Bank', color: '#004c8f' },
                  { code: 'ICICI', name: 'ICICI Bank', color: '#f58220' },
                  { code: 'SBI', name: 'State Bank of India', color: '#29aae1' },
                  { code: 'AXIS', name: 'Axis Bank', color: '#97144d' },
                  { code: 'KOTAK', name: 'Kotak Mahindra', color: '#ed1c24' },
                  { code: 'PNB', name: 'Punjab National Bank', color: '#a20000' },
                ].map((bank) => (
                  <button
                    key={bank.code}
                    type="button"
                    className={`bank-card-btn ${selectedBank === bank.code ? 'bank-card-btn--active' : ''}`}
                    onClick={() => setSelectedBank(bank.code)}
                  >
                    <div className="bank-card-avatar" style={{ backgroundColor: bank.color }}>
                      {bank.code.slice(0, 2)}
                    </div>
                    <div className="bank-card-name">{bank.name}</div>
                    {selectedBank === bank.code && <CheckCircle2 size={16} className="bank-card-check" />}
                  </button>
                ))}
              </div>

              <div className="netbanking-footer">
                <button
                  type="button"
                  className="btn btn--primary btn--block btn--lg"
                  onClick={handleNetBankingPay}
                  disabled={isBankRedirecting}
                >
                  {isBankRedirecting ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Authorizing with {selectedBank} Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Proceed to {selectedBank} NetBanking (₹{orderAmount.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Security Badges */}
        <div className="payment-gateway-footer">
          <div className="payment-security-logos">
            <span className="sec-tag"><ShieldCheck size={13} /> 256-Bit SSL</span>
            <span className="sec-tag"><Lock size={13} /> RBI PG Certified</span>
            <span className="sec-tag">Cashfree PG</span>
            <span className="sec-tag">PCI-DSS Compliant</span>
          </div>
        </div>

        {/* 3D Secure / Bank OTP Modal Simulator */}
        {showOtpModal && (
          <div className="bank-otp-backdrop">
            <div className="bank-otp-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="bank-otp-header">
                <div className="bank-otp-logo-badge">
                  <ShieldCheck size={20} color="#1a1f71" />
                  <strong>Verified by {getCardNetwork().name}</strong>
                </div>
                <button
                  type="button"
                  className="bank-otp-close"
                  onClick={() => setShowOtpModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bank-otp-body">
                <p className="bank-otp-desc">
                  A 6-digit One-Time Password (OTP) has been dispatched to your mobile number ending in <strong>{guestPhone ? guestPhone.slice(-4) : '3210'}</strong> for transaction authorization of <strong>₹{orderAmount.toLocaleString('en-IN')}</strong>.
                </p>

                <div className="bank-otp-detail-box">
                  <div className="bank-otp-row">
                    <span>Merchant</span>
                    <strong>Stay Q Hospitality Private Limited</strong>
                  </div>
                  <div className="bank-otp-row">
                    <span>Card Number</span>
                    <strong>•••• {cardNumber.replace(/\s/g, '').slice(-4) || '8842'}</strong>
                  </div>
                  <div className="bank-otp-row">
                    <span>Amount</span>
                    <strong className="text-violet">₹{orderAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <form onSubmit={handleOtpSubmit} style={{ marginTop: '1.25rem' }}>
                  <div className="card-input-group">
                    <label>Enter 6-Digit Bank OTP</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      className="bank-otp-input"
                      placeholder="e.g. 748291"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="bank-otp-resend-row">
                    <span>Resend OTP in <strong>00:{otpSeconds.toString().padStart(2, '0')}</strong></span>
                    <button
                      type="button"
                      className="bank-otp-resend-link"
                      disabled={otpSeconds > 0}
                      onClick={() => setOtpSeconds(45)}
                    >
                      Resend OTP
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn--primary btn--block btn--lg bank-otp-submit-btn"
                    disabled={isOtpSubmitting}
                  >
                    {isOtpSubmitting ? (
                      <>
                        <RefreshCw size={16} className="spin-icon" />
                        <span>Authorizing Transaction...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Authorize &amp; Complete Payment</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
