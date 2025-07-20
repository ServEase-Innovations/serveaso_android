import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { BOOKINGS } from './Constants/pagesConstants';
import axiosInstance from './axiosInstance';
import { addToCart, removeFromCart, selectCartItems } from './features/addToSlice';
import { isNannyCartItem } from './types/cartSlice';
import Login from './Login';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface NannyServicesDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: any;
  sendDataToParent?: (data: string) => void;
}

const NannyServicesDialog: React.FC<NannyServicesDialogProps> = ({ 
  open, 
  handleClose, 
  providerDetails,
  sendDataToParent
}) => {
  const [activeTab, setActiveTab] = useState<'baby' | 'elderly'>('baby');
  const [babyPackages, setBabyPackages] = useState({
    day: { age: 3, selected: false },
    night: { age: 3, selected: false },
    fullTime: { age: 3, selected: false }
  });
  const [elderlyPackages, setElderlyPackages] = useState({
    day: { age: 65, selected: false },
    night: { age: 65, selected: false },
    fullTime: { age: 65, selected: false }
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');

  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const user = useSelector((state: any) => state.user?.value);
  const dispatch = useDispatch();
  const allCartItems = useSelector(selectCartItems);
  const nannyCartItems = allCartItems.filter(isNannyCartItem);
  const customerId = user?.customerDetails?.customerId || null;
  const currentLocation = user?.customerDetails?.currentLocation;
  const firstName = user?.customerDetails?.firstName;
  const lastName = user?.customerDetails?.lastName;
  const customerName = `${firstName} ${lastName}`;
  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;

  const [cartItems, setCartItems] = useState<Record<string, boolean>>(() => {
    const initialCartItems = {
      babyDay: false,
      babyNight: false,
      babyFullTime: false,
      elderlyDay: false,
      elderlyNight: false,
      elderlyFullTime: false
    };
    
    nannyCartItems.forEach(item => {
      const key = `${item.careType}${item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1)}`;
      initialCartItems[key as keyof typeof initialCartItems] = true;
    });

    return initialCartItems;
  });

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [user]);

  useEffect(() => {
    const updatedCartItems = { ...cartItems };
    
    Object.keys(cartItems).forEach(key => {
      if (key.startsWith('baby') || key.startsWith('elderly')) {
        updatedCartItems[key] = false;
      }
    });

    nannyCartItems.forEach(item => {
      const packageKey = `${item.careType}${item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1)}`;
      updatedCartItems[packageKey as keyof typeof updatedCartItems] = true;
    });

    setCartItems(updatedCartItems);
  }, [nannyCartItems]);

  const handleLogin = () => setLoginOpen(true);
  const handleLoginClose = () => setLoginOpen(false);
  const handleBookingPage = () => setLoginOpen(false);

  const handleBabyAgeChange = (packageType: keyof typeof babyPackages, value: number) => {
    setBabyPackages(prev => ({
      ...prev,
      [packageType]: {
        ...prev[packageType],
        age: Math.max(0, prev[packageType].age + value)
      }
    }));
  };

  const handleElderlyAgeChange = (packageType: keyof typeof elderlyPackages, value: number) => {
    setElderlyPackages(prev => ({
      ...prev,
      [packageType]: {
        ...prev[packageType],
        age: Math.max(0, prev[packageType].age + value)
      }
    }));
  };

  const togglePackageSelection = (packageType: string, isBaby: boolean) => {
    if (isBaby) {
      setBabyPackages(prev => ({
        ...prev,
        [packageType]: {
          ...prev[packageType as keyof typeof prev],
          selected: !prev[packageType as keyof typeof prev].selected
        }
      }));
    } else {
      setElderlyPackages(prev => ({
        ...prev,
        [packageType]: {
          ...prev[packageType as keyof typeof prev],
          selected: !prev[packageType as keyof typeof prev].selected
        }
      }));
    }
  };

  const handleAddToCart = (packageKey: string) => {
    try {
      let type: 'baby' | 'elderly';
      let packageType: 'day' | 'night' | 'fullTime';

      if (packageKey.startsWith('baby')) {
        type = 'baby';
        packageType = packageKey.replace('baby', '').charAt(0).toLowerCase() + 
                     packageKey.replace('baby', '').slice(1) as 'day' | 'night' | 'fullTime';
      } else if (packageKey.startsWith('elderly')) {
        type = 'elderly';
        packageType = packageKey.replace('elderly', '').charAt(0).toLowerCase() + 
                     packageKey.replace('elderly', '').slice(1) as 'day' | 'night' | 'fullTime';
      } else {
        console.error('Invalid package key:', packageKey);
        return;
      }

      const packages = type === 'baby' ? babyPackages : elderlyPackages;
      const packageDetails = packages[packageType as keyof typeof packages];

      if (!packageDetails) {
        console.error('Package details not found for:', packageKey);
        return;
      }

      const age = packageDetails.age;
      const price = getPackagePrice(type, packageType);
      const description = getPackageDescription(type, packageType);

      const cartItem = {
        id: `${type}_${packageType}_${providerDetails?.serviceproviderId || 'default'}`,
        type: 'nanny' as const,
        careType: type,
        packageType,
        age,
        price,
        description,
        providerId: providerDetails?.serviceproviderId || '',
        providerName: providerFullName
      };

      if (cartItems[packageKey]) {
        dispatch(removeFromCart({ id: cartItem.id, type: 'nanny' }));
      } else {
        dispatch(addToCart(cartItem));
      }

      setCartItems(prev => ({
        ...prev,
        [packageKey]: !prev[packageKey]
      }));
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      setError('Failed to update cart. Please try again.');
    }
  };

  const getPackagePrice = (type: 'baby' | 'elderly', packageType: string): number => {
    const prices = {
      baby: {
        day: 16000,
        night: 20000,
        fullTime: 23000
      },
      elderly: {
        day: 16000,
        night: 20000,
        fullTime: 23000
      }
    };

    return prices[type]?.[packageType] || 0;
  };

  const getPackageDescription = (type: 'baby' | 'elderly', packageType: string): string => {
    const descriptions = {
      baby: {
        day: 'Professional daytime baby care',
        night: 'Professional overnight baby care',
        fullTime: 'Round-the-clock professional baby care'
      },
      elderly: {
        day: 'Professional daytime elderly care',
        night: 'Professional overnight elderly care',
        fullTime: 'Round-the-clock professional elderly care'
      }
    };

    return descriptions[type]?.[packageType] || '';
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
      return Object.values(babyPackages).filter(pkg => pkg.selected).length;
    } else {
      return Object.values(elderlyPackages).filter(pkg => pkg.selected).length;
    }
  };

  const handleApplyVoucher = () => {
    // Voucher logic here
    Alert.alert('Voucher Applied', 'Your voucher has been applied successfully');
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const totalAmount = calculateTotal();
      if (totalAmount === 0) {
        throw new Error('Please select at least one service');
      }

      const bookingData = {
        serviceProviderId: providerDetails?.serviceproviderId ? Number(providerDetails.serviceproviderId) : 0,
        serviceProviderName: providerFullName,
        customerId,
        customerName,
        address: currentLocation,
        startDate: bookingType?.startDate || new Date().toISOString().split('T')[0],
        endDate: bookingType?.endDate || "",
        engagements: getSelectedServicesDescription(),
        monthlyAmount: totalAmount,
        timeslot: bookingType?.timeRange || "",
        paymentMode: "UPI",
        bookingType: "NANNY_SERVICES",
        taskStatus: "NOT_STARTED",
        responsibilities: []
      };

      try {
        const orderResponse = await createRazorpayOrder(totalAmount);
        await handlePaymentSuccess(orderResponse.data.orderId, bookingData);
      } catch (backendError) {
        console.warn("Backend order creation failed, falling back to client-side", backendError);
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
      "https://utils-dmua.onrender.com/create-order",
      { 
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1
      },
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 8000
      }
    );
  };

  const createClientSideOrder = async (amount: number, bookingData: any) => {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay SDK not loaded");
      }

      const options = {
        key: "rzp_test_lTdgjtSRlEwreA",
        amount: amount * 100,
        currency: "INR",
        name: "Serveaso",
        description: "Nanny Services Booking",
        handler: async (response: any) => {
          try {
            await handlePaymentSuccess(response.razorpay_order_id, bookingData);
            resolve(response);
          } catch (err) {
            reject(err);
          }
        },
        prefill: {
          name: customerName || "",
          email: user?.email || "",
          contact: user?.mobileNo || "",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            reject(new Error("Payment closed by user"));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  const handlePaymentSuccess = async (orderId: string, bookingData: any) => {
    try {
      const bookingResponse = await axiosInstance.post(
        "/api/serviceproviders/engagement/add",
        {
          ...bookingData,
          paymentReference: orderId
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (bookingResponse.status === 201) {
        try {
          const notifyResponse = await fetch(
            "http://localhost:4000/send-notification",
            {
              method: "POST",
              body: JSON.stringify({
                title: "Hello from ServEaso!",
                body: `Your booking for ${bookingData.engagements} has been successfully confirmed!`,
                url: "http://localhost:3000",
              }),
              headers: { "Content-Type": "application/json" },
            }
          );

          if (notifyResponse.ok) {
            console.log("Notification triggered!");
          }
        } catch (error) {
          console.error("Error sending notification:", error);
        }

        if (sendDataToParent) sendDataToParent(BOOKINGS);
        handleClose();
      }
    } catch (err) {
      console.error("Error saving booking:", err);
      throw new Error("Payment succeeded but booking failed. Please contact support.");
    }
  };

  const handlePaymentError = (err: any) => {
    console.error("Payment error:", err);
    const errorMessage = err.response?.data?.message || 
                        err.message || 
                        "Payment failed. Please try again later.";
    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  };

  const getSelectedServicesDescription = () => {
    const selectedPackages = activeTab === 'baby' 
      ? Object.entries(babyPackages).filter(([_, pkg]) => pkg.selected)
      : Object.entries(elderlyPackages).filter(([_, pkg]) => pkg.selected);
    
    return selectedPackages.map(([pkgType, pkg]) => 
      `${activeTab === 'baby' ? 'Baby' : 'Elderly'} care (${pkgType}) for age ≤${pkg.age}`
    ).join(', ');
  };

  const renderBabyPackage = (packageType: 'day' | 'night' | 'fullTime') => {
    const packageData = babyPackages[packageType];
    const packageKey = `baby${packageType.charAt(0).toUpperCase() + packageType.slice(1)}`;
    let color = '#e17055';
    let price = '₹16,000 - ₹17,600';
    let reviews = '(1.5M reviews)';
    let rating = 4.8;
    let descriptionItems = [
      'Professional daytime baby care',
      'Age-appropriate activities',
      'Meal preparation and feeding'
    ];

    if (packageType === 'night') {
      color = '#00b894';
      price = '₹20,000 - ₹22,000';
      reviews = '(1.2M reviews)';
      rating = 4.9;
      descriptionItems = [
        'Professional overnight baby care',
        'Night feeding and diaper changes',
        'Sleep routine establishment'
      ];
    } else if (packageType === 'fullTime') {
      color = '#0984e3';
      price = '₹23,000 - ₹25,000';
      reviews = '(980K reviews)';
      rating = 4.9;
      descriptionItems = [
        'Round-the-clock professional care',
        'All daily care activities included',
        'Live-in nanny service'
      ];
    }

    return (
      <View key={packageType} style={[styles.packageCard, packageData.selected && styles.selectedPackageCard]}>
        <View style={styles.packageHeader}>
          <View>
            <Text style={styles.packageTitle}>Baby Care - {packageType.charAt(0).toUpperCase() + packageType.slice(1)}</Text>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingValue, {color}]}>{rating}</Text>
              <Text style={styles.reviewsText}>{reviews}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, {color}]}>{price}</Text>
            <Text style={styles.careType}>
              {packageType === 'day' ? 'Daytime care' : 
               packageType === 'night' ? 'Overnight care' : 'Full-time care'}
            </Text>
          </View>
        </View>
        
        <View style={styles.personsControl}>
          <Text style={styles.personsLabel}>Age:</Text>
          <View style={styles.personsInput}>
            <TouchableOpacity 
              style={styles.ageButton}
              onPress={() => handleBabyAgeChange(packageType, -1)}
            >
              <Text style={styles.ageButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.personsValue}>≤{packageData.age}</Text>
            <TouchableOpacity 
              style={styles.ageButton}
              onPress={() => handleBabyAgeChange(packageType, 1)}
            >
              <Text style={styles.ageButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.descriptionList}>
          {descriptionItems.map((item, index) => (
            <View key={index} style={styles.descriptionItem}>
              <Text style={styles.descriptionBullet}>•</Text>
              <Text style={styles.descriptionText}>{item}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.selectButton, packageData.selected && {backgroundColor: color}]}
            onPress={() => togglePackageSelection(packageType, true)}
          >
            <Text style={[styles.selectButtonText, packageData.selected && {color: '#fff'}]}>
              {packageData.selected ? 'SELECTED' : 'SELECT SERVICE'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.cartButton, cartItems[packageKey] && {backgroundColor: color}]}
            onPress={() => handleAddToCart(packageKey)}
          >
            {cartItems[packageKey] ? (
              <>
                <MaterialCommunityIcons name="cart-remove" size={16} color="#fff" />
                <Text style={styles.cartButtonText}>ADDED TO CART</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="cart-plus" size={16} color={color} />
                <Text style={[styles.cartButtonText, {color}]}>ADD TO CART</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderElderlyPackage = (packageType: 'day' | 'night' | 'fullTime') => {
    const packageData = elderlyPackages[packageType];
    const packageKey = `elderly${packageType.charAt(0).toUpperCase() + packageType.slice(1)}`;
    let color = '#e17055';
    let price = '₹16,000 - ₹17,600';
    let reviews = '(1.1M reviews)';
    let rating = 4.7;
    let descriptionItems = [
      'Professional daytime elderly care',
      'Medication management',
      'Meal preparation and assistance'
    ];

    if (packageType === 'night') {
      color = '#00b894';
      price = '₹20,000 - ₹22,000';
      reviews = '(950K reviews)';
      rating = 4.8;
      descriptionItems = [
        'Professional overnight elderly care',
        'Night-time assistance and monitoring',
        'Sleep comfort and safety'
      ];
    } else if (packageType === 'fullTime') {
      color = '#0984e3';
      price = '₹23,000 - ₹25,000';
      reviews = '(850K reviews)';
      rating = 4.9;
      descriptionItems = [
        'Round-the-clock professional care',
        'All daily care activities included',
        'Live-in caregiver service'
      ];
    }

    return (
      <View key={packageType} style={[styles.packageCard, packageData.selected && styles.selectedPackageCard]}>
        <View style={styles.packageHeader}>
          <View>
            <Text style={styles.packageTitle}>Elderly Care - {packageType.charAt(0).toUpperCase() + packageType.slice(1)}</Text>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingValue, {color}]}>{rating}</Text>
              <Text style={styles.reviewsText}>{reviews}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, {color}]}>{price}</Text>
            <Text style={styles.careType}>
              {packageType === 'day' ? 'Daytime care' : 
               packageType === 'night' ? 'Overnight care' : 'Full-time care'}
            </Text>
          </View>
        </View>
        
        <View style={styles.personsControl}>
          <Text style={styles.personsLabel}>Age:</Text>
          <View style={styles.personsInput}>
            <TouchableOpacity 
              style={styles.ageButton}
              onPress={() => handleElderlyAgeChange(packageType, -1)}
            >
              <Text style={styles.ageButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.personsValue}>≤{packageData.age}</Text>
            <TouchableOpacity 
              style={styles.ageButton}
              onPress={() => handleElderlyAgeChange(packageType, 1)}
            >
              <Text style={styles.ageButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.descriptionList}>
          {descriptionItems.map((item, index) => (
            <View key={index} style={styles.descriptionItem}>
              <Text style={styles.descriptionBullet}>•</Text>
              <Text style={styles.descriptionText}>{item}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.selectButton, packageData.selected && {backgroundColor: color}]}
            onPress={() => togglePackageSelection(packageType, false)}
          >
            <Text style={[styles.selectButtonText, packageData.selected && {color: '#fff'}]}>
              {packageData.selected ? 'SELECTED' : 'SELECT SERVICE'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.cartButton, cartItems[packageKey] && {backgroundColor: color}]}
            onPress={() => handleAddToCart(packageKey)}
          >
            {cartItems[packageKey] ? (
              <>
                <MaterialCommunityIcons name="cart-remove" size={16} color="#fff" />
                <Text style={styles.cartButtonText}>ADDED TO CART</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="cart-plus" size={16} color={color} />
                <Text style={[styles.cartButtonText, {color}]}>ADD TO CART</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (    
    <>
      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.dialogContainer}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>NANNY SERVICES</Text>
                <View style={styles.tabContainer}>
                  <TouchableOpacity 
                    style={styles.tabButton} 
                    onPress={() => setActiveTab('baby')}
                  >
                    <View style={[styles.tabIndicator, activeTab === 'baby' && styles.activeTabIndicator]}>
                      <Text style={[styles.tabText, activeTab === 'baby' && styles.activeTabText]}>Baby Care</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.tabButton} 
                    onPress={() => setActiveTab('elderly')}
                  >
                    <View style={[styles.tabIndicator, activeTab === 'elderly' && styles.activeTabIndicator]}>
                      <Text style={[styles.tabText, activeTab === 'elderly' && styles.activeTabText]}>Elderly Care</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.packagesContainer}>
                {activeTab === 'baby' ? (
                  <>
                    {renderBabyPackage('day')}
                    {renderBabyPackage('night')}
                    {renderBabyPackage('fullTime')}
                  </>
                ) : (
                  <>
                    {renderElderlyPackage('day')}
                    {renderElderlyPackage('night')}
                    {renderElderlyPackage('fullTime')}
                  </>
                )}
              </View>
              
              <View style={styles.voucherContainer}>
                <Text style={styles.voucherTitle}>Apply Voucher</Text>
                <View style={styles.voucherInputContainer}>
                  <TextInput
                    style={styles.voucherInput}
                    placeholder="Enter voucher code"
                    value={voucherCode}
                    onChangeText={setVoucherCode}
                  />
                  <TouchableOpacity 
                    style={styles.voucherButton}
                    onPress={handleApplyVoucher}
                  >
                    <Text style={styles.voucherButtonText}>APPLY</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.footerContainer}>
                <View>
                  <Text style={styles.footerText}>
                    Total for {getSelectedPackagesCount()} service{getSelectedPackagesCount() !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.footerPrice}>₹{calculateTotal().toLocaleString()}</Text>
                </View>
                
                <View style={styles.footerButtons}>
                  {!loggedInUser && (
                    <>
                      <TouchableOpacity style={styles.infoButton}>
                        <Icon name="info-outline" size={20} color="#666" />
                      </TouchableOpacity>
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
                      style={[styles.checkoutButton, calculateTotal() === 0 && styles.disabledButton]}
                      onPress={handleCheckout}
                      disabled={calculateTotal() === 0}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal 
        visible={loginOpen}
        animationType="slide"
        onRequestClose={handleLoginClose}
      >
        <View style={styles.loginModal}>
          <Login bookingPage={handleBookingPage}/>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  dialogContainer: {
    padding: 20,
  },
  dialogHeader: {
    marginBottom: 20,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabIndicator: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabIndicator: {
    borderBottomColor: '#3399cc',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#3399cc',
    fontWeight: 'bold',
  },
  packagesContainer: {
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedPackageCard: {
    borderColor: '#3399cc',
    borderWidth: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  careType: {
    fontSize: 12,
    color: '#666',
  },
  personsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  personsLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  personsInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageButtonText: {
    fontSize: 18,
    color: '#333',
  },
  personsValue: {
    fontSize: 16,
    marginHorizontal: 10,
    color: '#333',
  },
  descriptionList: {
    marginBottom: 15,
  },
  descriptionItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  descriptionBullet: {
    marginRight: 8,
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 10,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  cartButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  voucherContainer: {
    marginBottom: 20,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  voucherInputContainer: {
    flexDirection: 'row',
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  voucherButton: {
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    marginRight: 10,
  },
  loginButton: {
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginModal: {
    flex: 1,
  },
});

export default NannyServicesDialog;