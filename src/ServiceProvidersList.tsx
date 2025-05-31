import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';
import { useDispatch, useSelector } from 'react-redux';
import { BookingDetails } from './types/engagementRequest';
import { BOOKINGS } from './Constants/pagesConstants';
import Login from './Login';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from './axiosInstance';

interface CookServicesDialogProps {
visible: boolean;        // Changed from 'open' to 'visible'
  onClose: () => void;     // Changed from 'handleClose' to 'onClose'
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
}

interface MealPackage {
  selected: boolean;
  persons: number;
  basePrice: number;
  calculatedPrice: number;
  maxPersons: number;
  description: string[];
  preparationTime: string;
  rating: number;
  reviews: string;
  category: string;
  jobDescription: string;
  remarks: string;
}

interface PackagesState {
  [key: string]: MealPackage;
}

const CookServicesDialog: React.FC<CookServicesDialogProps> = ({
  open,
  handleClose,
   visible,        // Changed from open
  onClose,
  providerDetails,
  sendDataToParent,
  
}) => {
  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const user = useSelector((state: any) => state.user?.value);
  const pricing = useSelector((state: any) => state.pricing?.groupedServices);
  const cookServices = pricing?.cook?.filter((service: any) => service.Type === 'Regular') || [];

  const [packages, setPackages] = useState<PackagesState>({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
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
    bookingType: 'MEAL_PACKAGE',
    taskStatus: 'NOT_STARTED',
    responsibilities: [],
  };

  const calculatePriceForPersons = (basePrice: number, persons: number): number => {
    if (persons <= 3) {
      return basePrice;
    } else if (persons > 3 && persons <= 6) {
      const extraPeople = persons - 3;
      return basePrice + basePrice * 0.2 * extraPeople;
    } else if (persons > 6 && persons <= 9) {
      const priceFor6 = basePrice + basePrice * 0.2 * 3;
      const extraPeople = persons - 6;
      return priceFor6 + priceFor6 * 0.1 * extraPeople;
    } else if (persons > 9) {
      const priceFor6 = basePrice + basePrice * 0.2 * 3;
      const priceFor9 = priceFor6 + priceFor6 * 0.1 * 3;
      const extraPeople = persons - 9;
      return priceFor9 + priceFor9 * 0.05 * extraPeople;
    }
    return basePrice;
  };

  useEffect(() => {
    if (cookServices.length > 0 && Object.keys(packages).length === 0) {
      const initialPackages: PackagesState = {};

      cookServices.forEach((service: any) => {
        const category = service.Categories.toLowerCase();
        const maxPersons = parseInt(service['Numbers/Size'].replace('<=', '')) || 3;
        const basePrice = service['Price /Month (INR)'];

        initialPackages[category] = {
          selected: false,
          persons: 1,
          basePrice,
          calculatedPrice: calculatePriceForPersons(basePrice, 1),
          maxPersons,
          description: service['Job Description'].split('\n').filter((line: string) => line.trim() !== ''),
          preparationTime: getPreparationTime(category),
          rating: 4.84,
          reviews: getReviewsText(category),
          category: service.Categories,
          jobDescription: service['Job Description'],
          remarks: service['Remarks/Conditions'],
        };
      });

      setPackages(initialPackages);
    }
  }, [cookServices, packages]);

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [user]);

  const getPreparationTime = (category: string): string => {
    switch (category) {
      case 'breakfast':
        return '30 mins preparation';
      case 'lunch':
        return '45 mins preparation';
      case 'dinner':
        return '1.5 hrs preparation';
      default:
        return '30 mins preparation';
    }
  };

  const getReviewsText = (category: string): string => {
    switch (category) {
      case 'breakfast':
        return '(2.9M reviews)';
      case 'lunch':
        return '(1.7M reviews)';
      case 'dinner':
        return '(2.7M reviews)';
      default:
        return '(1M reviews)';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'breakfast':
        return '#e17055';
      case 'lunch':
        return '#00b894';
      case 'dinner':
        return '#0984e3';
      default:
        return '#2d3436';
    }
  };

  const handleLogin = () => {
    setLoginOpen(true);
  };

  const handleLoginClose = () => {
    setLoginOpen(false);
  };

  const handleBookingPage = () => {
    setLoginOpen(false);
  };

  const handlePersonChange = (packageName: string, operation: 'increment' | 'decrement') => {
    setPackages((prev) => {
      const currentPackage = prev[packageName];
      if (!currentPackage) return prev;

      let newValue = currentPackage.persons;

      if (operation === 'increment') {
        newValue += 1;
      } else if (operation === 'decrement' && newValue > 1) {
        newValue -= 1;
      }

      return {
        ...prev,
        [packageName]: {
          ...currentPackage,
          persons: newValue,
          calculatedPrice: calculatePriceForPersons(currentPackage.basePrice, newValue),
        },
      };
    });
  };

  const togglePackageSelection = (packageName: string) => {
    setPackages((prev) => {
      const currentPackage = prev[packageName];
      if (!currentPackage) return prev;

      return {
        ...prev,
        [packageName]: {
          ...currentPackage,
          selected: !currentPackage.selected,
        },
      };
    });
  };

  const handleApplyVoucher = () => {
    // Voucher logic here
  };

  const handleCheckout = async () => {
    try {
      const selectedPackages = Object.entries(packages)
        .filter(([_, pkg]) => pkg.selected)
        .map(([name, pkg]) => ({
          mealType: name.toUpperCase(),
          persons: pkg.persons,
          price: pkg.calculatedPrice,
        }));

      if (selectedPackages.length === 0) {
        Alert.alert('Please select at least one package');
        return;
      }

      const totalAmount = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);

      const response = await axios.post(
        'http://13.201.229.41:3000/create-order',
        { amount: totalAmount * 100 },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200 && response.data.success) {
        const orderId = response.data.orderId;
        const amount = totalAmount * 100;
        const currency = 'INR';

        // if (typeof window.Razorpay === 'undefined') {
        //   Alert.alert('Razorpay SDK not loaded.');
        //   return;
        // }

        bookingDetails.serviceProviderId = providerDetails?.serviceproviderId
          ? Number(providerDetails.serviceproviderId)
          : null;
        bookingDetails.serviceProviderName = providerFullName;
        bookingDetails.customerId = customerId;
        bookingDetails.customerName = customerName;
        bookingDetails.address = currentLocation;
        bookingDetails.startDate = bookingType?.startDate || new Date().toISOString().split('T')[0];
        bookingDetails.endDate = bookingType?.endDate || '';

        bookingDetails.engagements = selectedPackages
          .map((pkg) => `${pkg.mealType} for ${pkg.persons} persons`)
          .join(', ');
        bookingDetails.monthlyAmount = totalAmount;
        bookingDetails.timeslot = bookingType.timeRange;

        const options = {
          key: 'rzp_test_lTdgjtSRlEwreA',
          amount,
          currency,
          name: 'Serveaso',
          description: 'Meal Package Booking',
          order_id: orderId,
          handler: async function (razorpayResponse: any) {
            Alert.alert(
              'Payment successful!',
              `Payment ID: ${razorpayResponse.razorpay_payment_id}`
            );

            try {
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
                handleClose();
              }
            } catch (error) {
              console.error('Error saving booking:', error);
            }
          },
          prefill: {
            name: customerName || '',
            email: user?.email || '',
            contact: user?.mobileNo || '',
          },
          theme: {
            color: '#3399cc',
          },
        };

        // const rzp = new window.Razorpay(options);
        // rzp.open();
      }
    } catch (error) {
      console.log('error => ', error);
      Alert.alert('Failed to initiate payment. Please try again.');
    }
  };

  const renderPackageSections = () => {
    return Object.entries(packages).map(([packageName, pkg]) => {
      const categoryColor = getCategoryColor(packageName);

      return (
        <View
          key={packageName}
          style={[
            styles.packageContainer,
            {
              backgroundColor: pkg.selected ? `${categoryColor}10` : '#fff',
              borderLeftWidth: pkg.selected ? 3 : 1,
              borderLeftColor: pkg.selected ? categoryColor : '#dfe6e9',
            },
          ]}
        >
          <View style={styles.packageHeader}>
            <View>
              <Text style={styles.packageTitle}>{packageName}</Text>
              <View style={styles.ratingContainer}>
                <Text style={[styles.ratingText, { color: categoryColor }]}>{pkg.rating}</Text>
                <Text style={styles.reviewsText}>{pkg.reviews}</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceText, { color: categoryColor }]}>
                ₹{pkg.calculatedPrice.toFixed(2)}
              </Text>
              <Text style={styles.timeText}>{pkg.preparationTime}</Text>
            </View>
          </View>

          <View style={styles.personsContainer}>
            <Text style={styles.personsLabel}>Persons:</Text>
            <View style={styles.personSelector}>
              <TouchableOpacity
                onPress={() => handlePersonChange(packageName, 'decrement')}
                style={[styles.personButton, styles.leftButton]}
                disabled={pkg.persons <= 1}
              >
                <Text style={styles.personButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.personCount}>
                <Text style={styles.personCountText}>{pkg.persons}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handlePersonChange(packageName, 'increment')}
                style={[styles.personButton, styles.rightButton]}
                disabled={pkg.persons >= 15}
              >
                <Text style={styles.personButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {pkg.persons > pkg.maxPersons && (
              <Text style={styles.extraChargeText}>*Additional charges applied</Text>
            )}
          </View>

          <View style={styles.descriptionContainer}>
            {pkg.description.map(
              (item, index) =>
                item.trim() && (
                  <View key={index} style={styles.descriptionItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.descriptionText}>{item.trim()}</Text>
                  </View>
                )
            )}
          </View>

          <TouchableOpacity
            onPress={() => togglePackageSelection(packageName)}
            style={[
              styles.selectButton,
              {
                backgroundColor: pkg.selected ? categoryColor : '#fff',
                borderColor: pkg.selected ? categoryColor : '#dfe6e9',
              },
            ]}
          >
            <Text
              style={[
                styles.selectButtonText,
                { color: pkg.selected ? '#fff' : categoryColor },
              ]}
            >
              {pkg.selected ? 'SELECTED' : 'SELECT PACKAGE'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  const selectedPackages = Object.entries(packages).filter(([_, pkg]) => pkg.selected);
  const totalItems = selectedPackages.length;
  const totalPersons = selectedPackages.reduce((sum, [_, pkg]) => sum + pkg.persons, 0);
  const totalPrice = selectedPackages.reduce((sum, [_, pkg]) => sum + pkg.calculatedPrice, 0);

  return (
    <>
      <Modal
        visible={visible}    // Changed from open
        onRequestClose={onClose} 
        // visible={open}
        // onRequestClose={handleClose}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>MEAL PACKAGES</Text>
          </View>

          <ScrollView style={styles.contentContainer}>
            {renderPackageSections()}
          </ScrollView>

          <View style={styles.voucherContainer}>
            <Text style={styles.voucherTitle}>Apply Voucher</Text>
            <View style={styles.voucherInputContainer}>
              <TextInput
                placeholder="Enter voucher code"
                style={styles.voucherInput}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={handleApplyVoucher}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.totalItemsText}>
                Total for {totalItems} item{totalItems !== 1 ? 's' : ''} ({totalPersons} person
                {totalPersons !== 1 ? 's' : ''})
              </Text>
              <Text style={styles.totalPriceText}>₹{totalPrice.toFixed(2)}</Text>
            </View>

            <View style={styles.checkoutContainer}>
              {!loggedInUser && (
                <>
                  <Icon
                    name="info-outline"
                    size={20}
                    color="#666"
                    style={styles.infoIcon}
                  />
                  <TouchableOpacity
                    onPress={handleLogin}
                    style={styles.loginButton}
                  >
                    <Text style={styles.loginButtonText}>LOGIN TO CONTINUE</Text>
                  </TouchableOpacity>
                </>
              )}

              {loggedInUser && (
                <TouchableOpacity
                  onPress={handleCheckout}
                  style={[
                    styles.checkoutButton,
                    { backgroundColor: totalItems > 0 ? '#e17055' : '#bdc3c7' },
                  ]}
                  disabled={totalItems === 0}
                >
                  <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={loginOpen}
        onRequestClose={handleLoginClose}
        animationType="slide"
        transparent={false}
      >
        {/* <Login bookingPage={handleBookingPage} /> */}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
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
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  packageTitle: {
    color: '#2d3436',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
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
  timeText: {
    color: '#636e72',
    fontSize: 14,
  },
  personsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  personsLabel: {
    marginRight: 15,
    color: '#2d3436',
  },
  personSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 20,
  },
  personButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
  },
  leftButton: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderRightWidth: 1,
    borderRightColor: '#dfe6e9',
  },
  rightButton: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#dfe6e9',
  },
  personButtonText: {
    fontSize: 16,
  },
  personCount: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    minWidth: 20,
  },
  personCountText: {
    textAlign: 'center',
  },
  extraChargeText: {
    color: '#e17055',
    fontSize: 12,
    marginLeft: 10,
  },
  descriptionContainer: {
    marginVertical: 15,
  },
  descriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletPoint: {
    marginRight: 10,
    color: '#2d3436',
  },
  descriptionText: {
    flex: 1,
  },
  selectButton: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
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
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
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
  totalItemsText: {
    color: '#636e72',
    fontSize: 14,
  },
  totalPriceText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#2d3436',
  },
  checkoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
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
    borderRadius: 6,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CookServicesDialog;