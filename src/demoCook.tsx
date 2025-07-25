import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { BookingDetails } from './types/engagementRequest';
import { BOOKINGS } from './Constants/pagesConstants';
import axiosInstance from './axiosInstance';
import CheckoutWithAgreement from './CheckoutWithAgreement';

// Redux actions
import { addToCart, removeFromCart, updateCartItem } from './features/addToSlice';

interface Package {
  name: string;
  price: number;
  rating: number;
  reviews: string;
  prepTime: string;
  includes: string[];
  selected?: boolean;
  persons?: number;
  inCart?: boolean;
}

const calculatePriceForPersons = (basePrice: number, persons: number): number => {
  if (persons <= 3) return basePrice;
  if (persons <= 6) return basePrice + basePrice * 0.2 * (persons - 3);
  if (persons <= 9) {
    const base = basePrice + basePrice * 0.2 * 3;
    return base + base * 0.1 * (persons - 6);
  }
  const base = basePrice + basePrice * 0.2 * 3;
  const extraBase = base + base * 0.1 * 3;
  return extraBase + extraBase * 0.05 * (persons - 9);
};

const DemoCook = ({
  visible,
  onClose,
  sendDataToParent,
  user,
  providerDetails,
  bookingType,
}: any) => {
  const dispatch = useDispatch();
  const cart = useSelector((state: any) => state.addToCart?.items || []);
  
  const [packages, setPackages] = useState<Package[]>([
    {
      name: 'Breakfast',
      price: 2000,
      rating: 4.8,
      reviews: '2.9M reviews',
      prepTime: '30 mins preparation',
      includes: ['5-8 chapatis/parathas', '1 dry veg/non-veg item'],
      selected: false,
      persons: 1,
      inCart: false,
    },
    {
      name: 'Lunch',
      price: 3500,
      rating: 4.84,
      reviews: '1.7M reviews',
      prepTime: '45 mins preparation',
      includes: [
        '5-8 chapatis/parathas',
        '1 dry veg/non-veg item',
        '1 gravy veg/non-veg item',
        'Rice',
      ],
      selected: false,
      persons: 1,
      inCart: false,
    },
    {
      name: 'Dinner',
      price: 3500,
      rating: 4.84,
      reviews: '2.7M reviews',
      prepTime: '1.5 hrs preparation',
      includes: [
        '5-8 chapatis/parathas',
        '1 dry veg/non-veg item',
        '1 gravy veg/non-veg item',
        'Rice',
      ],
      selected: false,
      persons: 1,
      inCart: false,
    },
  ]);
  
  const [voucher, setVoucher] = useState('');
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // User authentication check
  useEffect(() => {
    if (user) {
      console.log("User Info:", user);
      console.log("Name:", user.name);
      console.log("Customer ID:", user.customerid);
    }
  }, [user]);

  const initialBookingDetails: BookingDetails = {
    serviceProviderId: 0,
    serviceProviderName: "",
    customerId: 0,
    customerName: "", 
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    engagements: "",
    address: "",
    timeslot: "",
    monthlyAmount: 0,
    paymentMode: "UPI",
    bookingType: "",
    taskStatus: "NOT_STARTED", 
    serviceType: "COOK",
    responsibilities: [],
  };


  useEffect(() => {
    const updatedPackages = packages.map(pkg => {
      const cartItem = cart.find((item: any) => 
        item.type === 'meal' && 
        item.mealType === pkg.name.toUpperCase()
      );
      
      return {
        ...pkg,
        selected: !!cartItem,
        persons: cartItem?.persons || 1,
        inCart: !!cartItem
      };
    });
    
    setPackages(updatedPackages);
  }, []);

  const handlePersonChange = (index: number, operation: 'increment' | 'decrement') => {
    setPackages(prev => {
      const updated = [...prev];
      const currentPackage = updated[index];
      
      if (operation === 'increment') {
        currentPackage.persons = (currentPackage.persons || 1) + 1;
      } else if (operation === 'decrement' && (currentPackage.persons || 1) > 1) {
        currentPackage.persons = (currentPackage.persons || 1) - 1;
      }
      
      if (currentPackage.inCart) {
        dispatch(updateCartItem({
          id: currentPackage.name.toUpperCase(),
          type: 'meal',
          updates: {
            persons: currentPackage.persons,
            price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1),
            description: currentPackage.includes.join(', '),
            basePrice: currentPackage.price,
            maxPersons: 15
          }
        }));
      }
      
      return updated;
    });
  };

  const toggleCart = (index: number) => {
    setPackages(prev => {
      const updated = [...prev];
      const currentPackage = updated[index];
      const newInCartState = !currentPackage.inCart;

      if (newInCartState) {
        dispatch(addToCart({
          type: 'meal',
          id: currentPackage.name.toUpperCase(),
          mealType: currentPackage.name.toUpperCase(),
          persons: currentPackage.persons || 1,
          price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1),
          description: currentPackage.includes.join(', '),
          basePrice: currentPackage.price,
          maxPersons: 15
        }));
      } else {
        dispatch(removeFromCart({
          id: currentPackage.name.toUpperCase(),
          type: 'meal'
        }));
      }

      updated[index] = {
        ...currentPackage,
        inCart: newInCartState,
        selected: newInCartState
      };
      
      return updated;
    });
  };

  const togglePackageSelection = (index: number) => {
    setPackages(prev => {
      const updated = [...prev];
      const currentPackage = updated[index];
      const newSelectedState = !currentPackage.selected;

      if (newSelectedState && !currentPackage.inCart) {
        dispatch(addToCart({
          type: 'meal',
          id: currentPackage.name.toUpperCase(),
          mealType: currentPackage.name.toUpperCase(),
          persons: currentPackage.persons || 1,
          price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1),
          description: currentPackage.includes.join(', '),
          basePrice: currentPackage.price,
          maxPersons: 15
        }));
      } else if (!newSelectedState && currentPackage.inCart) {
        dispatch(removeFromCart({
          id: currentPackage.name.toUpperCase(),
          type: 'meal'
        }));
      }

      updated[index] = {
        ...currentPackage,
        selected: newSelectedState,
        inCart: newSelectedState
      };
      
      return updated;
    });
  };

  const getBookingTypeFromPreference = (bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY';
    
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  };

  const handleOpenAgreementDialog = () => {
    const selectedCount = packages.filter(pkg => pkg.selected).length;
    if (selectedCount === 0) {
      Alert.alert("Please select at least one package");
      return;
    }
    setAgreementDialogOpen(true);
  };

  const handleProceedToPayment = async () => {
    setAgreementDialogOpen(false);
    await handleCheckout();
  };

