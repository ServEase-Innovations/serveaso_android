import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';
import { BookingDetails } from './types/engagementRequest';
import { BOOKINGS } from './Constants/pagesConstants';
import axiosInstance from './axiosInstance';

interface NannyServiceDialogProps {
  visible: boolean;
  onClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
}

const NannyServiceDialog: React.FC<NannyServiceDialogProps> = ({
  visible,
  onClose,
  providerDetails,
  sendDataToParent,
}) => {
  const [activeTab, setActiveTab] = useState<'baby' | 'elderly'>('baby');
  const [babyPackages, setBabyPackages] = useState({
    day: { age: 3, selected: false },
    night: { age: 3, selected: false },
    fullTime: { age: 3, selected: false },
  });
  const [elderlyPackages, setElderlyPackages] = useState({
    day: { age: 65, selected: false },
    night: { age: 65, selected: false },
    fullTime: { age: 65, selected: false },
  });
  const [loginVisible, setLoginVisible] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');

  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const user = useSelector((state: any) => state.user?.value);
  const dispatch = useDispatch();
  const customerId = user?.customerDetails?.customerId || null;
  const currentLocation = user?.customerDetails?.currentLocation;
  const firstName = user?.customerDetails?.firstName;
  const lastName = user?.customerDetails?.lastName;
  const customerName = `${firstName} ${lastName}`;
  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [user]);

  const handleLogin = () => setLoginVisible(true);
  const handleLoginClose = () => setLoginVisible(false);
  const handleBookingPage = () => setLoginVisible(false);

  const handleBabyAgeChange = (packageType: string, value: number) => {
    setBabyPackages((prev) => ({
      ...prev,
      [packageType]: {
        ...prev[packageType as keyof typeof prev],
        age: Math.max(0, prev[packageType as keyof typeof prev].age + value),
      },
    }));
  };

  const handleElderlyAgeChange = (packageType: string, value: number) => {
    setElderlyPackages((prev) => ({
      ...prev,
      [packageType]: {
        ...prev[packageType as keyof typeof prev],
        age: Math.max(0, prev[packageType as keyof typeof prev].age + value),
      },
    }));
  };

  const togglePackageSelection = (packageType: string, isBaby: boolean) => {
    if (isBaby) {
      setBabyPackages((prev) => ({
        ...prev,
        [packageType]: {
          ...prev[packageType as keyof typeof prev],
          selected: !prev[packageType as keyof typeof prev].selected,
        },
      }));
    } else {
      setElderlyPackages((prev) => ({
        ...prev,
        [packageType]: {
          ...prev[packageType as keyof typeof prev],
          selected: !prev[packageType as keyof typeof prev].selected,
        },
      }));
    }
  };

  const calculateTotal = () => {
    let total = 0;
    if (activeTab === 'baby') {
      if (babyPackages.day.selected) total += 16000;
      if (babyPackages.night.selected) total += 20000;
      if (babyPackages.fullTime.selected) total += 23000;
    } else {
      if (elderlyPackages.day.selected) total += 16000;
      if (elderlyPackages.night.selected) total += 20000;
      if (elderlyPackages.fullTime.selected) total += 23000;
    }
    return total;
  };

  const getSelectedPackagesCount = () => {
    if (activeTab === 'baby') {
      return Object.values(babyPackages).filter((pkg) => pkg.selected).length;
    } else {
      return Object.values(elderlyPackages).filter((pkg) => pkg.selected).length;
    }
  };

  const handleApplyVoucher = () => {
    // Voucher logic here
    Alert.alert('Voucher Applied', `Voucher code ${voucherCode} applied successfully`);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const totalAmount = calculateTotal();
      if (totalAmount === 0) {
        throw new Error('Please select at least one service');
      }

      const bookingData: BookingDetails = {
        serviceProviderId: providerDetails?.serviceproviderId
          ? Number(providerDetails.serviceproviderId)
          : 0,
        serviceProviderName: providerFullName,
        customerId,
        customerName,
        address: currentLocation,
        startDate: bookingType?.startDate || new Date().toISOString().split('T')[0],
        endDate: bookingType?.endDate || '',
        engagements: getSelectedServicesDescription(),
        monthlyAmount: totalAmount,
        timeslot: bookingType?.timeRange || '',
        paymentMode: 'UPI',
        bookingType: 'NANNY_SERVICES',
        taskStatus: 'NOT_STARTED',
        responsibilities: [],
      };

      // Try creating order through backend first
      try {
        const orderResponse = await createRazorpayOrder(totalAmount);
        await handlePaymentSuccess(orderResponse.data.orderId, bookingData);
      } catch (backendError) {
        console.warn('Backend order creation failed, falling back to client-side', backendError);
        await createClientSideOrder(totalAmount, bookingData);
      }
    } catch (err: any) {
      handlePaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  const createRazorpayOrder = async (amount: number) => {
    return await axios.post(
      'http://13.201.229.41:3000/create-order',
      {
        amount: amount * 100,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      }
    );
  };

  const createClientSideOrder = async (amount: number, bookingData: BookingDetails) => {
    return new Promise((resolve, reject) => {
      // In React Native, you would typically use a WebView or a native module for Razorpay integration
      // This is a simplified version - you'd need to implement the actual Razorpay integration
      Alert.alert(
        'Payment',
        `Proceed with payment of ₹${amount}?`,
        [
          {
            text: 'Cancel',
            onPress: () => reject(new Error('Payment cancelled by user')),
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: async () => {
              try {
                await handlePaymentSuccess(`mock_order_${Date.now()}`, bookingData);
                resolve({});
              } catch (err) {
                reject(err);
              }
            },
          },
        ],
        { cancelable: false }
      );
    });
  };

  const handlePaymentSuccess = async (orderId: string, bookingData: BookingDetails) => {
    try {
      const bookingResponse = await axiosInstance.post(
        '/api/serviceproviders/engagement/add',
        {
          ...bookingData,
          paymentReference: orderId,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (bookingResponse.status === 201) {
        if (sendDataToParent) sendDataToParent(BOOKINGS);
        onClose();
        Alert.alert('Booking Successful', `Payment ID: ${orderId}`);
      } else {
        throw new Error('Failed to save booking');
      }
    } catch (err) {
      console.error('Error saving booking:', err);
      throw new Error('Payment succeeded but booking failed. Please contact support.');
    }
  };

  const handlePaymentError = (err: any) => {
    console.error('Payment error:', err);
    const errorMessage =
      err.response?.data?.message || err.message || 'Payment failed. Please try again later.';
    setError(errorMessage);
    Alert.alert('Payment Error', errorMessage);
  };

  const getSelectedServicesDescription = () => {
    const selectedPackages =
      activeTab === 'baby'
        ? Object.entries(babyPackages).filter(([_, pkg]) => pkg.selected)
        : Object.entries(elderlyPackages).filter(([_, pkg]) => pkg.selected);

    return selectedPackages
      .map(
        ([pkgType, pkg]) =>
          `${activeTab === 'baby' ? 'Baby' : 'Elderly'} care (${pkgType}) for age ≤${pkg.age}`
      )
      .join(', ');
  };

  const renderPackage = (
    type: string,
    pkg: any,
    isBaby: boolean,
    title: string,
    rating: number,
    ratingColor: string,
    reviews: string,
    price: string,
    description: string,
    features: string[]
  ) => {
    const ageHandler = isBaby ? handleBabyAgeChange : handleElderlyAgeChange;
    const selected = pkg.selected;

    return (
      <View
        style={[
          styles.packageContainer,
          { backgroundColor: selected ? '#fff8f6' : '#fff' },
        ]}
      >
        <View style={styles.packageHeader}>
          <View>
            <Text style={styles.packageTitle}>{title}</Text>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: ratingColor }]}>{rating}</Text>
              <Text style={styles.reviewsText}>({reviews})</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, { color: ratingColor }]}>{price}</Text>
            <Text style={styles.priceDescription}>{description}</Text>
          </View>
        </View>

        <View style={styles.ageSelectorContainer}>
          <Text style={styles.ageLabel}>Age:</Text>
          <View style={styles.ageControl}>
            <TouchableOpacity
              onPress={() => ageHandler(type, -1)}
              style={styles.ageButton}
            >
              <Text style={styles.ageButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.ageValue}>≤{pkg.age}</Text>
            <TouchableOpacity
              onPress={() => ageHandler(type, 1)}
              style={styles.ageButton}
            >
              <Text style={styles.ageButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => togglePackageSelection(type, isBaby)}
          style={[
            styles.selectButton,
            { backgroundColor: selected ? '#e17055' : '#fff' },
          ]}
        >
          <Text
            style={[
              styles.selectButtonText,
              { color: selected ? 'white' : '#e17055' },
            ]}
          >
            {selected ? 'SELECTED' : 'SELECT SERVICE'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>NANNY SERVICES</Text>
              
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={() => setActiveTab('baby')}
                >
                  <View
                    style={[
                      styles.tabUnderline,
                      activeTab === 'baby' && styles.activeTabUnderline,
                    ]}
                  >
                    <Text style={styles.tabText}>Baby Care</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={() => setActiveTab('elderly')}
                >
                  <View
                    style={[
                      styles.tabUnderline,
                      activeTab === 'elderly' && styles.activeTabUnderline,
                    ]}
                  >
                    <Text style={styles.tabText}>Elderly Care</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Package Sections */}
            <View style={styles.packagesContainer}>
              {activeTab === 'baby' ? (
                <>
                  {/* Baby Care - Day */}
                  {renderPackage(
                    'day',
                    babyPackages.day,
                    true,
                    'Baby Care - Day',
                    4.8,
                    '#e17055',
                    '1.5M reviews',
                    '₹16,000 - ₹17,600',
                    'Daytime care',
                    [
                      'Professional daytime baby care',
                      'Age-appropriate activities',
                      'Meal preparation and feeding',
                    ]
                  )}
                  
                  {/* Baby Care - Night */}
                  {renderPackage(
                    'night',
                    babyPackages.night,
                    true,
                    'Baby Care - Night',
                     4.9,
                    '#00b894',
                    '1.2M reviews',
                    '₹20,000 - ₹22,000',
                    'Overnight care',
                    [
                      'Professional overnight baby care',
                      'Night feeding and diaper changes',
                      'Sleep routine establishment',
                    ]
                  )}
                  
                  {/* 24 Hours In-House Care */}
                  {renderPackage(
                    'fullTime',
                    babyPackages.fullTime,
                    true,
                    '24 Hours In-House Care',
                    4.9,
                    '#0984e3',
                    '980K reviews',
                    '₹23,000 - ₹25,000',
                    'Full-time care',
                    [
                      'Round-the-clock professional care',
                      'All daily care activities included',
                      'Live-in nanny service',
                    ]
                  )}
                </>
              ) : (
                <>
                  {/* Elderly Care - Day */}
                  {renderPackage(
                    'day',
                    elderlyPackages.day,
                    false,
                    'Elderly Care - Day',
                    4.7,
                    '#e17055',
                    '1.1M reviews',
                    '₹16,000 - ₹17,600',
                    'Daytime care',
                    [
                      'Professional daytime elderly care',
                      'Medication management',
                      'Meal preparation and assistance',
                    ]
                  )}
                  
                  {/* Elderly Care - Night */}
                  {renderPackage(
                    'night',
                    elderlyPackages.night,
                    false,
                    'Elderly Care - Night',
                    4.8,
                    '#00b894',
                    '950K reviews',
                    '₹20,000 - ₹22,000',
                    'Overnight care',
                    [
                      'Professional overnight elderly care',
                      'Night-time assistance and monitoring',
                      'Sleep comfort and safety',
                    ]
                  )}
                  
                  {/* 24 Hours In-House Elderly Care */}
                  {renderPackage(
                    'fullTime',
                    elderlyPackages.fullTime,
                    false,
                    '24 Hours In-House Care',
                    4.9,
                    '#0984e3',
                    '850K reviews',
                    '₹23,000 - ₹25,000',
                    'Full-time care',
                    [
                      'Round-the-clock professional care',
                      'All daily care activities included',
                      'Live-in caregiver service',
                    ]
                  )}
                </>
              )}
            </View>
            
            {/* Voucher Section */}
            <View style={styles.voucherContainer}>
              <Text style={styles.voucherTitle}>Apply Voucher</Text>
              <View style={styles.voucherInputContainer}>
                <TextInput
                  placeholder="Enter voucher code"
                  style={styles.voucherInput}
                  value={voucherCode}
                  onChangeText={setVoucherCode}
                />
                <TouchableOpacity
                  onPress={handleApplyVoucher}
                  style={styles.applyButton}
                >
                  <Text style={styles.applyButtonText}>APPLY</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          {/* Footer with Checkout */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>
                Total for {getSelectedPackagesCount()} service{getSelectedPackagesCount() !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.totalAmount}>
                ₹{calculateTotal().toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.checkoutContainer}>
              {!loggedInUser && (
                <>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                  >
                    <Text style={styles.loginButtonText}>LOGIN TO CONTINUE</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {loggedInUser && (
                <TouchableOpacity
                  style={[
                    styles.checkoutButton,
                    calculateTotal() === 0 && styles.disabledCheckoutButton,
                  ]}
                  onPress={handleCheckout}
                  disabled={calculateTotal() === 0}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Login Modal */}
      <Modal
        visible={loginVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleLoginClose}
      >
        <View style={styles.loginContainer}>
          {/* You would implement your Login component here */}
          <Text style={styles.loginTitle}>Login</Text>
          <TouchableOpacity onPress={handleLoginClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBookingPage} style={styles.loginSubmitButton}>
            <Text style={styles.loginSubmitButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100, // Space for the footer
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    color: '#2d3436',
    marginBottom: 15,
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  tabText: {
    fontWeight: 'bold',
    color: '#2d3436',
    textAlign: 'center',
  },
  tabUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    width: '50%',
    marginLeft: '25%',
    paddingBottom: 5,
  },
  activeTabUnderline: {
    borderBottomColor: '#e17055',
  },
  packagesContainer: {
    padding: 20,
  },
  packageContainer: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  packageTitle: {
    color: '#2d3436',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    fontWeight: 'bold',
  },
  reviewsText: {
    color: '#636e72',
    fontSize: 14,
    marginLeft: 5,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  priceDescription: {
    color: '#636e72',
    fontSize: 14,
  },
  ageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  ageLabel: {
    marginRight: 15,
    color: '#2d3436',
  },
  ageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 20,
  },
  ageButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#dfe6e9',
  },
  ageButtonText: {
    fontSize: 16,
  },
  ageValue: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
  },
  featuresContainer: {
    marginVertical: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    marginRight: 10,
    color: '#2d3436',
  },
  featureText: {
    color: '#2d3436',
  },
  selectButton: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e17055',
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  selectButtonText: {
    fontWeight: 'bold',
  },
  voucherContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  voucherTitle: {
    color: '#2d3436',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  voucherInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  voucherInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  applyButton: {
    padding: 10,
    backgroundColor: '#27ae60',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  totalLabel: {
    color: '#636e72',
    fontSize: 14,
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#2d3436',
  },
  checkoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    padding: 8,
    backgroundColor: '#1976d2',
    borderRadius: 6,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  checkoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#e17055',
    borderRadius: 6,
  },
  disabledCheckoutButton: {
    backgroundColor: '#bdc3c7',
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#e17055',
    borderRadius: 5,
    marginBottom: 20,
  },
  closeButtonText: {
    color: 'white',
  },
  loginSubmitButton: {
    padding: 15,
    backgroundColor: '#27ae60',
    borderRadius: 5,
  },
  loginSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NannyServiceDialog;