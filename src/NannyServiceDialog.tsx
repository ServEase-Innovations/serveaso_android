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
import { Dimensions } from 'react-native';


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
// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');


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
    
    Object.keys(cartItems).forEach(key => {
      if (key.startsWith('baby') || key.startsWith('elderly')) {
        updatedCartItems[key] = false;
      }
    });

    nannyCartItems.forEach(item => {
      const packageKey = `${item.careType}${item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1)}`;
      updatedCartItems[packageKey as keyof typeof updatedCartItems] = true;
    });

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
    const color = '#3399cc'; // Unified blue color
    const price = `₹${getPackagePrice('baby', packageType).toLocaleString()}`;
    const reviews = packageType === 'day' ? '(1.5M reviews)' : 
                   packageType === 'night' ? '(1.2M reviews)' : '(980K reviews)';
    const rating = packageType === 'day' ? 4.8 : 
                  packageType === 'night' ? 4.9 : 4.9;
    
    const descriptionItems = packageType === 'day' ? [
      'Professional daytime baby care',
      'Age-appropriate activities',
      'Meal preparation and feeding'
    ] : packageType === 'night' ? [
      'Professional overnight baby care',
      'Night feeding and diaper changes',
      'Sleep routine establishment'
    ] : [
      'Round-the-clock professional care',
      'All daily care activities included',
      'Live-in nanny service'
    ];

    return (
      <View key={packageType} style={[
        styles.packageCard, 
        cartItems[packageKey] && styles.selectedPackage,
        { borderLeftColor: color }
      ]}>
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

  const renderElderlyPackage = (packageType: 'day' | 'night' | 'fullTime') => {
    const packageData = elderlyPackages[packageType];
    const packageKey = `elderly${packageType.charAt(0).toUpperCase() + packageType.slice(1)}`;
    const color = '#3399cc'; // Unified blue color
    const price = `₹${getPackagePrice('elderly', packageType).toLocaleString()}`;
    const reviews = packageType === 'day' ? '(1.1M reviews)' : 
                   packageType === 'night' ? '(950K reviews)' : '(850K reviews)';
    const rating = packageType === 'day' ? 4.7 : 
                  packageType === 'night' ? 4.8 : 4.9;
    
    const descriptionItems = packageType === 'day' ? [
      'Professional daytime elderly care',
      'Medication management',
      'Meal preparation and assistance'
    ] : packageType === 'night' ? [
      'Professional overnight elderly care',
      'Night-time assistance and monitoring',
      'Sleep comfort and safety'
    ] : [
      'Round-the-clock professional care',
      'All daily care activities included',
      'Live-in caregiver service'
    ];

    return (
      <View key={packageType} style={[
        styles.packageCard, 
        cartItems[packageKey] && styles.selectedPackage,
        { borderLeftColor: color }
      ]}>
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

  return (    
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { 
        paddingTop: SCREEN_HEIGHT * 0.15,  // Reduced from top
        paddingBottom: SCREEN_HEIGHT * 0.15 // Reduced from bottom
      }]}>
         {/* Smaller dialog container */}
        <View style={[styles.modalContainer, { 
          maxHeight: SCREEN_HEIGHT * 0.7,  // Reduced height
          paddingVertical: 10              // Tighter padding
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
                onPress={() => {
                  handleClose();
                  Alert.alert('Checkout', `Total amount: ₹${calculateTotal().toLocaleString()}`);
                }}
                disabled={getSelectedPackagesCount() === 0}
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
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black
    justifyContent: 'center',
    paddingHorizontal: 10, // Side padding
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
});

export default NannyServicesDialog;