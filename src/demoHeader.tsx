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
} from 'react-native';
import axios from 'axios';
import { keys } from './env';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useSelector, useDispatch } from 'react-redux';
import { remove } from './features/userSlice';
import { ADMIN, BOOKINGS, CHECKOUT, DASHBOARD, LOGIN, PROFILE } from './Constants/pagesConstants';
import {  ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface ChildComponentProps {
  sendDataToParent: (data: string) => void;
}

export const demoHeader: React.FC<ChildComponentProps> = ({ sendDataToParent }) => {
  const handleClick = (e: any) => {
    if (e === 'sign_out') {
      dispatch(remove());
      sendDataToParent("");
    } else {
      sendDataToParent(e);
    }
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

  useEffect(() => {
    setLoggedInUser(user);
    console.log("User role is:", user?.role);
  }, [user]);

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords;
//           try {
//             const response = await axios.get(
//               `https://maps.googleapis.com/maps/api/geocode/json`,
//               {
//                 params: {
//                   latlng: `${latitude},${longitude}`,
//                   key: keys.api_key,
//                 },
//               }
//             );
//             const address = response.data.results[0]?.formatted_address;
//             setLocation(address || "Location not found");
//           } catch (error) {
//             console.log("Failed to fetch location: ", error);
//           }
//         },
//         (error: any) => {
//           console.log("Geolocation error: ", error.message);
//           setError(error.message);
//         }
//       );
//     } else {
//       console.log("Geolocation is not supported by this browser.");
//     }
//   }, []);

  useEffect(() => {
    if (inputValue.trim() === "") {
      setSuggestions([]);
      setError(null);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await axios.get(
          "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/autocomplete/json",
          {
            params: {
              input: inputValue,
              key: keys.api_key,
              types: "geocode",
            },
          }
        );

        if (response.data.status === "OK") {
          const sub = response.data.predictions.map((res: any) => res.description);
          setSuggestions(sub);
        } else {
          setError(response.data.error_message || "An error occurred");
          setSuggestions([]);
        }
      } catch (error) {
        console.log("Failed to fetch suggestions");
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [inputValue]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    setLocation(dataFromMap);
    setOpen(false);
  };

  const handleProceedToCheckout = () => {
    sendDataToParent(CHECKOUT);
  };

  function updateLocationFromMap(data: string): void {
    setDataFromMap(data);
  }

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.logoText}>ServEaso</Text>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.locationInput}>
          <MaterialIcon name="location-on" size={16} color="#6b7280" style={styles.locationIcon} />
          <TextInput
            placeholder="Location"
            style={styles.locationTextInput}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => handleClick(CHECKOUT)}>
          <View style={styles.cartBadge}>
            <Text style={styles.badgeText}>{cart?.length || 0}</Text>
          </View>
          <FeatherIcon name="shopping-cart" size={20} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => handleClick(LOGIN)}>
          <FeatherIcon name="user" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {/* You would replace this with your actual MapComponent */}
          <View style={styles.mapPlaceholder}>
            <Text>Map Component would go here</Text>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cartBadge: ViewStyle;
  badgeText: TextStyle;
  modalContainer: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  mapPlaceholder: ViewStyle;
  modalActions: ViewStyle;
  cancelButton: ViewStyle;
  saveButton: ViewStyle;
  buttonText: TextStyle;
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
    paddingHorizontal: Platform.OS === 'ios' ? 24 : 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Dimensions.get('window').height * 0.1,
    elevation: 3, // For Android shadow
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    display: Platform.OS === 'web' ? 'flex' : 'none',
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
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
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
    color: '#000',
  },
});

export default styles;