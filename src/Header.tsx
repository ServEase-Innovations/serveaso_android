import React, { useState, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Button,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker } from 'react-native-maps';
import { Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import { NativeModules } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import UserProfile from './UserProfile'; 
import { useSelector } from 'react-redux';

interface HeaderProps {
  goToLandingPage: () => void;
  onLoginRequest: () => void;
  onProfileClick: () => void;
  isLoggedIn: boolean;
  onSignOut: () => void;
  onDashboardClick: () => void;
  onBookingHistoryClick: () => void;
}

Geocoder.init('AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk');

export const Header: React.FC<HeaderProps> = ({
  onLoginRequest,
  onProfileClick,
  goToLandingPage,
  isLoggedIn,
  onSignOut,
  onDashboardClick,
  onBookingHistoryClick,
}) => {
  const [location, setLocation] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showGPSButton, setShowGPSButton] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const user = useSelector((state: any) => state.user?.value);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const [fineStatus, coarseStatus] = await Promise.all([
          request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION),
          request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION),
        ]);

        if (Platform.Version >= 31) {
          await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        }

        return fineStatus === RESULTS.GRANTED || coarseStatus === RESULTS.GRANTED;
      } else {
        const iosStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return iosStatus === RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
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

  const fetchLocation = () => {
    setLoading(true);
    setShowGPSButton(false);
    
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
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
              onPress: () => NativeModules.LocationSettings.openLocationSettings(),
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
              onPress: () => NativeModules.LocationSettings.showLocationSettingsDialog(),
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
    setModalVisible(false);
  };
  
  const handleProfileClick = () => {
    setMenuVisible(false);
    setShowUserProfile(true);
  };

  const handleCloseProfile = () => {
    setShowUserProfile(false);
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  const handleOverlayPress = () => {
    setMenuVisible(false);
  };

  return (
    <View style={{ position: 'relative' }}>
      {menuVisible && (
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={goToLandingPage}>
            <Image
              source={require('../assets/images/pic2.png')}
              style={styles.logoStyle}
            />
          </TouchableOpacity>
          <Text style={styles.serveaseText}>ServEase</Text>
        </View>

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <View style={styles.locationInput}>
              <MaterialIcons name="location-on" size={24} color="blue" />
              <Text>{location || 'Set Location'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          onShow={fetchLocationWithChecks}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.locationTitleText}>{location || 'Set Your Location'}</Text>

              {isCheckingLocation ? (
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="large" color="#007BFF" />
                  <Text style={styles.statusText}>Checking location services...</Text>
                </View>
              ) : loading ? (
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="large" color="#007BFF" />
                  <Text style={styles.statusText}>Getting your location...</Text>
                </View>
              ) : showGPSButton ? (
                <View style={styles.statusContainer}>
                  <MaterialIcons name="location-off" size={50} color="red" />
                  <Text style={styles.statusText}>Location services are disabled</Text>
                  <View style={styles.button}>
                    <Button
                      title="Enable Location Services"
                      onPress={handleOpenSettings}
                      color="#007BFF"
                    />
                  </View>
                </View>
              ) : (
                <>
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

                  <View style={styles.infoBox}>
                    <Text style={styles.text}>Latitude: {latitude}</Text>
                    <Text style={styles.text}>Longitude: {longitude}</Text>
                    <Text style={styles.text}>Address: {address}</Text>

                    <View style={styles.buttonRow}>
                      <View style={styles.button}>
                        <Button
                          title="Refresh Location"
                          onPress={fetchLocationWithChecks}
                          color="#6c757d"
                        />
                      </View>
                      <View style={styles.button}>
                        <Button
                          title="Use This Location"
                          onPress={handleLocationSave}
                          color="#28a745"
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={styles.menuIcon}
          onPress={handleMenuPress}>
          <AntDesign name="profile" size={24} color="black" />
        </TouchableOpacity>

        {menuVisible && (
          <View style={styles.menuDropdown}>
            {!isLoggedIn ? (
              <>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    setMenuVisible(false);
                    onLoginRequest();
                  }}
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
                  onPress={() => {
                    setMenuVisible(false);
                    handleProfileClick();
                  }}
                >
                  <Text style={styles.menuItemText}>Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    setMenuVisible(false);
                    onBookingHistoryClick();
                  }}
                >
                  <Text style={styles.menuItemText}>Booking History</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    setMenuVisible(false);
                    onDashboardClick();
                  }}
                >
                  <Text style={styles.menuItemText}>Dashboard</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    setMenuVisible(false);
                    onSignOut();
                  }}
                >
                  <Text style={styles.menuItemText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
      
      <Modal
        animationType="slide"
        transparent={false}
        visible={showUserProfile}
        onRequestClose={handleCloseProfile}
      >
        <View style={styles.profileModal}>
          <UserProfile goBack={handleCloseProfile} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgb(200, 228, 255)',
    zIndex: 1,
  },
  logoContainer: {
    flex: 1,
  },
  logoStyle: {
    width: 50,
    height: 50,
  },
  serveaseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#075aa8',
  },
  inputContainer: {
    flex: 2,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  menuIcon: {
    flex: 1,
    alignItems: 'flex-end',
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  locationTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 10,
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
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
});