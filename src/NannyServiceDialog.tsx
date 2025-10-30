import React, { useState, useEffect, useMemo } from 'react';
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
  BackHandler,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { addToCart, removeFromCart, selectCartItems } from './features/addToSlice';
import { isNannyCartItem } from './types/cartSlice';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';
import { BookingDetails } from './types/engagementRequest';
import axiosInstance from './axiosInstance';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Dimensions } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { usePricingFilterService } from './utils/PricingFilter';
import { useAppUser } from './context/AppUserContext';

// Type definitions
type PackageType = 'day' | 'night' | 'fullTime';
type CareType = 'baby' | 'elderly';

interface PackagePrices {
  day: number;
  night: number;
  fullTime: number;
}

interface NannyPackages {
  baby: PackagePrices;
  elderly: PackagePrices;
}

interface PackageDescriptions {
  day: string;
  night: string;
  fullTime: string;
}

interface BabyPackageState {
  day: { age: number; selected: boolean };
  night: { age: number; selected: boolean };
  fullTime: { age: number; selected: boolean };
}

interface ElderlyPackageState {
  day: { age: number; selected: boolean };
  night: { age: number; selected: boolean };
  fullTime: { age: number; selected: boolean };
}

interface CartItems {
  babyDay: boolean;
  babyNight: boolean;
  babyFullTime: boolean;
  elderlyDay: boolean;
  elderlyNight: boolean;
  elderlyFullTime: boolean;
}

interface NannyServicesDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
  user?: any;
  bookingType?: any;
}

