/* eslint-disable */
import PaymentInstance from "./paymentInstance";
import store from "../store/userStore";
import RazorpayCheckout from "react-native-razorpay";

export interface BookingPayload {
  customerid: number;
  serviceproviderid: number | null;
  start_date: string;
  end_date: string;
  responsibilities: any;
  booking_type: string;
  service_type: string;
  base_amount: number;
  payment_mode?: "razorpay" | "UPI" | "CASH";
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

export const BookingService = {
  createEngagement: async (payload: BookingPayload) => {
    const res = await PaymentInstance.post(`/api/engagements`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  },

  openRazorpay: async (
    orderId: string,
    amountPaise: number,
    currency = "INR"
  ): Promise<RazorpayPaymentResponse> => {
    return new Promise((resolve, reject) => {
      const options = {
        description: "Booking Payment",
        image: "https://your-logo-url.com/logo.png",
        currency,
        key: "rzp_test_lTdgjtSRlEwreA", // replace with live key
        amount: amountPaise, // ✅ must be number, not string
        name: "Serveaso",
        order_id: orderId,
        prefill: {
          email: "test@example.com",
          contact: "9999999999",
          name: "Test User",
        },
        theme: { color: "#0ea5e9" },
      };

      RazorpayCheckout.open(options)
        .then((data: any) => {
          const resp: RazorpayPaymentResponse = {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
            engagementId: 0, // will set later
          };
          resolve(resp);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  },

  verifyPayment: async (paymentData: RazorpayPaymentResponse) => {
    const res = await PaymentInstance.post(`/api/payments/verify`, paymentData, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  },

  /**
   * Full flow: create engagement -> open Razorpay -> verify
   */
  bookAndPay: async (payload: BookingPayload) => {
    const state: any = store.getState();

    // ✅ Safe access to geoLocation
    const location = state?.geoLocation?.value ?? null;

    let latitude = 0;
    let longitude = 0;

    if (location?.geometry?.location) {
      latitude = location.geometry.location.lat;
      longitude = location.geometry.location.lng;
    } else if (location?.lat && location?.lng) {
      latitude = location.lat;
      longitude = location.lng;
    }

    payload.serviceproviderid =
      payload.serviceproviderid === 0 ? null : payload.serviceproviderid;
    payload.latitude = latitude;
    payload.longitude = longitude;

    const engagementData = await BookingService.createEngagement(payload);

    // Extract order id & amount
    const orderId =
      engagementData?.payment?.razorpay_order_id ||
      engagementData?.razorpayOrder?.id;

    if (!orderId) throw new Error("Razorpay order id not found in response");

    let amountPaise: number;
    if (engagementData?.razorpayOrder?.amount) {
      amountPaise = Number(engagementData.razorpayOrder.amount);
    } else if (engagementData?.payment?.total_amount) {
      amountPaise = Math.round(Number(engagementData.payment.total_amount) * 100);
    } else {
      amountPaise = Math.round(payload.base_amount * 100);
    }

    // Open Razorpay
    const paymentResponse = await BookingService.openRazorpay(
      orderId,
      amountPaise
    );

    paymentResponse.engagementId = engagementData?.engagement?.engagement_id;

    // Verify payment on backend
    const verifyResult = await BookingService.verifyPayment(paymentResponse);

    return { engagementData, paymentResponse, verifyResult };
  },
};

// Utility: Convert 12h -> 24h
export function to24Hour(timeStr: string) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  let hrs = parseInt(hours, 10);

  if (modifier.toLowerCase() === "pm" && hrs !== 12) {
    hrs += 12;
  }
  if (modifier.toLowerCase() === "am" && hrs === 12) {
    hrs = 0;
  }

  return `${String(hrs).padStart(2, "0")}:${minutes}`;
}
