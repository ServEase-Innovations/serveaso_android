import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
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
import { add, remove } from './features/userSlice';
import { ADMIN, BOOKINGS, CHECKOUT, DASHBOARD, LOGIN, PROFILE } from './Constants/pagesConstants';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker } from 'react-native-maps';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { NativeModules } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { selectCartItems } from './features/addToSlice';
import { CartDialog } from './CartDialog';

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
}

Geocoder.init(keys.api_key);

const Head: React.FC<ChildComponentProps> = ({ sendDataToParent }) => {
  const {
    authorize,
    clearSession,
    user: auth0User,
    getCredentials,
    error: auth0Error,
    isLoading: auth0Loading,
  } = useAuth0();

  const dispatch = useDispatch();
  const cart = useSelector((state: any) => state.cart?.value);
  const dropdownRef = useRef<View>(null);
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [locationAs, setLocationAs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([
    { name: "Detect Location", index: 1 },
    { name: "Add Address", index: 2 },
  ]);
  const [dataFromMap, setDataFromMap] = useState<any>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showGPSButton, setShowGPSButton] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [OpenSaveOptionForSave, setOpenSaveOptionForSave] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const cartItems = useSelector(selectCartItems);
  const [currentPage, setCurrentPage] = useState('');
  const [userPreference, setUserPreference] = useState<any>([]);

  useEffect(() => {
    const run = async () => {
      // Step 1: Get location first
      await getLocation();

      // Step 2: Auth checks
      if (!auth0User || auth0Loading || !auth0User?.email) return;

      try {
        // Step 3: Get token
        const token = await getCredentials();
        console.log("Access Token:", token?.accessToken);
        console.log("User authenticated:", auth0User);

        const email = auth0User.email ?? "";

        // Step 4: Check email (this must finish before moving on)
        const response = await axios.get(
          `https://utils-ndt3.onrender.com/customer/check-email?email=${encodeURIComponent(email)}`
        );
        console.log("Email check response:", response.data);

        // Step 5: Conditional next steps
        if (!response.data.user_role) {
          await createUser(auth0User);
        } else if (response.data.user_role === "SERVICE_PROVIDER") {
          auth0User.role = "SERVICE_PROVIDER";
          auth0User.serviceProviderId = response.data.id;
        } else {
          await getCustomerPreferences(Number(response.data.id));
        }

        console.log("Post-login steps complete ✅");
      } catch (error) {
        console.error("Error during post-login API call:", error);
      }
    };

    run();
  }, [auth0User, auth0Loading, getCredentials]);

  const createUser = async (user: any) => {
    try {
      const userData = {
        firstName: user.given_name || user.name?.split(' ')[0] || 'User',
        lastName: user.family_name || user.name?.split(' ')[1] || '',
        emailId: user.email,
        password: "password"
      };

      console.log("Creating user with data:", userData);

      const response = await axios.post(
        "https://servease-be-5x7f.onrender.com/api/customer/add-customer-new",
        userData
      );

      console.log("User creation response:", response.data);

      if (response.data && response.data.id) {
        const customerId = Number(response.data.id);
        user.customerid = customerId;
        await getCustomerPreferences(customerId);
      } else {
        console.warn("Unexpected response format:", response.data);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const getCustomerPreferences = async (customerId: number) => {
    try {
      const response = await axios.get(`https://utils-ndt3.onrender.com/user-settings/${customerId}`);
      console.log("Response from user settings API:", response.data);

      if (response.status === 200) {
        console.log("Customer preferences fetched successfully:", response.data);

        setUserPreference(response.data);
        if (auth0User) {
          auth0User.customerid = customerId;
        }

        console.log("Updated user object with customerId:", auth0User);
        const baseSuggestions = [
          { name: "Detect Location", index: 1 },
          { name: "Add Address", index: 2 },
        ];
        const savedLocationSuggestions = response.data[0].savedLocations.map((loc: any, i: number) => ({
          name: loc.name,
          index: i + 3,
        }));

        setSuggestions([...baseSuggestions, ...savedLocationSuggestions]);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        createUserPreferences(customerId);
      } else {
        console.error("Unexpected error fetching user settings:", error);
      }
    }
  };

  const createUserPreferences = async (customerId: number) => {
    if (auth0User) {
      auth0User.customerid = customerId;
    }
    try {
      const payload: any = {
        customerId,
        savedLocations: [],
      };

      console.log("Creating user preferences with payload:", payload);

      const response = await axios.post("https://utils-ndt3.onrender.com/user-settings", payload);

      if (response.status === 200 || response.status === 201) {
        setUserPreference(payload);
      } else {
        console.warn("Unexpected response:", response);
      }
    } catch (error) {
      console.error("Error saving user settings:", error);
    }
  };

  const getLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position: { coords: { latitude: any; longitude: any; }; }) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json`,
              {
                params: {
                  latlng: `${latitude},${longitude}`,
                  key: keys.api_key,
                },
              }
            );
            const address = response.data.results[0]?.formatted_address;
            setLocation(address || "Location not found");
            console.log("Location fetched: ", address);
          } catch (error) {
            console.log("Failed to fetch location: ", error);
          }
        },
        (error: any) => {
          console.log("Geolocation error: ", error.message);
          setError(error.message);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  const handleChange = (newValue: any) => {
    if (newValue === "Add Address") {
      setOpen(true);
    } else if (newValue === "Detect Location") {
      getLocation();
    } else {
      console.log("Selected location:", newValue);
      console.log("user preference ", userPreference);

      const loc = userPreference?.savedLocations?.find(
        (location: any) => location.name === newValue
      );

      if (loc?.location?.formatted_address) {
        console.log("Location from user preference: ", loc.location.formatted_address);
        setLocation(loc.location.formatted_address);
        dispatch(add(loc));
      } else {
        console.warn("No matching location found for:", newValue);
      }
    }
  };

    const handleClick = (e: any) => {
    setCurrentPage(e);
    if (e === 'sign_out') {
      dispatch(remove());
      sendDataToParent(""); // This will trigger navigation to HomePage
    } else {
      sendDataToParent(e);
    }
  };

  const handleSignOut = async () => {
    try {
      await clearSession({
        returnToUrl: 'com.serveaso://logout'
      });

      dispatch(remove());
      setMenuVisible(false);
      handleClick('sign_out');
    } catch (e) {
      console.log('Log out error:', e);
    }
  };

  const handleLoginClick = async () => {
    setMenuVisible(false);
    try {
      await authorize({
        scope: 'openid profile email',
        redirectUrl: 'com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback',
      });

      const credentials = await getCredentials();

      if (credentials?.accessToken) {
        Alert.alert('Login Successful');
      }
    } catch (e) {
      console.log('Login error:', e);
    }
  };

  const handleBookingHistoryClick = () => {
    setMenuVisible(false);
    handleClick(BOOKINGS);
  };

  const handleProfileClick = () => {
    setMenuVisible(false);
    handleClick(PROFILE);
  };

  const handleDashboardClick = () => {
    setMenuVisible(false);
    handleClick(DASHBOARD);
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  const handleOverlayPress = () => {
    setMenuVisible(false);
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "We need access to your location",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert("Permission Denied", "Location permission is required.");
        }
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                "User-Agent": "ReactNativeApp",
                "Accept-Language": "en",
              },
            }
          );

          if (res.data?.display_name) {
            setLocation(res.data.display_name);
            setAddress(res.data.display_name);
          }
        } catch (error) {
          console.error("Error getting address:", error);
        }
      },
      (error) => {
        console.error("Location error:", error);
        Alert.alert("Error", error.message || "Unable to fetch location.");
      },
      {
        enableHighAccuracy: false,
        timeout: 60000,
        maximumAge: 10000,
      }
    );
  };

  const handleLocationSave = () => {
    if (address) {
      setLocation(address);
    }
    setOpen(false);
    setOpenSaveOptionForSave(true);
  };

  const locationHandleSave = () => {
    console.log("Location saved as:", locationAs);
    console.log("user preference ", userPreference);
    updateUserSetting();
  };

  const updateUserSetting = async () => {
    if (!auth0User || !locationAs || !dataFromMap) {
      console.error("Missing required data to update user setting.");
      return;
    }

    const newLocation = {
      name: locationAs,
      location: dataFromMap[0],
    };

    const existingLocations =
      Array.isArray(userPreference?.savedLocations) ? userPreference.savedLocations : [];

    const updatedLocations = [...existingLocations, newLocation];

    const payload = {
      customerId: auth0User.customerid,
      savedLocations: updatedLocations,
    };

    try {
      const response = await axios.put(
        `https://utils-ndt3.onrender.com/user-settings/${auth0User.customerid}`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        setUserPreference({ customerId: auth0User.customerid, savedLocations: updatedLocations });
        setOpenSaveOptionForSave(false);
        setLocationAs("");

        const baseSuggestions = [
          { name: "Detect Location", index: 1 },
          { name: "Add Address", index: 2 },
        ];
        const savedLocationSuggestions = updatedLocations.map((loc, i) => ({
          name: loc.name,
          index: i + 3,
        }));

        setSuggestions([...baseSuggestions, ...savedLocationSuggestions]);
      } else {
        console.warn("Unexpected response while updating user settings:", response);
      }
    } catch (error) {
      console.error("Error updating user settings:", error);
    }
  };

  const handleUserPreference = (preference?: string) => {
    if (!preference) {
      setShowInput(true);
      setLocationAs(locationAs);
    } else {
      setShowInput(false);
      setLocationAs(preference);
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);

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
          onPress={() => handleClick("")} // This sends empty string to parent
        >
          <Image
            source={require('../assets/images/serveaso2.png')}
            style={styles.logo}
          />
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <MaterialIcon name="location-on" size={16} color="#3b82f6" style={styles.locationIcon} />
            <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
              {location || 'Set Location'}
            </Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    handleChange(suggestion.name);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{suggestion.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

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
              {auth0User ? (
                <Image
                  source={{ uri: auth0User.picture }}
                  style={styles.userAvatar}
                />
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
          onShow={requestLocationPermission}
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
                    onPress={() => Linking.openSettings()}
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
                    onPress={requestLocationPermission}
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

        {/* Save Location Modal */}
        <Modal
          visible={OpenSaveOptionForSave}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setOpenSaveOptionForSave(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save As</Text>
              <TouchableOpacity onPress={() => setOpenSaveOptionForSave(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.saveAsText}>Save As:</Text>
              <View style={styles.saveOptionsContainer}>
                <TouchableOpacity
                  style={styles.saveOptionButton}
                  onPress={() => handleUserPreference("Home")}
                >
                  <Icon name="home" size={20} color="#3b82f6" />
                  <Text style={styles.saveOptionText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveOptionButton}
                  onPress={() => handleUserPreference("Office")}
                >
                  <Icon name="briefcase" size={20} color="#3b82f6" />
                  <Text style={styles.saveOptionText}>Office</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveOptionButton}
                  onPress={() => handleUserPreference()}
                >
                  <Icon name="map-marker" size={20} color="#3b82f6" />
                  <Text style={styles.saveOptionText}>Others</Text>
                </TouchableOpacity>
              </View>

              {showInput && (
                <TextInput
                  style={styles.locationNameInput}
                  placeholder="Enter Location Name"
                  value={locationAs}
                  onChangeText={setLocationAs}
                />
              )}

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setOpenSaveOptionForSave(false)}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={locationHandleSave}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {menuVisible && (
          <View style={styles.menuDropdown} ref={dropdownRef}>
            {!auth0User ? (
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
                {auth0User?.role === 'admin' && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleDashboardClick}
                  >
                    <Text style={styles.menuItemText}>Dashboard</Text>
                  </TouchableOpacity>
                )}
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
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleProfileClick}
                >
                  <Text style={styles.menuItemText}>User Profile</Text>
                </TouchableOpacity>

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

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: '#d6f0ff',
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
    // padding: 8,
  },
  logo: {
    height: 80,
    width: 170,
    resizeMode: 'contain',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
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
  locationIcon: {
    marginRight: 6,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    width: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
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
  map: {
    width: '100%',
    height: '100%',
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
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '500',
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
  saveAsText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  saveOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  saveOptionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    flex: 1,
    marginHorizontal: 4,
  },
  saveOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#334155',
  },
  locationNameInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
});

export default Head;