const NannyServicesDialog: React.FC<NannyServicesDialogProps> = ({ 
  open, 
  handleClose, 
  providerDetails,
  sendDataToParent,
  user,
  bookingType
}) => {
  const [activeTab, setActiveTab] = useState<CareType>('baby');
  const [babyPackages, setBabyPackages] = useState<BabyPackageState>({
    day: { age: 3, selected: false },
    night: { age: 3, selected: false },
    fullTime: { age: 3, selected: false }
  });
  const [elderlyPackages, setElderlyPackages] = useState<ElderlyPackageState>({
    day: { age: 65, selected: false },
    night: { age: 65, selected: false },
    fullTime: { age: 65, selected: false }
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const { user: auth0User } = useAuth0();
  const { setAppUser, appUser } = useAppUser();
  
  // Get pricing filter service
  const { getFilteredPricing } = usePricingFilterService();
  const nannyPricing = getFilteredPricing('nanny');
  
  console.log('Nanny Pricing Data:', nannyPricing);
  
  // Get screen dimensions
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  const bookingTypeFromRedux = useSelector((state: any) => state.bookingType?.value);
  const allCartItems = useSelector(selectCartItems);
  const nannyCartItems = allCartItems.filter(isNannyCartItem);
  const dispatch = useDispatch();

  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;
  const [cartItems, setCartItems] = useState<CartItems>({
    babyDay: false,
    babyNight: false,
    babyFullTime: false,
    elderlyDay: false,
    elderlyNight: false,
    elderlyFullTime: false
  });

  // Initialize cart items from Redux
  useEffect(() => {
    const initialCartItems: CartItems = {
      babyDay: false,
      babyNight: false,
      babyFullTime: false,
      elderlyDay: false,
      elderlyNight: false,
      elderlyFullTime: false
    };
  
    nannyCartItems.forEach(item => {
      const key = `${item.careType}${item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1)}` as keyof CartItems;
      initialCartItems[key] = true;
    });

    setCartItems(initialCartItems);
  }, []);

  // Get nanny packages from pricing data with proper mapping based on Categories
  const getNannyPackages = useMemo((): NannyPackages => {
    console.log('Processing nanny pricing data:', nannyPricing);

    // Initialize with zeros - we'll only use data from pricing filter
    const packages: NannyPackages = {
      baby: {
        day: 0,
        night: 0,
        fullTime: 0
      },
      elderly: {
        day: 0,
        night: 0,
        fullTime: 0
      }
    };

    // If no nanny pricing data, return zeros
    if (!nannyPricing || nannyPricing.length === 0) {
      console.log('No nanny pricing data found');
      return packages;
    }

    // Map pricing data to packages based on Categories field
    nannyPricing.forEach((item: any) => {
      const categories = item.Categories?.toLowerCase() || '';
      const price = bookingType?.bookingPreference?.toLowerCase() === "date" 
        ? item["Price /Day (INR)"] 
        : item["Price /Month (INR)"];

      console.log(`Processing categories: ${categories}, price: ${price}`);

      // Map categories to package types
      if (categories.includes('baby care - day') || categories.includes('baby care-day')) {
        packages.baby.day = price || packages.baby.day;
      } else if (categories.includes('baby care - night') || categories.includes('baby care-night')) {
        packages.baby.night = price || packages.baby.night;
      } else if (categories.includes('baby care - in house') || categories.includes('baby care-in house') || categories.includes('baby care - full')) {
        packages.baby.fullTime = price || packages.baby.fullTime;
      } else if (categories.includes('elderly care - day') || categories.includes('elderly care-day')) {
        packages.elderly.day = price || packages.elderly.day;
      } else if (categories.includes('elderly care - night') || categories.includes('elderly care-night')) {
        packages.elderly.night = price || packages.elderly.night;
      } else if (categories.includes('elderly care - in house') || categories.includes('elderly care-in house') || categories.includes('elderly care - full')) {
        packages.elderly.fullTime = price || packages.elderly.fullTime;
      }
    });

    console.log('Final nanny packages from pricing data:', packages);
    return packages;
  }, [nannyPricing, bookingType?.bookingPreference]);

  // Get booking type from preference
  const getBookingTypeFromPreference = (bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY';
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  };

  useEffect(() => {
    if (!open) return;

    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [open, handleClose]);

  useEffect(() => {
    const updatedCartItems: CartItems = { ...cartItems };
    
    // Reset all cart items
    (Object.keys(updatedCartItems) as Array<keyof CartItems>).forEach(key => {
      updatedCartItems[key] = false;
    });

    // Set cart items from Redux
    nannyCartItems.forEach(item => {
      const packageKey = `${item.careType}${item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1)}` as keyof CartItems;
      updatedCartItems[packageKey] = true;
    });

    const hasChanges = (Object.keys(updatedCartItems) as Array<keyof CartItems>).some(
      key => updatedCartItems[key] !== cartItems[key]
    );

    if (hasChanges) {
      setCartItems(updatedCartItems);
    }
  }, [nannyCartItems]);

  const handleBabyAgeChange = (packageType: PackageType, value: number) => {
    setBabyPackages(prev => ({
      ...prev,
      [packageType]: {
        ...prev[packageType],
        age: Math.max(1, prev[packageType].age + value)
      }
    }));
  };

  const handleElderlyAgeChange = (packageType: PackageType, value: number) => {
    setElderlyPackages(prev => ({
      ...prev,
      [packageType]: {
        ...prev[packageType],
        age: Math.max(60, prev[packageType].age + value)
      }
    }));
  };

  const getPackagePrice = (type: CareType, packageType: PackageType): number => {
    const packages = getNannyPackages[type];
    const price = packages[packageType];
    
    // If no price found in pricing data, don't show the package
    if (!price || price === 0) {
      return 0;
    }
    
    return price;
  };

  const getPackageDescription = (type: CareType, packageType: PackageType): string => {
    const descriptions: Record<CareType, PackageDescriptions> = {
      baby: {
        day: '8 hours daytime baby care service. Includes taking care of kids, clothes changing, feeding, taking kid for walk in stroller and playing in the park (cooking excluded)',
        night: '8 hours overnight baby care service. Includes taking care of kids, clothes changing, feeding, and making kid sleep',
        fullTime: '16 hours round-the-clock baby care service. Live-in nanny service with sleep hours from 11pm - 6am'
      },
      elderly: {
        day: '8 hours daytime elderly care service. Includes taking care of elders at home, outside walk, providing medicines on time after food, emergency response',
        night: '8 hours overnight elderly care service. Includes night-time assistance, medication management, and safety monitoring',
        fullTime: '16 hours round-the-clock elderly care service. Live-in caregiver service with sleep hours from 11pm - 6am'
      }
    };
    
    return descriptions[type][packageType];
  };

  const getPackageDetails = (type: CareType, packageType: PackageType) => {
    const packages = type === 'baby' ? babyPackages : elderlyPackages;
    const packageData = packages[packageType];
    const price = getPackagePrice(type, packageType);
    
    // Don't render package if no price available
    if (price === 0) {
      return null;
    }

    const reviews = packageType === 'day' ? '(1.5M reviews)' : 
                   packageType === 'night' ? '(1.2M reviews)' : '(980K reviews)';
    const rating = packageType === 'day' ? 4.8 : 
                  packageType === 'night' ? 4.9 : 4.9;

    const descriptionItems = packageType === 'day' ? [
      '8 hours professional service',
      type === 'baby' ? 'Clothes changing and feeding' : 'Medication management',
      type === 'baby' ? 'Park walks and activities' : 'Emergency response system'
    ] : packageType === 'night' ? [
      '8 hours overnight service',
      type === 'baby' ? 'Sleep routine establishment' : 'Night-time safety monitoring',
      type === 'baby' ? 'Night feeding support' : 'Medication assistance'
    ] : [
      '16 hours comprehensive care',
      'Live-in service provider',
      type === 'baby' ? 'All daily care activities' : '24/7 emergency response'
    ];

    return {
      packageData,
      price,
      reviews,
      rating,
      descriptionItems
    };
  };

  const handleAddToCart = (packageKey: keyof CartItems) => {
    try {
      let type: CareType;
      let packageType: PackageType;

      if (packageKey.startsWith('baby')) {
        type = 'baby';
        const extractedType = packageKey.replace('baby', '').charAt(0).toLowerCase() + 
                           packageKey.replace('baby', '').slice(1);
        packageType = extractedType as PackageType;
      } else if (packageKey.startsWith('elderly')) {
        type = 'elderly';
        const extractedType = packageKey.replace('elderly', '').charAt(0).toLowerCase() + 
                           packageKey.replace('elderly', '').slice(1);
        packageType = extractedType as PackageType;
      } else {
        console.error('Invalid package key:', packageKey);
        return;
      }

      const packages = type === 'baby' ? babyPackages : elderlyPackages;
      const packageDetails = packages[packageType];

      if (!packageDetails) {
        console.error('Package details not found for:', packageKey);
        return;
      }

      const age = packageDetails.age;
      const price = getPackagePrice(type, packageType);
      const description = getPackageDescription(type, packageType);

      // Don't add to cart if no price available
      if (price === 0) {
        Alert.alert('Service Not Available', 'This service is currently not available for booking.');
        return;
      }

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

  const calculateTotal = (): number => {
    let total = 0;
    (Object.keys(cartItems) as Array<keyof CartItems>).forEach(key => {
      if (cartItems[key]) {
        const type = key.startsWith('baby') ? 'baby' : 'elderly';
        const packageType = key.replace(type, '').charAt(0).toLowerCase() + 
                          key.replace(type, '').slice(1) as PackageType;
        total += getPackagePrice(type, packageType);
      }
    });
    return total;
  };

  const getSelectedPackagesCount = (): number => {
    return Object.values(cartItems).filter(item => item).length;
  };

  const handleApplyVoucher = () => {
    Alert.alert('Voucher Applied', 'Your voucher has been applied successfully');
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!appUser?.customerid) {
        Alert.alert("Authentication Required", "Please log in to proceed with booking");
        setLoading(false);
        return;
      }

      const selectedPackages: Array<{type: CareType; packageType: PackageType; price: number; description: string}> = [];
      
      (Object.keys(cartItems) as Array<keyof CartItems>).forEach(key => {
        if (cartItems[key]) {
          const type = key.startsWith('baby') ? 'baby' : 'elderly';
          const packageType = key.replace(type, '').charAt(0).toLowerCase() + 
                            key.replace(type, '').slice(1) as PackageType;
          const price = getPackagePrice(type, packageType);
          if (price > 0) {
            selectedPackages.push({
              type,
              packageType,
              price,
              description: getPackageDescription(type, packageType)
            });
          }
        }
      });

      if (selectedPackages.length === 0) {
        Alert.alert("Please add at least one package to cart");
        setLoading(false);
        return;
      }

      const totalAmount = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);
      
      // Create booking details with appUser context
      const bookingDetails: BookingDetails = {
        serviceProviderId: Number(providerDetails?.serviceproviderId) || 0,
        serviceProviderName: providerFullName,
        customerId: appUser?.customerid,
        customerName: appUser?.name || user?.name,
        startDate: bookingType?.startDate || new Date().toISOString().split('T')[0],
        endDate: bookingType?.endDate || "",
        engagements: selectedPackages.map(p => `${p.type} ${p.packageType}`).join(', '),
        address: user?.customerDetails?.currentLocation || "",
        timeslot: bookingType?.timeRange || "",
        monthlyAmount: totalAmount,
        paymentMode: "UPI",
        bookingType: getBookingTypeFromPreference(bookingType?.bookingPreference),
        taskStatus: "NOT_STARTED",
        responsibilities: [],
        serviceType: "NANNY",
      };

      console.log('Booking Payload:', JSON.stringify(bookingDetails, null, 2));

      // Create Razorpay order
      const response = await axios.post(
        "https://utils-ndt3.onrender.com/create-order",
        { amount: totalAmount * 100 },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        const { id: orderId, currency, amount } = response.data;
    
        const options = {
          key: "rzp_test_lTdgjtSRlEwreA",
          amount: amount,
          currency: currency,
          name: "Serveaso",
          description: "Nanny Services Booking",
          order_id: orderId,
          prefill: {
            name: appUser?.name || user?.name || "",
            email: appUser?.email || user?.email || "",
            contact: appUser?.mobileNo || user?.mobileNo || "",
          },
          theme: { color: "#3399cc" },
        };
    
        RazorpayCheckout.open(options)
          .then((razorpayResponse) => {
            handleSuccessfulPayment(razorpayResponse, bookingDetails);
          })
          .catch((error) => {
            Alert.alert("Payment Failed", error.description || "Unknown error");
            console.error("Razorpay payment error:", error);
            setLoading(false);
          });
      }
    } catch (error) {
      console.error("Error while creating Razorpay order:", error);
      Alert.alert("Error", "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  const handleSuccessfulPayment = async (razorpayResponse: any, bookingDetails: BookingDetails) => {
    try {
      console.log('Sending booking to API:', JSON.stringify(bookingDetails, null, 2));
      
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
        // Clear cart items after successful booking
        (Object.keys(cartItems) as Array<keyof CartItems>).forEach(key => {
          if (cartItems[key]) {
            const type = key.startsWith('baby') ? 'baby' : 'elderly';
            const packageType = key.replace(type, '').charAt(0).toLowerCase() + 
                              key.replace(type, '').slice(1) as PackageType;
            const id = `${type}_${packageType}_${providerDetails?.serviceproviderId || 'default'}`;
            
            dispatch(removeFromCart({ id, type: 'nanny' }));
          }
        });

        Alert.alert('Success', 'Booking confirmed successfully!');
        if (sendDataToParent) {
          sendDataToParent('BOOKINGS');
        }
        handleClose();
      } else {
        throw new Error("Failed to save booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert("Error", "Failed to save booking details");
    } finally {
      setLoading(false);
    }
  };

  const renderPackage = (type: CareType, packageType: PackageType) => {
    const packageKey = `${type}${packageType.charAt(0).toUpperCase() + packageType.slice(1)}` as keyof CartItems;
    const packageDetails = getPackageDetails(type, packageType);
    
    // Don't render package if no price available
    if (!packageDetails) {
      return null;
    }

    const { packageData, price, reviews, rating, descriptionItems } = packageDetails;
    const color = '#3399cc';
    const formattedPrice = `₹${price.toLocaleString()}`;

    return (
      <View key={packageType} style={[
        styles.packageCard, 
        cartItems[packageKey] && styles.selectedPackage,
        { borderLeftColor: color }
      ]}>
        <View style={styles.packageHeader}>
          <View>
            <Text style={styles.packageTitle}>
              {type === 'baby' ? 'Baby Care' : 'Elderly Care'} - {packageType.charAt(0).toUpperCase() + packageType.slice(1)}
            </Text>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingValue, { color }]}>{rating}</Text>
              <Text style={styles.reviewsText}>{reviews}</Text>
            </View>
            <Text style={styles.bookingTypeText}>
              {bookingType?.bookingPreference?.toLowerCase() === 'date' ? 'Per Day' : 'Monthly service'} • On Demand
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, { color }]}>{formattedPrice}</Text>
            <Text style={styles.careType}>
              {packageType === 'day' ? '8 hours service' : 
               packageType === 'night' ? '8 hours service' : '16 hours service'}
            </Text>
          </View>
        </View>
        
        <View style={styles.personsControl}>
          <Text style={styles.personsLabel}>Age:</Text>
          <View style={styles.personsInput}>
            <TouchableOpacity 
              style={styles.ageButton}
              onPress={() => type === 'baby' ? handleBabyAgeChange(packageType, -1) : handleElderlyAgeChange(packageType, -1)}
              disabled={type === 'baby' ? packageData.age <= 1 : packageData.age <= 60}
            >
              <Text style={[styles.ageButtonText, (type === 'baby' ? packageData.age <= 1 : packageData.age <= 60) && styles.disabledAgeButton]}>-</Text>
            </TouchableOpacity>
            <Text style={styles.personsValue}>{packageData.age}</Text>
            <TouchableOpacity 
              style={styles.ageButton}
              onPress={() => type === 'baby' ? handleBabyAgeChange(packageType, 1) : handleElderlyAgeChange(packageType, 1)}
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
        
        <TouchableOpacity
          style={[
            styles.cartButton,
            cartItems[packageKey] && styles.selectedCartButton
          ]}
          onPress={() => handleAddToCart(packageKey)}
        >
          {cartItems[packageKey] ? (
            <Icon name="remove-shopping-cart" size={20} color="white" />
          ) : (
            <Icon name="add-shopping-cart" size={20} color="#3399cc" />
          )}
          <Text style={[
            styles.cartButtonText,
            cartItems[packageKey] && styles.selectedCartButtonText
          ]}>
            {cartItems[packageKey] ? 'REMOVE FROM CART' : 'ADD TO CART'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBabyPackages = () => {
    const packages = [
      renderPackage('baby', 'day'),
      renderPackage('baby', 'night'),
      renderPackage('baby', 'fullTime')
    ].filter(Boolean); // Remove null packages

    if (packages.length === 0) {
      return (
        <View style={styles.noServiceContainer}>
          <Text style={styles.noServiceText}>No baby care services available at the moment</Text>
        </View>
      );
    }

    return packages;
  };

  const renderElderlyPackages = () => {
    const packages = [
      renderPackage('elderly', 'day'),
      renderPackage('elderly', 'night'),
      renderPackage('elderly', 'fullTime')
    ].filter(Boolean); // Remove null packages

    if (packages.length === 0) {
      return (
        <View style={styles.noServiceContainer}>
          <Text style={styles.noServiceText}>No elderly care services available at the moment</Text>
        </View>
      );
    }

    return packages;
  };

  return (    
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { 
        paddingTop: SCREEN_HEIGHT * 0.15,
        paddingBottom: SCREEN_HEIGHT * 0.15
      }]}>
        <View style={[styles.modalContainer, { 
          maxHeight: SCREEN_HEIGHT * 0.7,
          paddingVertical: 10
        }]}>
          <View style={styles.header}>
             <TouchableOpacity onPress={handleClose} style={styles.backIcon}>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.dialogTitle}>NANNY SERVICES</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'baby' && styles.activeTab]}
              onPress={() => setActiveTab('baby')}
            >
              <Text style={[styles.tabText, activeTab === 'baby' && styles.activeTabText]}>
                Baby Care
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'elderly' && styles.activeTab]}
              onPress={() => setActiveTab('elderly')}
            >
              <Text style={[styles.tabText, activeTab === 'elderly' && styles.activeTabText]}>
                Elderly Care
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.packagesContainer}>
              {activeTab === 'baby' ? renderBabyPackages() : renderElderlyPackages()}
            </View>
          </ScrollView>
          
          <View style={styles.footerContainer}>
            <View style={styles.voucherContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                placeholderTextColor="#999"
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
            
            <View style={styles.totalContainer}>
              <Text style={styles.footerText}>
                Total for {getSelectedPackagesCount()} service{getSelectedPackagesCount() !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.footerPrice}>₹{calculateTotal().toLocaleString()}</Text>
            </View>
            
            <View style={styles.footerButtons}>
              <TouchableOpacity 
                style={styles.closeFooterButton}
                onPress={handleClose}
              >
                <Text style={styles.closeFooterButtonText}>CLOSE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  getSelectedPackagesCount() === 0 && styles.disabledButton
                ]}
                onPress={handleCheckout}
                disabled={getSelectedPackagesCount() === 0 || loading}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  bookingTypeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    overflow: 'hidden',
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
  backIcon: {
    padding: 5,
    marginRight: 10,
  },
  closeIcon: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3399cc',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontSize: 16,
    color: '#3399cc',
    fontWeight: 'bold',
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
    marginRight: 10,
    color: '#333',
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
  disabledAgeButton: {
    color: '#ccc',
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
  noServiceContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noServiceText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default NannyServicesDialog;