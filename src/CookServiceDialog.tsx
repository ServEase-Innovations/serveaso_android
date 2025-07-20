import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';
import { useDispatch, useSelector } from 'react-redux';
import { BookingDetails } from './types/engagementRequest';
import { BOOKINGS } from './Constants/pagesConstants';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import Login from './Login';
import Icon from 'react-native-vector-icons/MaterialIcons';
import InfoIcon from 'react-native-vector-icons/MaterialIcons';
import AddShoppingCartIcon from 'react-native-vector-icons/MaterialIcons';
import RemoveShoppingCartIcon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from './axiosInstance';
import { usePricingFilterService } from './utils/PricingFilter';
import { addToCart, removeFromCart, updateCartItem } from './features/addToSlice';
import { MealPackage } from './types/mealPackage';
import { useAuth0 } from 'react-native-auth0';
// import { useAuth0 } from "@auth0/auth0-react";

interface CookServicesDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
}

interface PackagesState {
  [key: string]: MealPackage;
}

const CookServicesDialog: React.FC<CookServicesDialogProps> = ({ 
  open, 
  handleClose, 
  providerDetails,
  sendDataToParent
}) => {
  const dispatch = useDispatch();
  
  const users = useSelector((state: any) => state.user?.value);
  // const pricing = useSelector((state: any) => state.pricing?.groupedServices);
  const [packages, setPackages] = useState<PackagesState>({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const cart = useSelector((state: any) => state.addToCart?.items || []);
  const { getBookingType, getPricingData, getFilteredPricing } = usePricingFilterService();
  const bookingType = getBookingType();
  console.log("bookingType",bookingType)
  const currentLocation = users?.customerDetails?.currentLocation;
  const firstName = users?.customerDetails?.firstName;
  const lastName = users?.customerDetails?.lastName;
  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;
 const { user, isAuthenticated} =  useAuth0();
const pricing = useSelector((state: any) => state.pricing?.groupedServices);
console.log('Pricing data from Redux:', pricing);

   useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User Info:", user);
       console.log("Name:", user.name);
      console.log("Customer ID:", user.customerid);
    }
  }, [isAuthenticated, user]);
  
  
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
    bookingType: "",
    taskStatus: "NOT_STARTED", 
    serviceType: "COOK",
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

  const cookServices = useMemo(() => getFilteredPricing("cook"), [getFilteredPricing]);

  useEffect(() => {
    const updatedCookServices = getFilteredPricing("cook");
    
    if (!updatedCookServices || updatedCookServices.length === 0) {
      setPackages({});
      return;
    }

    const initialPackages: PackagesState = {};

    updatedCookServices.forEach((service: any) => {
      const category = service.Categories.toLowerCase();
      const maxPersons = parseInt(service["Numbers/Size"].replace('<=', '')) || 3;
      let basePrice = 0;
      if(bookingType?.bookingPreference?.toLowerCase() === "date") {
        basePrice = service["Price /Day (INR)"];
      } else {
        basePrice = service["Price /Month (INR)"];
      }
      const cartItem = Array.isArray(cart) 
        ? cart.find((item: any) => 
            item.type === 'meal' && 
            item.mealType.toLowerCase() === category
          )
        : null;
      
      initialPackages[category] = {
        selected: !!cartItem,
        persons: cartItem?.persons || 1,
        basePrice,
        calculatedPrice: cartItem ? cartItem.price : calculatePriceForPersons(basePrice, 1),
        maxPersons,
        description: service["Job Description"]
          .split('\n')
          .filter((line: string) => line.trim() !== ''),
        preparationTime: getPreparationTime(category),
        rating: 4.84,
        reviews: getReviewsText(category),
        category: service.Categories,
        jobDescription: service["Job Description"],
        remarks: service["Remarks/Conditions"],
        inCart: !!cartItem
      };
    });

    setPackages(initialPackages);
  }, [pricing, bookingType, cart]);

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      setLoggedInUser(user);
    }
  }, [user]);

  const getPreparationTime = (category: string): string => {
    switch(category) {
      case 'breakfast': return '30 mins preparation';
      case 'lunch': return '45 mins preparation';
      case 'dinner': return '1.5 hrs preparation';
      default: return '30 mins preparation';
    }
  };

  const getReviewsText = (category: string): string => {
    switch(category) {
      case 'breakfast': return '(2.9M reviews)';
      case 'lunch': return '(1.7M reviews)';
      case 'dinner': return '(2.7M reviews)';
      default: return '(1M reviews)';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch(category.toLowerCase()) {
      case 'breakfast': return '#e17055';
      case 'lunch': return '#00b894';
      case 'dinner': return '#0984e3';
      default: return '#2d3436';
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
    setPackages(prev => {
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
          calculatedPrice: calculatePriceForPersons(currentPackage.basePrice, newValue)
        }
      };
    });
  };

  const togglePackageSelection = (packageName: string) => {
    setPackages(prev => {
      const currentPackage = prev[packageName];
      if (!currentPackage) return prev;

      const newSelectedState = !currentPackage.selected;
      const shouldBeInCart = newSelectedState;
      if (shouldBeInCart && !currentPackage.inCart) {
        dispatch(addToCart({
          type: 'meal',
          id: packageName.toUpperCase(),
          mealType: packageName.toUpperCase(),
          persons: currentPackage.persons,
          price: currentPackage.calculatedPrice,
          description: currentPackage.description.join(', '),
          basePrice: currentPackage.basePrice,
          maxPersons: currentPackage.maxPersons
        }));
      } else if (!shouldBeInCart && currentPackage.inCart) {
        dispatch(removeFromCart({
          id: packageName.toUpperCase(),
          type: 'meal'
        }));
      }

      return {
        ...prev,
        [packageName]: {
          ...currentPackage,
          selected: newSelectedState,
          inCart: shouldBeInCart
        }
      };
    });
  };

  const toggleCart = (packageName: string) => {
    setPackages(prev => {
      const currentPackage = prev[packageName];
      if (!currentPackage) return prev;

      const newInCartState = !currentPackage.inCart;
      const shouldBeSelected = newInCartState;

      if (newInCartState) {
        const existingItemIndex = cart.findIndex(
          (item: any) => 
            item.type === 'meal' && 
            item.id === packageName.toUpperCase()
        );

        if (existingItemIndex >= 0) {
          dispatch(updateCartItem({
            id: packageName.toUpperCase(),
            type: 'meal',
            updates: {
              persons: currentPackage.persons,
              price: currentPackage.calculatedPrice,
              description: currentPackage.description.join(', '),
              basePrice: currentPackage.basePrice,
              maxPersons: currentPackage.maxPersons
            }
          }));
        } else {
          dispatch(addToCart({
            type: 'meal',
            id: packageName.toUpperCase(),
            mealType: packageName.toUpperCase(),
            persons: currentPackage.persons,
            price: currentPackage.calculatedPrice,
            description: currentPackage.description.join(', '),
            basePrice: currentPackage.basePrice,
            maxPersons: currentPackage.maxPersons
          }));
        }
      } else {
        dispatch(removeFromCart({
          id: packageName.toUpperCase(),
          type: 'meal'
        }));
      }

      return {
        ...prev,
        [packageName]: {
          ...currentPackage,
          inCart: newInCartState,
          selected: shouldBeSelected
        }
      };
    });
  };

  useEffect(() => {
  const updatedCookServices = getFilteredPricing("cook");
  console.log('Filtered cook services:', updatedCookServices);
  
  if (!updatedCookServices || updatedCookServices.length === 0) {
    console.warn('No cook services found in filtered data');
    setPackages({});
    return;
  }
    // const updatedCookServices = getFilteredPricing("cook");
    
    // if (!updatedCookServices || updatedCookServices.length === 0) {
    //   setPackages({});
    //   return;
    // }

    const initialPackages: PackagesState = {};

    updatedCookServices.forEach((service: any) => {
      const category = service.Categories.toLowerCase();
      const maxPersons = parseInt(service["Numbers/Size"].replace('<=', '')) || 3;
      let basePrice = 0;
      if(bookingType?.bookingPreference?.toLowerCase() === "date") {
        basePrice = service["Price /Day (INR)"];
      } else {
        basePrice = service["Price /Month (INR)"];
      }

      const cartItem = Array.isArray(cart) 
        ? cart.find((item: any) => 
            item.type === 'meal' && 
            item.mealType.toLowerCase() === category
          )
        : null;
      
      const persons = cartItem?.persons || 1;
      const calculatedPrice = calculatePriceForPersons(basePrice, persons);

      initialPackages[category] = {
        selected: !!cartItem,
        persons,
        basePrice,
        calculatedPrice,
        maxPersons,
        description: service["Job Description"]
          .split('\n')
          .filter((line: string) => line.trim() !== ''),
        preparationTime: getPreparationTime(category),
        rating: 4.84,
        reviews: getReviewsText(category),
        category: service.Categories,
        jobDescription: service["Job Description"],
        remarks: service["Remarks/Conditions"],
        inCart: !!cartItem
      };
    });

    setPackages(initialPackages);
  }, [pricing, bookingType, cart]);

  useEffect(() => {
  console.log('Packages data:', packages);
}, [packages]);

  const handleApplyVoucher = () => {
    // Voucher application logic
  };

  const getBookingTypeFromPreference = (bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY'; // default
    
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
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
        Alert.alert("Please select at least one package");
        return;
      }

      const totalAmount = selectedPackages.reduce(
        (sum, pkg) => sum + pkg.price,
        0
      );
    const customerName = user?.name || "Guest";
    const customerId = user?.customerid || "guest-id";
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
          Alert.alert("Razorpay SDK not loaded.");
          return;
        }

        bookingDetails.serviceProviderId = providerDetails?.serviceproviderId
          ? Number(providerDetails.serviceproviderId)
          : null;
        bookingDetails.serviceProviderName = providerFullName;
        bookingDetails.customerId = customerId;
        bookingDetails.customerName = customerName;
        bookingDetails.address = currentLocation;
        bookingDetails.startDate =bookingType?.startDate || "",
        bookingDetails.endDate = bookingType?.endDate || "";
        bookingDetails.engagements = selectedPackages
          .map((pkg) => `${pkg.mealType} for ${pkg.persons} persons`)
          .join(", ");
        bookingDetails.monthlyAmount = totalAmount;
        bookingDetails.timeslot = bookingType.timeRange;
         bookingDetails.bookingType = getBookingTypeFromPreference(bookingType?.bookingPreference);
        const options = {
          key: "rzp_test_lTdgjtSRlEwreA",
          amount,
          currency,
          name: "Serveaso",
          description: "Meal Package Booking",
          order_id: orderId,
          handler: async function (razorpayResponse: any) {
            Alert.alert(
              `Payment successful! Payment ID: ${razorpayResponse.razorpay_payment_id}`
            );

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
                  const notifyResponse = await fetch(
                    "http://localhost:4000/send-notification",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        title: "Hello from ServEaso!",
                        body: `Your booking for ${bookingDetails.engagements} has been successfully confirmed!`,
                        url: "http://localhost:3000",
                      }),
                      headers: { "Content-Type": "application/json" },
                    }
                  );

                  if (notifyResponse.ok) {
                    console.log("Notification triggered!");
                    Alert.alert("Notification sent!");
                  } else {
                    console.error("Notification failed");
                    Alert.alert("Failed to send notification");
                  }
                } catch (error) {
                  console.error("Error sending notification:", error);
                  Alert.alert("Error sending notification");
                }

                if (sendDataToParent) {
                  sendDataToParent(BOOKINGS);
                }
                handleClose();
              }
            } catch (error) {
              console.error("Error saving booking:", error);
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
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.log("error => ", error);
      Alert.alert("Failed to initiate payment. Please try again.");
    }
  };

  const renderPackageSections = () => {
  if (Object.keys(packages).length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No meal packages available</Text>
      </View>
    );
  }
    return Object.entries(packages).map(([packageName, pkg]) => {
      const categoryColor = getCategoryColor(packageName);

      return (
        <View 
          key={packageName}
          style={[
            styles.packageCard,
            pkg.selected && { borderColor: categoryColor, borderWidth: 2 }
          ]}
        >
          <View style={styles.packageHeader}>
            <View>
              <Text style={[styles.packageTitle, { color: categoryColor }]}>{packageName}</Text>
              <View style={styles.ratingContainer}>
                <Text style={[styles.ratingValue, { color: categoryColor }]}>{pkg.rating}</Text>
                <Text style={styles.reviewsText}>{pkg.reviews}</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceValue, { color: categoryColor }]}>₹{pkg.calculatedPrice.toFixed(2)}</Text>
              <Text style={styles.preparationTime}>{pkg.preparationTime}</Text>
            </View>
          </View>
          
          <View style={styles.personsControl}>
            <Text style={styles.personsLabel}>Persons:</Text>
            <View style={styles.personsInput}>
              <TouchableOpacity 
                style={styles.personButton}
                onPress={() => handlePersonChange(packageName, 'decrement')}
                disabled={pkg.persons <= 1}
              >
                <Text style={styles.personButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.personsValue}>{pkg.persons}</Text>
              <TouchableOpacity 
                style={styles.personButton}
                onPress={() => handlePersonChange(packageName, 'increment')}
                disabled={pkg.persons >= 15}
              >
                <Text style={styles.personButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {pkg.persons > pkg.maxPersons && (
              <Text style={styles.additionalCharges}>*Additional charges applied</Text>
            )}
          </View>
          
          <View style={styles.descriptionList}>
            {pkg.description.map((item, index) => (
              item.trim() && (
                <View key={index} style={styles.descriptionItem}>
                  <Text style={[styles.descriptionBullet, { color: categoryColor }]}>•</Text>
                  <Text style={styles.descriptionText}>{item.trim()}</Text>
                </View>
              )
            ))}
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[
                styles.cartButton,
                { backgroundColor: pkg.inCart ? '#f5f5f5' : categoryColor }
              ]}
              onPress={() => toggleCart(packageName)}
            >
              <Icon 
                name={pkg.inCart ? "remove-shopping-cart" : "add-shopping-cart"} 
                size={20} 
                color={pkg.inCart ? categoryColor : '#fff'} 
              />
              <Text style={[styles.cartButtonText, { color: pkg.inCart ? categoryColor : '#fff' }]}>
                {pkg.inCart ? 'ADDED TO CART' : 'ADD TO CART'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.selectButton,
                { backgroundColor: pkg.selected ? categoryColor : '#f5f5f5' }
              ]}
              onPress={() => togglePackageSelection(packageName)}
            >
              <Text style={[styles.selectButtonText, { color: pkg.selected ? '#fff' : categoryColor }]}>
                {pkg.selected ? 'SELECTED' : 'SELECT PACKAGE'}
              </Text>
            </TouchableOpacity>
          </View>
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
        visible={open}
        onRequestClose={handleClose}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.dialogContent}>
          <View style={styles.dialogContainer}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogHeaderText}>MEAL PACKAGES</Text>
            </View>
            
            <ScrollView style={styles.packagesContainer}>
              {renderPackageSections()}
            </ScrollView>
            
            <View style={styles.voucherContainer}>
              <Text style={styles.voucherTitle}>Apply Voucher</Text>
              <View style={styles.voucherInputContainer}>
                <TextInput
                  style={styles.voucherInput}
                  placeholder="Enter voucher code"
                  placeholderTextColor="#999"
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
                  Total for {totalItems} item{totalItems !== 1 ? 's' : ''} ({totalPersons} person{totalPersons !== 1 ? 's' : ''})
                </Text>
                <Text style={styles.footerPrice}>₹{totalPrice.toFixed(2)}</Text>
              </View>
              
              <View style={styles.footerButtons}>
                <TouchableOpacity
                  style={[
                    styles.checkoutButton,
                    totalItems === 0 && { opacity: 0.5 }
                  ]}
                  onPress={handleCheckout}
                  disabled={totalItems === 0}
                >
                  <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                </TouchableOpacity>
              </View>
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
  dialogContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dialogContainer: {
    flex: 1,
    padding: 16,
  },
  dialogHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dialogHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  packagesContainer: {
    flex: 1,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  preparationTime: {
    fontSize: 12,
    color: '#666',
  },
  personsControl: {
    marginBottom: 12,
  },
  personsLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  personsInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personButtonText: {
    fontSize: 18,
    color: '#333',
  },
  personsValue: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  additionalCharges: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  descriptionList: {
    marginBottom: 16,
  },
  descriptionItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  descriptionBullet: {
    marginRight: 8,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 4,
    marginRight: 8,
  },
  cartButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  selectButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 4,
  },
  selectButtonText: {
    fontWeight: 'bold',
  },
  voucherContainer: {
    marginVertical: 16,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  voucherInputContainer: {
    flexDirection: 'row',
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginRight: 8,
  },
  voucherButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    justifyContent: 'center',
  },
  voucherButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#333',
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  footerButtons: {
    flexDirection: 'row',
  },
  checkoutButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
   emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
});

export default CookServicesDialog;