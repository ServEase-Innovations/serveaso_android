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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import MapView, { Marker } from 'react-native-maps';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import { NativeModules } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import UserProfile from './UserProfile'; 

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

  const requestLocationPermission = async (): Promise<boolean> => {
    const result = await request(
      Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      })!
    );
    return result === RESULTS.GRANTED;
  };

  const isLocationEnabled = async (): Promise<boolean> => {
    return await DeviceInfo.isLocationEnabled();
  };

  const showLocationSettingsDialog = async (): Promise<void> => {
    try {
      await NativeModules.LocationSettings.showLocationSettingsDialog();
    } catch (err) {
      console.warn('Location settings error:', err);
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
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const checkAndFetchLocation = async () => {
    const permission = await requestLocationPermission();
    if (!permission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    const enabled = await isLocationEnabled();

    if (!enabled) {
      setShowGPSButton(true);
      await showLocationSettingsDialog();
    } else {
      setShowGPSButton(false);
      setTimeout(() => {
        fetchLocation();
      }, 3000);
    }
  };

  useEffect(() => {
    checkAndFetchLocation();
  }, []);

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


  return (
    <View style={{ position: 'relative' }}>
      {menuVisible && (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
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
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text numberOfLines={1} style={{ maxWidth: 200 }}>
                {location || 'Set Location'}
              </Text>

              {loading || latitude === null || longitude === null ? (
                <ActivityIndicator size="large" color="#007BFF" />
              ) : (
                <>
                  <MapView
                    style={styles.map}
                    region={{
                      latitude,
                      longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}>
                    <Marker
                      coordinate={{ latitude, longitude }}
                      title="You are here"
                    />
                  </MapView>

                  <View style={styles.infoBox}>
                    <Text style={styles.text}>Latitude: {latitude}</Text>
                    <Text style={styles.text}>Longitude: {longitude}</Text>
                    <Text style={styles.text}>Address: {address}</Text>

                    {showGPSButton && (
                      <View style={styles.button}>
                        <Button
                          title="Turn on GPS (Location Services)"
                          onPress={showLocationSettingsDialog}
                          color="#007BFF"
                        />
                      </View>
                    )}

                    <View style={styles.button}>
                      <Button
                        title="Use This Location"
                        onPress={handleLocationSave}
                        color="#28a745"
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => setMenuVisible(!menuVisible)}>
          <AntDesign name="profile" size={24} color="black" />
        </TouchableOpacity>

       {menuVisible && (
  <View style={styles.menuDropdown}>
    {!isLoggedIn ? (
      <>
        <TouchableOpacity style={styles.menuItem} onPress={() => {
          setMenuVisible(false);
          onLoginRequest();
        }}>
          <Text style={styles.menuItemText}>Login / Signup</Text>
        </TouchableOpacity>
       
         <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => {
            setMenuVisible(false);
            handleProfileClick();
          }}
        >
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
         // In your Header component's menu dropdown JSX:
<TouchableOpacity style={styles.menuItem} onPress={() => {
  setMenuVisible(false);
  onBookingHistoryClick();
}}>
  <Text style={styles.menuItemText}>Booking History</Text>
</TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => {
  setMenuVisible(false);
  onDashboardClick();
}}>
  <Text style={styles.menuItemText}>Dashboard</Text>
</TouchableOpacity>
 <TouchableOpacity style={styles.menuItem} onPress={() => {
          setMenuVisible(false);
          onSignOut();
        }}>
          <Text style={styles.menuItemText}>Sign Out</Text>
        </TouchableOpacity>

      </>
    ) : (
      <>
       <TouchableOpacity style={styles.menuItem} onPress={() => {
          setMenuVisible(false);
          Alert.alert('Terms & Conditions clicked');
        }}>
          <Text style={styles.menuItemText}>Terms & Conditions</Text>
        </TouchableOpacity>

       <TouchableOpacity style={styles.menuItem} onPress={() => {
          setMenuVisible(false);
          Alert.alert('Contact Us clicked');
        }}>
          <Text style={styles.menuItemText}>Contact Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => {
          setMenuVisible(false);
          Alert.alert('Contact Us clicked');
        }}>
          <Text style={styles.menuItemText}>Contact Us</Text>
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
    height: '100%',
    width: '100%',
    zIndex: 999,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgb(200, 228, 255)',
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
    width: 300,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    borderRadius: 10,
  },
  infoBox: {
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
  button: {
    marginTop: 10,
  },
});
