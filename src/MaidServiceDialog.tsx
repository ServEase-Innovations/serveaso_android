import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  BackHandler
} from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BookingDetails } from './types/engagementRequest';
import { BOOKINGS } from './Constants/pagesConstants';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';
import axiosInstance from './axiosInstance';
import { addToCart, removeFromCart, selectCartItems } from './features/addToSlice';
import { isMaidCartItem } from './types/cartSlice';

interface MaidServiceDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
}

const MaidServiceDialog: React.FC<MaidServiceDialogProps> = ({ 
  open, 
  handleClose, 
  providerDetails,
  sendDataToParent
}) => {
  const [activeTab, setActiveTab] = useState('regular');
  const allCartItems = useSelector(selectCartItems);
  const maidCartItems = allCartItems.filter(isMaidCartItem);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<Record<string, boolean>>(() => {
    const initialCartItems = {
      utensilCleaning: false,
      sweepingMopping: false,
      bathroomCleaning: false,
      bathroomDeepCleaning: false,
      normalDusting: false,
      deepDusting: false,
      utensilDrying: false,
      clothesDrying: false
    };

    maidCartItems.forEach(item => {
      if (item.serviceType === 'package') {
        initialCartItems[item.name] = true;
      } else if (item.serviceType === 'addon') {
        initialCartItems[item.name] = true;
      }
    });

    return initialCartItems;
  });

  const [packageStates, setPackageStates] = useState({
    utensilCleaning: { persons: 3 },
    sweepingMopping: { houseSize: '2BHK' },
    bathroomCleaning: { bathrooms: 2 }
  });
  
  const dispatch = useDispatch();
  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const users = useSelector((state: any) => state.user?.value);
  const currentLocation = users?.customerDetails?.currentLocation;
  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;

  const getBookingTypeFromPreference = (bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY';
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  };

  const bookingDetails: BookingDetails = {
    serviceProviderId: providerDetails?.serviceproviderId || 0,
    serviceProviderName: providerFullName,
    customerId: users?.customerDetails?.customerId || 0,
    customerName: `${users?.customerDetails?.firstName} ${users?.customerDetails?.lastName}` || "",
    startDate: bookingType?.startDate || new Date().toISOString().split('T')[0],
    endDate: bookingType?.endDate || "",
    engagements: "",
    address: currentLocation || "",
    timeslot: bookingType?.timeRange || "",
    monthlyAmount: 0,
    paymentMode: "UPI",
    bookingType: getBookingTypeFromPreference(bookingType?.bookingPreference),
    taskStatus: "NOT_STARTED",
    responsibilities: [],
    serviceType: "MAID",
  };

  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handlePersonChange = (operation: string) => {
    setPackageStates(prev => ({
      ...prev,
      utensilCleaning: {
        ...prev.utensilCleaning,
        persons: operation === 'increment' 
          ? Math.min(prev.utensilCleaning.persons + 1, 10)
          : Math.max(prev.utensilCleaning.persons - 1, 1)
      }
    }));
  };

  const handleHouseSizeChange = (operation: string) => {
    const sizes = ['1BHK', '2BHK', '3BHK', '4BHK+'];
    const currentIndex = sizes.indexOf(packageStates.sweepingMopping.houseSize);
    
    setPackageStates(prev => ({
      ...prev,
      sweepingMopping: {
        ...prev.sweepingMopping,
        houseSize: operation === 'increment' 
          ? sizes[Math.min(currentIndex + 1, sizes.length - 1)]
          : sizes[Math.max(currentIndex - 1, 0)]
      }
    }));
  };

  const handleBathroomChange = (operation: string) => {
    setPackageStates(prev => ({
      ...prev,
      bathroomCleaning: {
        ...prev.bathroomCleaning,
        bathrooms: operation === 'increment' 
          ? Math.min(prev.bathroomCleaning.bathrooms + 1, 5)
          : Math.max(prev.bathroomCleaning.bathrooms - 1, 1)
      }
    }));
  };

  const getPackagePrice = (packageName: string): number => {
    switch(packageName) {
      case 'utensilCleaning': return 1200;
      case 'sweepingMopping': return 1200;
      case 'bathroomCleaning': return 600;
      default: return 0;
    }
  };

  const getPackageDescription = (packageName: string): string => {
    switch(packageName) {
      case 'utensilCleaning': 
        return 'All kind of daily utensil cleaning\nParty used type utensil cleaning';
      case 'sweepingMopping':
        return 'Daily sweeping and mopping';
      case 'bathroomCleaning':
        return 'Weekly cleaning of bathrooms';
      default: return '';
    }
  };

  const getPackageDetails = (packageName: string) => {
    switch(packageName) {
      case 'utensilCleaning':
        return { persons: packageStates.utensilCleaning.persons };
      case 'sweepingMopping':
        return { houseSize: packageStates.sweepingMopping.houseSize };
      case 'bathroomCleaning':
        return { bathrooms: packageStates.bathroomCleaning.bathrooms };
      default: return {};
    }
  };

  const getAddOnPrice = (addOnName: string): number => {
    switch(addOnName) {
      case 'bathroomDeepCleaning': return 1000;
      case 'normalDusting': return 1000;
      case 'deepDusting': return 1500;
      case 'utensilDrying': return 1000;
      case 'clothesDrying': return 1000;
      default: return 0;
    }
  };

  const getAddOnDescription = (addOnName: string): string => {
    switch(addOnName) {
      case 'bathroomDeepCleaning':
        return 'Weekly cleaning of bathrooms, all bathroom walls cleaned';
      case 'normalDusting':
        return 'Daily furniture dusting, doors, carpet, bed making';
      case 'deepDusting':
        return 'Includes chemical agents cleaning: décor items, furniture';
      case 'utensilDrying':
        return 'Househelp will dry and make proper arrangements';
      case 'clothesDrying':
        return 'Househelp will get clothes from/to drying place';
      default: return '';
    }
  };

  const handleAddPackageToCart = (packageName: string) => {
    const packageDetails = {
      id: `package_${packageName}`,
      type: 'maid' as const,
      serviceType: 'package' as const,
      name: packageName,
      price: getPackagePrice(packageName),
      description: getPackageDescription(packageName),
      details: getPackageDetails(packageName)
    };

    if (cartItems[packageName]) {
      dispatch(removeFromCart({ id: packageDetails.id, type: 'maid' }));
    } else {
      dispatch(addToCart(packageDetails));
    }

    setCartItems(prev => ({
      ...prev,
      [packageName]: !prev[packageName]
    }));
  };

  const handleAddAddOnToCart = (addOnName: string) => {
    const addOnDetails = {
      id: `addon_${addOnName}`,
      type: 'maid' as const,
      serviceType: 'addon' as const,
      name: addOnName,
      price: getAddOnPrice(addOnName),
      description: getAddOnDescription(addOnName)
    };

    if (cartItems[addOnName]) {
      dispatch(removeFromCart({ id: addOnDetails.id, type: 'maid' }));
    } else {
      dispatch(addToCart(addOnDetails));
    }

    setCartItems(prev => ({
      ...prev,
      [addOnName]: !prev[addOnName]
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Packages
    if (cartItems.utensilCleaning) total += getPackagePrice('utensilCleaning');
    if (cartItems.sweepingMopping) total += getPackagePrice('sweepingMopping');
    if (cartItems.bathroomCleaning) total += getPackagePrice('bathroomCleaning');
    
    // Add-ons
    if (cartItems.bathroomDeepCleaning) total += getAddOnPrice('bathroomDeepCleaning');
    if (cartItems.normalDusting) total += getAddOnPrice('normalDusting');
    if (cartItems.deepDusting) total += getAddOnPrice('deepDusting');
    if (cartItems.utensilDrying) total += getAddOnPrice('utensilDrying');
    if (cartItems.clothesDrying) total += getAddOnPrice('clothesDrying');
    
    return total;
  };

  const countSelectedItems = () => {
    return Object.values(cartItems).filter(item => item).length;
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const selectedItems = Object.entries(cartItems)
        .filter(([_, selected]) => selected)
        .map(([name]) => name);

      if (selectedItems.length === 0) {
        Alert.alert('Error', 'Please add at least one item to cart');
        return;
      }

      const totalAmount = calculateTotal();
      const response = await axios.post(
        "https://utils-ndt3.onrender.com/create-order",
        { amount: totalAmount * 100 },
        { headers: { "Content-Type": "application/json" } }
      );

      Alert.alert("getting called ....")

      if (response.status === 200 && response.data.success) {
        const orderId = response.data.orderId;
        const amount = totalAmount * 100;
        const currency = "INR";

        if (typeof window.Razorpay === "undefined") {
          Alert.alert('Error', 'Razorpay SDK not loaded.');
          return;
        }

        bookingDetails.engagements = selectedItems.join(', ');
        bookingDetails.monthlyAmount = totalAmount;

        const options = {
          key: "rzp_test_lTdgjtSRlEwreA",
          amount,
          currency,
          name: "Serveaso",
          description: "Maid Service Booking",
          order_id: orderId,
          handler: async function (razorpayResponse: any) {
            Alert.alert('Success', `Payment successful! Payment ID: ${razorpayResponse.razorpay_payment_id}`);

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
                if (sendDataToParent) {
                  sendDataToParent(BOOKINGS);
                }
                handleClose();
              }
            } catch (error) {
              Alert.alert('Error', 'Booking saved but failed to update server.');
            }
          },
          theme: {
            color: "#3399cc",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.log("error => ", error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
             <TouchableOpacity onPress={handleClose} style={styles.backIcon}>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.dialogTitle}>MAID SERVICE PACKAGES</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'regular' && styles.activeTab]}
                onPress={() => handleTabChange('regular')}
              >
                <Text style={[styles.tabText, activeTab === 'regular' && styles.activeTabText]}>
                  Regular Services
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'premium' && styles.activeTab]}
                onPress={() => handleTabChange('premium')}
              >
                <Text style={[styles.tabText, activeTab === 'premium' && styles.activeTabText]}>
                  Premium Services
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.packagesContainer}>
              {/* Regular Utensil Cleaning */}
              <View style={[
                styles.packageCard, 
                cartItems.utensilCleaning && styles.selectedPackage,
                { borderLeftColor: '#3399cc' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Utensil Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#3399cc' }]}>4.7</Text>
                      <Text style={styles.reviewsText}>(1.2M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#3399cc' }]}>₹1,200</Text>
                    <Text style={styles.preparationTime}>Monthly service</Text>
                  </View>
                </View>
                
                <View style={styles.personsControl}>
                  <Text style={styles.personsLabel}>Persons:</Text>
                  <View style={styles.personsInput}>
                    <TouchableOpacity 
                      style={styles.decrementButton}
                      onPress={() => handlePersonChange('decrement')}
                    >
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.personsValue}>
                      {packageStates.utensilCleaning.persons}
                    </Text>
                    <TouchableOpacity 
                      style={styles.incrementButton}
                      onPress={() => handlePersonChange('increment')}
                    >
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.descriptionList}>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>All kind of daily utensil cleaning</Text>
                  </View>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>Party used type utensil cleaning</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    cartItems.utensilCleaning && styles.selectedCartButton
                  ]}
                  onPress={() => handleAddPackageToCart('utensilCleaning')}
                >
                  {cartItems.utensilCleaning ? (
                    <Icon name="remove-shopping-cart" size={20} color="white" />
                  ) : (
                    <Icon name="add-shopping-cart" size={20} color="#3399cc" />
                  )}
                  <Text style={[
                    styles.cartButtonText,
                    cartItems.utensilCleaning && styles.selectedCartButtonText
                  ]}>
                    {cartItems.utensilCleaning ? 'REMOVE FROM CART' : 'ADD TO CART'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Sweeping & Mopping */}
              <View style={[
                styles.packageCard, 
                cartItems.sweepingMopping && styles.selectedPackage,
                { borderLeftColor: '#3399cc' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Sweeping & Mopping</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#3399cc' }]}>4.8</Text>
                      <Text style={styles.reviewsText}>(1.5M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#3399cc' }]}>₹1,200</Text>
                    <Text style={styles.preparationTime}>Monthly service</Text>
                  </View>
                </View>
                
                <View style={styles.personsControl}>
                  <Text style={styles.personsLabel}>House Size:</Text>
                  <View style={styles.personsInput}>
                    <TouchableOpacity 
                      style={styles.decrementButton}
                      onPress={() => handleHouseSizeChange('decrement')}
                    >
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.personsValue}>
                      {packageStates.sweepingMopping.houseSize}
                    </Text>
                    <TouchableOpacity 
                      style={styles.incrementButton}
                      onPress={() => handleHouseSizeChange('increment')}
                    >
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.descriptionList}>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>Daily sweeping and mopping of 2 rooms, 1 Hall</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    cartItems.sweepingMopping && styles.selectedCartButton
                  ]}
                  onPress={() => handleAddPackageToCart('sweepingMopping')}
                >
                  {cartItems.sweepingMopping ? (
                    <Icon name="remove-shopping-cart" size={20} color="white" />
                  ) : (
                    <Icon name="add-shopping-cart" size={20} color="#3399cc" />
                  )}
                  <Text style={[
                    styles.cartButtonText,
                    cartItems.sweepingMopping && styles.selectedCartButtonText
                  ]}>
                    {cartItems.sweepingMopping ? 'REMOVE FROM CART' : 'ADD TO CART'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Bathroom Cleaning */}
              <View style={[
                styles.packageCard, 
                cartItems.bathroomCleaning && styles.selectedPackage,
                { borderLeftColor: '#3399cc' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Bathroom Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#3399cc' }]}>4.6</Text>
                      <Text style={styles.reviewsText}>(980K reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#3399cc' }]}>₹600</Text>
                    <Text style={styles.preparationTime}>Monthly service</Text>
                  </View>
                </View>
                
                <View style={styles.personsControl}>
                  <Text style={styles.personsLabel}>Bathrooms:</Text>
                  <View style={styles.personsInput}>
                    <TouchableOpacity 
                      style={styles.decrementButton}
                      onPress={() => handleBathroomChange('decrement')}
                    >
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.personsValue}>
                      {packageStates.bathroomCleaning.bathrooms}
                    </Text>
                    <TouchableOpacity 
                      style={styles.incrementButton}
                      onPress={() => handleBathroomChange('increment')}
                    >
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.descriptionList}>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>Weekly cleaning of bathrooms</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    cartItems.bathroomCleaning && styles.selectedCartButton
                  ]}
                  onPress={() => handleAddPackageToCart('bathroomCleaning')}
                >
                  {cartItems.bathroomCleaning ? (
                    <Icon name="remove-shopping-cart" size={20} color="white" />
                  ) : (
                    <Icon name="add-shopping-cart" size={20} color="#3399cc" />
                  )}
                  <Text style={[
                    styles.cartButtonText,
                    cartItems.bathroomCleaning && styles.selectedCartButtonText
                  ]}>
                    {cartItems.bathroomCleaning ? 'REMOVE FROM CART' : 'ADD TO CART'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Add-ons Section */}
              <View style={styles.addOnsContainer}>
                <Text style={styles.addOnsTitle}>Regular Add-on Services</Text>
                <View style={styles.addOnsGrid}>
                  {/* Bathroom Deep Cleaning */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.bathroomDeepCleaning && styles.selectedAddOn,
                    { borderLeftColor: '#3399cc' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Bathroom Deep Cleaning</Text>
                      <Text style={[styles.addOnPrice, { color: '#3399cc' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Weekly cleaning of bathrooms, all bathroom walls cleaned
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.bathroomDeepCleaning && styles.selectedAddOnButton
                      ]}
                      onPress={() => handleAddAddOnToCart('bathroomDeepCleaning')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.bathroomDeepCleaning && styles.selectedAddOnButtonText
                      ]}>
                        {cartItems.bathroomDeepCleaning ? 'REMOVE' : 'ADD TO CART'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Normal Dusting */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.normalDusting && styles.selectedAddOn,
                    { borderLeftColor: '#3399cc' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Normal Dusting</Text>
                      <Text style={[styles.addOnPrice, { color: '#3399cc' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Daily furniture dusting, doors, carpet, bed making
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.normalDusting && styles.selectedAddOnButton
                      ]}
                      onPress={() => handleAddAddOnToCart('normalDusting')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.normalDusting && styles.selectedAddOnButtonText
                      ]}>
                        {cartItems.normalDusting ? 'REMOVE' : 'ADD TO CART'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Deep Dusting */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.deepDusting && styles.selectedAddOn,
                    { borderLeftColor: '#3399cc' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Deep Dusting</Text>
                      <Text style={[styles.addOnPrice, { color: '#3399cc' }]}>+₹1,500</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Includes chemical agents cleaning: décor items, furniture
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.deepDusting && styles.selectedAddOnButton
                      ]}
                      onPress={() => handleAddAddOnToCart('deepDusting')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.deepDusting && styles.selectedAddOnButtonText
                      ]}>
                        {cartItems.deepDusting ? 'REMOVE' : 'ADD TO CART'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Utensil Drying */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.utensilDrying && styles.selectedAddOn,
                    { borderLeftColor: '#3399cc' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Utensil Drying</Text>
                      <Text style={[styles.addOnPrice, { color: '#3399cc' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will dry and make proper arrangements
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.utensilDrying && styles.selectedAddOnButton
                      ]}
                      onPress={() => handleAddAddOnToCart('utensilDrying')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.utensilDrying && styles.selectedAddOnButtonText
                      ]}>
                        {cartItems.utensilDrying ? 'REMOVE' : 'ADD TO CART'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Clothes Drying */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.clothesDrying && styles.selectedAddOn,
                    { borderLeftColor: '#3399cc' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Clothes Drying</Text>
                      <Text style={[styles.addOnPrice, { color: '#3399cc' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will get clothes from/to drying place
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.clothesDrying && styles.selectedAddOnButton
                      ]}
                      onPress={() => handleAddAddOnToCart('clothesDrying')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.clothesDrying && styles.selectedAddOnButtonText
                      ]}>
                        {cartItems.clothesDrying ? 'REMOVE' : 'ADD TO CART'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Footer with Checkout */}
          <View style={styles.footerContainer}>
             <View style={styles.voucherContainer}>
            <TextInput
              style={styles.voucherInput}
              placeholder="Enter voucher code"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.voucherButton}>
              <Text style={styles.voucherButtonText}>Apply Voucher</Text>
            </TouchableOpacity>
          </View>
          
            <View style={styles.totalContainer}>
              <Text style={styles.footerText}>
                Total for {countSelectedItems()} items
              </Text>
              <Text style={styles.footerPrice}>
                ₹{calculateTotal().toLocaleString('en-IN')}
              </Text>
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
                  countSelectedItems() === 0 && styles.disabledButton
                ]}
                onPress={handleCheckout}
                disabled={countSelectedItems() === 0}
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 15,
    maxHeight: '80%',
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
  backIcon: {
    padding: 5,
    marginRight: 10,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  closeIcon: {
    padding: 5,
  },
  scrollView: {
    paddingHorizontal: 10,
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
  addOnsContainer: {
    marginBottom: 20,
  },
  addOnsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  addOnsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addOnCard: {
    width: '48%',
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
  selectedAddOn: {
    borderColor: '#3399cc',
    borderWidth: 2,
  },
  addOnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addOnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  addOnPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addOnDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  addOnButton: {
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3399cc',
  },
  selectedAddOnButton: {
    backgroundColor: '#3399cc',
    borderColor: '#3399cc',
  },
  addOnButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3399cc',
  },
  selectedAddOnButtonText: {
    color: 'white',
  },
  footerContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
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
});

export default MaidServiceDialog;