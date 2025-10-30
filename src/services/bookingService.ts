// src/services/bookingService.ts

import axios from 'axios';
import store from '../store/userStore';
import PaymentInstance from './paymentInstance';
import RazorpayCheckout from 'react-native-razorpay';

export interface BookingPayload {
  customerid: number;
  serviceproviderid?: number | null; // Make it optional
  start_date: string;
  end_date: string;
  responsibilities: any;
  booking_type: string;
  service_type: string;
  base_amount: number;
  payment_mode?: 'razorpay' | 'UPI' | 'CASH';
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  engagementId: number;
}

// Initialize Razorpay (no script loading needed in React Native)
const initializeRazorpay = async (): Promise<boolean> => {
  try {
    // Razorpay React Native SDK is already available via the package
    // No need to load external scripts
    return true;
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error);
    return false;
  }
};

export const BookingService = {
  createEngagement: async (payload: BookingPayload) => {
    const res = await PaymentInstance.post(`/api/engagements`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  },

  openRazorpay: async (orderId: string, amountPaise: number, currency = 'INR'): Promise<RazorpayPaymentResponse> => {
    const ok = await initializeRazorpay();
    if (!ok) throw new Error('Failed to initialize Razorpay');

    return new Promise<RazorpayPaymentResponse>((resolve, reject) => {
      const options: any = {
        key: 'rzp_test_lTdgjtSRlEwreA', // Replace with your actual key
        amount: amountPaise.toString(),
        currency: currency,
        order_id: orderId,
        name: 'Serveaso',
        description: 'Booking Payment',
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        theme: { color: '#0ea5e9' },
      };

      RazorpayCheckout.open(options)
        .then((data: any) => {
          // Razorpay React Native returns data in a different structure
          const paymentResponse: RazorpayPaymentResponse = {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: orderId, // Use the orderId we passed
            razorpay_signature: data.razorpay_signature,
            engagementId: 0, // This will be set later
          };
          resolve(paymentResponse);
        })
        .catch((error: any) => {
          // Handle specific error codes
          if (error.code === 2) {
            reject(new Error('Payment cancelled by user'));
          } else {
            reject(new Error(error.description || 'Payment failed'));
          }
        });
    });
  },

  verifyPayment: async (paymentData: RazorpayPaymentResponse) => {
    const res = await PaymentInstance.post(`/api/payments/verify`, paymentData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  },

  /**
   * Full flow: create engagement -> open Razorpay -> verify
   */
  bookAndPay: async (payload: BookingPayload) => {
    try {
      const state = store.getState();
      const location: any = state.geoLocation.value;

      let latitude = 0;
      let longitude = 0;

      if (location?.geometry?.location) {
        latitude = location.geometry.location.lat;
        longitude = location.geometry.location.lng;
      } else if (location?.lat && location?.lng) {
        latitude = location.lat;
        longitude = location.lng;
      }

      console.log('location payload:', location);
      console.log('Current location from store:', location);

      // Update payload with location data
      payload.serviceproviderid = payload.serviceproviderid === 0 ? null : payload.serviceproviderid;
      payload.latitude = latitude;
      payload.longitude = longitude;

      // Step 1: Create engagement
      const engagementData = await BookingService.createEngagement(payload);

      // Extract order id & amount
      const orderId =
        engagementData?.payment?.razorpay_order_id ||
        engagementData?.razorpayOrder?.id;

      if (!orderId) throw new Error('Razorpay order id not found in response');

      let amountPaise: number;
      if (engagementData?.razorpayOrder?.amount) {
        amountPaise = Number(engagementData.razorpayOrder.amount);
      } else if (engagementData?.payment?.total_amount) {
        amountPaise = Math.round(Number(engagementData.payment.total_amount) * 100);
      } else {
        amountPaise = Math.round(payload.base_amount * 100);
      }

      // Step 2: Open Razorpay
      const paymentResponse = await BookingService.openRazorpay(orderId, amountPaise);
      paymentResponse.engagementId = engagementData?.engagement?.engagement_id;

      // Step 3: Verify payment on backend
      const verifyResult = await BookingService.verifyPayment(paymentResponse);

      return { engagementData, paymentResponse, verifyResult };
    } catch (error) {
      console.error('Booking and payment failed:', error);
      throw error;
    }
  },
};

// Helper function to convert time to 24-hour format
function to24Hour(timeStr: string): string {
  if (!timeStr) return '00:00';
  
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');

  let hoursNum = parseInt(hours, 10);

  if (modifier?.toLowerCase() === 'pm' && hoursNum !== 12) {
    hoursNum += 12;
  }
  if (modifier?.toLowerCase() === 'am' && hoursNum === 12) {
    hoursNum = 0;
  }

  return `${String(hoursNum).padStart(2, '0')}:${minutes}`;
}