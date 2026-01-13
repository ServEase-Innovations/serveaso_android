import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import axiosInstance from '../services/axiosInstance';
import ProviderDetails from './ProviderDetails';
import { add } from '../features/detailsDataSlice';
import { CONFIRMATION } from '../Constants/pagesConstants';
import { usePricingFilterService } from '../utils/PricingFilter';

interface DetailsViewProps {
  sendDataToParent: (data: string) => void;
  selected?: string;
  checkoutItem?: (data: any) => void;
  selectedProvider?: (data: any) => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({
  sendDataToParent,
  selected,
  checkoutItem,
  selectedProvider,
}) => {
  const [serviceProvidersData, setServiceProvidersData] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState('');
  const [searchData, setSearchData] = useState<any>();
  const [serviceProviderData, setServiceProviderData] = useState<any[]>([]);
  
  const { getBookingType, getPricingData, getFilteredPricing } = usePricingFilterService();
  const bookingType = getBookingType();
  const dispatch = useDispatch();

  const location = useSelector((state: any) => {
    console.log('🌍 Retrieving geolocation from Redux state:', state);
    return state?.geoLocation?.value;
  });

  const handleCheckoutData = (data: any) => {
    console.log('Received checkout data:', data);

    if (checkoutItem) {
      checkoutItem(data);
    }
  };

  // NEW: Enhanced useEffect to include all dependencies from React code
  useEffect(() => {
    console.log('🔄 DetailsView useEffect triggered');
    console.log('📅 Booking type:', bookingType);
    console.log('📍 Location:', location);
    
    performSearch();
  }, [selectedProviderType, location, bookingType]); // Added bookingType dependency

  // NEW: Handle selected prop changes
  useEffect(() => {
    console.log('Selected ...', selected);
    setSelectedProviderType(selected || '');

    // Only fetch if we have a selected provider type
    if (selected) {
      fetchServiceProvidersByRole(selected);
    }
  }, [selected]);

  // NEW: Fetch service providers by role
  const fetchServiceProvidersByRole = async (role: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        'api/serviceproviders/role?role=' + role.toUpperCase()
      );
      setServiceProvidersData(response?.data);
      dispatch(add(response?.data));
    } catch (err) {
      console.error('There was a problem with the fetch operation:', err);
      Alert.alert('Error', 'Failed to fetch service providers');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    sendDataToParent('');
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const handleSearchResults = (data: any[]) => {
    setSearchResults(data);
    toggleDrawer(false);
  };

  const handleSelectedProvider = (provider: any) => {
    if (selectedProvider) {
      selectedProvider(provider);
    }
    sendDataToParent(CONFIRMATION);
  };

  // NEW: Enhanced handleSearch method from React code
  const handleSearch = (formData: { serviceType: string; startTime: string; endTime: string }) => {
    console.log('Search data received in MainComponent:', formData);
    setSearchData(formData);
    // Could trigger a new search based on form data
  };

  // NEW: Format date only method from React code
  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  // UPDATED: performSearch method to match React code structure
  const performSearch = async () => {
    try {
      setLoading(true);

      console.log('📋 Booking Type in performSearch:', bookingType);
      console.log('📍 Location object:', location?.geometry?.location);

      let latitude = 0;
      let longitude = 0;

      // Extract coordinates based on location structure
      if (location?.geometry?.location) {
        latitude = location?.geometry?.location?.lat;
        longitude = location?.geometry?.location?.lng;
      } else if (location?.lat && location?.lng) {
        latitude = location?.lat;
        longitude = location?.lng;
      }

      console.log('📌 Extracted coordinates - Latitude:', latitude, 'Longitude:', longitude);

      // Use bookingType from pricing filter service
      const startDate = formatDateOnly(bookingType?.startDate) || '2025-04-01';
      const endDate = formatDateOnly(bookingType?.endDate) || '2025-04-30';
      const timeslot = bookingType?.timeRange || '16:37-16:37';
      const housekeepingRole = bookingType?.housekeepingRole || 'COOK';

      console.log('🔍 SEARCH PARAMETERS:');
      console.log('   Start Date:', startDate);
      console.log('   End Date:', endDate);
      console.log('   Timeslot:', timeslot);
      console.log('   Role:', housekeepingRole);
      console.log('   Latitude:', latitude);
      console.log('   Longitude:', longitude);

      // NEW: Check if we have valid coordinates
      if (latitude === 0 && longitude === 0) {
        console.warn('⚠️ No valid coordinates found, using default search');
        Alert.alert('Location Required', 'Please enable location services to find providers near you');
        return;
      }

      // UPDATED: Using the new API endpoint from React code
      try {
        // Option 1: Using the original endpoint
        const queryParams = new URLSearchParams({
          startDate: startDate,
          endDate: endDate,
          timeslot: timeslot,
          housekeepingRole: housekeepingRole,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        });

        console.log('🌐 Calling API with query params:', queryParams.toString());

        const response = await axiosInstance.get(
          `/api/serviceproviders/search?${queryParams.toString()}`
        );

        console.log('✅ API Response received');
        console.log('📊 Response data structure:', typeof response.data);

        if (response.data && Array.isArray(response.data)) {
          if (response.data.length === 0) {
            console.log('❌ No providers found with current filters');
            setServiceProviderData([]);
          } else {
            console.log(`🎉 Found ${response.data.length} providers`);
            setServiceProviderData(response.data);
          }
        } else if (response.data && response.data.providers) {
          // Handle response with providers object (from new API)
          const providers = response.data.providers;
          if (Array.isArray(providers) && providers.length > 0) {
            console.log(`🎉 Found ${providers.length} providers in providers array`);
            setServiceProviderData(providers);
          } else {
            console.log('❌ No providers found in providers array');
            setServiceProviderData([]);
          }
        } else {
          console.log('❌ Unexpected response format');
          setServiceProviderData([]);
        }
      } catch (apiError: any) {
        console.error('❌ API Error:', apiError);
        console.log('💡 Error response:', apiError.response?.data);
        
        // Fallback to alternative search method
        await performAlternativeSearch(startDate, endDate, housekeepingRole, latitude, longitude);
      }
    } catch (error: any) {
      console.error('❌ Geolocation or API error:', error.message || error);
      console.log('💡 Error details:', error.response?.data || error);
      Alert.alert('Error', 'Failed to search for providers');
      setServiceProviderData([]);
    } finally {
      setLoading(false);
      console.log('🏁 Search completed, loading state set to false');
    }
  };

  // NEW: Alternative search method from React code
  const performAlternativeSearch = async (
    startDate: string, 
    endDate: string, 
    housekeepingRole: string, 
    latitude: number, 
    longitude: number
  ) => {
    try {
      console.log('🔄 Trying alternative search method...');
      
      // Alternative API call structure similar to React code
      const response = await axiosInstance.post('https://providers-08ug.onrender.com/api/service-providers/nearby-monthly', {
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: 10,
        startDate: startDate,
        endDate: endDate,
        preferredStartTime: bookingType?.timeRange ? bookingType.timeRange.split('-')[0] : "16:37",
        role: housekeepingRole,
        serviceDurationMinutes: 60
      });

      console.log('✅ Alternative API Response:', response.data);

      if (response.data && response.data.providers) {
        const providers = response.data.providers;
        if (Array.isArray(providers) && providers.length > 0) {
          console.log(`🎉 Found ${providers.length} providers via alternative search`);
          setServiceProviderData(providers);
        } else {
          console.log('❌ No providers found via alternative search');
          setServiceProviderData([]);
        }
      } else {
        console.log('❌ No providers data in alternative response');
        setServiceProviderData([]);
      }
    } catch (error: any) {
      console.error('❌ Alternative search failed:', error);
      setServiceProviderData([]);
    }
  };

  // NEW: Handle service provider selection from ProviderDetails
  const handleProviderSelection = (provider: any) => {
    console.log('Provider selected:', provider);
    
    // Dispatch to Redux if needed
    const bookingData = {
      serviceproviderId: provider.serviceproviderId || provider.id,
      eveningSelection: provider.eveningSelectionTime,
      morningSelection: provider.morningSelectionTime,
      ...bookingType
    };
    
    // Call parent callback if provided
    if (selectedProvider) {
      selectedProvider(provider);
    }
    
    // Navigate to confirmation
    sendDataToParent(CONFIRMATION);
  };

  console.log('📦 Service Providers Data:', serviceProviderData);
  console.log('🔄 Current loading state:', loading);
  console.log('🎯 Selected provider type:', selectedProviderType);

  const renderContent = () => {
    console.log('🎨 Rendering content...');
    console.log('📊 Service provider data length:', serviceProviderData?.length || 0);
    console.log('⏳ Loading state:', loading);

    if (loading) {
      console.log('🔄 Rendering loading state');
      return (
        <View style={styles.centeredContainer}>
          <Image 
            // source={require('./../../../assets/images/search.gif')} 
            style={styles.loadingImage}
          />
          <Text style={styles.loadingText}>Searching providers near you...</Text>
          <ActivityIndicator size="large" color="#007bff" style={styles.activityIndicator} />
        </View>
      );
    } else if (Array.isArray(serviceProviderData) && serviceProviderData.length > 0) {
      console.log('✅ Rendering providers list, count:', serviceProviderData.length);
      return (
        <>
          <Text style={styles.resultsCount}>
            Found {serviceProviderData.length} provider{serviceProviderData.length !== 1 ? 's' : ''} near you
          </Text>
          {serviceProviderData.map((provider, index) => (
            <View key={`provider-${index}-${provider.serviceproviderId || provider.id}`} style={styles.providerContainer}>
              <ProviderDetails 
                {...provider} 
                selectedProvider={handleProviderSelection}
                sendDataToParent={sendDataToParent}
                housekeepingRole={provider.housekeepingRole || bookingType?.housekeepingRole}
              />
            </View>
          ))}
        </>
      );
    } else {
      console.log('❌ Rendering no data state');
      return (
        <View style={styles.centeredContainer}>
          <Image 
            // source={require('../../assets/images/no-results.png')} 
            style={styles.noDataImage}
          />
          <Text style={styles.noDataTitle}>Service Not Available in Your Area</Text>
          <Text style={styles.noDataText}>
            Currently, we are unable to provide services in your location. 
            We hope to be available in your area soon.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => sendDataToParent('')}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.retryButton}
            onPress={performSearch}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          serviceProviderData.length === 0 && styles.emptyScrollViewContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={performSearch}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  emptyScrollViewContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerContainer: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: height * 0.7,
  },
  loadingImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  activityIndicator: {
    marginTop: 10,
  },
  noDataImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
    opacity: 0.7,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 140,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    minWidth: 140,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
});

export default DetailsView;