// src/services/BookingService.ts
import axios from "axios";

const API_BASE = "https://payments-j5id.onrender.com";

export interface BookingPayload {
  customerid: number;
  serviceproviderid: number;
  start_date: string;
  end_date: string;
  responsibilities: any;
  booking_type: string;
  service_type: string;
  base_amount: number;
  payment_mode?: "razorpay" | "UPI" | "CASH";
  [key: string]: any;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  engagementId: number;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
}

class BookingService {
  private static async openRazorpayWebView(
    orderId: string,
    amountPaise: number,
    currency = "INR"
  ): Promise<RazorpayPaymentResponse> {
    // This will be handled by the WebView component in React Native
    // The actual payment handling will be done in the UI layer
    throw new Error("Use the WebView component for Razorpay integration");
  }

  static createEngagement = async (payload: BookingPayload) => {
    const res = await axios.post(`${API_BASE}/api/engagements`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  };

  static getRazorpayCheckoutOptions = (
    orderId: string,
    amountPaise: number,
    currency = "INR"
  ): RazorpayCheckoutOptions => {
    return {
      key: "rzp_test_lTdgjtSRlEwreA",
      amount: amountPaise,
      currency,
      order_id: orderId,
      name: "Serveaso",
      description: "Booking Payment",
      prefill: {
        name: "Test User",
        email: "test@example.com",
        contact: "9999999999",
      },
      theme: { color: "#0ea5e9" },
    };
  };

  static verifyPayment = async (paymentData: RazorpayPaymentResponse) => {
    const res = await axios.post(
      `${API_BASE}/api/payments/verify`,
      paymentData,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data;
  };

  static prepareBookingData = async (payload: BookingPayload) => {
    const engagementData = await BookingService.createEngagement(payload);

    const orderId =
      engagementData?.payment?.razorpay_order_id ||
      engagementData?.razorpayOrder?.id;

    if (!orderId) throw new Error("Razorpay order id not found in response");

    let amountPaise: number;
    if (engagementData?.razorpayOrder?.amount) {
      amountPaise = Number(engagementData.razorpayOrder.amount);
    } else if (engagementData?.payment?.total_amount) {
      amountPaise = Math.round(
        Number(engagementData.payment.total_amount) * 100
      );
    } else {
      amountPaise = Math.round(payload.base_amount * 100);
    }

    const checkoutOptions = BookingService.getRazorpayCheckoutOptions(
      orderId,
      amountPaise
    );

    return {
      engagementData,
      checkoutOptions,
      orderId,
      amountPaise,
    };
  };
}

export default BookingService;