const handleCheckout = async () => {
  try {
    setLoading(true);
    
    // Validate selected packages
    const selectedPackages = packages.filter(pkg => pkg.selected);
    if (selectedPackages.length === 0) {
      Alert.alert("Please select at least one package");
      setLoading(false);
      return;
    }

    // Calculate total amount (in paise)
    const totalAmount = selectedPackages.reduce(
      (sum, pkg) => sum + calculatePriceForPersons(pkg.price, pkg.persons || 1),
      0
    ) * 100; // Convert to paise

    // Prepare booking details
    const bookingDetails: BookingDetails = {
      serviceProviderId: providerDetails?.serviceproviderId || 1,
      serviceProviderName: `${providerDetails?.firstName || ''} ${providerDetails?.lastName || ''}`.trim(),
      customerId: user?.customerid || 1,
      customerName: user?.name || "Demo User",
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      engagements: selectedPackages.map(p => `${p.name.toUpperCase()} (${p.persons || 1} persons)`).join(', '),
      address: 'Demo Address',
      timeslot: '10:00 AM - 2:00 PM',
      monthlyAmount: totalAmount / 100, // Convert back to rupees
      paymentMode: 'UPI',
      bookingType: bookingType || 'DEMO',
      taskStatus: 'COMPLETED',
      serviceType: 'COOK',
      responsibilities: []
    };

    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Initiate payment
    await handleRazorpayPayment(bookingDetails, totalAmount, orderId);

  } catch (error) {
    console.error('Checkout error:', error);
    Alert.alert('Error', 'Failed to process checkout');
    setLoading(false);
  }
};

