import { apiFetch } from '../../shared/api/client';

export interface DonationRequest {
  amount: number;
  donorName?: string;
  donorEmail?: string;
  message?: string;
}

export interface DonationResponse {
  orderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  status: string;
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const createDonationOrder = async (data: DonationRequest): Promise<DonationResponse> => {
  const response = await apiFetch('/api/donations/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create donation order');
  }

  return response.json();
};

export const verifyDonationPayment = async (data: PaymentVerificationRequest): Promise<{ status: string; message: string }> => {
  const response = await apiFetch('/api/donations/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Payment verification failed');
  }

  return response.json();
};
