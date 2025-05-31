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
  Platform,
} from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { BookingDetails } from './types/engagementRequest';
import { BOOKINGS } from './Constants/pagesConstants';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';
import axiosInstance from './axiosInstance';
import Icon from 'react-native-vector-icons/MaterialIcons'; 

interface MaidServiceDialogProps {
  visible: boolean;
  onClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
}

type PackageStates = {
  utensilCleaning: {
    persons: number;
    selected: boolean;
  };
  sweepingMopping: {
    houseSize: string;
    selected: boolean;
  };
  bathroomCleaning: {
    bathrooms: number;
    selected: boolean;
  };
};

type AddOns = {
  bathroomDeepCleaning: boolean;
  normalDusting: boolean;
  deepDusting: boolean;
  utensilDrying: boolean;
  clothesDrying: boolean;
};

const MaidServiceDialog: React.FC<MaidServiceDialogProps> = ({
  visible,
  onClose,
  providerDetails,
  sendDataToParent,
}) => {
  
  const [activeTab, setActiveTab] = useState('regular');
 const [packageStates, setPackageStates] = useState<PackageStates>({
    utensilCleaning: {
      persons: 3,
      selected: false,
    },
    sweepingMopping: {
      houseSize: '2BHK',
      selected: false,
    },
    bathroomCleaning: {
      bathrooms: 2,
      selected: false,
    },
  });

  const [addOns, setAddOns] = useState<AddOns>({
    bathroomDeepCleaning: false,
    normalDusting: false,
    deepDusting: false,
    utensilDrying: false,
    clothesDrying: false,
  });

  const [loginVisible, setLoginVisible] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const user = useSelector((state: any) => state.user?.value);
  const dispatch = useDispatch();
  const customerId = user?.customerDetails?.customerId || null;
  const currentLocation = user?.customerDetails?.currentLocation;
  const firstName = user?.customerDetails?.firstName;
  const lastName = user?.customerDetails?.lastName;
  const customerName = `${firstName} ${lastName}`;
  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;

  const bookingDetails: BookingDetails = {
    serviceProviderId: 0,
    serviceProviderName: '',
    customerId: 0,
    customerName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    engagements: '',
    address: '',
    timeslot: '',
    monthlyAmount: 0,
    paymentMode: 'UPI',
    bookingType: 'MAID_SERVICE',
    taskStatus: 'NOT_STARTED',
    responsibilities: [],
  };

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [user]);

  const handleLogin = () => {
    setLoginVisible(true);
  };

  const handleLoginClose = () => {
    setLoginVisible(false);
  };

  const handleBookingPage = () => {
    setLoginVisible(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handlePersonChange = (operation: string) => {
    setPackageStates((prev) => ({
      ...prev,
      utensilCleaning: {
        ...prev.utensilCleaning,
        persons:
          operation === 'increment'
            ? Math.min(prev.utensilCleaning.persons + 1, 10)
            : Math.max(prev.utensilCleaning.persons - 1, 1),
      },
    }));
  };

  const handleHouseSizeChange = (operation: string) => {
    const sizes = ['1BHK', '2BHK', '3BHK', '4BHK+'];
    const currentIndex = sizes.indexOf(packageStates.sweepingMopping.houseSize);

    setPackageStates((prev) => ({
      ...prev,
      sweepingMopping: {
        ...prev.sweepingMopping,
        houseSize:
          operation === 'increment'
            ? sizes[Math.min(currentIndex + 1, sizes.length - 1)]
            : sizes[Math.max(currentIndex - 1, 0)],
      },
    }));
  };

  const handleBathroomChange = (operation: string) => {
    setPackageStates((prev) => ({
      ...prev,
      bathroomCleaning: {
        ...prev.bathroomCleaning,
        bathrooms:
          operation === 'increment'
            ? Math.min(prev.bathroomCleaning.bathrooms + 1, 5)
            : Math.max(prev.bathroomCleaning.bathrooms - 1, 1),
      },
    }));
  };

   const handlePackageSelect = (packageName: keyof PackageStates) => {
    setPackageStates((prev) => ({
      ...prev,
      [packageName]: {
        ...prev[packageName],
        selected: !prev[packageName].selected,
      },
    }));
  };

  const handleAddOnSelect = (addOnName: keyof AddOns) => {
    setAddOns((prev) => ({
      ...prev,
      [addOnName]: !prev[addOnName],
    }));
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
      // Prepare selected services data
      const selectedServices: string[] = [];
      const selectedAddOns: string[] = Object.entries(addOns)
        .filter(([_, selected]) => selected)
        .map(([name]) => name);

      if (packageStates.utensilCleaning.selected) {
        selectedServices.push(
          `Utensil cleaning for ${packageStates.utensilCleaning.persons} persons`
        );
      }
      if (packageStates.sweepingMopping.selected) {
        selectedServices.push(
          `Sweeping & mopping for ${packageStates.sweepingMopping.houseSize}`
        );
      }
      if (packageStates.bathroomCleaning.selected) {
        selectedServices.push(
          `Bathroom cleaning for ${packageStates.bathroomCleaning.bathrooms} bathrooms`
        );
      }

      if (selectedServices.length === 0 && selectedAddOns.length === 0) {
        Alert.alert('Please select at least one service or add-on');
        return;
      }

      const totalAmount = calculateTotal();

      // Create Razorpay order
      const response = await axios.post(
        'http://13.201.229.41:3000/create-order',
        { amount: totalAmount * 100 }, // Convert to paise
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200 && response.data.success) {
        const orderId = response.data.orderId;
        const amount = totalAmount * 100;
        const currency = 'INR';

        // Set up booking details
        bookingDetails.serviceProviderId = providerDetails?.serviceproviderId
          ? Number(providerDetails.serviceproviderId)
          : null;
        bookingDetails.serviceProviderName = providerFullName;
        bookingDetails.customerId = customerId;
        bookingDetails.customerName = customerName;
        bookingDetails.address = currentLocation;
        bookingDetails.startDate =
          bookingType?.startDate || new Date().toISOString().split('T')[0];
        bookingDetails.endDate = bookingType?.endDate || '';

        bookingDetails.engagements = [
          ...selectedServices,
          ...(selectedAddOns.length > 0
            ? [`Add-ons: ${selectedAddOns.join(', ')}`]
            : []),
        ].join('; ');

        bookingDetails.monthlyAmount = totalAmount;
        bookingDetails.timeslot = bookingType.timeRange;

        // In React Native, you would integrate with Razorpay's React Native SDK
        // Here's a simplified version - you'll need to implement the actual integration
        Alert.alert(
          'Payment Successful',
          `Total amount: ₹${totalAmount}`,
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  // Save booking details to backend using axiosInstance
                  const bookingResponse = await axiosInstance.post(
                    '/api/serviceproviders/engagement/add',
                    bookingDetails,
                    {
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    }
                  );

                  if (bookingResponse.status === 201) {
                    if (sendDataToParent) {
                      sendDataToParent(BOOKINGS);
                    }
                    onClose();
                  }
                } catch (error) {
                  console.error('Error saving booking:', error);
                  Alert.alert(
                    'Error',
                    'Booking saved but failed to update server. Please contact support.'
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.log('error => ', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        onRequestClose={onClose}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>MAID SERVICE PACKAGES</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'regular' && styles.activeTab,
              ]}
              onPress={() => handleTabChange('regular')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'regular' && styles.activeTabText,
                ]}
              >
                Regular Services
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'premium' && styles.activeTab,
              ]}
              onPress={() => handleTabChange('premium')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'premium' && styles.activeTabText,
                ]}
              >
                Premium Services
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer}>
            {/* Package Sections */}
            <View style={styles.contentContainer}>
              {/* Regular Utensil Cleaning */}
              <View
                style={[
                  styles.packageContainer,
                  packageStates.utensilCleaning.selected &&
                    styles.selectedPackage1,
                ]}
              >
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Utensil Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingText}>4.7</Text>
                      <Text style={styles.reviewText}>(1.2M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>₹1,200</Text>
                    <Text style={styles.priceSubText}>Monthly service</Text>
                  </View>
                </View>

                {/* Person Selector */}
                <View style={styles.selectorContainer}>
                  <Text style={styles.selectorLabel}>Persons:</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handlePersonChange('decrement')}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>
                      {packageStates.utensilCleaning.persons}
                    </Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handlePersonChange('increment')}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.featureText}>
                      All kind of daily utensil cleaning
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.featureText}>
                      Party used type utensil cleaning
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    packageStates.utensilCleaning.selected &&
                      styles.selectedButton1,
                  ]}
                  onPress={() => handlePackageSelect('utensilCleaning')}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      packageStates.utensilCleaning.selected &&
                        styles.selectedButtonText,
                    ]}
                  >
                    {packageStates.utensilCleaning.selected
                      ? 'SELECTED'
                      : 'SELECT SERVICE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sweeping & Mopping */}
              <View
                style={[
                  styles.packageContainer,
                  packageStates.sweepingMopping.selected &&
                    styles.selectedPackage2,
                ]}
              >
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Sweeping & Mopping</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingText, styles.ratingText2]}>
                        4.8
                      </Text>
                      <Text style={styles.reviewText}>(1.5M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceText, styles.priceText2]}>
                      ₹1,200
                    </Text>
                    <Text style={styles.priceSubText}>Monthly service</Text>
                  </View>
                </View>

                {/* House Size Selector */}
                <View style={styles.selectorContainer}>
                  <Text style={styles.selectorLabel}>House Size:</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handleHouseSizeChange('decrement')}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>
                      {packageStates.sweepingMopping.houseSize}
                    </Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handleHouseSizeChange('increment')}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.featureText}>
                      Daily sweeping and mopping of 2 rooms, 1 Hall
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    packageStates.sweepingMopping.selected &&
                      styles.selectedButton2,
                  ]}
                  onPress={() => handlePackageSelect('sweepingMopping')}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      packageStates.sweepingMopping.selected &&
                        styles.selectedButtonText,
                    ]}
                  >
                    {packageStates.sweepingMopping.selected
                      ? 'SELECTED'
                      : 'SELECT SERVICE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bathroom Cleaning */}
              <View
                style={[
                  styles.packageContainer,
                  packageStates.bathroomCleaning.selected &&
                    styles.selectedPackage3,
                ]}
              >
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Bathroom Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingText, styles.ratingText3]}>
                        4.6
                      </Text>
                      <Text style={styles.reviewText}>(980K reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceText, styles.priceText3]}>
                      ₹600
                    </Text>
                    <Text style={styles.priceSubText}>Monthly service</Text>
                  </View>
                </View>

                {/* Bathroom Number Selector */}
                <View style={styles.selectorContainer}>
                  <Text style={styles.selectorLabel}>Bathrooms:</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handleBathroomChange('decrement')}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>
                      {packageStates.bathroomCleaning.bathrooms}
                    </Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => handleBathroomChange('increment')}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.featureText}>
                      Weekly cleaning of bathrooms
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    packageStates.bathroomCleaning.selected &&
                      styles.selectedButton3,
                  ]}
                  onPress={() => handlePackageSelect('bathroomCleaning')}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      packageStates.bathroomCleaning.selected &&
                        styles.selectedButtonText,
                    ]}
                  >
                    {packageStates.bathroomCleaning.selected
                      ? 'SELECTED'
                      : 'SELECT SERVICE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add-ons Section */}
              <View style={styles.addOnsContainer}>
                <Text style={styles.addOnsTitle}>Regular Add-on Services</Text>

                <View style={styles.addOnsGrid}>
                  {/* Bathroom Deep Cleaning */}
                  <View
                    style={[
                      styles.addOnItem,
                      addOns.bathroomDeepCleaning && styles.selectedAddOn2,
                    ]}
                  >
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnName}>Bathroom Deep Cleaning</Text>
                      <Text style={[styles.addOnPrice, styles.addOnPrice2]}>
                        +₹1,000
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Weekly cleaning of bathrooms, all bathroom walls cleaned
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.bathroomDeepCleaning && styles.selectedAddOnButton2,
                      ]}
                      onPress={() => handleAddOnSelect('bathroomDeepCleaning')}
                    >
                      <Text
                        style={[
                          styles.addOnButtonText,
                          addOns.bathroomDeepCleaning && styles.selectedAddOnButtonText,
                        ]}
                      >
                        {addOns.bathroomDeepCleaning ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Normal Dusting */}
                  <View
                    style={[
                      styles.addOnItem,
                      addOns.normalDusting && styles.selectedAddOn3,
                    ]}
                  >
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnName}>Normal Dusting</Text>
                      <Text style={[styles.addOnPrice, styles.addOnPrice3]}>
                        +₹1,000
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Daily furniture dusting, doors, carpet, bed making
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.normalDusting && styles.selectedAddOnButton3,
                      ]}
                      onPress={() => handleAddOnSelect('normalDusting')}
                    >
                      <Text
                        style={[
                          styles.addOnButtonText,
                          addOns.normalDusting && styles.selectedAddOnButtonText,
                        ]}
                      >
                        {addOns.normalDusting ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Deep Dusting */}
                  <View
                    style={[
                      styles.addOnItem,
                      addOns.deepDusting && styles.selectedAddOn1,
                    ]}
                  >
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnName}>Deep Dusting</Text>
                      <Text style={[styles.addOnPrice, styles.addOnPrice1]}>
                        +₹1,500
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Includes chemical agents cleaning: décor items, furniture
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.deepDusting && styles.selectedAddOnButton1,
                      ]}
                      onPress={() => handleAddOnSelect('deepDusting')}
                    >
                      <Text
                        style={[
                          styles.addOnButtonText,
                          addOns.deepDusting && styles.selectedAddOnButtonText,
                        ]}
                      >
                        {addOns.deepDusting ? 'ADDED' : 'Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Utensil Drying */}
                  <View
                    style={[
                      styles.addOnItem,
                      addOns.utensilDrying && styles.selectedAddOn2,
                    ]}
                  >
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnName}>Utensil Drying</Text>
                      <Text style={[styles.addOnPrice, styles.addOnPrice2]}>
                        +₹1,000
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will dry and make proper arrangements
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.utensilDrying && styles.selectedAddOnButton2,
                      ]}
                      onPress={() => handleAddOnSelect('utensilDrying')}
                    >
                      <Text
                        style={[
                          styles.addOnButtonText,
                          addOns.utensilDrying && styles.selectedAddOnButtonText,
                        ]}
                      >
                        {addOns.utensilDrying ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Clothes Drying */}
                  <View
                    style={[
                      styles.addOnItem,
                      addOns.clothesDrying && styles.selectedAddOn3,
                    ]}
                  >
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnName}>Clothes Drying</Text>
                      <Text style={[styles.addOnPrice, styles.addOnPrice3]}>
                        +₹1,000
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will get clothes from/to drying place
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        addOns.clothesDrying && styles.selectedAddOnButton3,
                      ]}
                      onPress={() => handleAddOnSelect('clothesDrying')}
                    >
                      <Text
                        style={[
                          styles.addOnButtonText,
                          addOns.clothesDrying && styles.selectedAddOnButtonText,
                        ]}
                      >
                        {addOns.clothesDrying ? 'ADDED' : '+ Add This Service'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Voucher Section */}
          <View style={styles.voucherContainer}>
            <Text style={styles.voucherTitle}>Apply Voucher</Text>
            <View style={styles.voucherInputContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                placeholderTextColor="#636e72"
              />
              <TouchableOpacity style={styles.voucherButton}>
                <Text style={styles.voucherButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer with Checkout */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.totalText}>
                Total for {countSelectedServices()} services (
                {countSelectedAddOns()} add-ons)
              </Text>
              <Text style={styles.totalAmount}>
                ₹{calculateTotal().toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.checkoutContainer}>
              {!loggedInUser && (
          <>
            <TouchableOpacity style={styles.infoButton}>
              <Icon name="info-outline" size={20} color="#636e72" />
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
                  style={[
                    styles.checkoutButton,
                    !hasSelectedServices() && styles.disabledCheckoutButton,
                  ]}
                  onPress={handleCheckout}
                  disabled={!hasSelectedServices()}
                >
                  <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Login Modal */}
      <Modal
        visible={loginVisible}
        onRequestClose={handleLoginClose}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Login Screen</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleLoginClose}
          >
            <Icon name="close" size={20} color="#fff" />
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerText: {
    color: '#2d3436',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#e17055',
  },
  tabText: {
    fontWeight: 'bold',
    color: '#636e72',
  },
  activeTabText: {
    color: '#2d3436',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  packageContainer: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  selectedPackage1: {
    borderColor: '#e17055',
  },
  selectedPackage2: {
    borderColor: '#00b894',
  },
  selectedPackage3: {
    borderColor: '#0984e3',
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
    color: '#e17055',
    fontWeight: 'bold',
  },
  ratingText2: {
    color: '#00b894',
  },
  ratingText3: {
    color: '#0984e3',
  },
  reviewText: {
    color: '#636e72',
    fontSize: 14,
    marginLeft: 5,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontWeight: 'bold',
    color: '#e17055',
    fontSize: 18,
  },
  priceText2: {
    color: '#00b894',
  },
  priceText3: {
    color: '#0984e3',
  },
  priceSubText: {
    color: '#636e72',
    fontSize: 14,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  selectorLabel: {
    marginRight: 15,
    color: '#2d3436',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 20,
  },
  counterButton: {
    padding: 5,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#dfe6e9',
    width: 40,
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 16,
  },
  counterValue: {
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
  bullet: {
    marginRight: 10,
    color: '#2d3436',
  },
  featureText: {
    flex: 1,
  },
  selectButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e17055',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedButton1: {
    backgroundColor: '#e17055',
  },
  selectedButton2: {
    backgroundColor: '#00b894',
    borderColor: '#00b894',
  },
  selectedButton3: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  selectButtonText: {
    fontWeight: 'bold',
    color: '#e17055',
  },
  selectedButtonText: {
    color: '#fff',
  },
  addOnsContainer: {
    marginBottom: 20,
  },
  addOnsTitle: {
    color: '#2d3436',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  addOnsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addOnItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedAddOn1: {
    borderColor: '#e17055',
  },
  selectedAddOn2: {
    borderColor: '#00b894',
  },
  selectedAddOn3: {
    borderColor: '#0984e3',
  },
  addOnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addOnName: {
    color: '#2d3436',
    fontWeight: '600',
    flex: 1,
  },
  addOnPrice: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  addOnPrice1: {
    color: '#e17055',
  },
  addOnPrice2: {
    color: '#00b894',
  },
  addOnPrice3: {
    color: '#0984e3',
  },
  addOnDescription: {
    color: '#636e72',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  addOnButton: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(228, 245, 241, 0.2)',
    borderWidth: 2,
    borderColor: '#00b894',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAddOnButton1: {
    backgroundColor: '#e17055',
    borderColor: '#e17055',
  },
  selectedAddOnButton2: {
    backgroundColor: '#00b894',
    borderColor: '#00b894',
  },
  selectedAddOnButton3: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  addOnButtonText: {
    fontWeight: '600',
    color: '#00b894',
    fontSize: 14,
  },
  selectedAddOnButtonText: {
    color: '#fff',
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
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
  voucherButton: {
    padding: 10,
    backgroundColor: '#27ae60',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
      },
  totalText: {
    color: '#636e72',
    fontSize: 14,
  },
  totalAmount: {
    color: '#2d3436',
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
   infoButton: {
    marginRight: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dfe6e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    color: '#636e72',
    fontWeight: 'bold',
  },
  loginButton: {
    padding: 15,
    backgroundColor: '#e17055',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkoutButton: {
    padding: 15,
    backgroundColor: '#e17055',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCheckoutButton: {
    backgroundColor: '#dfe6e9',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
   closeButton: {
    padding: 15,
    backgroundColor: '#e17055',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default MaidServiceDialog;
