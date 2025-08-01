import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

const RazorpayDemoComponent = () => {
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const generateOrderId = (): string => {
    return `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const handlePayment = async () => {
    setLoading(true);
    setPaymentStatus('');

    const options: RazorpayCheckout.CheckoutOptions = {
      key: 'rzp_test_1DP5mmOlF5G5ag',
      amount: '10000', // ₹100 in paise
      currency: 'INR',
      name: 'ServEaso',
      description: 'Demo Payment',
      order_id: generateOrderId(),
      image: 'https://i.imgur.com/3g7nmJC.png',
      theme: { color: '#3b82f6' },
      prefill: {
        email: 'customer@serveaso.com',
        contact: '9876543210',
        name: 'ServEaso Customer'
      },
      notes: {
        service: 'Demo Payment'
      }
    };

    try {
      const data = await RazorpayCheckout.open(options);
      setPaymentStatus(`Success: ${data.razorpay_payment_id}`);
      Alert.alert(
        'Payment Successful',
        `Payment ID: ${data.razorpay_payment_id}`
      );
    } catch (error: any) {
      setPaymentStatus(`Error: ${error.description || 'Payment failed'}`);
      Alert.alert(
        'Payment Error',
        error.description || 'Payment was not completed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ServEaso Payment</Text>
      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : 'Pay ₹100'}
        </Text>
      </TouchableOpacity>
      {paymentStatus ? (
        <Text style={[
          styles.status,
          paymentStatus.includes('Success') ? styles.success : styles.error
        ]}>
          {paymentStatus}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  status: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    width: '100%',
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});

export default RazorpayDemoComponent;