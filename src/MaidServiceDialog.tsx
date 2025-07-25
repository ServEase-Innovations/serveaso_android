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
// import { useAuth0 } from "@auth0/auth0-react";
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
    utensilCleaning: {
      persons: 3,
      selected: false
    },
    sweepingMopping: {
      houseSize: '2BHK',
      selected: false
    },
    bathroomCleaning: {
      bathrooms: 2,
      selected: false
    }
  });
  
  const [addOns, setAddOns] = useState({
    bathroomDeepCleaning: false,
    normalDusting: false,
    deepDusting: false,
    utensilDrying: false,
    clothesDrying: false
  });
  
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const dispatch = useDispatch();

  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const users = useSelector((state: any) => state.user?.value);
  const currentLocation = users?.customerDetails?.currentLocation;
  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;
  const pricing = useSelector((state: any) => state.pricing?.groupedServices);
  const maidServices = pricing?.maid?.filter((service: any) => service.Type === "Regular" || service.Type === "Regular Add-on") || [];
  // const { user, loginWithRedirect, isAuthenticated } = useAuth0();

  const getBookingTypeFromPreference = (bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY'; // default
    
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  };

  const bookingDetails: BookingDetails = {
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
    bookingType: getBookingTypeFromPreference(bookingType?.bookingPreference),
    taskStatus: "NOT_STARTED", 
    responsibilities: [],
    serviceType: "MAID",
  };

  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     console.log("User Info:", user);
  //     console.log("Name:", user.name);
  //     console.log("Customer ID:", user.customerid);
  //   }
  // }, [isAuthenticated, user]);

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

  const handleLogin = () => {
    setLoginOpen(true);
  };

  const handleLoginClose = () => {
    setLoginOpen(false);
  };

  const handleBookingPage = () => {
    setLoginOpen(false);
  };

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

  const handlePackageSelect = (packageName: string) => {
    setPackageStates(prev => ({
      ...prev,
      [packageName]: {
        ...prev[packageName],
        selected: !prev[packageName].selected
      }
    }));
  };

  const handleAddOnSelect = (addOnName: string) => {
    setAddOns(prev => ({
      ...prev,
      [addOnName]: !prev[addOnName]
    }));
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

  const calculateTotal = () => {
    let total = 0;
    
    if (packageStates.utensilCleaning.selected) total += 1200;
    if (packageStates.sweepingMopping.selected) total += 1200;
    if (packageStates.bathroomCleaning.selected) total += 600;
    
    if (addOns.bathroomDeepCleaning) total += 1000;
    if (addOns.normalDusting) total += 1000;
    if (addOns.deepDusting) total += 1500;
    if (addOns.utensilDrying) total += 1000;
    if (addOns.clothesDrying) total += 1000;
    
    return total;
  };

  const countSelectedServices = () => {
    let count = 0;
    if (packageStates.utensilCleaning.selected) count++;
    if (packageStates.sweepingMopping.selected) count++;
    if (packageStates.bathroomCleaning.selected) count++;
    return count;
  };

  const countSelectedAddOns = () => {
    return Object.values(addOns).filter(Boolean).length;
  };

  const hasSelectedServices = () => {
    return countSelectedServices() > 0 || countSelectedAddOns() > 0;
  };

  const handleCheckout = async () => {
    try {
      const selectedServices: string[] = [];
      const selectedAddOns: string[] = Object.entries(addOns)
        .filter(([_, selected]) => selected)
        .map(([name]) => name);

      if (packageStates.utensilCleaning.selected) {
        selectedServices.push(`Utensil cleaning for ${packageStates.utensilCleaning.persons} persons`);
      }
      if (packageStates.sweepingMopping.selected) {
        selectedServices.push(`Sweeping & mopping for ${packageStates.sweepingMopping.houseSize}`);
      }
      if (packageStates.bathroomCleaning.selected) {
        selectedServices.push(`Bathroom cleaning for ${packageStates.bathroomCleaning.bathrooms} bathrooms`);
      }

      if (selectedServices.length === 0 && selectedAddOns.length === 0) {
        Alert.alert('Error', 'Please select at least one service or add-on');
        return;
      }

      // const customerName = user?.name || "Guest";
      // const customerId = user?.customerid || "guest-id";
      const totalAmount = calculateTotal();
      const response = await axios.post(
        "https://utils-ndt3.onrender.com/create-order",
        { amount: totalAmount * 100 },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200 && response.data.success) {
        const orderId = response.data.orderId;
        const amount = totalAmount * 100;
        const currency = "INR";

        if (typeof window.Razorpay === "undefined") {
          Alert.alert('Error', 'Razorpay SDK not loaded.');
          return;
        }

        bookingDetails.serviceProviderId = providerDetails?.serviceproviderId 
          ? Number(providerDetails.serviceproviderId) 
          : null;
        bookingDetails.serviceProviderName = providerFullName;
        // bookingDetails.customerId = customerId;
        // bookingDetails.customerName = customerName;
        bookingDetails.address = currentLocation;
        bookingDetails.startDate = bookingType?.startDate || new Date().toISOString().split('T')[0];
        bookingDetails.endDate = bookingType?.endDate || "";
        bookingDetails.engagements = [
          ...selectedServices,
          ...(selectedAddOns.length > 0 ? [`Add-ons: ${selectedAddOns.join(', ')}`] : [])
        ].join('; ');
        bookingDetails.monthlyAmount = totalAmount;
        bookingDetails.timeslot = bookingType.timeRange;

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
                try {
                  const notifyResponse = await fetch("http://localhost:4000/send-notification", {
                    method: "POST",
                    body: JSON.stringify({
                      title: "Booking Confirmed",
                      body: `Thank you, ${customerName}! Your booking has been confirmed.`,
                      url: "http://localhost:3000",
                    }),
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });

                  if (notifyResponse.ok) {
                    console.log("Notification sent!");
                    Alert.alert('Success', 'Notification sent!');
                  } else {
                    Alert.alert('Error', 'Failed to send notification');
                  }
                } catch (notifyError) {
                  Alert.alert('Error', 'Error sending notification');
                }

                if (sendDataToParent) {
                  sendDataToParent(BOOKINGS);
                }
                handleClose();
              }
            } catch (error) {
              Alert.alert('Error', 'Booking saved but failed to update server.');
            }
          },
          // prefill: {
          //   name: customerName || "",
          //   email: user?.email || "",
          //   contact: user?.mobileNo || "",
          // },
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
          <ScrollView style={styles.scrollView}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>MAID SERVICE PACKAGES</Text>
            </View>
            
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
                packageStates.utensilCleaning.selected && styles.selectedPackage,
                { borderLeftColor: '#e17055' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Utensil Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#e17055' }]}>4.7</Text>
                      <Text style={styles.reviewsText}>(1.2M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#e17055' }]}>₹1,200</Text>
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

                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      packageStates.utensilCleaning.selected && { backgroundColor: '#e17055' }
                    ]}
                    onPress={() => handlePackageSelect('utensilCleaning')}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      packageStates.utensilCleaning.selected && { color: 'white' }
                    ]}>
                      {packageStates.utensilCleaning.selected ? 'SELECTED' : 'SELECT SERVICE'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cartButton,
                      cartItems.utensilCleaning && { backgroundColor: '#e17055' }
                    ]}
                    onPress={() => handleAddPackageToCart('utensilCleaning')}
                  >
                    {cartItems.utensilCleaning ? (
                      <Icon name="remove-shopping-cart" size={20} color="white" />
                    ) : (
                      <Icon name="add-shopping-cart" size={20} color="#e17055" />
                    )}
                    <Text style={[
                      styles.cartButtonText,
                      cartItems.utensilCleaning && { color: 'white' }
                    ]}>
                      {cartItems.utensilCleaning ? 'ADDED TO CART' : 'ADD TO CART'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Sweeping & Mopping */}
              <View style={[
                styles.packageCard, 
                packageStates.sweepingMopping.selected && styles.selectedPackage,
                { borderLeftColor: '#00b894' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Sweeping & Mopping</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#00b894' }]}>4.8</Text>
                      <Text style={styles.reviewsText}>(1.5M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#00b894' }]}>₹1,200</Text>
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

                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      packageStates.sweepingMopping.selected && { backgroundColor: '#00b894' }
                    ]}
                    onPress={() => handlePackageSelect('sweepingMopping')}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      packageStates.sweepingMopping.selected && { color: 'white' }
                    ]}>
                      {packageStates.sweepingMopping.selected ? 'SELECTED' : 'SELECT SERVICE'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cartButton,
                      cartItems.sweepingMopping && { backgroundColor: '#00b894' }
                    ]}
                    onPress={() => handleAddPackageToCart('sweepingMopping')}
                  >
                    {cartItems.sweepingMopping ? (
                      <Icon name="remove-shopping-cart" size={20} color="white" />
                    ) : (
                      <Icon name="add-shopping-cart" size={20} color="#00b894" />
                    )}
                    <Text style={[
                      styles.cartButtonText,
                      cartItems.sweepingMopping && { color: 'white' }
                    ]}>
                      {cartItems.sweepingMopping ? 'ADDED TO CART' : 'ADD TO CART'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Bathroom Cleaning */}
              <View style={[
                styles.packageCard, 
                packageStates.bathroomCleaning.selected && styles.selectedPackage,
                { borderLeftColor: '#0984e3' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Bathroom Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#0984e3' }]}>4.6</Text>
                      <Text style={styles.reviewsText}>(980K reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#0984e3' }]}>₹600</Text>
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

                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      packageStates.bathroomCleaning.selected && { backgroundColor: '#0984e3' }
                    ]}
                    onPress={() => handlePackageSelect('bathroomCleaning')}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      packageStates.bathroomCleaning.selected && { color: 'white' }
                    ]}>
                      {packageStates.bathroomCleaning.selected ? 'SELECTED' : 'SELECT SERVICE'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cartButton,
                      cartItems.bathroomCleaning && { backgroundColor: '#0984e3' }
                    ]}
                    onPress={() => handleAddPackageToCart('bathroomCleaning')}
                  >
                    {cartItems.bathroomCleaning ? (
                      <Icon name="remove-shopping-cart" size={20} color="white" />
                    ) : (
                      <Icon name="add-shopping-cart" size={20} color="#0984e3" />
                    )}
                    <Text style={[
                      styles.cartButtonText,
                      cartItems.bathroomCleaning && { color: 'white' }
                    ]}>
                      {cartItems.bathroomCleaning ? 'ADDED TO CART' : 'ADD TO CART'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Add-ons Section */}
              <View style={styles.addOnsContainer}>
                <Text style={styles.addOnsTitle}>Regular Add-on Services</Text>
                <View style={styles.addOnsGrid}>
                  {/* Bathroom Deep Cleaning */}
                  <View style={[
                    styles.addOnCard, 
                    addOns.bathroomDeepCleaning && styles.selectedAddOn,
                    { borderLeftColor: '#00b894' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Bathroom Deep Cleaning</Text>
                      <Text style={[styles.addOnPrice, { color: '#00b894' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Weekly cleaning of bathrooms, all bathroom walls cleaned
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.bathroomDeepCleaning && { backgroundColor: '#00b894' }
                      ]}
                      onPress={() => handleAddOnSelect('bathroomDeepCleaning')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        addOns.bathroomDeepCleaning && { color: 'white' }
                      ]}>
                        {addOns.bathroomDeepCleaning ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Normal Dusting */}
                  <View style={[
                    styles.addOnCard, 
                    addOns.normalDusting && styles.selectedAddOn,
                    { borderLeftColor: '#0984e3' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Normal Dusting</Text>
                      <Text style={[styles.addOnPrice, { color: '#0984e3' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Daily furniture dusting, doors, carpet, bed making
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.normalDusting && { backgroundColor: '#0984e3' }
                      ]}
                      onPress={() => handleAddOnSelect('normalDusting')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        addOns.normalDusting && { color: 'white' }
                      ]}>
                        {addOns.normalDusting ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Deep Dusting */}
                  <View style={[
                    styles.addOnCard, 
                    addOns.deepDusting && styles.selectedAddOn,
                    { borderLeftColor: '#e17055' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Deep Dusting</Text>
                      <Text style={[styles.addOnPrice, { color: '#e17055' }]}>+₹1,500</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Includes chemical agents cleaning: décor items, furniture
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.deepDusting && { backgroundColor: '#e17055' }
                      ]}
                      onPress={() => handleAddOnSelect('deepDusting')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        addOns.deepDusting && { color: 'white' }
                      ]}>
                        {addOns.deepDusting ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Utensil Drying */}
                  <View style={[
                    styles.addOnCard, 
                    addOns.utensilDrying && styles.selectedAddOn,
                    { borderLeftColor: '#00b894' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Utensil Drying</Text>
                      <Text style={[styles.addOnPrice, { color: '#00b894' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will dry and make proper arrangements
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.utensilDrying && { backgroundColor: '#00b894' }
                      ]}
                      onPress={() => handleAddOnSelect('utensilDrying')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        addOns.utensilDrying && { color: 'white' }
                      ]}>
                        {addOns.utensilDrying ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Clothes Drying */}
                  <View style={[
                    styles.addOnCard, 
                    addOns.clothesDrying && styles.selectedAddOn,
                    { borderLeftColor: '#0984e3' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Clothes Drying</Text>
                      <Text style={[styles.addOnPrice, { color: '#0984e3' }]}>+₹1,000</Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will get clothes from/to drying place
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.clothesDrying && { backgroundColor: '#0984e3' }
                      ]}
                      onPress={() => handleAddOnSelect('clothesDrying')}
                    >
                      <Text style={[
                        styles.addOnButtonText,
                        addOns.clothesDrying && { color: 'white' }
                      ]}>
                        {addOns.clothesDrying ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Voucher Section */}
              <View style={styles.voucherContainer}>
                <Text style={styles.voucherTitle}>Apply Voucher</Text>
                <View style={styles.voucherInputContainer}>
                  <TextInput
                    style={styles.voucherInput}
                    placeholder="Enter voucher code"
                  />
                  <TouchableOpacity style={styles.voucherButton}>
                    <Text style={styles.voucherButtonText}>APPLY</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Footer with Checkout */}
          <View style={styles.footerContainer}>
            <View>
              <Text style={styles.footerText}>
                Total for {countSelectedServices()} services ({countSelectedAddOns()} add-ons)
              </Text>
              <Text style={styles.footerPrice}>
                ₹{calculateTotal().toLocaleString('en-IN')}
              </Text>
            </View>
            
            {/* <View style={styles.footerButtons}>
              {!isAuthenticated && (
                <>
                  <Icon name="info" size={20} color="#666" style={{ marginRight: 8 }} />
                  <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => loginWithRedirect()}
                  >
                    <Text style={styles.loginButtonText}>LOGIN TO CONTINUE</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {isAuthenticated && (
                <TouchableOpacity
                  style={[
                    styles.checkoutButton,
                    calculateTotal() === 0 && styles.disabledButton
                  ]}
                  onPress={handleCheckout}
                  disabled={calculateTotal() === 0}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                  )}
                </TouchableOpacity>
              )}
            </View> */}
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
  scrollView: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  dialogHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  cartButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
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
  },
  addOnButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  voucherContainer: {
    marginBottom: 20,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  voucherInputContainer: {
    flexDirection: 'row',
  },
  voucherInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
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
    color: 'white',
    fontWeight: 'bold',
  },
  footerContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
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
    marginBottom: 15,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  checkoutButton: {
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MaidServiceDialog;