const handleRazorpayPayment = async (bookingDetails: BookingDetails, amount: number, orderId: string) => {
  try {
    const options = {
      description: 'Meal Package Booking',
      image: 'https://i.imgur.com/3g7nmJC.png',
      currency: 'INR',
      key: 'rzp_test_1DP5mmOlF5G5ag', // Make sure this is your actual test key
      amount: amount,
      name: 'Serveaso',
      order_id: orderId,
      prefill: {
        email: user?.email || 'customer@example.com',
        contact: user?.mobileNo || '9123456780',
        name: user?.name || 'Guest',
      },
      theme: { color: '#F37254' },
      timeout: 300, // 5 minutes timeout
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    RazorpayCheckout.open(options)
      .then((razorpayResponse) => {
        console.log('Payment success:', razorpayResponse);
        handleSuccessfulPayment(razorpayResponse, bookingDetails);
      })
      .catch((error) => {
        console.log('Payment error:', error);
        
        // More specific error handling
        if (error.error && error.error.description) {
          if (error.error.description.includes('cancelled')) {
            Alert.alert('Payment Cancelled', 'You cancelled the payment');
          } else {
            Alert.alert('Payment Failed', error.error.description);
          }
        } else {
          Alert.alert('Payment Failed', 'Something went wrong with the payment');
        }
        
        setLoading(false);
      });
  } catch (error) {
    console.log("Razorpay initialization error:", error);
    Alert.alert('Error', 'Failed to initialize payment');
    setLoading(false);
  }
};

  const getTotal = () => {
    return packages.reduce((sum, pkg, idx) => {
      if (!pkg.selected) return sum;
      return sum + calculatePriceForPersons(pkg.price, pkg.persons || 1);
    }, 0);
  };

  const totalPersons = packages.reduce((sum, pkg) => {
    if (!pkg.selected) return sum;
    return sum + (pkg.persons || 1);
  }, 0);

  const selectedCount = packages.filter(pkg => pkg.selected).length;



   const handleSuccessfulPayment = async (razorpayResponse: any, bookingDetails: BookingDetails) => {
    try {
      // Save booking to backend
      const bookingResponse = await axiosInstance.post(
        "/api/serviceproviders/engagement/add",
        bookingDetails,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (bookingResponse.status === 201) {
        // Send notification
        try {
          await fetch(
            "http://localhost:4000/send-notification",
            {
              method: "POST",
              body: JSON.stringify({
                title: "Hello from ServEaso!",
                body: `Your booking for ${bookingDetails.engagements} has been confirmed!`,
                url: "http://localhost:3000",
              }),
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Notification error:", error);
        }

        // Clear cart
        const selectedPackages = packages.filter(pkg => pkg.selected);
        selectedPackages.forEach(pkg => {
          dispatch(removeFromCart({
            id: pkg.name.toUpperCase(),
            type: 'meal'
          }));
        });

        if (sendDataToParent) {
          sendDataToParent(BOOKINGS);
        }
        onClose();
      }
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert("Error", "Failed to save booking details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.dialogBox}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>MEAL PACKAGES</Text>
            
            {packages.map((pkg, index) => (
              <View key={index} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <Text style={styles.packageTitle}>{pkg.name}</Text>
                  <Text style={styles.price}>
                    ₹{calculatePriceForPersons(pkg.price, pkg.persons || 1).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.rating}>
                  {pkg.rating} ({pkg.reviews}) - {pkg.prepTime}
                </Text>
                
                <View style={styles.personRow}>
                  <Text>Person:</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => handlePersonChange(index, 'decrement')}
                    disabled={(pkg.persons || 1) <= 1}
                  >
                    <Text style={styles.counterSymbol}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.personCount}>{pkg.persons}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => handlePersonChange(index, 'increment')}
                    disabled={(pkg.persons || 1) >= 15}
                  >
                    <Text style={styles.counterSymbol}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.includes}>
                  {pkg.includes.map((item, i) => (
                    <Text key={i}>• {item}</Text>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    pkg.inCart && styles.cartButtonActive,
                  ]}
                  onPress={() => toggleCart(index)}
                >
                  <Text style={styles.cartButtonText}>
                    {pkg.inCart ? 'ADDED TO CART' : 'ADD TO CART'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    pkg.selected && styles.selectedButton,
                  ]}
                  onPress={() => togglePackageSelection(index)}
                >
                  <Text style={[
                    styles.selectButtonText,
                    pkg.selected && styles.selectedButtonText,
                  ]}>
                    {pkg.selected ? 'SELECTED' : 'SELECT PACKAGE'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.voucherSection}>
              <TextInput
                placeholder="Enter voucher code"
                value={voucher}
                onChangeText={setVoucher}
                style={styles.voucherInput}
              />
              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>
                Total for {selectedCount} item{selectedCount !== 1 ? 's' : ''} ({totalPersons} person{totalPersons !== 1 ? 's' : ''})
              </Text>
              <Text style={styles.totalPrice}>₹{getTotal().toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                selectedCount === 0 && styles.continueButtonDisabled
              ]} 
              onPress={handleOpenAgreementDialog}
              disabled={selectedCount === 0}
            >
              <Text style={styles.continueButtonText}>CHECKOUT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Use the custom CheckoutWithAgreement component */}
      <CheckoutWithAgreement
        open={agreementDialogOpen}
        onClose={() => setAgreementDialogOpen(false)}
        onProceed={handleProceedToPayment}
      />
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  dialogBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: height * 0.85,
  },
  container: { padding: 16 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  packageCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  packageTitle: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, fontWeight: 'bold', color: 'red' },
  rating: { marginVertical: 8, fontSize: 12, color: '#666' },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  counterButton: {
    borderWidth: 1,
    borderColor: '#888',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  counterSymbol: { fontSize: 16 },
  personCount: { marginHorizontal: 8, fontSize: 16 },
  includes: { marginVertical: 8 },
  cartButton: {
    borderWidth: 1,
    borderColor: '#0099cc',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cartButtonActive: {
    backgroundColor: '#0099cc',
  },
  cartButtonText: {
    color: '#0099cc',
    fontWeight: 'bold',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#009944',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  selectedButton: {
    backgroundColor: '#009944',
  },
  selectButtonText: {
    color: '#009944',
    fontWeight: 'bold',
  },
  selectedButtonText: {
    color: '#fff',
  },
  voucherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  voucherInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#009944',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  applyButtonText: { color: '#fff', fontWeight: 'bold' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalText: { fontWeight: 'bold' },
  totalPrice: { fontWeight: 'bold', fontSize: 16 },
  continueButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  continueButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#888',
    fontWeight: 'bold',
  },
});

export default DemoCook;