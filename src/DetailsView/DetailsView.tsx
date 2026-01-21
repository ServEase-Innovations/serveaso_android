import React, { useEffect, useState, useCallback } from 'react';
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  
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

  useEffect(() => {
    console.log('🔄 DetailsView useEffect triggered');
    console.log('📅 Booking type:', bookingType);
    console.log('📍 Location:', location);
    
    // Only perform search if we have both booking type and location
    if (bookingType && location && !hasPerformedSearch) {
      performSearch();
    }
  }, [selectedProviderType, location, bookingType]);

  useEffect(() => {
    console.log('Selected ...', selected);
    setSelectedProviderType(selected || '');

    if (selected && !hasPerformedSearch) {
      fetchServiceProvidersByRole(selected);
    }
  }, [selected]);

  const fetchServiceProvidersByRole = async (role: string) => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching service providers by role: ${role.toUpperCase()}`);
      
      const response = await axiosInstance.get(
        'api/serviceproviders/role?role=' + role.toUpperCase()
      );
      
      console.log(`✅ Fetched ${response?.data?.length || 0} service providers by role`);
      console.log('📋 Service providers data structure:', {
        isArray: Array.isArray(response?.data),
        length: response?.data?.length,
        firstItem: response?.data?.[0]
      });
      
      setServiceProvidersData(response?.data);
      dispatch(add(response?.data));
    } catch (err: any) {
      console.error('❌ Error fetching service providers by role:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
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
    console.log('📥 Handle search results:', {
      dataLength: data?.length,
      dataStructure: Array.isArray(data) ? 'Array' : typeof data,
      firstItem: data?.[0]
    });
    setSearchResults(data);
    toggleDrawer(false);
  };

  // FIXED: Use useCallback to prevent unnecessary re-renders
  const handleSelectedProvider = useCallback((provider: any) => {
    console.log('👤 Handle selected provider:', {
      providerId: provider.serviceproviderId || provider.id,
      name: `${provider.firstname} ${provider.lastname}`,
      role: provider.housekeepingrole,
      dataStructure: Object.keys(provider)
    });
    
    if (selectedProvider) {
      selectedProvider(provider);
    }
    
    // No navigation here - only store data
  }, [selectedProvider]);

  const handleSearch = (formData: { serviceType: string; startTime: string; endTime: string }) => {
    console.log('🔍 Search data received:', formData);
    setSearchData(formData);
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const logProviderDetails = (providers: any[], source: string) => {
    console.log(`\n📊 =========== PROVIDER DETAILS FROM ${source} ===========`);
    console.log(`📦 Total providers: ${providers.length}`);
    
    providers.forEach((provider, index) => {
      console.log(`\n👤 Provider ${index + 1}:`);
      console.log('   ID:', provider.serviceproviderId || provider.id);
      console.log('   Name:', `${provider.firstname} ${provider.lastname}`);
      console.log('   Role:', provider.housekeepingrole);
      console.log('   Rating:', provider.rating);
      console.log('   Experience:', provider.experience, 'years');
      console.log('   Distance:', provider.distance_km, 'km');
      console.log('   Locality:', provider.locality);
      console.log('   Gender:', provider.gender);
      console.log('   Diet:', provider.diet);
      console.log('   Languages:', provider.languageknown);
      console.log('   Available Time Slots:', provider.availableTimeSlots);
      console.log('   Monthly Availability:', provider.monthlyAvailability);
      console.log('   Other Services:', provider.otherServices);
      console.log('   Best Match:', provider.bestMatch);
      
      // Log all available properties
      const extraProps = Object.keys(provider).filter(key => 
        !['serviceproviderId', 'id', 'firstname', 'lastname', 'housekeepingrole', 'rating', 
          'experience', 'distance_km', 'locality', 'gender', 'diet', 'languageknown', 
          'availableTimeSlots', 'monthlyAvailability', 'otherServices', 'bestMatch'].includes(key)
      );
      
      if (extraProps.length > 0) {
        console.log('   Additional Properties:', extraProps);
      }
    });
    
    console.log(`=========== END PROVIDER DETAILS FROM ${source} ===========\n`);
  };

  const performSearch = async () => {
    try {
      console.log('\n🚀 =========== STARTING NEW SEARCH ===========');
      setLoading(true);
      setHasPerformedSearch(true);

      console.log('📋 Booking Type:', bookingType);
      console.log('📍 Location object:', location);

      let latitude = 0;
      let longitude = 0;

      if (location?.geometry?.location) {
        latitude = location?.geometry?.location?.lat;
        longitude = location?.geometry?.location?.lng;
      } else if (location?.lat && location?.lng) {
        latitude = location?.lat;
        longitude = location?.lng;
      }

      console.log('📌 Extracted coordinates:', { latitude, longitude });

      const startDate = formatDateOnly(bookingType?.startDate) || '2025-04-01';
      const endDate = formatDateOnly(bookingType?.endDate) || '2025-04-30';
      const timeslot = bookingType?.timeRange || '16:37-16:37';
      const housekeepingRole = bookingType?.housekeepingRole || 'COOK';

      console.log('🔍 Search Parameters:', {
        startDate,
        endDate,
        timeslot,
        housekeepingRole,
        latitude,
        longitude
      });

      if (latitude === 0 && longitude === 0) {
        console.warn('⚠️ No valid coordinates found');
        Alert.alert('Location Required', 'Please enable location services to find providers near you');
        setServiceProviderData([]);
        setLoading(false);
        return;
      }

      try {
        const queryParams = new URLSearchParams({
          startDate: startDate,
          endDate: endDate,
          timeslot: timeslot,
          housekeepingRole: housekeepingRole,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        });

        console.log('🌐 API Request:', `/api/serviceproviders/search?${queryParams.toString()}`);

        const response = await axiosInstance.get(
          `/api/serviceproviders/search?${queryParams.toString()}`
        );

        console.log('✅ API Response received');
        console.log('📦 Raw response data:', response.data);

        if (response.data && Array.isArray(response.data)) {
          console.log(`🎉 Found ${response.data.length} providers directly in array`);
          logProviderDetails(response.data, 'DIRECT ARRAY RESPONSE');
          setServiceProviderData(response.data);
        } else if (response.data && response.data.providers) {
          const providers = response.data.providers;
          if (Array.isArray(providers) && providers.length > 0) {
            console.log(`🎉 Found ${providers.length} providers in providers object`);
            logProviderDetails(providers, 'PROVIDERS OBJECT RESPONSE');
            setServiceProviderData(providers);
          } else {
            console.log('❌ No providers found in providers array');
            setServiceProviderData([]);
          }
        } else {
          console.log('❌ Unexpected response format');
          console.log('Response structure:', {
            isArray: Array.isArray(response.data),
            hasProviders: !!response.data?.providers,
            keys: Object.keys(response.data || {})
          });
          setServiceProviderData([]);
        }
      } catch (apiError: any) {
        console.error('❌ API Error:', apiError.message);
        console.log('💡 Error details:', apiError.response?.data);
        
        await performAlternativeSearch(startDate, endDate, housekeepingRole, latitude, longitude);
      }
    } catch (error: any) {
      console.error('❌ Search failed:', {
        message: error.message,
        stack: error.stack
      });
      Alert.alert('Error', 'Failed to search for providers');
      setServiceProviderData([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      console.log('🏁 Search completed');
    }
  };

  const performAlternativeSearch = async (
    startDate: string, 
    endDate: string, 
    housekeepingRole: string, 
    latitude: number, 
    longitude: number
  ) => {
    try {
      console.log('\n🔄 =========== TRYING ALTERNATIVE SEARCH ===========');
      
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

      console.log('✅ Alternative API Response structure:', {
        hasData: !!response.data,
        hasProviders: !!response.data?.providers,
        providersCount: response.data?.providers?.length || 0
      });

      if (response.data && response.data.providers) {
        const providers = response.data.providers;
        if (Array.isArray(providers) && providers.length > 0) {
          console.log(`🎉 Found ${providers.length} providers via alternative search`);
          logProviderDetails(providers, 'ALTERNATIVE SEARCH');
          setServiceProviderData(providers);
        } else {
          console.log('❌ No providers found via alternative search');
          setServiceProviderData([]);
        }
      } else {
        console.log('❌ No providers data in alternative response');
        console.log('Response data:', response.data);
        setServiceProviderData([]);
      }
    } catch (error: any) {
      console.error('❌ Alternative search failed:', {
        message: error.message,
        response: error.response?.data
      });
      setServiceProviderData([]);
    }
  };

  // FIXED: Use useCallback to prevent unnecessary re-renders
  const handleProviderSelection = useCallback((provider: any) => {
    console.log('\n🎯 =========== PROVIDER SELECTED ===========');
    console.log('Provider selected from ProviderDetails:', {
      id: provider.serviceproviderId || provider.id,
      name: `${provider.firstname} ${provider.lastname}`,
      role: provider.housekeepingrole,
      morningSelection: provider.morningSelectionTime,
      eveningSelection: provider.eveningSelectionTime,
      selectedMorningTime: provider.selectedMorningTime,
      selectedEveningTime: provider.selectedEveningTime,
      fullData: provider
    });
    
    const bookingData = {
      serviceproviderId: provider.serviceproviderId || provider.id,
      eveningSelection: provider.eveningSelectionTime,
      morningSelection: provider.morningSelectionTime,
      ...bookingType
    };
    
    console.log('📋 Booking data prepared:', bookingData);
    
    if (selectedProvider) {
      selectedProvider(provider);
    }
    
    // No navigation here - only store data
    // Navigation will happen from service dialog after confirmation
  }, [bookingType, selectedProvider]);

  // FIXED: Use useCallback for ProviderDetails component to prevent re-renders
  const renderProviderDetails = useCallback((provider: any, index: number) => {
    return (
      <View key={`provider-${index}-${provider.serviceproviderId || provider.id}`} style={styles.providerContainer}>
        <ProviderDetails 
          {...provider} 
          selectedProvider={handleProviderSelection}
          sendDataToParent={sendDataToParent}
          housekeepingRole={provider.housekeepingRole || bookingType?.housekeepingRole}
        />
      </View>
    );
  }, [handleProviderSelection, sendDataToParent, bookingType]);

  // Log whenever serviceProviderData changes
  useEffect(() => {
    if (serviceProviderData.length > 0) {
      console.log('\n📈 ServiceProviderData updated:', {
        count: serviceProviderData.length,
        providers: serviceProviderData.map(p => ({
          id: p.serviceproviderId || p.id,
          name: `${p.firstname} ${p.lastname}`,
          role: p.housekeepingrole
        }))
      });
    }
  }, [serviceProviderData]);

  console.log('📊 Current state:', {
    serviceProviderDataLength: serviceProviderData?.length || 0,
    loading,
    selectedProviderType,
    hasPerformedSearch,
    isInitialLoad
  });

  const renderContent = () => {
    console.log('🎨 Rendering content...');
    console.log('📊 Service provider data:', {
      length: serviceProviderData?.length || 0,
      isArray: Array.isArray(serviceProviderData),
      isEmpty: serviceProviderData?.length === 0
    });
    console.log('⏳ Loading state:', loading);

    if (loading && isInitialLoad) {
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
      console.log('✅ Rendering providers list');
      return (
        <>
          <Text style={styles.resultsCount}>
            Found {serviceProviderData.length} provider{serviceProviderData.length !== 1 ? 's' : ''} near you
          </Text>
          {serviceProviderData.map((provider, index) => renderProviderDetails(provider, index))}
        </>
      );
    } else if (!loading && hasPerformedSearch) {
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
    } else {
      // Initial state - no search performed yet
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.initialStateText}>
            Select booking details to find providers
          </Text>
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
  initialStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DetailsView;