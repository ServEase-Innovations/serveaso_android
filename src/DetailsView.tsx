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
  Image,
} from "react-native";
import Geolocation from '@react-native-community/geolocation';
import axiosInstance from "./axiosInstance";
import ProviderDetails from "./ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { add } from "./features/detailsDataSlice";
import { usePricingFilterService } from './utils/PricingFilter';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CONFIRMATION } from "./Constants/pagesConstants";

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

  // Enhanced date formatting function from React web version
  const formatDateOnly = (dateInput: any): string => {
    if (!dateInput) return "";
    
    // Handle Date objects by checking for toISOString method
    if (dateInput && typeof dateInput === 'object' && 'toISOString' in dateInput) {
      return dateInput.toISOString().split("T")[0];
    }
    
    // Handle string formats - improved from React web version
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

      // Enhanced location handling from React web version
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
//       || "2025-04-01"
// || "2025-04-30"
// || "09:00-17:00"
      // Format dates with fallbacks - improved from React web version
      const startDate = formatDateOnly(bookingType?.startDate) ;
      const endDate = formatDateOnly(bookingType?.endDate) ;
      const timeslot = bookingType?.timeRange ;
      const housekeepingRole = bookingType?.housekeepingRole || selected?.toUpperCase() || "COOK";

      console.log("Search parameters:", {
        startDate,
        endDate,
        timeslot,
        housekeepingRole,
        latitude,
        longitude
      });

      // Build query parameters - using URLSearchParams like React web version
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
        response = await axiosInstance.get(apiUrl, { 
          timeout: 15000,
        });
        console.log("Main API response received:", response.status, response.data);
        
      } catch (mainError: any) {
        console.warn("Main API failed:", mainError.message);
        console.warn("Error code:", mainError.code);
        console.warn("Error details:", mainError.response?.data);
        
        // Enhanced error handling from React web version
        if (mainError.code === 'ECONNABORTED') {
          setApiError("Request timeout. Server is taking too long to respond.");
        } else if (mainError.message?.includes('Network Error') || mainError.message?.includes('network')) {
          setApiError("Network error. Please check your internet connection and try again.");
        } else if (mainError.response?.status === 500) {
          setApiError("Server error. Please try again later.");
        } else if (mainError.response?.status === 404) {
          setApiError("Service not available. Please try again later.");
        } else {
          setApiError("Unable to connect to server. Please check your connection.");
        }
        
        // Use mock data
        console.log("Using mock data due to API failure");
        loadMockData();
        return;
      }
      
      // Handle successful API response - improved logic from React web version
      if (response.data && response.data.length === 0) {
        console.log("API returned empty results array");
        setServiceProviderData([]);
        setApiError("No providers found matching your criteria. Try adjusting your search parameters.");
      } else if (response.data) {
        console.log(`API returned ${response.data.length} providers`);
        setServiceProviderData(response.data);
        dispatch(add(response.data));
        setApiError(null);
      } else {
        console.log("API returned unexpected response format:", response);
        setApiError("Unexpected response format from server.");
        setServiceProviderData([]);
      }
      
    } catch (error: any) {
      console.error('Unexpected error in performSearch:', error);
      
      // Final fallback - always load mock data on any error
      console.log("Final fallback - loading mock data");
      loadMockData();
      
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
            style: "cancel"
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Enhanced mock data with proper structure for ProviderDetails
  const loadMockData = () => {
    const mockProviders = [
      {
        serviceproviderId: "1",
        firstName: "Priya",
        lastName: "Sharma",
        gender: "FEMALE",
        dob: "1990-05-15",
        diet: "VEG",
        housekeepingRole: "COOK",
        language: "Hindi, English",
        experience: "5 years",
        otherServices: "Meal Planning, Diet Consultation",
        availableTimeSlots: ["08:00", "09:00", "10:00", "11:00", "17:00", "18:00", "19:00"],
        rating: 4.8,
        distance: "2.1 km away",
        price: "₹3500/month"
      },
      {
        serviceproviderId: "2",
        firstName: "Anita",
        lastName: "Patel", 
        gender: "FEMALE",
        dob: "1988-12-20",
        diet: "BOTH",
        housekeepingRole: "MAID",
        language: "Hindi, Gujarati",
        experience: "3 years",
        otherServices: "Deep Cleaning, Organization",
        availableTimeSlots: ["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"],
        rating: 4.6,
        distance: "1.8 km away",
        price: "₹2800/month"
      },
      {
        serviceproviderId: "3",
        firstName: "Sunita",
        lastName: "Kumar",
        gender: "FEMALE",
        dob: "1992-08-10",
        diet: "VEG",
        housekeepingRole: "NANNY",
        language: "Hindi, English, Bengali",
        experience: "4 years",
        otherServices: "Child Education, Activity Planning",
        availableTimeSlots: ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
        rating: 4.9,
        distance: "3.2 km away",
        price: "₹3200/month"
      },
      {
        serviceproviderId: "4",
        firstName: "Rajesh",
        lastName: "Verma",
        gender: "MALE",
        dob: "1985-03-25",
        diet: "NONVEG",
        housekeepingRole: "COOK",
        language: "Hindi, English, Punjabi",
        experience: "7 years",
        otherServices: "North Indian Cuisine, Tandoor Specialties",
        availableTimeSlots: ["07:00", "08:00", "09:00", "18:00", "19:00", "20:00"],
        rating: 4.7,
        distance: "4.5 km away",
        price: "₹4000/month"
      }
    ];
    
    setServiceProviderData(mockProviders);
    dispatch(add(mockProviders));
    setApiError("Using demo data. Real-time search unavailable.");
  };

  const retrySearch = () => {
    setLocationError(null);
    setApiError(null);
    setServiceProviderData([]);
    performSearch();
  };

  // Handle checkout data - from React web version
  const handleCheckoutData = (data: any) => {
    console.log("Received checkout data:", data);
    if (checkoutItem) {
      checkoutItem(data);
    }
  };

  // Handle selected provider - improved from React web version
  const handleSelectedProvider = (provider: any) => {
    console.log("Provider selected:", provider.firstName);
    if (selectedProvider) {
      selectedProvider(provider);
    }
    sendDataToParent(CONFIRMATION);
  };

  // Updated useEffect hooks - improved dependency handling
  useEffect(() => {
    console.log("Selected provider type changed:", selected);
    setSelectedProviderType(selected || "");
  }, [selected]);

  useEffect(() => {
    console.log("Location or provider type changed, performing search");
    performSearch();
  }, [selectedProviderType, location]);

  // Enhanced render method inspired by React web version
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.placeholderText}>Searching providers near you...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      );
    }

    if (locationError) {
      return (
        <View style={styles.centeredContainer}>
          <Icon name="location-off" size={80} color="#FF3B30" />
          <Text style={styles.errorText}>{locationError}</Text>
          <Text style={styles.retryText} onPress={retrySearch}>
            Tap to try again
          </Text>
        </View>
      );
    }

    if (Array.isArray(serviceProviderData) && serviceProviderData.length > 0) {
      return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {apiError && (
            <View style={styles.apiWarning}>
              <Icon name="info" size={20} color="#FFA500" />
              <Text style={styles.apiWarningText}>{apiError}</Text>
            </View>
          )}
          {serviceProviderData.map((provider, index) => (
            <View key={provider.serviceproviderId || provider.id || `provider-${index}`} style={styles.providerContainer}>
              <ProviderDetails 
                {...provider} 
                selectedProvider={handleSelectedProvider}
                housekeepingRole={provider.housekeepingRole || selected?.toUpperCase() || "COOK"}
              />
            </View>
          ))}
        </ScrollView>
      );
    }

    // Enhanced no data state with images like React web version
    return (
      <View style={styles.centeredContainer}>
        <Icon name="search-off" size={80} color="#8E8E93" />
        {/* You can also use local images like: */}
        {/* <Image source={require('./assets/no-data.png')} style={styles.noDataImage} /> */}
        <Text style={styles.placeholderText}>
          {apiError ? apiError : "No providers found near you"}
        </Text>
        <Text style={styles.retryText} onPress={retrySearch}>
          Tap to search again
        </Text>
        {/* <Text style={[styles.retryText, {marginTop: 0}]} onPress={loadMockData}>
          Or use demo data
        </Text> */}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {renderContent()}
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
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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
  noDataImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
});

export default NewDetails;