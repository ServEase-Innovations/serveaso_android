import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableWithoutFeedback,
  PermissionsAndroid,
} from 'react-native';
import axios from 'axios';
import { keys } from './env';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useSelector, useDispatch } from 'react-redux';
import { remove } from './features/userSlice';
import { ADMIN, BOOKINGS, CHECKOUT, DASHBOARD, LOGIN, PROFILE } from './Constants/pagesConstants';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker } from 'react-native-maps';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { NativeModules } from 'react-native';
import {useAuth0} from 'react-native-auth0';
import config from '../auth0-configuration';
import { selectCartItems } from './features/addToSlice';
import {CartDialog} from './CartDialog';

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
}

Geocoder.init(keys.api_key);

const Head: React.FC<ChildComponentProps> = ({ sendDataToParent }) => {
  // const handleClick = (e: any) => {
  //   if (e === 'sign_out') {
  //     dispatch(remove());
  //     sendDataToParent("");
  //   } else {
  //     sendDataToParent(e);
  //   }
  // };
//  const handleClick = (e: any) => {
//     if (e === 'sign_out') {
//       dispatch(remove());
//       sendDataToParent("");
//     } else if (e === 'HOME') {
//       sendDataToParent("HOME"); // This will trigger the view change in App.tsx
//     } else {
//       sendDataToParent(e);
//     }
//   };
const handleClick = (e: any) => {
  if (e === 'sign_out') {
    dispatch(remove());
    sendDataToParent("");
  } else if (e === 'HOME') {
    sendDataToParent("HOME");
  } else {
    sendDataToParent(e);
  }
};

// ...

const handleBookingHistoryClick = () => {
  setMenuVisible(false);
  handleClick(BOOKINGS);
};

  const cart = useSelector((state: any) => state.cart?.value);
  const user = useSelector((state: any) => state.user?.value);
  const dispatch = useDispatch();

  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dataFromMap, setDataFromMap] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showGPSButton, setShowGPSButton] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
   const cartItems = useSelector(selectCartItems);

