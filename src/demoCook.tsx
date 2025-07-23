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
import axiosInstance from './axiosInstance'; // Make sure to import your axios instance

// Redux actions
import { addToCart, removeFromCart, updateCartItem } from './features/addToSlice';

interface BookingDetails {
  serviceProviderId: number;
  serviceProviderName: string;
  customerId: number;
  customerName: string; 
  startDate: string;
  endDate: string;
  engagements: string;
  address: string;
  timeslot: string;
  monthlyAmount: number;
  paymentMode: string;
  bookingType: string;
  taskStatus: string; 
  serviceType: string;
  responsibilities: string[];
}

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

  // Sync with cart on mount
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
      
      // Update cart if this item is in cart
      if (currentPackage.inCart) {
        dispatch(updateCartItem({
          id: currentPackage.name.toUpperCase(),
          type: 'meal',
          updates: {
            persons: currentPackage.persons,
            price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1),
            description: currentPackage.includes.join(', '),
            basePrice: currentPackage.price,
            maxPersons: 15 // Assuming max 15 persons
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
        // Add to cart
        dispatch(addToCart({
          type: 'meal',
          id: currentPackage.name.toUpperCase(),
          mealType: currentPackage.name.toUpperCase(),
          persons: currentPackage.persons || 1,
          price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1),
          description: currentPackage.includes.join(', '),
          basePrice: currentPackage.price,
          maxPersons: 15 // Assuming max 15 persons
        }));
      } else {
        // Remove from cart
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
        // Add to cart if selecting and not already in cart
        dispatch(addToCart({
          type: 'meal',
          id: currentPackage.name.toUpperCase(),
          mealType: currentPackage.name.toUpperCase(),
          persons: currentPackage.persons || 1,
          price: calculatePriceForPersons(currentPackage.price, currentPackage.persons || 1),
          description: currentPackage.includes.join(', '),
          basePrice: currentPackage.price,
          maxPersons: 15 // Assuming max 15 persons
        }));
      } else if (!newSelectedState && currentPackage.inCart) {
        // Remove from cart if deselecting and in cart
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
    if (!bookingPreference) return 'MONTHLY'; // default
    
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  };

  const handleCheckout = async () => {
    try {
      const selectedPackages = packages
        .filter(pkg => pkg.selected)
        .map(pkg => ({
          mealType: pkg.name.toUpperCase(),
          persons: pkg.persons || 1,
          price: calculatePriceForPersons(pkg.price, pkg.persons || 1),
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
      const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;

      // Create booking details
      const bookingDetails: BookingDetails = {
        serviceProviderId: providerDetails?.serviceproviderId
          ? Number(providerDetails.serviceproviderId)
          : 0,
        serviceProviderName: providerFullName,
        customerId: Number(customerId) || 0,
        customerName: customerName,
        address: user?.customerDetails?.currentLocation || "",
        startDate: bookingType?.startDate || new Date().toISOString().split('T')[0],
        endDate: bookingType?.endDate || "",
        engagements: selectedPackages
          .map(pkg => `${pkg.mealType} for ${pkg.persons} persons`)
          .join(", "),
        monthlyAmount: totalAmount,
        timeslot: bookingType?.timeRange || "",
        paymentMode: "UPI",
        bookingType: getBookingTypeFromPreference(bookingType?.bookingPreference),
        taskStatus: "NOT_STARTED",
        serviceType: "COOK",
        responsibilities: [],
      };

      // Simulate payment success
      Alert.alert(
        "Payment Successful",
        "Your booking has been confirmed!",
        [
          {
            text: "OK",
            onPress: async () => {
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
                  // Clear selected items from cart
                  selectedPackages.forEach(pkg => {
                    dispatch(removeFromCart({
                      id: pkg.mealType,
                      type: 'meal'
                    }));
                  });

                  if (sendDataToParent) {
                    sendDataToParent("BOOKINGS"); // Or pass bookingDetails if needed
                  }
                  onClose();
                }
              } catch (error) {
                console.error("Error saving booking:", error);
                Alert.alert("Error", "Failed to save booking details");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.log("error => ", error);
      Alert.alert("Error", "Failed to initiate payment. Please try again.");
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
              style={styles.continueButton} 
              onPress={handleCheckout}
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