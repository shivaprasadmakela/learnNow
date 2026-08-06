import React, { useState } from 'react';
import { Button, Input } from '../../../shared/components';
import { createDonationOrder, verifyDonationPayment } from '../donationService';
import styles from './BuyMeACoffeeModal.module.css';

interface BuyMeACoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name?: string; email?: string } | null;
}

const PRESETS = [
  { count: 1, amount: 50, emoji: '☕', label: '1 Coffee' },
  { count: 2, amount: 100, emoji: '☕☕', label: '2 Coffees' },
  { count: 5, amount: 250, emoji: '☕☕☕', label: '5 Coffees' },
];

export const BuyMeACoffeeModal: React.FC<BuyMeACoffeeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('100');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [donorName, setDonorName] = useState<string>(currentUser?.name || '');
  const [donorEmail, setDonorEmail] = useState<string>(currentUser?.email || '');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
    setIsCustomMode(false);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedAmount(parsed);
    }
    setIsCustomMode(true);
  };

  const handlePayment = async () => {
    setError(null);
    const amountToPay = selectedAmount;

    if (amountToPay < 1) {
      setError('Please enter a valid donation amount (minimum ₹1).');
      return;
    }

    try {
      setLoading(true);

      const order = await createDonationOrder({
        amount: amountToPay,
        donorName: donorName.trim() || undefined,
        donorEmail: donorEmail.trim() || undefined,
        message: message.trim() || undefined,
      });

      if (order.orderId.startsWith('order_mock_')) {
        console.warn('Mock order detected. Simulating successful checkout.');
        await verifyDonationPayment({
          razorpayOrderId: order.orderId,
          razorpayPaymentId: 'pay_mock_' + Date.now(),
          razorpaySignature: 'sig_mock_sandbox',
        });
        setLoading(false);
        setPaymentSuccess(true);
        return;
      }

      // Ensure Razorpay SDK is loaded on demand
      if (!(window as any).Razorpay) {
        const isLoaded = await new Promise<boolean>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (!isLoaded) {
          setError('Failed to load Razorpay payment gateway. Please check your internet connection.');
          setLoading(false);
          return;
        }
      }

      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: 'learnNow',
        description: 'Support learnNow platform ☕',
        order_id: order.orderId,
        prefill: {
          name: donorName || '',
          email: donorEmail || '',
        },
        theme: {
          color: '#005995',
        },
        handler: async function (response: any) {
          try {
            setLoading(true);
            await verifyDonationPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPaymentSuccess(true);
          } catch (err: any) {
            setError(err.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (resp: any) {
        setError(resp.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });

      razorpay.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPaymentSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {paymentSuccess ? (
          <div className={styles.successView}>
            <div className={styles.successBadge}>☕</div>
            <h3 className={styles.formTitle}>Thank You for Your Support!</h3>
            <p className={styles.subtitle}>
              Your contribution helps keep <strong>learnNow</strong> open, fast, and accessible for developers everywhere.
            </p>
            <div className={styles.actionsRow} style={{ marginTop: '24px' }}>
              <Button variant="primary" onClick={handleReset} style={{ width: '100%' }}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.heroBanner}>
              <div className={styles.heroBadge}>☕</div>
              <h3 className={styles.formTitle}>Support learnNow</h3>
              <p className={styles.subtitle}>
                Buy us a coffee to keep server costs covered & new features coming!
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.formBody}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Select Support Tier</span>
              </div>

              <div className={styles.presetsGrid}>
                {PRESETS.map((p) => {
                  const isActive = !isCustomMode && selectedAmount === p.amount;
                  return (
                    <button
                      key={p.amount}
                      type="button"
                      className={`${styles.presetBtn} ${isActive ? styles.presetBtnActive : ''}`}
                      onClick={() => handleSelectPreset(p.amount)}
                    >
                      <span className={styles.presetEmoji}>{p.emoji}</span>
                      <span className={styles.presetLabel}>{p.label}</span>
                      <span className={styles.presetAmount}>₹{p.amount}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.customAmountRow}>
                <Input
                  label="Or enter custom amount (₹)"
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                />
              </div>

              <div className={styles.twoColumnGrid}>
                <Input
                  label="Your Name (Optional)"
                  type="text"
                  placeholder="e.g. Alex"
                  value={donorName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDonorName(e.target.value)}
                />
                <Input
                  label="Your Email (Optional)"
                  type="email"
                  placeholder="alex@example.com"
                  value={donorEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDonorEmail(e.target.value)}
                />
              </div>

              <div className={styles.textareaContainer}>
                <label className={styles.textareaLabel}>Message / Note (Optional)</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Love the course tracks & playground!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />
              </div>

              <div className={styles.actionsRow}>
                <Button
                  variant="primary"
                  onClick={handlePayment}
                  isLoading={loading}
                  style={{ width: '100%' }}
                >
                  ☕ Pay ₹{selectedAmount} via Razorpay
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
