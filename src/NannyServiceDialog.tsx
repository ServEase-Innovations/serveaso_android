import React, { useState, useEffect } from 'react';
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
import { addToCart, removeFromCart, selectCartItems } from './features/addToSlice';
import { isNannyCartItem } from './types/cartSlice';
import { EnhancedProviderDetails } from './types/ProviderDetailsType';
import { BookingDetails } from './types/engagementRequest';
import axiosInstance from './axiosInstance';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface NannyServicesDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');

  const bookingType = useSelector((state: any) => state.bookingType?.value);
  const allCartItems = useSelector(selectCartItems);
  const nannyCartItems = allCartItems.filter(isNannyCartItem);
  const dispatch = useDispatch();

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

  useEffect(() => {
    const updatedCartItems = { ...cartItems };
    
    // Reset all nanny cart items to false
    Object.keys(cartItems).forEach(key => {
      if (key.startsWith('baby') || key.startsWith('elderly')) {
        updatedCartItems[key] = false;
      }
    });

    // Update based on current cart items
    nannyCartItems.forEach(item => {
      const packageKey = `${item.careType}${item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1)}`;
      updatedCartItems[packageKey as keyof typeof updatedCartItems] = true;
    });

    // Only update if there are actual changes
    const hasChanges = Object.keys(updatedCartItems).some(
      key => updatedCartItems[key] !== cartItems[key]
    );

    if (hasChanges) {
      setCartItems(updatedCartItems);
    }
  }, [nannyCartItems]);

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
    Object.keys(cartItems).forEach(key => {
      if (cartItems[key]) {
        const type = key.startsWith('baby') ? 'baby' : 'elderly';
        const packageType = key.replace(type, '').charAt(0).toLowerCase() + 
                          key.replace(type, '').slice(1);
        total += getPackagePrice(type, packageType);
      }
    });
    return total;
  };

  const getSelectedPackagesCount = () => {
    return Object.values(cartItems).filter(item => item).length;
  };

  const handleApplyVoucher = () => {
    Alert.alert('Voucher Applied', 'Your voucher has been applied successfully');
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
      <View key={packageType} style={[styles.packageCard, cartItems[packageKey] && styles.selectedPackage]}>
        <View style={styles.packageHeader}>
          <View>
            <Text style={styles.packageTitle}>Baby Care - {packageType.charAt(0).toUpperCase() + packageType.slice(1)}</Text>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingValue, { color }]}>{rating}</Text>
              <Text style={styles.reviewsText}>{reviews}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, { color }]}>{price}</Text>
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
        
        <TouchableOpacity 
          style={[
            styles.cartButton,
            cartItems[packageKey] && { backgroundColor: color }
          ]}
          onPress={() => handleAddToCart(packageKey)}
        >
          <Text style={[
            styles.cartButtonText,
            cartItems[packageKey] && { color: 'white' }
          ]}>
            {cartItems[packageKey] ? 'ADDED TO CART' : 'ADD TO CART'}
          </Text>
        </TouchableOpacity>
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
      <View key={packageType} style={[styles.packageCard, cartItems[packageKey] && styles.selectedPackage]}>
        <View style={styles.packageHeader}>
          <View>
            <Text style={styles.packageTitle}>Elderly Care - {packageType.charAt(0).toUpperCase() + packageType.slice(1)}</Text>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingValue, { color }]}>{rating}</Text>
              <Text style={styles.reviewsText}>{reviews}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, { color }]}>{price}</Text>
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
        
        <TouchableOpacity 
          style={[
            styles.cartButton,
            cartItems[packageKey] && { backgroundColor: color }
          ]}
          onPress={() => handleAddToCart(packageKey)}
        >
          <Text style={[
            styles.cartButtonText,
            cartItems[packageKey] && { color: 'white' }
          ]}>
            {cartItems[packageKey] ? 'ADDED TO CART' : 'ADD TO CART'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (    
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {Platform.OS === 'ios' ? (
          <BlurView style={styles.blurView} blurType="dark" blurAmount={10} />
        ) : (
          <View style={[styles.blurView, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        )}
        
        <View style={styles.modalContainer}>
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>NANNY SERVICES</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={styles.tabButton}
                onPress={() => setActiveTab('baby')}
              >
                <View style={[
                  styles.tabIndicator,
                  activeTab === 'baby' && styles.activeTab
                ]}>
                  <Text style={activeTab === 'baby' ? styles.activeTabText : styles.tabText}>
                    Baby Care
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.tabButton}
                onPress={() => setActiveTab('elderly')}
              >
                <View style={[
                  styles.tabIndicator,
                  activeTab === 'elderly' && styles.activeTab
                ]}>
                  <Text style={activeTab === 'elderly' ? styles.activeTabText : styles.tabText}>
                    Elderly Care
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.scrollView}>
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
            
            
          </ScrollView>
          
          <View style={styles.footerContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.footerText}>
                Total for {getSelectedPackagesCount()} service{getSelectedPackagesCount() !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.footerPrice}>₹{calculateTotal().toLocaleString()}</Text>
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
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.checkoutButton,
                  calculateTotal() === 0 && styles.disabledButton
                ]}
                onPress={() => {
                  handleClose();
                  Alert.alert('Checkout', `Total amount: ₹${calculateTotal().toLocaleString()}`);
                }}
                disabled={calculateTotal() === 0}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
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
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabButton: {
    paddingHorizontal: 15,
  },
  tabIndicator: {
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
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  totalContainer: {
    marginBottom: 5,
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
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
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
    fontSize: 16,
  },
});

export default NannyServicesDialog;