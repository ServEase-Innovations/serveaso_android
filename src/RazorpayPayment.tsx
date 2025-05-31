import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios';

const RazorpayPayment = () => {
  const [amount, setAmount] = useState<string>('');

  const createOrder = async (amount: number) => {
    try {
      const response = await axios.post('http://localhost:5000/create-order', {
        amount: amount * 100, // Backend expects paise
      });
      return response.data.orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create Razorpay order.');
      return null;
    }
  };

  const handlePayment = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const orderId = await createOrder(numericAmount);
    if (!orderId) return;

    const options = {
      description: 'Test Transaction',
      image: 'https://your-company-logo-url.com/logo.png',
      currency: 'INR',
      key: 'YOUR_KEY_ID', // Replace with your Razorpay key
      amount: numericAmount * 100,
      name: 'Your Company Name',
      order_id: orderId,
      prefill: {
        email: 'your-email@example.com',
        contact: '9999999999',
        name: 'Your Name',
      },
      theme: { color: '#F37254' },
    };

    RazorpayCheckout.open(options)
      .then((response: any) => {
        // Payment Success
        Alert.alert('Success', `Payment ID: ${response.razorpay_payment_id}`);
        console.log('Payment Success:', response);
      })
      .catch((error: any) => {
        // Payment Failed
        Alert.alert('Payment Failed', error.description);
        console.error('Payment Failed:', error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Razorpay Payment</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount (INR)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <Button title="Pay Now" onPress={handlePayment} />
    </View>
  );
};

export default RazorpayPayment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderRadius: 6,
  },
});
