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
  console.log("Details - Booking Type:", bookingType);

  const dispatch = useDispatch();

  // Get location from Redux store if available
  const location = useSelector((state: any) => {
    return state?.geoLocation?.value;
  });

  console.log("Details - Redux Location:", location);

  // Fixed date formatting function
  const formatDateOnly = (dateInput: any): string => {
    if (!dateInput) return "";
    
    // Handle Date objects by checking for toISOString method
    if (dateInput && typeof dateInput === 'object' && 'toISOString' in dateInput) {
      return dateInput.toISOString().split("T")[0];
    }
    
    // Handle string formats
    if (typeof dateInput === 'string') {
      return dateInput.split("T")[0];
    }
    
    return "";
  };

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

  // Improved performSearch with better error handling and debugging
  const performSearch = async () => {
    try {
      setLoading(true);
      setApiError(null);
      setLocationError(null);
      
      let latitude = 0;
      let longitude = 0;

      // Improved location handling with better debugging
      if (location?.geometry?.location) {
        latitude = location.geometry.location.lat;
        longitude = location.geometry.location.lng;
        console.log("Using Redux geometry location:", latitude, longitude);
      } else if (location?.lat && location?.lng) {
        latitude = location.lat;
        longitude = location.lng;
        console.log("Using Redux direct location:", latitude, longitude);
      } else {
        console.log("No Redux location, getting current location");
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setLocationError("Location permission denied. Please enable location services to find providers near you.");
          setLoading(false);
          return;
        }
        
        const coords = await getCurrentLocation();
        latitude = coords.latitude;
        longitude = coords.longitude;
        console.log("Using current device location:", latitude, longitude);
      }

      // Format dates with fallbacks
      const startDate = formatDateOnly(bookingType?.startDate) || "2025-04-01";
      const endDate = formatDateOnly(bookingType?.endDate) || "2025-04-30";
      const timeslot = bookingType?.timeRange || "09:00-17:00";
      const housekeepingRole = bookingType?.housekeepingRole || selected?.toUpperCase() || "COOK";

      console.log("Search parameters:", {
        startDate,
        endDate,
        timeslot,
        housekeepingRole,
        latitude,
        longitude
      });

      // Build query parameters
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        timeslot,
        housekeepingRole,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });

      const apiUrl = `/api/serviceproviders/search?${queryParams.toString()}`;
      console.log("Full API URL:", apiUrl);

      let response;
      
      // Try the main API endpoint with timeout
      try {
        console.log("Attempting main API call...");
        response = await axiosInstance.get(apiUrl, { timeout: 10000 });
        console.log("Main API response received:", response.data);
        
      } catch (mainError: any) {
        console.warn("Main API failed:", mainError.message);
        console.warn("Error details:", mainError.response?.data);
        
        // Use mock data immediately instead of trying fallback API
        console.log("Using mock data instead of fallback API");
        setApiError("Server is temporarily unavailable. Showing sample providers.");
        
        // Enhanced mock data for better testing
        const mockProviders = [
          {
            id: 1,
            name: "Professional Cleaner",
            rating: 4.5,
            services: ["Cleaning", "Organizing"],
            distance: "2.5 km away",
            price: "$25/hour",
            experience: "3 years",
            image: "https://via.placeholder.com/150",
            description: "Professional cleaning services with eco-friendly products"
          },
          {
            id: 2,
            name: "Expert Cook", 
            rating: 4.8,
            services: ["Cooking", "Meal Prep"],
            distance: "1.8 km away",
            price: "$30/hour",
            experience: "5 years",
            image: "https://via.placeholder.com/150",
            description: "Gourmet cooking with dietary restrictions accommodation"
          },
          {
            id: 3,
            name: "Child Care Specialist",
            rating: 4.7,
            services: ["Baby Sitting", "Child Care"],
            distance: "3.2 km away",
            price: "$20/hour",
            experience: "4 years",
            image: "https://via.placeholder.com/150",
            description: "Certified child care with first aid training"
          }
        ];
        
        setServiceProviderData(mockProviders);
        dispatch(add(mockProviders));
        return;
      }
      
      // Handle successful API response
      if (response.data && response.data.length === 0) {
        console.log("API returned empty results array");
        setServiceProviderData([]);
        setApiError("No providers found matching your criteria.");
      } else if (response.data) {
        console.log(`API returned ${response.data.length} providers`);
        setServiceProviderData(response.data);
        dispatch(add(response.data));
      } else {
        console.log("API returned unexpected response format:", response);
        setApiError("Unexpected response format from server.");
        setServiceProviderData([]);
      }
      
    } catch (error: any) {
      console.error('Unexpected error in performSearch:', error);
      
      // More specific error handling
      if (error.code === 'ECONNABORTED') {
        setApiError("Request timeout. Please check your internet connection.");
      } else if (error.response?.status === 500) {
        setApiError("Server error. Please try again later.");
      } else if (error.response?.status === 404) {
        setApiError("Service not found. Please check the API endpoint.");
      } else if (error.message?.includes('Network Error')) {
        setApiError("Network error. Please check your internet connection.");
      } else {
        setApiError("Unable to fetch service providers. Please try again.");
      }
      
      // Show user-friendly alert
      Alert.alert(
        "Connection Issue", 
        "We're having trouble connecting to our servers. Showing sample providers for demonstration.",
        [
          {
            text: "Try Again",
            onPress: retrySearch
          },
          {
            text: "Continue with Demo",
            onPress: () => {
              // Load mock data on user confirmation
              loadMockData();
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Separate function to load mock data
  const loadMockData = () => {
    const mockProviders = [
      {
        id: 1,
        name: "Demo Cleaner",
        rating: 4.3,
        services: ["Cleaning"],
        distance: "Demo distance",
        price: "$20/hour",
        experience: "2 years",
        image: "https://via.placeholder.com/150",
        description: "Demo cleaning service"
      },
      {
        id: 2,
        name: "Demo Cook", 
        rating: 4.6,
        services: ["Cooking"],
        distance: "Demo distance",
        price: "$25/hour",
        experience: "3 years",
        image: "https://via.placeholder.com/150",
        description: "Demo cooking service"
      }
    ];
    
    setServiceProviderData(mockProviders);
    dispatch(add(mockProviders));
    setApiError("Using demo data. Server connection unavailable.");
  };

  const retrySearch = () => {
    setLocationError(null);
    setApiError(null);
    setServiceProviderData([]);
    performSearch();
  };

  // Handle checkout data
  const handleCheckoutData = (data: any) => {
    console.log("Received checkout data:", data);
    if (checkoutItem) {
      checkoutItem(data);
    }
  };

  // Handle selected provider
  const handleSelectedProvider = (provider: any) => {
    console.log("Provider selected:", provider.name);
    if (selectedProvider) {
      selectedProvider(provider);
    }
  };

  // Updated useEffect hooks
  useEffect(() => {
    console.log("Selected provider type changed:", selected);
    setSelectedProviderType(selected || "");
  }, [selected]);

  useEffect(() => {
    console.log("Location or provider type changed, performing search");
    performSearch();
  }, [selectedProviderType, location]);

  return (
    <View style={styles.mainContainer}>
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.placeholderText}>Searching providers near you...</Text>
        </View>
      ) : locationError ? (
        <View style={styles.centeredContainer}>
          <Icon name="location-off" size={80} color="#FF3B30" />
          <Text style={styles.errorText}>{locationError}</Text>
          <Text style={styles.retryText} onPress={retrySearch}>
            Tap to try again
          </Text>
        </View>
      ) : Array.isArray(serviceProviderData) && serviceProviderData.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {apiError && (
            <View style={styles.apiWarning}>
              <Icon name="info" size={20} color="#FFA500" />
              <Text style={styles.apiWarningText}>{apiError}</Text>
            </View>
          )}
          {serviceProviderData.map((provider, index) => (
            <View key={provider.id || index} style={styles.providerContainer}>
              <ProviderDetails 
                {...provider} 
                onSelect={() => handleSelectedProvider(provider)}
                onCheckout={handleCheckoutData}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.centeredContainer}>
          <Icon name="search-off" size={80} color="#8E8E93" />
          <Text style={styles.placeholderText}>
            {apiError ? apiError : "No providers found near you"}
          </Text>
          <Text style={styles.retryText} onPress={retrySearch}>
            Tap to search again
          </Text>
          <Text style={[styles.retryText, {marginTop: 0}]} onPress={loadMockData}>
            Or use demo data
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