const {authorize, clearSession, user: auth0User, getCredentials, error: auth0Error, isLoading: auth0Loading} = useAuth0();

  useEffect(() => {
    setLoggedInUser(user);
    console.log("User role is:", user?.role);
  }, [user]);

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert("Permission Denied", "Location permission is required.");
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
              headers: {
                "User-Agent": "ReactNativeApp",
                "Accept-Language": "en",
              },
            }
          );

          if (res.data && res.data.display_name) {
            setLocation(res.data.display_name);
            setAddress(res.data.display_name);
          }
        } catch (error) {
          console.error("Error getting address:", error);
        }
      },
      (error) => {
        console.error(error);
        Alert.alert("Error", "Unable to fetch location.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const checkLocationAccuracy = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
        const locationMode = await NativeModules.LocationSettings.getLocationMode();
        
        if (locationMode !== 'high_accuracy') {
          Alert.alert(
            'High Accuracy Recommended',
            'For best results, please enable high accuracy location mode in your device settings.',
            [
              {
                text: 'Open Settings',
                onPress: () => NativeModules.LocationSettings.openLocationSettings(),
              },
              { text: 'Continue Anyway', onPress: () => {} },
            ]
          );
        }
      } catch (err) {
        console.warn('Error checking location accuracy:', err);
      }
    }
  };

  const checkLocationServices = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        return await NativeModules.LocationSettings.checkLocationServices();
      }
      return true;
    } catch (err) {
      console.warn('Error checking location services:', err);
      return false;
    }
  };

  const getAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await Geocoder.from(lat, lon);
      const addressComponent = res.results?.[0]?.formatted_address;
      if (addressComponent) {
        setAddress(addressComponent);
        setLocation(addressComponent);
      }
    } catch (error) {
      console.warn('Geocoder error:', error);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const fetchLocation = () => {
    setLoading(true);
    setShowGPSButton(false);
    
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        Alert.alert('Location fetched successfully', `Lat: ${latitude}, Lng: ${longitude}`);
        setLatitude(latitude);
        setLongitude(longitude);
        getAddressFromCoords(latitude, longitude);
        setLoading(false);
      },
      error => {
        console.warn('Location fetch error:', error);
        setLoading(false);
        setShowGPSButton(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchLocationWithChecks = async () => {
    setIsCheckingLocation(true);
    setLoading(true);
    
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location access is required for this feature. Please enable it in settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to continue.',
          [
            {
              text: 'Enable',
              onPress: () => Linking.openSettings(),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setShowGPSButton(true);
        return;
      }

      await checkLocationAccuracy();
      fetchLocation();
    } catch (error) {
      console.warn('Location fetch error:', error);
      setShowGPSButton(true);
    } finally {
      setIsCheckingLocation(false);
      setLoading(false);
    }
  };

  const handleLocationRefresh = async () => {
    await fetchLocationWithChecks();
  };

  const handleOpenSettings = async () => {
    await Linking.openSettings();
    handleLocationRefresh();
  };

  const handleLocationSave = () => {
    if (address) {
      setLocation(address);
    }
    setOpen(false);
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  const handleOverlayPress = () => {
    setMenuVisible(false);
  };

  const handleProfileClick = () => {
    setMenuVisible(false);
    handleClick(PROFILE);
  };

  const handleDashboardClick = () => {
    setMenuVisible(false);
    handleClick(DASHBOARD);
  };

  // const handleBookingHistoryClick = () => {
  //   setMenuVisible(false);
  //   handleClick(BOOKINGS);
  // };

  // const handleSignOut = () => {
  //   setMenuVisible(false);
  //   handleClick('sign_out');
  // };
  const handleSignOut = async () => {
    try {
      await clearSession({
        // federated: false, // optional, set to true if you want to log out from identity provider too
        returnToUrl: 'com.serveaso://logout'
      });
  
      dispatch(remove());
      setMenuVisible(false);
      handleClick('sign_out');
    } catch (e) {
      console.log('Log out error:', e);
    }
  };
  

  // const handleLoginClick = () => {
  //   setMenuVisible(false);
  //   handleClick(LOGIN);
  // };
  // Modify the handleLoginClick function to use Auth0
  const handleLoginClick = async () => {
    setMenuVisible(false);
    try {
      await authorize(
        {
          scope: 'openid profile email',
          redirectUrl: 'com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback',
        }
      );
  
      const credentials = await getCredentials();
  
      if (credentials?.accessToken) {
        Alert.alert('Login Successful');
        // Optional: dispatch(setUser(auth0User));
      }
    } catch (e) {
      console.log('Login error:', e);
    }
  };

  return (
    <View style={{ position: 'relative' }}>
      {menuVisible && (
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.headerContainer}>
        <TouchableOpacity 
  style={styles.logoContainer} 
  onPress={() => handleClick('HOME')}
>
  <Image
    source={require('../assets/images/logo.png')}
    style={styles.logo}
  />
  <Text style={styles.logoText}>ServEaso</Text>
</TouchableOpacity>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.locationContainer} 
            onPress={() => setOpen(true)}
          >
            <MaterialIcon name="location-on" size={16} color="#3b82f6" style={styles.locationIcon} />
            <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
              {location || 'Set Location'}
            </Text>
          </TouchableOpacity>

          <View style={styles.iconsContainer}>
          <TouchableOpacity 
  style={styles.iconButton} 
  onPress={() => setIsCartOpen(true)}
>
  <View style={styles.cartBadge}>
    <Text style={styles.badgeText}>{cartItems?.length || 0}</Text>
  </View>
  <FeatherIcon name="shopping-cart" size={20} color="#000" />
</TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
              {loggedInUser ? (
                <FeatherIcon name="user" size={20} color="#000" />
              ) : (
                <FeatherIcon name="user" size={20} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Modal */}
        <Modal
          visible={open}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setOpen(false)}
          onShow={fetchLocationWithChecks}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Location</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {isCheckingLocation ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.statusText}>Checking location services...</Text>
              </View>
            ) : loading ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.statusText}>Getting your location...</Text>
              </View>
            ) : showGPSButton ? (
              <View style={styles.statusContainer}>
                <MaterialIcon name="location-off" size={50} color="red" />
                <Text style={styles.statusText}>Location services are disabled</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]} 
                    onPress={handleOpenSettings}
                  >
                    <Text style={styles.buttonText}>Enable Location Services</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.modalContent}>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    region={{
                      latitude: latitude || 0,
                      longitude: longitude || 0,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}>
                    <Marker
                      coordinate={{ latitude: latitude || 0, longitude: longitude || 0 }}
                      title="You are here"
                    />
                  </MapView>
                </View>

                <View style={styles.locationInfoContainer}>
                  <View style={styles.locationInfo}>
                    <MaterialIcon name="location-on" size={20} color="#3b82f6" />
                    <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
                  </View>

                  <View style={styles.coordinatesContainer}>
                    <Text style={styles.coordinateText}>Lat: {latitude?.toFixed(4)}</Text>
                    <Text style={styles.coordinateText}>Lng: {longitude?.toFixed(4)}</Text>
                  </View>
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]} 
                    onPress={fetchLocationWithChecks}
                  >
                    <Text style={styles.secondaryButtonText}>Refresh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]} 
                    onPress={handleLocationSave}
                  >
                    <Text style={styles.buttonText}>Confirm Location</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>


