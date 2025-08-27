import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
} from "react-native";
import Geolocation from '@react-native-community/geolocation';
import axiosInstance from "./axiosInstance";
import ProviderDetails from "./ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { add } from "./features/detailsDataSlice";
import { usePricingFilterService } from './utils/PricingFilter';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DetailsProps {
  sendDataToParent: (data: string) => void;
  selected?: string;
  checkoutItem?: (data: any) => void;
  selectedProvider?: (data: any) => void;
}

export const NewDetails: React.FC<DetailsProps> = ({
  sendDataToParent,
  selected,
  checkoutItem,
  selectedProvider,
}) => {
  const [ServiceProvidersData, setServiceProvidersData] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [searchData, setSearchData] = useState<any>();
  const [serviceProviderData, setServiceProviderData] = useState<any[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { getBookingType, getPricingData, getFilteredPricing } = usePricingFilterService();
  const bookingType = getBookingType();
  console.log("Details:", bookingType);

  const dispatch = useDispatch();

  // Get location from Redux store if available
  const location = useSelector((state: any) => {
    return state?.geoLocation?.value;
  });

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs access to your location to find service providers near you",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
          setLocationError(error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setApiError(null);
      setLocationError(null);
      
      let latitude = 0;
      let longitude = 0;

      // Use location from Redux if available, otherwise get current location
      if (location) {
        const latLng = location.location?.geometry?.location;
        console.log("Location from Redux:", JSON.stringify(latLng));
        latitude = latLng?.lat || 0;
        longitude = latLng?.lng || 0;
      } else {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setLocationError("Location permission denied. Please enable location services to find providers near you.");
          setLoading(false);
          return;
        }
        
        const coords = await getCurrentLocation();
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      console.log("Using coordinates - Latitude:", latitude, "Longitude:", longitude);

      // Build query parameters with housekeeping role and booking details
      const queryParams = new URLSearchParams({
        startDate: bookingType?.startDate || '2025-04-01',
        endDate: bookingType?.endDate || '2025-04-30',
        timeslot: bookingType?.timeRange || '16:37-16:37',
        housekeepingRole: bookingType?.housekeepingRole || selected?.toUpperCase() || "COOK",
        latitude: latitude.toString(),
        longitude: longitude.toString()
      });

      // Try the main API endpoint first
      let response;
      try {
        response = await axiosInstance.get(
          `/api/serviceproviders/search?${queryParams.toString()}`
        );
        console.log("Response from main API:", response.data);
      } catch (mainError: any) {
        console.warn("Main API failed, trying fallback:", mainError.message);
        
        // Fallback to a different endpoint or mock data
        try {
          // Try a different endpoint format
          response = await axiosInstance.get(
            `/serviceproviders/search?${queryParams.toString()}`
          );
        } catch (fallbackError: any) {
          console.error("Fallback API also failed:", fallbackError.message);
          
          // If both fail, use mock data for demonstration
          if (fallbackError.response?.status === 500) {
            setApiError("Server is temporarily unavailable. Showing sample providers.");
            
            // Mock data as fallback
            const mockProviders = [
              {
                id: 1,
                name: "Sample Provider 1",
                rating: 4.5,
                services: ["Cleaning", "Cooking"],
                distance: "2.5 km away",
                price: "$25/hour",
                image: "https://via.placeholder.com/150"
              },
              {
                id: 2,
                name: "Sample Provider 2", 
                rating: 4.2,
                services: ["Baby Sitting", "Elder Care"],
                distance: "3.1 km away",
                price: "$30/hour",
                image: "https://via.placeholder.com/150"
              }
            ];
            
            setServiceProviderData(mockProviders);
            dispatch(add(mockProviders));
            return;
          }
          
          throw fallbackError; // Re-throw if it's not a 500 error
        }
      }
      
      if (response.data.length === 0) {
        setServiceProviderData([]);
      } else {
        setServiceProviderData(response.data);
        dispatch(add(response.data));
      }
    } catch (error: any) {
      console.error('Error:', error.message || error);
      
      if (error.response?.status === 500) {
        setApiError("Server error. Please try again later.");
      } else if (error.response?.status === 404) {
        setApiError("Service not found. Please check your connection.");
      } else {
        setLocationError(error.message || "Failed to get location or fetch providers");
      }
      
      Alert.alert(
        "Error", 
        "Unable to fetch service providers. Please check your connection and try again.",
        [
          {
            text: "Try Again",
            onPress: retrySearch
          },
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const retrySearch = () => {
    setLocationError(null);
    setApiError(null);
    performSearch();
  };

  useEffect(() => {
    performSearch();
  }, [selected, location]);

  const handleSelectedProvider = (provider: any) => {
    if (selectedProvider) {
      selectedProvider(provider);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.placeholderText}>Searching providers near you...</Text>
        </View>
      ) : locationError || apiError ? (
        <View style={styles.centeredContainer}>
          <Icon name="error-outline" size={80} color="#FF3B30" />
          <Text style={styles.errorText}>{locationError || apiError}</Text>
          <Text style={styles.retryText} onPress={retrySearch}>
            Tap to try again
          </Text>
        </View>
      ) : Array.isArray(serviceProviderData) && serviceProviderData.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {apiError && (
            <View style={styles.apiWarning}>
              <Icon name="warning" size={20} color="#FFA500" />
              <Text style={styles.apiWarningText}>{apiError}</Text>
            </View>
          )}
          {serviceProviderData.map((provider, index) => (
            <View key={index} style={styles.providerContainer}>
              <ProviderDetails 
                {...provider} 
                onSelect={() => handleSelectedProvider(provider)}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.centeredContainer}>
          <Icon name="search-off" size={80} color="#8E8E93" />
          <Text style={styles.placeholderText}>No providers found near you</Text>
          <Text style={styles.retryText} onPress={retrySearch}>
            Tap to search again
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  providerContainer: {
    paddingTop: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 20,
  },
  retryText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
    padding: 10,
  },
  apiWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  apiWarningText: {
    marginLeft: 8,
    color: '#856404',
    fontSize: 14,
    flex: 1,
  },
});

export default NewDetails;