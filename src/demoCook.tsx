import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import { BookingDetails } from './types/engagementRequest';
import { BOOKINGS } from './Constants/pagesConstants';
import axiosInstance from './axiosInstance';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePricingFilterService } from './utils/PricingFilter';

// Redux actions
import { addToCart, removeFromCart, updateCartItem } from './features/addToSlice';
import { CartDialog } from './CartDialog';

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
  bookingType?: string;
}

interface MealCartItem {
  type: 'meal';
  id: string;
  mealType: string;
  persons: number;
  price: number;
  description: string;
  basePrice: number;
  maxPersons: number;
  bookingType: string;
}

const calculatePriceForPersons = (basePrice: number, persons: number, bookingType: string): number => {
  if (bookingType === 'ON_DEMAND') {
    if (persons <= 3) return basePrice;
    if (persons <= 6) return basePrice + basePrice * 0.2 * (persons - 3);
    if (persons <= 9) {
      const base = basePrice + basePrice * 0.2 * 3;
      return base + base * 0.1 * (persons - 6);
    }
    const base = basePrice + basePrice * 0.2 * 3;
    const extraBase = base + base * 0.1 * 3;
    return extraBase + extraBase * 0.05 * (persons - 9);
  } else {
    if (persons <= 3) return basePrice;
    if (persons <= 6) return basePrice + basePrice * 0.2 * (persons - 3);
    if (persons <= 9) {
      const base = basePrice + basePrice * 0.2 * 3;
      return base + base * 0.1 * (persons - 6);
    }
    const base = basePrice + basePrice * 0.2 * 3;
    const extraBase = base + base * 0.1 * 3;
    return extraBase + extraBase * 0.05 * (persons - 9);
  }
};