{menuVisible && (
  <View style={styles.menuDropdown}>
    {!auth0User && !loggedInUser ? (
      <>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleLoginClick}
        >
          <Text style={styles.menuItemText}>Login / Signup</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            setMenuVisible(false);
            Alert.alert('Terms & Conditions clicked');
          }}
        >
          <Text style={styles.menuItemText}>Terms & Conditions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            setMenuVisible(false);
            Alert.alert('Contact Us clicked');
          }}
        >
          <Text style={styles.menuItemText}>Contact Us</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleBookingHistoryClick}
        >
          <Text style={styles.menuItemText}>Booking History</Text>
        </TouchableOpacity>
        <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={handleDashboardClick}
                  >
                    <Text style={styles.menuItemText}>Dashboard</Text>
                  </TouchableOpacity>

      </>
    ) : (
      <>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleProfileClick}
        >
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
        
      
        
        {loggedInUser?.role === 'admin' && (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleDashboardClick}
          >
            <Text style={styles.menuItemText}>Dashboard</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleSignOut}
        >
          <Text style={styles.menuItemText}>Sign Out</Text>
        </TouchableOpacity>
      </>
    )}
  </View>
)}
        {/* {menuVisible && (
          <View style={styles.menuDropdown}>
            {!loggedInUser ? (
              <>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleLoginClick}
                >
                  <Text style={styles.menuItemText}>Login / Signup</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    setMenuVisible(false);
                    Alert.alert('Terms & Conditions clicked');
                  }}
                >
                  <Text style={styles.menuItemText}>Terms & Conditions</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    setMenuVisible(false);
                    Alert.alert('Contact Us clicked');
                  }}
                >
                  <Text style={styles.menuItemText}>Contact Us</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleProfileClick}
                >
                  <Text style={styles.menuItemText}>Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleBookingHistoryClick}
                >
                  <Text style={styles.menuItemText}>Booking History</Text>
                </TouchableOpacity>
                
                {loggedInUser?.role === 'admin' && (
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={handleDashboardClick}
                  >
                    <Text style={styles.menuItemText}>Dashboard</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={handleSignOut}
                >
                  <Text style={styles.menuItemText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )} */}
      </View>
          <CartDialog 
      open={isCartOpen}
      handleClose={() => setIsCartOpen(false)}
      handleCheckout={() => {
        setIsCartOpen(false);
        handleClick(CHECKOUT);
      }}
    />

    </View>
  );
};

type Styles = {
  headerContainer: ViewStyle;
  logoContainer: ViewStyle;
  logo: ImageStyle;
  logoText: TextStyle;
  actionsContainer: ViewStyle;
  locationInput: ViewStyle;
  locationIcon: TextStyle;
  locationTextInput: TextStyle;
  iconButton: ViewStyle;
  blueIconButton: ViewStyle;
  cartBadge: ViewStyle;
  badgeText: TextStyle;
  modalContainer: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  map: ViewStyle;
  modalActions: ViewStyle;
  cancelButton: ViewStyle;
  saveButton: ViewStyle;
  buttonText: TextStyle;
  statusContainer: ViewStyle;
  statusText: TextStyle;
  buttonRow: ViewStyle;
  infoBox: ViewStyle;
  text: TextStyle;
  overlay: ViewStyle;
  menuDropdown: ViewStyle;
  menuItem: ViewStyle;
  menuItemText: TextStyle;
  locationContainer: ViewStyle;
  iconsContainer: ViewStyle;
  modalContent: ViewStyle;
  mapContainer: ViewStyle;
  locationInfoContainer: ViewStyle;
  locationInfo: ViewStyle;
  coordinatesContainer: ViewStyle;
  coordinateText: TextStyle;
  addressText: TextStyle;
  buttonGroup: ViewStyle;
  buttonContainer: ViewStyle;
  button: ViewStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
  locationText:TextStyle;
};

const styles = StyleSheet.create<Styles>({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    elevation: 3,
  },
 logoContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8, // Add some padding to make it easier to tap
},
  logo: {
    height: 40,
    width: 40,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderColor: '#f3f4f6',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationTextInput: {
    backgroundColor: 'transparent',
    fontSize: 14,
    minWidth: 120,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
  blueIconButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  badgeText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 10,
    borderRadius: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  infoBox: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  menuDropdown: {
    position: 'absolute',
    top: 70,
    right: 10,
    backgroundColor: 'black',
    borderRadius: 8,
    paddingVertical: 8,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    minWidth: 160,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
  },
   locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 150,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 6,
    fontWeight: '500',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
   
  modalContent: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    height: '50%',
  },
  locationInfoContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    color: '#334155',
    marginLeft: 8,
    flex: 1,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateText: {
    fontSize: 14,
    color: '#64748b',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '500',
  },
 
});

export default Head;