const DemoCook = ({
  visible,
  onClose,
  handleClose, 
  sendDataToParent,
  user,
  providerDetails,
  bookingType,
}: any) => {
  const dispatch = useDispatch();
  const cart = useSelector((state: any) => state.addToCart?.items || []);
  const { getFilteredPricing } = usePricingFilterService();
  
  const cookPricing = useMemo(() => getFilteredPricing('COOK'), [getFilteredPricing]);
  const [showCartDialog, setShowCartDialog] = useState(false);

  const [packages, setPackages] = useState<Package[]>([]);
  const [voucher, setVoucher] = useState('');
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getIncludesForPackage = useCallback((serviceName: string, bookingType: string): string[] => {
    if (bookingType === 'ON_DEMAND') {
      if (serviceName === 'Breakfast') {
        return ['5-8 chapatis/parathas', '1 dry veg/non-veg item'];
      } else {
        return ['5-8 chapatis/parathas', '1 dry veg/non-veg item', '1 gravy veg/non-veg item', 'Rice'];
      }
    } else {
      if (serviceName === 'Breakfast') {
        return ['5-8 chapatis/parathas', '1 dry veg/non-veg item', 'Daily service'];
      } else {
        return ['5-8 chapatis/parathas', '1 dry veg/non-veg item', '1 gravy veg/non-veg item', 'Rice', 'Daily service'];
      }
    }
  }, []);

  const initialPackages = useMemo(() => {
    const isOnDemand = bookingType?.bookingPreference?.toLowerCase() === 'date';
    
    if (cookPricing && cookPricing.length > 0) {
      return cookPricing.map((item: any) => ({
        name: item.ServiceName || '',
        price: item.Price || 0,
        rating: 4.8,
        reviews: '1.7M reviews',
        prepTime: item.BookingType === 'On Demand' ? '30 mins preparation' : '45 mins preparation',
        includes: getIncludesForPackage(item.ServiceName, item.BookingType === 'On Demand' ? 'ON_DEMAND' : 'REGULAR'),
        selected: false,
        persons: 1,
        inCart: false,
        bookingType: item.BookingType === 'On Demand' ? 'ON_DEMAND' : 'REGULAR'
      }));
    }

    return [
      {
        name: 'Breakfast',
        price: isOnDemand ? 200 : 2000,
        rating: 4.8,
        reviews: '2.9M reviews',
        prepTime: isOnDemand ? '30 mins preparation' : '45 mins preparation',
        includes: isOnDemand 
          ? ['5-8 chapatis/parathas', '1 dry veg/non-veg item'] 
          : ['5-8 chapatis/parathas', '1 dry veg/non-veg item', 'Daily service'],
        selected: false,
        persons: 1,
        inCart: false,
        bookingType: isOnDemand ? 'ON_DEMAND' : 'REGULAR'
      },
      {
        name: 'Lunch',
        price: isOnDemand ? 300 : 3500,
        rating: 4.84,
        reviews: '1.7M reviews',
        prepTime: isOnDemand ? '45 mins preparation' : '1 hour preparation',
        includes: isOnDemand 
          ? ['5-8 chapatis/parathas', '1 dry veg/non-veg item', '1 gravy veg/non-veg item', 'Rice']
          : ['5-8 chapatis/parathas', '1 dry veg/non-veg item', '1 gravy veg/non-veg item', 'Rice', 'Daily service'],
        selected: false,
        persons: 1,
        inCart: false,
        bookingType: isOnDemand ? 'ON_DEMAND' : 'REGULAR'
      },
      {
        name: 'Dinner',
        price: isOnDemand ? 300 : 3500,
        rating: 4.84,
        reviews: '2.7M reviews',
        prepTime: isOnDemand ? '1.5 hrs preparation' : '1 hour preparation',
        includes: isOnDemand 
          ? ['5-8 chapatis/parathas', '1 dry veg/non-veg item', '1 gravy veg/non-veg item', 'Rice']
          : ['5-8 chapatis/parathas', '1 dry veg/non-veg item', '1 gravy veg/non-veg item', 'Rice', 'Daily service'],
        selected: false,
        persons: 1,
        inCart: false,
        bookingType: isOnDemand ? 'ON_DEMAND' : 'REGULAR'
      },
    ];
  }, [cookPricing, bookingType?.bookingPreference, getIncludesForPackage]);

  useEffect(() => {
    if (packages.length === 0 && initialPackages.length > 0) {
      setPackages(initialPackages);
    }
  }, [initialPackages, packages.length]);

  useEffect(() => {
    if (packages.length === 0) return;

    const updatedPackages = packages.map(pkg => {
      const cartItem = cart.find((item: any) => 
        item.type === 'meal' && item.mealType === pkg.name.toUpperCase()
      );
      
      return {
        ...pkg,
        selected: !!cartItem,
        persons: cartItem?.persons || 1,
        inCart: !!cartItem
      };
    });

    setPackages(updatedPackages);
  }, [cart]);

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
        setTimeout(() => {
          dispatch(updateCartItem({
            id: currentPackage.name.toUpperCase(),
            type: 'meal',
            updates: {
              persons: currentPackage.persons,
              price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1, currentPackage.bookingType || 'REGULAR'),
              description: currentPackage.includes.join(', '),
              basePrice: currentPackage.price,
              maxPersons: 15,
              bookingType: currentPackage.bookingType || 'REGULAR'
            }
          }));
        }, 0);
      }
      
      return updated;
    });
  };

  const toggleCart = (index: number) => {
    setPackages(prev => {
      const updated = [...prev];
      const currentPackage = updated[index];
      const newInCartState = !currentPackage.inCart;

      setTimeout(() => {
        if (newInCartState) {
          dispatch(addToCart({
            type: 'meal',
            id: currentPackage.name.toUpperCase(),
            mealType: currentPackage.name.toUpperCase(),
            persons: currentPackage.persons || 1,
            price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1, currentPackage.bookingType || 'REGULAR'),
            description: currentPackage.includes.join(', '),
            basePrice: currentPackage.price,
            maxPersons: 15,
            bookingType: currentPackage.bookingType || 'REGULAR'
          }));
        } else {
          dispatch(removeFromCart({
            id: currentPackage.name.toUpperCase(),
            type: 'meal'
          }));
        }
      }, 0);

      updated[index] = {
        ...currentPackage,
        inCart: newInCartState,
        selected: newInCartState
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

 

  const handleProceedToPayment = async () => {
   
    setShowCartDialog(false); // Close cart dialog
    await handleCheckout();
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      const selectedPackages = packages.filter(pkg => pkg.inCart);
      if (selectedPackages.length === 0) {
        Alert.alert("Please add at least one package to cart");
        setLoading(false);
        return;
      }

      const totalAmount = selectedPackages.reduce(
        (sum, pkg) => sum + calculatePriceForPersons(pkg.price, pkg.persons || 1, pkg.bookingType || 'REGULAR'),
        0
      ) * 100;

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
        monthlyAmount: totalAmount / 100,
        paymentMode: 'UPI',
        bookingType: bookingType?.bookingPreference ? getBookingTypeFromPreference(bookingType.bookingPreference) : 'DEMO',
        taskStatus: 'COMPLETED',
        serviceType: 'COOK',
        responsibilities: []
      };

      const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
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
        key: 'rzp_test_1DP5mmOlF5G5ag',
        amount: amount,
        name: 'Serveaso',
        order_id: orderId,
        prefill: {
          email: user?.email || 'customer@example.com',
          contact: user?.mobileNo || '9123456780',
          name: user?.name || 'Guest',
        },
        theme: { color: '#3399cc' },
        timeout: 300,
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
    return packages.reduce((sum, pkg) => {
      if (!pkg.inCart) return sum;
      return sum + calculatePriceForPersons(pkg.price, pkg.persons || 1, pkg.bookingType || 'REGULAR');
    }, 0);
  };

  const totalPersons = packages.reduce((sum, pkg) => {
    if (!pkg.inCart) return sum;
    return sum + (pkg.persons || 1);
  }, 0);

  const selectedCount = packages.filter(pkg => pkg.inCart).length;

  const handleSuccessfulPayment = async (razorpayResponse: any, bookingDetails: BookingDetails) => {
    try {
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

        const selectedPackages = packages.filter(pkg => pkg.inCart);
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
             <TouchableOpacity onPress={handleClose} style={styles.backIcon}>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.dialogTitle}>MEAL PACKAGES</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.packagesContainer}>
              {packages.map((pkg, index) => (
                <View key={index} style={[
                  styles.packageCard, 
                  pkg.inCart && styles.selectedPackage,
                  { borderLeftColor: '#3399cc' }
                ]}>
                  <View style={styles.packageHeader}>
                    <View>
                      <Text style={styles.packageTitle}>{pkg.name}</Text>
                      <View style={styles.ratingContainer}>
                        <Text style={[styles.ratingValue, { color: '#3399cc' }]}>{pkg.rating}</Text>
                        <Text style={styles.reviewsText}>({pkg.reviews})</Text>
                      </View>
                      <Text style={styles.bookingTypeText}>
                        {pkg.bookingType === 'ON_DEMAND' ? 'On Demand' : 'Regular'} • {pkg.bookingType === 'ON_DEMAND' ? 'Per Day' : 'Per Month'}
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.priceValue, { color: '#3399cc' }]}>
                        ₹{calculatePriceForPersons(pkg.price, pkg.persons || 1, pkg.bookingType || 'REGULAR').toFixed(2)}
                      </Text>
                      <Text style={styles.preparationTime}>{pkg.prepTime}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.personsControl}>
                    <Text style={styles.personsLabel}>Persons:</Text>
                    <View style={styles.personsInput}>
                      <TouchableOpacity 
                        style={styles.decrementButton}
                        onPress={() => handlePersonChange(index, 'decrement')}
                        disabled={(pkg.persons || 1) <= 1}
                      >
                        <Text style={styles.buttonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.personsValue}>
                        {pkg.persons}
                      </Text>
                      <TouchableOpacity 
                        style={styles.incrementButton}
                        onPress={() => handlePersonChange(index, 'increment')}
                        disabled={(pkg.persons || 1) >= 15}
                      >
                        <Text style={styles.buttonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.descriptionList}>
                    {pkg.includes.map((item, i) => (
                      <View key={i} style={styles.descriptionItem}>
                        <Text style={styles.descriptionBullet}>•</Text>
                        <Text style={styles.descriptionText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.cartButton,
                      pkg.inCart && styles.selectedCartButton
                    ]}
                    onPress={() => toggleCart(index)}
                  >
                    {pkg.inCart ? (
                      <Icon name="remove-shopping-cart" size={20} color="white" />
                    ) : (
                      <Icon name="add-shopping-cart" size={20} color="#3399cc" />
                    )}
                    <Text style={[
                      styles.cartButtonText,
                      pkg.inCart && styles.selectedCartButtonText
                    ]}>
                      {pkg.inCart ? 'REMOVE FROM CART' : 'ADD TO CART'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.footerContainer}>
            <View style={styles.voucherContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                placeholderTextColor="#999"
                value={voucher}
                onChangeText={setVoucher}
              />
              <TouchableOpacity style={styles.voucherButton}>
                <Text style={styles.voucherButtonText}>Apply Voucher</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.totalContainer}>
              <Text style={styles.footerText}>
                Total for {selectedCount} item{selectedCount !== 1 ? 's' : ''} ({totalPersons} person{totalPersons !== 1 ? 's' : ''})
              </Text>
              <Text style={styles.footerPrice}>
                ₹{getTotal().toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.footerButtons}>
              <TouchableOpacity 
                style={styles.closeFooterButton}
                onPress={onClose}
              >
                <Text style={styles.closeFooterButtonText}>CLOSE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  selectedCount === 0 && styles.disabledButton
                ]}
               onPress={() => setShowCartDialog(true)}
                disabled={selectedCount === 0}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Add CartDialog component */}
      <CartDialog
        open={showCartDialog}
        handleClose={() => setShowCartDialog(false)}
        handleCheckout={handleProceedToPayment}
      />
    
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 15,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    padding: 5,
  },
  scrollView: {
    paddingHorizontal: 10,
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
    borderLeftWidth: 5,
  },
  selectedPackage: {
    borderColor: '#3399cc',
    borderWidth: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  bookingTypeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
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
  preparationTime: {
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
    marginRight: 10,
    color: '#333',
  },
  personsInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decrementButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#333',
  },
  personsValue: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
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
    marginRight: 10,
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cartButton: {
    paddingVertical: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3399cc',
  },
  selectedCartButton: {
    backgroundColor: '#3399cc',
    borderColor: '#3399cc',
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#3399cc',
  },
  selectedCartButtonText: {
    color: 'white',
  },
  footerContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  voucherContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  voucherButton: {
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  totalContainer: {
    marginBottom: 15,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeFooterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  closeFooterButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backIcon: {
    padding: 5,
    marginRight: 10,
  },
});

export default DemoCook;